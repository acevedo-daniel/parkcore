import { createPaginatedResult } from '../../utils/pagination.js';
import {
  BadRequestError,
  NotFoundError,
  ForbiddenError,
  ConflictError,
} from '../../errors/index.js';
import * as parkingRepository from './parking.repository.js';
import { Parking, Prisma } from '../../../prisma/generated/client.js';
import * as userRepository from '../user/user.repository.js';
import { getScheduleState, validateDailySchedule } from '../../utils/timezone.js';
import {
  CreateParking,
  UpdateParking,
  ParkingQuery,
  ParkingResponse,
  PublicParkingListResponse,
  PublicParkingResponse,
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

export const findPublicById = async (id: string): Promise<PublicParkingResponse> => {
  const parking = await parkingRepository.findPublicById(id);
  if (!parking) throw new NotFoundError('Parking not found');
  return toPublicParkingResponse(parking);
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

const availabilityRank: Record<PublicParkingResponse['availabilityState'], number> = {
  AVAILABLE: 0,
  LIMITED: 1,
  FULL: 2,
  CLOSED: 3,
};

export const toPublicParkingResponse = (
  parking: parkingRepository.PublicParkingRecord,
): PublicParkingResponse => {
  const activeSessionCount = parking.parkingSessions.length;
  const schedule = getScheduleState({
    timezone: parking.timezone,
    is24Hours: parking.is24Hours,
    opensAt: parking.opensAt,
    closesAt: parking.closesAt,
  });
  const availableSpaces = Math.max(0, parking.capacity - activeSessionCount);
  const occupancyPercent = (activeSessionCount / parking.capacity) * 100;
  const availabilityState = !schedule.isOpen
    ? 'CLOSED'
    : availableSpaces === 0
      ? 'FULL'
      : occupancyPercent >= 80
        ? 'LIMITED'
        : 'AVAILABLE';

  return {
    id: parking.id,
    title: parking.title,
    description: parking.description,
    image: parking.image,
    neighborhood: parking.neighborhood,
    address: parking.address,
    hourlyRateCents: parking.hourlyRateCents,
    currency: parking.currency,
    capacity: parking.capacity,
    lat: parking.lat,
    lng: parking.lng,
    timezone: parking.timezone,
    is24Hours: parking.is24Hours,
    opensAt: parking.opensAt,
    closesAt: parking.closesAt,
    isShowcase: parking.owner.kind === 'SHOWCASE',
    isOpen: schedule.isOpen,
    availabilityState,
    availableSpaces,
    occupancyPercent,
    nextOpeningAt: schedule.nextOpeningAt?.toISOString() ?? null,
  };
};

export const findAll = async (query: ParkingQuery): Promise<PublicParkingListResponse> => {
  const { page, limit, search, currency, minHourlyRateCents, maxHourlyRateCents, availableNow } =
    query;

  const where: Prisma.ParkingWhereInput = {};

  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { neighborhood: { contains: search, mode: 'insensitive' } },
      { address: { contains: search, mode: 'insensitive' } },
    ];
  }

  if (currency) where.currency = currency;

  if (minHourlyRateCents !== undefined || maxHourlyRateCents !== undefined) {
    where.hourlyRateCents = {
      ...(minHourlyRateCents !== undefined ? { gte: minHourlyRateCents } : {}),
      ...(maxHourlyRateCents !== undefined ? { lte: maxHourlyRateCents } : {}),
    };
  }

  const candidates = await parkingRepository.findPublicCandidates(where);
  const publicParkings = candidates.map(toPublicParkingResponse);
  const filtered = availableNow
    ? publicParkings.filter(
        (parking) =>
          parking.availabilityState === 'AVAILABLE' || parking.availabilityState === 'LIMITED',
      )
    : publicParkings;

  filtered.sort(
    (left, right) =>
      availabilityRank[left.availabilityState] - availabilityRank[right.availabilityState] ||
      left.title.localeCompare(right.title) ||
      left.id.localeCompare(right.id),
  );

  const skip = (page - 1) * limit;
  return createPaginatedResult(filtered.slice(skip, skip + limit), filtered.length, page, limit);
};
