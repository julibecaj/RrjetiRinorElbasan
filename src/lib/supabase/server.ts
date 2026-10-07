import "server-only";
import { createClient } from "@supabase/supabase-js";

type RegistrationRow = {
  id: string;
  first_name: string;
  last_name: string;
  phone: string;
  email: string | null;
  school: string;
  class_year: string | null;
  board: string | null;
  neighborhood_area: string | null;
  age: number | null;
  hobbies: string;
  motivation: string;
  created_at: string;
};

type Database = {
  public: {
    Tables: {
      registrations: {
        Row: RegistrationRow;
        Insert: Omit<RegistrationRow, "id" | "created_at">;
        Update: Partial<Omit<RegistrationRow, "id" | "created_at">>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
  };
};

export class SupabaseConfigurationError extends Error {
  constructor() {
    super("Registration storage requires SUPABASE_URL and SUPABASE_SECRET_KEY.");
    this.name = "SupabaseConfigurationError";
  }
}

// Initialize only when called by the server route, never at build/import time.
export function createSupabaseServerClient() {
  const url = process.env.SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY;
  if (!url?.trim() || !secretKey?.trim()) throw new SupabaseConfigurationError();

  return createClient<Database>(url, secretKey, {
    db: { schema: "public" },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}
