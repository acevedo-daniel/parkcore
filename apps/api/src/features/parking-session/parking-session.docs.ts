import type { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import { errorResponse } from '../../docs/error-response.js';
import {
  checkInSchema,
  parkingParamsSchema,
  parkingSessionListResponseSchema,
  parkingSessionActiveQuerySchema,
  parkingSessionFilterSchema,
  parkingSessionParamsSchema,
  parkingSessionQuerySchema,
  parkingSessionResponseSchema,
  ownerActiveSessionResponseSchema,
  vehicleLookupQuerySchema,
  vehicleLookupResponseSchema,
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
      409: errorResponse(
        'Conflict with a stable check-in code: PARKING_INACTIVE, PARKING_CLOSED, PARKING_FULL, VEHICLE_ALREADY_ACTIVE, or CHECK_IN_RACE',
      ),
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
      409: errorResponse('This parking session is not active (SESSION_NOT_ACTIVE)'),
    },
  });

  registry.registerPath({
    method: 'get',
    path: '/parkings/{parkingId}/sessions/vehicle-lookup',
    tags: ['Parking Sessions'],
    summary: 'Look up a returning vehicle',
    security: [{ bearerAuth: [] }],
    request: { params: parkingParamsSchema, query: vehicleLookupQuerySchema },
    responses: {
      200: {
        description: 'Parking-scoped stable vehicle metadata without visit data',
        content: { 'application/json': { schema: vehicleLookupResponseSchema } },
      },
      400: errorResponse('Validation error'),
      401: errorResponse('Unauthorized'),
      403: errorResponse('Forbidden - not the owner'),
      404: errorResponse('Parking not found'),
    },
  });

  registry.registerPath({
    method: 'get',
    path: '/parkings/{parkingId}/sessions/active',
    tags: ['Parking Sessions'],
    summary: 'List active parking sessions',
    security: [{ bearerAuth: [] }],
    request: { params: parkingParamsSchema, query: parkingSessionActiveQuerySchema },
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
        description: 'Paginated parking sessions with a complete filtered aggregate',
        content: { 'application/json': { schema: parkingSessionListResponseSchema } },
      },
      401: errorResponse('Unauthorized'),
      403: errorResponse('Forbidden - not the owner'),
      404: errorResponse('Parking not found'),
    },
  });

  registry.registerPath({
    method: 'get',
    path: '/sessions/active',
    tags: ['Parking Sessions'],
    summary: 'List active sessions across owned parkings',
    security: [{ bearerAuth: [] }],
    responses: {
      200: {
        description: 'Minimal active session context for the authenticated owner overview',
        content: { 'application/json': { schema: ownerActiveSessionResponseSchema.array() } },
      },
      401: errorResponse('Unauthorized'),
      403: errorResponse('Forbidden - not an operator'),
    },
  });

  registry.registerPath({
    method: 'get',
    path: '/parkings/{parkingId}/sessions/export.csv',
    tags: ['Parking Sessions'],
    summary: 'Export parking session history as CSV',
    security: [{ bearerAuth: [] }],
    request: { params: parkingParamsSchema, query: parkingSessionFilterSchema },
    responses: {
      200: {
        description: 'Complete filtered parking session history CSV',
        content: { 'text/csv': { schema: { type: 'string' } } },
      },
      400: errorResponse('Validation error'),
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
      409: errorResponse('This parking session is not active (SESSION_NOT_ACTIVE)'),
    },
  });
}
