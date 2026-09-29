"use client";
import Link from "next/link";
import { useDemo } from "@/components/demo/DemoProvider";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatDate } from "@/lib/format";
export function ApplicationList({
  userId,
  attendedOnly = false,
}: {
  userId: string;
  attendedOnly?: boolean;
}) {
  const { state } = useDemo();
  const apps = state.applications.filter(
    (a) => a.userId === userId && (!attendedOnly || a.status === "attended"),
  );
  if (!apps.length)
    return (
      <EmptyState
        title={
          attendedOnly
            ? "Ende asnjë aktivitet i përfunduar"
            : "Ende asnjë aplikim"
        }
        description={
          attendedOnly
            ? "Aktivitetet shfaqen këtu pasi administratori konfirmon pjesëmarrjen."
            : "Zgjidh një aktivitet dhe bëhu pjesë."
        }
        href="/events"
      />
    );
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Aktiviteti</th>
            <th>Data</th>
            <th>Statusi</th>
            {attendedOnly && <th>Pikë</th>}
          </tr>
        </thead>
        <tbody>
          {apps.map((a) => {
            const event = state.events.find((e) => e.id === a.eventId);
            return (
              <tr key={a.id}>
                <td>
                  <Link className="text-link" href={`/events/${a.eventId}`}>
                    {event?.title ?? "Aktivitet"}
                  </Link>
                </td>
                <td>{formatDate(event?.date ?? a.date)}</td>
                <td>
                  <Badge status={a.status} />
                </td>
                {attendedOnly && <td>+{a.awardedPoints ?? 0}</td>}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
export function PointsList({ userId }: { userId: string }) {
  const { state } = useDemo();
  const points = state.points
    .filter((p) => p.userId === userId)
    .slice()
    .reverse();
  if (!points.length)
    return (
      <EmptyState
        title="Udhëtimi yt fillon këtu"
        description="Merr pjesë në aktivitete dhe mblidh pikë pasi pjesëmarrja konfirmohet."
        href="/events"
      />
    );
  return (
    <ul className="points-list">
      {points.map((p) => (
        <li key={p.id}>
          <div>
            <strong>{p.reason}</strong>
            <p>{formatDate(p.date)}</p>
          </div>
          <span className="point-amount">
            {p.amount > 0 ? "+" : ""}
            {p.amount}
          </span>
        </li>
      ))}
    </ul>
  );
}
