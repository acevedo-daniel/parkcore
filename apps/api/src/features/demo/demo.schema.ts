import { z } from 'zod';

import { authResponseSchema } from '../auth/auth.schema.js';

export const demoStatusResponseSchema = z
  .strictObject({
    available: z.boolean().openapi({
      description: 'Whether one-click isolated demo sandbox creation is currently available',
    }),
  })
  .openapi('DemoStatusResponse');

export const demoResetResponseSchema = z
  .strictObject({
    restored: z.literal(true).openapi({ description: 'Canonical demo data was restored' }),
  })
  .openapi('DemoResetResponse');

export type DemoStatusResponse = z.infer<typeof demoStatusResponseSchema>;
export type DemoResetResponse = z.infer<typeof demoResetResponseSchema>;
export type DemoLoginResponse = z.infer<typeof authResponseSchema>;
