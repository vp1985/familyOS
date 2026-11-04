-- AlterEnum
ALTER TYPE "MediaRestrictionType" ADD VALUE 'CONVERTED_TO_EDUCATION';

-- AlterTable
ALTER TABLE "MediaRestriction" ADD COLUMN     "childVisibleReasonLabel" TEXT,
ADD COLUMN     "convertedToEducationMinutes" INTEGER,
ADD COLUMN     "educationCategoryKey" TEXT,
ADD COLUMN     "linkedTaskOccurrenceId" TEXT;

-- CreateIndex
CREATE INDEX "MediaRestriction_linkedTaskOccurrenceId_idx" ON "MediaRestriction"("linkedTaskOccurrenceId");

-- AddForeignKey
ALTER TABLE "MediaRestriction" ADD CONSTRAINT "MediaRestriction_linkedTaskOccurrenceId_fkey" FOREIGN KEY ("linkedTaskOccurrenceId") REFERENCES "TaskOccurrence"("id") ON DELETE SET NULL ON UPDATE CASCADE;
