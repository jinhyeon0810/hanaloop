-- CreateEnum
CREATE TYPE "ActivityType" AS ENUM ('electricity', 'raw_material', 'transport');

-- CreateTable
CREATE TABLE "EmissionFactor" (
    "id" TEXT NOT NULL,
    "activityType" "ActivityType" NOT NULL,
    "subCategory" TEXT NOT NULL,
    "value" DECIMAL(12,6) NOT NULL,
    "unit" TEXT NOT NULL,
    "validFrom" DATE NOT NULL,
    "source" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmissionFactor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Activity" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "activityType" "ActivityType" NOT NULL,
    "description" TEXT NOT NULL,
    "quantity" DECIMAL(14,4) NOT NULL,
    "unit" TEXT NOT NULL,
    "factorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Activity_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EmissionFactor_activityType_idx" ON "EmissionFactor"("activityType");

-- CreateIndex
CREATE UNIQUE INDEX "EmissionFactor_activityType_subCategory_validFrom_key" ON "EmissionFactor"("activityType", "subCategory", "validFrom");

-- CreateIndex
CREATE INDEX "Activity_date_idx" ON "Activity"("date");

-- CreateIndex
CREATE INDEX "Activity_activityType_idx" ON "Activity"("activityType");

-- CreateIndex
CREATE INDEX "Activity_date_activityType_idx" ON "Activity"("date", "activityType");

-- AddForeignKey
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_factorId_fkey" FOREIGN KEY ("factorId") REFERENCES "EmissionFactor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
