import type { ReactNode } from "react";
export type IconName =
  "events" | "jobs" | "education" | "volunteering" | "projects" | "play";
const paths: Record<IconName, ReactNode> = {
  events: (
    <>
      <rect x="4" y="5" width="16" height="16" rx="2" />
      <path d="M8 3v4m8-4v4M4 10h16M8 14h1m3 0h1m3 0h1M8 17h1m3 0h1" />
    </>
  ),
  jobs: (
    <>
      <path d="M14 20H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v4M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2" />
      <circle cx="17" cy="17" r="3" />
      <path d="m19 19 3 3" />
    </>
  ),
  education: <path d="m2 9 10-5 10 5-10 5-10-5Zm4 2v6c4 4 8 4 12 0v-6M2 9v8" />,
  volunteering: (
    <>
      <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z" />
      <path d="m8 12 3 3 5-5" />
    </>
  ),
  projects: (
    <path d="M3 9V5a2 2 0 0 1 2-2h5l3 3h6a2 2 0 0 1 2 2v2M3 9h18l-3 11H3V9Z" />
  ),
  play: <path d="m9 5 11 7-11 7V5Z" />,
};
export function Icon({ name }: { name: IconName }) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  );
}
