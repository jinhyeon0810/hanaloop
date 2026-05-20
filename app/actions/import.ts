"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { parseSpreadsheet, type ParseError } from "@/lib/import/parse";
import { validateRow, type RowError } from "@/lib/import/validate";

const MAX_BYTES = 10 * 1024 * 1024;
const ALLOWED_EXT = ["xlsx", "csv"] as const;

export type AcceptedRow = {
  rowNumber: number;
  date: string;
  activityType: string;
  description: string;
  quantity: string;
  unit: string;
};

export type ImportStatus = "ok" | "partial" | "all_rejected" | "empty";

export type ImportResult =
  | {
      status: "fileError";
      message: string;
    }
  | {
      status: ImportStatus;
      fileName: string;
      accepted: AcceptedRow[];
      rejected: RowError[];
    };

export type ImportState = ImportResult | { status: "idle" };

export async function importActivities(
  _prev: ImportState,
  formData: FormData,
): Promise<ImportState> {
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { status: "fileError", message: "파일을 선택하세요." };
  }
  if (file.size > MAX_BYTES) {
    return { status: "fileError", message: `파일 크기가 10MB를 초과합니다 (${(file.size / 1024 / 1024).toFixed(1)}MB).` };
  }
  const ext = file.name.toLowerCase().split(".").pop();
  if (!ext || !ALLOWED_EXT.includes(ext as (typeof ALLOWED_EXT)[number])) {
    return {
      status: "fileError",
      message: `지원하지 않는 형식입니다 (.${ext}). .xlsx 또는 .csv만 허용됩니다.`,
    };
  }

  const buffer = await file.arrayBuffer();
  const parsed = await parseSpreadsheet(buffer, file.name);
  if (!parsed.ok) {
    return { status: "fileError", message: formatParseError(parsed.error) };
  }

  const factors = await prisma.emissionFactor.findMany({
    select: { id: true, activityType: true, subCategory: true },
  });
  const factorIndex = new Map<string, string>();
  for (const f of factors) {
    factorIndex.set(`${f.activityType}|${f.subCategory}`, f.id);
  }

  const accepted: AcceptedRow[] = [];
  const rejected: RowError[] = [];
  const toCreate: Prisma.ActivityCreateManyInput[] = [];

  for (const raw of parsed.rows) {
    const result = validateRow(raw, factorIndex);
    if (!result.ok) {
      rejected.push(result.error);
      continue;
    }
    const { row, factorId } = result;
    toCreate.push({
      date: new Date(row.date),
      activityType: row.activityType,
      description: row.description,
      quantity: new Prisma.Decimal(row.quantity),
      unit: row.unit,
      factorId,
    });
    accepted.push(toAccepted(row));
  }

  if (toCreate.length > 0) {
    try {
      await prisma.activity.createMany({ data: toCreate });
    } catch (err) {
      console.error(err);
      return {
        status: "fileError",
        message: "저장에 실패했습니다. 잠시 후 다시 시도해주세요.",
      };
    }
  }

  revalidatePath("/activities");
  revalidatePath("/");

  const status: ImportStatus =
    accepted.length === 0 && rejected.length === 0
      ? "empty"
      : accepted.length === 0
        ? "all_rejected"
        : rejected.length === 0
          ? "ok"
          : "partial";

  return {
    status,
    fileName: file.name,
    accepted,
    rejected,
  };
}

function toAccepted(row: {
  rowNumber: number;
  date: string;
  activityType: string;
  description: string;
  quantity: string;
  unit: string;
}): AcceptedRow {
  return {
    rowNumber: row.rowNumber,
    date: row.date,
    activityType: row.activityType,
    description: row.description,
    quantity: row.quantity,
    unit: row.unit,
  };
}

function formatParseError(err: ParseError): string {
  switch (err.kind) {
    case "missing_headers":
      return `필수 헤더 누락: ${err.missing.join(", ")}. 위 양식을 확인해주세요.`;
    case "empty":
      return `${err.message} 위 양식을 확인해주세요.`;
    case "unparseable":
      return `파일을 읽을 수 없습니다: ${err.message}. 위 양식을 확인해주세요.`;
  }
}
