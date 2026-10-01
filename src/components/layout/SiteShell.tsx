"use client";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { Header } from "./Header";
import { Footer } from "./Footer";
export function SiteShell({ children, registrationMode = false }: { children: ReactNode; registrationMode?: boolean }) {
  const pathname = usePathname();
  const home = pathname === "/";
  return (
    <>
      <Header registrationMode={registrationMode} />
      <main id="main-content" className={home ? "" : "inner-main"}>
        {children}
      </main>
      <Footer registrationMode={registrationMode} />
    </>
  );
}
