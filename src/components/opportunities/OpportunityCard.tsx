"use client";
import { useState } from "react";
import Link from "next/link";
import type { Opportunity } from "@/types";
import { categories, formatDate } from "@/lib/format";
import { Dialog } from "@/components/ui/Dialog";
export function OpportunityCard({
  opportunity: o,
}: {
  opportunity: Opportunity;
}) {
  const [open, setOpen] = useState(false);
  const [interested, setInterested] = useState(false);
  return (
    <>
      <article className="opportunity-card">
        <p className="eyebrow">
          {categories[o.category]} · {o.location}
        </p>
        <h2>{o.title}</h2>
        <p className="organization">{o.organization}</p>
        <p>{o.description}</p>
        <div className="section-heading">
          <span className="help-text">Afati: {formatDate(o.deadline)}</span>
          <button className="button" onClick={() => setOpen(true)}>
            Detaje<span className="sr-only">: {o.title}</span>
          </button>
        </div>
      </article>
      {open && (
        <Dialog title={o.title} onClose={() => setOpen(false)}>
          <p className="eyebrow">
            {categories[o.category]} · {o.organization}
          </p>
          <p>{o.details}</p>
          <dl className="detail-list">
            <div>
              <dt>Vendndodhja</dt>
              <dd>{o.location}</dd>
            </div>
            <div>
              <dt>Afati</dt>
              <dd>{formatDate(o.deadline)}</dd>
            </div>
          </dl>
          <button
            className="button button-primary"
            aria-pressed={interested}
            onClick={() => setInterested(!interested)}
          >
            {interested ? "Hiq interesin" : "Shpreh interes"}
          </button>
          <p role="status" className="help-text">
            {interested
              ? "Interesi u shënua në këtë pamje demo. Nuk është dërguar aplikim te organizata."
              : "Mundësi ilustruese; aplikimi real do të ofrohet më vonë."}
          </p>
          <Link className="text-link" href="/opportunities">
            Të gjitha mundësitë →
          </Link>
        </Dialog>
      )}
    </>
  );
}
