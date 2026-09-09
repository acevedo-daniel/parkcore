import { Router } from 'express';

import { createDemoResetRateLimiter } from '../../config/rate-limit.js';
import { requireAuth } from '../../middlewares/auth.middleware.js';
import * as demoController from './demo.controller.js';

const demoRouter = Router();

demoRouter.get('/status', demoController.getStatus);
demoRouter.post('/login', demoController.login);
demoRouter.post('/reset', requireAuth, createDemoResetRateLimiter(), demoController.reset);

export { demoRouter };
