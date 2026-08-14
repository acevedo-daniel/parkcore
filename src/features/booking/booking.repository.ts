import {
  Booking,
  Parking,
  Prisma,
  Vehicle,
  type BookingStatus,
} from '../../../prisma/generated/client.js';
import { prisma } from '../../config/prisma.js';

export type BookingWithRelations = Booking & {
  vehicle: Vehicle;
  parking: Pick<Parking, 'id' | 'title' | 'hourlyRateCents' | 'ownerId'>;
};

export type CheckInBlockedReason = 'parking-full' | 'vehicle-active';

export const findById = async (id: string): Promise<BookingWithRelations | null> => {
  return await prisma.booking.findUnique({
    where: { id },
    include: {
      vehicle: true,
      parking: {
        select: { id: true, title: true, hourlyRateCents: true, ownerId: true },
      },
    },
  });
};

export const findActiveByParking = async (parkingId: string): Promise<Booking[]> => {
  return await prisma.booking.findMany({
    where: {
      parkingId,
      status: 'CONFIRMED',
    },
    orderBy: { startTime: 'desc' },
  });
};

export const findByParking = async (
  parkingId: string,
  options: {
    skip: number;
    take: number;
    status?: BookingStatus;
  },
): Promise<{ data: Booking[]; total: number }> => {
  const where: Prisma.BookingWhereInput = {
    parkingId,
    ...(options.status ? { status: options.status } : {}),
  };
  const [data, total] = await Promise.all([
    prisma.booking.findMany({
      where,
      skip: options.skip,
      take: options.take,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.booking.count({ where }),
  ]);
  return { data, total };
};

export const createConfirmedIfAvailable = async (
  parkingId: string,
  vehicleId: string,
  capacity: number,
): Promise<Booking | CheckInBlockedReason> => {
  return await prisma.$transaction(
    async (tx) => {
      const activeCount = await tx.booking.count({
        where: {
          parkingId,
          status: 'CONFIRMED',
        },
      });

      if (activeCount >= capacity) {
        return 'parking-full';
      }

      const activeBooking = await tx.booking.findFirst({
        where: {
          vehicleId,
          status: 'CONFIRMED',
        },
      });

      if (activeBooking) {
        return 'vehicle-active';
      }

      return await tx.booking.create({
        data: {
          startTime: new Date(),
          status: 'CONFIRMED',
          parking: { connect: { id: parkingId } },
          vehicle: { connect: { id: vehicleId } },
        },
      });
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
  );
};

export const completeIfConfirmed = async (
  id: string,
  endTime: Date,
  totalPrice: number,
): Promise<Booking | null> => {
  return await prisma.$transaction(async (tx) => {
    const activeBooking = await tx.booking.findFirst({
      where: { id, status: 'CONFIRMED' },
    });

    if (!activeBooking) return null;
    return await tx.booking.update({
      where: { id },
      data: { endTime, totalPrice, status: 'COMPLETED' },
    });
  });
};

export const cancelIfConfirmed = async (id: string): Promise<Booking | null> => {
  return await prisma.$transaction(async (tx) => {
    const activeBooking = await tx.booking.findFirst({
      where: { id, status: 'CONFIRMED' },
    });

    if (!activeBooking) return null;
    return await tx.booking.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });
  });
};
