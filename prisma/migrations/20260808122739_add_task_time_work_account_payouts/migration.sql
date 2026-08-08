-- CreateEnum
CREATE TYPE "TaskPayMode" AS ENUM ('NONE', 'FIXED_AMOUNT', 'HOURLY_RATE');

-- CreateEnum
CREATE TYPE "TaskTimeStatus" AS ENUM ('RUNNING', 'PAUSED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "TaskTimeSource" AS ENUM ('TIMER', 'MANUAL', 'TIME_MARK_IMPORT');

-- CreateEnum
CREATE TYPE "TaskTimeEventType" AS ENUM ('STARTED', 'PAUSED', 'RESUMED', 'COMPLETED', 'CANCELLED', 'REVIEWED', 'IMPORTED');

-- CreateEnum
CREATE TYPE "WorkAccountEntrySource" AS ENUM ('TASK_TIME', 'PAYOUT', 'ADJUSTMENT', 'REVERSAL');

-- CreateEnum
CREATE TYPE "WorkPayoutRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'PAID', 'REJECTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "WorkPayoutMethod" AS ENUM ('CASH', 'TRANSFER', 'OTHER');

-- AlterTable
ALTER TABLE "TaskOccurrence" ADD COLUMN     "expectedChildDurationMinutes" INTEGER,
ADD COLUMN     "fixedAmountCents" INTEGER,
ADD COLUMN     "hourlyRateCents" INTEGER,
ADD COLUMN     "payMode" "TaskPayMode" NOT NULL DEFAULT 'NONE',
ADD COLUMN     "timerWarningMinutes" INTEGER,
ADD COLUMN     "unpaidTimeRequiresApproval" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "TaskTemplate" ADD COLUMN     "expectedChildDurationMinutes" INTEGER,
ADD COLUMN     "fixedAmountCents" INTEGER,
ADD COLUMN     "hourlyRateCents" INTEGER,
ADD COLUMN     "payMode" "TaskPayMode" NOT NULL DEFAULT 'NONE',
ADD COLUMN     "timerWarningMinutes" INTEGER,
ADD COLUMN     "unpaidTimeRequiresApproval" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "TaskTimeEntry" (
    "id" TEXT NOT NULL,
    "familyId" TEXT NOT NULL,
    "taskOccurrenceId" TEXT NOT NULL,
    "childId" TEXT NOT NULL,
    "createdByUserId" TEXT,
    "source" "TaskTimeSource" NOT NULL DEFAULT 'TIMER',
    "status" "TaskTimeStatus" NOT NULL DEFAULT 'RUNNING',
    "startedAt" TIMESTAMP(3) NOT NULL,
    "endedAt" TIMESTAMP(3),
    "accumulatedPauseSeconds" INTEGER NOT NULL DEFAULT 0,
    "payMode" "TaskPayMode" NOT NULL DEFAULT 'NONE',
    "fixedAmountCents" INTEGER,
    "hourlyRateCents" INTEGER,
    "expectedChildDurationMinutes" INTEGER,
    "timerWarningMinutes" INTEGER,
    "unpaidTimeRequiresApproval" BOOLEAN NOT NULL DEFAULT false,
    "completionReason" TEXT,
    "cancellationReason" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "reviewedByUserId" TEXT,
    "reviewReason" TEXT,
    "timeMarkImportReceiptId" TEXT,
    "importReference" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TaskTimeEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaskTimePause" (
    "id" TEXT NOT NULL,
    "taskTimeEntryId" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL,
    "endedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TaskTimePause_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaskTimeEvent" (
    "id" TEXT NOT NULL,
    "familyId" TEXT NOT NULL,
    "taskTimeEntryId" TEXT NOT NULL,
    "type" "TaskTimeEventType" NOT NULL,
    "actorUserId" TEXT,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TaskTimeEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkAccountEntry" (
    "id" TEXT NOT NULL,
    "familyId" TEXT NOT NULL,
    "childId" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "balanceAfterCents" INTEGER NOT NULL,
    "source" "WorkAccountEntrySource" NOT NULL,
    "taskTimeEntryId" TEXT,
    "payoutRequestId" TEXT,
    "reversedEntryId" TEXT,
    "createdByUserId" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkAccountEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkPayoutRequest" (
    "id" TEXT NOT NULL,
    "familyId" TEXT NOT NULL,
    "childId" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "status" "WorkPayoutRequestStatus" NOT NULL DEFAULT 'PENDING',
    "method" "WorkPayoutMethod" NOT NULL,
    "requestedByUserId" TEXT,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedByUserId" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),
    "rejectedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "note" TEXT,
    "reviewReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkPayoutRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TimeMarkUserLink" (
    "id" TEXT NOT NULL,
    "familyId" TEXT NOT NULL,
    "familyMemberId" TEXT NOT NULL,
    "externalUserReference" TEXT NOT NULL,
    "createdByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TimeMarkUserLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TimeMarkImportReceipt" (
    "id" TEXT NOT NULL,
    "familyId" TEXT NOT NULL,
    "timeMarkUserLinkId" TEXT NOT NULL,
    "externalImportReference" TEXT NOT NULL,
    "importedByUserId" TEXT,
    "importedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TimeMarkImportReceipt_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TaskTimeEntry_familyId_status_startedAt_idx" ON "TaskTimeEntry"("familyId", "status", "startedAt");

-- CreateIndex
CREATE INDEX "TaskTimeEntry_taskOccurrenceId_startedAt_idx" ON "TaskTimeEntry"("taskOccurrenceId", "startedAt");

-- CreateIndex
CREATE INDEX "TaskTimeEntry_childId_startedAt_idx" ON "TaskTimeEntry"("childId", "startedAt");

-- CreateIndex
CREATE INDEX "TaskTimeEntry_timeMarkImportReceiptId_idx" ON "TaskTimeEntry"("timeMarkImportReceiptId");

-- CreateIndex
CREATE INDEX "TaskTimePause_taskTimeEntryId_startedAt_idx" ON "TaskTimePause"("taskTimeEntryId", "startedAt");

-- CreateIndex
CREATE INDEX "TaskTimeEvent_familyId_occurredAt_idx" ON "TaskTimeEvent"("familyId", "occurredAt");

-- CreateIndex
CREATE INDEX "TaskTimeEvent_taskTimeEntryId_occurredAt_idx" ON "TaskTimeEvent"("taskTimeEntryId", "occurredAt");

-- CreateIndex
CREATE UNIQUE INDEX "WorkAccountEntry_taskTimeEntryId_key" ON "WorkAccountEntry"("taskTimeEntryId");

-- CreateIndex
CREATE UNIQUE INDEX "WorkAccountEntry_payoutRequestId_key" ON "WorkAccountEntry"("payoutRequestId");

-- CreateIndex
CREATE UNIQUE INDEX "WorkAccountEntry_reversedEntryId_key" ON "WorkAccountEntry"("reversedEntryId");

-- CreateIndex
CREATE INDEX "WorkAccountEntry_familyId_childId_createdAt_idx" ON "WorkAccountEntry"("familyId", "childId", "createdAt");

-- CreateIndex
CREATE INDEX "WorkPayoutRequest_familyId_status_requestedAt_idx" ON "WorkPayoutRequest"("familyId", "status", "requestedAt");

-- CreateIndex
CREATE INDEX "WorkPayoutRequest_childId_status_requestedAt_idx" ON "WorkPayoutRequest"("childId", "status", "requestedAt");

-- CreateIndex
CREATE INDEX "TimeMarkUserLink_familyMemberId_idx" ON "TimeMarkUserLink"("familyMemberId");

-- CreateIndex
CREATE UNIQUE INDEX "TimeMarkUserLink_familyId_familyMemberId_key" ON "TimeMarkUserLink"("familyId", "familyMemberId");

-- CreateIndex
CREATE UNIQUE INDEX "TimeMarkUserLink_familyId_externalUserReference_key" ON "TimeMarkUserLink"("familyId", "externalUserReference");

-- CreateIndex
CREATE INDEX "TimeMarkImportReceipt_familyId_importedAt_idx" ON "TimeMarkImportReceipt"("familyId", "importedAt");

-- CreateIndex
CREATE UNIQUE INDEX "TimeMarkImportReceipt_timeMarkUserLinkId_externalImportRefe_key" ON "TimeMarkImportReceipt"("timeMarkUserLinkId", "externalImportReference");

-- AddForeignKey
ALTER TABLE "TaskTimeEntry" ADD CONSTRAINT "TaskTimeEntry_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "Family"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskTimeEntry" ADD CONSTRAINT "TaskTimeEntry_taskOccurrenceId_fkey" FOREIGN KEY ("taskOccurrenceId") REFERENCES "TaskOccurrence"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskTimeEntry" ADD CONSTRAINT "TaskTimeEntry_childId_fkey" FOREIGN KEY ("childId") REFERENCES "FamilyMember"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskTimeEntry" ADD CONSTRAINT "TaskTimeEntry_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskTimeEntry" ADD CONSTRAINT "TaskTimeEntry_reviewedByUserId_fkey" FOREIGN KEY ("reviewedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskTimeEntry" ADD CONSTRAINT "TaskTimeEntry_timeMarkImportReceiptId_fkey" FOREIGN KEY ("timeMarkImportReceiptId") REFERENCES "TimeMarkImportReceipt"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskTimePause" ADD CONSTRAINT "TaskTimePause_taskTimeEntryId_fkey" FOREIGN KEY ("taskTimeEntryId") REFERENCES "TaskTimeEntry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskTimeEvent" ADD CONSTRAINT "TaskTimeEvent_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "Family"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskTimeEvent" ADD CONSTRAINT "TaskTimeEvent_taskTimeEntryId_fkey" FOREIGN KEY ("taskTimeEntryId") REFERENCES "TaskTimeEntry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskTimeEvent" ADD CONSTRAINT "TaskTimeEvent_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkAccountEntry" ADD CONSTRAINT "WorkAccountEntry_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "Family"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkAccountEntry" ADD CONSTRAINT "WorkAccountEntry_childId_fkey" FOREIGN KEY ("childId") REFERENCES "FamilyMember"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkAccountEntry" ADD CONSTRAINT "WorkAccountEntry_taskTimeEntryId_fkey" FOREIGN KEY ("taskTimeEntryId") REFERENCES "TaskTimeEntry"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkAccountEntry" ADD CONSTRAINT "WorkAccountEntry_payoutRequestId_fkey" FOREIGN KEY ("payoutRequestId") REFERENCES "WorkPayoutRequest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkAccountEntry" ADD CONSTRAINT "WorkAccountEntry_reversedEntryId_fkey" FOREIGN KEY ("reversedEntryId") REFERENCES "WorkAccountEntry"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkAccountEntry" ADD CONSTRAINT "WorkAccountEntry_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkPayoutRequest" ADD CONSTRAINT "WorkPayoutRequest_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "Family"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkPayoutRequest" ADD CONSTRAINT "WorkPayoutRequest_childId_fkey" FOREIGN KEY ("childId") REFERENCES "FamilyMember"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkPayoutRequest" ADD CONSTRAINT "WorkPayoutRequest_requestedByUserId_fkey" FOREIGN KEY ("requestedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkPayoutRequest" ADD CONSTRAINT "WorkPayoutRequest_reviewedByUserId_fkey" FOREIGN KEY ("reviewedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimeMarkUserLink" ADD CONSTRAINT "TimeMarkUserLink_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "Family"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimeMarkUserLink" ADD CONSTRAINT "TimeMarkUserLink_familyMemberId_fkey" FOREIGN KEY ("familyMemberId") REFERENCES "FamilyMember"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimeMarkUserLink" ADD CONSTRAINT "TimeMarkUserLink_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimeMarkImportReceipt" ADD CONSTRAINT "TimeMarkImportReceipt_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "Family"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimeMarkImportReceipt" ADD CONSTRAINT "TimeMarkImportReceipt_timeMarkUserLinkId_fkey" FOREIGN KEY ("timeMarkUserLinkId") REFERENCES "TimeMarkUserLink"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimeMarkImportReceipt" ADD CONSTRAINT "TimeMarkImportReceipt_importedByUserId_fkey" FOREIGN KEY ("importedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
