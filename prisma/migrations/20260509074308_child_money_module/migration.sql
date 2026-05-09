-- CreateEnum
CREATE TYPE "MoneyDirection" AS ENUM ('INCOME', 'EXPENSE');

-- CreateEnum
CREATE TYPE "MoneyInterval" AS ENUM ('MONTHLY');

-- CreateEnum
CREATE TYPE "MoneyOccurrenceStatus" AS ENUM ('OPEN', 'PAID_CASH', 'TRANSFERRED', 'SAVED', 'SKIPPED');

-- CreateEnum
CREATE TYPE "ChildLedgerVisibility" AS ENUM ('PARENT_VISIBLE', 'CHILD_PRIVATE');

-- CreateTable
CREATE TABLE "MoneyRule" (
    "id" TEXT NOT NULL,
    "familyId" TEXT NOT NULL,
    "childId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "direction" "MoneyDirection" NOT NULL,
    "interval" "MoneyInterval" NOT NULL DEFAULT 'MONTHLY',
    "destinationLabel" TEXT,
    "visibleToChild" BOOLEAN NOT NULL DEFAULT true,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MoneyRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MoneyOccurrence" (
    "id" TEXT NOT NULL,
    "familyId" TEXT NOT NULL,
    "ruleId" TEXT NOT NULL,
    "childId" TEXT NOT NULL,
    "dueMonth" TEXT NOT NULL,
    "amountCentsSnapshot" INTEGER NOT NULL,
    "titleSnapshot" TEXT NOT NULL,
    "destinationSnapshot" TEXT,
    "status" "MoneyOccurrenceStatus" NOT NULL DEFAULT 'OPEN',
    "confirmedByParentId" TEXT,
    "confirmedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MoneyOccurrence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChildLedgerEntry" (
    "id" TEXT NOT NULL,
    "familyId" TEXT NOT NULL,
    "childId" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "direction" "MoneyDirection" NOT NULL,
    "title" TEXT NOT NULL,
    "note" TEXT,
    "categoryLabel" TEXT,
    "visibility" "ChildLedgerVisibility" NOT NULL DEFAULT 'PARENT_VISIBLE',
    "createdByUserId" TEXT,
    "createdByChildId" TEXT NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChildLedgerEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MoneyRule_familyId_active_idx" ON "MoneyRule"("familyId", "active");

-- CreateIndex
CREATE INDEX "MoneyRule_childId_active_idx" ON "MoneyRule"("childId", "active");

-- CreateIndex
CREATE INDEX "MoneyRule_createdByUserId_idx" ON "MoneyRule"("createdByUserId");

-- CreateIndex
CREATE INDEX "MoneyOccurrence_familyId_dueMonth_idx" ON "MoneyOccurrence"("familyId", "dueMonth");

-- CreateIndex
CREATE INDEX "MoneyOccurrence_childId_dueMonth_idx" ON "MoneyOccurrence"("childId", "dueMonth");

-- CreateIndex
CREATE INDEX "MoneyOccurrence_status_idx" ON "MoneyOccurrence"("status");

-- CreateIndex
CREATE UNIQUE INDEX "MoneyOccurrence_ruleId_dueMonth_key" ON "MoneyOccurrence"("ruleId", "dueMonth");

-- CreateIndex
CREATE INDEX "ChildLedgerEntry_familyId_occurredAt_idx" ON "ChildLedgerEntry"("familyId", "occurredAt");

-- CreateIndex
CREATE INDEX "ChildLedgerEntry_childId_occurredAt_idx" ON "ChildLedgerEntry"("childId", "occurredAt");

-- CreateIndex
CREATE INDEX "ChildLedgerEntry_visibility_idx" ON "ChildLedgerEntry"("visibility");

-- CreateIndex
CREATE INDEX "ChildLedgerEntry_createdByUserId_idx" ON "ChildLedgerEntry"("createdByUserId");

-- CreateIndex
CREATE INDEX "ChildLedgerEntry_createdByChildId_idx" ON "ChildLedgerEntry"("createdByChildId");

-- AddForeignKey
ALTER TABLE "MoneyRule" ADD CONSTRAINT "MoneyRule_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "Family"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MoneyRule" ADD CONSTRAINT "MoneyRule_childId_fkey" FOREIGN KEY ("childId") REFERENCES "FamilyMember"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MoneyRule" ADD CONSTRAINT "MoneyRule_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MoneyOccurrence" ADD CONSTRAINT "MoneyOccurrence_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "Family"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MoneyOccurrence" ADD CONSTRAINT "MoneyOccurrence_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "MoneyRule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MoneyOccurrence" ADD CONSTRAINT "MoneyOccurrence_childId_fkey" FOREIGN KEY ("childId") REFERENCES "FamilyMember"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MoneyOccurrence" ADD CONSTRAINT "MoneyOccurrence_confirmedByParentId_fkey" FOREIGN KEY ("confirmedByParentId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChildLedgerEntry" ADD CONSTRAINT "ChildLedgerEntry_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "Family"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChildLedgerEntry" ADD CONSTRAINT "ChildLedgerEntry_childId_fkey" FOREIGN KEY ("childId") REFERENCES "FamilyMember"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChildLedgerEntry" ADD CONSTRAINT "ChildLedgerEntry_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChildLedgerEntry" ADD CONSTRAINT "ChildLedgerEntry_createdByChildId_fkey" FOREIGN KEY ("createdByChildId") REFERENCES "FamilyMember"("id") ON DELETE CASCADE ON UPDATE CASCADE;
