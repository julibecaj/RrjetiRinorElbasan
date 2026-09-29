"use client";
import Link from "next/link";
import { useState } from "react";
import { useDemo } from "@/components/demo/DemoProvider";
import { occupiedPlaces } from "@/lib/demo-state";
import { PageHeading } from "@/components/ui/PageHeading";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatDate } from "@/lib/format";
import type { ApplicationStatus } from "@/types";
export function ApplicationManager({ id }: { id: string }) {
  const { state, dispatch } = useDemo();
  const [filter, setFilter] = useState("all");
  const [message, setMessage] = useState("");
  const event = state.events.find((e) => e.id === id);
  if (!event)
    return (
      <EmptyState
        title="Aktiviteti nuk u gjet"
        description="Kthehu te lista e aktiviteteve."
        href="/admin/events"
      />
    );
  const apps = state.applications.filter(
    (a) => a.eventId === id && (filter === "all" || a.status === filter),
  );
  function change(appId: string, status: ApplicationStatus) {
    dispatch({ type: "application-status", id: appId, status });
    setMessage(
      status === "attended"
        ? `Pjesëmarrja u konfirmua. U dhanë ${event!.points} pikë dhe u përditësua profili.`
        : status === "accepted"
          ? "Aplikimi u pranua."
          : "Aplikimi u refuzua.",
    );
  }
  return (
    <>
      <Link href="/admin/events" className="text-link">
        ← Aktivitetet
      </Link>
      <PageHeading eyebrow="MENAXHO APLIKIMET" title={event.title}>
        <p>
          {occupiedPlaces(state, id)} / {event.capacity} vende të konfirmuara ·{" "}
          {event.points} pikë për pjesëmarrje
        </p>
      </PageHeading>
      <label className="compact-filter">
        Statusi
        <select value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="all">Të gjitha</option>
          <option value="pending">Në pritje</option>
          <option value="accepted">Pranuar</option>
          <option value="rejected">Refuzuar</option>
          <option value="attended">Pjesëmarrës</option>
        </select>
      </label>
      {message && (
        <p role="status" className="notice success">
          {message}
        </p>
      )}
      {event.status === "cancelled" && (
        <p className="notice">
          Ky aktivitet është arkivuar. Historiku është vetëm për lexim.
        </p>
      )}
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Aplikanti</th>
              <th>Kontakti</th>
              <th>Data</th>
              <th>Statusi</th>
              <th>Veprime</th>
            </tr>
          </thead>
          <tbody>
            {apps.map((a) => {
              const user = state.users.find((u) => u.id === a.userId)!;
              return (
                <tr key={a.id}>
                  <td>
                    <Link
                      href={`/admin/users/${user.id}`}
                      className="text-link"
                    >
                      {user.firstName} {user.lastName}
                    </Link>
                    <details>
                      <summary>Motivimi</summary>
                      <p>{a.motivation}</p>
                    </details>
                  </td>
                  <td>
                    {user.email}
                    <small>{user.phone}</small>
                  </td>
                  <td>{formatDate(a.date)}</td>
                  <td>
                    <Badge status={a.status} />
                  </td>
                  <td>
                    {a.status === "attended" ? (
                      <span className="point-amount">
                        +{a.awardedPoints ?? 0} pikë
                      </span>
                    ) : (
                      <div className="table-actions">
                        {a.status !== "accepted" && (
                          <button
                            disabled={
                              event.status === "cancelled" ||
                              occupiedPlaces(state, id) >= event.capacity
                            }
                            onClick={() => change(a.id, "accepted")}
                          >
                            Prano
                          </button>
                        )}
                        {a.status !== "rejected" && (
                          <button
                            disabled={event.status === "cancelled"}
                            onClick={() => change(a.id, "rejected")}
                          >
                            Refuzo
                          </button>
                        )}
                        {a.status === "accepted" && (
                          <button
                            disabled={event.status === "cancelled"}
                            onClick={() => change(a.id, "attended")}
                          >
                            Konfirmo pjesëmarrjen
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {!apps.length && (
        <EmptyState
          title="Asnjë aplikim në këtë listë"
          description="Aplikimet e reja nga faqja publike do të shfaqen këtu."
        />
      )}
      <p className="help-text">
        Konfirmimi i pjesëmarrjes jep pikë vetëm një herë. Në demo mund të
        simulosh edhe përfundimin e një aktiviteti të ardhshëm.
      </p>
    </>
  );
}
