import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('./booking.repository.js', () => ({
  createConfirmedIfAvailable: vi.fn(),
  findById: vi.fn(),
  completeIfConfirmed: vi.fn(),
  findActiveByParking: vi.fn(),
  findByParking: vi.fn(),
  cancelIfConfirmed: vi.fn(),
}));

vi.mock('../parking/parking.service.js', () => ({
  findById: vi.fn(),
}));

vi.mock('../vehicle/vehicle.service.js', () => ({
  findByPlate: vi.fn(),
  create: vi.fn(),
}));

import { Prisma, type BookingStatus } from '../../../prisma/generated/client.js';
import { buildBooking, buildParking, buildVehicle } from '../../../tests/helpers/builders.js';
import { ConflictError, ForbiddenError, NotFoundError } from '../../errors/index.js';
import type { BookingQuery, CheckIn } from './booking.schema.js';
import * as bookingRepository from './booking.repository.js';
import type { BookingWithRelations } from './booking.repository.js';
import {
  cancelBooking,
  checkIn,
  checkOut,
  getActiveBookingsByParking,
  getBookingById,
  getBookingsByParking,
} from './booking.service.js';
import * as parkingService from '../parking/parking.service.js';
import * as vehicleService from '../vehicle/vehicle.service.js';

const buildBookingWithRelations = (
  overrides?: Partial<
    BookingWithRelations & {
      parking: {
        id: string;
        title: string;
        hourlyRateCents: number;
        ownerId: string;
      };
    }
  >,
): BookingWithRelations => {
  const booking = buildBooking(overrides);
  const vehicle = buildVehicle({
    id: booking.vehicleId,
    parkingId: booking.parkingId,
    ...(overrides?.vehicle ?? {}),
  });

  return {
    ...booking,
    vehicle,
    parking: {
      id: booking.parkingId,
      title: 'Main Parking',
      hourlyRateCents: 200000,
      ownerId: 'owner-1',
      ...(overrides?.parking ?? {}),
    },
  };
};

const checkInDto: CheckIn = {
  plate: 'ABC123',
  type: 'CAR',
};

