import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('./parking-session.repository.js', () => ({
  createActiveIfAvailable: vi.fn(),
  findById: vi.fn(),
  completeIfActive: vi.fn(),
  findActiveByParking: vi.fn(),
  findByParking: vi.fn(),
  cancelIfActive: vi.fn(),
  findForExport: vi.fn(),
}));
vi.mock('../parking/parking.service.js', () => ({ findById: vi.fn() }));
vi.mock('../vehicle/vehicle.service.js', () => ({ findOrCreateForAuthorizedParking: vi.fn() }));

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
import { toParkingSessionResponse } from './parking-session.schema.js';
import {
  cancelSession,
  checkIn,
  checkOut,
  getActiveSessionsByParking,
  getSessionById,
  getSessionsByParking,
  getParkingSessionsCsv,
} from './parking-session.service.js';

const checkInDto: CheckIn = {
  plate: 'ABC123',
  type: 'CAR',
  customerName: 'Jane Doe',
  customerPhone: '+1234567890',
  notes: 'Scratch on left door',
};

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
      const session = buildSessionWithRelations({
        id: 'session-2',
        vehicleId: vehicle.id,
        customerName: checkInDto.customerName,
        customerPhone: checkInDto.customerPhone,
        notes: checkInDto.notes,
      });
      vi.mocked(parkingService.findById).mockResolvedValue(buildParking());
      vi.mocked(vehicleService.findOrCreateForAuthorizedParking).mockResolvedValue(vehicle);
      vi.mocked(parkingSessionRepository.createActiveIfAvailable).mockResolvedValue(session);

      await expect(checkIn('owner-1', 'parking-1', checkInDto)).resolves.toMatchObject({
        id: session.id,
        vehicle: { id: vehicle.id },
        customerName: 'Jane Doe',
      });
      expect(vehicleService.findOrCreateForAuthorizedParking).toHaveBeenCalledWith('parking-1', {
        plate: 'ABC123',
        type: 'CAR',
      });
      expect(parkingSessionRepository.createActiveIfAvailable).toHaveBeenCalledWith(
        'parking-1',
        vehicle.id,
        20,
        200000,
        'USD',
        {
          customerName: 'Jane Doe',
          customerPhone: '+1234567890',
          notes: 'Scratch on left door',
        },
      );
    });

    it('rejects inactive parkings and parking capacity or active-vehicle conflicts', async () => {
      vi.mocked(parkingService.findById).mockResolvedValue(buildParking({ isActive: false }));
      await expect(checkIn('owner-1', 'parking-1', checkInDto)).rejects.toThrow(
        'Parking is inactive',
      );

      vi.mocked(parkingService.findById).mockResolvedValue(buildParking());
      vi.mocked(vehicleService.findOrCreateForAuthorizedParking).mockResolvedValue(buildVehicle());
      vi.mocked(parkingSessionRepository.createActiveIfAvailable).mockResolvedValue('parking-full');
      await expect(checkIn('owner-1', 'parking-1', checkInDto)).rejects.toThrow('Parking is full');

      vi.mocked(parkingSessionRepository.createActiveIfAvailable).mockResolvedValue(
        'vehicle-active',
      );
      await expect(checkIn('owner-1', 'parking-1', checkInDto)).rejects.toThrow(
        'Vehicle is already in the parking',
      );
    });

    it('rejects check-in while a scheduled parking is closed', async () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-09-11T07:00:00.000Z'));
      vi.mocked(parkingService.findById).mockResolvedValue(
        buildParking({
          is24Hours: false,
          opensAt: '08:00',
          closesAt: '18:00',
          timezone: 'America/Argentina/Buenos_Aires',
        }),
      );

      await expect(checkIn('owner-1', 'parking-1', checkInDto)).rejects.toThrow(
        'Parking is closed',
      );
      expect(vehicleService.findOrCreateForAuthorizedParking).not.toHaveBeenCalled();
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
      vi.mocked(vehicleService.findOrCreateForAuthorizedParking).mockResolvedValue(buildVehicle());
      vi.mocked(parkingSessionRepository.createActiveIfAvailable).mockRejectedValue(conflict);
      await expect(checkIn('owner-1', 'parking-1', checkInDto)).rejects.toThrow(
        'Check-in conflict',
      );

      vi.mocked(parkingSessionRepository.createActiveIfAvailable).mockRejectedValue({
        cause: { originalCode: '40001' },
      });
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
      const cancelledSession = buildSessionWithRelations({
        endTime: new Date('2026-02-21T10:00:00.000Z'),
        status: 'CANCELLED',
        totalAmountCents: null,
      });
      vi.mocked(parkingSessionRepository.findById).mockResolvedValue(activeSession);
      vi.mocked(parkingSessionRepository.cancelIfActive).mockResolvedValue(cancelledSession);

      await expect(cancelSession('owner-1', activeSession.id)).resolves.toMatchObject({
        status: 'CANCELLED',
        endTime: '2026-02-21T10:00:00.000Z',
        totalAmountCents: null,
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
    const sessions = [buildSessionWithRelations(), buildSessionWithRelations({ id: 'session-2' })];
    vi.mocked(parkingSessionRepository.findActiveByParking).mockResolvedValue(sessions);
    await expect(getActiveSessionsByParking('owner-1', 'parking-1')).resolves.toEqual(
      sessions.map(toParkingSessionResponse),
    );

    const query: ParkingSessionQuery = { page: 2, limit: 2, status: 'COMPLETED', period: '30d' };
    vi.mocked(parkingSessionRepository.findByParking).mockResolvedValue({
      data: sessions,
      total: 5,
      aggregateRows: [],
    });
    const result = await getSessionsByParking('owner-1', 'parking-1', query);
    const anyDate = expect.any(Date) as unknown as Date;
    expect(parkingSessionRepository.findByParking).toHaveBeenCalledWith('parking-1', {
      skip: 2,
      take: 2,
      status: 'COMPLETED' satisfies ParkingSessionStatus,
      startTimeFrom: anyDate,
      startTimeTo: anyDate,
    });
    expect(result.meta.totalPages).toBe(3);

    const filteredQuery: ParkingSessionQuery = {
      page: 1,
      limit: 10,
      status: 'COMPLETED',
      plate: 'AB123CD',
      period: '7d',
    };
    vi.mocked(parkingSessionRepository.findByParking).mockResolvedValue({
      data: [],
      total: 0,
      aggregateRows: [],
    });
    await getSessionsByParking('owner-1', 'parking-1', filteredQuery);
    expect(parkingSessionRepository.findByParking).toHaveBeenLastCalledWith('parking-1', {
      skip: 0,
      take: 10,
      status: 'COMPLETED',
      plate: 'AB123CD',
      startTimeFrom: anyDate,
      startTimeTo: anyDate,
    });

    vi.mocked(parkingSessionRepository.findActiveByParking).mockResolvedValue(sessions);
    await getActiveSessionsByParking('owner-1', 'parking-1', { plate: 'AB123CD' });
    expect(parkingSessionRepository.findActiveByParking).toHaveBeenLastCalledWith('parking-1', {
      plate: 'AB123CD',
    });
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

  it('exports the complete filtered history with local offsets and stable columns', async () => {
    vi.mocked(parkingService.findById).mockResolvedValue(
      buildParking({ timezone: 'America/Argentina/Buenos_Aires' }),
    );
    vi.mocked(parkingSessionRepository.findForExport).mockResolvedValue([
      {
        ...buildParkingSession({
          endTime: new Date('2026-02-21T11:30:00.000Z'),
          status: 'COMPLETED',
          totalAmountCents: 1500,
        }),
        vehicle: buildVehicle({ brand: 'ACME, "Fleet"' }),
      },
      {
        ...buildParkingSession({
          id: 'session-2',
          endTime: new Date('2026-02-21T12:00:00.000Z'),
          status: 'CANCELLED',
          totalAmountCents: 999,
        }),
        vehicle: buildVehicle({ brand: null }),
      },
    ]);

    const csv = await getParkingSessionsCsv('owner-1', 'parking-1', { period: '30d' });
    const [header, completedRow, cancelledRow] = csv.split('\r\n');

    expect(header).toBe(
      'plate,vehicleType,brand,model,startTime,endTime,durationMinutes,status,hourlyRate,currency,totalAmount,timezone',
    );
    expect(completedRow).toContain('"ACME, ""Fleet"""');
    expect(completedRow).toContain('2026-02-21T06:00:00.000-03:00');
    expect(completedRow).toContain('2026-02-21T08:30:00.000-03:00');
    expect(completedRow).toContain(',1500,USD,1500,America/Argentina/Buenos_Aires');
    expect(cancelledRow).toMatch(/,CANCELLED,1500,USD,,America\/Argentina\/Buenos_Aires$/);
    expect(header).not.toContain('customerName');
    expect(header).not.toContain('customerPhone');
  });
});
