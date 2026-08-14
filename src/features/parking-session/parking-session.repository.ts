import {
  Parking,
  ParkingSession,
  Prisma,
  Vehicle,
  type ParkingSessionStatus,
} from '../../../prisma/generated/client.js';
import { prisma } from '../../config/prisma.js';

export type ParkingSessionWithRelations = ParkingSession & {
  vehicle: Vehicle;
  parking: Pick<Parking, 'id' | 'title' | 'ownerId'>;
};

export type CheckInBlockedReason = 'parking-full' | 'vehicle-active';

export const findById = async (id: string): Promise<ParkingSessionWithRelations | null> => {
  return await prisma.parkingSession.findUnique({
    where: { id },
    include: {
      vehicle: true,
      parking: { select: { id: true, title: true, ownerId: true } },
    },
  });
};

export const findActiveByParking = async (parkingId: string): Promise<ParkingSession[]> => {
  return await prisma.parkingSession.findMany({
    where: { parkingId, status: 'ACTIVE' },
    orderBy: { startTime: 'desc' },
  });
};

export const findByParking = async (
  parkingId: string,
  options: { skip: number; take: number; status?: ParkingSessionStatus },
): Promise<{ data: ParkingSession[]; total: number }> => {
  const where: Prisma.ParkingSessionWhereInput = {
    parkingId,
    ...(options.status ? { status: options.status } : {}),
  };
  const [data, total] = await Promise.all([
    prisma.parkingSession.findMany({
      where,
      skip: options.skip,
      take: options.take,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.parkingSession.count({ where }),
  ]);
  return { data, total };
};

export const createActiveIfAvailable = async (
  parkingId: string,
  vehicleId: string,
  capacity: number,
  hourlyRateCents: number,
  currency: string,
): Promise<ParkingSession | CheckInBlockedReason> => {
  return await prisma.$transaction(
    async (tx) => {
      const activeCount = await tx.parkingSession.count({ where: { parkingId, status: 'ACTIVE' } });
      if (activeCount >= capacity) return 'parking-full';

      const activeSession = await tx.parkingSession.findFirst({
        where: { parkingId, vehicleId, status: 'ACTIVE' },
      });
      if (activeSession) return 'vehicle-active';

      return await tx.parkingSession.create({
        data: {
          startTime: new Date(),
          status: 'ACTIVE',
          hourlyRateCents,
          currency,
          parking: { connect: { id: parkingId } },
          vehicle: { connect: { id: vehicleId } },
        },
      });
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
  );
};

export const completeIfActive = async (
  id: string,
  endTime: Date,
  totalAmountCents: number,
): Promise<ParkingSession | null> => {
  return await prisma.$transaction(async (tx) => {
    const result = await tx.parkingSession.updateMany({
      where: { id, status: 'ACTIVE' },
      data: { endTime, totalAmountCents, status: 'COMPLETED' },
    });
    if (result.count !== 1) return null;
    return await tx.parkingSession.findUniqueOrThrow({ where: { id } });
  });
};

export const cancelIfActive = async (id: string): Promise<ParkingSession | null> => {
  return await prisma.$transaction(async (tx) => {
    const result = await tx.parkingSession.updateMany({
      where: { id, status: 'ACTIVE' },
      data: { status: 'CANCELLED' },
    });
    if (result.count !== 1) return null;
    return await tx.parkingSession.findUniqueOrThrow({ where: { id } });
  });
};
