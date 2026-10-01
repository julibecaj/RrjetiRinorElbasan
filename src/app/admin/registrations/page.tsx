import type { Metadata } from "next";
import { requireAdmin } from "@/lib/admin/auth";
import { getAdminRegistrations } from "@/lib/admin/registrations";
import { logoutAdmin } from "@/app/admin/login/actions";
import { AdminLogoutButton } from "@/components/admin/AdminLogoutButton";
import { AdminRegistrationsTable } from "@/components/admin/AdminRegistrationsTable";
import { AdminExportButton } from "@/components/admin/AdminExportButton";
import styles from "./registrations.module.css";

export const metadata: Metadata = { title: "Regjistrimet | Administrimi RRE", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function AdminRegistrationsPage() {
  // Redirect before rendering or fetching any student information.
  await requireAdmin();
  const result = await getAdminRegistrations("", 1);

  return (
    <section className={`container page-content ${styles.page}`}>
      <div className={styles.heading}>
        <div><p className="eyebrow">KËSHILLI RINOR ELBASAN</p><h1>Regjistrimet</h1></div>
        <form action={logoutAdmin}><AdminLogoutButton /></form>
      </div>
      <AdminExportButton />
      <AdminRegistrationsTable initial={result} />
    </section>
  );
}
