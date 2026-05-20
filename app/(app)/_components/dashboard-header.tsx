import { PeriodSelector } from "@/app/(app)/_components/period-selector";
import type { Period } from "@/lib/period";
import type { Persona } from "@/lib/persona";

export function DashboardHeader({
  period,
  persona,
}: {
  period: Period;
  persona: Persona;
}) {
  const operator = persona === "operator";
  return (
    <header className="flex flex-wrap items-end justify-between gap-3">
      <div className="flex min-w-0 flex-col gap-1">
        <h1 className="text-xl font-semibold tracking-tight md:text-2xl">
          PCF 전과정 대시보드
        </h1>
        <p className="text-xs text-muted-foreground md:text-sm">
          2025년 · CT-045 · {operator ? "실무자 뷰" : "경영자 뷰"} · 전과정
          범위 원소재 → 가공 → 출고
        </p>
      </div>
      <PeriodSelector period={period} />
    </header>
  );
}
