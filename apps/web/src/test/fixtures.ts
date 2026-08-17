import type { components } from '@parkcore/api-client';

type Parking = components['schemas']['ParkingResponse'];
type ParkingSession = components['schemas']['ParkingSessionResponse'];
type User = components['schemas']['UserResponse'];

export function parkingFixture(overrides: Partial<Parking> = {}): Parking {
  return {
    address: '101 Main Street',
    capacity: 12,
    createdAt: '2026-08-17T09:00:00.000Z',
    currency: 'USD',
    description: 'Covered operational parking.',
    hourlyRateCents: 1550,
    id: 'parking-1',
    image: null,
    isActive: true,
    lat: -34.6037,
    lng: -58.3816,
    ownerId: 'owner-1',
    title: 'Central Parking',
    updatedAt: '2026-08-17T09:00:00.000Z',
    ...overrides,
  };
}

export function parkingSessionFixture(
  overrides: Partial<ParkingSession> = {},
): ParkingSession {
  return {
    createdAt: '2026-08-17T09:30:00.000Z',
    currency: 'USD',
    customerName: 'Ada Lovelace',
    customerPhone: null,
    endTime: null,
    hourlyRateCents: 1550,
    id: 'session-1',
    notes: null,
    parkingId: 'parking-1',
    startTime: '2026-08-17T09:30:00.000Z',
    status: 'ACTIVE',
    totalAmountCents: null,
    updatedAt: '2026-08-17T09:30:00.000Z',
    vehicle: {
      brand: 'Toyota',
      id: 'vehicle-1',
      model: 'Corolla',
      plate: 'AB123CD',
      type: 'CAR',
    },
    vehicleId: 'vehicle-1',
    ...overrides,
  };
}

export function userFixture(overrides: Partial<User> = {}): User {
  return {
    createdAt: '2026-08-17T09:00:00.000Z',
    email: 'owner@parkcore.test',
    id: 'owner-1',
    lastName: null,
    name: 'ParkCore Owner',
    phone: null,
    photoUrl: null,
    updatedAt: '2026-08-17T09:00:00.000Z',
    ...overrides,
  };
}
