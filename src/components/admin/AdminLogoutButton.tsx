"use client";

import { useFormStatus } from "react-dom";
export function AdminLogoutButton() {
  const { pending } = useFormStatus();
  return <button type="submit" className="button" disabled={pending}>{pending ? "Duke dalë…" : "Dil nga administrimi"}</button>;
}
