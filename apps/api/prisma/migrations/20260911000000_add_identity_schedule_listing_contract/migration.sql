-- CreateEnum
CREATE TYPE "UserKind" AS ENUM ('OWNER', 'DEMO', 'SHOWCASE');

-- AlterTable
ALTER TABLE "User"
  ALTER COLUMN "email" DROP NOT NULL,
  ALTER COLUMN "passwordHash" DROP NOT NULL,
  ADD COLUMN "kind" "UserKind" NOT NULL DEFAULT 'OWNER',
  ADD COLUMN "timezone" TEXT NOT NULL DEFAULT 'America/Argentina/Buenos_Aires',
  ADD COLUMN "demoExpiresAt" TIMESTAMP(3);

-- Existing credentialed accounts remain owners. The default is explicit and
-- the conditional checks below prevent future non-owner credentials.
ALTER TABLE "User"
  ADD CONSTRAINT "User_kind_credentials_check" CHECK (
    ("kind" = 'OWNER' AND "email" IS NOT NULL AND "passwordHash" IS NOT NULL)
    OR ("kind" IN ('DEMO', 'SHOWCASE') AND "email" IS NULL AND "passwordHash" IS NULL)
  ),
  ADD CONSTRAINT "User_demo_expiry_check" CHECK (
    ("kind" = 'DEMO' AND "demoExpiresAt" IS NOT NULL)
    OR ("kind" IN ('OWNER', 'SHOWCASE') AND "demoExpiresAt" IS NULL)
  ),
  ADD CONSTRAINT "User_timezone_nonempty_check" CHECK (btrim("timezone") <> '');

-- AlterTable
ALTER TABLE "Parking"
  ADD COLUMN "neighborhood" TEXT NOT NULL DEFAULT 'Unspecified',
  ADD COLUMN "timezone" TEXT NOT NULL DEFAULT 'America/Argentina/Buenos_Aires',
  ADD COLUMN "is24Hours" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "opensAt" TEXT,
  ADD COLUMN "closesAt" TEXT,
  ADD COLUMN "isListed" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "Parking" ALTER COLUMN "neighborhood" DROP DEFAULT;

ALTER TABLE "Parking"
  ADD CONSTRAINT "Parking_timezone_nonempty_check" CHECK (btrim("timezone") <> ''),
  ADD CONSTRAINT "Parking_schedule_shape_check" CHECK (
    ("is24Hours" = true AND "opensAt" IS NULL AND "closesAt" IS NULL)
    OR (
      "is24Hours" = false
      AND "opensAt" IS NOT NULL
      AND "closesAt" IS NOT NULL
      AND "opensAt" ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'
      AND "closesAt" ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'
      AND "opensAt" <> "closesAt"
    )
  );

-- Expand the currency enum without converting existing USD records.
ALTER TYPE "Currency" RENAME TO "Currency_old";
CREATE TYPE "Currency" AS ENUM ('ARS', 'USD');

ALTER TABLE "Parking"
  ALTER COLUMN "currency" TYPE "Currency"
  USING "currency"::text::"Currency";

ALTER TABLE "ParkingSession"
  ALTER COLUMN "currency" TYPE "Currency"
  USING "currency"::text::"Currency";

DROP TYPE "Currency_old";

-- CreateIndex
CREATE INDEX "User_kind_idx" ON "User"("kind");
CREATE INDEX "Parking_ownerId_isListed_isActive_idx"
  ON "Parking"("ownerId", "isListed", "isActive");
CREATE INDEX "Parking_isListed_isActive_idx"
  ON "Parking"("isListed", "isActive");
