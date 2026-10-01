import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import ts from "typescript";

// Application control-flow tests only. Never load .env.local or contact Supabase.
const require = createRequire(import.meta.url);
const adminId = "00000000-0000-4000-8000-000000000001";
const otherId = "00000000-0000-4000-8000-000000000002";
const env = { SUPABASE_URL: "https://admin-test.invalid", SUPABASE_SECRET_KEY: "synthetic-key", SUPABASE_ADMIN_USER_IDS: adminId, NODE_ENV: "production" };
const jar = new Map();
const cookieWrites = [];
const invalidations = [];
const queries = [];
const logs = [];
let mode = "valid";
let identity = adminId;
let verifyCalls = 0;
let signInCalls = 0;
let dataClients = 0;
let exportRows = null;
let exportScenario = "";
const row = { id: "synthetic-row", first_name: "Test", last_name: "Student", phone: "+355690000000", email: "student@example.com", school: "Test school", class_year: "12", board: "Test board", hobbies: "Reading", motivation: "Synthetic test", created_at: "2026-09-30T12:00:00Z" };
class Redirect extends Error { constructor(url) { super("redirect"); this.url = url; } }
const cookieStore = {
  getAll: () => [...jar].map(([name, value]) => ({ name, value })),
  set(name, value, options) {
    cookieWrites.push({ name, options });
    if (options?.maxAge === 0) jar.delete(name); else jar.set(name, value);
  },
};
const mocks = {
  "server-only": {},
  "next/headers": { cookies: async () => cookieStore },
  "next/navigation": { redirect: (url) => { throw new Redirect(url); } },
  "next/cache": { revalidatePath: (...args) => invalidations.push(args) },
  "next/link": { __esModule: true, default: () => null },
  "@supabase/ssr": {
    createServerClient(url, key, options) {
      assert.equal(url, env.SUPABASE_URL);
      assert.equal(key, env.SUPABASE_SECRET_KEY);
      assert.deepEqual(options.cookieOptions, { name: "rre-admin-auth", httpOnly: true, sameSite: "lax", secure: true, path: "/admin" });
      const write = async (value) => options.cookies.setAll([{ name: "rre-admin-auth", value, options: value ? {} : { maxAge: 0 } }], { "cache-control": "private, no-store" });
      return { auth: {
        async getUser() {
          verifyCalls++;
          if (mode === "auth-outage") throw new Error("PRIVATE_AUTH_DETAIL");
          const found = (await options.cookies.getAll()).find(({ name }) => name === "rre-admin-auth");
          return found?.value === "verified-session" && mode !== "revoked"
            ? { data: { user: { id: identity } }, error: null }
            : { data: { user: null }, error: { message: "PRIVATE_AUTH_DETAIL" } };
        },
        async signInWithPassword(credentials) {
          signInCalls++;
          assert.equal(credentials.email, "admin@example.com");
          assert.equal(credentials.password, "synthetic-password");
          if (mode === "auth-outage") throw new Error("PRIVATE_AUTH_DETAIL");
          if (mode === "invalid") return { data: { user: null, session: null }, error: { code: "invalid_credentials", message: "PRIVATE_AUTH_DETAIL" } };
          await write("verified-session");
          return { data: { user: { id: identity }, session: {} }, error: null };
        },
        async signOut(options) {
          assert.deepEqual(options, { scope: "local" });
          if (mode === "logout-outage") throw new Error("PRIVATE_AUTH_DETAIL");
          await write("");
          return { error: null };
        },
      } };
    },
  },
  "@supabase/supabase-js": {
    createClient() {
      dataClients++;
      return { from(table) {
        assert.equal(table, "registrations");
        const operations = [];
        queries.push(operations);
        const builder = {};
        for (const method of ["select", "order", "range", "or", "abortSignal"]) {
          builder[method] = (...args) => { operations.push([method, ...args]); return builder; };
        }
        builder.then = (resolve, reject) => {
          if (mode === "db-error") return Promise.resolve({ data: null, error: { message: "PRIVATE_STUDENT_DETAIL" }, count: null }).then(resolve, reject);
          if (exportRows !== null) {
            const [, from, to] = operations.find(([method]) => method === "range");
            const batch = exportRows.slice(from, Math.min(to + 1, from + 200));
            if (exportScenario === "duplicate" && from > 0) batch[0] = exportRows[0];
            const count = exportScenario === "cap" ? 10_001 : exportRows.length + (exportScenario === "changed" && from > 0 ? 1 : 0);
            return Promise.resolve({ data: exportScenario === "short" && from > 0 ? [] : batch, error: null, count }).then(resolve, reject);
          }
          return Promise.resolve({ data: operations[0][2]?.head ? null : [row], error: null, count: 1 }).then(resolve, reject);
        };
        return builder;
      } };
    },
  },
};
const cache = new Map();
function load(file) {
  const filename = path.resolve(file);
  if (cache.has(filename)) return cache.get(filename).exports;
  const loadedModule = { exports: {} };
  cache.set(filename, loadedModule);
  const code = ts.transpileModule(fs.readFileSync(filename, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX } }).outputText;
  new Function("require", "module", "exports", "process", code)((name) => {
    if (name in mocks) return mocks[name];
    if (name.endsWith(".css")) return { __esModule: true, default: {} };
    if (name.startsWith("react") || name === "exceljs") return require(name);
    const base = name.startsWith("@/") ? path.resolve("src", name.slice(2)) : path.resolve(path.dirname(filename), name);
    const target = [base, `${base}.ts`, `${base}.tsx`].find((candidate) => fs.existsSync(candidate) && fs.statSync(candidate).isFile());
    assert.ok(target, `Unexpected module ${name}`);
    return load(target);
  }, loadedModule, loadedModule.exports, { env });
  return loadedModule.exports;
}
const auth = load("src/lib/admin/auth.ts");
const config = load("src/lib/admin/config.ts");
const actions = load("src/app/admin/login/actions.ts");
const data = load("src/lib/admin/registrations.ts");
const search = load("src/app/admin/registrations/actions.ts");
const page = load("src/app/admin/registrations/page.tsx").default;
const loginPage = load("src/app/admin/login/page.tsx").default;
const form = () => { const value = new FormData(); value.set("email", " ADMIN@Example.COM "); value.set("password", "synthetic-password"); return value; };
async function redirects(fn, url) { await assert.rejects(fn, (error) => error instanceof Redirect && error.url === url); }
const originalError = console.error;
console.error = (...args) => logs.push(args);
try {
  assert.equal(await auth.getAdminIdentity(), null);
  await redirects(() => page(), "/admin/login");
  await redirects(() => data.getAdminRegistrations("student", 1), "/admin/login");
  await redirects(() => search.searchRegistrations({}, new FormData()), "/admin/login");
  assert.equal(dataClients, 0, "Unauthenticated calls must not create a privileged data client");
  jar.set("rre-admin-auth", "forged-session");
  await redirects(() => page(), "/admin/login");
  assert.equal(dataClients, 0, "A cookie alone is not authentication");
  jar.clear();

  mode = "invalid";
  assert.deepEqual(await actions.loginAdmin({ error: "" }, form()), { error: "Email ose fjalëkalim i pasaktë." });
  assert.equal(jar.size, 0);
  mode = "auth-outage";
  assert.deepEqual(await actions.loginAdmin({ error: "" }, form()), { error: "Hyrja nuk u krye. Provo përsëri më vonë." });
  mode = "valid";
  const beforeInvalid = signInCalls;
  await actions.loginAdmin({ error: "" }, new FormData());
  assert.equal(signInCalls, beforeInvalid);

  identity = otherId;
  assert.deepEqual(await actions.loginAdmin({ error: "" }, form()), { error: "Kjo llogari nuk ka leje administrimi." });
  assert.equal(jar.size, 0, "Denied users must not retain cookies");
  jar.set("rre-admin-auth", "verified-session");
  await redirects(() => page(), "/admin/login");
  assert.equal(dataClients, 0, "A valid non-admin session must not read student data");
  jar.clear();
  identity = adminId;

  await redirects(() => actions.loginAdmin({ error: "" }, form()), "/admin/registrations");
  assert.equal(jar.get("rre-admin-auth"), "verified-session");
  assert.deepEqual(await auth.getAdminIdentity(), { id: adminId });
  await redirects(() => loginPage(), "/admin/registrations");
  const view = await page();
  assert.ok(JSON.stringify(view).includes("Synthetic test"));
  assert.ok(verifyCalls > 0, "Identity must be validated with getUser");
  const result = await data.getAdminRegistrations('Example,"()_%\\', 2);
  assert.deepEqual(result.rows[0], { ...row, created_at_display: data.formatRegistrationDate(row.created_at) });
  const expectedDate = (iso) => new Intl.DateTimeFormat("sq-AL", {
    timeZone: "Europe/Tirane", day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  }).format(new Date(iso));
  for (const iso of ["2026-01-15T23:30:00Z", "2026-07-15T23:30:00Z", row.created_at]) {
    assert.equal(data.formatRegistrationDate(iso), expectedDate(iso), "Dates use explicit Albanian locale and Tirana timezone, including winter/summer midnight rollover");
  }
  const React = require("react");
  mocks.react = { ...React, useActionState: (_action, initial) => [initial, () => {}, false], useState: (initial) => [initial, () => {}] };
  // Reload the table with mocked hooks; the page already imported it above.
  cache.delete(path.resolve("src/components/admin/AdminRegistrationsTable.tsx"));
  const { AdminRegistrationsTable } = load("src/components/admin/AdminRegistrationsTable.tsx");
  const originalFormatter = Intl.DateTimeFormat;
  try {
    Intl.DateTimeFormat = function () { throw new Error("Client must not reformat server dates"); };
    const html = require("react-dom/server").renderToStaticMarkup(React.createElement(AdminRegistrationsTable, { initial: result }));
    assert.ok(html.includes(`<time dateTime="${row.created_at}">${result.rows[0].created_at_display}</time>`), "The table preserves the original ISO and serialized display text without client formatting");
  } finally { Intl.DateTimeFormat = originalFormatter; }
  assert.equal(result.total, 1);
  assert.equal(result.pageSize, 50);
  const operations = queries.at(-2);
  assert.deepEqual(operations.find(([name]) => name === "range"), ["range", 50, 99]);
  assert.deepEqual(operations.filter(([name]) => name === "order"), [["order", "created_at", { ascending: false }], ["order", "id", { ascending: false }]]);
  assert.equal(operations.find(([name]) => name === "or")[1], data.registrationSearchFilter('Example,"()_%\\'));
  assert.equal(data.registrationSearchFilter("Era"), 'first_name.ilike."%Era%",last_name.ilike."%Era%",email.ilike."%Era%",phone.ilike."%Era%",school.ilike."%Era%"');
  const searchForm = new FormData(); searchForm.set("q", "  New query  "); searchForm.set("page", "999");
  assert.equal((await search.searchRegistrations(result, searchForm)).page, 1);
  searchForm.set("q", result.query); searchForm.set("page", "2");
  assert.equal((await search.searchRegistrations(result, searchForm)).page, 2, "Pagination preserves the current search");
  assert.ok(!JSON.stringify(result).includes("synthetic-key"));

  mode = "db-error";
  await assert.rejects(() => data.getAdminRegistrations("", 1), { message: "ADMIN_REGISTRATIONS_READ_FAILED" });
  const failure = await search.searchRegistrations(result, searchForm);
  assert.deepEqual(failure.rows, []);
  assert.ok(!JSON.stringify(failure).includes("PRIVATE_STUDENT_DETAIL"));
  mode = "revoked";
  const readsBefore = dataClients;
  await redirects(() => page(), "/admin/login");
  assert.equal(dataClients, readsBefore);
  mode = "valid";
  for (const value of ["", "not-a-uuid", `${adminId},invalid`]) {
    env.SUPABASE_ADMIN_USER_IDS = value;
    assert.equal(config.isAdminConfigured(), false);
    await redirects(() => page(), "/admin/login");
  }
  env.SUPABASE_ADMIN_USER_IDS = adminId;
  await redirects(() => actions.logoutAdmin(), "/admin/login");
  assert.equal(jar.size, 0);
  await redirects(() => page(), "/admin/login");
  jar.set("rre-admin-auth.0", "synthetic-chunk");
  jar.set("unrelated", "preserved");
  mode = "logout-outage";
  await redirects(() => actions.logoutAdmin(), "/admin/login");
  assert.deepEqual([...jar.keys()], ["unrelated"]);
  assert.ok(invalidations.some(([url, type]) => url === "/admin" && type === "layout"));
  for (const { options } of cookieWrites) {
    assert.equal(options.httpOnly, true); assert.equal(options.secure, true);
    assert.equal(options.sameSite, "lax"); assert.equal(options.path, "/admin");
  }

  // Real XLSX writer/reader with synthetic database responses only.
  const exportRoute = load("src/app/admin/registrations/export/route.ts");
  const exporter = load("src/lib/admin/registration-export.ts");
  mode = "valid";
  jar.clear();
  const beforeExport = dataClients;
  assert.equal((await exportRoute.GET()).status, 401);
  jar.set("rre-admin-auth", "verified-session");
  identity = otherId;
  assert.equal((await exportRoute.GET()).status, 401);
  assert.equal(dataClients, beforeExport, "Missing and non-allowlisted sessions cannot initialize export data access");
  identity = adminId;
  exportRows = Array.from({ length: 1205 }, (_, index) => ({ ...row, id: `private-id-${index}`, first_name: `Student ${index}`, created_at: new Date(Date.UTC(2026, 8, 30, 12, 0, -index)).toISOString() }));
  Object.assign(exportRows[0], { first_name: "=1+1", last_name: "+SUM(1,2)", phone: "+355690000000", email: "@example.test", school: "-2+3", class_year: "\t=1+1", board: " \n@SUM(1,2)", hobbies: '=HYPERLINK("https://example.invalid")', motivation: "\r+1" });
  const queryStart = queries.length;
  const exported = await exportRoute.GET(new Request("http://localhost/admin/registrations/export?q=not-found&page=2"));
  assert.equal(exported.status, 200);
  assert.equal(exported.headers.get("content-type"), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  assert.match(exported.headers.get("content-disposition"), /^attachment; filename="Keshilli-Rinor-Elbasan-Regjistrime-\d{4}-\d{2}-\d{2}\.xlsx"$/);
  assert.match(exported.headers.get("cache-control"), /private, no-store/);
  const bytes = Buffer.from(await exported.arrayBuffer());
  assert.equal(bytes.subarray(0, 2).toString(), "PK", "XLSX must be a ZIP workbook, not renamed CSV");
  const { Workbook, ValueType } = require("exceljs");
  const workbook = new Workbook();
  await workbook.xlsx.load(bytes);
  const sheet = workbook.worksheets[0];
  assert.equal(sheet.rowCount, 1206, "All 1205 records, beyond table and Supabase batch limits, must be exported");
  assert.equal(sheet.columnCount, 10, "No internal/UUID column");
  assert.deepEqual(sheet.getRow(1).values.slice(1), ["Emër", "Mbiemër", "Numër Telefoni", "Email", "Shkolla", "Klasa / Viti", "Bordi", "Hobi", "Pse do të jesh pjesë e Këshillit Rinor?", "Data e regjistrimit"]);
  const keys = ["first_name", "last_name", "phone", "email", "school", "class_year", "board", "hobbies", "motivation"];
  for (let column = 1; column <= 9; column++) {
    const cell = sheet.getRow(2).getCell(column);
    assert.equal(cell.type, ValueType.String);
    // XML normalizes carriage returns to line feeds when the workbook is read.
    assert.equal(cell.value, `'${exportRows[0][keys[column - 1]].replace(/\r/g, "\n")}`);
    assert.equal(cell.formula, undefined);
  }
  for (let index = 1; index < exportRows.length; index++) {
    assert.equal(sheet.getRow(index + 2).getCell(1).value, `Student ${index}`, "Preserve newest-first row order");
  }
  assert.equal(sheet.getRow(2).getCell(10).value, data.formatRegistrationDate(exportRows[0].created_at));
  assert.ok(!JSON.stringify(sheet.model).includes("private-id-"));
  const exportQueries = queries.slice(queryStart);
  assert.equal(exportQueries.length, 7, "Continue when Supabase returns fewer than the requested 500 rows");
  for (const operations of exportQueries) {
    assert.ok(!operations.some(([method]) => method === "or"), "Export does not apply table search");
    assert.deepEqual(operations.filter(([method]) => method === "order"), [["order", "created_at", { ascending: false }], ["order", "id", { ascending: false }]]);
    assert.ok(operations.find(([method]) => method === "abortSignal")[1] instanceof AbortSignal);
  }
  assert.equal(exporter.registrationExportFilename(new Date("2026-09-30T22:30:00Z")), "Keshilli-Rinor-Elbasan-Regjistrime-2026-10-01.xlsx");
  assert.equal(exporter.safeSpreadsheetText("Normal text - preserved"), "Normal text - preserved");
  assert.throws(() => exporter.safeSpreadsheetText("x".repeat(32768)));
  for (const scenario of ["cap", "short", "changed", "duplicate"]) {
    exportScenario = scenario;
    const failure = await exportRoute.GET();
    assert.equal(failure.status, 503);
    assert.deepEqual(await failure.json(), { message: "Eksporti nuk u krye. Provo përsëri më vonë." });
    assert.equal(failure.headers.get("content-disposition"), null, "Never download a partial workbook");
  }
  exportScenario = "";
  exportRows = Array.from({ length: 400 }, (_, index) => ({ ...row, id: `size-test-${index}`, motivation: "x".repeat(30_000) }));
  assert.equal((await exportRoute.GET()).status, 503, "Text budget overflow fails without a partial file");
  mode = "db-error";
  assert.equal((await exportRoute.GET()).status, 503);
  mode = "valid";
  exportRows = [];
  const emptyBook = new Workbook();
  await emptyBook.xlsx.load(Buffer.from(await (await exportRoute.GET()).arrayBuffer()));
  assert.equal(emptyBook.worksheets[0].rowCount, 1, "Empty dataset produces a header-only workbook");
  exportRows = null;
  const buttonState = [false, ""];
  let hookIndex = 0;
  mocks.react = { ...React, useState: () => {
    const index = hookIndex++;
    return [buttonState[index], (value) => { buttonState[index] = value; }];
  } };
  cache.delete(path.resolve("src/components/admin/AdminExportButton.tsx"));
  const { AdminExportButton } = load("src/components/admin/AdminExportButton.tsx");
  const originalFetch = globalThis.fetch;
  try {
    for (const status of [401, 503, "network"]) {
      globalThis.fetch = async (url) => {
        assert.equal(url, "/admin/registrations/export");
        assert.equal(buttonState[0], true, "Loading state is active while downloading");
        if (status === "network") throw new Error("PRIVATE_NETWORK_DETAIL");
        return new Response("PRIVATE_ERROR_DETAIL", { status });
      };
      hookIndex = 0;
      await AdminExportButton().props.children[0].props.onClick();
      assert.equal(buttonState[0], false, "Download button is re-enabled on failure");
      assert.equal(buttonState[1], status === 401
        ? "Nuk keni leje për këtë shkarkim. Hyni përsëri si administrator."
        : "Eksporti nuk u krye. Provo përsëri më vonë.");
    }
  } finally { globalThis.fetch = originalFetch; }
  for (const args of logs) {
    assert.equal(args.length, 1);
    assert.ok(["ADMIN_LOGIN_FAILED", "ADMIN_LOGOUT_REVOCATION_FAILED", "ADMIN_SESSION_VERIFICATION_FAILED", "ADMIN_EXPORT_FAILED"].includes(args[0]));
  }
} finally { console.error = originalError; }
console.log("PASS: admin auth/view/search/pagination/logout; export authorization, 1205-row parsed XLSX, all columns, formula safety, ordering, filename, headers, limits/incomplete data/errors, empty export and safe logs. Mocked services only; no real credentials/data accessed.");
