"use client";
import Link from "next/link";
import { useState, type FormEvent } from "react";
import { useDemo } from "@/components/demo/DemoProvider";
import { userPoints } from "@/lib/demo-state";
import { DEMO_TODAY, formatDate } from "@/lib/format";
import { PageHeading } from "@/components/ui/PageHeading";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  ApplicationList,
  PointsList,
} from "@/components/profile/ProfileTables";

export function AdminUsers() {
  const { state } = useDemo();
  const [query, setQuery] = useState("");
  const users = state.users.filter((u) =>
    `${u.firstName} ${u.lastName} ${u.email}`
      .toLowerCase()
      .includes(query.toLowerCase()),
  );
  return (
    <>
      <PageHeading title="Përdoruesit">
        <p>Profilet, angazhimi dhe pikët e komunitetit.</p>
      </PageHeading>
      <label className="compact-filter">
        Kërko përdorues
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Emër ose email"
        />
      </label>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Emri</th>
              <th>Kontakti</th>
              <th>Pikë</th>
              <th>Aplikime</th>
              <th>Pjesëmarrje</th>
              <th>Detaje</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td>
                  {u.firstName} {u.lastName}
                </td>
                <td>
                  {u.email}
                  <small>{u.phone}</small>
                </td>
                <td>{userPoints(state, u.id)}</td>
                <td>
                  {state.applications.filter((a) => a.userId === u.id).length}
                </td>
                <td>
                  {
                    state.applications.filter(
                      (a) => a.userId === u.id && a.status === "attended",
                    ).length
                  }
                </td>
                <td>
                  <Link className="text-link" href={`/admin/users/${u.id}`}>
                    Shiko profilin →
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!users.length && (
        <EmptyState
          title="Nuk u gjet asnjë përdorues"
          description="Provo një emër ose email tjetër."
        />
      )}
    </>
  );
}

export function AdminUserDetail({ id }: { id: string }) {
  const { state, dispatch } = useDemo();
  const [message, setMessage] = useState("");
  const user = state.users.find((u) => u.id === id);
  if (!user)
    return (
      <EmptyState
        title="Profili nuk u gjet"
        description="Ky profil nuk ekziston në këtë sesion."
        href="/admin/users"
        label="Të gjithë përdoruesit"
      />
    );
  function adjustPoints(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const amount = Number(data.get("amount"));
    if (
      !Number.isInteger(amount) ||
      amount === 0 ||
      userPoints(state, id) + amount < 0
    ) {
      setMessage(
        "Jep një numër të plotë, jo zero. Bilanci nuk mund të bëhet negativ.",
      );
      return;
    }
    dispatch({
      type: "points",
      transaction: {
        id: crypto.randomUUID(),
        userId: id,
        amount,
        reason: String(data.get("reason")).trim(),
        date: DEMO_TODAY,
      },
    });
    e.currentTarget.reset();
    setMessage("Rregullimi i pikëve u regjistrua në historikun demo.");
  }
  return (
    <>
      <Link className="text-link" href="/admin/users">
        ← Përdoruesit
      </Link>
      <PageHeading
        title={`${user.firstName} ${user.lastName}`}
        eyebrow="PROFILI I PËRDORUESIT"
      />
      <div className="two-column">
        <div className="info-panel">
          <dl className="detail-list">
            <div>
              <dt>Email</dt>
              <dd>{user.email}</dd>
            </div>
            <div>
              <dt>Telefon</dt>
              <dd>{user.phone}</dd>
            </div>
            <div>
              <dt>Regjistruar</dt>
              <dd>{formatDate(user.joined)}</dd>
            </div>
            <div>
              <dt>Bilanci</dt>
              <dd>{userPoints(state, id)} pikë</dd>
            </div>
          </dl>
        </div>
        <form className="form-stack info-panel" onSubmit={adjustPoints}>
          <h2>Rregullo pikët</h2>
          <label>
            Pikë (+ ose −)
            <input
              type="number"
              name="amount"
              min={-1000}
              max={1000}
              required
            />
          </label>
          <label>
            Arsyeja
            <input name="reason" required minLength={5} maxLength={160} />
          </label>
          <button className="button" type="submit">
            Regjistro rregullimin
          </button>
          <p className="help-text" role="status">
            {message}
          </p>
        </form>
      </div>
      <section className="section-space">
        <h2>Historiku i aplikimeve</h2>
        <ApplicationList userId={id} />
      </section>
      <section className="section-space">
        <h2>Aktivitete të ndjekura</h2>
        <ApplicationList userId={id} attendedOnly />
      </section>
      <section className="section-space">
        <h2>Historiku i pikëve</h2>
        <PointsList userId={id} />
      </section>
    </>
  );
}
