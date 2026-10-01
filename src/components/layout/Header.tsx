"use client";
import Image from "next/image";
import Link from "next/link";
import { useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { useDemo } from "@/components/demo/DemoProvider";
import { Container } from "@/components/ui/Container";

export function Header({ registrationMode = false }: { registrationMode?: boolean }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const { state, dispatch } = useDemo();
  const menuButton = useRef<HTMLButtonElement>(null);
  return (
    <header
      className={`site-header ${pathname !== "/" ? "interior-header" : ""}`}
      onKeyDown={(event) => {
        if (event.key === "Escape" && open) {
          setOpen(false);
          menuButton.current?.focus();
        }
      }}
    >
      <Container className="header-inner">
        <Link
          href={registrationMode ? "/register" : "/"}
          className="brand"
          aria-label={registrationMode ? "Këshilli Rinor Elbasan — Regjistrimi" : "Këshilli Rinor Elbasan — Kryefaqja"}
        >
          <span className="brand-logo">
            <Image
              src="/images/KRE WHITE BACK.svg"
              alt="Këshilli Rinor Elbasan"
              width={855}
              height={374}
              priority
            />
          </span>
        </Link>
        {!registrationMode && <><button
          ref={menuButton}
          className="menu-toggle"
          aria-expanded={open}
          aria-controls="primary-navigation"
          onClick={() => setOpen(!open)}
        >
          {open ? "Mbyll ×" : "Menu ☰"}
        </button>
        <nav
          id="primary-navigation"
          aria-label="Navigimi kryesor"
          className={`navigation ${open ? "is-open" : ""}`}
          onClick={() => setOpen(false)}
        >
          <div className="nav-links">
            {[
              ["/", "Home"],
              ["/about", "About"],
              ["/events", "Events"],
            ].map(([href, label]) => (
              <Link
                key={href}
                href={href}
                aria-current={pathname === href ? "page" : undefined}
              >
                {label}
              </Link>
            ))}
          </div>
          <div className="nav-actions">
            <Link href="/search">Search</Link>
            <Link
              className="login-link"
              href={state.currentUserId ? "/profile" : "/login"}
            >
              {state.currentUserId ? "Profili" : "Log In"}
            </Link>
            {state.currentUserId && (
              <button
                type="button"
                className="logout-button"
                onClick={() => dispatch({ type: "logout" })}
              >
                Dil
              </button>
            )}
          </div>
        </nav></>}
      </Container>
    </header>
  );
}
