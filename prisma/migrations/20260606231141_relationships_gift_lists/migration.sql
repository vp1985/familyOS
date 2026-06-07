-- CreateEnum
CREATE TYPE "RelationshipType" AS ENUM ('FRIEND', 'FAMILY', 'NEIGHBOR', 'SCHOOL_CLUB', 'OTHER');

-- CreateEnum
CREATE TYPE "RelationshipPreferenceCategory" AS ENUM ('DRINK', 'FOOD', 'HOBBY', 'GIFT_IDEA', 'ALLERGY', 'MEDICAL_NOTE', 'OTHER');

-- CreateEnum
CREATE TYPE "RelationshipPreferenceSentiment" AS ENUM ('LIKES', 'DISLIKES', 'NOTE');

-- CreateEnum
CREATE TYPE "RelationshipGiftOccasion" AS ENUM ('BIRTHDAY', 'CHRISTMAS', 'EASTER', 'SCHOOL', 'OTHER');

-- CreateEnum
CREATE TYPE "RelationshipGiftListVisibility" AS ENUM ('FAMILY_INTERNAL', 'ORGANIZERS_ONLY', 'HIDDEN_FROM_CHILDREN');

-- CreateEnum
CREATE TYPE "RelationshipGiftStatus" AS ENUM ('IDEA', 'WANTED', 'RESERVED', 'BOUGHT', 'DONE');

-- CreateTable
CREATE TABLE "RelationshipContact" (
    "id" TEXT NOT NULL,
    "familyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "relationshipType" "RelationshipType" NOT NULL DEFAULT 'FRIEND',
    "relatedFamilyMemberId" TEXT,
    "notes" TEXT,
    "createdByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RelationshipContact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RelationshipPreference" (
    "id" TEXT NOT NULL,
    "familyId" TEXT NOT NULL,
    "contactId" TEXT NOT NULL,
    "category" "RelationshipPreferenceCategory" NOT NULL,
    "label" TEXT NOT NULL,
    "sentiment" "RelationshipPreferenceSentiment" NOT NULL DEFAULT 'NOTE',
    "isFavorite" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RelationshipPreference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RelationshipGiftList" (
    "id" TEXT NOT NULL,
    "familyId" TEXT NOT NULL,
    "contactId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "occasion" "RelationshipGiftOccasion" NOT NULL DEFAULT 'OTHER',
    "eventDate" TIMESTAMP(3),
    "visibility" "RelationshipGiftListVisibility" NOT NULL DEFAULT 'FAMILY_INTERNAL',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RelationshipGiftList_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RelationshipGiftIdea" (
    "id" TEXT NOT NULL,
    "familyId" TEXT NOT NULL,
    "giftListId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "url" TEXT,
    "estimatedPriceCents" INTEGER,
    "priority" INTEGER NOT NULL DEFAULT 3,
    "status" "RelationshipGiftStatus" NOT NULL DEFAULT 'IDEA',
    "notes" TEXT,
    "createdByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RelationshipGiftIdea_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RelationshipContact_familyId_name_idx" ON "RelationshipContact"("familyId", "name");

-- CreateIndex
CREATE INDEX "RelationshipContact_relatedFamilyMemberId_idx" ON "RelationshipContact"("relatedFamilyMemberId");

-- CreateIndex
CREATE INDEX "RelationshipContact_createdByUserId_idx" ON "RelationshipContact"("createdByUserId");

-- CreateIndex
CREATE INDEX "RelationshipPreference_familyId_category_idx" ON "RelationshipPreference"("familyId", "category");

-- CreateIndex
CREATE INDEX "RelationshipPreference_contactId_idx" ON "RelationshipPreference"("contactId");

-- CreateIndex
CREATE INDEX "RelationshipGiftList_familyId_occasion_idx" ON "RelationshipGiftList"("familyId", "occasion");

-- CreateIndex
CREATE INDEX "RelationshipGiftList_contactId_idx" ON "RelationshipGiftList"("contactId");

-- CreateIndex
CREATE INDEX "RelationshipGiftIdea_familyId_status_idx" ON "RelationshipGiftIdea"("familyId", "status");

-- CreateIndex
CREATE INDEX "RelationshipGiftIdea_giftListId_idx" ON "RelationshipGiftIdea"("giftListId");

-- CreateIndex
CREATE INDEX "RelationshipGiftIdea_createdByUserId_idx" ON "RelationshipGiftIdea"("createdByUserId");

-- AddForeignKey
ALTER TABLE "RelationshipContact" ADD CONSTRAINT "RelationshipContact_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "Family"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RelationshipContact" ADD CONSTRAINT "RelationshipContact_relatedFamilyMemberId_fkey" FOREIGN KEY ("relatedFamilyMemberId") REFERENCES "FamilyMember"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RelationshipContact" ADD CONSTRAINT "RelationshipContact_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RelationshipPreference" ADD CONSTRAINT "RelationshipPreference_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "Family"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RelationshipPreference" ADD CONSTRAINT "RelationshipPreference_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "RelationshipContact"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RelationshipGiftList" ADD CONSTRAINT "RelationshipGiftList_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "Family"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RelationshipGiftList" ADD CONSTRAINT "RelationshipGiftList_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "RelationshipContact"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RelationshipGiftIdea" ADD CONSTRAINT "RelationshipGiftIdea_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "Family"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RelationshipGiftIdea" ADD CONSTRAINT "RelationshipGiftIdea_giftListId_fkey" FOREIGN KEY ("giftListId") REFERENCES "RelationshipGiftList"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RelationshipGiftIdea" ADD CONSTRAINT "RelationshipGiftIdea_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
