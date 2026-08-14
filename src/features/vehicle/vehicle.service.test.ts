import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../parking/parking.repository.js', () => ({ findById: vi.fn() }));
vi.mock('./vehicle.repository.js', () => ({ create: vi.fn(), findByPlate: vi.fn() }));

import { Prisma } from '../../../prisma/generated/client.js';
import { buildParking, buildVehicle } from '../../../tests/helpers/builders.js';
import { ConflictError, ForbiddenError, NotFoundError } from '../../errors/index.js';
import * as parkingRepository from '../parking/parking.repository.js';
import * as vehicleRepository from './vehicle.repository.js';
import { normalizePlate } from './plate-normalization.js';
import { createVehicleSchema, type CreateVehicle } from './vehicle.schema.js';
import { findOrCreateByPlate } from './vehicle.service.js';

const createDto: CreateVehicle = { plate: 'AB123CD', type: 'CAR' };

describe('vehicle service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it.each([
    [' ab-123 cd ', 'AB123CD'],
    ['AB 123 CD', 'AB123CD'],
  ])('normalizes %s to %s', (input, expected) => {
    expect(normalizePlate(input)).toBe(expected);
    expect(createVehicleSchema.parse({ plate: input }).plate).toBe(expected);
  });

  it('reuses an existing vehicle by its normalized parking-scoped identity', async () => {
    const vehicle = buildVehicle({ plate: 'AB123CD' });
    vi.mocked(parkingRepository.findById).mockResolvedValue(buildParking());
    vi.mocked(vehicleRepository.findByPlate).mockResolvedValue(vehicle);

    await expect(
      findOrCreateByPlate('owner-1', 'parking-1', { ...createDto, plate: ' ab-123 cd ' }),
    ).resolves.toEqual(vehicle);
    expect(vehicleRepository.findByPlate).toHaveBeenCalledWith('AB123CD', 'parking-1');
    expect(vehicleRepository.create).not.toHaveBeenCalled();
  });

  it('creates a normalized vehicle when it is first seen', async () => {
    const vehicle = buildVehicle({ plate: 'AB123CD' });
    vi.mocked(parkingRepository.findById).mockResolvedValue(buildParking());
    vi.mocked(vehicleRepository.findByPlate).mockResolvedValue(null);
    vi.mocked(vehicleRepository.create).mockResolvedValue(vehicle);

    await expect(
      findOrCreateByPlate('owner-1', 'parking-1', { ...createDto, plate: 'AB 123 CD' }),
    ).resolves.toEqual(vehicle);
    expect(vehicleRepository.create).toHaveBeenCalledWith({
      ...createDto,
      plate: 'AB123CD',
      parking: { connect: { id: 'parking-1' } },
    });
  });

  it('reuses the concurrently registered vehicle after a unique collision', async () => {
    const vehicle = buildVehicle({ plate: 'AB123CD' });
    const uniquePlateError = Object.assign(
      Object.create(Prisma.PrismaClientKnownRequestError.prototype),
      { code: 'P2002', meta: { target: ['plate', 'parkingId'] } },
    ) as Prisma.PrismaClientKnownRequestError;
    vi.mocked(parkingRepository.findById).mockResolvedValue(buildParking());
    vi.mocked(vehicleRepository.findByPlate).mockResolvedValueOnce(null).mockResolvedValue(vehicle);
    vi.mocked(vehicleRepository.create).mockRejectedValue(uniquePlateError);

    await expect(
      findOrCreateByPlate('owner-1', 'parking-1', { ...createDto, plate: 'ab-123-cd' }),
    ).resolves.toEqual(vehicle);
    expect(vehicleRepository.findByPlate).toHaveBeenLastCalledWith('AB123CD', 'parking-1');
  });

  it('keeps authorization and missing-parking errors', async () => {
    vi.mocked(parkingRepository.findById).mockResolvedValue(null);
    await expect(findOrCreateByPlate('owner-1', 'parking-1', createDto)).rejects.toBeInstanceOf(
      NotFoundError,
    );

    vi.mocked(parkingRepository.findById).mockResolvedValue(buildParking({ ownerId: 'owner-2' }));
    await expect(findOrCreateByPlate('owner-1', 'parking-1', createDto)).rejects.toBeInstanceOf(
      ForbiddenError,
    );
  });

  it('raises a conflict only when a unique collision cannot be resolved by reading the vehicle', async () => {
    const uniquePlateError = Object.assign(
      Object.create(Prisma.PrismaClientKnownRequestError.prototype),
      { code: 'P2002', meta: { target: ['plate', 'parkingId'] } },
    ) as Prisma.PrismaClientKnownRequestError;
    vi.mocked(parkingRepository.findById).mockResolvedValue(buildParking());
    vi.mocked(vehicleRepository.findByPlate).mockResolvedValue(null);
    vi.mocked(vehicleRepository.create).mockRejectedValue(uniquePlateError);

    await expect(findOrCreateByPlate('owner-1', 'parking-1', createDto)).rejects.toBeInstanceOf(
      ConflictError,
    );
  });
});
