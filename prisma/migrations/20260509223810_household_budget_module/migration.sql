-- CreateEnum
CREATE TYPE "HouseholdBudgetDirection" AS ENUM ('INCOME', 'EXPENSE');

-- CreateEnum
CREATE TYPE "HouseholdBudgetKind" AS ENUM ('FIXED', 'VARIABLE', 'SAVING', 'DEBT', 'OTHER');

-- CreateTable
CREATE TABLE "HouseholdBudgetPlanItem" (
    "id" TEXT NOT NULL,
    "familyId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "direction" "HouseholdBudgetDirection" NOT NULL,
    "kind" "HouseholdBudgetKind" NOT NULL DEFAULT 'VARIABLE',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HouseholdBudgetPlanItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HouseholdBudgetEntry" (
    "id" TEXT NOT NULL,
    "familyId" TEXT NOT NULL,
    "planItemId" TEXT,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "direction" "HouseholdBudgetDirection" NOT NULL,
    "monthKey" TEXT NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HouseholdBudgetEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "HouseholdBudgetPlanItem_familyId_active_idx" ON "HouseholdBudgetPlanItem"("familyId", "active");

-- CreateIndex
CREATE INDEX "HouseholdBudgetPlanItem_createdByUserId_idx" ON "HouseholdBudgetPlanItem"("createdByUserId");

-- CreateIndex
CREATE INDEX "HouseholdBudgetEntry_familyId_monthKey_idx" ON "HouseholdBudgetEntry"("familyId", "monthKey");

-- CreateIndex
CREATE INDEX "HouseholdBudgetEntry_planItemId_idx" ON "HouseholdBudgetEntry"("planItemId");

-- CreateIndex
CREATE INDEX "HouseholdBudgetEntry_createdByUserId_idx" ON "HouseholdBudgetEntry"("createdByUserId");

-- AddForeignKey
ALTER TABLE "HouseholdBudgetPlanItem" ADD CONSTRAINT "HouseholdBudgetPlanItem_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "Family"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HouseholdBudgetPlanItem" ADD CONSTRAINT "HouseholdBudgetPlanItem_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HouseholdBudgetEntry" ADD CONSTRAINT "HouseholdBudgetEntry_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "Family"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HouseholdBudgetEntry" ADD CONSTRAINT "HouseholdBudgetEntry_planItemId_fkey" FOREIGN KEY ("planItemId") REFERENCES "HouseholdBudgetPlanItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HouseholdBudgetEntry" ADD CONSTRAINT "HouseholdBudgetEntry_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
