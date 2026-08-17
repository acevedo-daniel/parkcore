import type { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import { errorResponse } from '../../docs/error-response.js';
import { authResponseSchema, loginSchema, registerSchema } from './auth.schema.js';

export function registerAuthDocs(registry: OpenAPIRegistry): void {
  registry.registerPath({
    method: 'post',
    path: '/auth/register',
    tags: ['Auth'],
    summary: 'Register',
    description: 'User registration.',
    request: {
      body: {
        required: true,
        content: {
          'application/json': {
            schema: registerSchema,
          },
        },
      },
    },
    responses: {
      201: {
        description: 'User successfully registered',
        content: {
          'application/json': {
            schema: authResponseSchema,
          },
        },
      },
      400: errorResponse('Validation error (e.g. invalid email or password)'),
      409: errorResponse('Email taken'),
      429: errorResponse('Too many requests'),
    },
  });

  registry.registerPath({
    method: 'post',
    path: '/auth/login',
    tags: ['Auth'],
    summary: 'Login',
    description: 'User authentication.',
    request: {
      body: {
        required: true,
        content: {
          'application/json': {
            schema: loginSchema,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Login successful',
        content: {
          'application/json': {
            schema: authResponseSchema,
          },
        },
      },
      400: errorResponse('Validation error'),
      401: errorResponse('Invalid credentials'),
      429: errorResponse('Too many requests'),
    },
  });
}
