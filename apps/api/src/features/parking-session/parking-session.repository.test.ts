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

import { buildParkingSession, buildVehicle } from '../../../tests/helpers/builders.js';
import {
  cancelIfActive,
  completeIfActive,
  createActiveIfAvailable,
  findByParking,
} from './parking-session.repository.js';

const transactionClient = {
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
    mockTransaction.mockImplementation(
      async (callback: (tx: typeof transactionClient) => unknown) => {
        return await callback(transactionClient);
      },
    );
  });

  it('keeps capacity and active-vehicle checks in one serializable transaction', async () => {
    const session = buildSessionWithVehicle();
    transactionClient.parkingSession.count.mockResolvedValue(0);
    transactionClient.parkingSession.findFirst.mockResolvedValue(null);
    transactionClient.parkingSession.create.mockResolvedValue(session);

    await expect(
      createActiveIfAvailable('parking-1', 'vehicle-1', 20, 1500, 'USD', visitData),
    ).resolves.toEqual(session);

    expect(mockTransaction).toHaveBeenCalledWith(expect.any(Function), {
      isolationLevel: 'Serializable',
    });
    expect(transactionClient.parkingSession.count).toHaveBeenCalledWith({
      where: { parkingId: 'parking-1', status: 'ACTIVE' },
    });
    expect(transactionClient.parkingSession.findFirst).toHaveBeenCalledWith({
      where: { parkingId: 'parking-1', vehicleId: 'vehicle-1', status: 'ACTIVE' },
    });
  });

  it('does not create a session when capacity or an active vehicle blocks check-in', async () => {
    transactionClient.parkingSession.count.mockResolvedValue(20);
    await expect(
      createActiveIfAvailable('parking-1', 'vehicle-1', 20, 1500, 'USD', visitData),
    ).resolves.toBe('parking-full');

    transactionClient.parkingSession.count.mockResolvedValue(0);
    transactionClient.parkingSession.findFirst.mockResolvedValue(buildParkingSession());
    await expect(
      createActiveIfAvailable('parking-1', 'vehicle-1', 20, 1500, 'USD', visitData),
    ).resolves.toBe('vehicle-active');
    expect(transactionClient.parkingSession.create).not.toHaveBeenCalled();
  });

  it.each([0, 19])(
    'accepts check-in while active count is below capacity (active count: %s)',
    async (activeCount) => {
      const session = buildSessionWithVehicle();
      transactionClient.parkingSession.count.mockResolvedValue(activeCount);
      transactionClient.parkingSession.findFirst.mockResolvedValue(null);
      transactionClient.parkingSession.create.mockResolvedValue(session);

      await expect(
        createActiveIfAvailable('parking-1', 'vehicle-1', 20, 1500, 'USD', visitData),
      ).resolves.toEqual(session);

      expect(transactionClient.parkingSession.create).toHaveBeenCalledTimes(1);
    },
  );

  it('filters historical sessions by normalized plate and start date range', async () => {
    mockPrisma.parkingSession.findMany.mockResolvedValue([]);
    mockPrisma.parkingSession.count.mockResolvedValue(0);

    await expect(
      findByParking('parking-1', {
        skip: 0,
        take: 10,
        plate: 'AB123CD',
        dateFrom: '2026-02-01',
        dateTo: '2026-02-28',
      }),
    ).resolves.toEqual({ data: [], total: 0 });

    const expectedWhere = {
      parkingId: 'parking-1',
      vehicle: { plate: { contains: 'AB123CD' } },
      startTime: {
        gte: new Date('2026-02-01'),
        lte: new Date('2026-02-28T23:59:59.999Z'),
      },
    };
    expect(mockPrisma.parkingSession.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expectedWhere, skip: 0, take: 10 }),
    );
    expect(mockPrisma.parkingSession.count).toHaveBeenCalledWith({ where: expectedWhere });
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
