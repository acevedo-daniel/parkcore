import { Vehicle } from '../../../prisma/generated/client.js';
import { Prisma } from '../../../prisma/generated/client.js';
import { ConflictError, ForbiddenError, NotFoundError } from '../../errors/index.js';
import * as parkingRepository from '../parking/parking.repository.js';
import * as vehicleRepository from './vehicle.repository.js';
import { normalizePlate } from './plate-normalization.js';
import type { CreateVehicle } from './vehicle.schema.js';

const ensureParkingOwnership = async (ownerId: string, parkingId: string): Promise<void> => {
  const parking = await parkingRepository.findById(parkingId);
  if (!parking) {
    throw new NotFoundError('Parking not found');
  }

  if (parking.ownerId !== ownerId) {
    throw new ForbiddenError('Access denied');
  }
};

const isUniquePlateByParkingError = (error: unknown): boolean => {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== 'P2002') {
    return false;
  }

  const target = error.meta?.target;
  return Array.isArray(target) && target.includes('plate') && target.includes('parkingId');
};

export const findOrCreateByPlate = async (
  ownerId: string,
  parkingId: string,
  dto: CreateVehicle,
): Promise<Vehicle> => {
  await ensureParkingOwnership(ownerId, parkingId);
  const plate = normalizePlate(dto.plate);
  const existingVehicle = await vehicleRepository.findByPlate(plate, parkingId);
  if (existingVehicle) return existingVehicle;

  try {
    return await vehicleRepository.create({
      ...dto,
      plate,
      parking: { connect: { id: parkingId } },
    });
  } catch (error) {
    if (isUniquePlateByParkingError(error)) {
      const concurrentVehicle = await vehicleRepository.findByPlate(plate, parkingId);
      if (concurrentVehicle) return concurrentVehicle;
      throw new ConflictError('Vehicle plate already exists in this parking');
    }
    throw error;
  }
};
