"use client";
import Link from "next/link";
import { useDemo } from "@/components/demo/DemoProvider";
import { PageHeading } from "@/components/ui/PageHeading";
import { Badge } from "@/components/ui/Badge";
import { DEMO_TODAY, formatDate } from "@/lib/format";
export function AdminDashboard() {
  const { state } = useDemo();
  const upcoming = state.events
    .filter(
      (e) => e.date >= DEMO_TODAY && ["published", "full"].includes(e.status),
    )
    .sort((a, b) => a.date.localeCompare(b.date));
  const stats = [
    [state.users.length, "Përdorues"],
    [upcoming.length, "Aktivitete aktive"],
    [state.applications.length, "Aplikime"],
    [
      state.applications.filter((a) => a.status === "attended").length,
      "Pjesëmarrje",
    ],
    [
      state.points
        .filter((p) => p.amount > 0)
        .reduce((s, p) => s + p.amount, 0),
      "Pikë të dhëna",
    ],
  ];
  return (
    <>
      <div className="section-heading">
        <PageHeading title="Mirë se erdhët." eyebrow="PANELI I ADMINISTRIMIT" />
        <Link href="/admin/events/new" className="button button-primary">
          + Krijo aktivitet
        </Link>
      </div>
      <div className="stats-grid admin-stats">
        {stats.map(([n, label]) => (
          <div className="stat" key={label}>
            <strong>{n}</strong>
            <span>{label}</span>
          </div>
        ))}
      </div>
      <section className="section-space">
        <div className="section-heading">
          <h2>Aktivitetet e ardhshme</h2>
          <Link href="/admin/events" className="text-link">
            Shiko të gjitha →
          </Link>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Aktiviteti</th>
                <th>Data</th>
                <th>Statusi</th>
                <th>Menaxho</th>
              </tr>
            </thead>
            <tbody>
              {upcoming.map((e) => (
                <tr key={e.id}>
                  <td>{e.title}</td>
                  <td>{formatDate(e.date)}</td>
                  <td>
                    <Badge status={e.status} />
                  </td>
                  <td>
                    <Link
                      className="text-link"
                      href={`/admin/events/${e.id}/applications`}
                    >
                      Aplikimet →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <div className="two-column section-space">
        <section>
          <h2>Aplikimet e fundit</h2>
          <ul className="activity-list">
            {state.applications
              .slice()
              .reverse()
              .slice(0, 5)
              .map((a) => {
                const u = state.users.find((u) => u.id === a.userId);
                return (
                  <li key={a.id}>
                    <Link href={`/admin/events/${a.eventId}/applications`}>
                      <strong>
                        {u?.firstName} {u?.lastName}
                      </strong>
                      <p>
                        {state.events.find((e) => e.id === a.eventId)?.title}
                      </p>
                    </Link>
                    <Badge status={a.status} />
                  </li>
                );
              })}
          </ul>
        </section>
        <section>
          <h2>Përdoruesit e fundit</h2>
          <ul className="activity-list">
            {state.users
              .slice()
              .reverse()
              .slice(0, 5)
              .map((u) => (
                <li key={u.id}>
                  <Link href={`/admin/users/${u.id}`}>
                    <strong>
                      {u.firstName} {u.lastName}
                    </strong>
                    <p>{u.email}</p>
                  </Link>
                  <span className="help-text">{formatDate(u.joined)}</span>
                </li>
              ))}
          </ul>
        </section>
      </div>
    </>
  );
}
