import { Router } from 'express';

import {
  createDemoCreationRateLimiter,
  createDemoResetRateLimiter,
} from '../../config/rate-limit.js';
import { requireAuth, requireDemo } from '../../middlewares/auth.middleware.js';
import * as demoController from './demo.controller.js';

const demoRouter = Router();
const demoLoginLimiter = createDemoCreationRateLimiter();

demoRouter.get('/status', demoController.getStatus);
demoRouter.post('/login', demoLoginLimiter, demoController.login);
demoRouter.post(
  '/reset',
  requireAuth,
  requireDemo,
  createDemoResetRateLimiter(),
  demoController.reset,
);

export { demoRouter };
