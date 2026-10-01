import { createHash, randomUUID } from "node:crypto";
import { performance } from "node:perf_hooks";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const MAX_TOTAL = 1000;
const MAX_CONCURRENCY = 300;
const TIMEOUT_MS = 15_000;
const MAX_RESPONSE_BYTES = 64 * 1024;

export function readConfig(args = process.argv.slice(2), env = process.env) {
  const options = {};
  for (let index = 0; index < args.length; index++) {
    const match = /^(--total|--concurrency)(?:=(.*))?$/.exec(args[index]);
    if (!match || match[1] in options) throw new Error("Use --total N and --concurrency N, each at most once.");
    const [, key, inline] = match;
    options[key] = inline ?? args[++index];
  }
  const integer = (value, max, name) => {
    if (typeof value !== "string" || !/^[1-9]\d*$/.test(value) || !Number.isSafeInteger(Number(value)) || Number(value) > max) {
      throw new Error(`${name} must be an integer from 1 to ${max}.`);
    }
    return Number(value);
  };
  const total = integer(options["--total"] ?? env.TOTAL ?? "20", MAX_TOTAL, "TOTAL");
  const concurrency = integer(options["--concurrency"] ?? env.CONCURRENCY ?? "5", MAX_CONCURRENCY, "CONCURRENCY");
  let url;
  try { url = new URL(env.LOAD_TEST_URL); } catch { throw new Error("Set LOAD_TEST_URL to the full /api/register URL."); }
  const loopback = ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
  if ((url.protocol !== "https:" && !(url.protocol === "http:" && loopback)) ||
      url.username || url.password || url.search || url.hash || url.pathname !== "/api/register") {
    throw new Error("LOAD_TEST_URL must use HTTPS (HTTP only on loopback), end in /api/register, and contain no credentials, query or fragment.");
  }
  return { url: url.href, total, concurrency };
}

export function createRegistration(runId, sequence, usedPhones) {
  const number = String(sequence).padStart(3, "0");
  let phone;
  let salt = 0;
  do {
    const hash = createHash("sha256").update(`${runId}:${sequence}:${salt++}`).digest("hex");
    phone = `+355${(BigInt(`0x${hash}`) % 1_000_000_000_000n).toString().padStart(12, "0")}`;
  } while (usedPhones.has(phone));
  usedPhones.add(phone);
  return {
    firstName: "Load",
    lastName: `Test ${number}`,
    phone,
    email: `loadtest-${runId}-${number}@example.com`,
    school: "__RRE_LOAD_TEST__",
    classYear: "Test",
    board: "Test",
    hobbies: "Load testing",
    motivation: "Synthetic registration used only for application load testing.",
  };
}

async function consumeResponse(response) {
  // Consume the body within the timeout so workers include connection/body time.
  // Never print the response body or accumulate an unbounded server response.
  if (!response.body) return;
  const reader = response.body.getReader();
  let bytes = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > MAX_RESPONSE_BYTES) {
        await reader.cancel();
        throw new Error("Response exceeds safety limit");
      }
    }
  } finally { reader.releaseLock(); }
}

