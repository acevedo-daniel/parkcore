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

export interface CapacityUpdateBlocked {
  activeCount: number;
  kind: 'capacity-blocked';
}

export const updateWithCapacityCheck = async (
  id: string,
  data: Prisma.ParkingUpdateInput,
): Promise<Parking | CapacityUpdateBlocked | null> => {
  return await prisma.$transaction(
    async (tx) => {
      const current = await tx.parking.findUnique({
        where: { id },
        select: { capacity: true },
      });
      if (!current) return null;

      const requestedCapacity =
        typeof data.capacity === 'number' ? data.capacity : current.capacity;
      if (requestedCapacity < current.capacity) {
        const activeCount = await tx.parkingSession.count({
          where: { parkingId: id, status: 'ACTIVE' },
        });
        if (requestedCapacity < activeCount) return { activeCount, kind: 'capacity-blocked' };
      }

      return await tx.parking.update({ where: { id }, data });
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
  );
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
