export interface ParkingEstimate {
  chargedHours: number;
  totalAmountCents: number;
}

export function calculateParkingEstimate(
  durationMinutes: number,
  hourlyRateCents: number,
): ParkingEstimate | null {
  if (
    !Number.isFinite(durationMinutes) ||
    durationMinutes < 0 ||
    !Number.isFinite(hourlyRateCents) ||
    hourlyRateCents < 0
  ) {
    return null;
  }

  const chargedHours = Math.max(1, Math.ceil(durationMinutes / 60));
  return {
    chargedHours,
    totalAmountCents: chargedHours * hourlyRateCents,
  };
}
