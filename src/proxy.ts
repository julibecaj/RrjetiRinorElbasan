import { NextResponse, type NextRequest } from "next/server";
import { createAdminSessionClient, adminCookieOptions, isAdminCookie } from "@/lib/supabase/admin-session";
import { isAdminConfigured, isAllowedAdmin } from "@/lib/admin/config";
import { campaignRoute, isRegistrationMode } from "@/lib/registration-mode";

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname.replace(/\/+$/, "") || "/";
  const campaign = isRegistrationMode();
  const decision = campaign ? campaignRoute(pathname) : "allow";
  if (decision === "register") {
    const response = NextResponse.redirect(new URL("/register", request.url), 303);
    response.headers.set("Cache-Control", "private, no-store, max-age=0");
    return response;
  }
  const existingAdminRoute = pathname === "/admin/login" || pathname === "/admin/registrations" || pathname.startsWith("/admin/registrations/");
  // With mode off, only the original admin paths run session refresh.
  if (!existingAdminRoute && decision !== "admin") return NextResponse.next();
  let response = NextResponse.next({ request });
  let allowedAdmin = false;
  if (isAdminConfigured()) {
    try {
      const client = createAdminSessionClient({
        getAll: () => request.cookies.getAll().filter(({ name }) => isAdminCookie(name)),
        setAll: (updates, headers) => {
          updates.forEach(({ name, value }) => request.cookies.set(name, value));
          const previous = response.cookies.getAll();
          response = NextResponse.next({ request });
          previous.forEach((cookie) => response.cookies.set(cookie));
          updates.forEach(({ name, value, options }) => response.cookies.set(name, value, { ...options, ...adminCookieOptions() }));
          Object.entries(headers).forEach(([name, value]) => response.headers.set(name, value));
        },
      });
      // Refresh cookies here; authorization is repeated next to the data read.
      const { data, error } = await client.auth.getUser();
      allowedAdmin = !error && Boolean(data.user && isAllowedAdmin(data.user.id));
    } catch {
      console.error("ADMIN_SESSION_REFRESH_FAILED");
    }
  }
  if (decision === "admin") {
    const redirect = NextResponse.redirect(new URL(allowedAdmin ? "/admin/registrations" : "/admin/login", request.url), 303);
    response.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
    response = redirect;
  }
  response.headers.set("Cache-Control", "private, no-store, max-age=0");
  response.headers.set("Pragma", "no-cache");
  response.headers.set("Expires", "0");
  response.headers.set("Referrer-Policy", "no-referrer");
  response.headers.set("X-Robots-Tag", "noindex, nofollow");
  return response;
}

// Run for page/RSC requests too. campaignRoute explicitly permits required assets.
export const config = { matcher: ["/:path*"] };
