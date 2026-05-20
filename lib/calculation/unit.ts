import type { MonthlyEmissions } from "@/lib/calculation/aggregation";

export type EmissionUnit = "t CO2e" | "kgCO2e";

/** 어느 한 달의 누적 합계가 1000 kgCO2e 이상이면 t CO2e, 아니면 kgCO2e. */
export function pickEmissionUnit(
  monthly: readonly MonthlyEmissions[],
): EmissionUnit {
  const maxMonthlyTotal = monthly.reduce(
    (m, d) => Math.max(m, d.raw_material + d.electricity + d.transport),
    0,
  );
  return maxMonthlyTotal >= 1000 ? "t CO2e" : "kgCO2e";
}

/** 차트 부제목용 기간 라벨 (예: "2025-01 ~ 2025-08"). */
export function trendSubtitle(monthly: readonly MonthlyEmissions[]): string {
  if (monthly.length === 0) return "데이터 없음";
  const first = monthly[0].month;
  const last = monthly[monthly.length - 1].month;
  return first === last ? first : `${first} ~ ${last}`;
}
