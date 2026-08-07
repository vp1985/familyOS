-- AlterEnum
ALTER TYPE "MoneyTransactionType" ADD VALUE 'reversal';

-- AlterTable
ALTER TABLE "MoneyTransaction" ADD COLUMN "reversalTransactionId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "MoneyTransaction_reversalTransactionId_key" ON "MoneyTransaction"("reversalTransactionId");

-- AddForeignKey
ALTER TABLE "MoneyTransaction" ADD CONSTRAINT "MoneyTransaction_reversalTransactionId_fkey" FOREIGN KEY ("reversalTransactionId") REFERENCES "MoneyTransaction"("id") ON DELETE SET NULL ON UPDATE CASCADE;
