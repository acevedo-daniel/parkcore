import 'dotenv/config';
import { randomBytes } from 'node:crypto';
import argon2 from 'argon2';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from './generated/client.js';
import {
  CANONICAL_CURRENCY,
  CANONICAL_REFERENCE_TIME,
  CANONICAL_SCENARIO_EXPECTATIONS,
  CANONICAL_TIMEZONE,
  restoreCanonicalScenario,
  type CanonicalDatabaseClient,
} from '../src/data/canonical-scenario.js';
import { CANONICAL_SHOWCASE_USER_ID, refreshCanonicalShowcase } from '../src/data/showcase.js';

export const DEFAULT_SEED_REFERENCE_TIME = CANONICAL_REFERENCE_TIME;
export const LEGACY_DEMO_USER_ID = '00000000-0000-4000-8000-000000000010';
export const CANONICAL_SEED_EXPECTATIONS = {
  ...CANONICAL_SCENARIO_EXPECTATIONS,
  totalSessions: 419,
  activeSessions: 39,
  vehicles: 120,
} as const;

function getReferenceTime(): Date {
  const configured = process.env.SEED_REFERENCE_TIME;
  if (!configured) return new Date(DEFAULT_SEED_REFERENCE_TIME);

  const reference = new Date(configured);
  if (Number.isNaN(reference.getTime())) {
    throw new Error('SEED_REFERENCE_TIME must be an ISO-8601 date-time');
  }

  return reference;
}

/**
 * Rebuilds one owner's canonical operational data. The owner record and every
 * other account remain untouched, so this supports seed setup and demo reset.
 */
export async function restoreCanonicalDemoData(
  client: CanonicalDatabaseClient,
  ownerId: string,
  referenceTime = new Date(DEFAULT_SEED_REFERENCE_TIME),
): Promise<void> {
  await restoreCanonicalScenario(client, ownerId, referenceTime);
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
    await transaction.user.deleteMany({
      where: { id: LEGACY_DEMO_USER_ID, kind: 'DEMO' },
    });

    const owner = await transaction.user.upsert({
      where: { email: ownerEmail },
      update: {
        passwordHash,
        kind: 'OWNER',
        name: 'Demo',
        lastName: 'Owner',
        phone: null,
        photoUrl: null,
        timezone: CANONICAL_TIMEZONE,
        demoExpiresAt: null,
      },
      create: {
        email: ownerEmail,
        passwordHash,
        kind: 'OWNER',
        name: 'Demo',
        lastName: 'Owner',
        timezone: CANONICAL_TIMEZONE,
      },
    });

    await restoreCanonicalDemoData(transaction, owner.id, referenceTime);
    await refreshCanonicalShowcase(transaction, referenceTime);

    return owner;
  });

  const [
    parkingCount,
    vehicleCount,
    sessionCount,
    activeSessions,
    completedSessions,
    cancelledSessions,
    oldestSession,
    showcaseParkingCount,
    showcaseListedActiveCount,
    showcasePausedUnlistedCount,
  ] = await Promise.all([
    prisma.parking.count({ where: { ownerId: owner.id } }),
    prisma.vehicle.count({ where: { parking: { ownerId: owner.id } } }),
    prisma.parkingSession.count({ where: { parking: { ownerId: owner.id } } }),
    prisma.parkingSession.count({
      where: { parking: { ownerId: owner.id }, status: 'ACTIVE' },
    }),
    prisma.parkingSession.count({
      where: { parking: { ownerId: owner.id }, status: 'COMPLETED' },
    }),
    prisma.parkingSession.count({
      where: { parking: { ownerId: owner.id }, status: 'CANCELLED' },
    }),
    prisma.parkingSession.findFirst({
      where: { parking: { ownerId: owner.id } },
      orderBy: { startTime: 'asc' },
      select: { startTime: true },
    }),
    prisma.parking.count({ where: { ownerId: CANONICAL_SHOWCASE_USER_ID } }),
    prisma.parking.count({
      where: { ownerId: CANONICAL_SHOWCASE_USER_ID, isActive: true, isListed: true },
    }),
    prisma.parking.count({
      where: { ownerId: CANONICAL_SHOWCASE_USER_ID, isActive: false, isListed: false },
    }),
  ]);

  const oldestAllowed = new Date(
    referenceTime.getTime() - CANONICAL_SEED_EXPECTATIONS.maximumHistoryDays * 1440 * 60_000,
  );
  const newestAllowed = new Date(
    referenceTime.getTime() - CANONICAL_SEED_EXPECTATIONS.minimumHistoryDays * 1440 * 60_000,
  );
  const oldestSessionIso = oldestSession?.startTime.toISOString() ?? 'missing';
  if (
    parkingCount !== CANONICAL_SEED_EXPECTATIONS.facilities ||
    vehicleCount !== CANONICAL_SEED_EXPECTATIONS.vehicles ||
    sessionCount !== CANONICAL_SEED_EXPECTATIONS.totalSessions ||
    activeSessions !== CANONICAL_SEED_EXPECTATIONS.activeSessions ||
    completedSessions !== CANONICAL_SEED_EXPECTATIONS.completedSessions ||
    cancelledSessions !== CANONICAL_SEED_EXPECTATIONS.cancelledSessions ||
    oldestSession === null ||
    oldestSession.startTime < oldestAllowed ||
    oldestSession.startTime > newestAllowed ||
    showcaseParkingCount !== CANONICAL_SEED_EXPECTATIONS.facilities ||
    showcaseListedActiveCount !== CANONICAL_SEED_EXPECTATIONS.listedActiveFacilities ||
    showcasePausedUnlistedCount !== CANONICAL_SEED_EXPECTATIONS.pausedUnlistedFacilities
  ) {
    throw new Error(
      `Canonical seed assertions failed: facilities=${String(parkingCount)}, vehicles=${String(vehicleCount)}, sessions=${String(sessionCount)}, active=${String(activeSessions)}, completed=${String(completedSessions)}, cancelled=${String(cancelledSessions)}, oldest=${oldestSessionIso}, showcaseFacilities=${String(showcaseParkingCount)}, showcaseListedActive=${String(showcaseListedActiveCount)}, showcasePausedUnlisted=${String(showcasePausedUnlistedCount)}, currency=${CANONICAL_CURRENCY}`,
    );
  }

  console.log(
    `Seed completed for ${ownerEmail}: ${String(parkingCount)} facilities and ${String(sessionCount)} sessions.`,
  );
}

if (process.argv[1]?.endsWith('seed.ts')) {
  void main().catch((error: unknown) => {
    console.error('Seed failed');
    console.error(error);
    process.exitCode = 1;
  });
}
