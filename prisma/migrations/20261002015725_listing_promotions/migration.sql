-- CreateEnum
CREATE TYPE "PromotionStatus" AS ENUM ('PENDING', 'PAID', 'CANCELLED');

-- AlterTable
ALTER TABLE "Listing" ADD COLUMN     "featuredUntil" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "ListingPromotion" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,
    "status" "PromotionStatus" NOT NULL DEFAULT 'PENDING',
    "amountCents" INTEGER NOT NULL,
    "durationDays" INTEGER NOT NULL,
    "providerPaymentId" VARCHAR(100),
    "pixCode" TEXT,
    "pixQrCodeBase64" TEXT,
    "expiresAt" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),
    "appliedUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ListingPromotion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ListingPromotion_providerPaymentId_key" ON "ListingPromotion"("providerPaymentId");

-- CreateIndex
CREATE INDEX "ListingPromotion_listingId_createdAt_idx" ON "ListingPromotion"("listingId", "createdAt");

-- CreateIndex
CREATE INDEX "ListingPromotion_sellerId_createdAt_idx" ON "ListingPromotion"("sellerId", "createdAt");

-- CreateIndex
CREATE INDEX "Listing_status_featuredUntil_idx" ON "Listing"("status", "featuredUntil");

-- AddForeignKey
ALTER TABLE "ListingPromotion" ADD CONSTRAINT "ListingPromotion_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListingPromotion" ADD CONSTRAINT "ListingPromotion_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
