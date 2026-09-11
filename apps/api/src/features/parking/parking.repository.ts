import { prisma } from '../../config/prisma.js';
import { Parking, Prisma } from '../../../prisma/generated/client.js';

const publicParkingInclude = {
  owner: { select: { kind: true } },
  parkingSessions: { where: { status: 'ACTIVE' }, select: { id: true } },
} satisfies Prisma.ParkingInclude;

export type PublicParkingRecord = Prisma.ParkingGetPayload<{
  include: typeof publicParkingInclude;
}>;

const publicVisibilityWhere: Prisma.ParkingWhereInput = {
  isActive: true,
  isListed: true,
  owner: { kind: { in: ['OWNER', 'SHOWCASE'] } },
};

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

export const findPublicById = async (id: string): Promise<PublicParkingRecord | null> => {
  return await prisma.parking.findFirst({
    where: { AND: [publicVisibilityWhere, { id }] },
    include: publicParkingInclude,
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

export const findPublicCandidates = async (
  where: Prisma.ParkingWhereInput,
): Promise<PublicParkingRecord[]> => {
  return await prisma.parking.findMany({
    where: { AND: [publicVisibilityWhere, where] },
    include: publicParkingInclude,
  });
};
