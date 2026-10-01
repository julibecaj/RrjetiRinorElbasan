// Requires scripts/admin-test-server.mjs. Fixed loopback addresses and synthetic
// credentials only. Never loads .env.local or contacts a real Supabase project.
import assert from "node:assert/strict";
import { createServerClient } from "@supabase/ssr";
import ExcelJS from "exceljs";

const app = "http://127.0.0.1:3015/admin/registrations/export";
const fixture = "http://127.0.0.1:4015";
const fetchLocal = (url, options = {}) => fetch(url, { ...options, signal: AbortSignal.timeout(10_000) });
async function cookieFor(email) {
  const jar = new Map();
  const client = createServerClient(fixture, "synthetic-fixture-key", {
    cookieOptions: { name: "rre-admin-auth", path: "/admin" },
    cookies: {
      getAll: () => [...jar].map(([name, value]) => ({ name, value })),
      setAll: (updates) => updates.forEach(({ name, value }) => jar.set(name, value)),
    },
    global: { fetch: fetchLocal },
  });
  const result = await client.auth.signInWithPassword({ email, password: "synthetic-password" });
  assert.equal(result.error, null, "Synthetic fixture login must succeed");
  return [...jar].map(([name, value]) => `${name}=${value}`).join("; ");
}

const before = await (await fetchLocal(`${fixture}/__fixture/metrics`)).json();
assert.equal((await fetchLocal(app)).status, 401);
assert.equal((await fetchLocal(app, { headers: { cookie: await cookieFor("other@example.test") } })).status, 401);
const after = await (await fetchLocal(`${fixture}/__fixture/metrics`)).json();
assert.equal(after.reads, before.reads, "Unauthorized HTTP exports must not read registrations");
const cookie = await cookieFor("admin@example.test");
const response = await fetchLocal(`${app}?q=missing&page=99`, { headers: { cookie } });
assert.equal(response.status, 200);
assert.match(response.headers.get("content-type"), /spreadsheetml.sheet/);
assert.match(response.headers.get("content-disposition"), /attachment; filename="Keshilli-Rinor-Elbasan-Regjistrime-\d{4}-\d{2}-\d{2}\.xlsx"/);
assert.match(response.headers.get("cache-control"), /no-store/);
const workbook = new ExcelJS.Workbook();
await workbook.xlsx.load(Buffer.from(await response.arrayBuffer()));
const sheet = workbook.worksheets[0];
assert.equal(sheet.rowCount, 56, "HTTP export includes all 55 fixture records regardless of search/page");
assert.equal(sheet.columnCount, 10);
assert.equal(sheet.getCell("A2").value, "Era");
assert.equal(sheet.getCell("A56").value, "Student 55");
assert.equal(sheet.getCell("C2").value, "'+355690000000");
console.log("PASS: real Next HTTP route and Supabase SDK against loopback fixture: unauthenticated/non-admin 401 with zero reads; allowed admin 200; parsed XLSX has all 55 synthetic records, newest-first, correct headers and escaped phone. No real data accessed.");
