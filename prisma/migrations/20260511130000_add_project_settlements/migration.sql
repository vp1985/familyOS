-- CreateEnum
CREATE TYPE "ProjectSettlementStatus" AS ENUM ('open', 'settled');

-- CreateTable
CREATE TABLE "ProjectSettlement" (
    "id" TEXT NOT NULL,
    "familyId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "fromMemberId" TEXT NOT NULL,
    "toMemberId" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "status" "ProjectSettlementStatus" NOT NULL DEFAULT 'open',
    "createdByUserId" TEXT NOT NULL,
    "settledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProjectSettlement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProjectSettlement_familyId_projectId_status_idx" ON "ProjectSettlement"("familyId", "projectId", "status");

-- CreateIndex
CREATE INDEX "ProjectSettlement_fromMemberId_idx" ON "ProjectSettlement"("fromMemberId");

-- CreateIndex
CREATE INDEX "ProjectSettlement_toMemberId_idx" ON "ProjectSettlement"("toMemberId");

-- AddForeignKey
ALTER TABLE "ProjectSettlement" ADD CONSTRAINT "ProjectSettlement_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "Family"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectSettlement" ADD CONSTRAINT "ProjectSettlement_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectSettlement" ADD CONSTRAINT "ProjectSettlement_fromMemberId_fkey" FOREIGN KEY ("fromMemberId") REFERENCES "FamilyMember"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectSettlement" ADD CONSTRAINT "ProjectSettlement_toMemberId_fkey" FOREIGN KEY ("toMemberId") REFERENCES "FamilyMember"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectSettlement" ADD CONSTRAINT "ProjectSettlement_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
