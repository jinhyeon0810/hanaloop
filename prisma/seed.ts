import { ActivityType, PrismaClient, Prisma } from "@prisma/client";

const prisma = new PrismaClient();

const FACTOR_VALID_FROM = new Date("2025-01-01");

const FACTORS = [
  {
    activityType: ActivityType.electricity,
    subCategory: "한국전력",
    value: "0.456",
    unit: "kgCO2e/kWh",
    source: "한국전력 전력배출계수",
  },
  {
    activityType: ActivityType.raw_material,
    subCategory: "플라스틱 1",
    value: "2.3",
    unit: "kgCO2e/kg",
    source: "플라스틱 1 배출계수",
  },
  {
    activityType: ActivityType.raw_material,
    subCategory: "플라스틱 2",
    value: "3.2",
    unit: "kgCO2e/kg",
    source: "플라스틱 2 배출계수",
  },
  {
    activityType: ActivityType.transport,
    subCategory: "트럭",
    value: "3.5",
    unit: "kgCO2e/ton-km",
    source: "중대형 트럭 화물수송 배출계수",
  },
];

const UNIT_BY_TYPE: Record<ActivityType, string> = {
  electricity: "kWh",
  raw_material: "kg",
  transport: "ton-km",
};

type SeedActivity = {
  date: string;
  activityType: ActivityType;
  description: string;
  quantity: string;
};

const ACTIVITIES: SeedActivity[] = [
  // 1월
  { date: "2025-01-05", activityType: "electricity", description: "한국전력", quantity: "12000" },
  { date: "2025-01-10", activityType: "raw_material", description: "플라스틱 1", quantity: "800" },
  { date: "2025-01-20", activityType: "transport", description: "트럭", quantity: "450" },
  { date: "2025-01-28", activityType: "raw_material", description: "플라스틱 2", quantity: "320" },

  // 2월
  { date: "2025-02-03", activityType: "electricity", description: "한국전력", quantity: "11500" },
  { date: "2025-02-12", activityType: "raw_material", description: "플라스틱 1", quantity: "920" },
  { date: "2025-02-22", activityType: "transport", description: "트럭", quantity: "520" },

  // 3월
  { date: "2025-03-04", activityType: "electricity", description: "한국전력", quantity: "13200" },
  { date: "2025-03-11", activityType: "raw_material", description: "플라스틱 2", quantity: "410" },
  { date: "2025-03-18", activityType: "raw_material", description: "플라스틱 1", quantity: "750" },
  { date: "2025-03-26", activityType: "transport", description: "트럭", quantity: "600" },

  // 4월
  { date: "2025-04-02", activityType: "electricity", description: "한국전력", quantity: "12800" },
  { date: "2025-04-09", activityType: "raw_material", description: "플라스틱 1", quantity: "880" },
  { date: "2025-04-17", activityType: "raw_material", description: "플라스틱 2", quantity: "360" },
  { date: "2025-04-24", activityType: "transport", description: "트럭", quantity: "480" },

  // 5월 (같은 날짜·항목·다른 수량은 별개 활동)
  { date: "2025-05-05", activityType: "electricity", description: "한국전력", quantity: "13500" },
  { date: "2025-05-15", activityType: "raw_material", description: "플라스틱 1", quantity: "950" },
  { date: "2025-05-15", activityType: "raw_material", description: "플라스틱 1", quantity: "320" },
  { date: "2025-05-25", activityType: "transport", description: "트럭", quantity: "560" },

  // 6월
  { date: "2025-06-04", activityType: "electricity", description: "한국전력", quantity: "14200" },
  { date: "2025-06-12", activityType: "raw_material", description: "플라스틱 2", quantity: "430" },
  { date: "2025-06-20", activityType: "raw_material", description: "플라스틱 1", quantity: "1020" },
  { date: "2025-06-28", activityType: "transport", description: "트럭", quantity: "640" },

  // 7월
  { date: "2025-07-03", activityType: "electricity", description: "한국전력", quantity: "15100" },
  { date: "2025-07-11", activityType: "raw_material", description: "플라스틱 1", quantity: "980" },
  { date: "2025-07-18", activityType: "raw_material", description: "플라스틱 2", quantity: "470" },
  { date: "2025-07-26", activityType: "transport", description: "트럭", quantity: "720" },

  // 8월
  { date: "2025-08-02", activityType: "electricity", description: "한국전력", quantity: "14800" },
  { date: "2025-08-12", activityType: "raw_material", description: "플라스틱 1", quantity: "870" },
  { date: "2025-08-22", activityType: "transport", description: "트럭", quantity: "680" },
];

async function main() {
  await prisma.$transaction(async (tx) => {
    const factorByKey = new Map<string, string>();

    for (const f of FACTORS) {
      const saved = await tx.emissionFactor.upsert({
        where: {
          activityType_subCategory_validFrom: {
            activityType: f.activityType,
            subCategory: f.subCategory,
            validFrom: FACTOR_VALID_FROM,
          },
        },
        update: {
          value: new Prisma.Decimal(f.value),
          unit: f.unit,
          source: f.source,
        },
        create: {
          activityType: f.activityType,
          subCategory: f.subCategory,
          value: new Prisma.Decimal(f.value),
          unit: f.unit,
          source: f.source,
          validFrom: FACTOR_VALID_FROM,
        },
      });
      factorByKey.set(`${f.activityType}|${f.subCategory}`, saved.id);
    }

    await tx.activity.deleteMany({});
    await tx.activity.createMany({
      data: ACTIVITIES.map((a) => {
        const factorId = factorByKey.get(`${a.activityType}|${a.description}`);
        if (!factorId) {
          throw new Error(
            `Seed activity has no matching factor: ${a.activityType} / ${a.description}`,
          );
        }
        return {
          date: new Date(a.date),
          activityType: a.activityType,
          description: a.description,
          quantity: new Prisma.Decimal(a.quantity),
          unit: UNIT_BY_TYPE[a.activityType],
          factorId,
        };
      }),
    });
  });

  const [factorCount, activityCount] = await Promise.all([
    prisma.emissionFactor.count(),
    prisma.activity.count(),
  ]);
  console.log(`✔ seed 완료: 계수 ${factorCount}건, 활동 ${activityCount}건`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
