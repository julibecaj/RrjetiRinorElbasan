import "server-only";
import { requireAdmin } from "./auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const ADMIN_PAGE_SIZE = 50;

const registrationDateFormatter = new Intl.DateTimeFormat("sq-AL", {
  timeZone: "Europe/Tirane",
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export function formatRegistrationDate(date: string) {
  return registrationDateFormatter.format(new Date(date));
}

export function registrationSearchFilter(search: string) {
  // Quote PostgREST values and escape its grammar plus SQL LIKE wildcards.
  // The search text must never become an extra filter expression.
  const value = search.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/%/g, "\\%").replace(/_/g, "\\_");
  return ["first_name", "last_name", "email", "phone", "school"]
    .map((column) => `${column}.ilike."%${value}%"`).join(",");
}

export async function getAdminRegistrations(search: string, page: number) {
  // Keep authorization at the data boundary, not merely in a layout or proxy.
  await requireAdmin();
  const query = search.trim().slice(0, 120).replace(/[\u0000-\u001f\u007f]/g, "");
  const currentPage = Number.isSafeInteger(page) && page > 0 ? Math.min(page, 100_000) : 1;
  try {
    const client = createSupabaseServerClient();
    const offset = (currentPage - 1) * ADMIN_PAGE_SIZE;
    let rows = client.from("registrations")
      .select("id,first_name,last_name,phone,email,school,class_year,board,hobbies,motivation,created_at", { count: "exact" })
      .order("created_at", { ascending: false })
      .order("id", { ascending: false })
      .range(offset, offset + ADMIN_PAGE_SIZE - 1);
    if (query) rows = rows.or(registrationSearchFilter(query));
    const [result, total] = await Promise.all([
      rows.abortSignal(AbortSignal.timeout(10_000)),
      client.from("registrations").select("id", { count: "exact", head: true }).abortSignal(AbortSignal.timeout(10_000)),
    ]);
    if (result.error || total.error || !result.data || result.count === null || total.count === null) {
      throw new Error("ADMIN_REGISTRATIONS_READ_FAILED");
    }
    // Serialize the display text once: browser ICU data can differ from Node's.
    const displayRows = result.data.map((row) => ({
      ...row,
      created_at_display: formatRegistrationDate(row.created_at),
    }));
    return { rows: displayRows, total: total.count, matches: result.count, page: currentPage, query, pageSize: ADMIN_PAGE_SIZE };
  } catch {
    // Never let SDK errors (which may contain filters or values) reach logs.
    throw new Error("ADMIN_REGISTRATIONS_READ_FAILED");
  }
}

export type AdminRegistrations = Awaited<ReturnType<typeof getAdminRegistrations>> & { error?: string };
