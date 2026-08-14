import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('./parking.repository.js', () => ({
  create: vi.fn(),
  findById: vi.fn(),
  findActiveById: vi.fn(),
  findByOwner: vi.fn(),
  update: vi.fn(),
  findAll: vi.fn(),
}));

import { buildParking } from '../../../tests/helpers/builders.js';
import { ForbiddenError, NotFoundError } from '../../errors/index.js';
import type { CreateParking, ParkingQuery, UpdateParking } from './parking.schema.js';
import * as parkingRepository from './parking.repository.js';
import { create, findAll, findById, findOwned, findPublicById, update } from './parking.service.js';

const createDto: CreateParking = {
  title: 'Main Parking',
  address: '123 Test St',
  pricePerHour: 2000,
  totalSpaces: 20,
  lat: 10,
  lng: 10,
};

describe('parking.service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates parking connected to owner', async () => {
    const created = buildParking();
    vi.mocked(parkingRepository.create).mockResolvedValue(created);

    const result = await create('owner-1', createDto);

    expect(parkingRepository.create).toHaveBeenCalledWith({
      ...createDto,
      owner: { connect: { id: 'owner-1' } },
    });
    expect(result).toEqual(created);
  });

  it('findById throws NotFoundError when parking does not exist', async () => {
    vi.mocked(parkingRepository.findById).mockResolvedValue(null);

    await expect(findById('missing-parking')).rejects.toBeInstanceOf(NotFoundError);
  });

  it('findPublicById returns only an active parking', async () => {
    const parking = buildParking({ isActive: true });
    vi.mocked(parkingRepository.findActiveById).mockResolvedValue(parking);

    const result = await findPublicById(parking.id);

    expect(parkingRepository.findActiveById).toHaveBeenCalledWith(parking.id);
    expect(result).toEqual(parking);
  });

  it('findPublicById hides an inactive parking as not found', async () => {
    vi.mocked(parkingRepository.findActiveById).mockResolvedValue(null);

    await expect(findPublicById('inactive-parking')).rejects.toBeInstanceOf(NotFoundError);
  });

  it('findOwned returns owner parkings', async () => {
    const owned = [buildParking({ id: 'parking-1' }), buildParking({ id: 'parking-2' })];
    vi.mocked(parkingRepository.findByOwner).mockResolvedValue(owned);

    const result = await findOwned('owner-1');

    expect(parkingRepository.findByOwner).toHaveBeenCalledWith('owner-1');
    expect(result).toEqual(owned);
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
      const updatedParking = buildParking({ title: 'Updated Parking' });
      vi.mocked(parkingRepository.findById).mockResolvedValue(buildParking({ ownerId: 'owner-1' }));
      vi.mocked(parkingRepository.update).mockResolvedValue(updatedParking);

      const result = await update('owner-1', 'parking-1', dto);

      expect(parkingRepository.update).toHaveBeenCalledWith('parking-1', dto);
      expect(result).toEqual(updatedParking);
    });

    it('allows the owner to deactivate a parking', async () => {
      const inactiveParking = buildParking({ isActive: false });
      vi.mocked(parkingRepository.findById).mockResolvedValue(buildParking({ ownerId: 'owner-1' }));
      vi.mocked(parkingRepository.update).mockResolvedValue(inactiveParking);

      const result = await update('owner-1', 'parking-1', { isActive: false });

      expect(parkingRepository.update).toHaveBeenCalledWith('parking-1', { isActive: false });
      expect(result).toEqual(inactiveParking);
    });
  });

  describe('findAll', () => {
    it('applies filters and returns paginated result', async () => {
      const data = [buildParking({ id: 'parking-3' }), buildParking({ id: 'parking-4' })];
      const query: ParkingQuery = {
        page: 2,
        limit: 2,
        search: 'Main',
        minPrice: 1000,
        maxPrice: 3000,
        ownerId: 'owner-1',
      };

      vi.mocked(parkingRepository.findAll).mockResolvedValue({ data, total: 5 });

      const result = await findAll(query);

      expect(parkingRepository.findAll).toHaveBeenCalledWith(2, 2, {
        OR: [
          { title: { contains: 'Main', mode: 'insensitive' } },
          { address: { contains: 'Main', mode: 'insensitive' } },
        ],
        pricePerHour: {
          gte: 1000,
          lte: 3000,
        },
        ownerId: 'owner-1',
        isActive: true,
      });
      expect(result.meta).toEqual({
        page: 2,
        limit: 2,
        total: 5,
        totalPages: 3,
        hasNextPage: true,
        hasPreviousPage: true,
      });
      expect(result.data).toEqual(data);
    });

    it('returns paginated result with empty filters', async () => {
      const query: ParkingQuery = {
        page: 1,
        limit: 10,
      };

      vi.mocked(parkingRepository.findAll).mockResolvedValue({ data: [], total: 0 });

      const result = await findAll(query);

      expect(parkingRepository.findAll).toHaveBeenCalledWith(0, 10, { isActive: true });
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
  });
});
