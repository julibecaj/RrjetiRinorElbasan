"use client";
import { useState, type FormEvent } from "react";
import { useDemo } from "@/components/demo/DemoProvider";
import type { Opportunity } from "@/types";
import { categories, DEMO_TODAY, formatDate } from "@/lib/format";
import { PageHeading } from "@/components/ui/PageHeading";
import { Dialog } from "@/components/ui/Dialog";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
const blank: Opportunity = {
  id: "",
  title: "",
  organization: "Rrjeti Rinor Elbasan",
  category: "jobs",
  description: "",
  details: "",
  deadline: DEMO_TODAY,
  location: "Elbasan",
  status: "draft",
};
export function AdminOpportunities() {
  const { state, dispatch } = useDemo();
  const [editing, setEditing] = useState<Opportunity | null>(null);
  const [query, setQuery] = useState("");
  const [message, setMessage] = useState("");
  const items = state.opportunities.filter((o) =>
    o.title.toLowerCase().includes(query.toLowerCase()),
  );
  function save(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    dispatch({
      type: "opportunity",
      opportunity: {
        id: editing?.id || crypto.randomUUID(),
        title: String(data.get("title")).trim(),
        organization: String(data.get("organization")).trim(),
        description: String(data.get("description")).trim(),
        details: String(data.get("details")).trim(),
        category: data.get("category") as Opportunity["category"],
        deadline: String(data.get("deadline")),
        location: String(data.get("location")).trim(),
        status: data.get("status") as Opportunity["status"],
      },
    });
    setEditing(null);
    setMessage(
      "Mundësia u ruajt. Mundësitë e publikuara shfaqen menjëherë në faqen publike.",
    );
  }
  return (
    <>
      <div className="section-heading">
        <PageHeading title="Mundësitë" />
        <button
          className="button button-primary"
          onClick={() => setEditing(blank)}
        >
          + Shto mundësi
        </button>
      </div>
      <label className="compact-filter">
        Kërko mundësi
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </label>
      {message && (
        <p className="notice success" role="status">
          {message}
        </p>
      )}
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Mundësia</th>
              <th>Kategoria</th>
              <th>Afati</th>
              <th>Statusi</th>
              <th>Veprime</th>
            </tr>
          </thead>
          <tbody>
            {items.map((o) => (
              <tr key={o.id}>
                <td>
                  {o.title}
                  <small>{o.organization}</small>
                </td>
                <td>{categories[o.category]}</td>
                <td>{formatDate(o.deadline)}</td>
                <td>
                  <Badge status={o.status} />
                </td>
                <td>
                  <div className="table-actions">
                    <button onClick={() => setEditing(o)}>Ndrysho</button>
                    <button
                      onClick={() => {
                        dispatch({
                          type: "opportunity",
                          opportunity: {
                            ...o,
                            status:
                              o.status === "archived" ? "draft" : "archived",
                          },
                        });
                        setMessage(
                          o.status === "archived"
                            ? "Mundësia u rikthye si draft."
                            : "Mundësia u arkivua. Mund ta rikthesh si draft.",
                        );
                      }}
                    >
                      {o.status === "archived" ? "Rikthe" : "Arkivo"}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!items.length && (
        <EmptyState
          title="Asnjë mundësi në listë"
          description="Ndrysho kërkimin ose shto një mundësi të re."
        />
      )}
      {editing && (
        <Dialog
          title={editing.id ? "Ndrysho mundësinë" : "Shto mundësi"}
          onClose={() => setEditing(null)}
        >
          <form className="form-stack" onSubmit={save}>
            <label>
              Titulli
              <input name="title" required defaultValue={editing.title} />
            </label>
            <label>
              Organizata
              <input
                name="organization"
                required
                defaultValue={editing.organization}
              />
            </label>
            <div className="two-column">
              <label>
                Kategoria
                <select name="category" defaultValue={editing.category}>
                  {Object.entries(categories)
                    .filter(([key]) => key !== "events")
                    .map(([key, label]) => (
                      <option key={key} value={key}>
                        {label}
                      </option>
                    ))}
                </select>
              </label>
              <label>
                Statusi
                <select name="status" defaultValue={editing.status}>
                  <option value="draft">Draft</option>
                  <option value="published">Publikuar</option>
                  <option value="archived">Arkivuar</option>
                </select>
              </label>
            </div>
            <label>
              Përshkrimi i shkurtër
              <textarea
                name="description"
                required
                rows={2}
                defaultValue={editing.description}
              />
            </label>
            <label>
              Detajet
              <textarea
                name="details"
                required
                rows={4}
                defaultValue={editing.details}
              />
            </label>
            <div className="two-column">
              <label>
                Afati
                <input
                  type="date"
                  name="deadline"
                  required
                  defaultValue={editing.deadline}
                />
              </label>
              <label>
                Vendndodhja
                <input
                  name="location"
                  required
                  defaultValue={editing.location}
                />
              </label>
            </div>
            <button type="submit" className="button button-primary">
              Ruaj mundësinë
            </button>
          </form>
        </Dialog>
      )}
    </>
  );
}
