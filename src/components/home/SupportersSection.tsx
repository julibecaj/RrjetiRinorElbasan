"use client";
import { useDemo } from "@/components/demo/DemoProvider";
import { Container } from "@/components/ui/Container";
export function SupportersSection() {
  const { state } = useDemo();
  return (
    <section className="supporters" aria-labelledby="supporters-title">
      <Container>
        <h2 id="supporters-title">Së bashku për të rinjtë.</h2>
        <p>Me mbështetjen e organizatave dhe komunitetit tonë.</p>
        <div className="supporter-list" aria-label="Organizata shembull">
          {state.content.supporters.map((name, i) => (
            <span key={`${i}-${name}`}>
              <span className="supporter-mark" aria-hidden="true">
                {name.slice(0, 1)}
              </span>
              {name}
            </span>
          ))}
        </div>
        <small>Partnerë ilustrues për versionin demonstrues</small>
      </Container>
    </section>
  );
}
