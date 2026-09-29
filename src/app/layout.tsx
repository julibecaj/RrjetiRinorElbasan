import type { Metadata } from "next";
import { DM_Sans, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { DemoProvider } from "@/components/demo/DemoProvider";
import { SiteShell } from "@/components/layout/SiteShell";

const bodyFont = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin", "latin-ext"],
  display: "swap",
});
const headingFont = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin", "latin-ext"],
  display: "swap",
});
export const metadata: Metadata = {
  title: "Rrjeti Rinor Elbasan | Zëri yt, Hapësira jote.",
  description:
    "Hapësira e të rinjve të Elbasanit. Zbulo aktivitete, mundësi edukimi, punësimi dhe vullnetarizmi.",
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="sq" className={`${bodyFont.variable} ${headingFont.variable}`}>
      <body>
        <a className="skip-link" href="#main-content">
          Kalo te përmbajtja
        </a>
        <DemoProvider>
          <SiteShell>{children}</SiteShell>
        </DemoProvider>
      </body>
    </html>
  );
}
