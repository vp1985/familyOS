-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('open', 'in_progress', 'done', 'confirmed', 'skipped', 'missed');

-- CreateEnum
CREATE TYPE "TaskRecurrenceType" AS ENUM ('once', 'daily', 'weekly', 'monthly', 'weekdays');

-- AlterEnum
ALTER TYPE "MoneyTransactionType" ADD VALUE 'reward';

-- CreateTable
CREATE TABLE "TaskTemplate" (
    "id" TEXT NOT NULL,
    "familyId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "requiresConfirmation" BOOLEAN NOT NULL DEFAULT true,
    "recurrenceType" "TaskRecurrenceType" NOT NULL DEFAULT 'once',
    "weekdays" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "dueTime" TEXT,
    "drachmenReward" INTEGER,
    "xpReward" INTEGER,
    "moneyRewardCents" INTEGER,
    "badgeRewardTitle" TEXT,
    "badgeRewardIcon" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TaskTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaskAssignment" (
    "id" TEXT NOT NULL,
    "taskTemplateId" TEXT NOT NULL,
    "familyMemberId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TaskAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaskSubTask" (
    "id" TEXT NOT NULL,
    "taskTemplateId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TaskSubTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaskOccurrence" (
    "id" TEXT NOT NULL,
    "familyId" TEXT NOT NULL,
    "taskTemplateId" TEXT NOT NULL,
    "familyMemberId" TEXT NOT NULL,
    "titleSnapshot" TEXT NOT NULL,
    "dueAt" TIMESTAMP(3),
    "status" "TaskStatus" NOT NULL DEFAULT 'open',
    "doneAt" TIMESTAMP(3),
    "confirmedAt" TIMESTAMP(3),
    "confirmedByUserId" TEXT,
    "drachmenReward" INTEGER,
    "xpReward" INTEGER,
    "moneyRewardCents" INTEGER,
    "badgeRewardTitle" TEXT,
    "badgeRewardIcon" TEXT,
    "rewardBookedAt" TIMESTAMP(3),
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TaskOccurrence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaskOccurrenceSubTask" (
    "id" TEXT NOT NULL,
    "taskOccurrenceId" TEXT NOT NULL,
    "titleSnapshot" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "TaskOccurrenceSubTask_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TaskTemplate_familyId_isActive_idx" ON "TaskTemplate"("familyId", "isActive");

-- CreateIndex
CREATE INDEX "TaskTemplate_createdByUserId_idx" ON "TaskTemplate"("createdByUserId");

-- CreateIndex
CREATE INDEX "TaskAssignment_familyMemberId_idx" ON "TaskAssignment"("familyMemberId");

-- CreateIndex
CREATE UNIQUE INDEX "TaskAssignment_taskTemplateId_familyMemberId_key" ON "TaskAssignment"("taskTemplateId", "familyMemberId");

-- CreateIndex
CREATE INDEX "TaskSubTask_taskTemplateId_position_idx" ON "TaskSubTask"("taskTemplateId", "position");

-- CreateIndex
CREATE INDEX "TaskOccurrence_familyId_dueAt_idx" ON "TaskOccurrence"("familyId", "dueAt");

-- CreateIndex
CREATE INDEX "TaskOccurrence_familyMemberId_dueAt_idx" ON "TaskOccurrence"("familyMemberId", "dueAt");

-- CreateIndex
CREATE INDEX "TaskOccurrence_taskTemplateId_idx" ON "TaskOccurrence"("taskTemplateId");

-- CreateIndex
CREATE INDEX "TaskOccurrence_status_idx" ON "TaskOccurrence"("status");

-- CreateIndex
CREATE INDEX "TaskOccurrenceSubTask_taskOccurrenceId_position_idx" ON "TaskOccurrenceSubTask"("taskOccurrenceId", "position");

-- AddForeignKey
ALTER TABLE "TaskTemplate" ADD CONSTRAINT "TaskTemplate_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "Family"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskTemplate" ADD CONSTRAINT "TaskTemplate_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskAssignment" ADD CONSTRAINT "TaskAssignment_taskTemplateId_fkey" FOREIGN KEY ("taskTemplateId") REFERENCES "TaskTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskAssignment" ADD CONSTRAINT "TaskAssignment_familyMemberId_fkey" FOREIGN KEY ("familyMemberId") REFERENCES "FamilyMember"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskSubTask" ADD CONSTRAINT "TaskSubTask_taskTemplateId_fkey" FOREIGN KEY ("taskTemplateId") REFERENCES "TaskTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskOccurrence" ADD CONSTRAINT "TaskOccurrence_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "Family"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskOccurrence" ADD CONSTRAINT "TaskOccurrence_taskTemplateId_fkey" FOREIGN KEY ("taskTemplateId") REFERENCES "TaskTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskOccurrence" ADD CONSTRAINT "TaskOccurrence_familyMemberId_fkey" FOREIGN KEY ("familyMemberId") REFERENCES "FamilyMember"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskOccurrence" ADD CONSTRAINT "TaskOccurrence_confirmedByUserId_fkey" FOREIGN KEY ("confirmedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskOccurrenceSubTask" ADD CONSTRAINT "TaskOccurrenceSubTask_taskOccurrenceId_fkey" FOREIGN KEY ("taskOccurrenceId") REFERENCES "TaskOccurrence"("id") ON DELETE CASCADE ON UPDATE CASCADE;
