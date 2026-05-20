import ExcelJS from "exceljs";

const REQUIRED_HEADERS = ["일자", "활동 유형", "설명", "량", "단위"] as const;

export type RawRow = {
  rowNumber: number;
  date: string | Date | null;
  activityType: string;
  description: string;
  quantity: string | number;
  unit: string;
};

export type ParseError =
  | { kind: "missing_headers"; missing: string[] }
  | { kind: "empty"; message: string }
  | { kind: "unparseable"; message: string };

export type ParseResult =
  | { ok: true; rows: RawRow[] }
  | { ok: false; error: ParseError };

export async function parseSpreadsheet(
  buffer: ArrayBuffer,
  filename: string,
): Promise<ParseResult> {
  const ext = filename.toLowerCase().split(".").pop();

  try {
    const workbook = new ExcelJS.Workbook();
    if (ext === "csv") {
      const text = Buffer.from(buffer).toString("utf-8");
      return parseCsvText(text);
    }
    await workbook.xlsx.load(buffer);
    const sheet = workbook.worksheets[0];
    if (!sheet) {
      return { ok: false, error: { kind: "empty", message: "워크시트가 없습니다." } };
    }
    return extractRows(sheet);
  } catch (err) {
    return {
      ok: false,
      error: {
        kind: "unparseable",
        message: err instanceof Error ? err.message : "파일을 읽을 수 없습니다.",
      },
    };
  }
}

function extractRows(sheet: ExcelJS.Worksheet): ParseResult {
  const headerRow = sheet.getRow(1);
  const headers: string[] = [];
  headerRow.eachCell({ includeEmpty: true }, (cell) => {
    headers.push(String(cell.value ?? "").trim());
  });

  const missing = REQUIRED_HEADERS.filter((h) => !headers.includes(h));
  if (missing.length > 0) {
    return { ok: false, error: { kind: "missing_headers", missing } };
  }

  const idx = {
    date: headers.indexOf("일자") + 1,
    activityType: headers.indexOf("활동 유형") + 1,
    description: headers.indexOf("설명") + 1,
    quantity: headers.indexOf("량") + 1,
    unit: headers.indexOf("단위") + 1,
  };

  const rows: RawRow[] = [];
  sheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    if (rowNumber === 1) return;
    const isEmpty =
      !row.getCell(idx.date).value &&
      !row.getCell(idx.activityType).value &&
      !row.getCell(idx.description).value &&
      !row.getCell(idx.quantity).value;
    if (isEmpty) return;

    rows.push({
      rowNumber,
      date: cellAsDateOrString(row.getCell(idx.date).value),
      activityType: String(row.getCell(idx.activityType).value ?? "").trim(),
      description: String(row.getCell(idx.description).value ?? "").trim(),
      quantity: cellAsQuantity(row.getCell(idx.quantity).value),
      unit: String(row.getCell(idx.unit).value ?? "").trim(),
    });
  });

  return { ok: true, rows };
}

function parseCsvText(text: string): ParseResult {
  const stripped = text.replace(/^﻿/, "");
  const lines = stripped.split(/\r?\n/).filter((line) => line.length > 0);
  if (lines.length === 0) {
    return { ok: false, error: { kind: "empty", message: "파일이 비어있습니다." } };
  }

  const headers = parseCsvLine(lines[0]).map((h) => h.trim());
  const missing = REQUIRED_HEADERS.filter((h) => !headers.includes(h));
  if (missing.length > 0) {
    return { ok: false, error: { kind: "missing_headers", missing } };
  }

  const idx = {
    date: headers.indexOf("일자"),
    activityType: headers.indexOf("활동 유형"),
    description: headers.indexOf("설명"),
    quantity: headers.indexOf("량"),
    unit: headers.indexOf("단위"),
  };

  const rows: RawRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cells = parseCsvLine(lines[i]);
    if (cells.every((c) => c.trim() === "")) continue;
    rows.push({
      rowNumber: i + 1,
      date: cells[idx.date]?.trim() ?? "",
      activityType: cells[idx.activityType]?.trim() ?? "",
      description: cells[idx.description]?.trim() ?? "",
      quantity: cells[idx.quantity]?.trim() ?? "",
      unit: cells[idx.unit]?.trim() ?? "",
    });
  }
  return { ok: true, rows };
}

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        cur += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ",") {
        result.push(cur);
        cur = "";
      } else {
        cur += ch;
      }
    }
  }
  result.push(cur);
  return result;
}

function cellAsDateOrString(value: ExcelJS.CellValue): string | Date | null {
  if (value === null || value === undefined) return null;
  if (value instanceof Date) return value;
  if (typeof value === "object" && value !== null && "result" in value) {
    return String(value.result ?? "").trim();
  }
  return String(value).trim();
}

function cellAsQuantity(value: ExcelJS.CellValue): string | number {
  if (value === null || value === undefined) return "";
  if (typeof value === "number") return value;
  if (typeof value === "object" && value !== null && "result" in value) {
    return value.result as number | string;
  }
  return String(value).trim();
}
