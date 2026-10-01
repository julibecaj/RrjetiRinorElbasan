import "server-only";

export function isRegistrationMode() {
  return process.env.RRE_REGISTRATION_MODE === "true";
}

const campaignRoutes = new Set([
  "/register", "/api/register", "/admin/login", "/admin/registrations", "/admin/registrations/export",
]);
const publicFiles = new Set([
  "/favicon.ico", "/file.svg", "/globe.svg", "/next.svg", "/vercel.svg", "/window.svg",
]);

export function campaignRoute(pathname: string): "allow" | "register" | "admin" {
  const path = pathname.replace(/\/+$/, "") || "/";
  if (campaignRoutes.has(path)) return "allow";
  // Exact framework/static namespaces, not a blanket extension bypass: an
  // /events/example.png or an RSC request for /about is still a hidden page.
  if (publicFiles.has(path) || path === "/_next/image" ||
      ["/_next/static/", "/images/", "/fonts/", "/assets/"].some((prefix) => path.startsWith(prefix))) return "allow";
  if (process.env.NODE_ENV === "development" &&
      (path === "/_next/webpack-hmr" || path.startsWith("/__nextjs_"))) return "allow";
  if (path === "/admin" || path.startsWith("/admin/")) return "admin";
  return "register";
}
