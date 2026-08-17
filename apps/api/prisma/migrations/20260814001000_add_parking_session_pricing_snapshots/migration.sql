-- Completed sessions can be preserved only when their historical amount and
-- duration are available. Active and cancelled sessions fall back to the
-- current Parking rate and currency, as approved in the migration policy.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM "ParkingSession"
    WHERE "status" = 'COMPLETED'
      AND ("endTime" IS NULL OR "totalPrice" IS NULL OR "totalPrice" <= 0)
  ) THEN
    RAISE EXCEPTION
      'Completed ParkingSession data lacks a usable historical amount or duration. Export it and prepare a reviewed preservation migration before applying this migration.';
  END IF;
END $$;

ALTER TABLE "ParkingSession" ADD COLUMN "hourlyRateCents" INTEGER;
ALTER TABLE "ParkingSession" ADD COLUMN "currency" VARCHAR(3);
ALTER TABLE "ParkingSession" ADD COLUMN "totalAmountCents" INTEGER;

UPDATE "ParkingSession" AS session
SET
  "hourlyRateCents" = CASE
    WHEN session."status" = 'COMPLETED' THEN ROUND(
      (session."totalPrice" * 100) /
      GREATEST(1, CEIL(EXTRACT(EPOCH FROM (session."endTime" - session."startTime")) / 3600))
    )::INTEGER
    ELSE parking."hourlyRateCents"
  END,
  "currency" = parking."currency",
  "totalAmountCents" = CASE
    WHEN session."status" = 'COMPLETED' THEN ROUND(session."totalPrice" * 100)::INTEGER
    ELSE NULL
  END
FROM "Parking" AS parking
WHERE parking."id" = session."parkingId";

ALTER TABLE "ParkingSession" ALTER COLUMN "hourlyRateCents" SET NOT NULL;
ALTER TABLE "ParkingSession" ALTER COLUMN "currency" SET NOT NULL;

ALTER TABLE "ParkingSession"
  ADD CONSTRAINT "ParkingSession_hourlyRateCents_positive_check" CHECK ("hourlyRateCents" > 0),
  ADD CONSTRAINT "ParkingSession_currency_format_check" CHECK ("currency" ~ '^[A-Z]{3}$'),
  ADD CONSTRAINT "ParkingSession_totalAmountCents_nonnegative_check" CHECK ("totalAmountCents" IS NULL OR "totalAmountCents" >= 0),
  ADD CONSTRAINT "ParkingSession_completed_totalAmountCents_check" CHECK (
    "status" <> 'COMPLETED' OR "totalAmountCents" IS NOT NULL
  );

ALTER TABLE "ParkingSession" DROP COLUMN "totalPrice";
