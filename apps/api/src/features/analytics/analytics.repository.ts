import type { Prisma, ParkingSessionStatus } from '../../../prisma/generated/client.js';
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
} as const satisfies Prisma.ParkingSessionSelect;

export type OwnerFacility = Prisma.ParkingGetPayload<{ select: typeof facilitySelect }>;
export type OwnerAnalyticsSession = Prisma.ParkingSessionGetPayload<{
  select: typeof sessionSelect;
}>;

export const findOwnerFacilities = async (ownerId: string): Promise<OwnerFacility[]> => {
  return await prisma.parking.findMany({
    where: { ownerId },
    orderBy: { title: 'asc' },
    select: facilitySelect,
  });
};

export const findOwnerSessions = async (
  ownerId: string,
  options: { status?: ParkingSessionStatus; endTimeFrom?: Date },
): Promise<OwnerAnalyticsSession[]> => {
  const where: Prisma.ParkingSessionWhereInput = {
    parking: { ownerId },
    ...(options.status ? { status: options.status } : {}),
    ...(options.endTimeFrom ? { endTime: { gte: options.endTimeFrom } } : {}),
  };

  return await prisma.parkingSession.findMany({
    where,
    select: sessionSelect,
  });
};
