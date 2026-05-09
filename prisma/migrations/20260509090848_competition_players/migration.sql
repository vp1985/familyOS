-- CreateTable
CREATE TABLE "CompetitionPlayer" (
    "id" TEXT NOT NULL,
    "familyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompetitionPlayer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CompetitionPlayer_familyId_name_idx" ON "CompetitionPlayer"("familyId", "name");

-- CreateIndex
CREATE INDEX "CompetitionPlayer_createdByUserId_idx" ON "CompetitionPlayer"("createdByUserId");

-- CreateIndex
CREATE UNIQUE INDEX "CompetitionPlayer_familyId_name_key" ON "CompetitionPlayer"("familyId", "name");

-- AddForeignKey
ALTER TABLE "CompetitionPlayer" ADD CONSTRAINT "CompetitionPlayer_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "Family"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompetitionPlayer" ADD CONSTRAINT "CompetitionPlayer_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
