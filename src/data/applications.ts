import type { Application, PointTransaction } from "@/types";
export const applications: Application[] = [
  {
    id: "a1",
    eventId: "dhuro-nje-cante",
    userId: "u1",
    date: "2026-09-20",
    status: "accepted",
    motivation: "Dua të ndihmoj fëmijët e komunitetit.",
  },
  {
    id: "a2",
    eventId: "greenelb",
    userId: "u1",
    date: "2026-09-21",
    status: "pending",
    motivation: "Më intereson mbrojtja e mjedisit.",
  },
  {
    id: "a3",
    eventId: "youth-forum",
    userId: "u1",
    date: "2026-09-05",
    status: "attended",
    motivation: "Dua të jap idetë e mia.",
    awardedPoints: 30,
  },
  {
    id: "a4",
    eventId: "photo-walk",
    userId: "u1",
    date: "2026-09-07",
    status: "rejected",
    motivation: "Më pëlqen fotografia.",
  },
  {
    id: "a5",
    eventId: "ai-workshop",
    userId: "u2",
    date: "2026-09-22",
    status: "pending",
    motivation: "Dua të mësoj mjete të reja për studimet.",
  },
  {
    id: "a6",
    eventId: "ai-workshop",
    userId: "u3",
    date: "2026-09-23",
    status: "accepted",
    motivation: "Dua të kuptoj përdorimin e përgjegjshëm të AI.",
  },
];
export const pointTransactions: PointTransaction[] = [
  {
    id: "p1",
    userId: "u1",
    amount: 30,
    reason: "Pjesëmarrje: Forumi Rinor",
    date: "2026-09-15",
    applicationId: "a3",
  },
];
