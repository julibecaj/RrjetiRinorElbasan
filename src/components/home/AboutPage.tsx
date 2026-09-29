"use client";
import Link from "next/link";
import { useDemo } from "@/components/demo/DemoProvider";
import { Container } from "@/components/ui/Container";
import { PageHeading } from "@/components/ui/PageHeading";
import { SupportersSection } from "./SupportersSection";
export function AboutPage() {
  const { state } = useDemo();
  return (
    <>
      <Container className="page-content">
        <PageHeading eyebrow="RRJETI RINOR ELBASAN" title="About Us">
          <p>
            Një hapësirë e përbashkët për të rinjtë, idetë dhe qytetin tonë.
          </p>
        </PageHeading>
        <section className="about-row">
          <div>
            <p className="eyebrow">WHO WE ARE</p>
            <h2>Zëri yt ka vend këtu.</h2>
            <p>
              Rrjeti Rinor Elbasan lidh të rinjtë e moshës 15–29 vjeç me mundësi
              për të mësuar, për t’u angazhuar dhe për të kontribuar në
              komunitet.
            </p>
            <p>
              Këtu gjen aktivitete, nisma vullnetare dhe njerëz që duan ta bëjnë
              qytetin më të mirë.
            </p>
          </div>
          <div className="about-visual">
            <span>15–29</span>
            <p>vjeç · ide pa kufij</p>
          </div>
        </section>
        <section className="about-row reverse">
          <div>
            <p className="eyebrow">WHAT WE DO</p>
            <h2>Mundësi që na bëjnë bashkë.</h2>
            <p>
              Organizojmë takime, workshope dhe nisma lokale. Ndajmë mundësi
              punësimi, edukimi dhe projekte ku çdo i ri mund të marrë pjesë.
            </p>
            <Link href="/opportunities" className="text-link">
              Eksploro mundësitë →
            </Link>
          </div>
          <div className="about-visual cyan-visual">
            <span>Ne + ti</span>
            <p>një komunitet më i fortë</p>
          </div>
        </section>
        <div className="two-column">
          <section className="info-panel">
            <h2>Misioni ynë</h2>
            <p>{state.content.mission}</p>
          </section>
          <section className="info-panel">
            <h2>Vizioni ynë</h2>
            <p>{state.content.vision}</p>
          </section>
        </div>
      </Container>
      <SupportersSection />
    </>
  );
}
