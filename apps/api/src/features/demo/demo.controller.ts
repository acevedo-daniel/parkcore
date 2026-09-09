import type { Request, Response } from 'express';

import { getAuthenticatedUserId } from '../../utils/require-user.js';
import * as demoService from './demo.service.js';

export const getStatus = async (_req: Request, res: Response): Promise<void> => {
  res.json(await demoService.getStatus());
};

export const login = async (_req: Request, res: Response): Promise<void> => {
  res.json(await demoService.login());
};

export const reset = async (req: Request, res: Response): Promise<void> => {
  res.json(await demoService.reset(getAuthenticatedUserId(req)));
};
