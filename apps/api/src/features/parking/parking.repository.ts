import { prisma } from '../../config/prisma.js';
import { Parking, Prisma } from '../../../prisma/generated/client.js';

const activeParkingSessionsInclude = {
  where: { status: 'ACTIVE' },
  select: { id: true },
} as const;

const publicParkingInclude = {
  owner: { select: { kind: true } },
  parkingSessions: activeParkingSessionsInclude,
} satisfies Prisma.ParkingInclude;

export type PublicParkingRecord = Prisma.ParkingGetPayload<{
  include: typeof publicParkingInclude;
}>;

const ownerParkingInclude = {
  parkingSessions: activeParkingSessionsInclude,
} satisfies Prisma.ParkingInclude;

export type OwnerParkingRecord = Prisma.ParkingGetPayload<{
  include: typeof ownerParkingInclude;
}>;

const publicVisibilityWhere: Prisma.ParkingWhereInput = {
  isActive: true,
  isListed: true,
  owner: { kind: { in: ['OWNER', 'SHOWCASE'] } },
};

export const create = async (data: Prisma.ParkingCreateInput): Promise<OwnerParkingRecord> => {
  return await prisma.parking.create({
    data: data,
    include: ownerParkingInclude,
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

export const findByOwner = async (ownerId: string): Promise<OwnerParkingRecord[]> => {
  return await prisma.parking.findMany({
    where: { ownerId },
    include: ownerParkingInclude,
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
): Promise<OwnerParkingRecord | CapacityUpdateBlocked | null> => {
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

      return await tx.parking.update({ where: { id }, data, include: ownerParkingInclude });
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
