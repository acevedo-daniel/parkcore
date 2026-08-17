import { randomUUID } from 'node:crypto';
import type { Parking, ParkingSession, Vehicle } from '../../prisma/generated/client.js';

type Mergeable = Record<string, unknown>;

const merge = <T extends Mergeable>(base: T, overrides?: Partial<T>): T => {
  return { ...base, ...(overrides ?? {}) };
};

export const buildRegisterDto = (
  overrides?: Partial<{
    email: string;
    password: string;
    name: string;
  }>,
) => {
  return merge(
    {
      email: `user-${randomUUID()}@parkcore.test`,
      password: 'Passw0rd!123',
      name: 'Test User',
    },
    overrides,
  );
};

export const buildLoginDto = (
  overrides?: Partial<{
    email: string;
    password: string;
  }>,
) => {
  return merge(
    {
      email: 'user@parkcore.test',
      password: 'Passw0rd!123',
    },
    overrides,
  );
};

export const buildParking = (overrides?: Partial<Parking>): Parking => {
  const now = new Date('2026-02-21T10:00:00.000Z');

  return {
    id: 'parking-1',
    title: 'Main Parking',
    description: null,
    image: null,
    address: '123 Test St',
    hourlyRateCents: 200000,
    currency: 'USD',
    capacity: 20,
    lat: -34.6037,
    lng: -58.3816,
    isActive: true,
    createdAt: now,
    updatedAt: now,
    ownerId: 'owner-1',
    ...(overrides ?? {}),
  };
};

export const buildVehicle = (overrides?: Partial<Vehicle>): Vehicle => {
  const now = new Date('2026-02-21T10:00:00.000Z');

  return {
    id: 'vehicle-1',
    plate: 'ABC123',
    brand: null,
    model: null,
    type: 'CAR',
    createdAt: now,
    updatedAt: now,
    parkingId: 'parking-1',
    ...(overrides ?? {}),
  };
};

export const buildParkingSession = (overrides?: Partial<ParkingSession>): ParkingSession => {
  const now = new Date('2026-02-21T10:00:00.000Z');

  return {
    id: 'session-1',
    startTime: new Date('2026-02-21T09:00:00.000Z'),
    endTime: null,
    hourlyRateCents: 1500,
    currency: 'USD',
    totalAmountCents: null,
    customerName: null,
    customerPhone: null,
    notes: null,
    status: 'ACTIVE',
    createdAt: now,
    updatedAt: now,
    parkingId: 'parking-1',
    vehicleId: 'vehicle-1',
    ...(overrides ?? {}),
  };
};
