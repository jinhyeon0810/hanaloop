import type { ActivityType } from "@prisma/client";

import { UNIT_BY_TYPE } from "@/lib/activity-type";
import type { RawRow } from "./parse";

export const ACTIVITY_TYPE_KO_TO_ENUM: Record<string, ActivityType> = {
  "전기": "electricity",
  "원소재": "raw_material",
  "운송": "transport",
};

export type ValidatedRow = {
  rowNumber: number;
  date: string;
  activityType: ActivityType;
  description: string;
  quantity: string;
  unit: string;
};

export type RowError = {
  rowNumber: number;
  raw: RawRow;
  reason: string;
};

export function validateRow(
  raw: RawRow,
  factorIndex: Map<string, string>,
): { ok: true; row: ValidatedRow; factorId: string } | { ok: false; error: RowError } {
  const date = normalizeDate(raw.date);
  if (!date) {
    return { ok: false, error: { rowNumber: raw.rowNumber, raw, reason: "일자가 유효하지 않습니다 (YYYY-MM-DD)" } };
  }

  const activityType = ACTIVITY_TYPE_KO_TO_ENUM[raw.activityType];
  if (!activityType) {
    return {
      ok: false,
      error: {
        rowNumber: raw.rowNumber,
        raw,
        reason: `활동 유형이 잘못되었습니다: '${raw.activityType}' (전기/원소재/운송 중 하나)`,
      },
    };
  }

  if (!raw.description) {
    return { ok: false, error: { rowNumber: raw.rowNumber, raw, reason: "설명이 비어있습니다" } };
  }

  const qtyStr = String(raw.quantity).trim();
  const qtyNum = Number(qtyStr);
  if (!qtyStr || Number.isNaN(qtyNum) || qtyNum <= 0) {
    return {
      ok: false,
      error: {
        rowNumber: raw.rowNumber,
        raw,
        reason: `량이 유효하지 않습니다: '${raw.quantity}' (양수만 허용)`,
      },
    };
  }

  const expectedUnit = UNIT_BY_TYPE[activityType];
  if (raw.unit !== expectedUnit) {
    return {
      ok: false,
      error: {
        rowNumber: raw.rowNumber,
        raw,
        reason: `단위가 활동 유형과 일치하지 않습니다: '${raw.unit}' (예상: ${expectedUnit})`,
      },
    };
  }

  const factorId = factorIndex.get(`${activityType}|${raw.description}`);
  if (!factorId) {
    return {
      ok: false,
      error: {
        rowNumber: raw.rowNumber,
        raw,
        reason: `매칭되는 계수를 찾을 수 없습니다: '${activityType === "electricity" ? "전기" : activityType === "raw_material" ? "원소재" : "운송"} / ${raw.description}'`,
      },
    };
  }

  return {
    ok: true,
    factorId,
    row: {
      rowNumber: raw.rowNumber,
      date,
      activityType,
      description: raw.description,
      quantity: qtyStr,
      unit: raw.unit,
    },
  };
}

function normalizeDate(value: string | Date | null): string | null {
  if (!value) return null;
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return null;
    const y = value.getUTCFullYear();
    const m = String(value.getUTCMonth() + 1).padStart(2, "0");
    const d = String(value.getUTCDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  const str = String(value).trim();
  const isoMatch = str.match(/^(\d{4})[-./](\d{1,2})[-./](\d{1,2})$/);
  if (!isoMatch) return null;
  const y = isoMatch[1];
  const m = isoMatch[2].padStart(2, "0");
  const d = isoMatch[3].padStart(2, "0");
  const date = new Date(`${y}-${m}-${d}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return null;
  return `${y}-${m}-${d}`;
}
