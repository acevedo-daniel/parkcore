DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM "Parking" WHERE "currency" <> 'USD')
    OR EXISTS (SELECT 1 FROM "ParkingSession" WHERE "currency" <> 'USD') THEN
    RAISE EXCEPTION 'Only USD currency can be migrated to the ParkCore 1.0 currency enum.';
  END IF;
END $$;

CREATE TYPE "Currency" AS ENUM ('USD');

ALTER TABLE "Parking"
  ALTER COLUMN "currency" TYPE "Currency" USING "currency"::"Currency";

ALTER TABLE "ParkingSession"
  ALTER COLUMN "currency" TYPE "Currency" USING "currency"::"Currency";
