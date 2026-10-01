import "server-only";
import { createServerClient, type CookieMethodsServer } from "@supabase/ssr";

export const ADMIN_COOKIE_NAME = "rre-admin-auth";
export function isAdminCookie(name: string) {
  return name === ADMIN_COOKIE_NAME || name.startsWith(`${ADMIN_COOKIE_NAME}.`) || name === `${ADMIN_COOKIE_NAME}-code-verifier`;
}
export function adminCookieOptions() {
  return { httpOnly: true, sameSite: "lax" as const, secure: process.env.NODE_ENV === "production", path: "/admin" };
}

// A fresh session-bearing client per request. Never use this client for
// privileged data reads; those use the separate server.ts client after auth.
export function createAdminSessionClient(cookies: CookieMethodsServer) {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url?.trim() || !key?.trim()) throw new Error("ADMIN_AUTH_CONFIGURATION_MISSING");
  return createServerClient<Record<string, never>>(url, key, {
    cookieOptions: { name: ADMIN_COOKIE_NAME, ...adminCookieOptions() },
    cookies,
    global: {
      fetch: (input, init) => fetch(input, {
        ...init,
        cache: "no-store",
        signal: AbortSignal.any([...(init?.signal ? [init.signal] : []), AbortSignal.timeout(10_000)]),
      }),
    },
  });
}
