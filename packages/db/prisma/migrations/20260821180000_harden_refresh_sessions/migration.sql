-- Existing sessions become independent families so the migration is safe for
-- databases created before refresh-token reuse detection was introduced.
ALTER TABLE "RefreshToken"
ADD COLUMN "familyId" TEXT,
ADD COLUMN "replacedByTokenHash" TEXT;

UPDATE "RefreshToken"
SET "familyId" = "id"
WHERE "familyId" IS NULL;

ALTER TABLE "RefreshToken"
ALTER COLUMN "familyId" SET NOT NULL;

DROP INDEX IF EXISTS "RefreshToken_userId_idx";
CREATE UNIQUE INDEX "RefreshToken_tokenHash_key" ON "RefreshToken"("tokenHash");
CREATE INDEX "RefreshToken_userId_familyId_idx" ON "RefreshToken"("userId", "familyId");
