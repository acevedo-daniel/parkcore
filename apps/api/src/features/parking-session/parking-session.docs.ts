import type { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import { errorResponse } from '../../docs/error-response.js';
import {
  checkInSchema,
  parkingParamsSchema,
  parkingSessionListResponseSchema,
  parkingSessionParamsSchema,
  parkingSessionQuerySchema,
  parkingSessionResponseSchema,
} from './parking-session.schema.js';

export function registerParkingSessionDocs(registry: OpenAPIRegistry): void {
  registry.registerPath({
    method: 'post',
    path: '/parkings/{parkingId}/sessions/check-in',
    tags: ['Parking Sessions'],
    summary: 'Check in a vehicle',
    security: [{ bearerAuth: [] }],
    request: {
      params: parkingParamsSchema,
      body: { required: true, content: { 'application/json': { schema: checkInSchema } } },
    },
    responses: {
      201: {
        description: 'Parking session created',
        content: { 'application/json': { schema: parkingSessionResponseSchema } },
      },
      400: errorResponse('Validation error'),
      401: errorResponse('Unauthorized'),
      403: errorResponse('Forbidden - not the owner'),
      404: errorResponse('Parking not found'),
      409: errorResponse('Conflict (vehicle already inside, parking full, or parking inactive)'),
    },
  });

  registry.registerPath({
    method: 'post',
    path: '/sessions/{sessionId}/check-out',
    tags: ['Parking Sessions'],
    summary: 'Check out a vehicle',
    security: [{ bearerAuth: [] }],
    request: { params: parkingSessionParamsSchema },
    responses: {
      200: {
        description: 'Parking session completed',
        content: { 'application/json': { schema: parkingSessionResponseSchema } },
      },
      400: errorResponse('Validation error'),
      401: errorResponse('Unauthorized'),
      403: errorResponse('Forbidden - not the owner'),
      404: errorResponse('Parking session not found'),
      409: errorResponse('This parking session is not active'),
    },
  });

  registry.registerPath({
    method: 'get',
    path: '/parkings/{parkingId}/sessions/active',
    tags: ['Parking Sessions'],
    summary: 'List active parking sessions',
    security: [{ bearerAuth: [] }],
    request: { params: parkingParamsSchema },
    responses: {
      200: {
        description: 'Active parking sessions',
        content: { 'application/json': { schema: parkingSessionResponseSchema.array() } },
      },
      401: errorResponse('Unauthorized'),
      403: errorResponse('Forbidden - not the owner'),
      404: errorResponse('Parking not found'),
    },
  });

  registry.registerPath({
    method: 'get',
    path: '/parkings/{parkingId}/sessions',
    tags: ['Parking Sessions'],
    summary: 'List parking sessions',
    security: [{ bearerAuth: [] }],
    request: { params: parkingParamsSchema, query: parkingSessionQuerySchema },
    responses: {
      200: {
        description: 'Parking sessions',
        content: { 'application/json': { schema: parkingSessionListResponseSchema } },
      },
      401: errorResponse('Unauthorized'),
      403: errorResponse('Forbidden - not the owner'),
      404: errorResponse('Parking not found'),
    },
  });

  registry.registerPath({
    method: 'get',
    path: '/sessions/{sessionId}',
    tags: ['Parking Sessions'],
    summary: 'Get a parking session',
    security: [{ bearerAuth: [] }],
    request: { params: parkingSessionParamsSchema },
    responses: {
      200: {
        description: 'Parking session',
        content: { 'application/json': { schema: parkingSessionResponseSchema } },
      },
      401: errorResponse('Unauthorized'),
      403: errorResponse('Forbidden - not the owner'),
      404: errorResponse('Parking session not found'),
    },
  });

  registry.registerPath({
    method: 'patch',
    path: '/sessions/{sessionId}/cancel',
    tags: ['Parking Sessions'],
    summary: 'Cancel an active parking session',
    security: [{ bearerAuth: [] }],
    request: { params: parkingSessionParamsSchema },
    responses: {
      200: {
        description: 'Parking session cancelled',
        content: { 'application/json': { schema: parkingSessionResponseSchema } },
      },
      401: errorResponse('Unauthorized'),
      403: errorResponse('Forbidden - not the owner'),
      404: errorResponse('Parking session not found'),
      409: errorResponse('This parking session is not active'),
    },
  });
}
