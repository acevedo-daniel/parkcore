import { Router } from 'express';

import { createAuthRateLimiter, createDemoResetRateLimiter } from '../../config/rate-limit.js';
import { requireAuth } from '../../middlewares/auth.middleware.js';
import * as demoController from './demo.controller.js';

const demoRouter = Router();
const demoLoginLimiter = createAuthRateLimiter('login');

demoRouter.get('/status', demoController.getStatus);
demoRouter.post('/login', demoLoginLimiter, demoController.login);
demoRouter.post('/reset', requireAuth, createDemoResetRateLimiter(), demoController.reset);

export { demoRouter };
