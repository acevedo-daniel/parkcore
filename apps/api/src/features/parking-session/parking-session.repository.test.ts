import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockPrisma, mockTransaction } = vi.hoisted(() => {
  const mockTransaction = vi.fn();
  return {
    mockTransaction,
    mockPrisma: {
      $transaction: mockTransaction,
      parkingSession: {
        findMany: vi.fn(),
        count: vi.fn(),
      },
    },
  };
});

vi.mock('../../config/prisma.js', () => ({ prisma: mockPrisma }));

import {
  buildParking,
  buildParkingSession,
  buildVehicle,
} from '../../../tests/helpers/builders.js';
import {
  cancelIfActive,
  completeIfActive,
  createActiveIfAvailable,
  findActiveByParking,
  findByParking,
} from './parking-session.repository.js';

const transactionClient = {
  parking: {
    findUnique: vi.fn(),
  },
  vehicle: {
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
  parkingSession: {
    count: vi.fn(),
    findFirst: vi.fn(),
    create: vi.fn(),
    updateMany: vi.fn(),
    findUniqueOrThrow: vi.fn(),
  },
};

const buildSessionWithVehicle = () => {
  const session = buildParkingSession();
  return {
    ...session,
    vehicle: buildVehicle({ id: session.vehicleId, parkingId: session.parkingId }),
  };
};

const visitData = {
  customerName: 'Jane Doe',
  customerPhone: '+1234567890',
  notes: 'Scratch on left door',
};

describe('parking session repository', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    transactionClient.parking.findUnique.mockResolvedValue(buildParking());
    transactionClient.vehicle.findUnique.mockResolvedValue(null);
    mockTransaction.mockImplementation(
      async (callback: (tx: typeof transactionClient) => unknown) => {
        return await callback(transactionClient);
      },
    );
  });

  it('keeps parking eligibility, vehicle identity, and session creation in one serializable transaction', async () => {
    const session = buildSessionWithVehicle();
    transactionClient.parkingSession.count.mockResolvedValue(0);
    transactionClient.parkingSession.findFirst.mockResolvedValue(null);
    transactionClient.vehicle.create.mockResolvedValue({ id: 'vehicle-1' });
    transactionClient.parkingSession.create.mockResolvedValue(session);

    await expect(
      createActiveIfAvailable('owner-1', 'parking-1', { plate: 'AB123CD', type: 'CAR' }, visitData),
    ).resolves.toEqual(session);

    expect(mockTransaction).toHaveBeenCalledWith(expect.any(Function), {
      isolationLevel: 'Serializable',
    });
    expect(transactionClient.parking.findUnique).toHaveBeenCalledWith({
      where: { id: 'parking-1' },
      select: {
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
      },
    });
    expect(transactionClient.vehicle.findUnique).toHaveBeenCalledWith({
      where: { plate_parkingId: { plate: 'AB123CD', parkingId: 'parking-1' } },
      select: { id: true },
    });
    expect(transactionClient.parkingSession.count).toHaveBeenCalledWith({
      where: { parkingId: 'parking-1', status: 'ACTIVE' },
    });
    expect(transactionClient.vehicle.create).toHaveBeenCalledWith({
      data: { parkingId: 'parking-1', plate: 'AB123CD', type: 'CAR' },
      select: { id: true },
    });
  });

  it('does not create a session when capacity or an active vehicle blocks check-in', async () => {
    transactionClient.parkingSession.count.mockResolvedValue(20);
    await expect(
      createActiveIfAvailable('owner-1', 'parking-1', { plate: 'AB123CD' }, visitData),
    ).resolves.toEqual({ kind: 'parking-full' });

    transactionClient.parkingSession.count.mockResolvedValue(0);
    transactionClient.vehicle.findUnique.mockResolvedValue({ id: 'vehicle-1' });
    transactionClient.parkingSession.findFirst.mockResolvedValue({ id: 'session-1' });
    await expect(
      createActiveIfAvailable('owner-1', 'parking-1', { plate: 'AB123CD' }, visitData),
    ).resolves.toEqual({ kind: 'vehicle-active' });
    expect(transactionClient.parkingSession.create).not.toHaveBeenCalled();
    expect(transactionClient.vehicle.create).not.toHaveBeenCalled();
  });

  it.each([0, 19])(
    'accepts check-in while active count is below capacity (active count: %s)',
    async (activeCount) => {
      const session = buildSessionWithVehicle();
      transactionClient.parkingSession.count.mockResolvedValue(activeCount);
      transactionClient.parkingSession.findFirst.mockResolvedValue(null);
      transactionClient.vehicle.create.mockResolvedValue({ id: 'vehicle-1' });
      transactionClient.parkingSession.create.mockResolvedValue(session);

      await expect(
        createActiveIfAvailable('owner-1', 'parking-1', { plate: 'AB123CD' }, visitData),
      ).resolves.toEqual(session);

      expect(transactionClient.parkingSession.create).toHaveBeenCalledTimes(1);
    },
  );

  it('updates only supplied stable metadata and snapshots the current parking price', async () => {
    const session = buildSessionWithVehicle();
    transactionClient.parking.findUnique.mockResolvedValue(
      buildParking({ hourlyRateCents: 2750, currency: 'ARS' }),
    );
    transactionClient.vehicle.findUnique.mockResolvedValue({ id: 'vehicle-1' });
    transactionClient.parkingSession.findFirst.mockResolvedValue(null);
    transactionClient.parkingSession.count.mockResolvedValue(0);
    transactionClient.vehicle.update.mockResolvedValue({ id: 'vehicle-1' });
    transactionClient.parkingSession.create.mockResolvedValue(session);

    await expect(
      createActiveIfAvailable(
        'owner-1',
        'parking-1',
        { plate: 'AB123CD', brand: 'Honda' },
        visitData,
      ),
    ).resolves.toEqual(session);

    expect(transactionClient.vehicle.update).toHaveBeenCalledWith({
      where: { id: 'vehicle-1' },
      data: { brand: 'Honda' },
      select: { id: true },
    });
    const createCall = transactionClient.parkingSession.create.mock.calls[0]?.[0] as {
      data: { hourlyRateCents: number; currency: string };
    };
    expect(createCall.data).toMatchObject({ hourlyRateCents: 2750, currency: 'ARS' });
  });

  it('returns duplicate-active before capacity and preserves the existing vehicle', async () => {
    transactionClient.parking.findUnique.mockResolvedValue(buildParking({ capacity: 1 }));
    transactionClient.vehicle.findUnique.mockResolvedValue({ id: 'vehicle-1' });
    transactionClient.parkingSession.findFirst.mockResolvedValue({ id: 'session-1' });
    transactionClient.parkingSession.count.mockResolvedValue(1);

    await expect(
      createActiveIfAvailable(
        'owner-1',
        'parking-1',
        { plate: 'AB123CD', brand: 'Changed' },
        visitData,
      ),
    ).resolves.toEqual({ kind: 'vehicle-active' });

    expect(transactionClient.parkingSession.count).not.toHaveBeenCalled();
    expect(transactionClient.vehicle.update).not.toHaveBeenCalled();
  });

  it('rejects inactive or closed parking before mutating vehicle identity', async () => {
    transactionClient.parking.findUnique.mockResolvedValue(buildParking({ isActive: false }));
    await expect(
      createActiveIfAvailable(
        'owner-1',
        'parking-1',
        { plate: 'AB123CD', brand: 'Honda' },
        visitData,
      ),
    ).resolves.toEqual({ kind: 'parking-inactive' });

    transactionClient.parking.findUnique.mockResolvedValue(
      buildParking({
        is24Hours: false,
        opensAt: '08:00',
        closesAt: '18:00',
        timezone: 'America/Argentina/Buenos_Aires',
      }),
    );
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-09-11T07:00:00.000Z'));
    await expect(
      createActiveIfAvailable(
        'owner-1',
        'parking-1',
        { plate: 'AB123CD', brand: 'Honda' },
        visitData,
      ),
    ).resolves.toEqual({
      kind: 'parking-closed',
      nextOpeningAt: new Date('2026-09-11T11:00:00.000Z'),
    });
    vi.useRealTimers();

    expect(transactionClient.vehicle.findUnique).not.toHaveBeenCalled();
    expect(transactionClient.vehicle.create).not.toHaveBeenCalled();
    expect(transactionClient.vehicle.update).not.toHaveBeenCalled();
  });

  it('filters historical sessions by normalized plate and parking-local period range', async () => {
    mockPrisma.parkingSession.findMany.mockResolvedValue([]);
    mockPrisma.parkingSession.count.mockResolvedValue(0);

    await expect(
      findByParking('parking-1', {
        skip: 0,
        take: 10,
        plate: 'AB123CD',
        startTimeFrom: new Date('2026-02-01T03:00:00.000Z'),
        startTimeTo: new Date('2026-02-28T02:59:59.999Z'),
      }),
    ).resolves.toEqual({ data: [], total: 0, aggregateRows: [] });

    const expectedWhere = {
      parkingId: 'parking-1',
      vehicle: { plate: { contains: 'AB123CD' } },
      startTime: {
        gte: new Date('2026-02-01T03:00:00.000Z'),
        lte: new Date('2026-02-28T02:59:59.999Z'),
      },
    };
    expect(mockPrisma.parkingSession.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expectedWhere, skip: 0, take: 10 }),
    );
    expect(mockPrisma.parkingSession.count).toHaveBeenCalledWith({ where: expectedWhere });
  });

  it('lists active sessions oldest first with a deterministic tie-breaker', async () => {
    const sessions = [buildSessionWithVehicle()];
    mockPrisma.parkingSession.findMany.mockResolvedValue(sessions);

    await expect(findActiveByParking('parking-1')).resolves.toEqual(sessions);
    const findManyCall = mockPrisma.parkingSession.findMany.mock.calls[0]?.[0] as {
      where: { parkingId: string; status: string };
      orderBy: { startTime: string }[];
    };
    expect(findManyCall).toMatchObject({
      where: { parkingId: 'parking-1', status: 'ACTIVE' },
      orderBy: [{ startTime: 'asc' }, { id: 'asc' }],
    });
  });

  it('completes with one conditional ACTIVE transition', async () => {
    const endTime = new Date('2026-02-21T10:00:00.000Z');
    const completedSession = {
      ...buildParkingSession({
        endTime,
        totalAmountCents: 1500,
        status: 'COMPLETED',
      }),
      vehicle: buildVehicle(),
    };
    transactionClient.parkingSession.updateMany.mockResolvedValue({ count: 1 });
    transactionClient.parkingSession.findUniqueOrThrow.mockResolvedValue(completedSession);

    await expect(completeIfActive('session-1', endTime, 1500)).resolves.toEqual(completedSession);
    expect(transactionClient.parkingSession.updateMany).toHaveBeenCalledWith({
      where: { id: 'session-1', status: 'ACTIVE' },
      data: {
        endTime: completedSession.endTime,
        totalAmountCents: 1500,
        status: 'COMPLETED',
      },
    });
  });

  it('does not transition a session when it is no longer ACTIVE', async () => {
    transactionClient.parkingSession.updateMany.mockResolvedValue({ count: 0 });

    await expect(completeIfActive('session-1', new Date(), 1500)).resolves.toBeNull();
    await expect(cancelIfActive('session-1')).resolves.toBeNull();
    expect(transactionClient.parkingSession.findUniqueOrThrow).not.toHaveBeenCalled();
  });

  it('cancels with one conditional ACTIVE transition and records the terminal time', async () => {
    vi.useFakeTimers();
    const endTime = new Date('2026-02-21T10:00:00.000Z');
    vi.setSystemTime(endTime);
    const cancelledSession = {
      ...buildParkingSession({ endTime, status: 'CANCELLED', totalAmountCents: null }),
      vehicle: buildVehicle(),
    };
    transactionClient.parkingSession.updateMany.mockResolvedValue({ count: 1 });
    transactionClient.parkingSession.findUniqueOrThrow.mockResolvedValue(cancelledSession);

    await expect(cancelIfActive('session-1')).resolves.toEqual(cancelledSession);
    expect(cancelledSession.totalAmountCents).toBeNull();
    expect(transactionClient.parkingSession.updateMany).toHaveBeenCalledWith({
      where: { id: 'session-1', status: 'ACTIVE' },
      data: { endTime, status: 'CANCELLED', totalAmountCents: null },
    });
    vi.useRealTimers();
  });
});
