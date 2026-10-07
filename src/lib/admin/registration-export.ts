import "server-only";
import { Workbook } from "exceljs";
import { getAdminIdentity } from "./auth";
import { formatRegistrationDate } from "./registrations";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const EXPORT_MAX_ROWS = 10_000;
export const EXPORT_MAX_TEXT_BYTES = 10 * 1024 * 1024;
export const EXPORT_BATCH_SIZE = 500;
export const EXPORT_CONTENT_TYPE = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
export const EXPORT_HEADERS = [
  "Emër", "Mbiemër", "Numër Telefoni", "Email", "Shkolla", "Klasa / Viti",
  "Bordi", "Lagja/Zona", "Mosha", "Hobi", "Pse do të jesh pjesë e Këshillit Rinor?", "Data e regjistrimit",
];

export function safeSpreadsheetText(input: string | number | null | undefined) {
  const value = input == null ? "" : String(input);
  // Also catch formula prefixes hidden behind whitespace/control characters.
  // Values remain explicit XLSX strings; never create formula or hyperlink objects.
  const safe = /^[\s\u0000-\u001f]*[=+@-]/u.test(value) ? `'${value}` : value;
  if (safe.length > 32_767) throw new Error("ADMIN_EXPORT_CELL_LIMIT");
  return safe;
}

export function registrationExportFilename(now = new Date()) {
  const parts = new Intl.DateTimeFormat("sq-AL", {
    timeZone: "Europe/Tirane", year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(now);
  const part = (type: string) => parts.find((entry) => entry.type === type)?.value;
  return `Keshilli-Rinor-Elbasan-Regjistrime-${part("year")}-${part("month")}-${part("day")}.xlsx`;
}

export async function createRegistrationExport() {
  // Authorization is enforced at the data boundary, including direct callers.
  if (!await getAdminIdentity()) return null;
  const client = createSupabaseServerClient();
  const workbook = new Workbook();
  const sheet = workbook.addWorksheet("Regjistrimet", { views: [{ state: "frozen", ySplit: 1 }] });
  sheet.columns = EXPORT_HEADERS.map((header, index) => ({ header, width: [20, 20, 24, 34, 30, 18, 24, 30, 12, 40, 60, 32][index] }));
  sheet.getRow(1).font = { bold: true };
  sheet.getRow(1).alignment = { vertical: "top", wrapText: true };
  sheet.getRow(1).height = 32;
  const deadline = AbortSignal.timeout(30_000);
  const seen = new Set<string>();
  let expected: number | undefined;
  let offset = 0;
  let textBytes = 0;
  do {
    deadline.throwIfAborted();
    const result = await client.from("registrations")
      .select("id,first_name,last_name,phone,email,school,class_year,board,neighborhood_area,age,hobbies,motivation,created_at", { count: "exact" })
      .order("created_at", { ascending: false }).order("id", { ascending: false })
      .range(offset, offset + EXPORT_BATCH_SIZE - 1)
      .abortSignal(AbortSignal.any([deadline, AbortSignal.timeout(10_000)]));
    if (result.error || !result.data || result.count === null) throw new Error("ADMIN_EXPORT_READ_FAILED");
    if (result.count > EXPORT_MAX_ROWS) throw new Error("ADMIN_EXPORT_ROW_LIMIT");
    expected ??= result.count;
    // Fail instead of delivering a partial file when records change mid-export.
    if (expected !== result.count || (offset < expected && !result.data.length)) throw new Error("ADMIN_EXPORT_DATA_CHANGED");
    for (const row of result.data) {
      if (seen.has(row.id) || seen.size >= expected) throw new Error("ADMIN_EXPORT_DATA_CHANGED");
      seen.add(row.id);
      const values = [row.first_name, row.last_name, row.phone, row.email, row.school,
        row.class_year, row.board, row.neighborhood_area, row.age, row.hobbies, row.motivation, formatRegistrationDate(row.created_at)]
        .map(safeSpreadsheetText);
      textBytes += values.reduce((sum, value) => sum + Buffer.byteLength(value, "utf8"), 0);
      if (textBytes > EXPORT_MAX_TEXT_BYTES) throw new Error("ADMIN_EXPORT_TEXT_LIMIT");
      const excelRow = sheet.addRow(values);
      excelRow.alignment = { vertical: "top", wrapText: true };
      excelRow.numFmt = "@";
    }
    // Advance by actual returned rows, accommodating Supabase limits below 500.
    offset += result.data.length;
  } while (offset < expected);
  deadline.throwIfAborted();
  sheet.autoFilter = { from: "A1", to: { row: sheet.rowCount, column: EXPORT_HEADERS.length } };
  const buffer = await workbook.xlsx.writeBuffer();
  deadline.throwIfAborted();
  return { bytes: new Uint8Array(buffer), filename: registrationExportFilename() };
}
