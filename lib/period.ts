export const DATA_YEAR = 2025;
export const DATA_YEAR_MIN = `${DATA_YEAR}-01-01`;
export const DATA_YEAR_MAX = `${DATA_YEAR}-12-31`;

export function isInDataYear(isoDate: string): boolean {
  return isoDate >= DATA_YEAR_MIN && isoDate <= DATA_YEAR_MAX;
}

export type Period = "q1" | "q2" | "q3" | "q4" | "ytd";

export const PERIODS: { value: Period; label: string }[] = [
  { value: "q1", label: "1분기" },
  { value: "q2", label: "2분기" },
  { value: "q3", label: "3분기" },
  { value: "q4", label: "4분기" },
  { value: "ytd", label: "전체" },
];

export const DEFAULT_PERIOD: Period = "ytd";

export function isPeriod(value: unknown): value is Period {
  return (
    value === "q1" ||
    value === "q2" ||
    value === "q3" ||
    value === "q4" ||
    value === "ytd"
  );
}

/**
 * Returns the date range `[from, to)` for a period.
 *
 * For `ytd`, the upper bound defaults to 2026-01-01, but you can pass
 * `latestActivityDate` so the chart/aggregation stops at the first day of the
 * month *after* the latest activity. This keeps the YTD axis from trailing
 * empty months (REQUIREMENTS §4.3: "YTD 누적: 2025-01-01부터 가장 최근 활동까지").
 */
export function periodRange(
  period: Period,
  latestActivityDate?: Date | null,
): { from: Date; to: Date } {
  switch (period) {
    case "q1":
      return { from: new Date("2025-01-01"), to: new Date("2025-04-01") };
    case "q2":
      return { from: new Date("2025-04-01"), to: new Date("2025-07-01") };
    case "q3":
      return { from: new Date("2025-07-01"), to: new Date("2025-10-01") };
    case "q4":
      return { from: new Date("2025-10-01"), to: new Date("2026-01-01") };
    case "ytd":
    default: {
      const from = new Date("2025-01-01");
      const to = latestActivityDate
        ? new Date(
            Date.UTC(
              latestActivityDate.getUTCFullYear(),
              latestActivityDate.getUTCMonth() + 1,
              1,
            ),
          )
        : new Date("2026-01-01");
      return { from, to };
    }
  }
}
