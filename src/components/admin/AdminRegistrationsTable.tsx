"use client";

import { useActionState, useState } from "react";
import type { AdminRegistrations } from "@/lib/admin/registrations";
import { searchRegistrations } from "@/app/admin/registrations/actions";
import styles from "@/app/admin/registrations/registrations.module.css";

export function AdminRegistrationsTable({ initial }: { initial: AdminRegistrations }) {
  const [result, action, pending] = useActionState<AdminRegistrations, FormData>(searchRegistrations, initial);
  const [query, setQuery] = useState(initial.query);
  const pages = Math.max(1, Math.ceil(result.matches / result.pageSize));
  return <>
    <p>Gjithsej: <strong>{result.total}</strong> regjistrime. Më të rejat shfaqen të parat.</p>
    <form action={action} aria-busy={pending}>
      <div className={styles.search} role="search">
        <label htmlFor="registration-search">Kërko sipas emrit, mbiemrit, emailit, telefonit ose shkollës
          <input id="registration-search" name="q" type="search" value={query} onChange={(event) => setQuery(event.target.value)} maxLength={120} readOnly={pending} />
        </label>
        <button className="button button-primary" type="submit" name="page" value="1" disabled={pending}>{pending ? "Duke kërkuar…" : "Kërko"}</button>
        <button className="button" type="submit" name="page" value="1" onClick={() => setQuery("")} disabled={pending}>Pastro kërkimin</button>
      </div>
      {result.error && <p className="notice error" role="alert">{result.error}</p>}
      <p role="status">{pending ? "Po ngarkohen regjistrimet…" : `${result.matches} rezultate · Faqja ${result.page} nga ${pages}`}</p>
      {result.rows.length ? <>
        <p id="table-help" className="help-text">Në ekran të vogël, lëviz tabelën horizontalisht. Ora lokale: Elbasan.</p>
        <div className={`table-wrap ${styles.table}`} tabIndex={0} role="region" aria-label="Tabela e regjistrimeve" aria-describedby="table-help">
          <table><caption className={styles.caption}>Regjistrimet e studentëve</caption>
            <thead><tr>{["Emër", "Mbiemër", "Numër Telefoni", "Email", "Shkolla", "Klasa / Viti", "Bordi", "Lagja/Zona", "Mosha", "Hobi", "Pse do të jesh pjesë e Këshillit Rinor?", "Data e regjistrimit"].map((label) => <th scope="col" key={label}>{label}</th>)}</tr></thead>
            <tbody>{result.rows.map((row) => <tr key={row.id}>
              <td>{row.first_name}</td><td>{row.last_name}</td><td>{row.phone}</td><td>{row.email || "—"}</td>
              <td>{row.school}</td><td>{row.class_year || "—"}</td><td>{row.board || "—"}</td><td>{row.neighborhood_area || "—"}</td><td>{row.age ?? "—"}</td><td className={styles.long}>{row.hobbies}</td>
              <td className={styles.long}>{row.motivation}</td><td><time dateTime={row.created_at}>{row.created_at_display}</time></td>
            </tr>)}</tbody>
          </table>
        </div>
      </> : !result.error && <p className="notice">Nuk u gjet asnjë regjistrim për këtë faqe ose kërkim.</p>}
      <nav className={styles.pagination} aria-label="Faqet e regjistrimeve">
        {result.page > 1 && <button className="button" type="submit" name="page" value={Math.min(result.page - 1, pages)} disabled={pending}>Faqja e mëparshme</button>}
        {result.page < pages && <button className="button" type="submit" name="page" value={result.page + 1} disabled={pending}>Faqja tjetër</button>}
      </nav>
    </form>
  </>;
}
