-- AlterTable
ALTER TABLE "CalendarEvent" ADD COLUMN     "allDay" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "endsAt" TIMESTAMP(3),
ADD COLUMN     "externalEventId" TEXT,
ADD COLUMN     "location" TEXT,
ADD COLUMN     "sourceId" TEXT;

-- CreateTable
CREATE TABLE "CalendarSource" (
    "id" TEXT NOT NULL,
    "familyId" TEXT NOT NULL,
    "familyMemberId" TEXT,
    "provider" TEXT NOT NULL DEFAULT 'google_ical',
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "syncEnabled" BOOLEAN NOT NULL DEFAULT true,
    "lastSyncedAt" TIMESTAMP(3),
    "lastSyncError" TEXT,
    "createdByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CalendarSource_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CalendarSource_familyId_syncEnabled_idx" ON "CalendarSource"("familyId", "syncEnabled");

-- CreateIndex
CREATE INDEX "CalendarSource_familyMemberId_idx" ON "CalendarSource"("familyMemberId");

-- CreateIndex
CREATE INDEX "CalendarSource_createdByUserId_idx" ON "CalendarSource"("createdByUserId");

-- CreateIndex
CREATE INDEX "CalendarEvent_sourceId_idx" ON "CalendarEvent"("sourceId");

-- CreateIndex
CREATE UNIQUE INDEX "CalendarEvent_sourceId_externalEventId_key" ON "CalendarEvent"("sourceId", "externalEventId");

-- AddForeignKey
ALTER TABLE "CalendarEvent" ADD CONSTRAINT "CalendarEvent_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "CalendarSource"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalendarSource" ADD CONSTRAINT "CalendarSource_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "Family"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalendarSource" ADD CONSTRAINT "CalendarSource_familyMemberId_fkey" FOREIGN KEY ("familyMemberId") REFERENCES "FamilyMember"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalendarSource" ADD CONSTRAINT "CalendarSource_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

