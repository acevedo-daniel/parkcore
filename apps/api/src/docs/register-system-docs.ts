import type { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';

const healthzResponseSchema = z.strictObject({
  status: z.literal('ok'),
});

export function registerSystemDocs(registry: OpenAPIRegistry): void {
  registry.registerPath({
    method: 'get',
    path: '/healthz',
    tags: ['System'],
    summary: 'Health Check',
    description: 'Basic service health endpoint.',
    responses: {
      200: {
        description: 'Service is healthy',
        content: {
          'application/json': {
            schema: healthzResponseSchema,
          },
        },
      },
    },
  });
}
