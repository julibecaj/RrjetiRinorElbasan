import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAdminIdentity } from "@/lib/admin/auth";
import { isAdminConfigured } from "@/lib/admin/config";
import { AdminLoginForm } from "@/components/admin/AdminLoginForm";

export const metadata: Metadata = { title: "Hyrja e administratorit | RRE", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function AdminLoginPage() {
  if (await getAdminIdentity()) redirect("/admin/registrations");
  return (
    <section className="container page-content" style={{ maxWidth: 580 }}>
      <p className="eyebrow">KËSHILLI RINOR ELBASAN</p>
      <div className="page-heading"><h1>Hyrja e administratorit</h1></div>
      <p>Hapësirë vetëm për administratorët e autorizuar.</p>
      {isAdminConfigured() ? <AdminLoginForm /> : <p className="notice" role="status">Hyrja e administratorit nuk është e disponueshme për momentin.</p>}
    </section>
  );
}
