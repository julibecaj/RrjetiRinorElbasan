import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createAdminSessionClient, adminCookieOptions, isAdminCookie } from "@/lib/supabase/admin-session";
import { isAdminConfigured, isAllowedAdmin } from "./config";

export async function adminSession(writable = false) {
  const store = await cookies();
  return createAdminSessionClient({
    getAll: () => store.getAll().filter(({ name }) => isAdminCookie(name)),
    setAll: (updates) => {
      // Server Components are read-only; proxy refreshes their session first.
      if (writable) updates.forEach(({ name, value, options }) => store.set(name, value, { ...options, ...adminCookieOptions() }));
    },
  });
}

export async function clearAdminCookies() {
  const store = await cookies();
  store.getAll().filter(({ name }) => isAdminCookie(name)).forEach(({ name }) => {
    store.set(name, "", { ...adminCookieOptions(), maxAge: 0 });
  });
}

export async function getAdminIdentity(): Promise<{ id: string } | null> {
  if (!isAdminConfigured()) return null;
  try {
    const client = await adminSession();
    // Validate with the Auth service. Never trust getSession() or cookie claims.
    const { data, error } = await client.auth.getUser();
    if (error || !data.user || !isAllowedAdmin(data.user.id)) return null;
    return { id: data.user.id };
  } catch {
    console.error("ADMIN_SESSION_VERIFICATION_FAILED");
    return null;
  }
}

export async function requireAdmin() {
  const admin = await getAdminIdentity();
  if (!admin) redirect("/admin/login");
  return admin;
}
