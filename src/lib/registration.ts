export interface RegistrationData {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  school: string;
  classYear: string;
  board: string;
  hobbies: string;
  motivation: string;
}

export const registrationFields = [
  { name: "firstName", label: "Emër", maxLength: 60, type: "text", autoComplete: "given-name" },
  { name: "lastName", label: "Mbiemër", maxLength: 60, type: "text", autoComplete: "family-name" },
  { name: "phone", label: "Numër Telefoni", maxLength: 30, type: "tel", autoComplete: "tel" },
  { name: "email", label: "Email", maxLength: 254, type: "email", autoComplete: "email" },
  { name: "school", label: "Shkolla", maxLength: 150, type: "text", autoComplete: "off" },
  { name: "classYear", label: "Klasa / Viti", maxLength: 60, type: "text", autoComplete: "off" },
  { name: "board", label: "Bordi", maxLength: 120, type: "text", autoComplete: "off" },
  { name: "hobbies", label: "Hobi", maxLength: 500, type: "text", autoComplete: "off" },
  { name: "motivation", label: "Pse do të jesh pjesë e Këshillit Rinor?", maxLength: 2000, type: "textarea", autoComplete: "off" },
] as const satisfies readonly { name: keyof RegistrationData; label: string; maxLength: number; type: string; autoComplete: string }[];

export type RegistrationErrors = Partial<Record<keyof RegistrationData, string>>;
export const DUPLICATE_REGISTRATION_MESSAGE = "Ky email ose numër telefoni është regjistruar më parë.";
export type RegistrationResponse =
  | { success: true; saved: true }
  | { success: false; saved: false; code: "DUPLICATE_REGISTRATION"; message: string }
  | { success: false; message: string; errors?: RegistrationErrors };

export function validateRegistration(input: unknown):
  | { valid: true; data: RegistrationData }
  | { valid: false; errors: RegistrationErrors } {
  const source = typeof input === "object" && input !== null && !Array.isArray(input)
    ? input as Record<string, unknown> : {};
  const data = {} as RegistrationData;
  const errors: RegistrationErrors = {};
  for (const field of registrationFields) {
    const raw = source[field.name];
    const value = typeof raw === "string" ? raw.trim() : "";
    data[field.name] = value;
    if (!value) errors[field.name] = "Kjo fushë është e detyrueshme.";
    else if (value.length > field.maxLength) errors[field.name] = `Lejohen deri në ${field.maxLength} karaktere.`;
  }
  if (!errors.email && !/^[^\s@]+@[^\s@.]+(?:\.[^\s@.]+)+$/.test(data.email)) errors.email = "Shkruaj një adresë email të vlefshme.";
  const digits = data.phone.replace(/\D/g, "");
  if (!errors.phone && (!/^\+?[0-9 ()-]+$/.test(data.phone) || digits.length < 7 || digits.length > 15)) {
    errors.phone = "Shkruaj një numër telefoni me 7–15 shifra; mund të përdorësh +, hapësira, kllapa ose viza.";
  }
  if (Object.keys(errors).length) return { valid: false, errors };
  // Normalize only after validation so removing separators cannot hide invalid
  // input. Preserve an existing leading +; never infer a country code.
  data.email = data.email.toLowerCase();
  data.phone = data.phone.replace(/[ ()-]/g, "");
  return { valid: true, data };
}
