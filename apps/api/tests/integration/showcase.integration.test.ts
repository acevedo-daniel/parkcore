import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import app from '../../app.js';
import { prisma } from '../../src/config/prisma.js';
import { CANONICAL_REFERENCE_TIME } from '../../src/data/canonical-scenario.js';
import { CANONICAL_SHOWCASE_USER_ID, refreshCanonicalShowcase } from '../../src/data/showcase.js';

describe('canonical showcase', () => {
  let ownerId: string | undefined;
  let demoId: string | undefined;
  let createdShowcase = false;

  beforeAll(async () => {
    const existingShowcase = await prisma.user.findUnique({
      where: { id: CANONICAL_SHOWCASE_USER_ID },
      select: { id: true },
    });
    createdShowcase = !existingShowcase;

    const owner = await prisma.user.create({
      data: {
        email: `showcase-owner-${randomUUID()}@parkcore.test`,
        passwordHash: 'test-hash',
        kind: 'OWNER',
        timezone: 'America/Argentina/Buenos_Aires',
      },
    });
    ownerId = owner.id;
    await prisma.parking.create({
      data: {
        title: 'Showcase isolation owner',
        neighborhood: 'Palermo',
        address: 'Owner isolation street',
        hourlyRateCents: 2_000,
        currency: 'USD',
        capacity: 4,
        lat: -34.5889,
        lng: -58.4305,
        ownerId: owner.id,
      },
    });

    const demo = await prisma.user.create({
      data: {
        kind: 'DEMO',
        timezone: 'America/Argentina/Buenos_Aires',
        demoExpiresAt: new Date('2026-12-31T23:59:59.000Z'),
      },
    });
    demoId = demo.id;
    await prisma.parking.create({
      data: {
        title: 'Showcase isolation demo',
        neighborhood: 'Palermo',
        address: 'Demo isolation street',
        hourlyRateCents: 2_000,
        currency: 'USD',
        capacity: 4,
        lat: -34.5889,
        lng: -58.4305,
        ownerId: demo.id,
      },
    });
  });

  afterAll(async () => {
    if (ownerId) await prisma.user.delete({ where: { id: ownerId } });
    if (demoId) await prisma.user.delete({ where: { id: demoId } });
    if (createdShowcase) {
      await prisma.user.delete({ where: { id: CANONICAL_SHOWCASE_USER_ID } });
    }
  });

  it('provisions five public facilities and keeps the paused facility private', async () => {
    const first = await refreshCanonicalShowcase(prisma, new Date(CANONICAL_REFERENCE_TIME));
    const publicResponse = await request(app).get('/parkings?currency=ARS&limit=10');
    const publicBody = publicResponse.body as {
      data: { id: string; isShowcase: boolean; title: string }[];
      meta: { total: number };
    };

    expect(first.facilities).toHaveLength(6);
    expect(first.facilities.filter((facility) => facility.isListed)).toHaveLength(5);
    expect(publicResponse.status).toBe(200);
    expect(publicBody.meta.total).toBe(5);
    expect(publicBody.data).toHaveLength(5);
    expect(publicBody.data.every((facility) => facility.isShowcase)).toBe(true);
    expect(publicBody.data.map((facility) => facility.title)).not.toContain('San Telmo Mercado');

    const central = first.facilities.find((facility) => facility.title === 'Central Corrientes');
    if (!central) throw new Error('Missing canonical showcase facility');
    const detailResponse = await request(app).get(`/parkings/${central.id}`);
    expect(detailResponse.status).toBe(200);
    expect(detailResponse.body).toMatchObject({ id: central.id, isShowcase: true });
    expect(detailResponse.body).not.toHaveProperty('ownerId');
  });

  it('refreshes atomically, preserves identity, and leaves other owners unchanged', async () => {
    const canonicalOwnerId = ownerId;
    const canonicalDemoId = demoId;
    if (!canonicalOwnerId || !canonicalDemoId) throw new Error('Missing isolation owners');

    const first = await refreshCanonicalShowcase(prisma, new Date(CANONICAL_REFERENCE_TIME));
    const ownerBefore = await prisma.parking.findFirstOrThrow({
      where: { ownerId: canonicalOwnerId },
    });
    const demoBefore = await prisma.parking.findFirstOrThrow({
      where: { ownerId: canonicalDemoId },
    });
    const second = await refreshCanonicalShowcase(
      prisma,
      new Date(new Date(CANONICAL_REFERENCE_TIME).getTime() + 2 * 1440 * 60_000),
    );

    expect(second.facilities.map((facility) => facility.id)).toEqual(
      first.facilities.map((facility) => facility.id),
    );
    expect(second.facilities.map((facility) => facility.image)).toEqual(
      first.facilities.map((facility) => facility.image),
    );
    expect(second.sessions.map((session) => session.id)).toEqual(
      first.sessions.map((session) => session.id),
    );
    expect(second.sessions[0].startTime.getTime()).toBe(
      first.sessions[0].startTime.getTime() + 2 * 1440 * 60_000,
    );
    await expect(
      prisma.parking.findFirstOrThrow({ where: { id: ownerBefore.id } }),
    ).resolves.toEqual(ownerBefore);
    await expect(
      prisma.parking.findFirstOrThrow({ where: { id: demoBefore.id } }),
    ).resolves.toEqual(demoBefore);

    const beforeRollback = await prisma.parkingSession.findFirstOrThrow({
      where: { parking: { ownerId: CANONICAL_SHOWCASE_USER_ID }, status: 'ACTIVE' },
      orderBy: { id: 'asc' },
    });
    await expect(
      prisma.$transaction(async (transaction) => {
        await refreshCanonicalShowcase(
          transaction,
          new Date(new Date(CANONICAL_REFERENCE_TIME).getTime() + 4 * 1440 * 60_000),
        );
        throw new Error('force showcase rollback');
      }),
    ).rejects.toThrow('force showcase rollback');
    await expect(
      prisma.parkingSession.findUniqueOrThrow({ where: { id: beforeRollback.id } }),
    ).resolves.toEqual(beforeRollback);
  });
});
