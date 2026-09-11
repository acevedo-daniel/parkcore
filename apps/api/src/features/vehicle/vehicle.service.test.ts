import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('./vehicle.repository.js', () => ({
  create: vi.fn(),
  findByPlate: vi.fn(),
  updateStableMetadata: vi.fn(),
}));

import { Prisma } from '../../../prisma/generated/client.js';
import { buildVehicle } from '../../../tests/helpers/builders.js';
import { ConflictError } from '../../errors/index.js';
import * as vehicleRepository from './vehicle.repository.js';
import { normalizePlate } from './plate-normalization.js';
import { type VehicleIdentityInput, vehicleIdentitySchema } from './vehicle.schema.js';
import { findOrCreateForAuthorizedParking } from './vehicle.service.js';

const identityInput: VehicleIdentityInput = { plate: 'AB123CD', type: 'CAR' };

describe('vehicle service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it.each([
    [' ab-123 cd ', 'AB123CD'],
    ['AB 123 CD', 'AB123CD'],
  ])('normalizes %s to %s', (input, expected) => {
    expect(normalizePlate(input)).toBe(expected);
    expect(vehicleIdentitySchema.parse({ plate: input }).plate).toBe(expected);
  });

  it('reuses an existing vehicle without overwriting omitted stable metadata', async () => {
    const vehicle = buildVehicle({ plate: 'AB123CD', brand: 'Toyota', model: 'Corolla' });
    vi.mocked(vehicleRepository.findByPlate).mockResolvedValue(vehicle);

    await expect(
      findOrCreateForAuthorizedParking('parking-1', { plate: ' ab-123 cd ' }),
    ).resolves.toEqual(vehicle);
    expect(vehicleRepository.findByPlate).toHaveBeenCalledWith('AB123CD', 'parking-1');
    expect(vehicleRepository.updateStableMetadata).not.toHaveBeenCalled();
    expect(vehicleRepository.create).not.toHaveBeenCalled();
  });

  it('updates only stable metadata explicitly supplied by a returning vehicle', async () => {
    const vehicle = buildVehicle({ plate: 'AB123CD', brand: 'Toyota', model: 'Corolla' });
    const updatedVehicle = buildVehicle({
      ...vehicle,
      type: 'MOTORCYCLE',
      brand: 'Honda',
      model: 'CB500',
    });
    vi.mocked(vehicleRepository.findByPlate).mockResolvedValue(vehicle);
    vi.mocked(vehicleRepository.updateStableMetadata).mockResolvedValue(updatedVehicle);

    await expect(
      findOrCreateForAuthorizedParking('parking-1', {
        plate: 'AB123CD',
        type: 'MOTORCYCLE',
        brand: 'Honda',
        model: 'CB500',
      }),
    ).resolves.toEqual(updatedVehicle);
    expect(vehicleRepository.updateStableMetadata).toHaveBeenCalledWith(vehicle.id, {
      type: 'MOTORCYCLE',
      brand: 'Honda',
      model: 'CB500',
    });
  });

  it('creates a normalized vehicle when it is first seen', async () => {
    const vehicle = buildVehicle({ plate: 'AB123CD' });
    vi.mocked(vehicleRepository.findByPlate).mockResolvedValue(null);
    vi.mocked(vehicleRepository.create).mockResolvedValue(vehicle);

    await expect(
      findOrCreateForAuthorizedParking('parking-1', { ...identityInput, plate: 'AB 123 CD' }),
    ).resolves.toEqual(vehicle);
    expect(vehicleRepository.create).toHaveBeenCalledWith({
      ...identityInput,
      plate: 'AB123CD',
      parkingId: 'parking-1',
    });
  });

  it('keeps normalized plate identity scoped to the parking facility', async () => {
    const firstParkingVehicle = buildVehicle({ id: 'vehicle-1', parkingId: 'parking-1' });
    const secondParkingVehicle = buildVehicle({ id: 'vehicle-2', parkingId: 'parking-2' });
    vi.mocked(vehicleRepository.findByPlate).mockResolvedValue(null);
    vi.mocked(vehicleRepository.create)
      .mockResolvedValueOnce(firstParkingVehicle)
      .mockResolvedValueOnce(secondParkingVehicle);

    await expect(
      findOrCreateForAuthorizedParking('parking-1', { plate: 'ab-123-cd' }),
    ).resolves.toEqual(firstParkingVehicle);
    await expect(
      findOrCreateForAuthorizedParking('parking-2', { plate: 'AB 123 CD' }),
    ).resolves.toEqual(secondParkingVehicle);

    expect(vehicleRepository.findByPlate).toHaveBeenNthCalledWith(1, 'AB123CD', 'parking-1');
    expect(vehicleRepository.findByPlate).toHaveBeenNthCalledWith(2, 'AB123CD', 'parking-2');
    expect(vehicleRepository.create).toHaveBeenNthCalledWith(1, {
      plate: 'AB123CD',
      parkingId: 'parking-1',
    });
    expect(vehicleRepository.create).toHaveBeenNthCalledWith(2, {
      plate: 'AB123CD',
      parkingId: 'parking-2',
    });
  });

  it('reuses a concurrently registered vehicle after a unique collision', async () => {
    const vehicle = buildVehicle({ plate: 'AB123CD' });
    const uniquePlateError = Object.assign(
      Object.create(Prisma.PrismaClientKnownRequestError.prototype),
      { code: 'P2002', meta: { target: ['plate', 'parkingId'] } },
    ) as Prisma.PrismaClientKnownRequestError;
    vi.mocked(vehicleRepository.findByPlate).mockResolvedValueOnce(null).mockResolvedValue(vehicle);
    vi.mocked(vehicleRepository.create).mockRejectedValue(uniquePlateError);

    await expect(
      findOrCreateForAuthorizedParking('parking-1', { plate: 'ab-123-cd' }),
    ).resolves.toEqual(vehicle);
    expect(vehicleRepository.findByPlate).toHaveBeenLastCalledWith('AB123CD', 'parking-1');
  });

  it('raises a conflict only when a unique collision cannot be resolved by reading the vehicle', async () => {
    const uniquePlateError = Object.assign(
      Object.create(Prisma.PrismaClientKnownRequestError.prototype),
      { code: 'P2002', meta: { target: ['plate', 'parkingId'] } },
    ) as Prisma.PrismaClientKnownRequestError;
    vi.mocked(vehicleRepository.findByPlate).mockResolvedValue(null);
    vi.mocked(vehicleRepository.create).mockRejectedValue(uniquePlateError);

    await expect(
      findOrCreateForAuthorizedParking('parking-1', identityInput),
    ).rejects.toBeInstanceOf(ConflictError);
  });
});
