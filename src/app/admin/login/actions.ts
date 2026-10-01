"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { adminSession, clearAdminCookies } from "@/lib/admin/auth";
import { isAdminConfigured, isAllowedAdmin } from "@/lib/admin/config";

export async function loginAdmin(_previous: { error: string }, form: FormData): Promise<{ error: string }> {
  const email = form.get("email");
  const password = form.get("password");
  if (typeof email !== "string" || typeof password !== "string" ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) || email.trim().length > 254 || !password || password.length > 1024) {
    return { error: "Shkruaj një email të vlefshëm dhe fjalëkalimin." };
  }
  if (!isAdminConfigured()) return { error: "Hyrja e administratorit nuk është e disponueshme për momentin." };
  try {
    const client = await adminSession(true);
    const { data, error } = await client.auth.signInWithPassword({ email: email.trim().toLowerCase(), password });
    if (error || !data.user || !data.session) {
      await clearAdminCookies();
      return { error: error?.code === "invalid_credentials"
        ? "Email ose fjalëkalim i pasaktë."
        : "Hyrja nuk u krye. Provo përsëri më vonë." };
    }
    if (!isAllowedAdmin(data.user.id)) {
      try { await client.auth.signOut({ scope: "local" }); } finally { await clearAdminCookies(); }
      return { error: "Kjo llogari nuk ka leje administrimi." };
    }
  } catch {
    await clearAdminCookies();
    console.error("ADMIN_LOGIN_FAILED");
    return { error: "Hyrja nuk u krye. Provo përsëri më vonë." };
  }
  revalidatePath("/admin", "layout");
  redirect("/admin/registrations");
}

export async function logoutAdmin() {
  try {
    const client = await adminSession(true);
    const { error } = await client.auth.signOut({ scope: "local" });
    if (error) console.error("ADMIN_LOGOUT_REVOCATION_FAILED");
  } catch {
    console.error("ADMIN_LOGOUT_REVOCATION_FAILED");
  } finally {
    // Always clear this browser's cookies, even if Auth is unreachable.
    await clearAdminCookies();
  }
  revalidatePath("/admin", "layout");
  redirect("/admin/login");
}
