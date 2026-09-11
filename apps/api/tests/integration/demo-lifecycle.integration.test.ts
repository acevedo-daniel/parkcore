import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { afterEach, describe, expect, it } from 'vitest';

import app from '../../app.js';
import { prisma } from '../../src/config/prisma.js';
import { cleanupExpiredDemoOwners } from '../../src/features/demo/demo.repository.js';
import { CANONICAL_SHOWCASE_USER_ID } from '../../src/data/showcase.js';

describe('demo lifecycle integration', () => {
  const demoIds: string[] = [];

  afterEach(async () => {
    if (demoIds.length > 0) {
      await prisma.user.deleteMany({ where: { id: { in: demoIds } } });
      demoIds.length = 0;
    }
  });

  it('resets only the current sandbox and preserves its expiry', async () => {
    const [firstResponse, secondResponse] = await Promise.all([
      request(app).post('/demo/login'),
      request(app).post('/demo/login'),
    ]);
    expect(firstResponse.status).toBe(200);
    expect(secondResponse.status).toBe(200);

    const first = firstResponse.body as { accessToken: string; user: { id: string } } & {
      user: { demoExpiresAt: string };
    };
    const second = secondResponse.body as { user: { id: string } };
    demoIds.push(first.user.id, second.user.id);

    const expiryBefore = (
      await prisma.user.findUniqueOrThrow({
        where: { id: first.user.id },
        select: { demoExpiresAt: true },
      })
    ).demoExpiresAt;
    const secondParkingBefore = await prisma.parking.findFirstOrThrow({
      where: { ownerId: second.user.id },
    });

    const reset = await request(app)
      .post('/demo/reset')
      .set('Authorization', `Bearer ${first.accessToken}`);
    expect(reset.status).toBe(200);

    await expect(
      prisma.user.findUniqueOrThrow({
        where: { id: first.user.id },
        select: { demoExpiresAt: true },
      }),
    ).resolves.toMatchObject({ demoExpiresAt: expiryBefore });
    await expect(
      prisma.parking.findUniqueOrThrow({ where: { id: secondParkingBefore.id } }),
    ).resolves.toEqual(secondParkingBefore);
  });

  it('rejects deleted DEMO access with a recognizable error code', async () => {
    const response = await request(app).post('/demo/login');
    expect(response.status).toBe(200);
    const demo = response.body as { accessToken: string; user: { id: string } };
    demoIds.push(demo.user.id);

    await prisma.user.delete({ where: { id: demo.user.id } });

    const protectedResponse = await request(app)
      .get('/parkings/me')
      .set('Authorization', `Bearer ${demo.accessToken}`);
    expect(protectedResponse.status).toBe(401);
    expect(protectedResponse.body).toMatchObject({ error: true, code: 'DEMO_EXPIRED' });
  });

  it('cleans expired DEMO records in a bounded, repeatable operation', async () => {
    const seededOwner = await prisma.user.findUniqueOrThrow({
      where: { email: 'owner@parkcore.dev' },
      select: { id: true },
    });
    const ownerBefore = await prisma.parking.count({ where: { ownerId: seededOwner.id } });
    const showcaseBefore = await prisma.parking.count({
      where: { ownerId: CANONICAL_SHOWCASE_USER_ID },
    });
    const expiredId = randomUUID();
    const expiredAt = new Date(Date.now() - 60_000);
    demoIds.push(expiredId);

    await prisma.user.create({
      data: {
        id: expiredId,
        kind: 'DEMO',
        timezone: 'America/Argentina/Buenos_Aires',
        demoExpiresAt: expiredAt,
      },
    });

    const parking = await prisma.parking.create({
      data: {
        title: 'Expired demo facility',
        neighborhood: 'Palermo',
        address: 'Expired demo street',
        hourlyRateCents: 2_000,
        currency: 'ARS',
        capacity: 2,
        lat: -34.5889,
        lng: -58.4305,
        ownerId: expiredId,
      },
    });
    const vehicle = await prisma.vehicle.create({
      data: { plate: `EXP${randomUUID().slice(0, 8)}`, parkingId: parking.id },
    });
    await prisma.parkingSession.create({
      data: {
        startTime: new Date(Date.now() - 120_000),
        endTime: new Date(Date.now() - 60_000),
        hourlyRateCents: 2_000,
        currency: 'ARS',
        totalAmountCents: 2_000,
        status: 'COMPLETED',
        parkingId: parking.id,
        vehicleId: vehicle.id,
      },
    });

    await expect(cleanupExpiredDemoOwners(prisma, new Date())).resolves.toBeGreaterThanOrEqual(1);
    await expect(prisma.user.findUnique({ where: { id: expiredId } })).resolves.toBeNull();
    await expect(prisma.parking.findUnique({ where: { id: parking.id } })).resolves.toBeNull();
    await expect(prisma.vehicle.findUnique({ where: { id: vehicle.id } })).resolves.toBeNull();
    await expect(
      prisma.parkingSession.findFirst({ where: { parkingId: parking.id } }),
    ).resolves.toBeNull();
    await expect(cleanupExpiredDemoOwners(prisma, new Date())).resolves.toBe(0);
    await expect(prisma.parking.count({ where: { ownerId: seededOwner.id } })).resolves.toBe(
      ownerBefore,
    );
    await expect(
      prisma.parking.count({ where: { ownerId: CANONICAL_SHOWCASE_USER_ID } }),
    ).resolves.toBe(showcaseBefore);
  });
});
