import type { ActivityType } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { isActivityType } from "@/lib/activity-type";
import { apiError, apiSuccess } from "@/lib/api-response";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");

  if (type && !isActivityType(type)) {
    return apiError(
      "활동 유형이 잘못되었습니다. (electricity / raw_material / transport)",
    );
  }

  const factors = await prisma.emissionFactor.findMany({
    where: type ? { activityType: type as ActivityType } : undefined,
    orderBy: [{ activityType: "asc" }, { subCategory: "asc" }],
  });

  return apiSuccess(
    {
      factors: factors.map((f) => ({
        id: f.id,
        activityType: f.activityType,
        subCategory: f.subCategory,
        value: Number(f.value.toString()),
        unit: f.unit,
        validFrom: f.validFrom.toISOString().slice(0, 10),
        source: f.source,
      })),
    },
    "배출계수 조회 성공",
  );
}
