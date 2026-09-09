import type { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import { errorResponse } from '../../docs/error-response.js';
import {
  analyticsFacilitiesResponseSchema,
  analyticsQuerySchema,
  analyticsRevenueResponseSchema,
  analyticsSummaryResponseSchema,
  analyticsVolumeResponseSchema,
} from './analytics.schema.js';

export function registerAnalyticsDocs(registry: OpenAPIRegistry): void {
  const common = {
    tags: ['Analytics'],
    security: [{ bearerAuth: [] }],
    responses: {
      401: errorResponse('Unauthorized'),
    },
  };

  registry.registerPath({
    ...common,
    method: 'get',
    path: '/analytics/summary',
    summary: 'Get fleet analytics summary',
    responses: {
      ...common.responses,
      200: {
        description: 'Fleet analytics summary',
        content: { 'application/json': { schema: analyticsSummaryResponseSchema } },
      },
    },
  });

  registry.registerPath({
    ...common,
    method: 'get',
    path: '/analytics/revenue',
    summary: 'Get revenue series',
    request: { query: analyticsQuerySchema },
    responses: {
      ...common.responses,
      200: {
        description: 'Daily revenue series',
        content: { 'application/json': { schema: analyticsRevenueResponseSchema } },
      },
      400: errorResponse('Validation error'),
    },
  });

  registry.registerPath({
    ...common,
    method: 'get',
    path: '/analytics/volume',
    summary: 'Get completed session volume series',
    request: { query: analyticsQuerySchema },
    responses: {
      ...common.responses,
      200: {
        description: 'Daily completed session series',
        content: { 'application/json': { schema: analyticsVolumeResponseSchema } },
      },
      400: errorResponse('Validation error'),
    },
  });

  registry.registerPath({
    ...common,
    method: 'get',
    path: '/analytics/facilities',
    summary: 'Get facility analytics',
    request: { query: analyticsQuerySchema },
    responses: {
      ...common.responses,
      200: {
        description: 'Facility analytics',
        content: { 'application/json': { schema: analyticsFacilitiesResponseSchema } },
      },
      400: errorResponse('Validation error'),
    },
  });
}
