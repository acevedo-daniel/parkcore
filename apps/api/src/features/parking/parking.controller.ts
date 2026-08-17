import type { Request, Response } from 'express';
import * as parkingService from './parking.service.js';
import {
  createParkingSchema,
  parkingParamsSchema,
  parkingQuerySchema,
  updateParkingSchema,
} from './parking.schema.js';
import { getAuthenticatedUserId } from '../../utils/require-user.js';

export const create = async (req: Request, res: Response): Promise<void> => {
  const userId = getAuthenticatedUserId(req);
  const input = createParkingSchema.parse(req.body);
  const parking = await parkingService.create(userId, input);
  res.status(201).json(parking);
};

export const findAll = async (req: Request, res: Response): Promise<void> => {
  const query = parkingQuerySchema.parse(req.query);
  const result = await parkingService.findAll(query);
  res.json(result);
};

export const findById = async (req: Request, res: Response): Promise<void> => {
  const { id } = parkingParamsSchema.parse(req.params);
  const parking = await parkingService.findPublicById(id);
  res.json(parking);
};

export const findOwned = async (req: Request, res: Response): Promise<void> => {
  const userId = getAuthenticatedUserId(req);
  const parkings = await parkingService.findOwned(userId);
  res.json(parkings);
};

export const update = async (req: Request, res: Response): Promise<void> => {
  const userId = getAuthenticatedUserId(req);
  const { id } = parkingParamsSchema.parse(req.params);
  const input = updateParkingSchema.parse(req.body);
  const parking = await parkingService.update(userId, id, input);
  res.json(parking);
};
