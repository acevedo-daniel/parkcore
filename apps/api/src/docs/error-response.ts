import { z } from 'zod';

export const errorResponseSchema = z
  .strictObject({
    error: z.literal(true),
    message: z.string(),
    code: z.string().optional(),
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
