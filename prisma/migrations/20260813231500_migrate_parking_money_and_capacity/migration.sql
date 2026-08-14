-- This is a reset-only migration for disposable development/demo data.
-- Do not apply it to preserved data: its currency must be identified and mapped
-- in a reviewed preservation migration before any monetary records are changed.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM "Parking") THEN
    RAISE EXCEPTION
      'Parking data exists. Reset disposable data, or create a reviewed currency-specific preservation migration before applying this migration.';
  END IF;
END $$;

ALTER TABLE "Parking" ADD COLUMN "hourlyRateCents" INTEGER;
ALTER TABLE "Parking" ADD COLUMN "currency" VARCHAR(3);
ALTER TABLE "Parking" ADD COLUMN "capacity" INTEGER;

-- If valuable data is explicitly approved for preservation, its separate migration
-- must convert the legacy value with ROUND("pricePerHour" * 100)::INTEGER and set
-- a verified currency for every preserved row.

ALTER TABLE "Parking" ALTER COLUMN "hourlyRateCents" SET NOT NULL;
ALTER TABLE "Parking" ALTER COLUMN "currency" SET NOT NULL;
ALTER TABLE "Parking" ALTER COLUMN "capacity" SET NOT NULL;

ALTER TABLE "Parking"
  ADD CONSTRAINT "Parking_hourlyRateCents_positive_check" CHECK ("hourlyRateCents" > 0),
  ADD CONSTRAINT "Parking_currency_format_check" CHECK ("currency" ~ '^[A-Z]{3}$'),
  ADD CONSTRAINT "Parking_capacity_positive_check" CHECK ("capacity" > 0);

ALTER TABLE "Parking" DROP COLUMN "pricePerHour";
ALTER TABLE "Parking" DROP COLUMN "totalSpaces";
