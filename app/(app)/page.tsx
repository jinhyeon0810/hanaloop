import { DashboardHeader } from "@/app/(app)/_components/dashboard-header";
import { EmptyState } from "@/app/(app)/_components/empty-state";
import { KpiGrid } from "@/app/(app)/_components/kpi-grid";
import { LifecycleCard } from "@/app/(app)/_components/lifecycle-card";
import { MonthlyTrendCard } from "@/app/(app)/_components/monthly-trend-card";
import {
  dominantType,
  groupByType,
  monthlyBuckets,
} from "@/lib/calculation/aggregation";
import { sumEmissions } from "@/lib/calculation/emissions";
import { pickEmissionUnit, trendSubtitle } from "@/lib/calculation/unit";
import { DEFAULT_PERIOD, PERIODS, isPeriod, type Period } from "@/lib/period";
import { readPersona } from "@/lib/persona";
import { getDashboardData } from "@/lib/queries/dashboard";

export const metadata = { title: "PCF 전과정 대시보드 · Hanaloop" };

type DashboardProps = {
  searchParams: Promise<{ period?: string; role?: string }>;
};

export default async function HomePage({ searchParams }: DashboardProps) {
  const { period: pRaw } = await searchParams;
  const period: Period = isPeriod(pRaw) ? pRaw : DEFAULT_PERIOD;
  const persona = await readPersona();

  const { from, to, periodActivities, ytdActivities } =
    await getDashboardData(period);

  const periodTotal = sumEmissions(periodActivities);
  const ytdTotal = sumEmissions(ytdActivities);
  const byType = groupByType(periodActivities);
  const topType = dominantType(byType);
  const topShare =
    topType && periodTotal > 0 ? (byType[topType] / periodTotal) * 100 : 0;

  const monthlyTrend = monthlyBuckets(periodActivities, from, to);
  const trendUnitLabel = pickEmissionUnit(monthlyTrend);
  const subtitle = trendSubtitle(monthlyTrend);

  const hasPeriodData = periodActivities.length > 0;
  const periodLabel = PERIODS.find((p) => p.value === period)?.label ?? "전체";

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 md:gap-6">
      <DashboardHeader period={period} persona={persona} />
      <KpiGrid
        periodLabel={periodLabel}
        period={period}
        persona={persona}
        periodTotal={periodTotal}
        ytdTotal={ytdTotal}
        activityCount={periodActivities.length}
        topType={topType}
        topShare={topShare}
        byType={byType}
      />
      {hasPeriodData ? (
        <>
          <LifecycleCard byType={byType} total={periodTotal} period={period} />
          <MonthlyTrendCard
            data={monthlyTrend}
            unitLabel={trendUnitLabel}
            subtitle={subtitle}
          />
        </>
      ) : (
        <EmptyState periodLabel={periodLabel} />
      )}
    </div>
  );
}
