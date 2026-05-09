-- AlterTable
ALTER TABLE "FamilyMember" ADD COLUMN     "childCanCreateCashAccounts" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "childCashAccountLimit" INTEGER NOT NULL DEFAULT 5;

-- AlterTable
ALTER TABLE "FinanceAccount" ADD COLUMN     "childCanBook" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "childManaged" BOOLEAN NOT NULL DEFAULT false;
