-- CreateTable
CREATE TABLE "Rule" (
    "id" TEXT NOT NULL,
    "familyId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Rule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RuleEvent" (
    "id" TEXT NOT NULL,
    "familyId" TEXT NOT NULL,
    "ruleId" TEXT NOT NULL,
    "familyMemberId" TEXT NOT NULL,
    "note" TEXT NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RuleEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Rule_familyId_isActive_idx" ON "Rule"("familyId", "isActive");

-- CreateIndex
CREATE INDEX "Rule_createdByUserId_idx" ON "Rule"("createdByUserId");

-- CreateIndex
CREATE INDEX "RuleEvent_familyId_occurredAt_idx" ON "RuleEvent"("familyId", "occurredAt");

-- CreateIndex
CREATE INDEX "RuleEvent_ruleId_occurredAt_idx" ON "RuleEvent"("ruleId", "occurredAt");

-- CreateIndex
CREATE INDEX "RuleEvent_familyMemberId_occurredAt_idx" ON "RuleEvent"("familyMemberId", "occurredAt");

-- AddForeignKey
ALTER TABLE "Rule" ADD CONSTRAINT "Rule_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "Family"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rule" ADD CONSTRAINT "Rule_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RuleEvent" ADD CONSTRAINT "RuleEvent_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "Family"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RuleEvent" ADD CONSTRAINT "RuleEvent_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "Rule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RuleEvent" ADD CONSTRAINT "RuleEvent_familyMemberId_fkey" FOREIGN KEY ("familyMemberId") REFERENCES "FamilyMember"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RuleEvent" ADD CONSTRAINT "RuleEvent_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
