import Image from "next/image";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
export function Footer({ registrationMode = false }: { registrationMode?: boolean }) {
  return (
    <footer className="site-footer">
      <Container className="footer-grid">
        <Link href={registrationMode ? "/register" : "/"} className="footer-brand">
          <Image
            src="/images/KRE BW.jpeg"
            alt="Këshilli Rinor Elbasan"
            width={1254}
            height={1254}
            sizes="(max-width: 640px) 65px, 84px"
          />
          <span>
            Zëri yt,
            <br />
            hapësira jote.
          </span>
        </Link>
        {!registrationMode && <nav aria-label="Navigimi në fund të faqes">
          <Link href="/">Home</Link>
          <Link href="/about">About</Link>
          <Link href="/events">Events</Link>
          <Link href="/opportunities">Mundësi</Link>
          <Link href="/propose-idea">Propozo një ide</Link>
          <Link href="/admin">Admin · demo</Link>
        </nav>}
        <div className="footer-info">
          <p>Për të rinjtë e Elbasanit.</p>
          <p>Me mbështetjen e komunitetit.</p>
          {!registrationMode && <span className="demo-label">
            <span /> Version demonstrues
          </span>}
        </div>
      </Container>
    </footer>
  );
}
