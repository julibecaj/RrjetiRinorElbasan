"use client";
import Link from "next/link";
import { useDemo } from "@/components/demo/DemoProvider";
import { Container } from "@/components/ui/Container";
import { PageHeading } from "@/components/ui/PageHeading";
import { EmptyState } from "@/components/ui/EmptyState";
import { categories } from "@/lib/format";
import type { Opportunity } from "@/types";
import { OpportunityCard } from "./OpportunityCard";
export function OpportunitiesPage({
  category,
}: {
  category?: Opportunity["category"];
}) {
  const { state } = useDemo();
  const items = state.opportunities.filter(
    (o) => o.status === "published" && (!category || o.category === category),
  );
  return (
    <Container className="page-content">
      <PageHeading
        eyebrow="HAPI YT I RADHËS"
        title={category ? categories[category] : "Mundësi për ty"}
      >
        <p>
          Zbulo punë, edukim, vullnetarizëm dhe projekte në komunitetin tënd.
        </p>
      </PageHeading>
      <nav className="tabs category-tabs" aria-label="Kategoritë e mundësive">
        <Link
          href="/opportunities"
          aria-current={!category ? "page" : undefined}
        >
          Të gjitha
        </Link>
        {Object.entries(categories)
          .filter(([key]) => key !== "events")
          .map(([key, label]) => (
            <Link
              href={`/opportunities/${key}`}
              key={key}
              aria-current={category === key ? "page" : undefined}
            >
              {label}
            </Link>
          ))}
      </nav>
      <div className="opportunity-grid">
        {items.map((o) => (
          <OpportunityCard key={o.id} opportunity={o} />
        ))}
      </div>
      {!items.length && (
        <EmptyState
          title="Mundësi të reja së shpejti"
          description="Shiko edhe kategoritë e tjera."
          href="/opportunities"
          label="Të gjitha mundësitë"
        />
      )}
    </Container>
  );
}
