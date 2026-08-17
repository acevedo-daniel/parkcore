import type { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import { errorResponse } from '../../docs/error-response.js';
import { updateProfileSchema, userResponseSchema } from './user.schema.js';

export function registerUserDocs(registry: OpenAPIRegistry): void {
  registry.registerPath({
    method: 'get',
    path: '/users/me',
    tags: ['User'],
    summary: 'Get Profile',
    description: 'Get current user profile information.',
    security: [{ bearerAuth: [] }],
    responses: {
      200: {
        description: 'Profile information',
        content: {
          'application/json': {
            schema: userResponseSchema,
          },
        },
      },
      401: errorResponse('Unauthorized - Invalid token'),
      404: errorResponse('User not found'),
    },
  });

  registry.registerPath({
    method: 'patch',
    path: '/users/me',
    tags: ['User'],
    summary: 'Update Profile',
    description: 'Update user profile information.',
    security: [{ bearerAuth: [] }],
    request: {
      body: {
        required: true,
        content: {
          'application/json': {
            schema: updateProfileSchema,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Profile updated successfully',
        content: {
          'application/json': {
            schema: userResponseSchema,
          },
        },
      },
      400: errorResponse('Validation error'),
      401: errorResponse('Unauthorized - Invalid token'),
    },
  });
}
