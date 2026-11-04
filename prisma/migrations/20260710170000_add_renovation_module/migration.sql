-- Renovation module switch and first floorplan slice
ALTER TABLE "Family" ADD COLUMN "renovationModuleEnabled" BOOLEAN NOT NULL DEFAULT false;

CREATE TYPE "RenovationProjectStatus" AS ENUM ('IDEA', 'PLANNED', 'ACTIVE', 'PAUSED', 'DONE', 'ARCHIVED');
CREATE TYPE "RenovationRoomStatus" AS ENUM ('OPEN', 'PLANNED', 'IN_PROGRESS', 'BLOCKED', 'DONE', 'ARCHIVED');
CREATE TYPE "RenovationRoomShapeType" AS ENUM ('RECTANGLE', 'L_SHAPE', 'POLYGON');
CREATE TYPE "RenovationFloorPlanMarkerType" AS ENUM ('DOOR', 'WINDOW', 'SOCKET', 'RADIATOR', 'WATER', 'DRAIN', 'NOTE', 'SLOPE_LINE');

CREATE TABLE "RenovationProject" (
  "id" TEXT NOT NULL,
  "familyId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "status" "RenovationProjectStatus" NOT NULL DEFAULT 'IDEA',
  "priority" INTEGER NOT NULL DEFAULT 3,
  "startDate" TIMESTAMP(3),
  "targetDate" TIMESTAMP(3),
  "budgetCents" INTEGER,
  "linkedProjectId" TEXT,
  "createdByUserId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "RenovationProject_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "RenovationRoom" (
  "id" TEXT NOT NULL,
  "familyId" TEXT NOT NULL,
  "renovationProjectId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "category" TEXT NOT NULL DEFAULT 'Raum',
  "floorLabel" TEXT,
  "description" TEXT,
  "status" "RenovationRoomStatus" NOT NULL DEFAULT 'OPEN',
  "lengthMm" INTEGER,
  "widthMm" INTEGER,
  "heightMm" INTEGER,
  "floorAreaM2Override" DOUBLE PRECISION,
  "wallAreaM2Override" DOUBLE PRECISION,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "RenovationRoom_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "RenovationFloorPlan" (
  "id" TEXT NOT NULL,
  "roomId" TEXT NOT NULL,
  "shapeType" "RenovationRoomShapeType" NOT NULL DEFAULT 'RECTANGLE',
  "pointsJson" TEXT,
  "scaleJson" TEXT,
  "backgroundDocumentId" TEXT,
  "backgroundTransformJson" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "RenovationFloorPlan_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "RenovationFloorPlanMarker" (
  "id" TEXT NOT NULL,
  "floorPlanId" TEXT NOT NULL,
  "type" "RenovationFloorPlanMarkerType" NOT NULL,
  "label" TEXT NOT NULL,
  "wall" TEXT,
  "xM" DOUBLE PRECISION,
  "yM" DOUBLE PRECISION,
  "widthM" DOUBLE PRECISION,
  "note" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "RenovationFloorPlanMarker_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "RenovationProject_familyId_status_idx" ON "RenovationProject"("familyId", "status");
CREATE INDEX "RenovationProject_linkedProjectId_idx" ON "RenovationProject"("linkedProjectId");
CREATE INDEX "RenovationProject_createdByUserId_idx" ON "RenovationProject"("createdByUserId");
CREATE INDEX "RenovationRoom_familyId_renovationProjectId_sortOrder_idx" ON "RenovationRoom"("familyId", "renovationProjectId", "sortOrder");
CREATE INDEX "RenovationRoom_renovationProjectId_idx" ON "RenovationRoom"("renovationProjectId");
CREATE UNIQUE INDEX "RenovationFloorPlan_roomId_key" ON "RenovationFloorPlan"("roomId");
CREATE INDEX "RenovationFloorPlanMarker_floorPlanId_type_idx" ON "RenovationFloorPlanMarker"("floorPlanId", "type");

ALTER TABLE "RenovationProject" ADD CONSTRAINT "RenovationProject_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "Family"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RenovationProject" ADD CONSTRAINT "RenovationProject_linkedProjectId_fkey" FOREIGN KEY ("linkedProjectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "RenovationProject" ADD CONSTRAINT "RenovationProject_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "RenovationRoom" ADD CONSTRAINT "RenovationRoom_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "Family"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RenovationRoom" ADD CONSTRAINT "RenovationRoom_renovationProjectId_fkey" FOREIGN KEY ("renovationProjectId") REFERENCES "RenovationProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RenovationFloorPlan" ADD CONSTRAINT "RenovationFloorPlan_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "RenovationRoom"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RenovationFloorPlanMarker" ADD CONSTRAINT "RenovationFloorPlanMarker_floorPlanId_fkey" FOREIGN KEY ("floorPlanId") REFERENCES "RenovationFloorPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;
