import 'dotenv/config';
import { randomBytes } from 'node:crypto';
import argon2 from 'argon2';
import { PrismaPg } from '@prisma/adapter-pg';
import { Prisma, PrismaClient } from './generated/client.js';

type DemoSessionStatus = 'ACTIVE' | 'CANCELLED' | 'COMPLETED';
type DemoVehicleType = 'CAR' | 'LARGE' | 'MOTORCYCLE';
type DatabaseClient = PrismaClient | Prisma.TransactionClient;

interface DemoSession {
  brand?: string;
  customerName?: string;
  durationMinutes?: number;
  endMinutesAgo?: number;
  model?: string;
  notes?: string;
  plate: string;
  startMinutesAgo?: number;
  status: DemoSessionStatus;
  type: DemoVehicleType;
}

interface DemoParking {
  address: string;
  capacity: number;
  currency: 'ARS' | 'USD';
  description: string;
  hourlyRateCents: number;
  image: string | null;
  isActive: boolean;
  is24Hours: boolean;
  isListed: boolean;
  lat: number;
  lng: number;
  neighborhood: string;
  opensAt: string | null;
  closesAt: string | null;
  sessions: DemoSession[];
  title: string;
  timezone: string;
}

export const DEFAULT_SEED_REFERENCE_TIME = '2026-01-15T12:00:00.000Z';
export const CANONICAL_SEED_EXPECTATIONS = {
  parkings: 4,
  sessions: 24,
  activeSessions: 10,
  completedSessions: 11,
  cancelledSessions: 3,
  completedRevenueCents: 30_950,
} as const;

const minutesBefore = (reference: Date, minutes: number) =>
  new Date(reference.getTime() - minutes * 60_000);

function getReferenceTime() {
  const configured = process.env.SEED_REFERENCE_TIME;
  if (!configured) return new Date(DEFAULT_SEED_REFERENCE_TIME);

  const reference = new Date(configured);
  if (Number.isNaN(reference.getTime())) {
    throw new Error('SEED_REFERENCE_TIME must be an ISO-8601 date-time');
  }

  return reference;
}

