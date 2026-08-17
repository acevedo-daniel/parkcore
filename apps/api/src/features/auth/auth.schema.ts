import { z } from 'zod';
import { userResponseSchema } from '../user/user.schema.js';

export const registerSchema = z
  .strictObject({
    email: z
      .string({ error: 'Required' })
      .trim()
      .toLowerCase()
      .pipe(z.email({ error: 'Invalid email' }))
      .openapi({ description: 'User email address', example: 'user@example.com' }),

    password: z
      .string({ error: 'Required' })
      .min(8, { error: 'Min 8 chars' })
      .max(100, { error: 'Max 100 chars' })
      .openapi({ description: 'Password', example: 'Str0ngP@ssw0rd!' }),

    name: z
      .string()
      .trim()
      .min(2, { error: 'Min 2 chars' })
      .max(50, { error: 'Max 50 chars' })
      .optional()
      .openapi({ description: 'User display name', example: 'John Doe' }),
  })
  .openapi('RegisterRequest');

export const loginSchema = z
  .strictObject({
    email: z
      .string({ error: 'Required' })
      .trim()
      .toLowerCase()
      .pipe(z.email({ error: 'Invalid email' }))
      .openapi({ description: 'User email address', example: 'user@example.com' }),

    password: z
      .string({ error: 'Required' })
      .min(8, { error: 'Min 8 chars' })
      .max(100, { error: 'Max 100 chars' })
      .openapi({ description: 'Password', example: 'Str0ngP@ssw0rd!' }),
  })
  .openapi('LoginRequest');

export const authResponseSchema = z
  .strictObject({
    user: userResponseSchema,
    accessToken: z.string().openapi({
      description: 'JWT access token',
      example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    }),
  })
  .openapi('AuthResponse');

export type Register = z.infer<typeof registerSchema>;
export type Login = z.infer<typeof loginSchema>;
export type AuthResponse = z.infer<typeof authResponseSchema>;
