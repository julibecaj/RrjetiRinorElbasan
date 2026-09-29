import { Hero } from "@/components/home/Hero";
import { CategoryCards } from "@/components/home/CategoryCards";
import { LatestEvents } from "@/components/home/LatestEvents";
import { YouthSection } from "@/components/home/YouthSection";
import { SupportersSection } from "@/components/home/SupportersSection";

export default function Home() {
  return (
    <>
      <Hero />
      <CategoryCards />
      <LatestEvents />
      <YouthSection />
      <SupportersSection />
    </>
  );
}
