import { KpiTile } from "@/app/(app)/_components/kpi-tile";
import { LIFECYCLE_STAGE_LABEL } from "@/lib/activity-type";
import type { EmissionsByType } from "@/lib/calculation/aggregation";
import { formatEmissions, formatNumber, formatPercent } from "@/lib/format";
import type { Period } from "@/lib/period";
import type { Persona } from "@/lib/persona";
import type { ActivityType } from "@prisma/client";

export type KpiGridProps = {
  periodLabel: string;
  period: Period;
  persona: Persona;
  periodTotal: number;
  ytdTotal: number;
  activityCount: number;
  topType: ActivityType | null;
  topShare: number;
  byType: EmissionsByType;
};

export function KpiGrid({
  periodLabel,
  period,
  persona,
  periodTotal,
  ytdTotal,
  activityCount,
  topType,
  topShare,
}: KpiGridProps) {
  const emphasizeTon = persona !== "operator";

  return (
    <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <KpiTile
        label={`${periodLabel} 총 배출량`}
        value={formatEmissions(periodTotal)}
        href={`/activities?period=${period}`}
        emphasizeTon={emphasizeTon}
      />
      <KpiTile
        label="2025 전체 누적"
        value={formatEmissions(ytdTotal)}
        href="/activities"
        emphasizeTon={emphasizeTon}
        forceUnit="t CO2e"
      />
      <KpiTile
        label="활동 건수"
        value={{ value: formatNumber(activityCount), unit: "건" }}
        href={`/activities?period=${period}`}
      />
      <KpiTile
        label="가장 큰 기여"
        value={
          topType && periodTotal > 0
            ? {
                value: LIFECYCLE_STAGE_LABEL[topType],
                unit: `전체의 ${formatPercent(topShare)}`,
              }
            : { value: "—", unit: "" }
        }
        href={topType ? `/activities?period=${period}&type=${topType}` : null}
      />
    </section>
  );
}
