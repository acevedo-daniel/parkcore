import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('./parking.repository.js', () => ({
  create: vi.fn(),
  findById: vi.fn(),
  findPublicById: vi.fn(),
  findByOwner: vi.fn(),
  update: vi.fn(),
  updateWithCapacityCheck: vi.fn(),
  findPublicCandidates: vi.fn(),
}));
vi.mock('../user/user.repository.js', () => ({ findById: vi.fn() }));

import { buildParking } from '../../../tests/helpers/builders.js';
import { ForbiddenError, NotFoundError } from '../../errors/index.js';
import {
  deriveOwnerParkingSnapshot,
  toParkingResponse,
  type CreateParking,
  type ParkingQuery,
  type UpdateParking,
} from './parking.schema.js';
import * as parkingRepository from './parking.repository.js';
import * as userRepository from '../user/user.repository.js';
import { create, findAll, findById, findOwned, findPublicById, update } from './parking.service.js';

const publicParking = (
  overrides: Parameters<typeof buildParking>[0] = {},
): parkingRepository.PublicParkingRecord => ({
  ...buildParking(overrides),
  owner: { kind: 'OWNER' as const },
  parkingSessions: [],
});

const ownerParking = (
  overrides: Parameters<typeof buildParking>[0] = {},
  activeSessionIds: string[] = [],
): parkingRepository.OwnerParkingRecord => ({
  ...buildParking(overrides),
  parkingSessions: activeSessionIds.map((id) => ({ id })),
});

const createDto: CreateParking = {
  title: 'Main Parking',
  neighborhood: 'Downtown',
  address: '123 Test St',
  hourlyRateCents: 200000,
  currency: 'USD',
  capacity: 20,
  lat: 10,
  lng: 10,
  is24Hours: true,
  isListed: false,
};

