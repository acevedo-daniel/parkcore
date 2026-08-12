import { Router } from 'express';
import { requireAuth } from '../../middlewares/auth.middleware.js';
import { parkingBookingsRouter } from '../booking/booking.routes.js';
import * as parkingController from './parking.controller.js';

const parkingRouter = Router();

parkingRouter.use('/:parkingId/bookings', parkingBookingsRouter);

parkingRouter.get('/', parkingController.findAll);
parkingRouter.get('/me', requireAuth, parkingController.findOwned);
parkingRouter.get('/:id', parkingController.findById);

parkingRouter.patch('/:id', requireAuth, parkingController.update);

parkingRouter.post('/', requireAuth, parkingController.create);

export { parkingRouter };
