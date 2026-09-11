import { Router } from 'express';
import { requireAuth, requireOperator } from '../../middlewares/auth.middleware.js';
import * as userController from './user.controller.js';

const userRouter = Router();

userRouter.get('/me', requireAuth, userController.findCurrent);
userRouter.patch('/me', requireAuth, requireOperator, userController.updateCurrent);

export { userRouter };
