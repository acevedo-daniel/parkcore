import { type Vehicle } from '../../../prisma/generated/client.js';
import { prisma } from '../../config/prisma.js';
import { normalizePlate } from './plate-normalization.js';

export const findByPlate = async (plate: string, parkingId: string): Promise<Vehicle | null> => {
  return await prisma.vehicle.findUnique({
    where: {
      plate_parkingId: { plate: normalizePlate(plate), parkingId },
    },
  });
};
