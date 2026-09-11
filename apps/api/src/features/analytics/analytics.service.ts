import type { Currency } from '../../../prisma/generated/client.js';
import { getLocalDateKey, getLocalDateKeys, getLocalPeriodWindow } from '../../utils/timezone.js';
import * as analyticsRepository from './analytics.repository.js';
import type { AnalyticsFacility, AnalyticsQuery } from './analytics.schema.js';

interface CurrencyRevenue {
  currency: Currency;
  revenueCents: number;
}

const toCurrencyRevenue = (
  sessions: analyticsRepository.OwnerAnalyticsSession[],
): CurrencyRevenue[] => {
  const totals = new Map<Currency, number>();
  for (const session of sessions) {
    if (session.status !== 'COMPLETED' || session.totalAmountCents === null) continue;
    totals.set(session.currency, (totals.get(session.currency) ?? 0) + session.totalAmountCents);
  }
  return [...totals.entries()]
    .sort(([first], [second]) => first.localeCompare(second))
    .map(([currency, revenueCents]) => ({ currency, revenueCents }));
};

const roundPercent = (value: number): number => Math.round(value * 10) / 10;

const toFacilityAnalytics = (
  facility: analyticsRepository.OwnerFacility,
  activeVehicles: number,
  sessions: analyticsRepository.OwnerAnalyticsSession[],
): AnalyticsFacility => {
  const completed = sessions.filter((session) => session.status === 'COMPLETED');
  const revenueCents = completed.reduce((sum, session) => sum + (session.totalAmountCents ?? 0), 0);

  return {
    parkingId: facility.id,
    title: facility.title,
    isActive: facility.isActive,
    activeVehicles,
    capacity: facility.capacity,
    occupancyPercent:
      facility.capacity === 0 ? 0 : roundPercent((activeVehicles / facility.capacity) * 100),
    completedSessions: completed.length,
    revenueCents,
    currency: facility.currency,
  };
};

export const getSummary = async (ownerId: string, now = new Date()) => {
  const [facilities, activeSessions, timezone] = await Promise.all([
    analyticsRepository.findOwnerFacilities(ownerId),
    analyticsRepository.findOwnerSessions(ownerId, { status: 'ACTIVE' }),
    analyticsRepository.findOwnerTimezone(ownerId),
  ]);
  const today = getLocalPeriodWindow('today', timezone, now);
  const completedToday = await analyticsRepository.findOwnerSessions(ownerId, {
    status: 'COMPLETED',
    endTimeFrom: today.start,
    endTimeTo: today.end,
  });

  const facilityData = facilities.map((facility) =>
    toFacilityAnalytics(
      facility,
      activeSessions.filter((session) => session.parkingId === facility.id).length,
      completedToday.filter((session) => session.parkingId === facility.id),
    ),
  );
  const totalCapacity = facilities.reduce((sum, facility) => sum + facility.capacity, 0);
  const activeVehicles = activeSessions.length;

  return {
    activeVehicles,
    totalCapacity,
    occupancyPercent:
      totalCapacity === 0 ? 0 : roundPercent((activeVehicles / totalCapacity) * 100),
    completedToday: completedToday.length,
    revenueToday: toCurrencyRevenue(completedToday),
    facilities: facilityData,
  };
};

const getCompletedWindow = async (ownerId: string, days: number, now: Date) => {
  const timezone = await analyticsRepository.findOwnerTimezone(ownerId);
  const window = getLocalPeriodWindow(days === 7 ? '7d' : '30d', timezone, now);
  const sessions = await analyticsRepository.findOwnerSessions(ownerId, {
    status: 'COMPLETED',
    endTimeFrom: window.start,
    endTimeTo: window.end,
  });
  return { sessions, timezone };
};

export const getRevenue = async (ownerId: string, query: AnalyticsQuery, now = new Date()) => {
  const { sessions, timezone } = await getCompletedWindow(ownerId, query.days, now);
  const keys = getLocalDateKeys(query.days, timezone, now);
  const values = new Map(keys.map((date) => [date, [] as CurrencyRevenue[]]));
  for (const session of sessions) {
    if (!session.endTime || session.totalAmountCents === null) continue;
    const key = getLocalDateKey(session.endTime, timezone);
    const day = values.get(key);
    if (!day) continue;
    const existing = day.find((entry) => entry.currency === session.currency);
    if (existing) existing.revenueCents += session.totalAmountCents;
    else day.push({ currency: session.currency, revenueCents: session.totalAmountCents });
  }

  return {
    days: query.days,
    data: [...values].map(([date, revenueByCurrency]) => ({
      date,
      revenueByCurrency: revenueByCurrency.sort((first, second) =>
        first.currency.localeCompare(second.currency),
      ),
    })),
  };
};

export const getVolume = async (ownerId: string, query: AnalyticsQuery, now = new Date()) => {
  const { sessions, timezone } = await getCompletedWindow(ownerId, query.days, now);
  const values = new Map(getLocalDateKeys(query.days, timezone, now).map((date) => [date, 0]));
  for (const session of sessions) {
    if (!session.endTime) continue;
    const key = getLocalDateKey(session.endTime, timezone);
    if (values.has(key)) values.set(key, (values.get(key) ?? 0) + 1);
  }

  return {
    days: query.days,
    data: [...values].map(([date, completedSessions]) => ({ date, completedSessions })),
  };
};

export const getFacilities = async (ownerId: string, query: AnalyticsQuery, now = new Date()) => {
  const [facilities, activeSessions, completedWindow] = await Promise.all([
    analyticsRepository.findOwnerFacilities(ownerId),
    analyticsRepository.findOwnerSessions(ownerId, { status: 'ACTIVE' }),
    getCompletedWindow(ownerId, query.days, now),
  ]);
  const activeByParking = new Map<string, number>();
  for (const session of activeSessions) {
    activeByParking.set(session.parkingId, (activeByParking.get(session.parkingId) ?? 0) + 1);
  }
  return {
    days: query.days,
    data: facilities.map((facility) =>
      toFacilityAnalytics(
        facility,
        activeByParking.get(facility.id) ?? 0,
        completedWindow.sessions.filter((session) => session.parkingId === facility.id),
      ),
    ),
  };
};
