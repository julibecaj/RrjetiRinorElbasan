import "server-only";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function adminUserIds(): string[] {
  const values = (process.env.SUPABASE_ADMIN_USER_IDS ?? "").split(",").map((value) => value.trim().toLowerCase()).filter(Boolean);
  // A malformed or missing allowlist denies everyone.
  return values.length && values.every((value) => UUID.test(value)) ? values : [];
}

export function isAllowedAdmin(id: string): boolean {
  return adminUserIds().includes(id.toLowerCase());
}

export function isAdminConfigured(): boolean {
  return Boolean(process.env.SUPABASE_URL?.trim() && process.env.SUPABASE_SECRET_KEY?.trim() && adminUserIds().length);
}
