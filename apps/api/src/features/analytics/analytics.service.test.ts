import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('./analytics.repository.js', () => ({
  findOwnerFacilities: vi.fn(),
  findOwnerSessions: vi.fn(),
  findOwnerTimezone: vi.fn(),
}));

import * as analyticsRepository from './analytics.repository.js';
import { getFacilities, getRevenue, getSummary, getVolume } from './analytics.service.js';

const now = new Date('2026-01-15T12:00:00.000Z');
const facilities = [
  {
    id: '00000000-0000-4000-8000-000000000001',
    title: 'Central Parking',
    isActive: true,
    capacity: 10,
    hourlyRateCents: 1200,
    currency: 'USD' as const,
  },
  {
    id: '00000000-0000-4000-8000-000000000002',
    title: 'Harbor Garage',
    isActive: false,
    capacity: 5,
    hourlyRateCents: 1800,
    currency: 'USD' as const,
  },
];

const session = (overrides: Record<string, unknown> = {}) => ({
  parkingId: facilities[0].id,
  status: 'COMPLETED' as const,
  endTime: new Date('2026-01-15T09:00:00.000Z'),
  currency: 'USD' as const,
  totalAmountCents: 2400,
  ...overrides,
});

describe('analytics service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(analyticsRepository.findOwnerTimezone).mockResolvedValue(
      'America/Argentina/Buenos_Aires',
    );
  });

  it('builds an owner summary from active and completed sessions', async () => {
    vi.mocked(analyticsRepository.findOwnerFacilities).mockResolvedValue(facilities);
    vi.mocked(analyticsRepository.findOwnerSessions)
      .mockResolvedValueOnce([
        session({ status: 'ACTIVE', endTime: null, totalAmountCents: null }),
        session({ status: 'ACTIVE', endTime: null, totalAmountCents: null }),
      ])
      .mockResolvedValueOnce([session()]);

    await expect(getSummary('owner-1', now)).resolves.toMatchObject({
      activeVehicles: 2,
      totalCapacity: 15,
      occupancyPercent: 13.3,
      completedToday: 1,
      revenueToday: [{ currency: 'USD', revenueCents: 2400 }],
      facilities: [
        {
          parkingId: facilities[0].id,
          activeVehicles: 2,
          completedSessions: 1,
          revenueCents: 2400,
        },
        { parkingId: facilities[1].id, activeVehicles: 0, completedSessions: 0, revenueCents: 0 },
      ],
    });
  });

  it('returns a zero-filled revenue and volume series for the requested window', async () => {
    vi.mocked(analyticsRepository.findOwnerSessions).mockResolvedValue([
      session({ endTime: new Date('2026-01-14T09:00:00.000Z') }),
      session({ endTime: new Date('2026-01-16T09:00:00.000Z') }),
    ]);

    const revenue = await getRevenue('owner-1', { days: 7 }, now);
    const volume = await getVolume('owner-1', { days: 7 }, now);

    expect(revenue).toMatchObject({ days: 7 });
    expect(revenue.data).toHaveLength(7);
    expect(revenue.data.find((point) => point.date === '2026-01-14')?.revenueByCurrency).toEqual([
      { currency: 'USD', revenueCents: 2400 },
    ]);
    expect(volume.data).toHaveLength(7);
    expect(volume.data.find((point) => point.date === '2026-01-14')?.completedSessions).toBe(1);
    expect(analyticsRepository.findOwnerSessions).toHaveBeenCalledWith(
      'owner-1',
      expect.objectContaining({
        status: 'COMPLETED',
        endTimeFrom: new Date('2026-01-09T03:00:00.000Z'),
        endTimeTo: now,
      }),
    );
  });

  it('groups selected-window facility metrics while preserving active occupancy', async () => {
    vi.mocked(analyticsRepository.findOwnerFacilities).mockResolvedValue(facilities);
    vi.mocked(analyticsRepository.findOwnerSessions)
      .mockResolvedValueOnce([session({ status: 'ACTIVE', endTime: null, totalAmountCents: null })])
      .mockResolvedValueOnce([
        session(),
        session({ parkingId: facilities[1].id, totalAmountCents: 1800 }),
      ]);

    await expect(getFacilities('owner-1', { days: 30 }, now)).resolves.toMatchObject({
      days: 30,
      data: [
        {
          parkingId: facilities[0].id,
          activeVehicles: 1,
          completedSessions: 1,
          revenueCents: 2400,
        },
        {
          parkingId: facilities[1].id,
          activeVehicles: 0,
          completedSessions: 1,
          revenueCents: 1800,
        },
      ],
    });
  });

  it('keeps revenue totals separate when facilities use different currencies', async () => {
    vi.mocked(analyticsRepository.findOwnerSessions).mockResolvedValue([
      session({ currency: 'USD', totalAmountCents: 2400 }),
      session({ currency: 'ARS', totalAmountCents: 180000 }),
    ]);

    const revenue = await getRevenue('owner-1', { days: 7 }, now);
    expect(revenue.data.find((point) => point.date === '2026-01-15')?.revenueByCurrency).toEqual([
      { currency: 'ARS', revenueCents: 180000 },
      { currency: 'USD', revenueCents: 2400 },
    ]);
  });

  it('uses the owner timezone for network day boundaries', async () => {
    vi.mocked(analyticsRepository.findOwnerTimezone).mockResolvedValue('America/New_York');
    vi.mocked(analyticsRepository.findOwnerSessions).mockResolvedValue([
      session({ endTime: new Date('2026-01-15T05:00:00.000Z') }),
    ]);

    const revenue = await getRevenue('owner-1', { days: 7 }, new Date('2026-01-15T05:00:00.000Z'));
    expect(revenue.data.at(-1)).toMatchObject({
      date: '2026-01-15',
      revenueByCurrency: [{ currency: 'USD', revenueCents: 2400 }],
    });
    expect(analyticsRepository.findOwnerSessions).toHaveBeenLastCalledWith('owner-1', {
      status: 'COMPLETED',
      endTimeFrom: new Date('2026-01-09T05:00:00.000Z'),
      endTimeTo: new Date('2026-01-15T05:00:00.000Z'),
    });
  });
});
