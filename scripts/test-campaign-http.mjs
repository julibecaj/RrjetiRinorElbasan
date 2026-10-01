// Run against scripts/admin-test-server.mjs with the corresponding flag.
// Fixed loopback fixture URLs, synthetic accounts, no .env reads or live writes.
import assert from "node:assert/strict";
import { createServerClient } from "@supabase/ssr";

const campaign = process.argv.includes("--on");
const origin = "http://127.0.0.1:3015";
const request = (path, init = {}) => fetch(`${origin}${path}`, { ...init, redirect: "manual", signal: AbortSignal.timeout(10_000) });
const destination = (response) => new URL(response.headers.get("location"), origin).pathname;
async function cookiesFor(email) {
  const jar = new Map();
  const client = createServerClient("http://127.0.0.1:4015", "synthetic-fixture-key", {
    cookieOptions: { name: "rre-admin-auth", path: "/admin" },
    cookies: { getAll: () => [...jar].map(([name, value]) => ({ name, value })), setAll: (updates) => updates.forEach(({ name, value }) => jar.set(name, value)) },
  });
  const { error } = await client.auth.signInWithPassword({ email, password: "synthetic-password" });
  assert.equal(error, null);
  return [...jar].map(([name, value]) => `${name}=${value}`).join("; ");
}
for (const path of ["/", "/about", "/events", "/opportunities", "/login", "/profile", "/admin", "/admin/events", "/admin/content"]) {
  const response = await request(path);
  if (campaign) {
    assert.equal(response.status, 303, `Hidden ${path} redirects`);
    assert.equal(destination(response), path.startsWith("/admin") ? "/admin/login" : "/register");
    assert.match(response.headers.get("cache-control"), /no-store/);
  } else assert.equal(response.status, 200, `Normal ${path} remains available`);
}
const registration = await request("/register");
assert.equal(registration.status, 200);
const html = await registration.text();
assert.ok(html.includes('id="main-content"'));
assert.ok(html.includes('href="#main-content"'));
if (campaign) {
  for (const path of ["/about", "/events", "/admin", "/login", "/profile", "/search"]) assert.ok(!html.includes(`href="${path}"`), "Campaign HTML excludes hidden navigation");
  assert.ok(html.includes('href="/register"'));
} else {
  assert.ok(html.includes('href="/about"'));
  assert.ok(html.includes('href="/admin"'));
}
for (const path of ["/images/rre-logo.png", "/favicon.ico", "/file.svg", "/_next/image?url=%2Fimages%2Frre-logo.png&w=256&q=75"]) {
  assert.equal((await request(path)).status, 200, `Asset ${path} works`);
}
for (const extension of ["js", "css", "woff2"]) {
  const pattern = new RegExp(`/_next/static/[^"<>\\s]+\\.${extension}(?:\\?[^"<>\\s]*)?`);
  const path = html.match(pattern)?.[0]?.replaceAll("&amp;", "&");
  assert.ok(path, `Rendered page contains ${extension} assets`);
  assert.equal((await request(path)).status, 200, `${extension} assets work`);
}
assert.equal((await request("/admin/login")).status, 200);
const api = await request("/api/register", { method: "POST", headers: { "content-type": "application/json", origin }, body: "{}" });
assert.equal(api.status, 422, "Registration API reaches existing validation instead of a redirect");
if (campaign) {
  for (const path of ["/about?_rsc=fixture", "/events/example.png", "/register/extra", "/_next/data/fixture/about.json"]) {
    const response = await request(path, { headers: { rsc: "1" } });
    assert.equal(response.status, 303);
    if (path.startsWith("/_next/data/")) {
      assert.equal(response.headers.get("x-nextjs-redirect"), "/_next/data/fixture/register.json", "Next preserves its internal data redirect protocol");
    } else assert.equal(destination(response), "/register");
  }
}
const unauthenticated = await request("/admin/registrations");
assert.equal(destination(unauthenticated), "/admin/login");
assert.equal((await request("/admin/registrations/export")).status, 401);
for (const email of ["other@example.test", "admin@example.test"]) {
  const headers = { cookie: await cookiesFor(email) };
  const allowed = email === "admin@example.test";
  if (campaign) {
    for (const path of ["/admin", "/admin/users", "/admin/registrations/extra"]) {
      const response = await request(path, { headers });
      assert.equal(response.status, 303);
      assert.equal(destination(response), allowed ? "/admin/registrations" : "/admin/login");
    }
  }
  const page = await request("/admin/registrations", { headers });
  assert.equal(page.status, allowed ? 200 : 307);
  if (!allowed) assert.equal(destination(page), "/admin/login");
  const exported = await request("/admin/registrations/export", { headers });
  assert.equal(exported.status, allowed ? 200 : 401);
  await exported.arrayBuffer();
}
console.log(`PASS: campaign ${campaign ? "ON" : "OFF"} real production HTTP routes, navigation, API validation, admin/allowlist/export protection, images/optimized images/fonts/JS/CSS/favicon, and redirect destinations. Synthetic fixture only.`);
