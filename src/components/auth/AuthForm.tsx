"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { useDemo } from "@/components/demo/DemoProvider";
import { DEMO_TODAY } from "@/lib/format";
import { Dialog } from "@/components/ui/Dialog";
export function AuthForm({
  mode,
  next = "/profile",
}: {
  mode: "login" | "register" | "forgot";
  next?: string;
}) {
  const { state, dispatch } = useDemo();
  const router = useRouter();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [terms, setTerms] = useState(false);
  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const data = new FormData(e.currentTarget);
    const email = String(data.get("email")).trim().toLowerCase();
    if (mode === "forgot") {
      setSuccess(true);
      return;
    }
    if (mode === "register") {
      if (data.get("password") !== data.get("confirm")) {
        setError("Fjalëkalimet nuk përputhen.");
        return;
      }
      if (state.users.some((u) => u.email.toLowerCase() === email)) {
        setError("Ky email ekziston në demo. Përdor formularin e hyrjes.");
        return;
      }
      dispatch({
        type: "register",
        user: {
          id: crypto.randomUUID(),
          firstName: String(data.get("firstName")).trim(),
          lastName: String(data.get("lastName")).trim(),
          phone: String(data.get("phone")).trim(),
          email,
          joined: DEMO_TODAY,
        },
      });
    } else {
      const user = state.users.find((u) => u.email.toLowerCase() === email);
      if (!user) {
        setError("Përdor era@example.com ose krijo një profil demonstrues.");
        return;
      }
      dispatch({ type: "login", userId: user.id });
    }
    router.push(
      next.startsWith("/") && !next.startsWith("//") && !next.includes("\\")
        ? next
        : "/profile",
    );
  }
  const title =
    mode === "register"
      ? "Sign Up"
      : mode === "forgot"
        ? "Rikthe fjalëkalimin"
        : "Sign In";
  return (
    <div className="auth-layout">
      <section className="auth-form-side">
        <p className="eyebrow">RRJETI RINOR ELBASAN</p>
        <h1>{title}</h1>
        <p>
          {mode === "register"
            ? "Hapi i parë drejt mundësive të reja."
            : mode === "forgot"
              ? "Shkruaj emailin për të parë rrjedhën e rikthimit."
              : "Mirë se u ktheve në hapësirën tënde."}
        </p>
        <div className="notice">
          Demo: përdor të dhëna shembull. Asnjë fjalëkalim nuk ruhet.
          {mode === "login" && (
            <span>
              {" "}
              Hyr me <strong>era@example.com</strong> dhe çdo fjalëkalim me 6+
              karaktere.
            </span>
          )}
        </div>
        {success ? (
          <div className="success-panel" role="status">
            <h2>Kontrollo emailin tënd</h2>
            <p>
              Në versionin real do të merrje një lidhje rikthimi. Në këtë demo
              nuk dërgohet email.
            </p>
            <Link href="/login" className="button">
              Kthehu te hyrja
            </Link>
          </div>
        ) : (
          <form className="form-stack" onSubmit={submit}>
            {mode === "register" && (
              <div className="two-column">
                <label>
                  Emri
                  <input
                    name="firstName"
                    autoComplete="given-name"
                    required
                    maxLength={60}
                  />
                </label>
                <label>
                  Mbiemri
                  <input
                    name="lastName"
                    autoComplete="family-name"
                    required
                    maxLength={60}
                  />
                </label>
              </div>
            )}
            <label>
              Email
              <input
                type="email"
                name="email"
                autoComplete="email"
                required
                defaultValue={mode === "login" ? "era@example.com" : ""}
              />
            </label>
            {mode === "register" && (
              <label>
                Telefon
                <input
                  name="phone"
                  type="tel"
                  autoComplete="tel"
                  required
                  minLength={7}
                />
              </label>
            )}
            {mode !== "forgot" && (
              <label>
                Fjalëkalimi
                <input
                  type="password"
                  name="password"
                  required
                  minLength={6}
                  autoComplete={
                    mode === "register" ? "new-password" : "current-password"
                  }
                />
              </label>
            )}
            {mode === "register" && (
              <>
                <label>
                  Konfirmo fjalëkalimin
                  <input
                    type="password"
                    name="confirm"
                    required
                    minLength={6}
                    autoComplete="new-password"
                  />
                </label>
                <label className="checkbox-label">
                  <input type="checkbox" required /> Pranoj kushtet e
                  demonstrimit.
                </label>
                <button
                  type="button"
                  className="text-link"
                  onClick={() => setTerms(true)}
                >
                  Lexo kushtet e demos
                </button>
              </>
            )}
            {mode === "login" && (
              <div className="section-heading">
                <label className="checkbox-label">
                  <input type="checkbox" name="remember" /> Më mbaj mend në këtë
                  sesion
                </label>
                <Link href="/forgot-password" className="text-link">
                  Harrove fjalëkalimin?
                </Link>
              </div>
            )}
            {error && (
              <p className="notice error" role="alert">
                {error}
              </p>
            )}
            <button type="submit" className="button button-primary full-width">
              {mode === "register"
                ? "Krijo profilin"
                : mode === "forgot"
                  ? "Dërgo lidhjen e rikthimit"
                  : "Hyr"}
            </button>
            {mode === "login" ? (
              <p>
                Nuk ke profil?{" "}
                <Link className="text-link" href="/register">
                  Regjistrohu
                </Link>
              </p>
            ) : (
              <Link className="text-link" href="/login">
                Kthehu te Sign In
              </Link>
            )}
          </form>
        )}
      </section>
      <aside className="auth-art">
        <span>RRE</span>
        <h2>
          Zëri yt.
          <br />
          Hapësira jote.
        </h2>
        <p>Një komunitet. Shumë mundësi.</p>
      </aside>
      {terms && (
        <Dialog title="Kushtet e demonstrimit" onClose={() => setTerms(false)}>
          <p>
            Ky është një prototip për prezantim. Përdor të dhëna të sajuara. Të
            dhënat që shkruan qëndrojnë vetëm në memorien e këtij sesioni dhe
            humbasin kur rifreskon faqen. Nuk krijohet një llogari reale dhe nuk
            dërgohen mesazhe.
          </p>
          <button className="button" onClick={() => setTerms(false)}>
            E kuptova
          </button>
        </Dialog>
      )}
    </div>
  );
}
