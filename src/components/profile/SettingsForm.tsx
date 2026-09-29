"use client";
import { useState, type FormEvent } from "react";
import { useDemo } from "@/components/demo/DemoProvider";
import { PageHeading } from "@/components/ui/PageHeading";
export function SettingsForm() {
  const { state, dispatch } = useDemo();
  const user = state.users.find((u) => u.id === (state.currentUserId ?? "u1"))!;
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setMessage("");
    const data = new FormData(e.currentTarget);
    const email = String(data.get("email")).trim().toLowerCase();
    if (
      state.users.some(
        (u) => u.id !== user.id && u.email.toLowerCase() === email,
      )
    ) {
      setError("Ky email përdoret nga një profil tjetër demo.");
      return;
    }
    dispatch({
      type: "user",
      user: {
        ...user,
        firstName: String(data.get("firstName")).trim(),
        lastName: String(data.get("lastName")).trim(),
        email,
        phone: String(data.get("phone")).trim(),
      },
    });
    setMessage("Ndryshimet u ruajtën për këtë sesion demo.");
  }
  return (
    <>
      <PageHeading title="Cilësimet e profilit">
        <p>Përditëso të dhënat e profilit demonstrues.</p>
      </PageHeading>
      <form key={user.id} className="form-stack form-panel" onSubmit={submit}>
        <div className="two-column">
          <label>
            Emri
            <input
              name="firstName"
              required
              defaultValue={user.firstName}
              autoComplete="given-name"
            />
          </label>
          <label>
            Mbiemri
            <input
              name="lastName"
              required
              defaultValue={user.lastName}
              autoComplete="family-name"
            />
          </label>
        </div>
        <label>
          Email
          <input
            type="email"
            name="email"
            required
            defaultValue={user.email}
            autoComplete="email"
          />
        </label>
        <label>
          Telefon
          <input
            type="tel"
            name="phone"
            required
            minLength={7}
            defaultValue={user.phone}
            autoComplete="tel"
          />
        </label>
        <p className="help-text">
          Në versionin real emaili do të përdoret për njoftime. Kjo demo nuk
          dërgon mesazhe dhe nuk lidhet me WhatsApp.
        </p>
        {error && (
          <p role="alert" className="notice error">
            {error}
          </p>
        )}
        {message && (
          <p role="status" className="notice success">
            {message}
          </p>
        )}
        <button className="button button-primary" type="submit">
          Ruaj ndryshimet
        </button>
      </form>
    </>
  );
}
