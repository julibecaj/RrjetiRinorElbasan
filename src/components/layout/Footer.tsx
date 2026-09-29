import Image from "next/image";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
export function Footer() {
  return (
    <footer className="site-footer">
      <Container className="footer-grid">
        <Link href="/" className="footer-brand">
          <Image
            src="/images/rre-logo.png"
            alt="Rrjeti Rinor Elbasan"
            width={84}
            height={84}
          />
          <span>
            Zëri yt,
            <br />
            hapësira jote.
          </span>
        </Link>
        <nav aria-label="Navigimi në fund të faqes">
          <Link href="/">Home</Link>
          <Link href="/about">About</Link>
          <Link href="/events">Events</Link>
          <Link href="/opportunities">Mundësi</Link>
          <Link href="/propose-idea">Propozo një ide</Link>
          <Link href="/admin">Admin · demo</Link>
        </nav>
        <div className="footer-info">
          <p>Për të rinjtë e Elbasanit.</p>
          <p>Me mbështetjen e komunitetit.</p>
          <span className="demo-label">
            <span /> Version demonstrues
          </span>
        </div>
      </Container>
    </footer>
  );
}
