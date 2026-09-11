import { randomUUID } from 'node:crypto';
import { afterEach, describe, expect, it } from 'vitest';
import request from 'supertest';

import app from '../../app.js';
import { prisma } from '../../src/config/prisma.js';

interface PublicParkingBody {
  id: string;
  availabilityState: string;
  availableSpaces: number;
  isOpen: boolean;
  isShowcase: boolean;
  occupancyPercent: number;
  ownerId?: string;
}

interface PublicListBody {
  data: PublicParkingBody[];
  meta: { total: number; totalPages: number };
}

describe('public discovery integration', () => {
  const userIds: string[] = [];

  afterEach(async () => {
    await prisma.user.deleteMany({ where: { id: { in: userIds } } });
    userIds.length = 0;
  });

  it('enforces public eligibility and derives availability before pagination', async () => {
    const suffix = randomUUID();
    const owner = await prisma.user.create({
      data: {
        email: `public-owner-${suffix}@parkcore.test`,
        passwordHash: 'test-hash',
        kind: 'OWNER',
        name: 'Public',
        lastName: 'Owner',
        timezone: 'America/Argentina/Buenos_Aires',
      },
    });
    const demo = await prisma.user.create({
      data: {
        kind: 'DEMO',
        timezone: 'America/Argentina/Buenos_Aires',
        demoExpiresAt: new Date('2026-12-31T23:59:59.000Z'),
      },
    });
    const showcase = await prisma.user.create({
      data: { kind: 'SHOWCASE', timezone: 'America/Argentina/Buenos_Aires' },
    });
    userIds.push(owner.id, demo.id, showcase.id);

    const createParking = (ownerId: string, title: string, overrides = {}) =>
      prisma.parking.create({
        data: {
          title,
          neighborhood: 'Palermo',
          address: `${title} Street`,
          hourlyRateCents: 1500,
          currency: 'USD',
          capacity: 5,
          lat: -34.6037,
          lng: -58.3816,
          isListed: true,
          owner: { connect: { id: ownerId } },
          ...overrides,
        },
      });

    const available = await createParking(owner.id, 'Alpha Available');
    const limited = await createParking(owner.id, 'Beta Limited');
    const full = await createParking(owner.id, 'Gamma Full', { capacity: 1 });
    const unlisted = await createParking(owner.id, 'Hidden Unlisted', { isListed: false });
    const paused = await createParking(owner.id, 'Paused Facility', { isActive: false });
    const demoParking = await createParking(demo.id, 'Demo Facility');
    const showcaseParking = await createParking(showcase.id, 'Showcase Facility');

    const addActiveSession = async (parkingId: string, plate: string) => {
      const vehicle = await prisma.vehicle.create({
        data: { plate, parkingId, type: 'CAR' },
      });
      await prisma.parkingSession.create({
        data: {
          startTime: new Date('2026-09-11T08:00:00.000Z'),
          hourlyRateCents: 1500,
          currency: 'USD',
          parkingId,
          vehicleId: vehicle.id,
          status: 'ACTIVE',
        },
      });
    };

    for (let index = 0; index < 4; index += 1) {
      await addActiveSession(limited.id, `LIM${String(index)}${suffix.slice(0, 4)}`);
    }
    await addActiveSession(full.id, `FUL${suffix.slice(0, 5)}`);

    const listResponse = await request(app).get('/parkings?limit=2&page=1');
    const listBody = listResponse.body as unknown as PublicListBody;

    expect(listResponse.status).toBe(200);
    expect(listBody.data.map(({ id }) => id)).toEqual([available.id, showcaseParking.id]);
    expect(listBody.meta).toMatchObject({ total: 4, totalPages: 2 });

    const secondPageResponse = await request(app).get('/parkings?limit=2&page=2');
    const secondPageBody = secondPageResponse.body as unknown as PublicListBody;
    expect(secondPageBody.data.map(({ id }) => id)).toEqual([limited.id, full.id]);
    expect(secondPageBody.data[0]).toMatchObject({
      availabilityState: 'LIMITED',
      availableSpaces: 1,
      isOpen: true,
      isShowcase: false,
      occupancyPercent: 80,
    });
    expect(secondPageBody.data[0]).not.toHaveProperty('ownerId');

    await expect(request(app).get(`/parkings/${unlisted.id}`)).resolves.toMatchObject({
      status: 404,
    });
    await expect(request(app).get(`/parkings/${paused.id}`)).resolves.toMatchObject({
      status: 404,
    });
    await expect(request(app).get(`/parkings/${demoParking.id}`)).resolves.toMatchObject({
      status: 404,
    });

    const availableNow = await request(app).get('/parkings?availableNow=true');
    const availableNowBody = availableNow.body as unknown as PublicListBody;
    expect(availableNow.status).toBe(200);
    expect(availableNowBody.data.map(({ id }) => id)).toEqual([
      available.id,
      showcaseParking.id,
      limited.id,
    ]);
  });

  it('requires currency context for public price ranges', async () => {
    const response = await request(app).get('/parkings?minHourlyRateCents=1000');
    const body = response.body as { error: boolean };

    expect(response.status).toBe(400);
    expect(body).toMatchObject({ error: true });
  });
});
