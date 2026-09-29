import { Container } from "@/components/ui/Container";
import { Icon } from "@/components/ui/Icon";
export function YouthSection() {
  return (
    <section className="youth-section" aria-labelledby="youth-title">
      <div className="youth-banner">
        <Container>
          <h2 id="youth-title">
            Kjo faqe është vetëm për ty, nga <strong>15–29 vjeç!</strong>
          </h2>
        </Container>
      </div>
      <div
        className="video-placeholder"
        role="img"
        aria-label="Video prezantuese, së shpejti"
      >
        <span className="play-symbol">
          <Icon name="play" />
        </span>
        <p>Njihu me Rrjetin Rinor Elbasan</p>
        <span>Video prezantuese · Së shpejti</span>
      </div>
    </section>
  );
}
