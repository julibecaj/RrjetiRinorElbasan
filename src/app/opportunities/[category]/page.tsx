import { notFound } from "next/navigation";
import { OpportunitiesPage } from "@/components/opportunities/OpportunitiesPage";
import type { Opportunity } from "@/types";
export default async function Page({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;
  if (!["jobs", "education", "volunteering", "projects"].includes(category))
    notFound();
  return <OpportunitiesPage category={category as Opportunity["category"]} />;
}
