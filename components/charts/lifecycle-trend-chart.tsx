"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipContentProps,
} from "recharts";
import type { ActivityType } from "@prisma/client";

import { ACTIVITY_TYPES, LIFECYCLE_STAGE_LABEL } from "@/lib/activity-type";
import { STAGE_HEX } from "@/lib/activity/colors";
import { formatEmissions } from "@/lib/format";

export type MonthlyPoint = {
  /** ISO month key, e.g. "2025-01" */
  month: string;
  raw_material: number;
  electricity: number;
  transport: number;
};

function monthLabel(month: string): string {
  // "2025-01" -> "1월"
  const m = Number(month.slice(5, 7));
  return Number.isFinite(m) ? `${m}월` : month;
}

function tonFormatter(kg: number): string {
  // Compact axis labels in t CO2e with 1 decimal
  return new Intl.NumberFormat("ko-KR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(kg / 1000);
}

function kgAxisFormatter(kg: number): string {
  return new Intl.NumberFormat("ko-KR", {
    maximumFractionDigits: 0,
  }).format(kg);
}

type ChartTooltipProps = TooltipContentProps<number, string>;

function ChartTooltip({ active, payload, label }: ChartTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;

  // Recharts payload order follows the <Area> child order. We render in
  // ACTIVITY_TYPES order (raw_material → electricity → transport) so the
  // tooltip matches the visual stack.
  const valueByType: Record<ActivityType, number> = {
    raw_material: 0,
    electricity: 0,
    transport: 0,
  };
  for (const entry of payload) {
    const key = entry.dataKey as ActivityType | undefined;
    if (key && key in valueByType) {
      valueByType[key] = Number(entry.value ?? 0);
    }
  }
  const total =
    valueByType.raw_material + valueByType.electricity + valueByType.transport;
  const totalDisplay = formatEmissions(total);

  return (
    <div className="rounded-md border bg-popover px-3 py-2 text-xs shadow-md">
      <div className="mb-1.5 font-medium text-foreground">
        {typeof label === "string" ? monthLabel(label) : label}
      </div>
      <div className="flex flex-col gap-1">
        {ACTIVITY_TYPES.map((t) => {
          const v = valueByType[t];
          const display = formatEmissions(v);
          return (
            <div key={t} className="flex items-center gap-2 tabular-nums">
              <span
                aria-hidden
                className="inline-block h-2 w-2 rounded-sm"
                style={{ backgroundColor: STAGE_HEX[t] }}
              />
              <span className="flex-1 text-muted-foreground">
                {LIFECYCLE_STAGE_LABEL[t]}
              </span>
              <span className="font-medium text-foreground">
                {display.value} {display.unit}
              </span>
            </div>
          );
        })}
        <div className="mt-1 flex items-center gap-2 border-t pt-1.5 tabular-nums">
          <span className="flex-1 text-muted-foreground">합계</span>
          <span className="font-semibold text-foreground">
            {totalDisplay.value} {totalDisplay.unit}
          </span>
        </div>
      </div>
    </div>
  );
}

export type LifecycleTrendChartProps = {
  data: MonthlyPoint[];
  /**
   * Y축 tick 단위. 카드 헤더에서 단위를 명시하므로 차트 내부에는
   * Y축 라벨을 그리지 않는다. 부모가 결정해 일관성을 유지한다.
   */
  unitLabel?: "t CO2e" | "kgCO2e";
};

export function LifecycleTrendChart({
  data,
  unitLabel,
}: LifecycleTrendChartProps) {
  const maxMonthTotal = data.reduce(
    (max, d) => Math.max(max, d.raw_material + d.electricity + d.transport),
    0,
  );
  // 부모가 unitLabel을 주지 않으면 데이터로 자동 판정 (이전 동작 유지).
  const useTon = unitLabel ? unitLabel === "t CO2e" : maxMonthTotal >= 1000;
  const yFormatter = useTon ? tonFormatter : kgAxisFormatter;

  if (data.length === 0 || maxMonthTotal === 0) {
    return (
      <div
        role="status"
        className="flex h-[240px] items-center justify-center rounded-md border border-dashed text-sm text-muted-foreground"
      >
        선택 기간 데이터 없음
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col gap-2">
      {/*
        Custom legend rendered above the chart so lifecycle order
        (원소재 → 가공 → 출고) is enforced regardless of how Recharts orders
        its built-in legend. Built-in Legend is intentionally disabled below.
      */}
      <ul
        aria-label="단계별 색상 범례"
        className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground"
      >
        {ACTIVITY_TYPES.map((t) => (
          <li key={t} className="flex items-center gap-1.5">
            <span
              aria-hidden
              className="inline-block h-2.5 w-2.5 rounded-sm"
              style={{ backgroundColor: STAGE_HEX[t] }}
            />
            <span>{LIFECYCLE_STAGE_LABEL[t]}</span>
          </li>
        ))}
      </ul>
      <ResponsiveContainer width="100%" height={260}>
        <AreaChart
          data={data}
          margin={{ top: 8, right: 12, left: 4, bottom: 4 }}
        >
          <defs>
            {ACTIVITY_TYPES.map((t) => (
              <linearGradient
                key={t}
                id={`grad-${t}`}
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop offset="0%" stopColor={STAGE_HEX[t]} stopOpacity={0.55} />
                <stop offset="100%" stopColor={STAGE_HEX[t]} stopOpacity={0.1} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="month"
            tickFormatter={monthLabel}
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
            padding={{ left: 8, right: 8 }}
          />
          <YAxis
            tickFormatter={yFormatter}
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
            width={44}
          />
          <Tooltip
            content={(props) => <ChartTooltip {...(props as ChartTooltipProps)} />}
            cursor={{ stroke: "hsl(var(--border))", strokeDasharray: "3 3" }}
          />
          {/* Built-in Legend intentionally omitted — see custom legend above. */}
          {/*
            Stack 시각 순서: 바닥부터 원소재(raw_material) → 가공(electricity) →
            출고(transport). Recharts는 같은 stackId 안에서 선언 순서대로
            아래에서 위로 쌓는다. ACTIVITY_TYPES가 이미 lifecycle 순서라
            그대로 map해서 의도가 일치한다.
          */}
          {ACTIVITY_TYPES.map((t) => (
            <Area
              key={t}
              type="monotone"
              dataKey={t}
              name={t}
              stackId="lifecycle"
              stroke={STAGE_HEX[t]}
              fill={`url(#grad-${t})`}
              strokeWidth={2}
              isAnimationActive={false}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
