"use client";
import Image from "next/image";
import Link from "next/link";
import { useState, type FormEvent } from "react";
import { useDemo } from "@/components/demo/DemoProvider";
import { occupiedPlaces } from "@/lib/demo-state";
import { categories, DEMO_TODAY, formatDate } from "@/lib/format";
import { Container } from "@/components/ui/Container";
import { PageHeading } from "@/components/ui/PageHeading";
import { Badge } from "@/components/ui/Badge";
import { Dialog } from "@/components/ui/Dialog";
import { EventCard } from "@/components/ui/EventCard";
import { EmptyState } from "@/components/ui/EmptyState";
export function EventDetail({ id }: { id: string }) {
  const { state, dispatch } = useDemo();
  const [showForm, setShowForm] = useState(false);
  const [success, setSuccess] = useState(false);
  const event = state.events.find((e) => e.id === id);
  const user = state.users.find((u) => u.id === state.currentUserId);
  const application = state.applications.find(
    (a) => a.eventId === id && a.userId === user?.id,
  );
  if (!event)
    return (
      <Container className="page-content">
        <EmptyState
          title="Aktiviteti nuk u gjet"
          description="Ky aktivitet mund të mos ekzistojë në këtë sesion demo."
          href="/events"
        />
      </Container>
    );
  const available = Math.max(0, event.capacity - occupiedPlaces(state, id));
  const canApply =
    event.status === "published" && event.date >= DEMO_TODAY && available > 0;
  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!user || !canApply) return;
    const data = new FormData(e.currentTarget);
    dispatch({
      type: "user",
      user: { ...user, phone: String(data.get("phone")).trim() },
    });
    dispatch({
      type: "apply",
      application: {
        id: crypto.randomUUID(),
        userId: user.id,
        eventId: id,
        date: DEMO_TODAY,
        status: "pending",
        motivation: String(data.get("motivation")).trim(),
      },
    });
    setShowForm(false);
    setSuccess(true);
  }
  return (
    <Container className="page-content">
      <Link className="text-link" href="/events">
        ← Të gjitha aktivitetet
      </Link>
      <PageHeading eyebrow={categories[event.category]} title={event.title}>
        <Badge status={event.status} />
      </PageHeading>
      <div className={`event-banner banner-${event.category}`}>
        {event.image ? (
          <Image
            src={event.image}
            alt={event.title}
            fill
            unoptimized
            sizes="(max-width: 768px) 100vw, 1200px"
          />
        ) : (
          <>
            <span className="banner-initial">RRE</span>
            <span>Hapësira jonë. Mundësitë tona.</span>
          </>
        )}
      </div>
      <div className="detail-grid">
        <section>
          <h2>Rreth aktivitetit</h2>
          <p className="lead">{event.description}</p>
          <p>{event.fullDescription}</p>
          <div className="inline-callout">
            <span>+{event.points} pikë pas konfirmimit të pjesëmarrjes</span>
            <Link href="/profile/points" className="text-link">
              Si funksionojnë pikët →
            </Link>
          </div>
          <h3>Organizatori</h3>
          <p>{event.organizer}</p>
        </section>
        <aside className="info-panel">
          <dl className="detail-list">
            <div>
              <dt>Data</dt>
              <dd>{formatDate(event.date)}</dd>
            </div>
            <div>
              <dt>Ora</dt>
              <dd>{event.time}</dd>
            </div>
            <div>
              <dt>Vendndodhja</dt>
              <dd>{event.location}</dd>
            </div>
            <div>
              <dt>Kapaciteti</dt>
              <dd>{event.capacity} persona</dd>
            </div>
            <div>
              <dt>Pjesëmarrës të konfirmuar</dt>
              <dd>{occupiedPlaces(state, id)}</dd>
            </div>
            <div>
              <dt>Vende të lira</dt>
              <dd>{event.status === "full" ? 0 : available}</dd>
            </div>
          </dl>
          {application ? (
            <div className="application-state">
              <p>Aplikimi yt</p>
              <Badge status={application.status} />
              <Link href="/profile/applications" className="text-link">
                Shiko aplikimet →
              </Link>
            </div>
          ) : (
            <button
              className="button button-primary full-width"
              disabled={!canApply}
              onClick={() => setShowForm(true)}
            >
              {canApply ? "APLIKO" : "Aplikimet janë mbyllur"}
            </button>
          )}
          <p className="help-text">
            Pjesëmarrja është falas. Aplikimi shqyrtohet nga organizatori.
          </p>
        </aside>
      </div>
      {success && (
        <div className="notice success" role="status">
          Aplikimi demo u dërgua dhe është në pritje.{" "}
          <Link className="text-link" href="/profile/applications">
            Shiko statusin
          </Link>
        </div>
      )}
      <section className="section-space">
        <h2>Aktivitete të tjera</h2>
        <div className="events-list">
          {state.events
            .filter((e) => e.id !== id && e.status === "published")
            .slice(0, 2)
            .map((e) => (
              <EventCard key={e.id} event={e} />
            ))}
        </div>
      </section>
      {showForm && (
        <Dialog
          title="Apliko për aktivitetin"
          onClose={() => setShowForm(false)}
        >
          {user ? (
            <form className="form-stack" onSubmit={submit}>
              <p>{event.title}</p>
              <label>
                Emri
                <input value={`${user.firstName} ${user.lastName}`} readOnly />
              </label>
              <label>
                Email
                <input value={user.email} readOnly type="email" />
              </label>
              <label>
                Telefon
                <input
                  name="phone"
                  type="tel"
                  required
                  defaultValue={user.phone}
                  autoComplete="tel"
                  minLength={7}
                />
              </label>
              <label>
                Pse dëshiron të marrësh pjesë?
                <textarea
                  name="motivation"
                  required
                  minLength={10}
                  maxLength={1000}
                  rows={4}
                />
              </label>
              <label className="checkbox-label">
                <input type="checkbox" required /> E kuptoj që ky është një
                aplikim demonstrues.
              </label>
              <button className="button button-primary" type="submit">
                Dërgo aplikimin
              </button>
            </form>
          ) : (
            <div className="form-stack">
              <p>
                Hyr në llogarinë demo për të aplikuar. Nuk kërkohen të dhëna
                reale.
              </p>
              <Link
                className="button button-primary"
                href={`/login?next=/events/${id}`}
              >
                Hyr dhe vazhdo
              </Link>
              <Link className="text-link" href="/register">
                Krijo një profil demo
              </Link>
            </div>
          )}
        </Dialog>
      )}
    </Container>
  );
}
