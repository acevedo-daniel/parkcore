import { ForbiddenError } from '../errors/index.js';

import type { Env } from './env.js';

type CorsOriginCallback = (error: Error | null, allow?: boolean) => void;

export const createCorsOriginValidator = (
  nodeEnv: Env['NODE_ENV'],
  allowedOrigins: readonly string[],
) => {
  const corsOrigins = new Set(allowedOrigins);

  return (origin: string | undefined, callback: CorsOriginCallback): void => {
    if (!origin || nodeEnv !== 'production' || corsOrigins.has(origin)) {
      callback(null, true);
      return;
    }

    callback(new ForbiddenError('CORS origin not allowed'));
  };
};
