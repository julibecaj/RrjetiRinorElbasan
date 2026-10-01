"use client";

import Link from "next/link";
import { logoutAdmin } from "@/app/admin/login/actions";
import { AdminLogoutButton } from "@/components/admin/AdminLogoutButton";
export default function RegistrationsError({ reset }: { reset: () => void }) {
  return <section className="container page-content"><h1>Regjistrimet nuk mund të shfaqen</h1><p role="alert">Ndodhi një problem. Provo përsëri më vonë.</p><button className="button" onClick={reset}>Provo përsëri</button><p><Link href="/admin/login">Kthehu te hyrja</Link></p><form action={logoutAdmin}><AdminLogoutButton /></form></section>;
}
