import Link from "next/link";
import { FileUp, PlusCircle } from "lucide-react";
import type { ActivityType } from "@prisma/client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ACTIVITY_TYPES,
  ACTIVITY_TYPE_LABEL,
  isActivityType,
} from "@/lib/activity-type";
import { formatDate, formatNumber } from "@/lib/format";
import {
  DEFAULT_PERIOD,
  PERIODS,
  isPeriod,
  periodRange,
  type Period,
} from "@/lib/period";
import { readPersona } from "@/lib/persona";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";

export const metadata = { title: "활동 목록 · Hanaloop PCF" };

type ActivitiesPageProps = {
  searchParams: Promise<{
    period?: string;
    type?: string;
    added?: string;
  }>;
};

export default async function ActivitiesPage({ searchParams }: ActivitiesPageProps) {
  const { period: pRaw, type: tRaw, added } = await searchParams;
  const period: Period = isPeriod(pRaw) ? pRaw : DEFAULT_PERIOD;
  const selectedType: ActivityType | null = isActivityType(tRaw) ? tRaw : null;
  const persona = await readPersona();
  const canEdit = persona === "operator";

  const { from, to } = periodRange(period);

  const activities = await prisma.activity.findMany({
    where: {
      date: { gte: from, lt: to },
      ...(selectedType ? { activityType: selectedType } : {}),
    },
    include: { factor: true },
    orderBy: [{ date: "desc" }],
  });

  const queryFor = (next: { period?: Period; type?: ActivityType | null }) => {
    const params = new URLSearchParams();
    const p = next.period ?? period;
    if (p !== DEFAULT_PERIOD) params.set("period", p);
    const ty = next.type === undefined ? selectedType : next.type;
    if (ty) params.set("type", ty);
    const qs = params.toString();
    return qs ? `/activities?${qs}` : "/activities";
  };

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 md:gap-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1">
          <h1 className="text-xl font-semibold tracking-tight md:text-2xl">활동 목록</h1>
          <p className="text-xs text-muted-foreground md:text-sm">
            제품 CT-045의 활동 데이터. 같은 날 같은 항목이라도 수량이 다르면 별개 활동으로 기록됩니다.
          </p>
        </div>
        {canEdit && (
          <div className="flex flex-wrap gap-2">
            <Link
              href="/activities/new"
              className="inline-flex h-9 items-center gap-1.5 rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground shadow hover:bg-primary/90 sm:px-4 sm:text-sm"
            >
              <PlusCircle className="h-4 w-4" />
              활동 추가
            </Link>
            <Link
              href="/activities/import"
              className="inline-flex h-9 items-center gap-1.5 rounded-md border border-input bg-background px-3 text-xs font-medium shadow-sm hover:bg-accent hover:text-accent-foreground sm:px-4 sm:text-sm"
            >
              <FileUp className="h-4 w-4" />
              Excel 임포트
            </Link>
          </div>
        )}
      </header>

      {added && Number(added) > 0 ? (
        <div
          role="status"
          className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-700 dark:text-emerald-300"
        >
          {Number(added)}건이 추가되었습니다.
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        <Chips
          ariaLabel="기간"
          items={PERIODS.map((p) => ({
            href: queryFor({ period: p.value }),
            label: p.label,
            active: p.value === period,
          }))}
        />
        <span className="text-muted-foreground/40">·</span>
        <Chips
          ariaLabel="활동 유형"
          items={[
            { href: queryFor({ type: null }), label: "전체", active: selectedType === null },
            ...ACTIVITY_TYPES.map((t) => ({
              href: queryFor({ type: t }),
              label: ACTIVITY_TYPE_LABEL[t],
              active: selectedType === t,
            })),
          ]}
        />
      </div>

      {activities.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
            <p className="text-sm font-medium">표시할 활동이 없습니다</p>
            <p className="max-w-sm text-xs text-muted-foreground">
              {canEdit ? (
                <>
                  필터를 변경하거나 <Link href="/activities/new" className="underline">활동 추가</Link>로 데이터를 입력하세요.
                </>
              ) : (
                "필터를 변경하거나 다른 기간을 선택하세요."
              )}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[96px] md:w-[110px]">일자</TableHead>
                  <TableHead className="w-[88px] md:w-[100px]">활동 유형</TableHead>
                  <TableHead className="hidden sm:table-cell">설명</TableHead>
                  <TableHead className="hidden text-right sm:table-cell">량</TableHead>
                  <TableHead className="hidden md:table-cell">단위</TableHead>
                  <TableHead className="hidden lg:table-cell">매칭 계수</TableHead>
                  <TableHead className="text-right">kgCO2e</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activities.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell className="tabular-nums">{formatDate(a.date)}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{ACTIVITY_TYPE_LABEL[a.activityType]}</Badge>
                    </TableCell>
                    <TableCell className="hidden font-medium sm:table-cell">
                      {a.description}
                    </TableCell>
                    <TableCell className="hidden text-right tabular-nums sm:table-cell">
                      {formatNumber(a.quantity)}
                    </TableCell>
                    <TableCell className="hidden text-muted-foreground md:table-cell">
                      {a.unit}
                    </TableCell>
                    <TableCell className="hidden text-muted-foreground lg:table-cell">
                      {formatNumber(a.factor.value)} ({a.factor.source})
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatNumber(
                        Number(a.quantity.toString()) *
                          Number(a.factor.value.toString()),
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function Chips({
  ariaLabel,
  items,
}: {
  ariaLabel: string;
  items: { href: string; label: string; active: boolean }[];
}) {
  return (
    <div role="group" aria-label={ariaLabel} className="flex flex-wrap items-center gap-1.5">
      {items.map((chip) => (
        <Link
          key={chip.label}
          href={chip.href}
          aria-pressed={chip.active}
          className={cn(
            "rounded-md border px-3 py-1 text-xs font-medium transition-colors",
            chip.active
              ? "border-primary bg-primary text-primary-foreground"
              : "border-input bg-background text-muted-foreground hover:text-foreground",
          )}
        >
          {chip.label}
        </Link>
      ))}
    </div>
  );
}