describe('parking.service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(userRepository.findById).mockResolvedValue({
      kind: 'OWNER',
      timezone: 'America/Argentina/Buenos_Aires',
    } as never);
  });

  it('creates parking connected to owner', async () => {
    const created = ownerParking({}, ['active-session-1']);
    vi.mocked(parkingRepository.create).mockResolvedValue(created);

    const result = await create('owner-1', createDto);

    expect(parkingRepository.create).toHaveBeenCalledWith({
      ...createDto,
      timezone: 'America/Argentina/Buenos_Aires',
      opensAt: null,
      closesAt: null,
      owner: { connect: { id: 'owner-1' } },
    });
    expect(result).toMatchObject({
      activeSessionCount: 1,
      availableSpaces: 19,
      occupancyPercent: 5,
      availabilityState: 'AVAILABLE',
    });
    expect(result).toEqual(toParkingResponse(created));
  });

  it('forces demo parking to remain unlisted', async () => {
    vi.mocked(userRepository.findById).mockResolvedValue({
      kind: 'DEMO',
      timezone: 'America/Argentina/Buenos_Aires',
    } as never);
    const created = ownerParking({ isListed: false });
    vi.mocked(parkingRepository.create).mockResolvedValue(created);

    await create('demo-1', { ...createDto, isListed: true });

    expect(parkingRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ isListed: false, owner: { connect: { id: 'demo-1' } } }),
    );
  });

  it('findById throws NotFoundError when parking does not exist', async () => {
    vi.mocked(parkingRepository.findById).mockResolvedValue(null);

    await expect(findById('missing-parking')).rejects.toBeInstanceOf(NotFoundError);
  });

  it('findPublicById returns only an active parking', async () => {
    const parking = publicParking({ isActive: true });
    vi.mocked(parkingRepository.findPublicById).mockResolvedValue(parking);

    const result = await findPublicById(parking.id);

    expect(parkingRepository.findPublicById).toHaveBeenCalledWith(parking.id);
    expect(result.availabilityState).toBe('AVAILABLE');
    expect(result.isShowcase).toBe(false);
  });

  it('findPublicById hides an ineligible parking as not found', async () => {
    vi.mocked(parkingRepository.findPublicById).mockResolvedValue(null);

    await expect(findPublicById('inactive-parking')).rejects.toBeInstanceOf(NotFoundError);
  });

  it('findOwned returns owner parkings', async () => {
    const owned = [
      ownerParking({ id: 'parking-1', capacity: 5 }, [
        'active-1',
        'active-2',
        'active-3',
        'active-4',
      ]),
      ownerParking({ id: 'parking-2' }),
    ];
    vi.mocked(parkingRepository.findByOwner).mockResolvedValue(owned);

    const result = await findOwned('owner-1');

    expect(parkingRepository.findByOwner).toHaveBeenCalledWith('owner-1');
    expect(result).toEqual(owned.map(toParkingResponse));
    expect(result[0]).toMatchObject({
      activeSessionCount: 4,
      availableSpaces: 1,
      occupancyPercent: 80,
      isOpen: true,
      availabilityState: 'LIMITED',
      nextOpeningAt: null,
    });
  });

  it('derives scheduled, full, paused, and bounded owner states', () => {
    const now = new Date('2026-09-11T12:00:00.000Z');
    const scheduled = ownerParking({
      is24Hours: false,
      opensAt: '10:00',
      closesAt: '18:00',
    });
    const full = ownerParking({ capacity: 2 }, ['active-1', 'active-2', 'active-3']);
    const paused = ownerParking({ isActive: false });

    expect(deriveOwnerParkingSnapshot(scheduled, now)).toMatchObject({
      activeSessionCount: 0,
      availableSpaces: 20,
      occupancyPercent: 0,
      isOpen: false,
      availabilityState: 'CLOSED',
      nextOpeningAt: '2026-09-11T13:00:00.000Z',
    });
    expect(deriveOwnerParkingSnapshot(full, now)).toMatchObject({
      activeSessionCount: 2,
      availableSpaces: 0,
      occupancyPercent: 100,
      isOpen: true,
      availabilityState: 'FULL',
      nextOpeningAt: null,
    });
    expect(deriveOwnerParkingSnapshot(paused, now)).toMatchObject({
      isOpen: true,
      availabilityState: 'PAUSED',
      nextOpeningAt: null,
    });
  });

  describe('update', () => {
    const dto: UpdateParking = { title: 'Updated Parking' };

    it('throws NotFoundError when target parking does not exist', async () => {
      vi.mocked(parkingRepository.findById).mockResolvedValue(null);

      await expect(update('owner-1', 'parking-1', dto)).rejects.toBeInstanceOf(NotFoundError);
      expect(parkingRepository.update).not.toHaveBeenCalled();
    });

    it('throws ForbiddenError when owner does not match', async () => {
      vi.mocked(parkingRepository.findById).mockResolvedValue(buildParking({ ownerId: 'owner-2' }));

      await expect(update('owner-1', 'parking-1', dto)).rejects.toBeInstanceOf(ForbiddenError);
      expect(parkingRepository.update).not.toHaveBeenCalled();
    });

    it('updates parking when owner matches', async () => {
      const updatedParking = ownerParking({ title: 'Updated Parking' }, ['active-1', 'active-2']);
      vi.mocked(parkingRepository.findById).mockResolvedValue(buildParking({ ownerId: 'owner-1' }));
      vi.mocked(parkingRepository.updateWithCapacityCheck).mockResolvedValue(updatedParking);

      const result = await update('owner-1', 'parking-1', dto);

      expect(parkingRepository.updateWithCapacityCheck).toHaveBeenCalledWith('parking-1', dto);
      expect(result).toEqual(toParkingResponse(updatedParking));
      expect(result).toMatchObject({ activeSessionCount: 2, availableSpaces: 18 });
    });

    it('allows the owner to deactivate a parking', async () => {
      const inactiveParking = ownerParking({ isActive: false }, ['active-1']);
      vi.mocked(parkingRepository.findById).mockResolvedValue(buildParking({ ownerId: 'owner-1' }));
      vi.mocked(parkingRepository.updateWithCapacityCheck).mockResolvedValue(inactiveParking);

      const result = await update('owner-1', 'parking-1', { isActive: false });

      expect(parkingRepository.updateWithCapacityCheck).toHaveBeenCalledWith('parking-1', {
        isActive: false,
      });
      expect(result).toEqual(toParkingResponse(inactiveParking));
    });

    it('returns the active session count when capacity is too low', async () => {
      vi.mocked(parkingRepository.updateWithCapacityCheck).mockResolvedValue({
        activeCount: 3,
        kind: 'capacity-blocked',
      });
      vi.mocked(parkingRepository.findById).mockResolvedValue(buildParking({ ownerId: 'owner-1' }));

      await expect(update('owner-1', 'parking-1', { capacity: 2 })).rejects.toThrow(
        '3 active sessions',
      );
    });
  });

  describe('findAll', () => {
    it('applies filters and returns paginated result', async () => {
      const data = Array.from({ length: 5 }, (_, index) =>
        publicParking({
          id: `parking-${String(index + 1)}`,
          title: `Parking ${String(index + 1)}`,
        }),
      );
      const query: ParkingQuery = {
        page: 2,
        limit: 2,
        search: 'Main',
        currency: 'USD',
        minHourlyRateCents: 1000,
        maxHourlyRateCents: 3000,
      };

      vi.mocked(parkingRepository.findPublicCandidates).mockResolvedValue(data);

      const result = await findAll(query);

      expect(parkingRepository.findPublicCandidates).toHaveBeenCalledWith({
        OR: [
          { title: { contains: 'Main', mode: 'insensitive' } },
          { neighborhood: { contains: 'Main', mode: 'insensitive' } },
          { address: { contains: 'Main', mode: 'insensitive' } },
        ],
        currency: 'USD',
        hourlyRateCents: {
          gte: 1000,
          lte: 3000,
        },
      });
      expect(result.meta).toEqual({
        page: 2,
        limit: 2,
        total: 5,
        totalPages: 3,
        hasNextPage: true,
        hasPreviousPage: true,
      });
      expect(result.data.map(({ id }) => id)).toEqual(['parking-3', 'parking-4']);
    });

    it('returns paginated result with empty filters', async () => {
      const query: ParkingQuery = {
        page: 1,
        limit: 10,
      };

      vi.mocked(parkingRepository.findPublicCandidates).mockResolvedValue([]);

      const result = await findAll(query);

      expect(parkingRepository.findPublicCandidates).toHaveBeenCalledWith({});
      expect(result.meta).toEqual({
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0,
        hasNextPage: false,
        hasPreviousPage: false,
      });
      expect(result.data).toEqual([]);
    });

    it('filters and orders by derived availability before pagination', async () => {
      const data = [
        publicParking({ id: 'closed', title: 'Closed' }),
        publicParking({ id: 'full', title: 'Full', capacity: 1 }),
        publicParking({ id: 'limited', title: 'Limited', capacity: 5 }),
        publicParking({ id: 'available', title: 'Available', capacity: 5 }),
      ];
      data[0].is24Hours = false;
      data[0].opensAt = '08:00';
      data[0].closesAt = '09:00';
      data[1].parkingSessions = [{ id: 'active-1' }];
      data[2].parkingSessions = [
        { id: 'active-1' },
        { id: 'active-2' },
        { id: 'active-3' },
        { id: 'active-4' },
      ];
      vi.mocked(parkingRepository.findPublicCandidates).mockResolvedValue(data);

      const result = await findAll({ page: 1, limit: 10, availableNow: true });

      expect(result.data.map(({ id }) => id)).toEqual(['available', 'limited']);
    });
  });
});
