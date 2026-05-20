import {
  ACTIVITY_TYPES,
  ACTIVITY_TYPE_LABEL,
  LIFECYCLE_STAGE_LABEL,
} from "@/lib/activity-type";
import { STAGE_BG } from "@/lib/activity/colors";
import type { EmissionsByType } from "@/lib/calculation/aggregation";
import { formatEmissions, formatPercent } from "@/lib/format";
import { cn } from "@/lib/utils";

export function TypeBars({
  byType,
  total,
}: {
  byType: EmissionsByType;
  total: number;
}) {
  if (total <= 0) {
    return (
      <p className="py-4 text-center text-xs text-muted-foreground">
        선택 기간에 계산된 배출량이 없습니다.
      </p>
    );
  }
  return (
    <div className="flex flex-col gap-2">
      {ACTIVITY_TYPES.map((t) => {
        const value = byType[t];
        const pct = total > 0 ? (value / total) * 100 : 0;
        const { value: vStr, unit } = formatEmissions(value);
        return (
          <div key={t} className="flex items-center gap-2 text-xs sm:gap-3">
            <span className="w-14 shrink-0 text-muted-foreground sm:w-24">
              <span className="sm:hidden">{ACTIVITY_TYPE_LABEL[t]}</span>
              <span className="hidden sm:inline">
                {LIFECYCLE_STAGE_LABEL[t]}
              </span>
            </span>
            <div className="flex h-5 min-w-0 flex-1 overflow-hidden rounded bg-muted">
              <div
                role="presentation"
                style={{ width: `${pct}%` }}
                className={cn("h-full transition-all", STAGE_BG[t])}
              />
            </div>
            <span className="w-24 shrink-0 text-right tabular-nums sm:w-32">
              {vStr} {unit}{" "}
              <span className="text-muted-foreground">
                ({formatPercent(pct)})
              </span>
            </span>
          </div>
        );
      })}
    </div>
  );
}
