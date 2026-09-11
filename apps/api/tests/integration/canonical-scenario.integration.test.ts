import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { prisma } from '../../src/config/prisma.js';
import {
  CANONICAL_REFERENCE_TIME,
  restoreCanonicalScenario,
} from '../../src/data/canonical-scenario.js';

describe('canonical scenario persistence', () => {
  let demoOwnerId: string | undefined;

  beforeAll(async () => {
    const demo = await prisma.user.create({
      data: {
        kind: 'DEMO',
        timezone: 'America/Argentina/Buenos_Aires',
        demoExpiresAt: new Date('2026-01-15T16:00:00.000Z'),
      },
    });
    demoOwnerId = demo.id;
  });

  afterAll(async () => {
    if (demoOwnerId) await prisma.user.delete({ where: { id: demoOwnerId } });
  });

  it('persists the canonical contract in bulk and adapts listing for non-showcase owners', async () => {
    const canonicalDemoOwnerId = demoOwnerId;
    if (!canonicalDemoOwnerId) throw new Error('Missing integration owner');
    const referenceTime = new Date(CANONICAL_REFERENCE_TIME);

    await prisma.$transaction(async (transaction) => {
      const showcase = await transaction.user.create({
        data: {
          kind: 'SHOWCASE',
          timezone: 'America/Argentina/Buenos_Aires',
        },
      });
      await restoreCanonicalScenario(transaction, showcase.id, referenceTime);
      await restoreCanonicalScenario(transaction, canonicalDemoOwnerId, referenceTime);

      const [showcaseFacilities, demoFacilities, vehicles, sessions] = await Promise.all([
        transaction.parking.findMany({
          where: { ownerId: showcase.id },
          orderBy: { title: 'asc' },
        }),
        transaction.parking.findMany({ where: { ownerId: canonicalDemoOwnerId } }),
        transaction.vehicle.findMany({ where: { parking: { ownerId: canonicalDemoOwnerId } } }),
        transaction.parkingSession.findMany({
          where: { parking: { ownerId: canonicalDemoOwnerId } },
        }),
      ]);

      expect(showcaseFacilities).toHaveLength(6);
      expect(
        showcaseFacilities.filter((facility) => facility.isActive && facility.isListed),
      ).toHaveLength(5);
      expect(
        showcaseFacilities.filter((facility) => !facility.isActive && !facility.isListed),
      ).toHaveLength(1);
      expect(demoFacilities).toHaveLength(6);
      expect(demoFacilities.every((facility) => !facility.isListed)).toBe(true);
      expect(vehicles).toHaveLength(120);
      expect(sessions.filter((session) => session.status === 'COMPLETED')).toHaveLength(360);
      expect(sessions.filter((session) => session.status === 'CANCELLED')).toHaveLength(20);
      expect(sessions.every((session) => session.currency === 'ARS')).toBe(true);
      await transaction.user.delete({ where: { id: showcase.id } });
    });
  });

  it('reruns without duplicates and rebases only time-dependent values', async () => {
    const canonicalOwnerId = demoOwnerId;
    if (!canonicalOwnerId) throw new Error('Missing integration owner');
    const referenceTime = new Date(CANONICAL_REFERENCE_TIME);
    const first = await restoreCanonicalScenario(prisma, canonicalOwnerId, referenceTime);
    const second = await restoreCanonicalScenario(prisma, canonicalOwnerId, referenceTime);
    const rebased = await restoreCanonicalScenario(
      prisma,
      canonicalOwnerId,
      new Date(referenceTime.getTime() + 2 * 1440 * 60_000),
    );

    expect(second.facilities.map((facility) => facility.id)).toEqual(
      first.facilities.map((facility) => facility.id),
    );
    expect(second.sessions.map((session) => session.id)).toEqual(
      first.sessions.map((session) => session.id),
    );
    expect(rebased.facilities.map((facility) => facility.image)).toEqual(
      first.facilities.map((facility) => facility.image),
    );

    const persistedCounts = await Promise.all([
      prisma.parking.count({ where: { ownerId: canonicalOwnerId } }),
      prisma.vehicle.count({ where: { parking: { ownerId: canonicalOwnerId } } }),
      prisma.parkingSession.count({ where: { parking: { ownerId: canonicalOwnerId } } }),
    ]);
    expect(persistedCounts).toEqual([6, 120, 419]);
  });
});
