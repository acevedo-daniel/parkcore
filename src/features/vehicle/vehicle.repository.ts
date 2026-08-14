import { Vehicle, Prisma } from '../../../prisma/generated/client.js';
import { prisma } from '../../config/prisma.js';
import { normalizePlate } from './plate-normalization.js';

export const create = async (data: Prisma.VehicleCreateInput): Promise<Vehicle> => {
  return await prisma.vehicle.create({
    data: { ...data, plate: normalizePlate(data.plate) },
  });
};

export const findByPlate = async (plate: string, parkingId: string): Promise<Vehicle | null> => {
  return await prisma.vehicle.findUnique({
    where: {
      plate_parkingId: { plate: normalizePlate(plate), parkingId },
    },
  });
};
