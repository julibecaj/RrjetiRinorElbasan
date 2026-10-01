"use client";

import { useActionState } from "react";
import { loginAdmin } from "@/app/admin/login/actions";
import { Button } from "@/components/ui/Button";

export function AdminLoginForm() {
  const [state, action, pending] = useActionState(loginAdmin, { error: "" });
  return (
    <form action={action} className="form-stack" aria-busy={pending}>
      <label htmlFor="admin-email">Email
        <input id="admin-email" name="email" type="email" autoComplete="username" required maxLength={254} readOnly={pending} style={{ fontSize: 16 }} />
      </label>
      <label htmlFor="admin-password">Fjalëkalimi
        <input id="admin-password" name="password" type="password" autoComplete="current-password" required maxLength={1024} readOnly={pending} style={{ fontSize: 16 }} />
      </label>
      {state.error && <p className="notice error" role="alert">{state.error}</p>}
      <Button type="submit" className="button-primary full-width" disabled={pending}>{pending ? "Duke hyrë…" : "Hyr si administrator"}</Button>
      <span role="status">{pending ? "Po verifikohet llogaria…" : ""}</span>
    </form>
  );
}
