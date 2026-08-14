import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('./parking-session.repository.js', () => ({
  createActiveIfAvailable: vi.fn(),
  findById: vi.fn(),
  completeIfActive: vi.fn(),
  findActiveByParking: vi.fn(),
  findByParking: vi.fn(),
  cancelIfActive: vi.fn(),
}));
vi.mock('../parking/parking.service.js', () => ({ findById: vi.fn() }));
vi.mock('../vehicle/vehicle.service.js', () => ({ findOrCreateByPlate: vi.fn() }));

import { Prisma, type ParkingSessionStatus } from '../../../prisma/generated/client.js';
import {
  buildParking,
  buildParkingSession,
  buildVehicle,
} from '../../../tests/helpers/builders.js';
import { ConflictError, ForbiddenError, NotFoundError } from '../../errors/index.js';
import * as parkingService from '../parking/parking.service.js';
import * as vehicleService from '../vehicle/vehicle.service.js';
import * as parkingSessionRepository from './parking-session.repository.js';
import type { ParkingSessionWithRelations } from './parking-session.repository.js';
import type { CheckIn, ParkingSessionQuery } from './parking-session.schema.js';
import {
  cancelSession,
  checkIn,
  checkOut,
  getActiveSessionsByParking,
  getSessionById,
  getSessionsByParking,
} from './parking-session.service.js';

const checkInDto: CheckIn = { plate: 'ABC123', type: 'CAR' };

function buildSessionWithRelations(
  overrides?: Partial<
    ParkingSessionWithRelations & {
      parking: { id: string; title: string; ownerId: string };
    }
  >,
): ParkingSessionWithRelations {
  const session = buildParkingSession(overrides);
  return {
    ...session,
    vehicle: buildVehicle({
      id: session.vehicleId,
      parkingId: session.parkingId,
      ...(overrides?.vehicle ?? {}),
    }),
    parking: {
      id: session.parkingId,
      title: 'Main Parking',
      ownerId: 'owner-1',
      ...(overrides?.parking ?? {}),
    },
  };
}

