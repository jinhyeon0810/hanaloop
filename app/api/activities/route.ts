import { Prisma, type ActivityType } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { isActivityType, UNIT_BY_TYPE } from "@/lib/activity-type";
import { isPeriod, periodRange, DEFAULT_PERIOD } from "@/lib/period";
import { apiCreated, apiError, apiSuccess } from "@/lib/api-response";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const periodParam = searchParams.get("period");
  const typeParam = searchParams.get("type");

  const period = isPeriod(periodParam) ? periodParam : DEFAULT_PERIOD;
  const selectedType: ActivityType | null = isActivityType(typeParam) ? typeParam : null;
  const { from, to } = periodRange(period);

  const activities = await prisma.activity.findMany({
    where: {
      date: { gte: from, lt: to },
      ...(selectedType ? { activityType: selectedType } : {}),
    },
    include: { factor: true },
    orderBy: [{ date: "desc" }],
  });

  return apiSuccess(
    {
      period,
      type: selectedType,
      activities: activities.map((a) => {
        const quantity = Number(a.quantity.toString());
        const factorValue = Number(a.factor.value.toString());
        return {
          id: a.id,
          date: a.date.toISOString().slice(0, 10),
          activityType: a.activityType,
          description: a.description,
          quantity,
          unit: a.unit,
          factor: {
            id: a.factor.id,
            value: factorValue,
            source: a.factor.source,
          },
          emissionsKgco2e: quantity * factorValue,
        };
      }),
    },
    "활동 목록 조회 성공",
  );
}

type IncomingRow = {
  date?: string;
  activityType?: string;
  description?: string;
  quantity?: string | number;
};

export async function POST(request: Request) {
  let body: { rows?: IncomingRow[] };
  try {
    body = await request.json();
  } catch {
    return apiError("JSON 형식이 잘못되었습니다.");
  }

  const rows = body?.rows;
  if (!Array.isArray(rows) || rows.length === 0) {
    return apiError("rows 배열에 최소 한 행 이상 포함되어야 합니다.");
  }

  type RowError = {
    index: number;
    field?: "date" | "activityType" | "description" | "quantity";
    message: string;
  };
  const errors: RowError[] = [];
  type Validated = {
    date: string;
    activityType: ActivityType;
    description: string;
    quantity: string;
  };
  const validated: Validated[] = [];

  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];

    const date = String(r.date ?? "").trim();
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      errors.push({ index: i, field: "date", message: "유효한 일자(YYYY-MM-DD)가 필요합니다." });
      continue;
    }

    const activityType = String(r.activityType ?? "").trim();
    if (!isActivityType(activityType)) {
      errors.push({
        index: i,
        field: "activityType",
        message: "활동 유형은 electricity, raw_material, transport 중 하나여야 합니다.",
      });
      continue;
    }

    const description = String(r.description ?? "").trim();
    if (!description) {
      errors.push({ index: i, field: "description", message: "설명이 필요합니다." });
      continue;
    }

    const quantityRaw = String(r.quantity ?? "").trim();
    const quantityNum = Number(quantityRaw);
    if (!quantityRaw || Number.isNaN(quantityNum) || quantityNum <= 0) {
      errors.push({ index: i, field: "quantity", message: "량은 0보다 큰 숫자여야 합니다." });
      continue;
    }

    validated.push({ date, activityType, description, quantity: quantityRaw });
  }

  if (errors.length > 0) {
    return apiError("일부 행이 검증을 통과하지 못했습니다.", 400, errors);
  }

  const factors = await prisma.emissionFactor.findMany({
    select: { id: true, activityType: true, subCategory: true },
  });
  const factorIndex = new Map<string, string>();
  for (const f of factors) {
    factorIndex.set(`${f.activityType}|${f.subCategory}`, f.id);
  }

  const matchErrors: RowError[] = [];
  for (let i = 0; i < validated.length; i++) {
    const row = validated[i];
    if (!factorIndex.get(`${row.activityType}|${row.description}`)) {
      matchErrors.push({
        index: i,
        field: "description",
        message: `매칭되는 계수를 찾을 수 없습니다: ${row.activityType} / ${row.description}`,
      });
    }
  }
  if (matchErrors.length > 0) {
    return apiError("매칭되는 계수가 없는 행이 있습니다.", 400, matchErrors);
  }

  try {
    const result = await prisma.activity.createMany({
      data: validated.map((row) => ({
        date: new Date(row.date),
        activityType: row.activityType,
        description: row.description,
        quantity: new Prisma.Decimal(row.quantity),
        unit: UNIT_BY_TYPE[row.activityType],
        factorId: factorIndex.get(`${row.activityType}|${row.description}`)!,
      })),
    });
    return apiCreated(
      { created: result.count },
      `${result.count}건이 추가되었습니다.`,
    );
  } catch (err) {
    console.error(err);
    return apiError("저장에 실패했습니다. 잠시 후 다시 시도해주세요.", 500);
  }
}
