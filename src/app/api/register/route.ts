import { DUPLICATE_REGISTRATION_MESSAGE, validateRegistration, type RegistrationResponse } from "@/lib/registration";
import { createSupabaseServerClient, SupabaseConfigurationError } from "@/lib/supabase/server";

const MAX_BODY_BYTES = 24_000;
function reply(body: RegistrationResponse, status: number) {
  return Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  if (request.headers.get("content-type")?.split(";")[0].trim().toLowerCase() !== "application/json") {
    return reply({ success: false, message: "Kërkesa duhet të jetë në formatin JSON." }, 415);
  }
  if (request.headers.get("sec-fetch-site") === "cross-site") {
    return reply({ success: false, message: "Kërkesa nuk lejohet nga kjo faqe." }, 403);
  }
  // Bound the actual stream, including requests without Content-Length.
  const reader = request.body?.getReader();
  if (!reader) return reply({ success: false, message: "Kërkesa është bosh." }, 400);
  let input: unknown;
  try {
    const chunks: Uint8Array[] = [];
    let size = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_BODY_BYTES) {
        await reader.cancel();
        return reply({ success: false, message: "Të dhënat tejkalojnë madhësinë e lejuar." }, 413);
      }
      chunks.push(value);
    }
    const bytes = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
    input = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
  } catch {
    return reply({ success: false, message: "Kërkesa nuk mund të lexohej. Provo përsëri." }, 400);
  } finally { reader.releaseLock(); }
  const result = validateRegistration(input);
  if (!result.valid) return reply({ success: false, message: "Kontrollo fushat e shënuara.", errors: result.errors }, 422);

  try {
    const supabase = createSupabaseServerClient();
    const registration = result.data;
    const { data, error } = await supabase
      .from("registrations")
      .insert({
        first_name: registration.firstName,
        last_name: registration.lastName,
        phone: registration.phone,
        email: registration.email,
        school: registration.school,
        class_year: registration.classYear,
        board: registration.board,
        hobbies: registration.hobbies,
        motivation: registration.motivation,
      })
      .select("id")
      .abortSignal(AbortSignal.timeout(10_000))
      .single();

    if (error?.code === "23505") {
      console.error("REGISTRATION_DUPLICATE");
      return reply({
        success: false,
        saved: false,
        code: "DUPLICATE_REGISTRATION",
        message: DUPLICATE_REGISTRATION_MESSAGE,
      }, 409);
    }
    if (!error && typeof data?.id === "string" && data.id.length > 0) {
      return reply({ success: true, saved: true }, 201);
    }
    // Fixed identifiers only: database errors can include submitted personal data.
    console.error("REGISTRATION_INSERT_UNCONFIRMED");
  } catch (error: unknown) {
    console.error(error instanceof SupabaseConfigurationError
      ? "REGISTRATION_STORAGE_CONFIGURATION_MISSING"
      : "REGISTRATION_STORAGE_UNAVAILABLE");
  }
  return reply({ success: false, message: "Regjistrimi nuk u konfirmua. Provo përsëri më vonë." }, 503);
}
