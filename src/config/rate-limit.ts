import rateLimit from 'express-rate-limit';
import { env } from './env.js';

function buildAuthRateLimitMessage() {
  return { error: true, message: 'Too many requests, try again later' };
}

export function createAuthRateLimiter(_scope: 'register' | 'login') {
  return rateLimit({
    windowMs: env.AUTH_RATE_LIMIT_WINDOW_MS,
    limit: env.AUTH_RATE_LIMIT_MAX,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: buildAuthRateLimitMessage(),
  });
}
