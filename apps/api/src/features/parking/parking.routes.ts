import { Router } from 'express';
import { requireAuth, requireOperator } from '../../middlewares/auth.middleware.js';
import { parkingSessionsRouter } from '../parking-session/parking-session.routes.js';
import * as parkingController from './parking.controller.js';

const parkingRouter = Router();

parkingRouter.use('/:parkingId/sessions', parkingSessionsRouter);

parkingRouter.get('/', parkingController.findAll);
parkingRouter.get('/me', requireAuth, requireOperator, parkingController.findOwned);
parkingRouter.get('/:id', parkingController.findById);

parkingRouter.patch('/:id', requireAuth, requireOperator, parkingController.update);

parkingRouter.post('/', requireAuth, requireOperator, parkingController.create);

export { parkingRouter };
