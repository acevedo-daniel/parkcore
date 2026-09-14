import { Prisma } from '../../../prisma/generated/client.js';
import { ConflictError, ForbiddenError, NotFoundError } from '../../errors/index.js';
import { type PaginationResult, createPaginatedResult } from '../../utils/pagination.js';
import * as parkingService from '../parking/parking.service.js';
import * as vehicleService from '../vehicle/vehicle.service.js';
import * as parkingSessionRepository from './parking-session.repository.js';
import { formatZonedIso, getLocalPeriodWindow } from '../../utils/timezone.js';
import type {
  CheckIn,
  ParkingSessionAggregate,
  ParkingSessionFilter,
  ParkingSessionActiveQuery,
  ParkingSessionQuery,
  ParkingSessionResponse,
  VehicleLookupQuery,
  VehicleLookupResponse,
  VisitData,
} from './parking-session.schema.js';
import { toParkingSessionResponse, toVehicleSummary } from './parking-session.schema.js';

const isSerializationConflict = (error: unknown): boolean => {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2034') {
    return true;
  }

  if (typeof error !== 'object' || error === null || !('cause' in error)) return false;
  const cause = error.cause;
  return typeof cause === 'object' && cause !== null && 'originalCode' in cause
    ? cause.originalCode === '40001'
    : false;
};

const isVehicleIdentityUniqueConflict = (error: unknown): boolean => {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== 'P2002') {
    return false;
  }

  const target = error.meta?.target;
  if (Array.isArray(target)) {
    const targetText = target
      .filter((value): value is string => typeof value === 'string')
      .join('.');
    return targetText.includes('plate') && targetText.includes('parkingId');
  }
  return typeof target === 'string' && target.includes('plate') && target.includes('parkingId');
};

export const checkIn = async (
  ownerId: string,
  parkingId: string,
  dto: CheckIn,
): Promise<ParkingSessionResponse> => {
  const vehicleInput = {
    plate: dto.plate,
    ...(dto.type !== undefined ? { type: dto.type } : {}),
    ...(dto.brand !== undefined ? { brand: dto.brand } : {}),
    ...(dto.model !== undefined ? { model: dto.model } : {}),
  };
  const visitData: VisitData = {
    customerName: dto.customerName,
    customerPhone: dto.customerPhone,
    notes: dto.notes,
  };

  try {
    const result = await parkingSessionRepository.createActiveIfAvailable(
      ownerId,
      parkingId,
      vehicleInput,
      visitData,
    );
    if (!('kind' in result)) return toParkingSessionResponse(result);

    if (result.kind === 'parking-not-found') throw new NotFoundError('Parking not found');
    if (result.kind === 'parking-forbidden') {
      throw new ForbiddenError("You don't have access to this parking");
    }
    if (result.kind === 'parking-inactive') {
      throw new ConflictError('Parking is inactive', 'PARKING_INACTIVE');
    }
    if (result.kind === 'parking-closed') {
      throw new ConflictError(
        'Parking is closed',
        'PARKING_CLOSED',
        result.nextOpeningAt ? { nextOpeningAt: result.nextOpeningAt.toISOString() } : undefined,
      );
    }
    if (result.kind === 'parking-full') {
      throw new ConflictError('Parking is full', 'PARKING_FULL');
    }
    throw new ConflictError('Vehicle is already in the parking', 'VEHICLE_ALREADY_ACTIVE');
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      if (isVehicleIdentityUniqueConflict(error)) {
        throw new ConflictError('Check-in conflict, try again', 'CHECK_IN_RACE');
      }
      throw new ConflictError('Vehicle is already in the parking', 'VEHICLE_ALREADY_ACTIVE');
    }
    if (isSerializationConflict(error)) {
      throw new ConflictError('Check-in conflict, try again', 'CHECK_IN_RACE');
    }
    throw error;
  }
};

export const lookupVehicle = async (
  ownerId: string,
  parkingId: string,
  query: VehicleLookupQuery,
): Promise<VehicleLookupResponse> => {
  const parking = await parkingService.findById(parkingId);
  if (parking.ownerId !== ownerId) {
    throw new ForbiddenError("You don't have access to this parking");
  }

  const vehicle = await vehicleService.findByPlateForParking(parkingId, query.plate);
  return { vehicle: vehicle ? toVehicleSummary(vehicle) : null };
};

export const checkOut = async (
  ownerId: string,
  sessionId: string,
): Promise<ParkingSessionResponse> => {
  const session = await parkingSessionRepository.findById(sessionId);
  if (!session) throw new NotFoundError('Parking session not found');
  if (session.parking.ownerId !== ownerId) {
    throw new ForbiddenError("You don't have access to this parking session");
  }

  const endTime = new Date();
  const elapsedHours = (endTime.getTime() - session.startTime.getTime()) / 3_600_000;
  const chargedHours = Math.max(1, Math.ceil(elapsedHours));
  const totalAmountCents = chargedHours * session.hourlyRateCents;
  const completedSession = await parkingSessionRepository.completeIfActive(
    sessionId,
    endTime,
    totalAmountCents,
  );
  if (!completedSession) {
    throw new ConflictError('This parking session is not active', 'SESSION_NOT_ACTIVE');
  }
  return toParkingSessionResponse(completedSession);
};

export const getActiveSessionsByParking = async (
  ownerId: string,
  parkingId: string,
  query: ParkingSessionActiveQuery = {},
): Promise<ParkingSessionResponse[]> => {
  const parking = await parkingService.findById(parkingId);
  if (parking.ownerId !== ownerId)
    throw new ForbiddenError("You don't have access to this parking");
  const sessions = await parkingSessionRepository.findActiveByParking(parkingId, query);
  return sessions.map(toParkingSessionResponse);
};

