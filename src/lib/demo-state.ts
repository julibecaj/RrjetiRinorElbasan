import { events } from "@/data/events";
import { users } from "@/data/users";
import { applications, pointTransactions } from "@/data/applications";
import { opportunities } from "@/data/opportunities";
import { DEMO_TODAY } from "./format";
import type {
  Application,
  ApplicationStatus,
  Opportunity,
  PointTransaction,
  SiteContent,
  User,
  YouthEvent,
} from "@/types";

export type DemoState = {
  events: YouthEvent[];
  users: User[];
  applications: Application[];
  opportunities: Opportunity[];
  points: PointTransaction[];
  currentUserId: string | null;
  content: SiteContent;
};
export const initialState: DemoState = {
  events,
  users,
  applications,
  opportunities,
  points: pointTransactions,
  currentUserId: null,
  content: {
    mission:
      "T’u japim të rinjve të Elbasanit hapësirë, informacion dhe mundësi për të marrë pjesë në jetën e komunitetit.",
    vision:
      "Një qytet ku çdo i ri dëgjohet, zhvillon talentin e vet dhe kontribuon në të ardhmen e përbashkët.",
    supporters: [
      "Bashkia Elbasan",
      "Organizata rinore",
      "Partnerë të komunitetit",
    ],
  },
};
export type DemoAction =
  | { type: "login"; userId: string }
  | { type: "logout" }
  | { type: "register"; user: User }
  | { type: "user"; user: User }
  | { type: "apply"; application: Application }
  | { type: "application-status"; id: string; status: ApplicationStatus }
  | { type: "event"; event: YouthEvent }
  | { type: "opportunity"; opportunity: Opportunity }
  | { type: "points"; transaction: PointTransaction }
  | { type: "content"; content: SiteContent }
  | { type: "reset" };

export function occupiedPlaces(state: DemoState, eventId: string) {
  return state.applications.filter(
    (a) =>
      a.eventId === eventId &&
      (a.status === "accepted" || a.status === "attended"),
  ).length;
}
export function userPoints(state: DemoState, userId: string) {
  return state.points
    .filter((p) => p.userId === userId)
    .reduce((sum, p) => sum + p.amount, 0);
}
export function demoReducer(state: DemoState, action: DemoAction): DemoState {
  switch (action.type) {
    case "login":
      return state.users.some((u) => u.id === action.userId)
        ? { ...state, currentUserId: action.userId }
        : state;
    case "logout":
      return { ...state, currentUserId: null };
    case "register":
      return state.users.some(
        (u) => u.email.toLowerCase() === action.user.email.toLowerCase(),
      )
        ? state
        : {
            ...state,
            users: [...state.users, action.user],
            currentUserId: action.user.id,
          };
    case "user":
      return {
        ...state,
        users: state.users.map((u) =>
          u.id === action.user.id ? action.user : u,
        ),
      };
    case "event":
      return {
        ...state,
        events: state.events.some((e) => e.id === action.event.id)
          ? state.events.map((e) =>
              e.id === action.event.id ? action.event : e,
            )
          : [...state.events, action.event],
      };
    case "opportunity":
      return {
        ...state,
        opportunities: state.opportunities.some(
          (o) => o.id === action.opportunity.id,
        )
          ? state.opportunities.map((o) =>
              o.id === action.opportunity.id ? action.opportunity : o,
            )
          : [...state.opportunities, action.opportunity],
      };
    case "apply": {
      const event = state.events.find(
        (e) => e.id === action.application.eventId,
      );
      if (
        !event ||
        event.status !== "published" ||
        event.date < DEMO_TODAY ||
        occupiedPlaces(state, event.id) >= event.capacity ||
        !state.users.some((u) => u.id === action.application.userId) ||
        state.applications.some(
          (a) =>
            a.eventId === event.id && a.userId === action.application.userId,
        )
      )
        return state;
      return {
        ...state,
        applications: [...state.applications, action.application],
      };
    }
    case "application-status": {
      const app = state.applications.find((a) => a.id === action.id);
      if (
        !app ||
        app.status === "attended" ||
        (action.status === "attended" && app.status !== "accepted")
      )
        return state;
      const event = state.events.find((e) => e.id === app.eventId);
      if (
        !event ||
        event.status === "cancelled" ||
        (action.status === "accepted" &&
          app.status !== "accepted" &&
          occupiedPlaces(state, event.id) >= event.capacity)
      )
        return state;
      const award =
        action.status === "attended" &&
        !state.points.some((p) => p.applicationId === app.id);
      return {
        ...state,
        applications: state.applications.map((a) =>
          a.id === app.id
            ? {
                ...a,
                status: action.status,
                ...(award ? { awardedPoints: event.points } : {}),
              }
            : a,
        ),
        points: award
          ? [
              ...state.points,
              {
                id: `attendance-${app.id}`,
                userId: app.userId,
                applicationId: app.id,
                amount: event.points,
                reason: `Pjesëmarrje: ${event.title}`,
                date: DEMO_TODAY,
              },
            ]
          : state.points,
      };
    }
    case "points":
      return { ...state, points: [...state.points, action.transaction] };
    case "content":
      return { ...state, content: action.content };
    case "reset":
      return initialState;
  }
}
