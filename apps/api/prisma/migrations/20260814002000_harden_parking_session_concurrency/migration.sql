-- A vehicle belongs to one Parking, so this partial unique index permits at
-- most one ACTIVE session for that vehicle in its operational context.
CREATE UNIQUE INDEX "ParkingSession_active_parking_vehicle_unique"
  ON "ParkingSession" ("parkingId", "vehicleId")
  WHERE "status" = 'ACTIVE';
