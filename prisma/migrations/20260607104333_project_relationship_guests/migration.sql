-- CreateTable
CREATE TABLE "ProjectGuest" (
    "id" TEXT NOT NULL,
    "familyId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "contactId" TEXT NOT NULL,
    "createdByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProjectGuest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProjectGuest_familyId_projectId_idx" ON "ProjectGuest"("familyId", "projectId");

-- CreateIndex
CREATE INDEX "ProjectGuest_contactId_idx" ON "ProjectGuest"("contactId");

-- CreateIndex
CREATE INDEX "ProjectGuest_createdByUserId_idx" ON "ProjectGuest"("createdByUserId");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectGuest_projectId_contactId_key" ON "ProjectGuest"("projectId", "contactId");

-- AddForeignKey
ALTER TABLE "ProjectGuest" ADD CONSTRAINT "ProjectGuest_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "Family"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectGuest" ADD CONSTRAINT "ProjectGuest_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectGuest" ADD CONSTRAINT "ProjectGuest_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "RelationshipContact"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectGuest" ADD CONSTRAINT "ProjectGuest_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
