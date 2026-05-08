-- CreateEnum
CREATE TYPE "ProjectStatus" AS ENUM ('active', 'done', 'archived');

-- CreateEnum
CREATE TYPE "ProjectExpenseStatus" AS ENUM ('active', 'voided');

-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL,
    "familyId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "ProjectStatus" NOT NULL DEFAULT 'active',
    "createdByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectParticipant" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "familyMemberId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProjectParticipant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectExpense" (
    "id" TEXT NOT NULL,
    "familyId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "amountCents" INTEGER NOT NULL,
    "paidByMemberId" TEXT NOT NULL,
    "createdByUserId" TEXT NOT NULL,
    "expenseDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "ProjectExpenseStatus" NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProjectExpense_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectExpenseShare" (
    "id" TEXT NOT NULL,
    "expenseId" TEXT NOT NULL,
    "familyMemberId" TEXT NOT NULL,
    "shareCents" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProjectExpenseShare_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Project_familyId_createdAt_idx" ON "Project"("familyId", "createdAt");

-- CreateIndex
CREATE INDEX "Project_createdByUserId_idx" ON "Project"("createdByUserId");

-- CreateIndex
CREATE INDEX "ProjectParticipant_familyMemberId_idx" ON "ProjectParticipant"("familyMemberId");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectParticipant_projectId_familyMemberId_key" ON "ProjectParticipant"("projectId", "familyMemberId");

-- CreateIndex
CREATE INDEX "ProjectExpense_familyId_createdAt_idx" ON "ProjectExpense"("familyId", "createdAt");

-- CreateIndex
CREATE INDEX "ProjectExpense_projectId_expenseDate_idx" ON "ProjectExpense"("projectId", "expenseDate");

-- CreateIndex
CREATE INDEX "ProjectExpense_paidByMemberId_idx" ON "ProjectExpense"("paidByMemberId");

-- CreateIndex
CREATE INDEX "ProjectExpenseShare_familyMemberId_idx" ON "ProjectExpenseShare"("familyMemberId");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectExpenseShare_expenseId_familyMemberId_key" ON "ProjectExpenseShare"("expenseId", "familyMemberId");

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "Family"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectParticipant" ADD CONSTRAINT "ProjectParticipant_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectParticipant" ADD CONSTRAINT "ProjectParticipant_familyMemberId_fkey" FOREIGN KEY ("familyMemberId") REFERENCES "FamilyMember"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectExpense" ADD CONSTRAINT "ProjectExpense_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "Family"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectExpense" ADD CONSTRAINT "ProjectExpense_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectExpense" ADD CONSTRAINT "ProjectExpense_paidByMemberId_fkey" FOREIGN KEY ("paidByMemberId") REFERENCES "FamilyMember"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectExpense" ADD CONSTRAINT "ProjectExpense_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectExpenseShare" ADD CONSTRAINT "ProjectExpenseShare_expenseId_fkey" FOREIGN KEY ("expenseId") REFERENCES "ProjectExpense"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectExpenseShare" ADD CONSTRAINT "ProjectExpenseShare_familyMemberId_fkey" FOREIGN KEY ("familyMemberId") REFERENCES "FamilyMember"("id") ON DELETE CASCADE ON UPDATE CASCADE;
