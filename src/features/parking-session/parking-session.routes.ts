import { Router } from 'express';
import { requireAuth } from '../../middlewares/auth.middleware.js';
import * as parkingSessionController from './parking-session.controller.js';

export const parkingSessionsRouter = Router({ mergeParams: true });
parkingSessionsRouter.use(requireAuth);
parkingSessionsRouter.post('/check-in', parkingSessionController.checkIn);
parkingSessionsRouter.get('/active', parkingSessionController.listActive);
parkingSessionsRouter.get('/', parkingSessionController.findAll);

export const parkingSessionRouter = Router();
parkingSessionRouter.use(requireAuth);
parkingSessionRouter.post('/:sessionId/check-out', parkingSessionController.checkOut);
parkingSessionRouter.get('/:sessionId', parkingSessionController.findById);
parkingSessionRouter.patch('/:sessionId/cancel', parkingSessionController.cancel);
