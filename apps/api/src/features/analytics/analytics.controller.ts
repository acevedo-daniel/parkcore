import type { Request, Response } from 'express';
import { getAuthenticatedUserId } from '../../utils/require-user.js';
import { analyticsQuerySchema } from './analytics.schema.js';
import * as analyticsService from './analytics.service.js';

export const summary = async (req: Request, res: Response): Promise<void> => {
  res.json(await analyticsService.getSummary(getAuthenticatedUserId(req)));
};

export const revenue = async (req: Request, res: Response): Promise<void> => {
  const query = analyticsQuerySchema.parse(req.query);
  res.json(await analyticsService.getRevenue(getAuthenticatedUserId(req), query));
};

export const volume = async (req: Request, res: Response): Promise<void> => {
  const query = analyticsQuerySchema.parse(req.query);
  res.json(await analyticsService.getVolume(getAuthenticatedUserId(req), query));
};

export const facilities = async (req: Request, res: Response): Promise<void> => {
  const query = analyticsQuerySchema.parse(req.query);
  res.json(await analyticsService.getFacilities(getAuthenticatedUserId(req), query));
};
