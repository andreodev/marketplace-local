ALTER TABLE "ListingImage" ADD COLUMN "storageKey" VARCHAR(200);
CREATE UNIQUE INDEX "ListingImage_storageKey_key" ON "ListingImage"("storageKey");
