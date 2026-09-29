"use client";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { Header } from "./Header";
import { Footer } from "./Footer";
export function SiteShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const home = pathname === "/";
  return (
    <>
      <Header />
      <main id="main-content" className={home ? "" : "inner-main"}>
        {children}
      </main>
      <Footer />
    </>
  );
}
