// Local-only integration fixture. Does not load .env.local or contact Supabase.
// Run after npm run build; opens the app on 3015 and fake Auth/data on 4015.
// All identities, tokens, credentials and records below are synthetic fixtures.
import http from "node:http";
import { spawn } from "node:child_process";

const adminId = "00000000-0000-4000-8000-000000000001";
const otherId = "00000000-0000-4000-8000-000000000002";
const sessions = new Map();
const refreshes = new Map();
let serial = 0;
const metrics = { reads: 0, refreshes: 0, logouts: 0 };
const records = Array.from({ length: 55 }, (_, i) => ({
  id: `00000000-0000-4000-8000-${String(i + 10).padStart(12, "0")}`,
  first_name: i === 0 ? "Era" : `Student ${i + 1}`, last_name: "Test",
  phone: `+35569${String(i).padStart(7, "0")}`, email: `student${i + 1}@example.test`,
  school: i === 0 ? "Test School Alpha" : "Test School Beta", class_year: "12", board: "Test board",
  hobbies: "Reading", motivation: "Synthetic student text only. No real data.",
  created_at: new Date(Date.UTC(2026, 8, 30, 12, 0, -i)).toISOString(),
}));
function session(id, short = false) {
  const now = Math.floor(Date.now() / 1000);
  const expires = short ? 30 : 3600;
  const encode = (value) => Buffer.from(JSON.stringify(value)).toString("base64url");
  const token = `${encode({ alg: "HS256", typ: "JWT" })}.${encode({ sub: id, exp: now + expires, iat: now, aud: "authenticated", role: "authenticated", session_id: String(++serial) })}.synthetic-signature`;
  const refresh = `synthetic-refresh-${serial}`;
  sessions.set(token, id); refreshes.set(refresh, id);
  return { access_token: token, refresh_token: refresh, token_type: "bearer", expires_in: expires, expires_at: now + expires, user: user(id) };
}
function user(id) { return { id, aud: "authenticated", role: "authenticated", email: "fixture@example.test", email_confirmed_at: "2026-09-01T00:00:00Z", app_metadata: {}, user_metadata: {}, created_at: "2026-09-01T00:00:00Z" }; }
const server = http.createServer(async (request, response) => {
  const url = new URL(request.url, "http://127.0.0.1:4015");
  const send = (status, body, headers = {}) => { response.writeHead(status, { "content-type": "application/json", "x-supabase-api-version": "2024-01-01", ...headers }); response.end(JSON.stringify(body)); };
  let body = "";
  for await (const chunk of request) { body += chunk; if (body.length > 100_000) { send(413, {}); return; } }
  let data = {};
  try { data = body ? JSON.parse(body) : {}; } catch { send(400, {}); return; }
  const token = request.headers.authorization?.replace(/^Bearer /, "");
  if (url.pathname === "/__fixture/metrics") return send(200, metrics);
  if (url.pathname === "/auth/v1/token" && url.searchParams.get("grant_type") === "password") {
    if (data.password !== "synthetic-password" || !["admin@example.test", "other@example.test"].includes(data.email)) return send(400, { code: "invalid_credentials", msg: "Invalid login credentials" });
    // A short first session deliberately exercises proxy refresh on redirect.
    return send(200, session(data.email === "admin@example.test" ? adminId : otherId, true));
  }
  if (url.pathname === "/auth/v1/token" && url.searchParams.get("grant_type") === "refresh_token") {
    const id = refreshes.get(data.refresh_token);
    if (!id) return send(400, { code: "refresh_token_not_found", msg: "Invalid refresh token" });
    metrics.refreshes++;
    return send(200, session(id));
  }
  if (url.pathname === "/auth/v1/user") return sessions.has(token) ? send(200, user(sessions.get(token))) : send(401, { code: "bad_jwt", msg: "Invalid session" });
  if (url.pathname === "/auth/v1/logout") { metrics.logouts++; sessions.delete(token); return send(200, {}); }
  if (url.pathname === "/rest/v1/registrations") {
    if (request.headers.apikey !== "synthetic-fixture-key") return send(403, {});
    if (!["GET", "HEAD"].includes(request.method)) return send(405, {});
    metrics.reads++;
    // Only simple test query matching; production filter serialization is unit tested.
    const match = url.searchParams.get("or")?.match(/ilike\."%([^%]*)%"/);
    const term = (match?.[1] ?? "").toLowerCase();
    const filtered = records.filter((row) => [row.first_name, row.last_name, row.email, row.phone, row.school].some((value) => value.toLowerCase().includes(term)));
    const offset = Number(url.searchParams.get("offset") || 0);
    const limit = Number(url.searchParams.get("limit") || 50);
    return send(200, request.method === "HEAD" ? null : filtered.slice(offset, offset + limit), { "content-range": `${offset}-${Math.min(offset + limit, filtered.length) - 1}/${filtered.length}` });
  }
  send(404, {});
});
await new Promise((resolve) => server.listen(4015, "127.0.0.1", resolve));
const app = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "--hostname", "127.0.0.1", "--port", "3015"], {
  env: { ...process.env, SUPABASE_URL: "http://127.0.0.1:4015", SUPABASE_SECRET_KEY: "synthetic-fixture-key", SUPABASE_ADMIN_USER_IDS: adminId, RRE_REGISTRATION_MODE: process.env.RRE_REGISTRATION_MODE ?? "false" },
  stdio: "ignore",
});
app.on("error", () => { console.error("FIXTURE_APP_START_FAILED"); server.close(); process.exitCode = 1; });
app.on("exit", () => server.close());
for (const signal of ["SIGINT", "SIGTERM"]) process.on(signal, () => { app.kill(); server.close(); });
console.log("Synthetic admin fixture started. App: http://localhost:3015/admin/login. No real Supabase access.");
