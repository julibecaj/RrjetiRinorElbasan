"use client";
import Link from "next/link";
import { useState } from "react";
import { useDemo } from "@/components/demo/DemoProvider";
import { Badge } from "@/components/ui/Badge";
import { PageHeading } from "@/components/ui/PageHeading";
import { Dialog } from "@/components/ui/Dialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { categories, formatDate } from "@/lib/format";
import type { YouthEvent } from "@/types";
export function AdminEvents() {
  const { state, dispatch } = useDemo();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [archive, setArchive] = useState<YouthEvent | null>(null);
  const items = state.events.filter(
    (e) =>
      e.title.toLowerCase().includes(query.toLowerCase()) &&
      (status === "all" || e.status === status),
  );
  return (
    <>
      <div className="section-heading">
        <PageHeading title="Aktivitetet" />
        <Link className="button button-primary" href="/admin/events/new">
          + Krijo aktivitet
        </Link>
      </div>
      <div className="search-controls">
        <label>
          Kërko aktivitet
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        <label>
          Statusi
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="all">Të gjitha</option>
            {["draft", "published", "full", "completed", "cancelled"].map(
              (s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ),
            )}
          </select>
        </label>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Titulli</th>
              <th>Data / kategoria</th>
              <th>Kapaciteti</th>
              <th>Aplikime</th>
              <th>Statusi</th>
              <th>Veprime</th>
            </tr>
          </thead>
          <tbody>
            {items.map((e) => (
              <tr key={e.id}>
                <td>{e.title}</td>
                <td>
                  {formatDate(e.date)}
                  <small>{categories[e.category]}</small>
                </td>
                <td>{e.capacity}</td>
                <td>
                  {state.applications.filter((a) => a.eventId === e.id).length}
                </td>
                <td>
                  <Badge status={e.status} />
                </td>
                <td>
                  <div className="table-actions">
                    <Link href={`/events/${e.id}`}>Shiko</Link>
                    <Link href={`/admin/events/${e.id}/edit`}>Ndrysho</Link>
                    <Link href={`/admin/events/${e.id}/applications`}>
                      Aplikimet
                    </Link>
                    {e.status !== "cancelled" && (
                      <button onClick={() => setArchive(e)}>Arkivo</button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!items.length && (
        <EmptyState
          title="Asnjë aktivitet"
          description="Ndrysho filtrat ose krijo një aktivitet të ri."
        />
      )}
      {archive && (
        <Dialog title="Arkivo aktivitetin?" onClose={() => setArchive(null)}>
          <p>
            “{archive.title}” do të shënohet si i anuluar dhe do të hiqet nga
            lista publike. Historiku i aplikimeve dhe pikëve ruhet në demo.
          </p>
          <div className="button-row">
            <button className="button" onClick={() => setArchive(null)}>
              Anulo
            </button>
            <button
              className="button button-primary"
              onClick={() => {
                dispatch({
                  type: "event",
                  event: { ...archive, status: "cancelled" },
                });
                setArchive(null);
              }}
            >
              Arkivo aktivitetin
            </button>
          </div>
        </Dialog>
      )}
    </>
  );
}
