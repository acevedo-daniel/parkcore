import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('./vehicle.repository.js', () => ({
  findByPlate: vi.fn(),
}));

import { buildVehicle } from '../../../tests/helpers/builders.js';
import * as vehicleRepository from './vehicle.repository.js';
import { normalizePlate } from './plate-normalization.js';
import { vehicleIdentitySchema } from './vehicle.schema.js';
import { findByPlateForParking } from './vehicle.service.js';

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

  it('finds a vehicle by its normalized plate within one parking', async () => {
    const vehicle = buildVehicle({ plate: 'AB123CD', parkingId: 'parking-1' });
    vi.mocked(vehicleRepository.findByPlate).mockResolvedValue(vehicle);

    await expect(findByPlateForParking('parking-1', ' ab-123 cd ')).resolves.toEqual(vehicle);
    expect(vehicleRepository.findByPlate).toHaveBeenCalledWith('AB123CD', 'parking-1');
  });
});
