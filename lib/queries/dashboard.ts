import { prisma } from "@/lib/prisma";
import { periodRange, type Period } from "@/lib/period";
import type { TypedEmissionInput } from "@/lib/calculation/emissions";

type DatedTypedEmission = TypedEmissionInput & { date: Date };

export type DashboardData = {
  period: Period;
  from: Date;
  to: Date;
  periodActivities: DatedTypedEmission[];
  ytdActivities: TypedEmissionInput[];
};

const YTD_START = new Date("2025-01-01");

export async function getDashboardData(period: Period): Promise<DashboardData> {
  // YTD 종료 시점을 "마지막 활동의 다음 달 1일"로 좁힌다 (REQUIREMENTS §4.3).
  // 차트의 trailing 빈 월(예: 9~12월) 제거 목적. 분기 기간(q1/q2/q3)에는 영향 없음.
  const latestActivity = await prisma.activity.findFirst({
    orderBy: { date: "desc" },
    select: { date: true },
  });
  const { from, to } = periodRange(period, latestActivity?.date ?? null);

  const [periodActivities, ytdActivities] = await Promise.all([
    prisma.activity.findMany({
      where: { date: { gte: from, lt: to } },
      select: {
        date: true,
        activityType: true,
        quantity: true,
        factor: { select: { value: true } },
      },
    }),
    prisma.activity.findMany({
      where: { date: { gte: YTD_START } },
      select: {
        activityType: true,
        quantity: true,
        factor: { select: { value: true } },
      },
    }),
  ]);

  return { period, from, to, periodActivities, ytdActivities };
}
