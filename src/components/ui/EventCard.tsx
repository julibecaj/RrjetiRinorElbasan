import Link from "next/link";
import type { YouthEvent } from "@/types";
import { monthLabel } from "@/lib/format";
export function EventCard({ event }: { event: YouthEvent }) {
  return (
    <article className="event-card" aria-labelledby={`title-${event.id}`}>
      <time className="event-date" dateTime={event.date}>
        <span>{Number(event.date.slice(8))}</span>
        <span>{monthLabel(event.date)}</span>
      </time>
      <div className="event-copy">
        <h3 id={`title-${event.id}`}>
          <Link href={`/events/${event.id}`}>{event.title}</Link>
        </h3>
        <p>{event.description}</p>
      </div>
      <Link className="button apply-button" href={`/events/${event.id}`}>
        {event.status === "completed" ? "SHIKO" : "APLIKO"}
        <span className="sr-only">: {event.title}</span>
      </Link>
    </article>
  );
}
