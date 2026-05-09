-- CreateEnum
CREATE TYPE "MediaType" AS ENUM ('PHONE', 'GAMING', 'WATCHING', 'TABLET', 'APP', 'OTHER');

-- CreateEnum
CREATE TYPE "MediaRestrictionType" AS ENUM ('BLOCKED', 'REDUCED', 'PARENT_APPROVAL_REQUIRED');

-- CreateEnum
CREATE TYPE "MediaRestrictionStatus" AS ENUM ('ACTIVE', 'ENDED', 'RELEASED', 'CANCELLED');

-- CreateTable
CREATE TABLE "MediaAllowanceRule" (
    "id" TEXT NOT NULL,
    "familyId" TEXT NOT NULL,
    "childId" TEXT,
    "mediaType" "MediaType" NOT NULL,
    "minAgeYears" INTEGER,
    "minutesPerDay" INTEGER,
    "minutesPerWeek" INTEGER,
    "daysOfWeekJson" TEXT,
    "note" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MediaAllowanceRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MediaRestriction" (
    "id" TEXT NOT NULL,
    "familyId" TEXT NOT NULL,
    "childId" TEXT NOT NULL,
    "mediaType" "MediaType" NOT NULL,
    "appOrDeviceLabel" TEXT,
    "restrictionType" "MediaRestrictionType" NOT NULL,
    "reducedMinutes" INTEGER,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "status" "MediaRestrictionStatus" NOT NULL DEFAULT 'ACTIVE',
    "reasonNote" TEXT,
    "ruleEventId" TEXT,
    "remindAt" TIMESTAMP(3),
    "releasedAt" TIMESTAMP(3),
    "releasedByUserId" TEXT,
    "createdByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MediaRestriction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MediaAllowanceRule_familyId_active_idx" ON "MediaAllowanceRule"("familyId", "active");

-- CreateIndex
CREATE INDEX "MediaAllowanceRule_childId_active_idx" ON "MediaAllowanceRule"("childId", "active");

-- CreateIndex
CREATE INDEX "MediaAllowanceRule_mediaType_minAgeYears_idx" ON "MediaAllowanceRule"("mediaType", "minAgeYears");

-- CreateIndex
CREATE INDEX "MediaAllowanceRule_createdByUserId_idx" ON "MediaAllowanceRule"("createdByUserId");

-- CreateIndex
CREATE INDEX "MediaRestriction_familyId_status_idx" ON "MediaRestriction"("familyId", "status");

-- CreateIndex
CREATE INDEX "MediaRestriction_childId_status_idx" ON "MediaRestriction"("childId", "status");

-- CreateIndex
CREATE INDEX "MediaRestriction_ruleEventId_idx" ON "MediaRestriction"("ruleEventId");

-- CreateIndex
CREATE INDEX "MediaRestriction_endsAt_idx" ON "MediaRestriction"("endsAt");

-- CreateIndex
CREATE INDEX "MediaRestriction_createdByUserId_idx" ON "MediaRestriction"("createdByUserId");

-- CreateIndex
CREATE INDEX "MediaRestriction_releasedByUserId_idx" ON "MediaRestriction"("releasedByUserId");

-- AddForeignKey
ALTER TABLE "MediaAllowanceRule" ADD CONSTRAINT "MediaAllowanceRule_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "Family"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MediaAllowanceRule" ADD CONSTRAINT "MediaAllowanceRule_childId_fkey" FOREIGN KEY ("childId") REFERENCES "FamilyMember"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MediaAllowanceRule" ADD CONSTRAINT "MediaAllowanceRule_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MediaRestriction" ADD CONSTRAINT "MediaRestriction_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "Family"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MediaRestriction" ADD CONSTRAINT "MediaRestriction_childId_fkey" FOREIGN KEY ("childId") REFERENCES "FamilyMember"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MediaRestriction" ADD CONSTRAINT "MediaRestriction_ruleEventId_fkey" FOREIGN KEY ("ruleEventId") REFERENCES "RuleEvent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MediaRestriction" ADD CONSTRAINT "MediaRestriction_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MediaRestriction" ADD CONSTRAINT "MediaRestriction_releasedByUserId_fkey" FOREIGN KEY ("releasedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
