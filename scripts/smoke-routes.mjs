import assert from "node:assert/strict";

const base = process.env.DEMO_BASE_URL || "http://localhost:3002";
const routes = [
  "/",
  "/about",
  "/events",
  "/events/ai-workshop",
  "/opportunities",
  "/opportunities/jobs",
  "/opportunities/education",
  "/opportunities/volunteering",
  "/opportunities/projects",
  "/search",
  "/login",
  "/register",
  "/forgot-password",
  "/profile",
  "/profile/applications",
  "/profile/activities",
  "/profile/points",
  "/profile/settings",
  "/propose-idea",
  "/admin",
  "/admin/events",
  "/admin/events/new",
  "/admin/events/ai-workshop/edit",
  "/admin/events/ai-workshop/applications",
  "/admin/users",
  "/admin/users/u1",
  "/admin/opportunities",
  "/admin/content",
];
// Small batches avoid overwhelming a dev server compiling routes for the first time.
for (let i = 0; i < routes.length; i += 4) {
  await Promise.all(
    routes.slice(i, i + 4).map(async (route) => {
      const response = await fetch(`${base}${route}`);
      assert.equal(response.status, 200, route);
      const html = await response.text();
      assert.ok(
        html.includes('id="main-content"'),
        `${route}: missing main content`,
      );
      assert.ok(html.includes("<h1"), `${route}: missing heading`);
      assert.ok(
        !html.includes('"digest":"NEXT_HTTP_ERROR_FALLBACK;404"'),
        `${route}: unexpected not-found page`,
      );
      console.log(`PASS ${route}`);
    }),
  );
}
const missing = await fetch(`${base}/this-page-does-not-exist`);
assert.equal(missing.status, 404, "Unknown route returns 404");
console.log(`PASS: ${routes.length} routes and the 404 fallback`);
