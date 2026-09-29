import { EventEditor } from "@/components/admin/EventEditor";
export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string }>;
}) {
  const [{ id }, { saved }] = await Promise.all([params, searchParams]);
  return <EventEditor key={id} id={id} created={saved === "1"} />;
}
