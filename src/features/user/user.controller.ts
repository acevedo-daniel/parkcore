import type { Request, Response } from 'express';
import * as userService from './user.service.js';
import { getAuthenticatedUserId } from '../../utils/require-user.js';
import { updateProfileSchema } from './user.schema.js';

export const findCurrent = async (req: Request, res: Response): Promise<void> => {
  const userId = getAuthenticatedUserId(req);
  const user = await userService.getById(userId);
  res.json(user);
};

export const updateCurrent = async (req: Request, res: Response): Promise<void> => {
  const userId = getAuthenticatedUserId(req);
  const input = updateProfileSchema.parse(req.body);
  const user = await userService.updateProfile(userId, input);
  res.json(user);
};
