import pino from 'pino';
import { env } from '../config/env.js';

const isPretty = env.NODE_ENV !== 'production' && env.LOG_PRETTY;

export const logger = pino({
  level: env.LOG_LEVEL,
  base: {
    service: 'parkcore-api',
    env: env.NODE_ENV,
  },
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      'req.body.password',
      'req.body.passwordHash',
      'req.body.token',
      'req.body.accessToken',
      'req.body.refreshToken',
      '*.passwordHash',
      '*.password',
      '*.accessToken',
      '*.refreshToken',
      '*.token',
    ],
    remove: true,
  },
  transport: isPretty
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname',
        },
      }
    : undefined,
});
