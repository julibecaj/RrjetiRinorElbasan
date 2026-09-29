"use client";
import { useState } from "react";
import { useDemo } from "@/components/demo/DemoProvider";
import { Container } from "@/components/ui/Container";
import { PageHeading } from "@/components/ui/PageHeading";
import { EventCard } from "@/components/ui/EventCard";
import { OpportunityCard } from "@/components/opportunities/OpportunityCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { categories } from "@/lib/format";
const normalize = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
export function SearchPage() {
  const { state } = useDemo();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const match = (value: string) =>
    normalize(value).includes(normalize(query.trim()));
  const events = state.events.filter(
    (e) =>
      e.status !== "draft" &&
      e.status !== "cancelled" &&
      (category === "all" ||
        category === "events" ||
        e.category === category) &&
      match(`${e.title} ${e.description} ${e.location}`),
  );
  const opportunities = state.opportunities.filter(
    (o) =>
      o.status === "published" &&
      (category === "all" || o.category === category) &&
      match(`${o.title} ${o.description} ${o.organization} ${o.location}`),
  );
  return (
    <Container className="page-content">
      <PageHeading eyebrow="GJEJ MUNDËSINË TËNDE" title="Search" />
      <div className="search-controls">
        <label>
          Kërko aktivitete dhe mundësi
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="P.sh. AI, vullnetarizëm, dizajn…"
          />
        </label>
        <label>
          Kategoria
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="all">Të gjitha</option>
            {Object.entries(categories).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </label>
      </div>
      <p role="status" className="results-count">
        {events.length + opportunities.length} rezultate
        {query && ` për “${query}”`}
      </p>
      {events.length > 0 && (
        <section className="section-space">
          <h2>Aktivitete</h2>
          <div className="events-list">
            {events.map((e) => (
              <EventCard event={e} key={e.id} />
            ))}
          </div>
        </section>
      )}
      {opportunities.length > 0 && (
        <section className="section-space">
          <h2>Mundësi</h2>
          <div className="opportunity-grid">
            {opportunities.map((o) => (
              <OpportunityCard opportunity={o} key={o.id} />
            ))}
          </div>
        </section>
      )}
      {!events.length && !opportunities.length && (
        <EmptyState
          title="Nuk gjetëm rezultate"
          description="Provo një fjalë tjetër ose hiq filtrin e kategorisë."
        />
      )}
    </Container>
  );
}
