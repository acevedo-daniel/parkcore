import { z } from 'zod';
import type { User } from '../../../prisma/generated/client.js';

export const updateProfileSchema = z
  .strictObject({
    name: z
      .string({ error: 'Required' })
      .trim()
      .min(2, { error: 'Min 2 chars' })
      .max(50, { error: 'Max 50 chars' })
      .optional()
      .openapi({ description: 'User first name', example: 'John' }),

    lastName: z
      .string({ error: 'Required' })
      .trim()
      .min(2, { error: 'Min 2 chars' })
      .max(50, { error: 'Max 50 chars' })
      .optional()
      .openapi({ description: 'User last name', example: 'Doe' }),

    phone: z
      .string({ error: 'Required' })
      .trim()
      .min(8, { error: 'Min 8 chars' })
      .max(15, { error: 'Max 15 chars' })
      .regex(/^[0-9]+$/, { error: 'Numbers only' })
      .optional()
      .openapi({ description: 'User phone number', example: '1234567890' }),

    photoUrl: z
      .url({ error: 'Invalid URL' })
      .optional()
      .openapi({ description: 'Profile photo URL', example: 'https://example.com/me.jpg' }),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided',
  });

export const userResponseSchema = z
  .strictObject({
    id: z.uuid().openapi({ description: 'User UUID' }),
    email: z.email().openapi({ description: 'User email address' }),
    name: z.string().nullable().openapi({ description: 'First name' }),
    lastName: z.string().nullable().openapi({ description: 'Last name' }),
    phone: z.string().nullable().openapi({ description: 'Phone number' }),
    photoUrl: z.string().nullable().openapi({ description: 'Profile photo URL' }),
    createdAt: z.iso.datetime().openapi({ description: 'Creation time', format: 'date-time' }),
    updatedAt: z.iso.datetime().openapi({ description: 'Last update time', format: 'date-time' }),
  })
  .openapi('UserResponse');

export type UpdateProfile = z.infer<typeof updateProfileSchema>;
export type UserResponse = z.infer<typeof userResponseSchema>;

export const toUserResponse = (user: User): UserResponse => ({
  id: user.id,
  email: user.email,
  name: user.name,
  lastName: user.lastName,
  phone: user.phone,
  photoUrl: user.photoUrl,
  createdAt: user.createdAt.toISOString(),
  updatedAt: user.updatedAt.toISOString(),
});
