"use client";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { EventCard } from "@/components/ui/EventCard";
import { useDemo } from "@/components/demo/DemoProvider";
export function LatestEvents() {
  const { state } = useDemo();
  const events = state.events
    .filter((e) => e.status === "published" || e.status === "full")
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 3);
  return (
    <section
      className="latest-events"
      id="latest"
      aria-labelledby="latest-title"
    >
      <Container>
        <h2 id="latest-title">Latest from us</h2>
        <div className="section-heading">
          <p className="section-label">EVENTS LIST</p>
          <Link className="text-link" href="/events">
            Të gjitha aktivitetet →
          </Link>
        </div>
        <div className="events-list">
          {events.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      </Container>
    </section>
  );
}
