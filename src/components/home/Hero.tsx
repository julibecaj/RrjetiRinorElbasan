import Link from "next/link";
import { Container } from "@/components/ui/Container";
// Replace the neutral reference placeholder with the original collage when supplied.
export function Hero() {
  return (
    <section className="hero" aria-labelledby="hero-title">
      <Container className="hero-inner">
        <div
          className="hero-placeholder"
          role="img"
          aria-label="Hapësirë për fotografinë e aktiviteteve të Rrjetit Rinor Elbasan"
        >
          <span>RRE / TË RINJTË E ELBASANIT</span>
        </div>
        <div className="hero-copy">
          <h1 id="hero-title">Rrjeti Rinor Elbasan</h1>
          <p>Zëri yt, Hapësira jote.</p>
          <Link href="/about" className="button hero-button">
            Më shumë rreth nesh
          </Link>
        </div>
      </Container>
    </section>
  );
}
