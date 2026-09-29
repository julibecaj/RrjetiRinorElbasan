export type Category =
  "events" | "jobs" | "education" | "volunteering" | "projects";
export type EventStatus =
  "draft" | "published" | "full" | "completed" | "cancelled";
export type ApplicationStatus =
  "pending" | "accepted" | "rejected" | "attended";
export type YouthEvent = {
  id: string;
  title: string;
  description: string;
  fullDescription: string;
  date: string;
  time: string;
  location: string;
  category: Category;
  capacity: number;
  organizer: string;
  status: EventStatus;
  points: number;
  image?: string;
};
export type User = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  joined: string;
};
export type Application = {
  id: string;
  eventId: string;
  userId: string;
  date: string;
  status: ApplicationStatus;
  motivation: string;
  awardedPoints?: number;
};
export type Opportunity = {
  id: string;
  title: string;
  organization: string;
  description: string;
  details: string;
  deadline: string;
  location: string;
  category: Exclude<Category, "events">;
  status: "published" | "draft" | "archived";
};
export type PointTransaction = {
  id: string;
  userId: string;
  amount: number;
  reason: string;
  date: string;
  applicationId?: string;
};
export type SiteContent = {
  mission: string;
  vision: string;
  supporters: string[];
};