const demoParkings: DemoParking[] = [
  {
    title: 'Central Parking Demo',
    description: 'A compact downtown facility for short stays and daily operations.',
    address: '101 Market Avenue, Northbridge',
    neighborhood: 'Downtown',
    image: 'https://images.unsplash.com/photo-1506521781263-d8422e82f27a',
    hourlyRateCents: 1200,
    currency: 'USD',
    capacity: 24,
    lat: 40.7128,
    lng: -74.006,
    isActive: true,
    isListed: false,
    timezone: 'America/Argentina/Buenos_Aires',
    is24Hours: true,
    opensAt: null,
    closesAt: null,
    sessions: [
      {
        plate: 'AB123CD',
        type: 'CAR',
        brand: 'Toyota',
        model: 'Corolla',
        customerName: 'Demo visitor A',
        notes: 'Daily parking',
        status: 'ACTIVE',
        startMinutesAgo: 42,
      },
      {
        plate: 'AE532LO',
        type: 'CAR',
        brand: 'Honda',
        model: 'Civic',
        customerName: 'Demo visitor B',
        status: 'ACTIVE',
        startMinutesAgo: 18,
      },
      {
        plate: 'MOTO742',
        type: 'MOTORCYCLE',
        brand: 'Yamaha',
        model: 'FZ',
        notes: 'Motorcycle bay',
        status: 'ACTIVE',
        startMinutesAgo: 67,
      },
      {
        plate: 'HTR908',
        type: 'CAR',
        brand: 'Ford',
        model: 'Focus',
        customerName: 'Demo visitor C',
        status: 'COMPLETED',
        durationMinutes: 48,
        endMinutesAgo: 95,
      },
      {
        plate: 'RIV216',
        type: 'LARGE',
        brand: 'Mercedes',
        model: 'Sprinter',
        notes: 'Delivery visit',
        status: 'COMPLETED',
        durationMinutes: 135,
        endMinutesAgo: 280,
      },
      {
        plate: 'CAN504',
        type: 'CAR',
        brand: 'Nissan',
        model: 'Versa',
        status: 'CANCELLED',
        startMinutesAgo: 430,
      },
      {
        plate: 'OLD001',
        type: 'CAR',
        status: 'COMPLETED',
        durationMinutes: 90,
        endMinutesAgo: 2 * 1440,
      },
      {
        plate: 'OLD002',
        type: 'CAR',
        status: 'COMPLETED',
        durationMinutes: 60,
        endMinutesAgo: 9 * 1440,
      },
    ],
  },
  {
    title: 'Harbor Street Garage',
    description: 'A covered neighborhood garage with a steady commuter flow.',
    address: '18 Harbor Street, Northbridge',
    neighborhood: 'Harbor',
    image: null,
    hourlyRateCents: 1800,
    currency: 'USD',
    capacity: 12,
    lat: 40.7182,
    lng: -74.0013,
    isActive: true,
    isListed: false,
    timezone: 'America/Argentina/Buenos_Aires',
    is24Hours: true,
    opensAt: null,
    closesAt: null,
    sessions: [
      {
        plate: 'HBR882',
        type: 'CAR',
        brand: 'Mazda',
        model: '3',
        customerName: 'Demo visitor D',
        status: 'ACTIVE',
        startMinutesAgo: 93,
      },
      {
        plate: 'GAR419',
        type: 'CAR',
        brand: 'Kia',
        model: 'Soul',
        status: 'COMPLETED',
        durationMinutes: 61,
        endMinutesAgo: 62,
      },
      {
        plate: 'HBR110',
        type: 'MOTORCYCLE',
        brand: 'Honda',
        model: 'CB',
        status: 'COMPLETED',
        durationMinutes: 26,
        endMinutesAgo: 220,
      },
      {
        plate: 'OLD003',
        type: 'CAR',
        status: 'COMPLETED',
        durationMinutes: 120,
        endMinutesAgo: 16 * 1440,
      },
    ],
  },
  {
    title: 'Market District Parking',
    description: 'A high-turnover facility near the market district.',
    address: '44 Foundry Lane, Northbridge',
    neighborhood: 'Market District',
    image: null,
    hourlyRateCents: 950,
    currency: 'USD',
    capacity: 8,
    lat: 40.7061,
    lng: -74.0117,
    isActive: true,
    isListed: false,
    timezone: 'America/Argentina/Buenos_Aires',
    is24Hours: true,
    opensAt: null,
    closesAt: null,
    sessions: [
      {
        plate: 'MKT101',
        type: 'CAR',
        brand: 'Hyundai',
        model: 'Elantra',
        status: 'ACTIVE',
        startMinutesAgo: 11,
      },
      {
        plate: 'MKT202',
        type: 'CAR',
        brand: 'Toyota',
        model: 'Yaris',
        status: 'ACTIVE',
        startMinutesAgo: 25,
      },
      {
        plate: 'MKT303',
        type: 'CAR',
        brand: 'Chevrolet',
        model: 'Onix',
        status: 'ACTIVE',
        startMinutesAgo: 38,
      },
      {
        plate: 'MKT404',
        type: 'LARGE',
        brand: 'Ford',
        model: 'Transit',
        notes: 'Vendor delivery',
        status: 'ACTIVE',
        startMinutesAgo: 52,
      },
      {
        plate: 'MKT505',
        type: 'MOTORCYCLE',
        brand: 'Suzuki',
        model: 'GN',
        status: 'ACTIVE',
        startMinutesAgo: 71,
      },
      {
        plate: 'MKT606',
        type: 'CAR',
        brand: 'Volkswagen',
        model: 'Polo',
        status: 'ACTIVE',
        startMinutesAgo: 84,
      },
      {
        plate: 'MKT707',
        type: 'CAR',
        brand: 'Renault',
        model: 'Sandero',
        status: 'CANCELLED',
        startMinutesAgo: 310,
      },
      {
        plate: 'OLD004',
        type: 'LARGE',
        status: 'COMPLETED',
        durationMinutes: 45,
        endMinutesAgo: 24 * 1440,
      },
    ],
  },
  {
    title: 'North Terminal Parking',
    description: 'An inactive terminal facility retained for owner management and history.',
    address: '7 Terminal Road, Northbridge',
    neighborhood: 'North Terminal',
    image: null,
    hourlyRateCents: 1400,
    currency: 'USD',
    capacity: 20,
    lat: 40.7281,
    lng: -74.0164,
    isActive: false,
    isListed: false,
    timezone: 'America/Argentina/Buenos_Aires',
    is24Hours: true,
    opensAt: null,
    closesAt: null,
    sessions: [
      {
        plate: 'NTH809',
        type: 'CAR',
        brand: 'Subaru',
        model: 'Impreza',
        status: 'COMPLETED',
        durationMinutes: 121,
        endMinutesAgo: 470,
      },
      {
        plate: 'NTH118',
        type: 'LARGE',
        brand: 'Iveco',
        model: 'Daily',
        status: 'COMPLETED',
        durationMinutes: 180,
        endMinutesAgo: 860,
      },
      {
        plate: 'NTH330',
        type: 'CAR',
        brand: 'Peugeot',
        model: '208',
        status: 'CANCELLED',
        startMinutesAgo: 1_100,
      },
      {
        plate: 'OLD005',
        type: 'LARGE',
        status: 'COMPLETED',
        durationMinutes: 180,
        endMinutesAgo: 31 * 1440,
      },
    ],
  },
];

