import Link from "next/link";
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
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";

export const metadata = { title: "배출계수 · Hanaloop PCF" };

type FactorsPageProps = {
  searchParams: Promise<{ type?: string }>;
};

export default async function FactorsPage({ searchParams }: FactorsPageProps) {
  const { type } = await searchParams;
  const selectedType: ActivityType | null = isActivityType(type) ? type : null;

  const factors = await prisma.emissionFactor.findMany({
    where: selectedType ? { activityType: selectedType } : undefined,
    orderBy: [{ activityType: "asc" }, { subCategory: "asc" }],
  });

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-5 md:gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold tracking-tight md:text-2xl">배출계수</h1>
        <p className="text-xs text-muted-foreground md:text-sm">
          예상 탄소 배출량은 아래 배출계수를 기반으로 산출됩니다. 활동 유형별로 적용된 계수의 값과 출처를 확인하실 수 있습니다.
        </p>
      </header>

      <FilterChips selected={selectedType} />

      {factors.length === 0 ? (
        <EmptyState hasFilter={selectedType !== null} />
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[88px] md:w-[110px]">활동 유형</TableHead>
                  <TableHead>세부 항목</TableHead>
                  <TableHead className="text-right">값</TableHead>
                  <TableHead className="hidden md:table-cell">단위</TableHead>
                  <TableHead className="hidden md:table-cell">유효 시작일</TableHead>
                  <TableHead className="hidden lg:table-cell">출처</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {factors.map((factor) => (
                  <TableRow key={factor.id}>
                    <TableCell>
                      <Badge variant="secondary">
                        {ACTIVITY_TYPE_LABEL[factor.activityType]}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">
                      {factor.subCategory}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      <span>{formatNumber(factor.value)}</span>
                      <span className="ml-1 text-muted-foreground md:hidden">
                        {factor.unit}
                      </span>
                    </TableCell>
                    <TableCell className="hidden text-muted-foreground md:table-cell">
                      {factor.unit}
                    </TableCell>
                    <TableCell className="hidden text-muted-foreground tabular-nums md:table-cell">
                      {formatDate(factor.validFrom)}
                    </TableCell>
                    <TableCell className="hidden text-muted-foreground lg:table-cell">
                      {factor.source}
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

function FilterChips({ selected }: { selected: ActivityType | null }) {
  const chips: { href: string; label: string; active: boolean }[] = [
    {
      href: "/factors",
      label: "전체",
      active: selected === null,
    },
    ...ACTIVITY_TYPES.map((t) => ({
      href: `/factors?type=${t}`,
      label: ACTIVITY_TYPE_LABEL[t],
      active: selected === t,
    })),
  ];

  return (
    <div
      role="tablist"
      aria-label="활동 유형 필터"
      className="flex flex-wrap items-center gap-1.5"
    >
      {chips.map((chip) => (
        <Link
          key={chip.label}
          href={chip.href}
          role="tab"
          aria-selected={chip.active}
          className={cn(
            "rounded-md border px-3 py-1 text-xs font-medium transition-colors",
            chip.active
              ? "border-primary bg-primary text-primary-foreground"
              : "border-input bg-background text-muted-foreground hover:text-foreground"
          )}
        >
          {chip.label}
        </Link>
      ))}
    </div>
  );
}

function EmptyState({ hasFilter }: { hasFilter: boolean }) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
        <p className="text-sm font-medium">표시할 계수가 없습니다</p>
        <p className="max-w-sm text-xs text-muted-foreground">
          {hasFilter
            ? "선택한 활동 유형에 해당하는 계수가 없습니다. 다른 유형을 선택하거나 전체 보기로 돌아가세요."
            : "시드 데이터가 주입되지 않았습니다. 터미널에서 `yarn db:seed`를 실행해주세요."}
        </p>
      </CardContent>
    </Card>
  );
}
