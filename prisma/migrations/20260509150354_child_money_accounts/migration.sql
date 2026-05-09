-- CreateEnum
CREATE TYPE "FinanceAccountKind" AS ENUM ('CASH', 'GIRO', 'SAVINGS', 'DAY_MONEY', 'HOME_SAVINGS', 'OTHER');

-- DropIndex
DROP INDEX "FinanceAccount_familyMemberId_key";

-- AlterTable
ALTER TABLE "ChildLedgerEntry" ADD COLUMN     "financeAccountId" TEXT;

-- AlterTable
ALTER TABLE "FinanceAccount" ADD COLUMN     "isDefault" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "kind" "FinanceAccountKind" NOT NULL DEFAULT 'CASH',
ADD COLUMN     "name" TEXT NOT NULL DEFAULT 'Kinderkonto';

-- AlterTable
ALTER TABLE "MoneyOccurrence" ADD COLUMN     "autoConfirmSnapshot" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "bookedTransactionId" TEXT,
ADD COLUMN     "financeAccountIdSnapshot" TEXT;

-- AlterTable
ALTER TABLE "MoneyRule" ADD COLUMN     "autoConfirm" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "financeAccountId" TEXT;

-- AlterTable
ALTER TABLE "MoneyTransaction" ADD COLUMN     "financeAccountId" TEXT;

-- CreateIndex
CREATE INDEX "ChildLedgerEntry_financeAccountId_occurredAt_idx" ON "ChildLedgerEntry"("financeAccountId", "occurredAt");

-- CreateIndex
CREATE INDEX "FinanceAccount_familyMemberId_idx" ON "FinanceAccount"("familyMemberId");

-- CreateIndex
CREATE INDEX "MoneyOccurrence_bookedTransactionId_idx" ON "MoneyOccurrence"("bookedTransactionId");

-- CreateIndex
CREATE INDEX "MoneyRule_financeAccountId_idx" ON "MoneyRule"("financeAccountId");

-- CreateIndex
CREATE INDEX "MoneyTransaction_financeAccountId_createdAt_idx" ON "MoneyTransaction"("financeAccountId", "createdAt");

-- AddForeignKey
ALTER TABLE "MoneyTransaction" ADD CONSTRAINT "MoneyTransaction_financeAccountId_fkey" FOREIGN KEY ("financeAccountId") REFERENCES "FinanceAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MoneyRule" ADD CONSTRAINT "MoneyRule_financeAccountId_fkey" FOREIGN KEY ("financeAccountId") REFERENCES "FinanceAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MoneyOccurrence" ADD CONSTRAINT "MoneyOccurrence_bookedTransactionId_fkey" FOREIGN KEY ("bookedTransactionId") REFERENCES "MoneyTransaction"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChildLedgerEntry" ADD CONSTRAINT "ChildLedgerEntry_financeAccountId_fkey" FOREIGN KEY ("financeAccountId") REFERENCES "FinanceAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;