async function upsertParking(client: DatabaseClient, ownerId: string, parking: DemoParking) {
  const existing = await client.parking.findFirst({
    where: { ownerId, title: parking.title },
    orderBy: { createdAt: 'asc' },
  });

  const data = {
    title: parking.title,
    description: parking.description,
    address: parking.address,
    neighborhood: parking.neighborhood,
    image: parking.image,
    hourlyRateCents: parking.hourlyRateCents,
    currency: parking.currency,
    capacity: parking.capacity,
    lat: parking.lat,
    lng: parking.lng,
    isActive: parking.isActive,
    isListed: parking.isListed,
    timezone: parking.timezone,
    is24Hours: parking.is24Hours,
    opensAt: parking.opensAt,
    closesAt: parking.closesAt,
    ownerId,
  };

  if (existing) {
    return client.parking.update({ where: { id: existing.id }, data });
  }

  return client.parking.create({ data });
}

async function seedSessions(
  client: DatabaseClient,
  parkingId: string,
  parking: DemoParking,
  referenceTime: Date,
) {
  await client.parkingSession.deleteMany({ where: { parkingId } });
  await client.vehicle.deleteMany({ where: { parkingId } });

  for (const session of parking.sessions) {
    const vehicle = await client.vehicle.create({
      data: {
        parkingId,
        plate: session.plate,
        type: session.type,
        brand: session.brand,
        model: session.model,
      },
    });

    const completed = session.status === 'COMPLETED';
    const durationMinutes = session.durationMinutes ?? 0;
    const endTime = completed ? minutesBefore(referenceTime, session.endMinutesAgo ?? 0) : null;
    const startTime = completed
      ? minutesBefore(endTime ?? referenceTime, durationMinutes)
      : minutesBefore(referenceTime, session.startMinutesAgo ?? 0);
    const chargedHours = Math.max(1, Math.ceil(durationMinutes / 60));

    await client.parkingSession.create({
      data: {
        parkingId,
        vehicleId: vehicle.id,
        startTime,
        endTime,
        hourlyRateCents: parking.hourlyRateCents,
        currency: parking.currency,
        totalAmountCents: completed ? chargedHours * parking.hourlyRateCents : null,
        customerName: session.customerName,
        notes: session.notes,
        status: session.status,
      },
    });
  }
}

/**
 * Rebuilds only the configured demo owner's operational data. The owner record
 * and every other account remain untouched, so this can safely back both the
 * seed command and the authenticated demo reset endpoint.
 */
export async function restoreCanonicalDemoData(
  client: DatabaseClient,
  ownerId: string,
  referenceTime = new Date(DEFAULT_SEED_REFERENCE_TIME),
): Promise<void> {
  await client.parking.deleteMany({ where: { ownerId } });

  for (const parkingSeed of demoParkings) {
    const parking = await upsertParking(client, ownerId, parkingSeed);
    await seedSessions(client, parking.id, parkingSeed, referenceTime);
  }
}

