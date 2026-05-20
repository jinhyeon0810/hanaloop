import type { ActivityType } from "@prisma/client";

// Cradle-to-Gate + Transport lifecycle order: 원료 → 가공 → 출고
export const ACTIVITY_TYPES: ActivityType[] = [
  "raw_material",
  "electricity",
  "transport",
];

export const ACTIVITY_TYPE_LABEL: Record<ActivityType, string> = {
  electricity: "전기",
  raw_material: "원소재",
  transport: "운송",
};

export const LIFECYCLE_STAGE_LABEL: Record<ActivityType, string> = {
  raw_material: "원소재 투입",
  electricity: "가공 (전기)",
  transport: "출고 운송",
};

export function isActivityType(value: unknown): value is ActivityType {
  return (
    value === "electricity" || value === "raw_material" || value === "transport"
  );
}

export const UNIT_BY_TYPE: Record<ActivityType, string> = {
  electricity: "kWh",
  raw_material: "kg",
  transport: "ton-km",
};
