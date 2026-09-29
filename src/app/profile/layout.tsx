import type { ReactNode } from "react";
import { ProfileLayout } from "@/components/profile/ProfileLayout";
export default function Layout({ children }: { children: ReactNode }) {
  return <ProfileLayout>{children}</ProfileLayout>;
}
