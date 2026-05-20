import type { ActivityType } from "@prisma/client";

import {
  emissionsOf,
  type TypedEmissionInput,
} from "@/lib/calculation/emissions";

export type EmissionsByType = Record<ActivityType, number>;

export type MonthlyEmissions = {
  month: string;
  raw_material: number;
  electricity: number;
  transport: number;
};

export function emptyByType(): EmissionsByType {
  return { electricity: 0, raw_material: 0, transport: 0 };
}

export function groupByType(
  inputs: readonly TypedEmissionInput[],
): EmissionsByType {
  const acc = emptyByType();
  for (const a of inputs) {
    acc[a.activityType] += emissionsOf(a);
  }
  return acc;
}

export function dominantType(
  byType: EmissionsByType,
): ActivityType | null {
  return (Object.keys(byType) as ActivityType[]).reduce<ActivityType | null>(
    (best, key) => (best === null || byType[key] > byType[best] ? key : best),
    null,
  );
}

function monthKey(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, "0")}`;
}

function emptyMonth(key: string): MonthlyEmissions {
  return { month: key, raw_material: 0, electricity: 0, transport: 0 };
}

type DatedTypedEmission = TypedEmissionInput & { date: Date };

/**
 * Build a continuous month-by-stage bucket from `from` (inclusive) to `to` (exclusive),
 * then drop months where the total is 0. Months are bucketed in UTC.
 */
export function monthlyBuckets(
  inputs: readonly DatedTypedEmission[],
  from: Date,
  to: Date,
): MonthlyEmissions[] {
  const map = new Map<string, MonthlyEmissions>();
  const fromMonth = from.getUTCFullYear() * 12 + from.getUTCMonth();
  const toExclusiveMonth = to.getUTCFullYear() * 12 + to.getUTCMonth();

  for (let m = fromMonth; m < toExclusiveMonth; m++) {
    const year = Math.floor(m / 12);
    const month = (m % 12) + 1;
    const key = monthKey(year, month);
    map.set(key, emptyMonth(key));
  }

  for (const a of inputs) {
    const key = monthKey(a.date.getUTCFullYear(), a.date.getUTCMonth() + 1);
    const bucket = map.get(key);
    if (!bucket) continue;
    bucket[a.activityType] += emissionsOf(a);
  }

  return Array.from(map.values())
    .filter((d) => d.raw_material + d.electricity + d.transport > 0)
    .sort((a, b) => a.month.localeCompare(b.month));
}
