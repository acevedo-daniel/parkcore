import { Prisma } from '../../../prisma/generated/client.js';
import { ConflictError, ForbiddenError, NotFoundError } from '../../errors/index.js';
import { type PaginationResult, createPaginatedResult } from '../../utils/pagination.js';
import * as parkingService from '../parking/parking.service.js';
import * as vehicleService from '../vehicle/vehicle.service.js';
import * as parkingSessionRepository from './parking-session.repository.js';
import type {
  CheckIn,
  ParkingSessionQuery,
  ParkingSessionResponse,
  VisitData,
} from './parking-session.schema.js';
import { toParkingSessionResponse } from './parking-session.schema.js';

export const checkIn = async (
  ownerId: string,
  parkingId: string,
  dto: CheckIn,
): Promise<ParkingSessionResponse> => {
  const parking = await parkingService.findById(parkingId);
  if (parking.ownerId !== ownerId)
    throw new ForbiddenError("You don't have access to this parking");
  if (!parking.isActive) throw new ConflictError('Parking is inactive');

  const vehicle = await vehicleService.findOrCreateForAuthorizedParking(parkingId, {
    plate: dto.plate,
    ...(dto.type !== undefined ? { type: dto.type } : {}),
    ...(dto.brand !== undefined ? { brand: dto.brand } : {}),
    ...(dto.model !== undefined ? { model: dto.model } : {}),
  });
  const visitData: VisitData = {
    customerName: dto.customerName,
    customerPhone: dto.customerPhone,
    notes: dto.notes,
  };

  try {
    const session = await parkingSessionRepository.createActiveIfAvailable(
      parkingId,
      vehicle.id,
      parking.capacity,
      parking.hourlyRateCents,
      parking.currency,
      visitData,
    );
    if (session === 'parking-full') throw new ConflictError('Parking is full');
    if (session === 'vehicle-active') throw new ConflictError('Vehicle is already in the parking');
    return toParkingSessionResponse(session);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw new ConflictError('Vehicle is already in the parking');
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2034') {
      throw new ConflictError('Check-in conflict, try again');
    }
    throw error;
  }
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
  if (!completedSession) throw new ConflictError('This parking session is not active');
  return toParkingSessionResponse(completedSession);
};

export const getActiveSessionsByParking = async (
  ownerId: string,
  parkingId: string,
): Promise<ParkingSessionResponse[]> => {
  const parking = await parkingService.findById(parkingId);
  if (parking.ownerId !== ownerId)
    throw new ForbiddenError("You don't have access to this parking");
  const sessions = await parkingSessionRepository.findActiveByParking(parkingId);
  return sessions.map(toParkingSessionResponse);
};

export const getSessionsByParking = async (
  ownerId: string,
  parkingId: string,
  query: ParkingSessionQuery,
): Promise<PaginationResult<ParkingSessionResponse>> => {
  const parking = await parkingService.findById(parkingId);
  if (parking.ownerId !== ownerId)
    throw new ForbiddenError("You don't have access to this parking");

  const { page, limit, status } = query;
  const result = await parkingSessionRepository.findByParking(parkingId, {
    skip: (page - 1) * limit,
    take: limit,
    status,
  });
  return createPaginatedResult(
    result.data.map(toParkingSessionResponse),
    result.total,
    page,
    limit,
  );
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
  if (!cancelledSession) throw new ConflictError('This parking session is not active');
  return toParkingSessionResponse(cancelledSession);
};
