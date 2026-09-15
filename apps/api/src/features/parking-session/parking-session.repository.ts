import { Prisma, type ParkingSessionStatus } from '../../../prisma/generated/client.js';
import { prisma } from '../../config/prisma.js';
import { getScheduleState } from '../../utils/timezone.js';
import { normalizePlate } from '../vehicle/plate-normalization.js';
import type { CheckIn, ParkingSessionFilter, VisitData } from './parking-session.schema.js';

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

const checkInParkingSelect = {
  id: true,
  ownerId: true,
  isActive: true,
  timezone: true,
  is24Hours: true,
  opensAt: true,
  closesAt: true,
  capacity: true,
  hourlyRateCents: true,
  currency: true,
} as const satisfies Prisma.ParkingSelect;

export type ParkingSessionWithVehicle = Prisma.ParkingSessionGetPayload<{
  select: typeof parkingSessionWithVehicleSelect;
}>;

export type ParkingSessionWithRelations = Prisma.ParkingSessionGetPayload<{
  select: typeof parkingSessionWithRelationsSelect;
}>;

export type ParkingSessionHistoryAggregateRow = Prisma.ParkingSessionGetPayload<{
  select: typeof parkingSessionHistoryAggregateSelect;
}>;

export type CheckInBlockedReason =
  | { kind: 'parking-not-found' }
  | { kind: 'parking-forbidden' }
  | { kind: 'parking-inactive' }
  | { kind: 'parking-closed'; nextOpeningAt: Date | null }
  | { kind: 'parking-full' }
  | { kind: 'vehicle-active' };

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
    orderBy: [{ startTime: 'asc' }, { id: 'asc' }],
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
      orderBy: [{ startTime: 'desc' }, { id: 'desc' }],
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
    orderBy: [{ startTime: 'desc' }, { id: 'desc' }],
    select: parkingSessionWithVehicleSelect,
  });
};

export const createActiveIfAvailable = async (
  ownerId: string,
  parkingId: string,
  vehicleInput: Pick<CheckIn, 'plate' | 'type' | 'brand' | 'model'>,
  visitData: VisitData,
): Promise<ParkingSessionWithVehicle | CheckInBlockedReason> => {
  return await prisma.$transaction(
    async (tx) => {
      const parking = await tx.parking.findUnique({
        where: { id: parkingId },
        select: checkInParkingSelect,
      });
      if (!parking) return { kind: 'parking-not-found' };
      if (parking.ownerId !== ownerId) return { kind: 'parking-forbidden' };

      const now = new Date();
      if (!parking.isActive) return { kind: 'parking-inactive' };

      const schedule = getScheduleState(
        {
          timezone: parking.timezone,
          is24Hours: parking.is24Hours,
          opensAt: parking.opensAt,
          closesAt: parking.closesAt,
        },
        now,
      );
      if (!schedule.isOpen) {
        return { kind: 'parking-closed', nextOpeningAt: schedule.nextOpeningAt };
      }

      const plate = normalizePlate(vehicleInput.plate);
      const existingVehicle = await tx.vehicle.findUnique({
        where: { plate_parkingId: { plate, parkingId } },
        select: { id: true },
      });

      if (existingVehicle) {
        const activeSession = await tx.parkingSession.findFirst({
          where: { parkingId, vehicleId: existingVehicle.id, status: 'ACTIVE' },
          select: { id: true },
        });
        if (activeSession) return { kind: 'vehicle-active' };
      }

      const activeCount = await tx.parkingSession.count({ where: { parkingId, status: 'ACTIVE' } });
      if (activeCount >= parking.capacity) return { kind: 'parking-full' };

      const stableMetadata = {
        ...(vehicleInput.type !== undefined ? { type: vehicleInput.type } : {}),
        ...(vehicleInput.brand !== undefined ? { brand: vehicleInput.brand } : {}),
        ...(vehicleInput.model !== undefined ? { model: vehicleInput.model } : {}),
      };

      const vehicle = existingVehicle
        ? Object.keys(stableMetadata).length > 0
          ? await tx.vehicle.update({
              where: { id: existingVehicle.id },
              data: stableMetadata,
              select: { id: true },
            })
          : existingVehicle
        : await tx.vehicle.create({
            data: { parkingId, plate, ...stableMetadata },
            select: { id: true },
          });

      return await tx.parkingSession.create({
        data: {
          startTime: now,
          status: 'ACTIVE',
          hourlyRateCents: parking.hourlyRateCents,
          currency: parking.currency,
          ...visitData,
          parking: { connect: { id: parkingId } },
          vehicle: { connect: { id: vehicle.id } },
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
