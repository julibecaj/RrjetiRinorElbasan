import { AuthForm } from "@/components/auth/AuthForm";
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ next?: string | string[] }>;
}) {
  const { next } = await searchParams;
  return (
    <AuthForm mode="login" next={typeof next === "string" ? next : undefined} />
  );
}
