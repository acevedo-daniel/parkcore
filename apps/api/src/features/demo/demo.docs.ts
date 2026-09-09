import type { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';

import { errorResponse } from '../../docs/error-response.js';
import { authResponseSchema } from '../auth/auth.schema.js';
import { demoResetResponseSchema, demoStatusResponseSchema } from './demo.schema.js';

export function registerDemoDocs(registry: OpenAPIRegistry): void {
  registry.registerPath({
    method: 'get',
    path: '/demo/status',
    tags: ['Demo'],
    summary: 'Get demo availability',
    description: 'Reports whether one-click demo access is currently available.',
    responses: {
      200: {
        description: 'Demo availability',
        content: { 'application/json': { schema: demoStatusResponseSchema } },
      },
      500: errorResponse('Demo status lookup failed'),
    },
  });

  registry.registerPath({
    method: 'post',
    path: '/demo/login',
    tags: ['Demo'],
    summary: 'Start a demo operator session',
    description:
      'Creates a session only for the configured demo operator. No credentials are accepted or returned.',
    responses: {
      200: {
        description: 'Demo session created',
        content: { 'application/json': { schema: authResponseSchema } },
      },
      409: errorResponse('Demo access is temporarily unavailable'),
      500: errorResponse('Demo login failed'),
    },
  });

  registry.registerPath({
    method: 'post',
    path: '/demo/reset',
    tags: ['Demo'],
    summary: 'Restore canonical demo data',
    description:
      'Requires the configured demo operator session. Concurrent resets conflict and requests are rate-limited.',
    security: [{ bearerAuth: [] }],
    responses: {
      200: {
        description: 'Canonical demo data restored',
        content: { 'application/json': { schema: demoResetResponseSchema } },
      },
      401: errorResponse('Missing or invalid access token'),
      403: errorResponse('Account is not allowed to reset demo data'),
      409: errorResponse('A reset is already in progress or demo access is unavailable'),
      429: errorResponse('Too many requests'),
      500: errorResponse('Demo reset failed'),
    },
  });
}
