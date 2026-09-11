import {
  Prisma,
  type Currency,
  type ParkingSessionStatus,
} from '../../../prisma/generated/client.js';
import { prisma } from '../../config/prisma.js';
import type { ParkingSessionFilter, VisitData } from './parking-session.schema.js';

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

const parkingSessionHistoryAggregateSelect = {
  status: true,
  currency: true,
  totalAmountCents: true,
} as const satisfies Prisma.ParkingSessionSelect;

export type ParkingSessionWithVehicle = Prisma.ParkingSessionGetPayload<{
  select: typeof parkingSessionWithVehicleSelect;
}>;

export type ParkingSessionWithRelations = Prisma.ParkingSessionGetPayload<{
  select: typeof parkingSessionWithRelationsSelect;
}>;

export type ParkingSessionHistoryAggregateRow = Prisma.ParkingSessionGetPayload<{
  select: typeof parkingSessionHistoryAggregateSelect;
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
  options: { plate?: string } = {},
): Promise<ParkingSessionWithVehicle[]> => {
  return await prisma.parkingSession.findMany({
    where: {
      parkingId,
      status: 'ACTIVE',
      ...(options.plate ? { vehicle: { plate: { contains: options.plate } } } : {}),
    },
    orderBy: { startTime: 'desc' },
    select: parkingSessionWithVehicleSelect,
  });
};

export const findByParking = async (
  parkingId: string,
  options: {
    skip: number;
    take: number;
    status?: ParkingSessionStatus;
    plate?: string;
    startTimeFrom: Date;
    startTimeTo: Date;
  },
): Promise<{
  data: ParkingSessionWithVehicle[];
  total: number;
  aggregateRows: ParkingSessionHistoryAggregateRow[];
}> => {
  const where: Prisma.ParkingSessionWhereInput = {
    parkingId,
    ...(options.status ? { status: options.status } : {}),
    ...(options.plate ? { vehicle: { plate: { contains: options.plate } } } : {}),
    startTime: { gte: options.startTimeFrom, lte: options.startTimeTo },
  };
  const [data, total, aggregateRows] = await Promise.all([
    prisma.parkingSession.findMany({
      where,
      skip: options.skip,
      take: options.take,
      orderBy: { createdAt: 'desc' },
      select: parkingSessionWithVehicleSelect,
    }),
    prisma.parkingSession.count({ where }),
    prisma.parkingSession.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      select: parkingSessionHistoryAggregateSelect,
    }),
  ]);
  return { data, total, aggregateRows };
};

export const findForExport = async (
  parkingId: string,
  options: Pick<ParkingSessionFilter, 'status' | 'plate'> & {
    startTimeFrom: Date;
    startTimeTo: Date;
  },
): Promise<ParkingSessionWithVehicle[]> => {
  const where: Prisma.ParkingSessionWhereInput = {
    parkingId,
    ...(options.status ? { status: options.status } : {}),
    ...(options.plate ? { vehicle: { plate: { contains: options.plate } } } : {}),
    startTime: { gte: options.startTimeFrom, lte: options.startTimeTo },
  };
  return await prisma.parkingSession.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    select: parkingSessionWithVehicleSelect,
  });
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
    const endTime = new Date();
    const result = await tx.parkingSession.updateMany({
      where: { id, status: 'ACTIVE' },
      data: { endTime, status: 'CANCELLED', totalAmountCents: null },
    });
    if (result.count !== 1) return null;
    return await tx.parkingSession.findUniqueOrThrow({
      where: { id },
      select: parkingSessionWithVehicleSelect,
    });
  });
};