export const getSessionsByParking = async (
  ownerId: string,
  parkingId: string,
  query: ParkingSessionQuery,
  now = new Date(),
): Promise<
  PaginationResult<ParkingSessionResponse> & {
    aggregate: ParkingSessionAggregate;
    timezone: string;
  }
> => {
  const parking = await parkingService.findById(parkingId);
  if (parking.ownerId !== ownerId)
    throw new ForbiddenError("You don't have access to this parking");

  const { page, limit, status, plate, period } = query;
  const periodWindow = getLocalPeriodWindow(period, parking.timezone, now);
  const result = await parkingSessionRepository.findByParking(parkingId, {
    skip: (page - 1) * limit,
    take: limit,
    ...(status ? { status } : {}),
    ...(plate ? { plate } : {}),
    startTimeFrom: periodWindow.start,
    startTimeTo: periodWindow.end,
  });
  return {
    ...createPaginatedResult(result.data.map(toParkingSessionResponse), result.total, page, limit),
    aggregate: toParkingSessionAggregate(result.aggregateRows),
    timezone: parking.timezone,
  };
};

export const toParkingSessionAggregate = (
  rows: parkingSessionRepository.ParkingSessionHistoryAggregateRow[],
): ParkingSessionAggregate => {
  const revenueByCurrency = new Map<'ARS' | 'USD', number>();
  let activeSessions = 0;
  let completedSessions = 0;
  let cancelledSessions = 0;

  for (const row of rows) {
    if (row.status === 'ACTIVE') activeSessions += 1;
    if (row.status === 'COMPLETED') {
      completedSessions += 1;
      if (row.totalAmountCents !== null) {
        revenueByCurrency.set(
          row.currency,
          (revenueByCurrency.get(row.currency) ?? 0) + row.totalAmountCents,
        );
      }
    }
    if (row.status === 'CANCELLED') cancelledSessions += 1;
  }

  return {
    totalSessions: rows.length,
    activeSessions,
    completedSessions,
    cancelledSessions,
    revenueByCurrency: [...revenueByCurrency.entries()]
      .sort(([first], [second]) => first.localeCompare(second))
      .map(([currency, revenueCents]) => ({ currency, revenueCents })),
  };
};

const escapeCsv = (value: string | number): string => {
  const stringValue = String(value);
  return /[",\r\n]/.test(stringValue) ? `"${stringValue.replaceAll('"', '""')}"` : stringValue;
};

const csvValue = (value: string | number | null): string =>
  value === null ? '' : escapeCsv(value);

const historyCsvHeader = [
  'plate',
  'vehicleType',
  'brand',
  'model',
  'startTime',
  'endTime',
  'durationMinutes',
  'status',
  'hourlyRate',
  'currency',
  'totalAmount',
  'timezone',
];

export const getParkingSessionsCsv = async (
  ownerId: string,
  parkingId: string,
  query: ParkingSessionFilter,
  now = new Date(),
): Promise<string> => {
  const parking = await parkingService.findById(parkingId);
  if (parking.ownerId !== ownerId) {
    throw new ForbiddenError("You don't have access to this parking");
  }
  const periodWindow = getLocalPeriodWindow(query.period, parking.timezone, now);
  const sessions = await parkingSessionRepository.findForExport(parkingId, {
    ...(query.status ? { status: query.status } : {}),
    ...(query.plate ? { plate: query.plate } : {}),
    startTimeFrom: periodWindow.start,
    startTimeTo: periodWindow.end,
  });
  const rows = sessions.map((session) => {
    const durationMinutes = session.endTime
      ? Math.max(0, Math.floor((session.endTime.getTime() - session.startTime.getTime()) / 60_000))
      : null;
    return [
      session.vehicle.plate,
      session.vehicle.type,
      session.vehicle.brand,
      session.vehicle.model,
      formatZonedIso(session.startTime, parking.timezone),
      session.endTime ? formatZonedIso(session.endTime, parking.timezone) : null,
      durationMinutes,
      session.status,
      session.hourlyRateCents,
      session.currency,
      session.status === 'COMPLETED' ? session.totalAmountCents : null,
      parking.timezone,
    ]
      .map((value) => csvValue(value))
      .join(',');
  });
  return [historyCsvHeader.join(','), ...rows].join('\r\n');
};

export const getSessionById = async (
  ownerId: string,
  sessionId: string,
): Promise<ParkingSessionResponse> => {
  const session = await parkingSessionRepository.findById(sessionId);
  if (!session) throw new NotFoundError('Parking session not found');
  if (session.parking.ownerId !== ownerId) {
    throw new ForbiddenError("You don't have access to this parking session");
  }
  return toParkingSessionResponse(session);
};

export const cancelSession = async (
  ownerId: string,
  sessionId: string,
): Promise<ParkingSessionResponse> => {
  const session = await parkingSessionRepository.findById(sessionId);
  if (!session) throw new NotFoundError('Parking session not found');
  if (session.parking.ownerId !== ownerId) {
    throw new ForbiddenError("You don't have access to this parking session");
  }

  const cancelledSession = await parkingSessionRepository.cancelIfActive(sessionId);
  if (!cancelledSession) {
    throw new ConflictError('This parking session is not active', 'SESSION_NOT_ACTIVE');
  }
  return toParkingSessionResponse(cancelledSession);
};
