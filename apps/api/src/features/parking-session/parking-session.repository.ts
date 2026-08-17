import {
  Prisma,
  type Currency,
  type ParkingSessionStatus,
} from '../../../prisma/generated/client.js';
import { prisma } from '../../config/prisma.js';
import type { VisitData } from './parking-session.schema.js';

const vehicleSummarySelect = {
  id: true,
  plate: true,
  type: true,
  brand: true,
  model: true,
} as const satisfies Prisma.VehicleSelect;

const parkingSessionWithVehicleSelect = {
  id: true,
  startTime: true,
  endTime: true,
  hourlyRateCents: true,
  currency: true,
  totalAmountCents: true,
  status: true,
  parkingId: true,
  vehicleId: true,
  customerName: true,
  customerPhone: true,
  notes: true,
  createdAt: true,
  updatedAt: true,
  vehicle: { select: vehicleSummarySelect },
} as const satisfies Prisma.ParkingSessionSelect;

const parkingSessionWithRelationsSelect = {
  ...parkingSessionWithVehicleSelect,
  parking: { select: { id: true, title: true, ownerId: true } },
} as const satisfies Prisma.ParkingSessionSelect;

export type ParkingSessionWithVehicle = Prisma.ParkingSessionGetPayload<{
  select: typeof parkingSessionWithVehicleSelect;
}>;

export type ParkingSessionWithRelations = Prisma.ParkingSessionGetPayload<{
  select: typeof parkingSessionWithRelationsSelect;
}>;

export type CheckInBlockedReason = 'parking-full' | 'vehicle-active';

export const findById = async (id: string): Promise<ParkingSessionWithRelations | null> => {
  return await prisma.parkingSession.findUnique({
    where: { id },
    select: parkingSessionWithRelationsSelect,
  });
};

export const findActiveByParking = async (
  parkingId: string,
): Promise<ParkingSessionWithVehicle[]> => {
  return await prisma.parkingSession.findMany({
    where: { parkingId, status: 'ACTIVE' },
    orderBy: { startTime: 'desc' },
    select: parkingSessionWithVehicleSelect,
  });
};

export const findByParking = async (
  parkingId: string,
  options: { skip: number; take: number; status?: ParkingSessionStatus },
): Promise<{ data: ParkingSessionWithVehicle[]; total: number }> => {
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
      select: parkingSessionWithVehicleSelect,
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
  currency: Currency,
  visitData: VisitData,
): Promise<ParkingSessionWithVehicle | CheckInBlockedReason> => {
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
          ...visitData,
          parking: { connect: { id: parkingId } },
          vehicle: { connect: { id: vehicleId } },
        },
        select: parkingSessionWithVehicleSelect,
      });
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
  );
};

export const completeIfActive = async (
  id: string,
  endTime: Date,
  totalAmountCents: number,
): Promise<ParkingSessionWithVehicle | null> => {
  return await prisma.$transaction(async (tx) => {
    const result = await tx.parkingSession.updateMany({
      where: { id, status: 'ACTIVE' },
      data: { endTime, totalAmountCents, status: 'COMPLETED' },
    });
    if (result.count !== 1) return null;
    return await tx.parkingSession.findUniqueOrThrow({
      where: { id },
      select: parkingSessionWithVehicleSelect,
    });
  });
};

export const cancelIfActive = async (id: string): Promise<ParkingSessionWithVehicle | null> => {
  return await prisma.$transaction(async (tx) => {
    const result = await tx.parkingSession.updateMany({
      where: { id, status: 'ACTIVE' },
      data: { status: 'CANCELLED' },
    });
    if (result.count !== 1) return null;
    return await tx.parkingSession.findUniqueOrThrow({
      where: { id },
      select: parkingSessionWithVehicleSelect,
    });
  });
};
