import { createRegistrationExport, EXPORT_CONTENT_TYPE } from "@/lib/admin/registration-export";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const headers = {
  "Cache-Control": "private, no-store, max-age=0",
  "Pragma": "no-cache",
  "X-Content-Type-Options": "nosniff",
  "X-Robots-Tag": "noindex, nofollow",
};

export async function GET() {
  try {
    const file = await createRegistrationExport();
    if (!file) return Response.json({ message: "Nuk keni leje për këtë shkarkim." }, { status: 401, headers });
    return new Response(file.bytes, {
      headers: { ...headers, "Content-Type": EXPORT_CONTENT_TYPE, "Content-Disposition": `attachment; filename="${file.filename}"` },
    });
  } catch {
    // Fixed identifier only: never log SDK errors, rows, identifiers or tokens.
    console.error("ADMIN_EXPORT_FAILED");
    return Response.json({ message: "Eksporti nuk u krye. Provo përsëri më vonë." }, { status: 503, headers });
  }
}
