/*
  Warnings:

  - You are about to drop the column `pixCopyPaste` on the `Payment` table. All the data in the column will be lost.
  - You are about to drop the column `transactionId` on the `Payment` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[providerPaymentId]` on the table `Payment` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Payment_transactionId_idx";

-- AlterTable
ALTER TABLE "Payment" DROP COLUMN "pixCopyPaste",
DROP COLUMN "transactionId",
ADD COLUMN     "expiresAt" TIMESTAMP(3),
ADD COLUMN     "pixQrCodeBase64" TEXT,
ADD COLUMN     "providerPaymentId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Payment_providerPaymentId_key" ON "Payment"("providerPaymentId");
