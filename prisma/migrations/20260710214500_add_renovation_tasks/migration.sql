-- Renovation work packages and tasks
CREATE TYPE "RenovationTaskStatus" AS ENUM ('OPEN', 'PLANNED', 'IN_PROGRESS', 'BLOCKED', 'DONE', 'ARCHIVED');

CREATE TABLE "RenovationWorkPackage" (
  "id" TEXT NOT NULL,
  "familyId" TEXT NOT NULL,
  "renovationProjectId" TEXT NOT NULL,
  "roomId" TEXT,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "status" "RenovationTaskStatus" NOT NULL DEFAULT 'OPEN',
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdByUserId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "RenovationWorkPackage_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "RenovationTask" (
  "id" TEXT NOT NULL,
  "familyId" TEXT NOT NULL,
  "renovationProjectId" TEXT NOT NULL,
  "roomId" TEXT,
  "workPackageId" TEXT,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "status" "RenovationTaskStatus" NOT NULL DEFAULT 'OPEN',
  "blockerNote" TEXT,
  "dueDate" TIMESTAMP(3),
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdByUserId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "RenovationTask_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "RenovationWorkPackage_familyId_renovationProjectId_status_idx" ON "RenovationWorkPackage"("familyId", "renovationProjectId", "status");
CREATE INDEX "RenovationWorkPackage_roomId_idx" ON "RenovationWorkPackage"("roomId");
CREATE INDEX "RenovationWorkPackage_createdByUserId_idx" ON "RenovationWorkPackage"("createdByUserId");
CREATE INDEX "RenovationTask_familyId_renovationProjectId_status_idx" ON "RenovationTask"("familyId", "renovationProjectId", "status");
CREATE INDEX "RenovationTask_roomId_idx" ON "RenovationTask"("roomId");
CREATE INDEX "RenovationTask_workPackageId_idx" ON "RenovationTask"("workPackageId");
CREATE INDEX "RenovationTask_createdByUserId_idx" ON "RenovationTask"("createdByUserId");

ALTER TABLE "RenovationWorkPackage" ADD CONSTRAINT "RenovationWorkPackage_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "Family"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RenovationWorkPackage" ADD CONSTRAINT "RenovationWorkPackage_renovationProjectId_fkey" FOREIGN KEY ("renovationProjectId") REFERENCES "RenovationProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RenovationWorkPackage" ADD CONSTRAINT "RenovationWorkPackage_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "RenovationRoom"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "RenovationWorkPackage" ADD CONSTRAINT "RenovationWorkPackage_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "RenovationTask" ADD CONSTRAINT "RenovationTask_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "Family"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RenovationTask" ADD CONSTRAINT "RenovationTask_renovationProjectId_fkey" FOREIGN KEY ("renovationProjectId") REFERENCES "RenovationProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RenovationTask" ADD CONSTRAINT "RenovationTask_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "RenovationRoom"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "RenovationTask" ADD CONSTRAINT "RenovationTask_workPackageId_fkey" FOREIGN KEY ("workPackageId") REFERENCES "RenovationWorkPackage"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "RenovationTask" ADD CONSTRAINT "RenovationTask_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
