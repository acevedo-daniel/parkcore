import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockPrisma } = vi.hoisted(() => ({
  mockPrisma: {
    parking: { findMany: vi.fn() },
    parkingSession: { findMany: vi.fn() },
  },
}));

vi.mock('../../config/prisma.js', () => ({ prisma: mockPrisma }));

import { findOwnerFacilities, findOwnerSessions } from './analytics.repository.js';

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
