import type { Request, Response } from 'express';
import { getAuthenticatedUserId } from '../../utils/require-user.js';
import * as parkingSessionService from './parking-session.service.js';
import {
  checkInSchema,
  parkingParamsSchema,
  parkingSessionParamsSchema,
  parkingSessionQuerySchema,
} from './parking-session.schema.js';

export const checkIn = async (req: Request, res: Response): Promise<void> => {
  const userId = getAuthenticatedUserId(req);
  const { parkingId } = parkingParamsSchema.parse(req.params);
  const input = checkInSchema.parse(req.body);
  const session = await parkingSessionService.checkIn(userId, parkingId, input);
  res.status(201).json(session);
};

export const checkOut = async (req: Request, res: Response): Promise<void> => {
  const userId = getAuthenticatedUserId(req);
  const { sessionId } = parkingSessionParamsSchema.parse(req.params);
  const session = await parkingSessionService.checkOut(userId, sessionId);
  res.json(session);
};

export const listActive = async (req: Request, res: Response): Promise<void> => {
  const userId = getAuthenticatedUserId(req);
  const { parkingId } = parkingParamsSchema.parse(req.params);
  const sessions = await parkingSessionService.getActiveSessionsByParking(userId, parkingId);
  res.json(sessions);
};

export const findAll = async (req: Request, res: Response): Promise<void> => {
  const userId = getAuthenticatedUserId(req);
  const { parkingId } = parkingParamsSchema.parse(req.params);
  const query = parkingSessionQuerySchema.parse(req.query);
  const result = await parkingSessionService.getSessionsByParking(userId, parkingId, query);
  res.json(result);
};

export const findById = async (req: Request, res: Response): Promise<void> => {
  const userId = getAuthenticatedUserId(req);
  const { sessionId } = parkingSessionParamsSchema.parse(req.params);
  const session = await parkingSessionService.getSessionById(userId, sessionId);
  res.json(session);
};

export const cancel = async (req: Request, res: Response): Promise<void> => {
  const userId = getAuthenticatedUserId(req);
  const { sessionId } = parkingSessionParamsSchema.parse(req.params);
  const session = await parkingSessionService.cancelSession(userId, sessionId);
  res.json(session);
};
