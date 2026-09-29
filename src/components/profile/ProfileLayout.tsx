"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useDemo } from "@/components/demo/DemoProvider";
import { Container } from "@/components/ui/Container";
export function ProfileLayout({ children }: { children: ReactNode }) {
  const path = usePathname();
  const { state, dispatch } = useDemo();
  return (
    <Container className="page-content">
      <div className="section-heading">
        <p className="eyebrow">HAPËSIRA IME</p>
        <Link className="text-link" href="/propose-idea">
          + Propozo një ide
        </Link>
      </div>
      {!state.currentUserId && (
        <div className="notice">
          Po shikon profilin shembull të Erës.{" "}
          <button
            className="text-link"
            onClick={() => dispatch({ type: "login", userId: "u1" })}
          >
            Përdor këtë profil demo
          </button>
        </div>
      )}
      <nav className="tabs profile-tabs" aria-label="Profili">
        {[
          ["/profile", "Përmbledhje"],
          ["/profile/applications", "Aplikimet"],
          ["/profile/activities", "Aktivitetet"],
          ["/profile/points", "Pikët"],
          ["/profile/settings", "Cilësimet"],
        ].map(([href, label]) => (
          <Link
            href={href}
            key={href}
            aria-current={path === href ? "page" : undefined}
          >
            {label}
          </Link>
        ))}
      </nav>
      {children}
    </Container>
  );
}
