"use server";

import { requireAdmin } from "@/lib/admin/auth";
import { getAdminRegistrations, ADMIN_PAGE_SIZE, type AdminRegistrations } from "@/lib/admin/registrations";

export async function searchRegistrations(previous: AdminRegistrations, form: FormData): Promise<AdminRegistrations> {
  // Independently authorize direct calls to this action before processing data.
  await requireAdmin();
  const raw = form.get("q");
  const query = typeof raw === "string" ? raw.trim().slice(0, 120) : "";
  const requested = Number(form.get("page"));
  const page = query === previous.query ? requested : 1;
  try {
    return await getAdminRegistrations(query, page);
  } catch {
    return { rows: [], total: 0, matches: 0, page: 1, pageSize: ADMIN_PAGE_SIZE, query, error: "Regjistrimet nuk mund të ngarkohen. Provo përsëri më vonë." };
  }
}