async function main(): Promise<void> {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is required to run seed');
  }

  const adapter = new PrismaPg({ connectionString: databaseUrl });
  const prisma = new PrismaClient({ adapter });
  const ownerEmail = process.env.SEED_OWNER_EMAIL ?? 'owner@parkcore.dev';
  const ownerPassword = process.env.SEED_OWNER_PASSWORD ?? randomBytes(32).toString('base64url');
  const referenceTime = getReferenceTime();
  const passwordHash = await argon2.hash(ownerPassword);

  const owner = await prisma.$transaction(async (transaction) => {
    const demoOwner = await transaction.user.upsert({
      where: { email: ownerEmail },
      update: {
        passwordHash,
        kind: 'OWNER',
        name: 'Demo',
        lastName: 'Owner',
        phone: null,
        photoUrl: null,
        timezone: 'America/Argentina/Buenos_Aires',
        demoExpiresAt: null,
      },
      create: {
        email: ownerEmail,
        passwordHash,
        kind: 'OWNER',
        name: 'Demo',
        lastName: 'Owner',
        timezone: 'America/Argentina/Buenos_Aires',
      },
    });

    await restoreCanonicalDemoData(transaction, demoOwner.id, referenceTime);

    return demoOwner;
  });

  const [
    parkingCount,
    sessionCount,
    activeSessions,
    completedSessions,
    cancelledSessions,
    completedRevenue,
    oldestSession,
  ] = await Promise.all([
    prisma.parking.count({ where: { ownerId: owner.id } }),
    prisma.parkingSession.count({ where: { parking: { ownerId: owner.id } } }),
    prisma.parkingSession.count({ where: { parking: { ownerId: owner.id }, status: 'ACTIVE' } }),
    prisma.parkingSession.count({ where: { parking: { ownerId: owner.id }, status: 'COMPLETED' } }),
    prisma.parkingSession.count({ where: { parking: { ownerId: owner.id }, status: 'CANCELLED' } }),
    prisma.parkingSession.aggregate({
      where: { parking: { ownerId: owner.id }, status: 'COMPLETED' },
      _sum: { totalAmountCents: true },
    }),
    prisma.parkingSession.findFirst({
      where: { parking: { ownerId: owner.id } },
      orderBy: { startTime: 'asc' },
      select: { startTime: true },
    }),
  ]);

  const oldestAllowed = minutesBefore(referenceTime, 30 * 1440);
  const oldestSessionIso = oldestSession ? oldestSession.startTime.toISOString() : 'missing';
  if (
    parkingCount !== CANONICAL_SEED_EXPECTATIONS.parkings ||
    sessionCount !== CANONICAL_SEED_EXPECTATIONS.sessions ||
    activeSessions !== CANONICAL_SEED_EXPECTATIONS.activeSessions ||
    completedSessions !== CANONICAL_SEED_EXPECTATIONS.completedSessions ||
    cancelledSessions !== CANONICAL_SEED_EXPECTATIONS.cancelledSessions ||
    (completedRevenue._sum.totalAmountCents ?? 0) !==
      CANONICAL_SEED_EXPECTATIONS.completedRevenueCents ||
    oldestSession === null ||
    oldestSession.startTime > oldestAllowed
  ) {
    throw new Error(
      `Canonical seed assertions failed: parkings=${String(parkingCount)}, sessions=${String(sessionCount)}, active=${String(activeSessions)}, completed=${String(completedSessions)}, cancelled=${String(cancelledSessions)}, revenue=${String(completedRevenue._sum.totalAmountCents ?? 0)}, oldest=${oldestSessionIso}`,
    );
  }

  console.log(
    `Seed completed for ${ownerEmail}: ${String(parkingCount)} parkings and ${String(sessionCount)} sessions.`,
  );
}

if (process.argv[1]?.endsWith('seed.ts')) {
  void main().catch((error: unknown) => {
    console.error('Seed failed');
    console.error(error);
    process.exitCode = 1;
  });
}
