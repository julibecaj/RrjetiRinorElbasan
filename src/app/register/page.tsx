import type { Metadata } from "next";
import { RegistrationForm } from "@/components/registration/RegistrationForm";
export const metadata: Metadata = { title: "Regjistrimi | Këshilli Rinor Elbasan" };
export default function Page() {
  return <RegistrationForm />;
}
