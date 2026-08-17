import { z } from 'zod';

export const paginationMetaSchema = z.strictObject({
  page: z.int().positive().openapi({ description: 'Current page number', example: 1 }),
  limit: z.int().positive().openapi({ description: 'Items per page', example: 10 }),
  total: z.int().nonnegative().openapi({ description: 'Total items', example: 50 }),
  totalPages: z.int().nonnegative().openapi({ description: 'Total pages', example: 5 }),
  hasNextPage: z.boolean().openapi({ description: 'Has next page', example: true }),
  hasPreviousPage: z.boolean().openapi({ description: 'Has previous page', example: false }),
});
