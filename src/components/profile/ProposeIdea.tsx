"use client";
import Link from "next/link";
import { useState, type FormEvent } from "react";
import { Container } from "@/components/ui/Container";
import { PageHeading } from "@/components/ui/PageHeading";
import { categories } from "@/lib/format";
export function ProposeIdea() {
  const [submitted, setSubmitted] = useState("");
  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitted(String(new FormData(e.currentTarget).get("title")));
  }
  return (
    <Container className="page-content">
      <PageHeading
        eyebrow="NDRYSHIMI FILLON ME NJË IDE"
        title="Propozo një ide / nismë"
      >
        <p>Çfarë do të doje të ndryshoje në komunitetin tënd? Na trego.</p>
      </PageHeading>
      {submitted ? (
        <div className="success-panel" role="status">
          <h2>Faleminderit për idenë tënde!</h2>
          <p>
            “{submitted}” u pranua në këtë demonstrim. Në versionin real ekipi
            do ta shqyrtonte dhe do të të kontaktonte.
          </p>
          <p className="help-text">
            Nuk është dërguar apo ruajtur jashtë këtij sesioni.
          </p>
          <div className="button-row">
            <button className="button" onClick={() => setSubmitted("")}>
              Propozo një tjetër
            </button>
            <Link className="text-link" href="/profile">
              Shko te profili →
            </Link>
          </div>
        </div>
      ) : (
        <form className="form-stack form-panel" onSubmit={submit}>
          <label>
            Titulli i idesë
            <input name="title" required maxLength={120} />
          </label>
          <label>
            Kategoria
            <select name="category" required>
              {Object.entries(categories).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Përshkrimi
            <textarea name="description" required minLength={20} rows={5} />
          </label>
          <label>
            Arsyeja / objektivi
            <textarea name="objective" required minLength={10} rows={3} />
          </label>
          <div className="two-column">
            <label>
              Pjesëmarrës të parashikuar
              <input
                type="number"
                name="participants"
                required
                min={1}
                max={10000}
              />
            </label>
            <label>
              Kontakt (opsional)
              <input name="contact" placeholder="Email ose telefon" />
            </label>
          </div>
          <p className="help-text">Demo: përdor të dhëna shembull.</p>
          <button className="button button-primary" type="submit">
            Dërgo idenë
          </button>
        </form>
      )}
    </Container>
  );
}
