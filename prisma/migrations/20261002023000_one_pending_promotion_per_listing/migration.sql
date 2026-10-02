CREATE UNIQUE INDEX "ListingPromotion_one_pending_per_listing"
ON "ListingPromotion" ("listingId")
WHERE "status" = 'PENDING';
