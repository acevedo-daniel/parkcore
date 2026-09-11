import { PaginationResult, createPaginatedResult } from '../../utils/pagination.js';
import {
  BadRequestError,
  NotFoundError,
  ForbiddenError,
  ConflictError,
} from '../../errors/index.js';
import * as parkingRepository from './parking.repository.js';
import { Parking, Prisma } from '../../../prisma/generated/client.js';
import * as userRepository from '../user/user.repository.js';
import { validateDailySchedule } from '../../utils/timezone.js';
import {
  CreateParking,
  UpdateParking,
  ParkingQuery,
  ParkingResponse,
  toParkingResponse,
} from './parking.schema.js';

export const create = async (ownerId: string, dto: CreateParking): Promise<ParkingResponse> => {
  const owner = await userRepository.findById(ownerId);
  if (!owner || owner.kind === 'SHOWCASE') throw new ForbiddenError('Access denied');
  const timezone = dto.timezone ?? owner.timezone;
  const scheduleError = validateDailySchedule({
    timezone,
    is24Hours: dto.is24Hours,
    opensAt: dto.opensAt ?? null,
    closesAt: dto.closesAt ?? null,
  });
  if (scheduleError) throw new BadRequestError(scheduleError);

  const data: Prisma.ParkingCreateInput = {
    ...dto,
    timezone,
    opensAt: dto.opensAt ?? null,
    closesAt: dto.closesAt ?? null,
    isListed: owner.kind === 'DEMO' ? false : dto.isListed,
    owner: { connect: { id: ownerId } },
  };
  return toParkingResponse(await parkingRepository.create(data));
};

export const findById = async (id: string): Promise<Parking> => {
  const parking = await parkingRepository.findById(id);
  if (!parking) throw new NotFoundError('Parking not found');
  return parking;
};

export const findPublicById = async (id: string): Promise<ParkingResponse> => {
  const parking = await parkingRepository.findActiveById(id);
  if (!parking) throw new NotFoundError('Parking not found');
  return toParkingResponse(parking);
};

export const findOwned = async (ownerId: string): Promise<ParkingResponse[]> => {
  return (await parkingRepository.findByOwner(ownerId)).map(toParkingResponse);
};

export const update = async (
  ownerId: string,
  parkingId: string,
  dto: UpdateParking,
): Promise<ParkingResponse> => {
  const parking = await parkingRepository.findById(parkingId);
  if (!parking) throw new NotFoundError('Parking not found');

  if (parking.ownerId !== ownerId) throw new ForbiddenError('Access denied');

  const owner = await userRepository.findById(ownerId);
  if (!owner || owner.kind === 'SHOWCASE') throw new ForbiddenError('Access denied');
  const mergedSchedule = {
    timezone: dto.timezone ?? parking.timezone,
    is24Hours: dto.is24Hours ?? parking.is24Hours,
    opensAt: dto.opensAt === undefined ? parking.opensAt : dto.opensAt,
    closesAt: dto.closesAt === undefined ? parking.closesAt : dto.closesAt,
  };
  const scheduleError = validateDailySchedule(mergedSchedule);
  if (scheduleError) throw new BadRequestError(scheduleError);

  const updateData: Prisma.ParkingUpdateInput = {
    ...dto,
    ...(owner.kind === 'DEMO' ? { isListed: false } : {}),
  };
  const updated = await parkingRepository.updateWithCapacityCheck(parkingId, updateData);
  if (!updated) throw new NotFoundError('Parking not found');
  if ('activeCount' in updated) {
    throw new ConflictError(
      `Capacity cannot be reduced below ${String(updated.activeCount)} active session${updated.activeCount === 1 ? '' : 's'}`,
    );
  }
  return toParkingResponse(updated);
};

export const findAll = async (query: ParkingQuery): Promise<PaginationResult<ParkingResponse>> => {
  const { page, limit, search, minHourlyRateCents, maxHourlyRateCents, ownerId } = query;
  const skip = (page - 1) * limit;

  const where: Prisma.ParkingWhereInput = { isActive: true };

  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { address: { contains: search, mode: 'insensitive' } },
    ];
  }

  if (minHourlyRateCents !== undefined || maxHourlyRateCents !== undefined) {
    where.hourlyRateCents = {
      ...(minHourlyRateCents !== undefined ? { gte: minHourlyRateCents } : {}),
      ...(maxHourlyRateCents !== undefined ? { lte: maxHourlyRateCents } : {}),
    };
  }

  if (ownerId) {
    where.ownerId = ownerId;
  }

  const { data, total } = await parkingRepository.findAll(skip, limit, where);

  return createPaginatedResult(data.map(toParkingResponse), total, page, limit);
};
