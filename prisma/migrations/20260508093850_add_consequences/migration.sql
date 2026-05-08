-- CreateEnum
CREATE TYPE "ConsequenceStatus" AS ENUM ('active', 'done', 'cancelled');

-- CreateTable
CREATE TABLE "Consequence" (
    "id" TEXT NOT NULL,
    "familyId" TEXT NOT NULL,
    "familyMemberId" TEXT NOT NULL,
    "ruleEventId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "ConsequenceStatus" NOT NULL DEFAULT 'active',
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" TIMESTAMP(3),
    "createdByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Consequence_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Consequence_familyId_status_idx" ON "Consequence"("familyId", "status");

-- CreateIndex
CREATE INDEX "Consequence_familyMemberId_status_idx" ON "Consequence"("familyMemberId", "status");

-- CreateIndex
CREATE INDEX "Consequence_ruleEventId_idx" ON "Consequence"("ruleEventId");

-- CreateIndex
CREATE INDEX "Consequence_createdByUserId_idx" ON "Consequence"("createdByUserId");

-- AddForeignKey
ALTER TABLE "Consequence" ADD CONSTRAINT "Consequence_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "Family"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Consequence" ADD CONSTRAINT "Consequence_familyMemberId_fkey" FOREIGN KEY ("familyMemberId") REFERENCES "FamilyMember"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Consequence" ADD CONSTRAINT "Consequence_ruleEventId_fkey" FOREIGN KEY ("ruleEventId") REFERENCES "RuleEvent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Consequence" ADD CONSTRAINT "Consequence_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
