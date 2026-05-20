import { LifecycleFlow } from "@/app/(app)/_components/lifecycle-flow";
import { TypeBars } from "@/app/(app)/_components/type-bars";
import { Card, CardContent } from "@/components/ui/card";
import type { EmissionsByType } from "@/lib/calculation/aggregation";
import { formatEmissions } from "@/lib/format";
import type { Period } from "@/lib/period";

export function LifecycleCard({
  byType,
  total,
  period,
}: {
  byType: EmissionsByType;
  total: number;
  period: Period;
}) {
  const totalDisplay = formatEmissions(total);
  return (
    <Card>
      <CardContent className="flex flex-col gap-5 p-4 md:p-6">
        <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
          <h2 className="text-sm font-semibold md:text-base">
            전과정 단계별 배출량
          </h2>
          <span className="text-xs font-medium text-muted-foreground md:text-sm">
            총 {totalDisplay.value} {totalDisplay.unit}
          </span>
        </div>
        <LifecycleFlow byType={byType} total={total} period={period} />
        <div className="border-t pt-4">
          <TypeBars byType={byType} total={total} />
        </div>
      </CardContent>
    </Card>
  );
}
