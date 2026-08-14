import { PaginationResult, createPaginatedResult } from '../../utils/pagination.js';
import { NotFoundError, ForbiddenError } from '../../errors/index.js';
import * as parkingRepository from './parking.repository.js';
import { Parking, Prisma } from '../../../prisma/generated/client.js';
import { CreateParking, UpdateParking, ParkingQuery } from './parking.schema.js';

export const create = async (ownerId: string, dto: CreateParking): Promise<Parking> => {
  const data: Prisma.ParkingCreateInput = {
    ...dto,
    owner: { connect: { id: ownerId } },
  };
  return parkingRepository.create(data);
};

export const findById = async (id: string): Promise<Parking> => {
  const parking = await parkingRepository.findById(id);
  if (!parking) throw new NotFoundError('Parking not found');
  return parking;
};

export const findPublicById = async (id: string): Promise<Parking> => {
  const parking = await parkingRepository.findActiveById(id);
  if (!parking) throw new NotFoundError('Parking not found');
  return parking;
};

export const findOwned = async (ownerId: string): Promise<Parking[]> => {
  return parkingRepository.findByOwner(ownerId);
};

export const update = async (
  ownerId: string,
  parkingId: string,
  dto: UpdateParking,
): Promise<Parking> => {
  const parking = await parkingRepository.findById(parkingId);
  if (!parking) throw new NotFoundError('Parking not found');

  if (parking.ownerId !== ownerId) throw new ForbiddenError('Access denied');

  return parkingRepository.update(parkingId, dto);
};

export const findAll = async (query: ParkingQuery): Promise<PaginationResult<Parking>> => {
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

  return createPaginatedResult(data, total, page, limit);
};
