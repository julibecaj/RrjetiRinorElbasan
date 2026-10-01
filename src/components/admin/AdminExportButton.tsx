"use client";

import { useState } from "react";

export function AdminExportButton() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function download() {
    setPending(true);
    setError("");
    try {
      const response = await fetch("/admin/registrations/export", { cache: "no-store", credentials: "same-origin" });
      if (!response.ok) {
        setError(response.status === 401 || response.status === 403
          ? "Nuk keni leje për këtë shkarkim. Hyni përsëri si administrator."
          : "Eksporti nuk u krye. Provo përsëri më vonë.");
        return;
      }
      if (!response.headers.get("content-type")?.includes("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")) throw new Error("INVALID_EXPORT_RESPONSE");
      const filename = response.headers.get("content-disposition")?.match(/filename="(Keshilli-Rinor-Elbasan-Regjistrime-\d{4}-\d{2}-\d{2}\.xlsx)"/)?.[1];
      if (!filename) throw new Error("INVALID_EXPORT_RESPONSE");
      const url = URL.createObjectURL(await response.blob());
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      // Allow the browser to start the download before releasing its URL.
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch {
      setError("Eksporti nuk u krye. Provo përsëri më vonë.");
    } finally {
      setPending(false);
    }
  }

  return <div>
    <button className="button button-primary" type="button" onClick={download} disabled={pending} aria-busy={pending}>
      {pending ? "Duke përgatitur Excel…" : "Shkarko Excel"}
    </button>
    <p className="help-text">Shkarkon të gjitha regjistrimet, pavarësisht kërkimit ose faqes.</p>
    {error && <p className="notice error" role="alert">{error}</p>}
  </div>;
}
