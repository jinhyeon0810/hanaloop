import Link from "next/link";

import { DEFAULT_PERIOD, PERIODS, type Period } from "@/lib/period";
import { cn } from "@/lib/utils";

export function PeriodSelector({ period }: { period: Period }) {
  return (
    <div role="group" aria-label="기간" className="flex flex-wrap gap-1.5">
      {PERIODS.map((p) => (
        <Link
          key={p.value}
          href={p.value === DEFAULT_PERIOD ? "/" : `/?period=${p.value}`}
          aria-pressed={p.value === period}
          className={cn(
            "rounded-md border px-3 py-1 text-xs font-medium transition-colors",
            p.value === period
              ? "border-primary bg-primary text-primary-foreground"
              : "border-input bg-background text-muted-foreground hover:text-foreground",
          )}
        >
          {p.label}
        </Link>
      ))}
    </div>
  );
}
