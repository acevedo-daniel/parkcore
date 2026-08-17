ALTER TABLE "ParkingSession"
  ADD COLUMN "customerName" TEXT,
  ADD COLUMN "customerPhone" TEXT,
  ADD COLUMN "notes" TEXT;

UPDATE "ParkingSession" AS session
SET
  "customerName" = vehicle."customerName",
  "customerPhone" = vehicle."customerPhone",
  "notes" = vehicle."notes"
FROM "Vehicle" AS vehicle
WHERE vehicle.id = session."vehicleId";

ALTER TABLE "Vehicle"
  DROP COLUMN "customerName",
  DROP COLUMN "customerPhone",
  DROP COLUMN "notes";
