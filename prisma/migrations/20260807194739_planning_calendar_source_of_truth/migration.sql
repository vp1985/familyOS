/*
  Warnings:

  - You are about to drop the column `description` on the `PlanningEvent` table. All the data in the column will be lost.
  - You are about to drop the column `endsAt` on the `PlanningEvent` table. All the data in the column will be lost.
  - You are about to drop the column `location` on the `PlanningEvent` table. All the data in the column will be lost.
  - You are about to drop the column `startsAt` on the `PlanningEvent` table. All the data in the column will be lost.
  - You are about to drop the column `title` on the `PlanningEvent` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "PlanningEvent_familyId_status_startsAt_idx";

-- AlterTable
ALTER TABLE "PlanningEvent" DROP COLUMN "description",
DROP COLUMN "endsAt",
DROP COLUMN "location",
DROP COLUMN "startsAt",
DROP COLUMN "title";

-- CreateIndex
CREATE INDEX "PlanningEvent_familyId_status_createdAt_idx" ON "PlanningEvent"("familyId", "status", "createdAt");
