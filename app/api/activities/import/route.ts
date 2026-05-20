import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { parseSpreadsheet } from "@/lib/import/parse";
import { validateRow } from "@/lib/import/validate";
import { apiError, apiSuccess } from "@/lib/api-response";

const MAX_BYTES = 10 * 1024 * 1024;
const ALLOWED_EXT = ["xlsx", "csv"] as const;

export async function POST(request: Request) {
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return apiError("multipart/form-data 형식이 필요합니다.");
  }

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return apiError("file 필드를 선택하세요.");
  }
  if (file.size > MAX_BYTES) {
    return apiError(
      `파일 크기가 10MB를 초과합니다 (${(file.size / 1024 / 1024).toFixed(1)}MB).`,
    );
  }
  const ext = file.name.toLowerCase().split(".").pop();
  if (!ext || !ALLOWED_EXT.includes(ext as (typeof ALLOWED_EXT)[number])) {
    return apiError(
      `지원하지 않는 형식입니다 (.${ext}). .xlsx 또는 .csv만 허용됩니다.`,
    );
  }

  const buffer = await file.arrayBuffer();
  const parsed = await parseSpreadsheet(buffer, file.name);
  if (!parsed.ok) {
    let message: string;
    switch (parsed.error.kind) {
      case "missing_headers":
        message = `필수 헤더 누락: ${parsed.error.missing.join(", ")}`;
        break;
      case "empty":
        message = parsed.error.message;
        break;
      case "unparseable":
        message = `파일을 읽을 수 없습니다: ${parsed.error.message}`;
        break;
    }
    return apiError(message);
  }

  const factors = await prisma.emissionFactor.findMany({
    select: { id: true, activityType: true, subCategory: true },
  });
  const factorIndex = new Map<string, string>();
  for (const f of factors) {
    factorIndex.set(`${f.activityType}|${f.subCategory}`, f.id);
  }

  const accepted: Array<{
    rowNumber: number;
    date: string;
    activityType: string;
    description: string;
    quantity: string;
    unit: string;
  }> = [];
  const rejected: Array<{ rowNumber: number; reason: string }> = [];
  const toCreate: Prisma.ActivityCreateManyInput[] = [];

  for (const raw of parsed.rows) {
    const result = validateRow(raw, factorIndex);
    if (!result.ok) {
      rejected.push({ rowNumber: result.error.rowNumber, reason: result.error.reason });
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
    accepted.push({
      rowNumber: row.rowNumber,
      date: row.date,
      activityType: row.activityType,
      description: row.description,
      quantity: row.quantity,
      unit: row.unit,
    });
  }

  if (toCreate.length > 0) {
    try {
      await prisma.activity.createMany({ data: toCreate });
    } catch (err) {
      console.error(err);
      return apiError("저장에 실패했습니다. 잠시 후 다시 시도해주세요.", 500);
    }
  }

  return apiSuccess(
    { fileName: file.name, accepted, rejected },
    `${accepted.length}건 저장, ${rejected.length}건 거부됨`,
  );
}
