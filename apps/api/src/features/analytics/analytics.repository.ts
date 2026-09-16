import type { Currency, Prisma, ParkingSessionStatus } from '../../../prisma/generated/client.js';
import { prisma } from '../../config/prisma.js';

const facilitySelect = {
  id: true,
  title: true,
  isActive: true,
  capacity: true,
  hourlyRateCents: true,
  currency: true,
} as const satisfies Prisma.ParkingSelect;

const sessionSelect = {
  parkingId: true,
  status: true,
  endTime: true,
  totalAmountCents: true,
  currency: true,
} as const satisfies Prisma.ParkingSessionSelect;

export type OwnerFacility = Prisma.ParkingGetPayload<{ select: typeof facilitySelect }>;
export type OwnerAnalyticsSession = Prisma.ParkingSessionGetPayload<{
  select: typeof sessionSelect;
}>;

export interface OwnerActiveSessionCount {
  parkingId: string;
  activeSessions: number;
}

export interface OwnerCompletedSessionAggregate {
  parkingId: string;
  currency: Currency;
  completedSessions: number;
  revenueCents: number;
}

interface OwnerSessionOptions {
  status?: ParkingSessionStatus;
  endTimeFrom?: Date;
  endTimeTo?: Date;
}

const ownerSessionWhere = (
  ownerId: string,
  options: OwnerSessionOptions,
): Prisma.ParkingSessionWhereInput => ({
  parking: { ownerId },
  ...(options.status ? { status: options.status } : {}),
  ...(options.endTimeFrom || options.endTimeTo
    ? {
        endTime: {
          ...(options.endTimeFrom ? { gte: options.endTimeFrom } : {}),
          ...(options.endTimeTo ? { lte: options.endTimeTo } : {}),
        },
      }
    : {}),
});

export const findOwnerTimezone = async (ownerId: string): Promise<string> => {
  const owner = await prisma.user.findUniqueOrThrow({
    where: { id: ownerId },
    select: { timezone: true },
  });
  return owner.timezone;
};

export const findOwnerFacilities = async (ownerId: string): Promise<OwnerFacility[]> => {
  return await prisma.parking.findMany({
    where: { ownerId },
    orderBy: { title: 'asc' },
    select: facilitySelect,
  });
};

export const findOwnerActiveSessionCounts = async (
  ownerId: string,
): Promise<OwnerActiveSessionCount[]> => {
  const rows = await prisma.parkingSession.groupBy({
    by: ['parkingId'],
    where: ownerSessionWhere(ownerId, { status: 'ACTIVE' }),
    _count: { _all: true },
  });
  return rows.map(({ parkingId, _count }) => ({
    parkingId,
    activeSessions: _count._all,
  }));
};

export const findOwnerCompletedSessionAggregates = async (
  ownerId: string,
  options: Pick<OwnerSessionOptions, 'endTimeFrom' | 'endTimeTo'>,
): Promise<OwnerCompletedSessionAggregate[]> => {
  const rows = await prisma.parkingSession.groupBy({
    by: ['parkingId', 'currency'],
    where: ownerSessionWhere(ownerId, { status: 'COMPLETED', ...options }),
    _count: { _all: true },
    _sum: { totalAmountCents: true },
  });
  return rows.map(({ parkingId, currency, _count, _sum }) => ({
    parkingId,
    currency,
    completedSessions: _count._all,
    revenueCents: _sum.totalAmountCents ?? 0,
  }));
};

export const findOwnerSessions = async (
  ownerId: string,
  options: OwnerSessionOptions,
): Promise<OwnerAnalyticsSession[]> => {
  const where = ownerSessionWhere(ownerId, options);

  return await prisma.parkingSession.findMany({
    where,
    select: sessionSelect,
  });
};
