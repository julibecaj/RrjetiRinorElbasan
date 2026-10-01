"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { useDemo } from "@/components/demo/DemoProvider";
import { Dialog } from "@/components/ui/Dialog";
export function AdminLayout({ children }: { children: ReactNode }) {
  const path = usePathname();
  const { dispatch } = useDemo();
  const [reset, setReset] = useState(false);
  const [message, setMessage] = useState("");
  const [resetVersion, setResetVersion] = useState(0);
  // The real registration admin pages have their own server-protected UI.
  if (path === "/admin/login" || path === "/admin/registrations") return <>{children}</>;
  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <p className="eyebrow">RRJETI RINOR ELBASAN</p>
        <h2>Administrimi</h2>
        <p className="help-text">Panel demonstrues</p>
        <nav aria-label="Administrimi">
          {[
            ["/admin", "Përmbledhje"],
            ["/admin/events", "Aktivitetet"],
            ["/admin/users", "Përdoruesit"],
            ["/admin/opportunities", "Mundësitë"],
            ["/admin/content", "Përmbajtja"],
          ].map(([href, label]) => (
            <Link
              key={href}
              href={href}
              aria-current={
                (href === "/admin" ? path === href : path.startsWith(href))
                  ? "page"
                  : undefined
              }
            >
              {label}
            </Link>
          ))}
        </nav>
        <Link className="text-link" href="/profile">
          Shiko profilin e përdoruesit →
        </Link>
        <button
          className="text-link reset-button"
          onClick={() => setReset(true)}
        >
          Rivendos të dhënat demo
        </button>
      </aside>
      <div className="admin-content" key={resetVersion}>
        <div className="admin-notice">
          DEMO · Pa leje reale administrimi. Ndryshimet humbasin pas
          rifreskimit.
        </div>
        {message && (
          <p className="notice success" role="status">
            {message}
          </p>
        )}
        {children}
      </div>
      {reset && (
        <Dialog title="Rivendos demonstrimin?" onClose={() => setReset(false)}>
          <p>
            Të gjitha ndryshimet e këtij sesioni do të zëvendësohen me të dhënat
            fillestare shembull.
          </p>
          <div className="button-row">
            <button className="button" onClick={() => setReset(false)}>
              Anulo
            </button>
            <button
              className="button button-primary"
              onClick={() => {
                dispatch({ type: "reset" });
                setResetVersion((version) => version + 1);
                setReset(false);
                setMessage("Të dhënat fillestare u rivendosën.");
              }}
            >
              Rivendos
            </button>
          </div>
        </Dialog>
      )}
    </div>
  );
}
