import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import { ActivityForm, type FactorOption } from "./activity-form";

export const metadata = { title: "활동 추가 · Hanaloop PCF" };

export default async function NewActivityPage() {
  const factors = await prisma.emissionFactor.findMany({
    orderBy: [{ activityType: "asc" }, { subCategory: "asc" }],
  });

  const factorOptions: FactorOption[] = factors.map((f) => ({
    activityType: f.activityType,
    subCategory: f.subCategory,
    value: Number(f.value.toString()),
    unit: f.unit,
  }));

  return (
    <div className="flex w-full flex-col gap-6">
      <Link
        href="/activities"
        className="inline-flex w-fit items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        활동 목록으로
      </Link>

      <header className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold tracking-tight md:text-2xl">활동 추가</h1>
        <p className="text-xs text-muted-foreground md:text-sm">
          여러 활동을 한 번에 추가할 수 있습니다. 선택한 활동 유형에 매칭되는 계수가 자동 적용됩니다.
        </p>
      </header>

      <Card>
        <CardHeader className="p-4 md:p-6">
          <CardTitle className="text-base">신규 활동</CardTitle>
          <CardDescription>
            모든 필드 필수 · 량은 양수만 허용 · 행은 자유롭게 추가/삭제 가능
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 pt-0 md:p-6 md:pt-0">
          <ActivityForm factors={factorOptions} />
        </CardContent>
      </Card>
    </div>
  );
}