describe('booking.service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  describe('checkIn', () => {
    it('throws ForbiddenError when parking owner does not match', async () => {
      vi.mocked(parkingService.findById).mockResolvedValue(
        buildParking({
          ownerId: 'owner-2',
          isActive: true,
          capacity: 20,
        }),
      );

      await expect(checkIn('owner-1', 'parking-1', checkInDto)).rejects.toBeInstanceOf(
        ForbiddenError,
      );
      expect(vehicleService.findByPlate).not.toHaveBeenCalled();
      expect(bookingRepository.createConfirmedIfAvailable).not.toHaveBeenCalled();
    });

    it('throws ConflictError when parking is inactive', async () => {
      vi.mocked(parkingService.findById).mockResolvedValue(
        buildParking({
          ownerId: 'owner-1',
          isActive: false,
          capacity: 20,
        }),
      );

      await expect(checkIn('owner-1', 'parking-1', checkInDto)).rejects.toThrow(
        'Parking is inactive',
      );
      expect(vehicleService.findByPlate).not.toHaveBeenCalled();
    });

    it('creates vehicle when plate is not found and check-in succeeds', async () => {
      const createdVehicle = buildVehicle({ id: 'vehicle-2' });
      const createdBooking = buildBooking({ id: 'booking-2', vehicleId: createdVehicle.id });

      vi.mocked(parkingService.findById).mockResolvedValue(
        buildParking({
          ownerId: 'owner-1',
          isActive: true,
          capacity: 20,
        }),
      );
      vi.mocked(vehicleService.findByPlate).mockRejectedValue(
        new NotFoundError('Vehicle not found'),
      );
      vi.mocked(vehicleService.create).mockResolvedValue(createdVehicle);
      vi.mocked(bookingRepository.createConfirmedIfAvailable).mockResolvedValue(createdBooking);

      const result = await checkIn('owner-1', 'parking-1', checkInDto);

      expect(vehicleService.create).toHaveBeenCalledWith('owner-1', 'parking-1', {
        plate: checkInDto.plate,
        type: checkInDto.type,
        brand: checkInDto.brand,
        model: checkInDto.model,
        customerName: checkInDto.customerName,
        customerPhone: checkInDto.customerPhone,
        notes: checkInDto.notes,
      });
      expect(bookingRepository.createConfirmedIfAvailable).toHaveBeenCalledWith(
        'parking-1',
        createdVehicle.id,
        20,
      );
      expect(result).toEqual(createdBooking);
    });

    it('throws ConflictError when repository blocks check-in because parking is full', async () => {
      vi.mocked(parkingService.findById).mockResolvedValue(
        buildParking({
          ownerId: 'owner-1',
          isActive: true,
          capacity: 20,
        }),
      );
      vi.mocked(vehicleService.findByPlate).mockResolvedValue(buildVehicle());
      vi.mocked(bookingRepository.createConfirmedIfAvailable).mockResolvedValue('parking-full');

      await expect(checkIn('owner-1', 'parking-1', checkInDto)).rejects.toThrow('Parking is full');
    });

    it('throws ConflictError when booking already exists as active', async () => {
      vi.mocked(parkingService.findById).mockResolvedValue(
        buildParking({
          ownerId: 'owner-1',
          isActive: true,
          capacity: 20,
        }),
      );
      vi.mocked(vehicleService.findByPlate).mockResolvedValue(buildVehicle());
      vi.mocked(bookingRepository.createConfirmedIfAvailable).mockResolvedValue('vehicle-active');

      await expect(checkIn('owner-1', 'parking-1', checkInDto)).rejects.toThrow(
        'Vehicle is already in the parking',
      );
    });

    it('throws ConflictError when Prisma serialization conflict occurs (P2034)', async () => {
      const prismaP2034 = Object.assign(
        Object.create(Prisma.PrismaClientKnownRequestError.prototype),
        { code: 'P2034' },
      ) as Prisma.PrismaClientKnownRequestError;

      vi.mocked(parkingService.findById).mockResolvedValue(
        buildParking({
          ownerId: 'owner-1',
          isActive: true,
          capacity: 20,
        }),
      );
      vi.mocked(vehicleService.findByPlate).mockResolvedValue(buildVehicle());
      vi.mocked(bookingRepository.createConfirmedIfAvailable).mockRejectedValue(prismaP2034);

      await expect(checkIn('owner-1', 'parking-1', checkInDto)).rejects.toThrow(
        'Check-in conflict',
      );
    });
  });

  describe('checkOut', () => {
    it('calculates minimum 1 hour charge and completes booking', async () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-02-21T10:10:00.000Z'));

      const bookingId = 'booking-1';
      const activeBooking = buildBookingWithRelations({
        id: bookingId,
        startTime: new Date('2026-02-21T10:05:00.000Z'),
        parking: { id: 'parking-1', title: 'Main', ownerId: 'owner-1', hourlyRateCents: 300000 },
      });

      const completedBooking = buildBookingWithRelations({
        ...activeBooking,
        status: 'COMPLETED',
        endTime: new Date('2026-02-21T10:10:00.000Z'),
        totalPrice: 3000,
      });

      vi.mocked(bookingRepository.findById).mockResolvedValue(activeBooking);
      vi.mocked(bookingRepository.completeIfConfirmed).mockResolvedValue(completedBooking);

      const result = await checkOut('owner-1', bookingId);

      expect(bookingRepository.completeIfConfirmed).toHaveBeenCalledWith(
        bookingId,
        new Date('2026-02-21T10:10:00.000Z'),
        3000,
      );
      expect(result).toEqual({
        id: completedBooking.id,
        startTime: completedBooking.startTime,
        endTime: completedBooking.endTime,
        totalPrice: completedBooking.totalPrice,
        status: completedBooking.status,
        createdAt: completedBooking.createdAt,
        updatedAt: completedBooking.updatedAt,
        parkingId: completedBooking.parkingId,
        vehicleId: completedBooking.vehicleId,
      });
    });

    it('rounds up hours when stay exceeds one hour', async () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-02-21T12:01:00.000Z'));

      const bookingId = 'booking-2';
      const activeBooking = buildBookingWithRelations({
        id: bookingId,
        startTime: new Date('2026-02-21T10:00:00.000Z'),
        parking: { id: 'parking-1', title: 'Main', ownerId: 'owner-1', hourlyRateCents: 150000 },
      });

      vi.mocked(bookingRepository.findById).mockResolvedValue(activeBooking);
      vi.mocked(bookingRepository.completeIfConfirmed).mockResolvedValue(null);

      await expect(checkOut('owner-1', bookingId)).rejects.toThrow('This booking is not active');
      expect(bookingRepository.completeIfConfirmed).toHaveBeenCalledWith(
        bookingId,
        new Date('2026-02-21T12:01:00.000Z'),
        4500,
      );
    });

    it('throws ConflictError when booking is not active', async () => {
      const booking = buildBookingWithRelations({
        parking: { id: 'parking-1', title: 'Main', ownerId: 'owner-1', hourlyRateCents: 100000 },
      });

      vi.mocked(bookingRepository.findById).mockResolvedValue(booking);
      vi.mocked(bookingRepository.completeIfConfirmed).mockResolvedValue(null);

      await expect(checkOut('owner-1', booking.id)).rejects.toBeInstanceOf(ConflictError);
    });
  });

  describe('getActiveBookingsByParking', () => {
    it('throws ForbiddenError when owner does not match', async () => {
      vi.mocked(parkingService.findById).mockResolvedValue(
        buildParking({ ownerId: 'other-owner' }),
      );

      await expect(getActiveBookingsByParking('owner-1', 'parking-1')).rejects.toBeInstanceOf(
        ForbiddenError,
      );
    });

    it('returns active bookings for owner parking', async () => {
      const bookings = [buildBooking({ id: 'booking-10' }), buildBooking({ id: 'booking-11' })];

      vi.mocked(parkingService.findById).mockResolvedValue(buildParking({ ownerId: 'owner-1' }));
      vi.mocked(bookingRepository.findActiveByParking).mockResolvedValue(bookings);

      const result = await getActiveBookingsByParking('owner-1', 'parking-1');

      expect(bookingRepository.findActiveByParking).toHaveBeenCalledWith('parking-1');
      expect(result).toEqual(bookings);
    });
  });

  describe('getBookingsByParking', () => {
    it('throws ForbiddenError when owner does not match', async () => {
      const query: BookingQuery = { page: 1, limit: 10, status: 'CONFIRMED' };
      vi.mocked(parkingService.findById).mockResolvedValue(buildParking({ ownerId: 'owner-2' }));

      await expect(getBookingsByParking('owner-1', 'parking-1', query)).rejects.toBeInstanceOf(
        ForbiddenError,
      );
    });

    it('returns paginated bookings', async () => {
      const data = [buildBooking({ id: 'booking-20' }), buildBooking({ id: 'booking-21' })];
      const query: BookingQuery = { page: 2, limit: 2, status: 'COMPLETED' };

      vi.mocked(parkingService.findById).mockResolvedValue(buildParking({ ownerId: 'owner-1' }));
      vi.mocked(bookingRepository.findByParking).mockResolvedValue({
        data,
        total: 5,
      });

      const result = await getBookingsByParking('owner-1', 'parking-1', query);

      expect(bookingRepository.findByParking).toHaveBeenCalledWith('parking-1', {
        skip: 2,
        take: 2,
        status: 'COMPLETED',
      });
      expect(result.meta).toEqual({
        page: 2,
        limit: 2,
        total: 5,
        totalPages: 3,
        hasNextPage: true,
        hasPreviousPage: true,
      });
      expect(result.data).toEqual(data);
    });
  });

  describe('getBookingById', () => {
    it('throws NotFoundError when booking does not exist', async () => {
      vi.mocked(bookingRepository.findById).mockResolvedValue(null);

      await expect(getBookingById('owner-1', 'missing-booking')).rejects.toBeInstanceOf(
        NotFoundError,
      );
    });

    it('throws ForbiddenError when owner does not match', async () => {
      vi.mocked(bookingRepository.findById).mockResolvedValue(
        buildBookingWithRelations({
          parking: { id: 'parking-1', title: 'Main', ownerId: 'owner-2', hourlyRateCents: 100000 },
        }),
      );

      await expect(getBookingById('owner-1', 'booking-1')).rejects.toBeInstanceOf(ForbiddenError);
    });

    it('returns booking without relation fields', async () => {
      const booking = buildBookingWithRelations({
        id: 'booking-30',
        parking: { id: 'parking-1', title: 'Main', ownerId: 'owner-1', hourlyRateCents: 100000 },
      });

      vi.mocked(bookingRepository.findById).mockResolvedValue(booking);

      const result = await getBookingById('owner-1', booking.id);

      expect(result).toEqual({
        id: booking.id,
        startTime: booking.startTime,
        endTime: booking.endTime,
        totalPrice: booking.totalPrice,
        status: booking.status,
        createdAt: booking.createdAt,
        updatedAt: booking.updatedAt,
        parkingId: booking.parkingId,
        vehicleId: booking.vehicleId,
      });
    });
  });

  describe('cancelBooking', () => {
    it('throws NotFoundError when booking does not exist', async () => {
      vi.mocked(bookingRepository.findById).mockResolvedValue(null);

      await expect(cancelBooking('owner-1', 'missing-booking')).rejects.toBeInstanceOf(
        NotFoundError,
      );
    });

    it('throws ForbiddenError when owner does not match', async () => {
      vi.mocked(bookingRepository.findById).mockResolvedValue(
        buildBookingWithRelations({
          parking: { id: 'parking-1', title: 'Main', ownerId: 'owner-2', hourlyRateCents: 100000 },
        }),
      );

      await expect(cancelBooking('owner-1', 'booking-40')).rejects.toBeInstanceOf(ForbiddenError);
    });

    it('throws ConflictError when booking is not active', async () => {
      vi.mocked(bookingRepository.findById).mockResolvedValue(buildBookingWithRelations());
      vi.mocked(bookingRepository.cancelIfConfirmed).mockResolvedValue(null);

      await expect(cancelBooking('owner-1', 'booking-41')).rejects.toBeInstanceOf(ConflictError);
    });

    it('returns cancelled booking without relation fields', async () => {
      const cancelled = buildBookingWithRelations({
        id: 'booking-43',
        status: 'CANCELLED' as BookingStatus,
      });

      vi.mocked(bookingRepository.findById).mockResolvedValue(
        buildBookingWithRelations({ id: 'booking-43' }),
      );
      vi.mocked(bookingRepository.cancelIfConfirmed).mockResolvedValue(cancelled);

      const result = await cancelBooking('owner-1', 'booking-43');

      expect(result).toEqual({
        id: cancelled.id,
        startTime: cancelled.startTime,
        endTime: cancelled.endTime,
        totalPrice: cancelled.totalPrice,
        status: cancelled.status,
        createdAt: cancelled.createdAt,
        updatedAt: cancelled.updatedAt,
        parkingId: cancelled.parkingId,
        vehicleId: cancelled.vehicleId,
      });
    });
  });
});
