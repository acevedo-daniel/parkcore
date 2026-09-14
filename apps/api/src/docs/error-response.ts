import { z } from 'zod';

export const errorDetailsSchema = z
  .strictObject({
    nextOpeningAt: z.iso.datetime().nullable().optional().openapi({
      description: 'Authoritative next opening time when a parking is currently closed',
    }),
  })
  .openapi('ErrorDetails');

export const errorResponseSchema = z
  .strictObject({
    error: z.literal(true),
    message: z.string(),
    code: z.string().optional(),
    details: errorDetailsSchema.optional(),
  })
  .openapi('ErrorResponse');

export const errorJsonContent = {
  'application/json': {
    schema: errorResponseSchema,
  },
} as const;

export function errorResponse(description: string) {
  return {
    description,
    content: errorJsonContent,
  };
}
