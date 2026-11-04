-- CreateEnum
CREATE TYPE "PlanningType" AS ENUM ('BIRTHDAY', 'VACATION', 'VISIT', 'OUTING');

-- CreateEnum
CREATE TYPE "PlanningStatus" AS ENUM ('ACTIVE', 'DONE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "PlanningDocumentStatus" AS ENUM ('OPEN', 'READY');

-- AlterTable
ALTER TABLE "ChecklistInstance" ADD COLUMN     "planningEventId" TEXT;

-- AlterTable
ALTER TABLE "TaskOccurrence" ADD COLUMN     "planningEventId" TEXT;

-- AlterTable
ALTER TABLE "TaskTemplate" ADD COLUMN     "planningEventId" TEXT;

-- CreateTable
CREATE TABLE "PlanningEvent" (
    "id" TEXT NOT NULL,
    "familyId" TEXT NOT NULL,
    "type" "PlanningType" NOT NULL,
    "status" "PlanningStatus" NOT NULL DEFAULT 'ACTIVE',
    "title" TEXT NOT NULL,
    "description" TEXT,
    "location" TEXT,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "calendarEventId" TEXT NOT NULL,
    "costProjectId" TEXT,
    "createdByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlanningEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlanningMember" (
    "id" TEXT NOT NULL,
    "familyId" TEXT NOT NULL,
    "planningEventId" TEXT NOT NULL,
    "familyMemberId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlanningMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlanningGuest" (
    "id" TEXT NOT NULL,
    "familyId" TEXT NOT NULL,
    "planningEventId" TEXT NOT NULL,
    "contactId" TEXT NOT NULL,
    "createdByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlanningGuest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlanningGiftList" (
    "id" TEXT NOT NULL,
    "familyId" TEXT NOT NULL,
    "planningEventId" TEXT NOT NULL,
    "giftListId" TEXT NOT NULL,
    "createdByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlanningGiftList_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlanningDocument" (
    "id" TEXT NOT NULL,
    "familyId" TEXT NOT NULL,
    "planningEventId" TEXT NOT NULL,
    "responsibleFamilyMemberId" TEXT,
    "title" TEXT NOT NULL,
    "note" TEXT,
    "status" "PlanningDocumentStatus" NOT NULL DEFAULT 'OPEN',
    "createdByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlanningDocument_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PlanningEvent_calendarEventId_key" ON "PlanningEvent"("calendarEventId");

-- CreateIndex
CREATE UNIQUE INDEX "PlanningEvent_costProjectId_key" ON "PlanningEvent"("costProjectId");

-- CreateIndex
CREATE INDEX "PlanningEvent_familyId_status_startsAt_idx" ON "PlanningEvent"("familyId", "status", "startsAt");

-- CreateIndex
CREATE INDEX "PlanningEvent_createdByUserId_idx" ON "PlanningEvent"("createdByUserId");

-- CreateIndex
CREATE INDEX "PlanningMember_familyId_planningEventId_idx" ON "PlanningMember"("familyId", "planningEventId");

-- CreateIndex
CREATE INDEX "PlanningMember_familyMemberId_idx" ON "PlanningMember"("familyMemberId");

-- CreateIndex
CREATE UNIQUE INDEX "PlanningMember_planningEventId_familyMemberId_key" ON "PlanningMember"("planningEventId", "familyMemberId");

-- CreateIndex
CREATE INDEX "PlanningGuest_familyId_planningEventId_idx" ON "PlanningGuest"("familyId", "planningEventId");

-- CreateIndex
CREATE INDEX "PlanningGuest_contactId_idx" ON "PlanningGuest"("contactId");

-- CreateIndex
CREATE INDEX "PlanningGuest_createdByUserId_idx" ON "PlanningGuest"("createdByUserId");

-- CreateIndex
CREATE UNIQUE INDEX "PlanningGuest_planningEventId_contactId_key" ON "PlanningGuest"("planningEventId", "contactId");

-- CreateIndex
CREATE INDEX "PlanningGiftList_familyId_planningEventId_idx" ON "PlanningGiftList"("familyId", "planningEventId");

-- CreateIndex
CREATE INDEX "PlanningGiftList_giftListId_idx" ON "PlanningGiftList"("giftListId");

-- CreateIndex
CREATE INDEX "PlanningGiftList_createdByUserId_idx" ON "PlanningGiftList"("createdByUserId");

-- CreateIndex
CREATE UNIQUE INDEX "PlanningGiftList_planningEventId_giftListId_key" ON "PlanningGiftList"("planningEventId", "giftListId");

-- CreateIndex
CREATE INDEX "PlanningDocument_familyId_planningEventId_idx" ON "PlanningDocument"("familyId", "planningEventId");

-- CreateIndex
CREATE INDEX "PlanningDocument_responsibleFamilyMemberId_status_idx" ON "PlanningDocument"("responsibleFamilyMemberId", "status");

-- CreateIndex
CREATE INDEX "PlanningDocument_createdByUserId_idx" ON "PlanningDocument"("createdByUserId");

-- CreateIndex
CREATE INDEX "ChecklistInstance_planningEventId_status_idx" ON "ChecklistInstance"("planningEventId", "status");

-- CreateIndex
CREATE INDEX "TaskOccurrence_planningEventId_status_idx" ON "TaskOccurrence"("planningEventId", "status");

-- CreateIndex
CREATE INDEX "TaskTemplate_planningEventId_idx" ON "TaskTemplate"("planningEventId");

-- AddForeignKey
ALTER TABLE "TaskTemplate" ADD CONSTRAINT "TaskTemplate_planningEventId_fkey" FOREIGN KEY ("planningEventId") REFERENCES "PlanningEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskOccurrence" ADD CONSTRAINT "TaskOccurrence_planningEventId_fkey" FOREIGN KEY ("planningEventId") REFERENCES "PlanningEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChecklistInstance" ADD CONSTRAINT "ChecklistInstance_planningEventId_fkey" FOREIGN KEY ("planningEventId") REFERENCES "PlanningEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanningEvent" ADD CONSTRAINT "PlanningEvent_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "Family"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanningEvent" ADD CONSTRAINT "PlanningEvent_calendarEventId_fkey" FOREIGN KEY ("calendarEventId") REFERENCES "CalendarEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanningEvent" ADD CONSTRAINT "PlanningEvent_costProjectId_fkey" FOREIGN KEY ("costProjectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanningEvent" ADD CONSTRAINT "PlanningEvent_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanningMember" ADD CONSTRAINT "PlanningMember_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "Family"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanningMember" ADD CONSTRAINT "PlanningMember_planningEventId_fkey" FOREIGN KEY ("planningEventId") REFERENCES "PlanningEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanningMember" ADD CONSTRAINT "PlanningMember_familyMemberId_fkey" FOREIGN KEY ("familyMemberId") REFERENCES "FamilyMember"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanningGuest" ADD CONSTRAINT "PlanningGuest_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "Family"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanningGuest" ADD CONSTRAINT "PlanningGuest_planningEventId_fkey" FOREIGN KEY ("planningEventId") REFERENCES "PlanningEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanningGuest" ADD CONSTRAINT "PlanningGuest_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "RelationshipContact"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanningGuest" ADD CONSTRAINT "PlanningGuest_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanningGiftList" ADD CONSTRAINT "PlanningGiftList_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "Family"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanningGiftList" ADD CONSTRAINT "PlanningGiftList_planningEventId_fkey" FOREIGN KEY ("planningEventId") REFERENCES "PlanningEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanningGiftList" ADD CONSTRAINT "PlanningGiftList_giftListId_fkey" FOREIGN KEY ("giftListId") REFERENCES "RelationshipGiftList"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanningGiftList" ADD CONSTRAINT "PlanningGiftList_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanningDocument" ADD CONSTRAINT "PlanningDocument_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "Family"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanningDocument" ADD CONSTRAINT "PlanningDocument_planningEventId_fkey" FOREIGN KEY ("planningEventId") REFERENCES "PlanningEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanningDocument" ADD CONSTRAINT "PlanningDocument_responsibleFamilyMemberId_fkey" FOREIGN KEY ("responsibleFamilyMemberId") REFERENCES "FamilyMember"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanningDocument" ADD CONSTRAINT "PlanningDocument_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
