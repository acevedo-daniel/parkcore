import { Router } from 'express';
import { createAuthRateLimiter } from '../../config/rate-limit.js';
import * as authController from './auth.controller.js';

const registerLimiter = createAuthRateLimiter('register');
const loginLimiter = createAuthRateLimiter('login');

const authRouter = Router();

authRouter.post('/register', registerLimiter, authController.register);

authRouter.post('/login', loginLimiter, authController.login);

export { authRouter };
