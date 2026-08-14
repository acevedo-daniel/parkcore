import { type Vehicle, Prisma } from '../../../prisma/generated/client.js';
import { ConflictError } from '../../errors/index.js';
import * as vehicleRepository from './vehicle.repository.js';
import { normalizePlate } from './plate-normalization.js';
import type { VehicleIdentityInput } from './vehicle.schema.js';

const isUniquePlateByParkingError = (error: unknown): boolean => {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== 'P2002') {
    return false;
  }

  const target = error.meta?.target;
  return Array.isArray(target) && target.includes('plate') && target.includes('parkingId');
};

const suppliedStableMetadata = (dto: VehicleIdentityInput): Prisma.VehicleUpdateInput => ({
  ...(dto.type !== undefined ? { type: dto.type } : {}),
  ...(dto.brand !== undefined ? { brand: dto.brand } : {}),
  ...(dto.model !== undefined ? { model: dto.model } : {}),
});

const updateExistingVehicle = async (
  vehicle: Vehicle,
  dto: VehicleIdentityInput,
): Promise<Vehicle> => {
  const data = suppliedStableMetadata(dto);
  return Object.keys(data).length === 0
    ? vehicle
    : await vehicleRepository.updateStableMetadata(vehicle.id, data);
};

export const findOrCreateForAuthorizedParking = async (
  parkingId: string,
  dto: VehicleIdentityInput,
): Promise<Vehicle> => {
  const plate = normalizePlate(dto.plate);
  const existingVehicle = await vehicleRepository.findByPlate(plate, parkingId);
  if (existingVehicle) return await updateExistingVehicle(existingVehicle, dto);

  try {
    return await vehicleRepository.create({
      ...dto,
      plate,
      parkingId,
    });
  } catch (error) {
    if (isUniquePlateByParkingError(error)) {
      const concurrentVehicle = await vehicleRepository.findByPlate(plate, parkingId);
      if (concurrentVehicle) return await updateExistingVehicle(concurrentVehicle, dto);
      throw new ConflictError('Vehicle plate already exists in this parking');
    }
    throw error;
  }
};
