-- AlterEnum
ALTER TYPE "FamilyUserRole" ADD VALUE 'child';

-- AlterTable
ALTER TABLE "BadgeAssignment" ADD COLUMN     "isPositive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "visibleToFamily" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Family" ADD COLUMN     "loginSlug" TEXT,
ADD COLUMN     "showPositiveBadgesToFamily" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "FamilyUser" ADD COLUMN     "childAccountEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "childLoginName" TEXT,
ADD COLUMN     "familyMemberId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Family_loginSlug_key" ON "Family"("loginSlug");

-- CreateIndex
CREATE INDEX "FamilyUser_familyMemberId_idx" ON "FamilyUser"("familyMemberId");

-- CreateIndex
CREATE UNIQUE INDEX "FamilyUser_familyId_childLoginName_key" ON "FamilyUser"("familyId", "childLoginName");

-- AddForeignKey
ALTER TABLE "FamilyUser" ADD CONSTRAINT "FamilyUser_familyMemberId_fkey" FOREIGN KEY ("familyMemberId") REFERENCES "FamilyMember"("id") ON DELETE CASCADE ON UPDATE CASCADE;
