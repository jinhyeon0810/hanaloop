import {
  LifecycleTrendChart,
  type MonthlyPoint,
} from "@/components/charts/lifecycle-trend-chart";
import { Card, CardContent } from "@/components/ui/card";
import type { EmissionUnit } from "@/lib/calculation/unit";

export function MonthlyTrendCard({
  data,
  unitLabel,
  subtitle,
}: {
  data: MonthlyPoint[];
  unitLabel: EmissionUnit;
  subtitle: string;
}) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-4 p-4 md:p-6">
        <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
          <div className="flex min-w-0 flex-col gap-0.5">
            <h2 className="text-sm font-semibold md:text-base">월별 추이</h2>
            <p className="text-[11px] text-muted-foreground md:text-xs">
              {subtitle} · 단계별 누적 배출량
            </p>
          </div>
          <span className="text-[11px] font-medium text-muted-foreground tabular-nums md:text-xs">
            단위: {unitLabel}
          </span>
        </div>
        <LifecycleTrendChart data={data} unitLabel={unitLabel} />
      </CardContent>
    </Card>
  );
}