describe('parking session service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  describe('checkIn', () => {
    it('creates an ACTIVE session when the vehicle is not known yet', async () => {
      const vehicle = buildVehicle({ id: 'vehicle-2' });
      const session = buildParkingSession({ id: 'session-2', vehicleId: vehicle.id });
      vi.mocked(parkingService.findById).mockResolvedValue(buildParking());
      vi.mocked(vehicleService.findOrCreateByPlate).mockResolvedValue(vehicle);
      vi.mocked(parkingSessionRepository.createActiveIfAvailable).mockResolvedValue(session);

      await expect(checkIn('owner-1', 'parking-1', checkInDto)).resolves.toEqual(session);
      expect(vehicleService.findOrCreateByPlate).toHaveBeenCalledWith(
        'owner-1',
        'parking-1',
        checkInDto,
      );
      expect(parkingSessionRepository.createActiveIfAvailable).toHaveBeenCalledWith(
        'parking-1',
        vehicle.id,
        20,
        200000,
        'USD',
      );
    });

    it('rejects inactive parkings and parking capacity or active-vehicle conflicts', async () => {
      vi.mocked(parkingService.findById).mockResolvedValue(buildParking({ isActive: false }));
      await expect(checkIn('owner-1', 'parking-1', checkInDto)).rejects.toThrow(
        'Parking is inactive',
      );

      vi.mocked(parkingService.findById).mockResolvedValue(buildParking());
      vi.mocked(vehicleService.findOrCreateByPlate).mockResolvedValue(buildVehicle());
      vi.mocked(parkingSessionRepository.createActiveIfAvailable).mockResolvedValue('parking-full');
      await expect(checkIn('owner-1', 'parking-1', checkInDto)).rejects.toThrow('Parking is full');

      vi.mocked(parkingSessionRepository.createActiveIfAvailable).mockResolvedValue(
        'vehicle-active',
      );
      await expect(checkIn('owner-1', 'parking-1', checkInDto)).rejects.toThrow(
        'Vehicle is already in the parking',
      );
    });

    it('rejects a non-owner and persistence conflicts', async () => {
      vi.mocked(parkingService.findById).mockResolvedValue(
        buildParking({ ownerId: 'other-owner' }),
      );
      await expect(checkIn('owner-1', 'parking-1', checkInDto)).rejects.toBeInstanceOf(
        ForbiddenError,
      );

      const conflict = Object.assign(
        Object.create(Prisma.PrismaClientKnownRequestError.prototype),
        {
          code: 'P2034',
        },
      ) as Prisma.PrismaClientKnownRequestError;
      vi.mocked(parkingService.findById).mockResolvedValue(buildParking());
      vi.mocked(vehicleService.findOrCreateByPlate).mockResolvedValue(buildVehicle());
      vi.mocked(parkingSessionRepository.createActiveIfAvailable).mockRejectedValue(conflict);
      await expect(checkIn('owner-1', 'parking-1', checkInDto)).rejects.toThrow(
        'Check-in conflict',
      );

      const duplicateActiveSession = Object.assign(
        Object.create(Prisma.PrismaClientKnownRequestError.prototype),
        { code: 'P2002' },
      ) as Prisma.PrismaClientKnownRequestError;
      vi.mocked(parkingSessionRepository.createActiveIfAvailable).mockRejectedValue(
        duplicateActiveSession,
      );
      await expect(checkIn('owner-1', 'parking-1', checkInDto)).rejects.toThrow(
        'Vehicle is already in the parking',
      );
    });
  });

  describe('terminal transitions', () => {
    it.each([
      ['less than one hour', '2026-02-21T10:05:00.000Z', 1500],
      ['exactly one hour', '2026-02-21T09:10:00.000Z', 1500],
      ['a partial additional hour', '2026-02-21T09:09:00.000Z', 3000],
    ])('charges %s from the session snapshot', async (_caseName, startTime, totalAmountCents) => {
      vi.useFakeTimers();
      const endTime = new Date('2026-02-21T10:10:00.000Z');
      vi.setSystemTime(endTime);
      const activeSession = buildSessionWithRelations({
        startTime: new Date(startTime),
        hourlyRateCents: 1500,
        currency: 'USD',
      });
      const completedSession = buildSessionWithRelations({
        ...activeSession,
        endTime,
        totalAmountCents,
        status: 'COMPLETED',
      });
      vi.mocked(parkingSessionRepository.findById).mockResolvedValue(activeSession);
      vi.mocked(parkingSessionRepository.completeIfActive).mockResolvedValue(completedSession);

      await expect(checkOut('owner-1', activeSession.id)).resolves.toMatchObject({
        id: activeSession.id,
        status: 'COMPLETED',
        hourlyRateCents: 1500,
        currency: 'USD',
        totalAmountCents,
      });
      expect(parkingSessionRepository.completeIfActive).toHaveBeenCalledWith(
        activeSession.id,
        endTime,
        totalAmountCents,
      );
    });

    it('uses the captured rate after the parking rate changes', async () => {
      vi.useFakeTimers();
      const endTime = new Date('2026-02-21T10:10:00.000Z');
      vi.setSystemTime(endTime);
      const activeSession = buildSessionWithRelations({
        startTime: new Date('2026-02-21T09:10:00.000Z'),
        hourlyRateCents: 1500,
        currency: 'USD',
      });
      vi.mocked(parkingSessionRepository.findById).mockResolvedValue(activeSession);
      vi.mocked(parkingSessionRepository.completeIfActive).mockResolvedValue(
        buildSessionWithRelations({
          ...activeSession,
          endTime,
          totalAmountCents: 1500,
          status: 'COMPLETED',
        }),
      );

      await checkOut('owner-1', activeSession.id);

      expect(parkingSessionRepository.completeIfActive).toHaveBeenCalledWith(
        activeSession.id,
        endTime,
        1500,
      );
      expect(parkingService.findById).not.toHaveBeenCalled();
    });

    it.each(['COMPLETED', 'CANCELLED'] as const)(
      'does not transition a terminal %s session through checkout',
      async (status) => {
        vi.mocked(parkingSessionRepository.findById).mockResolvedValue(
          buildSessionWithRelations({ status }),
        );
        vi.mocked(parkingSessionRepository.completeIfActive).mockResolvedValue(null);

        await expect(checkOut('owner-1', 'session-1')).rejects.toBeInstanceOf(ConflictError);
      },
    );

    it('cancels only an ACTIVE session', async () => {
      const activeSession = buildSessionWithRelations();
      const cancelledSession = buildSessionWithRelations({ status: 'CANCELLED' });
      vi.mocked(parkingSessionRepository.findById).mockResolvedValue(activeSession);
      vi.mocked(parkingSessionRepository.cancelIfActive).mockResolvedValue(cancelledSession);

      await expect(cancelSession('owner-1', activeSession.id)).resolves.toMatchObject({
        status: 'CANCELLED',
      });
      expect(parkingSessionRepository.cancelIfActive).toHaveBeenCalledWith(activeSession.id);
    });

    it.each(['COMPLETED', 'CANCELLED'] as const)(
      'does not cancel a terminal %s session',
      async (status) => {
        vi.mocked(parkingSessionRepository.findById).mockResolvedValue(
          buildSessionWithRelations({ status }),
        );
        vi.mocked(parkingSessionRepository.cancelIfActive).mockResolvedValue(null);

        await expect(cancelSession('owner-1', 'session-1')).rejects.toBeInstanceOf(ConflictError);
      },
    );
  });

  it('lists only ACTIVE sessions for an owner parking and paginates allowed statuses', async () => {
    vi.mocked(parkingService.findById).mockResolvedValue(buildParking());
    const sessions = [buildParkingSession(), buildParkingSession({ id: 'session-2' })];
    vi.mocked(parkingSessionRepository.findActiveByParking).mockResolvedValue(sessions);
    await expect(getActiveSessionsByParking('owner-1', 'parking-1')).resolves.toEqual(sessions);

    const query: ParkingSessionQuery = { page: 2, limit: 2, status: 'COMPLETED' };
    vi.mocked(parkingSessionRepository.findByParking).mockResolvedValue({
      data: sessions,
      total: 5,
    });
    const result = await getSessionsByParking('owner-1', 'parking-1', query);
    expect(parkingSessionRepository.findByParking).toHaveBeenCalledWith('parking-1', {
      skip: 2,
      take: 2,
      status: 'COMPLETED' satisfies ParkingSessionStatus,
    });
    expect(result.meta.totalPages).toBe(3);
  });

  it('rejects missing or foreign sessions', async () => {
    vi.mocked(parkingSessionRepository.findById).mockResolvedValue(null);
    await expect(getSessionById('owner-1', 'missing')).rejects.toBeInstanceOf(NotFoundError);

    vi.mocked(parkingSessionRepository.findById).mockResolvedValue(
      buildSessionWithRelations({
        parking: { id: 'parking-1', title: 'Main', ownerId: 'other-owner' },
      }),
    );
    await expect(getSessionById('owner-1', 'session-1')).rejects.toBeInstanceOf(ForbiddenError);
  });
});
