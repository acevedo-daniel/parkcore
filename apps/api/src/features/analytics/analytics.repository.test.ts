import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockPrisma } = vi.hoisted(() => ({
  mockPrisma: {
    parking: { findMany: vi.fn() },
    parkingSession: { findMany: vi.fn(), groupBy: vi.fn() },
    user: { findUniqueOrThrow: vi.fn() },
  },
}));

vi.mock('../../config/prisma.js', () => ({ prisma: mockPrisma }));

import {
  findOwnerActiveSessionCounts,
  findOwnerCompletedSessionAggregates,
  findOwnerFacilities,
  findOwnerSessions,
  findOwnerTimezone,
} from './analytics.repository.js';

describe('analytics repository', () => {
  beforeEach(() => vi.clearAllMocks());

  it('scopes facility summaries to the authenticated owner', async () => {
    mockPrisma.parking.findMany.mockResolvedValue([]);

    await expect(findOwnerFacilities('owner-1')).resolves.toEqual([]);

    expect(mockPrisma.parking.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { ownerId: 'owner-1' },
        orderBy: { title: 'asc' },
      }),
    );
  });

  it('loads the owner timezone for network date boundaries', async () => {
    mockPrisma.user.findUniqueOrThrow.mockResolvedValue({
      timezone: 'America/New_York',
    });

    await expect(findOwnerTimezone('owner-1')).resolves.toBe('America/New_York');
    expect(mockPrisma.user.findUniqueOrThrow).toHaveBeenCalledWith({
      where: { id: 'owner-1' },
      select: { timezone: true },
    });
  });

  it('groups active sessions by owned parking without loading session rows', async () => {
    mockPrisma.parkingSession.groupBy.mockResolvedValue([
      { parkingId: 'parking-1', _count: { _all: 3 } },
    ]);

    await expect(findOwnerActiveSessionCounts('owner-1')).resolves.toEqual([
      { parkingId: 'parking-1', activeSessions: 3 },
    ]);

    expect(mockPrisma.parkingSession.groupBy).toHaveBeenCalledWith({
      by: ['parkingId'],
      where: { parking: { ownerId: 'owner-1' }, status: 'ACTIVE' },
      _count: { _all: true },
    });
  });

  it('groups completed sessions by parking and currency for summary reads', async () => {
    mockPrisma.parkingSession.groupBy.mockResolvedValue([
      {
        parkingId: 'parking-1',
        currency: 'ARS',
        _count: { _all: 2 },
        _sum: { totalAmountCents: 3600 },
      },
    ]);
    const endTimeFrom = new Date('2026-01-01T00:00:00.000Z');
    const endTimeTo = new Date('2026-01-31T23:59:59.999Z');

    await expect(
      findOwnerCompletedSessionAggregates('owner-1', { endTimeFrom, endTimeTo }),
    ).resolves.toEqual([
      {
        parkingId: 'parking-1',
        currency: 'ARS',
        completedSessions: 2,
        revenueCents: 3600,
      },
    ]);

    expect(mockPrisma.parkingSession.groupBy).toHaveBeenCalledWith({
      by: ['parkingId', 'currency'],
      where: {
        parking: { ownerId: 'owner-1' },
        status: 'COMPLETED',
        endTime: { gte: endTimeFrom, lte: endTimeTo },
      },
      _count: { _all: true },
      _sum: { totalAmountCents: true },
    });
  });

  it('bounds session analytics by owner, status, and completion window', async () => {
    mockPrisma.parkingSession.findMany.mockResolvedValue([]);
    const endTimeFrom = new Date('2026-01-01T00:00:00.000Z');
    const endTimeTo = new Date('2026-01-31T23:59:59.999Z');

    await expect(
      findOwnerSessions('owner-1', { status: 'COMPLETED', endTimeFrom, endTimeTo }),
    ).resolves.toEqual([]);

    expect(mockPrisma.parkingSession.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          parking: { ownerId: 'owner-1' },
          status: 'COMPLETED',
          endTime: { gte: endTimeFrom, lte: endTimeTo },
        },
      }),
    );
  });
});
