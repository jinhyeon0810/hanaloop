import type { Prisma } from "@prisma/client";

const numberFormatter = new Intl.NumberFormat("ko-KR", {
  maximumFractionDigits: 4,
});

const dateFormatter = new Intl.DateTimeFormat("ko-KR", {
  timeZone: "Asia/Seoul",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

export function formatNumber(value: Prisma.Decimal | number | string): string {
  const n = typeof value === "number" ? value : Number(value.toString());
  return numberFormatter.format(n);
}

export function formatDate(value: Date | string): string {
  const date = typeof value === "string" ? new Date(value) : value;
  return dateFormatter.format(date).replaceAll(". ", "-").replace(".", "");
}

const tonFormatter = new Intl.NumberFormat("ko-KR", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const kgFormatter = new Intl.NumberFormat("ko-KR", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

export function formatEmissions(kg: number): { value: string; unit: "t CO2e" | "kgCO2e" } {
  if (kg >= 1000) {
    return { value: tonFormatter.format(kg / 1000), unit: "t CO2e" };
  }
  return { value: kgFormatter.format(kg), unit: "kgCO2e" };
}

export function formatPercent(value: number, fractionDigits = 0): string {
  return `${value.toFixed(fractionDigits)}%`;
}
