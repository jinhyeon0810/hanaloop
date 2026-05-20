import type { ActivityType } from "@prisma/client";

export const STAGE_BG: Record<ActivityType, string> = {
  raw_material: "bg-emerald-500",
  electricity: "bg-sky-500",
  transport: "bg-amber-500",
};

export const STAGE_HEX: Record<ActivityType, string> = {
  raw_material: "#10b981",
  electricity: "#0ea5e9",
  transport: "#f59e0b",
};
