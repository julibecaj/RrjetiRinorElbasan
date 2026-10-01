import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import ts from "typescript";
import { createClient } from "@supabase/supabase-js";

// Never load .env.local. The SDK receives only synthetic configuration and a
// mocked HTTP transport: this suite cannot insert/read/delete production rows.
const testEnv = { SUPABASE_URL: "https://registration-test.invalid", SUPABASE_SECRET_KEY: "synthetic-test-key" };
let clientCalls = 0;
let outcome = "success";
let requests = [];
let releaseInsert;
const errorDetail = "SENSITIVE_DATABASE_DETAIL_TEST_SENTINEL";
async function databaseFetch(url, options) {
  requests.push({ url: new URL(url), options, body: JSON.parse(options.body) });
  if (outcome === "pending") await new Promise((resolve) => { releaseInsert = resolve; });
  if (outcome === "throw") throw new Error(errorDetail);
  if (outcome === "abort") throw new DOMException(errorDetail, "AbortError");
  if (outcome === "error") return Response.json({ code: "23502", message: errorDetail, details: errorDetail, hint: errorDetail }, { status: 400 });
  if (outcome === "duplicate-email" || outcome === "duplicate-phone") {
    const column = outcome === "duplicate-email" ? "email" : "phone";
    return Response.json({
      code: "23505",
      message: `duplicate key value violates unique constraint registrations_${column}_unique`,
      details: `Key (${column})=(${JSON.parse(options.body)[column]}) already exists.`,
      hint: errorDetail,
    }, { status: 409 });
  }
  if (outcome === "missing-row") return Response.json(null);
  if (outcome === "missing-id") return Response.json({});
  return Response.json({ id: "00000000-0000-4000-8000-000000000001" }, { status: 201 });
}
const sdk = {
  createClient(url, key, options) {
    clientCalls++;
    assert.equal(url, testEnv.SUPABASE_URL);
    assert.equal(key, testEnv.SUPABASE_SECRET_KEY);
    assert.deepEqual(options, { db: { schema: "public" }, auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } });
    if (outcome === "client-throw") throw new Error(errorDetail);
    return createClient(url, key, { ...options, global: { fetch: databaseFetch } });
  },
};
function load(file) {
  const loadedModule = { exports: {} };
  const code = ts.transpileModule(fs.readFileSync(file, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  new Function("require", "module", "exports", "process", code)((name) => {
    if (name === "server-only") return {};
    if (name === "@supabase/supabase-js") return sdk;
    assert.ok(name.startsWith("@/"));
    return load(path.join("src", `${name.slice(2)}.ts`));
  }, loadedModule, loadedModule.exports, { env: testEnv });
  return loadedModule.exports;
}
const { validateRegistration, registrationFields } = load("src/lib/registration.ts");
const { POST } = load("src/app/api/register/route.ts");
const valid = { firstName: "Ëra", lastName: "Test", phone: "+355 69 123 4567", email: "era@example.com", school: "Shkollë test", classYear: "12", board: "Bord test", hobbies: "Lexim", motivation: "Dua të kontribuoj në komunitet." };
const normalized = { ...valid, phone: "+355691234567" };
assert.equal(validateRegistration(valid).valid, true);
for (const field of registrationFields) {
  for (const value of [undefined, null, 42, {}, [], "", "   ", "x".repeat(field.maxLength + 1)]) {
    const result = validateRegistration({ ...valid, [field.name]: value });
    assert.equal(result.valid, false, `${field.name}: ${String(value).slice(0, 20)}`);
    assert.ok(result.errors[field.name]);
  }
}
for (const email of ["a", "a@b", "a@@b.com", "a b@c.com", "a@b..com"]) assert.equal(validateRegistration({ ...valid, email }).valid, false);
for (const phone of ["123456", "1".repeat(16), "+355abc1234567", "123+456789", "-------"]) assert.equal(validateRegistration({ ...valid, phone }).valid, false);
const trimmed = validateRegistration(Object.fromEntries(Object.entries(valid).map(([key, value]) => [key, `  ${value}  `])));
assert.deepEqual(trimmed.data, normalized);
assert.equal(validateRegistration({ ...valid, email: "  ERA@Example.COM  " }).data.email, "era@example.com");
for (const phone of ["+355 69 123 4567", "+355-69-123-4567", "+355691234567", "  +355 (69) 123-4567  "]) {
  assert.equal(validateRegistration({ ...valid, phone }).data.phone, "+355691234567");
}
for (const [phone, expected] of [["069 123-4567", "0691234567"], ["00355 (69) 123-4567", "00355691234567"]]) {
  assert.equal(validateRegistration({ ...valid, phone }).data.phone, expected, "Never infer a country code or replace 00 with +");
}
assert.deepEqual(validateRegistration(normalized).data, normalized, "Normalization is idempotent");
for (const phone of ["+355abc691234567", "++355691234567", "355+691234567", "+355\t691234567", "+355/691234567"]) {
  assert.equal(validateRegistration({ ...valid, phone }).valid, false, "Normalization must not conceal invalid phone input");
}
assert.equal(validateRegistration(null).valid, false);
assert.equal(validateRegistration([]).valid, false);
assert.deepEqual(validateRegistration({ ...valid, admin: true }).data, normalized);

async function check(body, status, headers = { "Content-Type": "application/json" }) {
  const response = await POST(new Request("http://localhost/api/register", { method: "POST", headers, body }));
  assert.equal(response.status, status);
  assert.equal(response.headers.get("cache-control"), "no-store");
  const result = await response.json();
  assert.equal(result.success, status === 201);
  return result;
}
assert.equal(Object.keys((await check("{}", 422)).errors).length, 9);
await check("{broken", 400);
await check("null", 422);
await check(JSON.stringify(valid), 415, { "Content-Type": "text/plain" });
await check(JSON.stringify(valid), 403, { "Content-Type": "application/json", "Sec-Fetch-Site": "cross-site" });
await check("x".repeat(24001), 413);
assert.equal(clientCalls, 0, "Rejected requests must never initialize Supabase");
assert.equal(requests.length, 0);

const payload = Object.fromEntries(Object.entries(valid).map(([key, value]) => [key, `  ${value}  `]));
payload.email = "  ERA@Example.COM  ";
const success = await check(JSON.stringify({ ...payload, id: "ignored", created_at: "ignored", admin: true }), 201);
assert.deepEqual(success, { success: true, saved: true });
assert.equal(requests.length, 1);
const request = requests[0];
assert.equal(request.url.origin, "https://registration-test.invalid");
assert.equal(request.url.pathname, "/rest/v1/registrations");
assert.equal(request.url.searchParams.get("select"), "id");
assert.equal(request.options.method, "POST");
assert.equal(new Headers(request.options.headers).get("content-profile"), "public");
assert.match(new Headers(request.options.headers).get("prefer"), /return=representation/);
assert.ok(request.options.signal instanceof AbortSignal);
assert.deepEqual(request.body, {
  first_name: valid.firstName, last_name: valid.lastName, phone: normalized.phone,
  email: valid.email, school: valid.school, class_year: valid.classYear,
  board: valid.board, hobbies: valid.hobbies, motivation: valid.motivation,
});

outcome = "pending";
let finished = false;
const pending = check(JSON.stringify(valid), 201).then(() => { finished = true; });
await new Promise((resolve) => setImmediate(resolve));
assert.equal(typeof releaseInsert, "function");
assert.equal(finished, false, "Do not return success before the database responds");
releaseInsert();
await pending;

const originalError = console.error;
const logs = [];
console.error = (...args) => logs.push(args);
try {
  for (const mode of ["duplicate-email", "duplicate-phone"]) {
    outcome = mode;
    const before = requests.length;
    const conflict = await check(JSON.stringify(payload), 409);
    assert.deepEqual(conflict, {
      success: false, saved: false, code: "DUPLICATE_REGISTRATION",
      message: "Ky email ose numër telefoni është regjistruar më parë.",
    });
    assert.equal(requests.length, before + 1, "One insert, no preflight lookup or retry");
    assert.equal(requests.at(-1).body.email, normalized.email);
    assert.equal(requests.at(-1).body.phone, normalized.phone);
    assert.deepEqual(logs.at(-1), ["REGISTRATION_DUPLICATE"]);
  }
  for (const mode of ["error", "throw", "abort", "missing-row", "missing-id", "client-throw"]) {
    outcome = mode;
    const failure = await check(JSON.stringify(valid), 503);
    assert.deepEqual(failure, { success: false, message: "Regjistrimi nuk u konfirmua. Provo përsëri më vonë." });
  }
  const { createSupabaseServerClient } = load("src/lib/supabase/server.ts");
  for (const key of ["SUPABASE_URL", "SUPABASE_SECRET_KEY"]) {
    const previous = testEnv[key];
    const before = clientCalls;
    try {
      for (const value of [undefined, "", "   "]) {
        testEnv[key] = value;
        assert.throws(createSupabaseServerClient, /requires SUPABASE_URL and SUPABASE_SECRET_KEY/);
        await check(JSON.stringify(valid), 503);
      }
      assert.equal(clientCalls, before, "Missing config must fail before SDK initialization");
    } finally { testEnv[key] = previous; }
  }
} finally { console.error = originalError; }
assert.ok(logs.length > 0);
for (const entry of logs) {
  assert.equal(entry.length, 1);
  assert.ok(["REGISTRATION_DUPLICATE", "REGISTRATION_INSERT_UNCONFIRMED", "REGISTRATION_STORAGE_CONFIGURATION_MISSING", "REGISTRATION_STORAGE_UNAVAILABLE"].includes(entry[0]));
}
requests = [];
console.log("PASS: email/phone normalization and validation; API safeguards; exact normalized insert; awaited confirmed 201; duplicate email/phone 23505 -> safe 409; generic 503 failures; fixed-only logs. Real SDK with mocked HTTP; no real database accessed.");
