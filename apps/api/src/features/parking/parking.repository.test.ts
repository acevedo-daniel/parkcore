import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockPrisma, transactionClient } = vi.hoisted(() => {
  const tx = {
    parking: { findUnique: vi.fn(), update: vi.fn() },
    parkingSession: { count: vi.fn() },
  };
  return {
    transactionClient: tx,
    mockPrisma: { $transaction: vi.fn() },
  };
});

vi.mock('../../config/prisma.js', () => ({ prisma: mockPrisma }));

import { buildParking } from '../../../tests/helpers/builders.js';
import { updateWithCapacityCheck } from './parking.repository.js';

describe('parking repository capacity updates', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPrisma.$transaction.mockImplementation(
      (callback: (tx: typeof transactionClient) => unknown) =>
        Promise.resolve(callback(transactionClient)),
    );
  });

  it('blocks a capacity reduction below the current active count in one transaction', async () => {
    transactionClient.parking.findUnique.mockResolvedValue({ capacity: 5 });
    transactionClient.parkingSession.count.mockResolvedValue(4);

    await expect(updateWithCapacityCheck('parking-1', { capacity: 3 })).resolves.toEqual({
      activeCount: 4,
      kind: 'capacity-blocked',
    });
    expect(mockPrisma.$transaction).toHaveBeenCalledWith(expect.any(Function), {
      isolationLevel: 'Serializable',
    });
    expect(transactionClient.parking.update).not.toHaveBeenCalled();
  });

  it('updates capacity when it remains at or above the active count', async () => {
    const updated = buildParking({ capacity: 4 });
    transactionClient.parking.findUnique.mockResolvedValue({ capacity: 5 });
    transactionClient.parkingSession.count.mockResolvedValue(4);
    transactionClient.parking.update.mockResolvedValue(updated);

    await expect(updateWithCapacityCheck('parking-1', { capacity: 4 })).resolves.toEqual(updated);
    expect(transactionClient.parking.update).toHaveBeenCalledWith({
      where: { id: 'parking-1' },
      data: { capacity: 4 },
    });
  });
});
