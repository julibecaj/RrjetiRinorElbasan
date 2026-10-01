"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import {
  DUPLICATE_REGISTRATION_MESSAGE,
  registrationFields,
  validateRegistration,
  type RegistrationErrors,
} from "@/lib/registration";
import { isWhatsAppInvite, whatsappCommunities } from "@/config/registration";
import styles from "./RegistrationForm.module.css";

export function RegistrationForm() {
  const [status, setStatus] = useState<
    "idle" | "submitting" | "failure" | "success"
  >("idle");
  const [errors, setErrors] = useState<RegistrationErrors>({});
  const [message, setMessage] = useState("");
  const inFlight = useRef(false);
  const controller = useRef<AbortController | null>(null);
  const successHeading = useRef<HTMLHeadingElement>(null);
  useEffect(() => () => controller.current?.abort(), []);
  useEffect(() => {
    if (status === "success") successHeading.current?.focus();
  }, [status]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (inFlight.current) return;
    const form = event.currentTarget;
    const result = validateRegistration(Object.fromEntries(new FormData(form)));
    setMessage("");
    if (!result.valid) {
      setErrors(result.errors);
      setStatus("idle");
      const first = registrationFields.find(
        (field) => result.errors[field.name],
      );
      if (first) (form.elements.namedItem(first.name) as HTMLElement)?.focus();
      return;
    }
    setErrors({});
    inFlight.current = true;
    setStatus("submitting");
    const abort = new AbortController();
    controller.current = abort;
    const timeout = window.setTimeout(() => abort.abort(), 15_000);
    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(result.data),
        signal: abort.signal,
      });
      const body: unknown = await response.json();
      if (typeof body !== "object" || body === null)
        throw new Error("Invalid response");
      if ("code" in body && body.code === "DUPLICATE_REGISTRATION") {
        setMessage(DUPLICATE_REGISTRATION_MESSAGE);
        setStatus("failure");
        return;
      }
      if (
        response.ok &&
        "success" in body &&
        body.success === true &&
        "saved" in body &&
        body.saved === true
      ) {
        form.reset();
        setStatus("success");
        return;
      }
      if (
        "errors" in body &&
        typeof body.errors === "object" &&
        body.errors !== null
      ) {
        const serverErrors: RegistrationErrors = {};
        for (const field of registrationFields) {
          const value = (body.errors as Record<string, unknown>)[field.name];
          if (typeof value === "string") serverErrors[field.name] = value;
        }
        setErrors(serverErrors);
        const first = registrationFields.find(
          (field) => serverErrors[field.name],
        );
        if (first)
          (form.elements.namedItem(first.name) as HTMLElement)?.focus();
      }
      setMessage(
        "message" in body && typeof body.message === "string"
          ? body.message
          : "Regjistrimi nuk u konfirmua. Provo përsëri.",
      );
      setStatus("failure");
    } catch {
      setMessage(
        abort.signal.aborted
          ? "Kërkesa zgjati shumë. Regjistrimi nuk u konfirmua. Kontrollo lidhjen dhe provo përsëri."
          : "Regjistrimi nuk u konfirmua. Kontrollo lidhjen dhe provo përsëri.",
      );
      setStatus("failure");
    } finally {
      window.clearTimeout(timeout);
      inFlight.current = false;
      controller.current = null;
    }
  }

  return (
    <div className={`auth-layout ${styles.layout}`}>
      <section
        className={`auth-form-side ${styles.content}`}
        aria-labelledby="registration-title"
      >
        <p className="eyebrow">KËSHILLI RINOR ELBASAN</p>
        {status === "success" ? (
          <div className="success-panel" role="status">
            <h1 id="registration-title" ref={successHeading} tabIndex={-1}>
              Regjistrimi u krye me sukses!
            </h1>
            <p>
              Mirë se vjen në Këshillin Rinor Elbasan. Faleminderit që u bëre
              pjesë e komunitetit tonë!
            </p>
            <h2>Bashkohu me komunitetin në WhatsApp</h2>
            <div className={styles.communities}>
              {whatsappCommunities.map(({ label, url }) =>
                isWhatsAppInvite(url) ? (
                  <a
                    key={label}
                    className="button"
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {label} (hapet në skedë të re)
                  </a>
                ) : (
                  <p key={label}>
                    {label}: lidhja do të publikohet së shpejti.
                  </p>
                ),
              )}
            </div>
          </div>
        ) : (
          <>
            <h1 id="registration-title">Bëhu pjesë e Këshillit Rinor</h1>
            <p>Zëri yt. Idetë e tua. Një komunitet që ndërtojmë së bashku.</p>
            <p id="registration-required" className={styles.help}>
              Të gjitha fushat janë të detyrueshme. Nuk nevojitet llogari apo
              fjalëkalim.
            </p>
            <form
              className="form-stack"
              action="/api/register"
              method="post"
              noValidate
              onSubmit={submit}
              aria-describedby="registration-required"
              aria-busy={status === "submitting"}
            >
              <div className={styles.fields}>
                {registrationFields.map((field) => {
                  const error = errors[field.name];
                  const shared = {
                    id: `registration-${field.name}`,
                    name: field.name,
                    required: true,
                    maxLength: field.maxLength,
                    autoComplete: field.autoComplete,
                    readOnly: status === "submitting",
                    "aria-invalid": Boolean(error),
                    "aria-describedby": error
                      ? `${field.name}-error`
                      : undefined,
                  };
                  return (
                    <div
                      key={field.name}
                      className={
                        field.name === "motivation" || field.name === "hobbies"
                          ? styles.wide
                          : undefined
                      }
                    >
                      <label htmlFor={shared.id}>{field.label}</label>
                      {field.type === "textarea" ? (
                        <textarea {...shared} rows={5} />
                      ) : (
                        <input {...shared} type={field.type} />
                      )}
                      {error && (
                        <p id={`${field.name}-error`} className={styles.error}>
                          {error}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
              {Object.keys(errors).length > 0 && (
                <p className={styles.error} role="alert">
                  Plotëso saktë fushat e shënuara më sipër.
                </p>
              )}
              {message && (
                <p className="notice error" role="alert">
                  {message}
                </p>
              )}
              <Button
                type="submit"
                className="button-primary full-width"
                disabled={status === "submitting"}
              >
                {status === "submitting"
                  ? "Duke dërguar…"
                  : "Dërgo regjistrimin"}
              </Button>
              <span className={styles.help} role="status">
                {status === "submitting"
                  ? "Të lutem prit ndërsa dërgohet regjistrimi."
                  : ""}
              </span>
              <noscript>
                Aktivizo JavaScript për të përdorur formularin. Regjistrimi nuk
                mund të dërgohet pa të.
              </noscript>
            </form>
          </>
        )}
      </section>
      <aside className="auth-art" aria-label="Komuniteti Këshilli Rinor Elbasan">
        <span>KRE</span>
        <h2>
          Zëri yt.
          <br />
          Hapësira jote.
        </h2>
        <p>Një komunitet. Shumë mundësi.</p>
      </aside>
    </div>
  );
}
