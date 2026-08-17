import type { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import { errorResponse } from '../../docs/error-response.js';
import {
  createParkingSchema,
  updateParkingSchema,
  parkingParamsSchema,
  parkingQuerySchema,
  parkingResponseSchema,
  parkingListResponseSchema,
} from './parking.schema.js';

export function registerParkingDocs(registry: OpenAPIRegistry): void {
  registry.registerPath({
    method: 'post',
    path: '/parkings',
    tags: ['Parkings'],
    summary: 'Create Parking',
    description: 'Create a new parking facility.',
    security: [{ bearerAuth: [] }],
    request: {
      body: {
        content: {
          'application/json': {
            schema: createParkingSchema,
          },
        },
        required: true,
      },
    },
    responses: {
      201: {
        description: 'Parking facility created successfully',
        content: {
          'application/json': {
            schema: parkingResponseSchema,
          },
        },
      },
      400: errorResponse('Validation error'),
      401: errorResponse('Unauthorized - missing or invalid token'),
    },
  });

  registry.registerPath({
    method: 'get',
    path: '/parkings',
    tags: ['Parkings'],
    summary: 'List Parkings',
    description: 'Retrieve parking facilities.',
    request: {
      query: parkingQuerySchema,
    },
    responses: {
      200: {
        description: 'Paginated list of parking facilities',
        content: {
          'application/json': {
            schema: parkingListResponseSchema,
          },
        },
      },
      400: errorResponse('Validation error'),
    },
  });

  registry.registerPath({
    method: 'get',
    path: '/parkings/me',
    tags: ['Parkings'],
    summary: 'List Owned Parkings',
    description: 'Retrieve parking facilities owned by the current user.',
    security: [{ bearerAuth: [] }],
    responses: {
      200: {
        description: 'List of owned parking facilities',
        content: {
          'application/json': {
            schema: parkingResponseSchema.array(),
          },
        },
      },
      401: errorResponse('Unauthorized'),
    },
  });

  registry.registerPath({
    method: 'get',
    path: '/parkings/{id}',
    tags: ['Parkings'],
    summary: 'Get Parking',
    description: 'Parking facility details.',
    request: {
      params: parkingParamsSchema,
    },
    responses: {
      200: {
        description: 'Parking facility details',
        content: {
          'application/json': {
            schema: parkingResponseSchema,
          },
        },
      },
      404: errorResponse('Parking not found'),
    },
  });

  registry.registerPath({
    method: 'patch',
    path: '/parkings/{id}',
    tags: ['Parkings'],
    summary: 'Update Parking',
    description: 'Update a parking facility.',
    security: [{ bearerAuth: [] }],
    request: {
      params: parkingParamsSchema,
      body: {
        required: true,
        content: {
          'application/json': {
            schema: updateParkingSchema,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Parking updated successfully',
        content: {
          'application/json': {
            schema: parkingResponseSchema,
          },
        },
      },
      400: errorResponse('Validation error'),
      401: errorResponse('Unauthorized'),
      403: errorResponse('Forbidden - not the owner'),
      404: errorResponse('Parking not found'),
    },
  });
}
