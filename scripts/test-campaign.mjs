import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { NextRequest, NextResponse } from "next/server.js";
import ts from "typescript";

// No environment files or network access. Only synthetic identities/cookies.
const require = createRequire(import.meta.url);
const adminId = "00000000-0000-4000-8000-000000000001";
const env = { RRE_REGISTRATION_MODE: "true", NODE_ENV: "production", SUPABASE_URL: "https://fixture.invalid", SUPABASE_SECRET_KEY: "synthetic", SUPABASE_ADMIN_USER_IDS: adminId };
let identity = null;
let refreshes = 0;
const cache = new Map();
const mocks = {
  "server-only": {},
  "next/server": { NextResponse },
  "@/lib/supabase/admin-session": {
    adminCookieOptions: () => ({ path: "/admin", httpOnly: true, secure: true, sameSite: "lax" }),
    isAdminCookie: (name) => name === "rre-admin-auth",
    createAdminSessionClient: (options) => ({ auth: { getUser: async () => {
      refreshes++;
      options.setAll([{ name: "rre-admin-auth", value: "synthetic-refresh", options: {} }], {});
      return { data: { user: identity ? { id: identity } : null }, error: null };
    } } }),
  },
};
function load(file) {
  const filename = path.resolve(file);
  if (cache.has(filename)) return cache.get(filename).exports;
  const loadedModule = { exports: {} }; cache.set(filename, loadedModule);
  const code = ts.transpileModule(fs.readFileSync(filename, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX } }).outputText;
  new Function("require", "module", "exports", "process", code)((name) => {
    if (name in mocks) return mocks[name];
    if (name.startsWith("react")) return require(name);
    const base = name.startsWith("@/") ? path.resolve("src", name.slice(2)) : path.resolve(path.dirname(filename), name);
    const target = [base, `${base}.ts`, `${base}.tsx`].find((p) => fs.existsSync(p) && fs.statSync(p).isFile());
    assert.ok(target, `Unexpected module ${name}`);
    return load(target);
  }, loadedModule, loadedModule.exports, { env });
  return loadedModule.exports;
}
const { proxy } = load("src/proxy.ts");
const mode = load("src/lib/registration-mode.ts");
const request = (url, options) => new NextRequest(`https://campaign.test${url}`, options);
async function redirects(url, destination, options) {
  const response = await proxy(request(url, options));
  assert.equal(response.status, 303);
  assert.equal(response.headers.get("location"), `https://campaign.test${destination}`);
  assert.match(response.headers.get("cache-control"), /no-store/);
  assert.notEqual(url, destination, "No self-redirect");
  assert.equal((await proxy(request(destination))).headers.get("location"), null, "Redirect destination is allowed by proxy");
  return response;
}
for (const url of ["/", "/about", "/events", "/events/example.png", "/opportunities", "/profile", "/login", "/search?q=hidden", "/register/extra", "/api/other"]) {
  await redirects(url, "/register");
}
await redirects("/about?_rsc=test", "/register", { headers: { rsc: "1" } });
await redirects("/events", "/register", { method: "POST", body: "synthetic" });
assert.equal(refreshes, 0, "Hidden public routes must not call Supabase Auth");
for (const url of ["/register", "/register/", "/api/register", "/_next/static/chunks/app.js", "/_next/static/media/font.woff2", "/_next/image?url=test", "/images/rre-logo.png", "/fonts/example.woff2", "/assets/example.css", "/favicon.ico", "/file.svg", "/globe.svg", "/next.svg", "/vercel.svg", "/window.svg"]) {
  assert.equal((await proxy(request(url))).headers.get("location"), null, `${url} must pass through`);
}
assert.equal(refreshes, 0);
for (const url of ["/admin/login", "/admin/registrations", "/admin/registrations/export"]) {
  const response = await proxy(request(url));
  assert.equal(response.headers.get("location"), null, "Real admin entry points retain their own page/route authorization");
  assert.match(response.headers.get("set-cookie"), /HttpOnly/);
}
for (const user of [null, "00000000-0000-4000-8000-000000000002", adminId]) {
  identity = user;
  for (const url of ["/admin", "/admin/", "/admin/events", "/admin/users/123", "/admin/content", "/admin/registrations/unknown", "/admin/login/extra"]) {
    const response = await redirects(url, user === adminId ? "/admin/registrations" : "/admin/login");
    assert.match(response.headers.get("set-cookie"), /synthetic-refresh/, "Refresh cookies survive admin redirects");
  }
}
env.NODE_ENV = "development";
assert.equal(mode.campaignRoute("/_next/webpack-hmr"), "allow");
assert.equal(mode.campaignRoute("/__nextjs_original-stack-frames"), "allow");
env.NODE_ENV = "production";
assert.equal(mode.campaignRoute("/__nextjs_original-stack-frames"), "register");
for (const value of [undefined, "false", "TRUE", "1"]) {
  if (value === undefined) delete env.RRE_REGISTRATION_MODE; else env.RRE_REGISTRATION_MODE = value;
  assert.equal(mode.isRegistrationMode(), false);
  const before = refreshes;
  for (const url of ["/", "/about", "/events", "/register", "/api/register", "/admin", "/admin/events", "/images/rre-logo.png"]) {
    assert.equal((await proxy(request(url))).headers.get("location"), null, "Normal site passes through when mode is off");
  }
  assert.equal(refreshes, before, "Mode off preserves original session refresh scope");
  await proxy(request("/admin/registrations"));
  assert.equal(refreshes, before + 1);
}
console.log("PASS: campaign on/off routing, exact allowlist, public and admin redirects, verified UUID decisions, refresh-cookie preservation, assets, RSC/POST handling, no loops, and unchanged normal-site proxy scope. Synthetic mocks only.");
