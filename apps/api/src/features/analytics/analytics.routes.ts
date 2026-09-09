import { Router } from 'express';
import { requireAuth } from '../../middlewares/auth.middleware.js';
import * as analyticsController from './analytics.controller.js';

export const analyticsRouter = Router();
analyticsRouter.use(requireAuth);
analyticsRouter.get('/summary', analyticsController.summary);
analyticsRouter.get('/revenue', analyticsController.revenue);
analyticsRouter.get('/volume', analyticsController.volume);
analyticsRouter.get('/facilities', analyticsController.facilities);
