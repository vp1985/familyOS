-- CreateEnum
CREATE TYPE "MealKind" AS ENUM ('BREAKFAST', 'LUNCH', 'DINNER', 'UNSPECIFIED');

-- CreateTable
CREATE TABLE "MealPlanEntry" (
    "id" TEXT NOT NULL,
    "familyId" TEXT NOT NULL,
    "familyMemberId" TEXT,
    "dishName" TEXT NOT NULL,
    "plannedDate" TIMESTAMP(3) NOT NULL,
    "mealKind" "MealKind" NOT NULL DEFAULT 'UNSPECIFIED',
    "note" TEXT,
    "sourceApp" TEXT NOT NULL DEFAULT 'familyos',
    "visibleInNutrition" BOOLEAN NOT NULL DEFAULT true,
    "createdByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MealPlanEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MealPlanEntry_familyId_plannedDate_idx" ON "MealPlanEntry"("familyId", "plannedDate");

-- CreateIndex
CREATE INDEX "MealPlanEntry_familyMemberId_plannedDate_idx" ON "MealPlanEntry"("familyMemberId", "plannedDate");

-- CreateIndex
CREATE INDEX "MealPlanEntry_createdByUserId_idx" ON "MealPlanEntry"("createdByUserId");

-- CreateIndex
CREATE INDEX "MealPlanEntry_visibleInNutrition_idx" ON "MealPlanEntry"("visibleInNutrition");

-- AddForeignKey
ALTER TABLE "MealPlanEntry" ADD CONSTRAINT "MealPlanEntry_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "Family"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MealPlanEntry" ADD CONSTRAINT "MealPlanEntry_familyMemberId_fkey" FOREIGN KEY ("familyMemberId") REFERENCES "FamilyMember"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MealPlanEntry" ADD CONSTRAINT "MealPlanEntry_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
