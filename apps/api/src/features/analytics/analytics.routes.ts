import { Router } from 'express';
import { requireAuth, requireOperator } from '../../middlewares/auth.middleware.js';
import * as analyticsController from './analytics.controller.js';

export const analyticsRouter = Router();
analyticsRouter.use(requireAuth, requireOperator);
analyticsRouter.get('/summary', analyticsController.summary);
analyticsRouter.get('/revenue', analyticsController.revenue);
analyticsRouter.get('/volume', analyticsController.volume);
analyticsRouter.get('/facilities', analyticsController.facilities);
