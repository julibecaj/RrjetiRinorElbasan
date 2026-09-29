"use client";
import Link from "next/link";
import { useState } from "react";
import { useDemo } from "@/components/demo/DemoProvider";
import { Container } from "@/components/ui/Container";
import { PageHeading } from "@/components/ui/PageHeading";
import { EventCard } from "@/components/ui/EventCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { categories, DEMO_TODAY, monthNames } from "@/lib/format";
export function EventsPage() {
  const { state } = useDemo();
  const [period, setPeriod] = useState("all");
  const [category, setCategory] = useState("all");
  const [selectedDate, setSelectedDate] = useState("");
  const [month, setMonth] = useState("2026-09");
  const publicEvents = state.events.filter(
    (e) => e.status !== "draft" && e.status !== "cancelled",
  );
  const filtered = publicEvents
    .filter(
      (e) =>
        (category === "all" || e.category === category) &&
        (period !== "upcoming" || e.date >= DEMO_TODAY) &&
        (period !== "month" || e.date.startsWith(DEMO_TODAY.slice(0, 7))) &&
        (!selectedDate || e.date === selectedDate),
    )
    .sort((a, b) => a.date.localeCompare(b.date));
  const [year, monthNumber] = month.split("-").map(Number);
  const days = new Date(year, monthNumber, 0).getDate();
  const offset = (new Date(year, monthNumber - 1, 1).getDay() + 6) % 7;
  const monthTitle = `${monthNames[monthNumber - 1]} ${year}`;
  function moveMonth(delta: number) {
    const date = new Date(year, monthNumber - 1 + delta);
    setMonth(
      `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`,
    );
    setSelectedDate("");
  }
  return (
    <Container className="page-content">
      <PageHeading eyebrow="TAKOHEMI NË ELBASAN" title="Events">
        <p>Mëso diçka të re. Tako njerëz. Bëhu pjesë e ndryshimit.</p>
      </PageHeading>
      <section className="calendar" aria-label="Kalendari i aktiviteteve">
        <div className="section-heading">
          <h2>{monthTitle}</h2>
          <div className="button-row">
            <button
              className="icon-button"
              onClick={() => moveMonth(-1)}
              aria-label="Muaji i mëparshëm"
            >
              ←
            </button>
            <button
              className="icon-button"
              onClick={() => moveMonth(1)}
              aria-label="Muaji tjetër"
            >
              →
            </button>
          </div>
        </div>
        <div className="calendar-grid">
          {["Hën", "Mar", "Mër", "Enj", "Pre", "Sht", "Die"].map((d) => (
            <span className="calendar-weekday" key={d}>
              {d}
            </span>
          ))}
          {Array.from({ length: offset }, (_, i) => (
            <span key={`blank-${i}`} />
          ))}
          {Array.from({ length: days }, (_, i) => {
            const date = `${month}-${String(i + 1).padStart(2, "0")}`;
            const count = publicEvents.filter((e) => e.date === date).length;
            return (
              <button
                key={date}
                className={`calendar-day ${count ? "has-events" : ""}`}
                aria-label={`${date}, ${count} aktivitete`}
                aria-pressed={selectedDate === date}
                onClick={() =>
                  setSelectedDate(selectedDate === date ? "" : date)
                }
              >
                {i + 1}
                {count > 0 && <span aria-hidden="true" />}
              </button>
            );
          })}
        </div>
        <p className="help-text">
          Zgjidh një datë për të parë aktivitetet. Data e demos: 28 shtator
          2026.
        </p>
      </section>
      <div className="filter-bar">
        <div className="tabs" aria-label="Filtro sipas kohës">
          {[
            ["all", "All"],
            ["upcoming", "Upcoming"],
            ["month", "This month"],
          ].map(([value, label]) => (
            <button
              key={value}
              aria-pressed={period === value}
              onClick={() => setPeriod(value)}
            >
              {label}
            </button>
          ))}
        </div>
        <label>
          Kategoria
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="all">Të gjitha</option>
            {Object.entries(categories).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="section-heading">
        <p className="section-label" role="status">
          EVENTS LIST · {filtered.length}
        </p>
        {selectedDate && (
          <button className="text-link" onClick={() => setSelectedDate("")}>
            Hiq datën ×
          </button>
        )}
      </div>
      <div className="events-list">
        {filtered.map((e) => (
          <EventCard key={e.id} event={e} />
        ))}
      </div>
      {!filtered.length && (
        <EmptyState
          title="Asnjë aktivitet për këtë përzgjedhje"
          description="Provo një kategori, muaj ose datë tjetër."
        />
      )}
      <div className="inline-callout">
        <span>Ke një ide për aktivitetin e radhës?</span>
        <Link href="/propose-idea" className="text-link">
          Propozo një ide →
        </Link>
      </div>
    </Container>
  );
}
