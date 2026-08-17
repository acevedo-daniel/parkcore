-- This migration is reset-only. PENDING records cannot be reinterpreted, and
-- preserved data must be exported and handled by an explicit reviewed plan.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM "Booking") THEN
    RAISE EXCEPTION
      'Booking data exists. Export preserved data or reset disposable data before applying the ParkingSession migration.';
  END IF;
END $$;

ALTER TABLE "Booking" RENAME TO "ParkingSession";
ALTER TABLE "ParkingSession" RENAME CONSTRAINT "Booking_pkey" TO "ParkingSession_pkey";
ALTER TABLE "ParkingSession"
  RENAME CONSTRAINT "Booking_parkingId_fkey" TO "ParkingSession_parkingId_fkey";
ALTER TABLE "ParkingSession"
  RENAME CONSTRAINT "Booking_vehicleId_fkey" TO "ParkingSession_vehicleId_fkey";
ALTER INDEX "Booking_parkingId_status_idx" RENAME TO "ParkingSession_parkingId_status_idx";
ALTER INDEX "Booking_vehicleId_status_idx" RENAME TO "ParkingSession_vehicleId_status_idx";

CREATE TYPE "ParkingSessionStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'CANCELLED');

ALTER TABLE "ParkingSession" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "ParkingSession"
  ALTER COLUMN "status" TYPE "ParkingSessionStatus"
  USING (
    CASE "status"::text
      WHEN 'CONFIRMED' THEN 'ACTIVE'::"ParkingSessionStatus"
      WHEN 'COMPLETED' THEN 'COMPLETED'::"ParkingSessionStatus"
      WHEN 'CANCELLED' THEN 'CANCELLED'::"ParkingSessionStatus"
      ELSE NULL
    END
  );
ALTER TABLE "ParkingSession" ALTER COLUMN "status" SET DEFAULT 'ACTIVE';

DROP TYPE "BookingStatus";