export async function runLoadTest(config, { fetchImpl = fetch, signal } = {}) {
  // Validate again for callers importing this module; importing never starts a run.
  config = readConfig([], { LOAD_TEST_URL: config.url, TOTAL: String(config.total), CONCURRENCY: String(config.concurrency) });
  const runId = `${new Date().toISOString().replace(/[-:.]/g, "")}-${randomUUID()}`;
  const usedPhones = new Set();
  const times = [];
  const counts = { success201: 0, duplicate409: 0, other4xx: 0, server5xx: 0, otherHttp: 0, networkErrors: 0, timeouts: 0 };
  let started = 0;
  const start = performance.now();
  async function worker() {
    while (started < config.total && !signal?.aborted) {
      const sequence = ++started;
      const body = JSON.stringify(createRegistration(runId, sequence, usedPhones));
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
      const requestStart = performance.now();
      try {
        const response = await fetchImpl(config.url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body,
          signal: signal ? AbortSignal.any([signal, controller.signal]) : controller.signal,
          redirect: "manual",
        });
        await consumeResponse(response);
        if (response.status === 201) counts.success201++;
        else if (response.status === 409) counts.duplicate409++;
        else if (response.status >= 400 && response.status < 500) counts.other4xx++;
        else if (response.status >= 500) counts.server5xx++;
        else counts.otherHttp++;
      } catch {
        counts.networkErrors++;
        if (controller.signal.aborted) counts.timeouts++;
      } finally {
        clearTimeout(timer);
        times.push(performance.now() - requestStart);
      }
    }
  }
  // Only the fixed number of workers exists, not one promise per registration.
  await Promise.all(Array.from({ length: Math.min(config.concurrency, config.total) }, () => worker()));
  times.sort((a, b) => a - b);
  const percentile = (fraction) => times.length ? times[Math.ceil(times.length * fraction) - 1] : null;
  return {
    runId, configuredTotal: config.total, started, completed: times.length,
    notStarted: config.total - started, interrupted: Boolean(signal?.aborted), ...counts,
    durationMs: performance.now() - start,
    minMs: times[0] ?? null, maxMs: times.at(-1) ?? null,
    averageMs: times.length ? times.reduce((sum, value) => sum + value, 0) / times.length : null,
    p50Ms: percentile(0.5), p95Ms: percentile(0.95),
  };
}

async function main() {
  if (process.argv.includes("--help")) {
    console.log("Manual use only: set LOAD_TEST_URL, then node scripts/load-registration.mjs [--total N] [--concurrency N]\nDefaults: TOTAL=20 CONCURRENCY=5. Limits: TOTAL<=1000 CONCURRENCY<=300. Timeout: 15 seconds. No retries or cleanup. See docs/load-registration.md.");
    return;
  }
  const config = readConfig();
  console.log(`Manual load test: ${config.total} requests, at most ${Math.min(config.total, config.concurrency)} in flight. Successful requests create database rows. No retries.`);
  const stop = new AbortController();
  const interrupt = () => stop.abort();
  process.on("SIGINT", interrupt);
  process.on("SIGTERM", interrupt);
  let result;
  try { result = await runLoadTest(config, { signal: stop.signal }); }
  finally { process.off("SIGINT", interrupt); process.off("SIGTERM", interrupt); }
  const ms = (value) => value === null ? "n/a" : `${value.toFixed(1)} ms`;
  console.log([
    `Run ID: ${result.runId}`,
    `Total: ${result.completed} (configured ${result.configuredTotal}; not started ${result.notStarted})`,
    `201 Success: ${result.success201}`,
    `409 Duplicate: ${result.duplicate409}`,
    `4xx Other: ${result.other4xx}`,
    `5xx: ${result.server5xx}`,
    `Other HTTP (including unfollowed redirects): ${result.otherHttp}`,
    `Network/body errors: ${result.networkErrors} (timeouts: ${result.timeouts})`,
    `Min: ${ms(result.minMs)}`, `Max: ${ms(result.maxMs)}`, `Average: ${ms(result.averageMs)}`,
    `P50: ${ms(result.p50Ms)}`, `P95: ${ms(result.p95Ms)}`, `Elapsed: ${ms(result.durationMs)}`,
    `Interrupted: ${result.interrupted ? "yes" : "no"}`,
    "Marker: school = '__RRE_LOAD_TEST__'. Inspect before manual cleanup; timeouts may still have inserted rows.",
  ].join("\n"));
  process.exitCode = result.interrupted ? 130 : result.success201 === config.total ? 0 : 1;
}

// No package lifecycle integration; only a direct manual invocation runs main.
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch(() => {
    console.error("Load test configuration/execution failed. Check LOAD_TEST_URL, --total (1–1000), and --concurrency (1–300). No credentials or raw errors are printed. Use --help.");
    process.exitCode = 1;
  });
}
