import { supportedCurrencies } from '../../utils/currency.js';
import * as analyticsRepository from './analytics.repository.js';
import type { AnalyticsFacility, AnalyticsQuery } from './analytics.schema.js';

const DAY_MS = 86_400_000;

const startOfUtcDay = (value: Date): Date =>
  new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()));

const roundPercent = (value: number): number => Math.round(value * 10) / 10;

const dateKey = (value: Date): string => value.toISOString().slice(0, 10);

const buildDateKeys = (days: number, now: Date): string[] => {
  const firstDay = startOfUtcDay(now).getTime() - (days - 1) * DAY_MS;
  return Array.from({ length: days }, (_, index) => dateKey(new Date(firstDay + index * DAY_MS)));
};

const getWindowStart = (days: number, now: Date): Date => {
  const firstDay = startOfUtcDay(now);
  return new Date(firstDay.getTime() - (days - 1) * DAY_MS);
};

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
  const [facilities, activeSessions, completedToday] = await Promise.all([
    analyticsRepository.findOwnerFacilities(ownerId),
    analyticsRepository.findOwnerSessions(ownerId, { status: 'ACTIVE' }),
    analyticsRepository.findOwnerSessions(ownerId, {
      status: 'COMPLETED',
      endTimeFrom: startOfUtcDay(now),
      endTimeTo: now,
    }),
  ]);

  const activeByParking = new Map<string, number>();
  for (const session of activeSessions) {
    activeByParking.set(session.parkingId, (activeByParking.get(session.parkingId) ?? 0) + 1);
  }

  const facilityData = facilities.map((facility) =>
    toFacilityAnalytics(
      facility,
      activeByParking.get(facility.id) ?? 0,
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
    revenueTodayCents: completedToday.reduce(
      (sum, session) => sum + (session.totalAmountCents ?? 0),
      0,
    ),
    currency: facilities[0]?.currency ?? supportedCurrencies[0],
    facilities: facilityData,
  };
};

const getCompletedWindow = async (ownerId: string, days: number, now: Date) =>
  await analyticsRepository.findOwnerSessions(ownerId, {
    status: 'COMPLETED',
    endTimeFrom: getWindowStart(days, now),
    endTimeTo: now,
  });

export const getRevenue = async (ownerId: string, query: AnalyticsQuery, now = new Date()) => {
  const sessions = await getCompletedWindow(ownerId, query.days, now);
  const values = new Map(buildDateKeys(query.days, now).map((date) => [date, 0]));
  for (const session of sessions) {
    if (session.endTime) {
      const key = dateKey(session.endTime);
      if (values.has(key)) {
        values.set(key, (values.get(key) ?? 0) + (session.totalAmountCents ?? 0));
      }
    }
  }

  return {
    days: query.days,
    currency: supportedCurrencies[0],
    data: [...values].map(([date, revenueCents]) => ({ date, revenueCents })),
  };
};

export const getVolume = async (ownerId: string, query: AnalyticsQuery, now = new Date()) => {
  const sessions = await getCompletedWindow(ownerId, query.days, now);
  const values = new Map(buildDateKeys(query.days, now).map((date) => [date, 0]));
  for (const session of sessions) {
    if (session.endTime) {
      const key = dateKey(session.endTime);
      if (values.has(key)) {
        values.set(key, (values.get(key) ?? 0) + 1);
      }
    }
  }

  return {
    days: query.days,
    data: [...values].map(([date, completedSessions]) => ({ date, completedSessions })),
  };
};

export const getFacilities = async (ownerId: string, query: AnalyticsQuery, now = new Date()) => {
  const [facilities, activeSessions, completedSessions] = await Promise.all([
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
        completedSessions.filter((session) => session.parkingId === facility.id),
      ),
    ),
  };
};
