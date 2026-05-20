import Link from "next/link";

import {
  ACTIVITY_TYPES,
  ACTIVITY_TYPE_LABEL,
  LIFECYCLE_STAGE_LABEL,
} from "@/lib/activity-type";
import { STAGE_BG } from "@/lib/activity/colors";
import type { EmissionsByType } from "@/lib/calculation/aggregation";
import { formatPercent } from "@/lib/format";
import type { Period } from "@/lib/period";
import { cn } from "@/lib/utils";

export function LifecycleFlow({
  byType,
  total,
  period,
}: {
  byType: EmissionsByType;
  total: number;
  period: Period;
}) {
  if (total <= 0) return null;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-1 text-xs font-semibold text-foreground sm:text-sm">
        {ACTIVITY_TYPES.map((t, i) => (
          <span key={t} className="flex items-center gap-1.5 sm:gap-2">
            <span className="sm:hidden">{ACTIVITY_TYPE_LABEL[t]}</span>
            <span className="hidden sm:inline">{LIFECYCLE_STAGE_LABEL[t]}</span>
            {i < ACTIVITY_TYPES.length - 1 && (
              <span aria-hidden className="text-muted-foreground">
                →
              </span>
            )}
          </span>
        ))}
      </div>
      <div
        role="group"
        aria-label="전과정 단계별 누적 막대 (단계 클릭 시 활동 상세)"
        className="flex h-9 w-full overflow-hidden rounded-md border bg-muted"
      >
        {ACTIVITY_TYPES.map((t) => {
          const value = byType[t];
          const pct = (value / total) * 100;
          if (pct <= 0) return null;
          return (
            <Link
              key={t}
              href={`/activities?type=${t}&period=${period}`}
              aria-label={`${LIFECYCLE_STAGE_LABEL[t]} 단계 상세 보기 (전체의 ${formatPercent(pct)})`}
              style={{ width: `${pct}%` }}
              className={cn(
                "flex cursor-pointer items-center justify-center text-[11px] font-semibold text-white outline-none transition hover:brightness-110 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
                STAGE_BG[t],
              )}
              title={`${LIFECYCLE_STAGE_LABEL[t]} ${formatPercent(pct)} · 클릭하여 상세 보기`}
            >
              {pct >= 8 ? formatPercent(pct) : ""}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
