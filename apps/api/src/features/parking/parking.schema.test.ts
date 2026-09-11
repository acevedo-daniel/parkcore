import { describe, expect, it } from 'vitest';
import { createParkingSchema } from './parking.schema.js';

const baseParking = {
  address: '123 Main Street',
  capacity: 10,
  currency: 'ARS',
  hourlyRateCents: 1500,
  lat: -34.6037,
  lng: -58.3816,
  neighborhood: 'Palermo',
  title: 'Central Parking',
};

describe('parking configuration schema', () => {
  it('defaults new parking to a listed-independent 24-hour schedule', () => {
    expect(createParkingSchema.parse(baseParking)).toMatchObject({
      is24Hours: true,
      isListed: false,
    });
  });

  it('accepts same-day and cross-midnight schedules', () => {
    expect(
      createParkingSchema.parse({
        ...baseParking,
        closesAt: '18:00',
        is24Hours: false,
        opensAt: '08:00',
      }),
    ).toMatchObject({ is24Hours: false, opensAt: '08:00', closesAt: '18:00' });
    expect(
      createParkingSchema.parse({
        ...baseParking,
        closesAt: '02:00',
        is24Hours: false,
        opensAt: '18:00',
      }),
    ).toMatchObject({ is24Hours: false, opensAt: '18:00', closesAt: '02:00' });
  });

  it('rejects equal endpoints unless the facility is 24-hour', () => {
    expect(() =>
      createParkingSchema.parse({
        ...baseParking,
        closesAt: '10:00',
        is24Hours: false,
        opensAt: '10:00',
      }),
    ).toThrow('Opening and closing times cannot be equal');
  });
});
