"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { Prisma, type ActivityType } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { isActivityType, UNIT_BY_TYPE } from "@/lib/activity-type";

export type RowError = {
  date?: string;
  activityType?: string;
  description?: string;
  quantity?: string;
};

export type CreateActivitiesState = {
  status: "idle" | "error";
  rowErrors?: Record<number, RowError>;
  formError?: string;
};

export async function createActivities(
  _prev: CreateActivitiesState,
  formData: FormData
): Promise<CreateActivitiesState> {
  const rawRows = String(formData.get("rows") ?? "").trim();
  if (!rawRows) {
    return { status: "error", formError: "저장할 행이 없습니다." };
  }

  let rows: Array<{
    date: string;
    activityType: string;
    description: string;
    quantity: string;
  }>;
  try {
    rows = JSON.parse(rawRows);
  } catch {
    return { status: "error", formError: "요청 형식이 잘못되었습니다." };
  }

  if (!Array.isArray(rows) || rows.length === 0) {
    return { status: "error", formError: "최소 한 행 이상 입력하세요." };
  }

  const rowErrors: Record<number, RowError> = {};
  type Validated = {
    index: number;
    date: string;
    activityType: ActivityType;
    description: string;
    quantity: string;
  };
  const validated: Validated[] = [];

  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    const err: RowError = {};

    const date = r.date?.trim() ?? "";
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      err.date = "유효한 일자를 입력하세요.";
    }

    const activityType = r.activityType?.trim() ?? "";
    if (!isActivityType(activityType)) {
      err.activityType = "활동 유형을 선택하세요.";
    }

    const description = r.description?.trim() ?? "";
    if (!description) {
      err.description = "설명을 선택하세요.";
    }

    const quantityRaw = String(r.quantity ?? "").trim();
    const quantityNum = Number(quantityRaw);
    if (!quantityRaw || Number.isNaN(quantityNum) || quantityNum <= 0) {
      err.quantity = "0보다 큰 숫자여야 합니다.";
    }

    if (Object.keys(err).length > 0) {
      rowErrors[i] = err;
      continue;
    }

    validated.push({
      index: i,
      date,
      activityType: activityType as ActivityType,
      description,
      quantity: quantityRaw,
    });
  }

  if (Object.keys(rowErrors).length > 0) {
    return { status: "error", rowErrors };
  }

  const factors = await prisma.emissionFactor.findMany({
    select: { id: true, activityType: true, subCategory: true },
  });
  const factorIndex = new Map<string, string>();
  for (const f of factors) {
    factorIndex.set(`${f.activityType}|${f.subCategory}`, f.id);
  }

  for (const row of validated) {
    const factorId = factorIndex.get(`${row.activityType}|${row.description}`);
    if (!factorId) {
      rowErrors[row.index] = { description: "매칭되는 계수가 없습니다." };
    }
  }

  if (Object.keys(rowErrors).length > 0) {
    return { status: "error", rowErrors };
  }

  try {
    await prisma.activity.createMany({
      data: validated.map((row) => ({
        date: new Date(row.date),
        activityType: row.activityType,
        description: row.description,
        quantity: new Prisma.Decimal(row.quantity),
        unit: UNIT_BY_TYPE[row.activityType],
        factorId: factorIndex.get(`${row.activityType}|${row.description}`)!,
      })),
    });
  } catch (err) {
    console.error(err);
    return {
      status: "error",
      formError: "저장에 실패했습니다. 잠시 후 다시 시도해주세요.",
    };
  }

  revalidatePath("/activities");
  revalidatePath("/");
  redirect(`/activities?added=${validated.length}`);
}
