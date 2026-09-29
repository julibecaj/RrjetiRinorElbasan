import { Container } from "@/components/ui/Container";
import { EmptyState } from "@/components/ui/EmptyState";
export default function NotFound() {
  return (
    <Container className="page-content">
      <EmptyState
        title="Kjo faqe nuk u gjet"
        description="Kthehu në kryefaqe dhe zbulo mundësitë e Rrjetit Rinor Elbasan."
        href="/"
        label="Kryefaqja"
      />
    </Container>
  );
}
