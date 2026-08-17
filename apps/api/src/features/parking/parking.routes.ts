import { Router } from 'express';
import { requireAuth } from '../../middlewares/auth.middleware.js';
import { parkingSessionsRouter } from '../parking-session/parking-session.routes.js';
import * as parkingController from './parking.controller.js';

const parkingRouter = Router();

parkingRouter.use('/:parkingId/sessions', parkingSessionsRouter);

parkingRouter.get('/', parkingController.findAll);
parkingRouter.get('/me', requireAuth, parkingController.findOwned);
parkingRouter.get('/:id', parkingController.findById);

parkingRouter.patch('/:id', requireAuth, parkingController.update);

parkingRouter.post('/', requireAuth, parkingController.create);

export { parkingRouter };
