import type { Metadata } from "next";
import { connection } from "next/server";
import { isRegistrationMode } from "@/lib/registration-mode";
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
export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // Read the server flag at request time so a runtime flag change cannot leave
  // pre-rendered full-site navigation on the campaign registration page.
  await connection();
  const registrationMode = isRegistrationMode();
  return (
    <html lang="sq" className={`${bodyFont.variable} ${headingFont.variable}`}>
      <body>
        <a className="skip-link" href="#main-content">
          Kalo te përmbajtja
        </a>
        <DemoProvider>
          <SiteShell registrationMode={registrationMode}>{children}</SiteShell>
        </DemoProvider>
      </body>
    </html>
  );
}
