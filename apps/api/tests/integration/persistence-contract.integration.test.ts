import { randomUUID } from 'node:crypto';
import { afterEach, describe, expect, it } from 'vitest';

import { prisma } from '../../src/config/prisma.js';

describe('persistence contract integration', () => {
  let ownerId: string | undefined;

  afterEach(async () => {
    if (ownerId) {
      await prisma.user.delete({ where: { id: ownerId } });
      ownerId = undefined;
    }
  });

  it('stores non-owner identities and scheduled ARS parking without implicit listing', async () => {
    const suffix = randomUUID();
    const expiresAt = new Date('2026-09-11T16:00:00.000Z');
    const showcase = await prisma.user.create({
      data: {
        kind: 'SHOWCASE',
        timezone: 'America/Argentina/Buenos_Aires',
      },
    });
    const demo = await prisma.user.create({
      data: {
        kind: 'DEMO',
        timezone: 'America/Argentina/Buenos_Aires',
        demoExpiresAt: expiresAt,
      },
    });
    const owner = await prisma.user.create({
      data: {
        email: `persistence-${suffix}@parkcore.test`,
        passwordHash: 'test-hash',
        kind: 'OWNER',
        name: 'Persistence',
        lastName: 'Owner',
        timezone: 'America/Argentina/Buenos_Aires',
      },
    });
    ownerId = owner.id;

    const parking = await prisma.parking.create({
      data: {
        title: `ARS Schedule ${suffix}`,
        neighborhood: 'Palermo',
        address: '123 Persistence Street',
        hourlyRateCents: 2500,
        currency: 'ARS',
        capacity: 4,
        lat: -34.5889,
        lng: -58.4305,
        timezone: 'America/Argentina/Buenos_Aires',
        is24Hours: false,
        opensAt: '18:00',
        closesAt: '02:00',
        owner: { connect: { id: owner.id } },
      },
    });

    expect(showcase.email).toBeNull();
    expect(showcase.passwordHash).toBeNull();
    expect(demo.email).toBeNull();
    expect(demo.passwordHash).toBeNull();
    expect(demo.demoExpiresAt).toEqual(expiresAt);
    expect(parking.currency).toBe('ARS');
    expect(parking.isListed).toBe(false);
    expect(parking.is24Hours).toBe(false);
    expect(parking.opensAt).toBe('18:00');
    expect(parking.closesAt).toBe('02:00');

    await prisma.user.delete({ where: { id: showcase.id } });
    await prisma.user.delete({ where: { id: demo.id } });
  });

  it('rejects credentials on non-owner identities', async () => {
    await expect(
      prisma.user.create({
        data: {
          email: `invalid-demo-${randomUUID()}@parkcore.test`,
          passwordHash: 'test-hash',
          kind: 'DEMO',
          timezone: 'America/Argentina/Buenos_Aires',
          demoExpiresAt: new Date('2026-09-11T16:00:00.000Z'),
        },
      }),
    ).rejects.toThrow();
  });

  it('rejects equal endpoints for a non-24-hour parking', async () => {
    const suffix = randomUUID();
    const owner = await prisma.user.create({
      data: {
        email: `schedule-${suffix}@parkcore.test`,
        passwordHash: 'test-hash',
        kind: 'OWNER',
        name: 'Schedule',
        lastName: 'Owner',
        timezone: 'America/Argentina/Buenos_Aires',
      },
    });
    ownerId = owner.id;

    await expect(
      prisma.parking.create({
        data: {
          title: `Invalid Schedule ${suffix}`,
          neighborhood: 'Palermo',
          address: '456 Persistence Street',
          hourlyRateCents: 2500,
          currency: 'USD',
          capacity: 4,
          lat: -34.5889,
          lng: -58.4305,
          timezone: 'America/Argentina/Buenos_Aires',
          is24Hours: false,
          opensAt: '10:00',
          closesAt: '10:00',
          owner: { connect: { id: owner.id } },
        },
      }),
    ).rejects.toThrow();
  });
});
