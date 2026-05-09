-- CreateEnum
CREATE TYPE "ChecklistKind" AS ENUM ('GENERAL', 'PACKING');

-- CreateEnum
CREATE TYPE "ChecklistStatus" AS ENUM ('OPEN', 'DONE', 'ARCHIVED');

-- CreateTable
CREATE TABLE "ChecklistTemplate" (
    "id" TEXT NOT NULL,
    "familyId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL DEFAULT 'Alltag',
    "kind" "ChecklistKind" NOT NULL DEFAULT 'GENERAL',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChecklistTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChecklistTemplateItem" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "note" TEXT,
    "quantityLabel" TEXT,
    "required" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChecklistTemplateItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChecklistInstance" (
    "id" TEXT NOT NULL,
    "familyId" TEXT NOT NULL,
    "templateId" TEXT,
    "taskTemplateId" TEXT,
    "taskOccurrenceId" TEXT,
    "assignedFamilyMemberId" TEXT,
    "titleSnapshot" TEXT NOT NULL,
    "categorySnapshot" TEXT NOT NULL DEFAULT 'Alltag',
    "kindSnapshot" "ChecklistKind" NOT NULL DEFAULT 'GENERAL',
    "status" "ChecklistStatus" NOT NULL DEFAULT 'OPEN',
    "createdByUserId" TEXT NOT NULL,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChecklistInstance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChecklistItemInstance" (
    "id" TEXT NOT NULL,
    "checklistInstanceId" TEXT NOT NULL,
    "titleSnapshot" TEXT NOT NULL,
    "noteSnapshot" TEXT,
    "quantityLabelSnapshot" TEXT,
    "requiredSnapshot" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "checked" BOOLEAN NOT NULL DEFAULT false,
    "checkedByUserId" TEXT,
    "checkedAt" TIMESTAMP(3),

    CONSTRAINT "ChecklistItemInstance_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ChecklistTemplate_familyId_active_idx" ON "ChecklistTemplate"("familyId", "active");

-- CreateIndex
CREATE INDEX "ChecklistTemplate_createdByUserId_idx" ON "ChecklistTemplate"("createdByUserId");

-- CreateIndex
CREATE INDEX "ChecklistTemplateItem_templateId_sortOrder_idx" ON "ChecklistTemplateItem"("templateId", "sortOrder");

-- CreateIndex
CREATE INDEX "ChecklistInstance_familyId_status_idx" ON "ChecklistInstance"("familyId", "status");

-- CreateIndex
CREATE INDEX "ChecklistInstance_taskOccurrenceId_idx" ON "ChecklistInstance"("taskOccurrenceId");

-- CreateIndex
CREATE INDEX "ChecklistInstance_assignedFamilyMemberId_status_idx" ON "ChecklistInstance"("assignedFamilyMemberId", "status");

-- CreateIndex
CREATE INDEX "ChecklistInstance_createdByUserId_idx" ON "ChecklistInstance"("createdByUserId");

-- CreateIndex
CREATE INDEX "ChecklistItemInstance_checklistInstanceId_sortOrder_idx" ON "ChecklistItemInstance"("checklistInstanceId", "sortOrder");

-- CreateIndex
CREATE INDEX "ChecklistItemInstance_checkedByUserId_idx" ON "ChecklistItemInstance"("checkedByUserId");

-- AddForeignKey
ALTER TABLE "ChecklistTemplate" ADD CONSTRAINT "ChecklistTemplate_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "Family"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChecklistTemplate" ADD CONSTRAINT "ChecklistTemplate_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChecklistTemplateItem" ADD CONSTRAINT "ChecklistTemplateItem_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "ChecklistTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChecklistInstance" ADD CONSTRAINT "ChecklistInstance_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "Family"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChecklistInstance" ADD CONSTRAINT "ChecklistInstance_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "ChecklistTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChecklistInstance" ADD CONSTRAINT "ChecklistInstance_taskTemplateId_fkey" FOREIGN KEY ("taskTemplateId") REFERENCES "TaskTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChecklistInstance" ADD CONSTRAINT "ChecklistInstance_taskOccurrenceId_fkey" FOREIGN KEY ("taskOccurrenceId") REFERENCES "TaskOccurrence"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChecklistInstance" ADD CONSTRAINT "ChecklistInstance_assignedFamilyMemberId_fkey" FOREIGN KEY ("assignedFamilyMemberId") REFERENCES "FamilyMember"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChecklistInstance" ADD CONSTRAINT "ChecklistInstance_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChecklistItemInstance" ADD CONSTRAINT "ChecklistItemInstance_checklistInstanceId_fkey" FOREIGN KEY ("checklistInstanceId") REFERENCES "ChecklistInstance"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChecklistItemInstance" ADD CONSTRAINT "ChecklistItemInstance_checkedByUserId_fkey" FOREIGN KEY ("checkedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
