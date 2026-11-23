import { type Vehicle } from '../../../prisma/generated/client.js';
import * as vehicleRepository from './vehicle.repository.js';
import { normalizePlate } from './plate-normalization.js';

export const findByPlateForParking = async (
  parkingId: string,
  plate: string,
): Promise<Vehicle | null> => {
  return await vehicleRepository.findByPlate(normalizePlate(plate), parkingId);
};
