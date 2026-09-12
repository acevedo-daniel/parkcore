import { describe, expect, it } from 'vitest';

import { calculateParkingEstimate } from './parking-estimate.js';

describe('calculateParkingEstimate', () => {
  it('applies the one-hour minimum from zero through sixty minutes', () => {
    expect(calculateParkingEstimate(0, 1550)).toEqual({
      chargedHours: 1,
      totalAmountCents: 1550,
    });
    expect(calculateParkingEstimate(60, 1550)).toEqual({
      chargedHours: 1,
      totalAmountCents: 1550,
    });
  });

  it('rounds every started hour up after the first hour', () => {
    expect(calculateParkingEstimate(61, 1550)).toEqual({
      chargedHours: 2,
      totalAmountCents: 3100,
    });
    expect(calculateParkingEstimate(121, 1550)).toEqual({
      chargedHours: 3,
      totalAmountCents: 4650,
    });
  });

  it('returns no estimate for invalid duration or rate values', () => {
    expect(calculateParkingEstimate(-1, 1550)).toBeNull();
    expect(calculateParkingEstimate(Number.NaN, 1550)).toBeNull();
    expect(calculateParkingEstimate(90, -1)).toBeNull();
    expect(calculateParkingEstimate(90, Number.POSITIVE_INFINITY)).toBeNull();
  });
});
