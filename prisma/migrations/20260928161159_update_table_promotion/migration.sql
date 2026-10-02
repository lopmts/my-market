/*
  Warnings:

  - You are about to drop the column `price` on the `Promotion` table. All the data in the column will be lost.
  - Added the required column `discountValue` to the `Promotion` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "DiscountType" AS ENUM ('PERCENTAGE', 'FIXED_PRICE');

-- DropIndex
DROP INDEX "Promotion_productId_idx";

-- AlterTable
ALTER TABLE "OrderItem" ADD COLUMN     "promotionId" TEXT;

-- AlterTable
ALTER TABLE "Promotion" DROP COLUMN "price",
ADD COLUMN     "active" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "discountType" "DiscountType" NOT NULL DEFAULT 'PERCENTAGE',
ADD COLUMN     "discountValue" DECIMAL(10,2) NOT NULL,
ADD COLUMN     "endsAt" TIMESTAMP(3),
ADD COLUMN     "startsAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateIndex
CREATE INDEX "Promotion_productId_active_startsAt_endsAt_idx" ON "Promotion"("productId", "active", "startsAt", "endsAt");

-- CreateIndex
CREATE INDEX "Promotion_endsAt_idx" ON "Promotion"("endsAt");

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_promotionId_fkey" FOREIGN KEY ("promotionId") REFERENCES "Promotion"("id") ON DELETE SET NULL ON UPDATE CASCADE;
