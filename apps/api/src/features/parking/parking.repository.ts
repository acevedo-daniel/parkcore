import { prisma } from '../../config/prisma.js';
import { Parking, Prisma } from '../../../prisma/generated/client.js';

export const create = async (data: Prisma.ParkingCreateInput): Promise<Parking> => {
  return await prisma.parking.create({
    data: data,
  });
};

export const findById = async (id: string): Promise<Parking | null> => {
  return await prisma.parking.findUnique({
    where: { id },
  });
};

export const findActiveById = async (id: string): Promise<Parking | null> => {
  return await prisma.parking.findFirst({
    where: { id, isActive: true },
  });
};

export const findByOwner = async (ownerId: string): Promise<Parking[]> => {
  return await prisma.parking.findMany({
    where: { ownerId },
  });
};

export const update = async (id: string, data: Prisma.ParkingUpdateInput): Promise<Parking> => {
  return await prisma.parking.update({
    where: { id },
    data: data,
  });
};

export const findAll = async (
  skip: number,
  take: number,
  where: Prisma.ParkingWhereInput,
): Promise<{ data: Parking[]; total: number }> => {
  const [data, total] = await Promise.all([
    prisma.parking.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.parking.count({ where }),
  ]);

  return { data, total };
};
