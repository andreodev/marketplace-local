ALTER TABLE "Listing"
  ADD COLUMN "accountPlatform" VARCHAR(80),
  ADD COLUMN "accountType" VARCHAR(30),
  ADD COLUMN "accountPolicyUrl" VARCHAR(500),
  ADD COLUMN "accountTransferConfirmed" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "moderationNote" VARCHAR(500);

UPDATE "Listing"
SET "status" = 'PENDING_REVIEW'
WHERE "status" = 'ACTIVE'
  AND "categoryId" IN (
    SELECT "id" FROM "Category" WHERE "slug" = 'contas-digitais'
  );
