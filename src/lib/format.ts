import type { Category } from "@/types";
export const DEMO_TODAY = "2026-09-28";
export const categories: Record<Category, string> = {
  events: "Events",
  jobs: "Jobs",
  education: "Education",
  volunteering: "Volunteering",
  projects: "Projects",
};
export const monthNames = [
  "janar",
  "shkurt",
  "mars",
  "prill",
  "maj",
  "qershor",
  "korrik",
  "gusht",
  "shtator",
  "tetor",
  "nëntor",
  "dhjetor",
];
// Explicit Albanian names also work in browsers without the sq-AL locale pack.
export function formatDate(date: string) {
  const [year, month, day] = date.split("-").map(Number);
  return `${day} ${monthNames[month - 1]} ${year}`;
}
export function monthLabel(date: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    year: "2-digit",
    timeZone: "UTC",
  })
    .format(new Date(`${date}T12:00:00Z`))
    .toUpperCase();
}
