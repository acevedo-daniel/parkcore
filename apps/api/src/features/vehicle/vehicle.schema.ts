import { z } from 'zod';
import { normalizePlate } from './plate-normalization.js';

const vehicleTypes = ['CAR', 'MOTORCYCLE', 'LARGE'] as const;

const normalizedPlateSchema = z
  .string({ error: 'Required' })
  .transform(normalizePlate)
  .pipe(
    z
      .string()
      .min(4, { error: 'Min 4 alphanumeric characters' })
      .max(10, { error: 'Max 10 alphanumeric characters' }),
  );

export const vehicleIdentitySchema = z
  .strictObject({
    plate: normalizedPlateSchema.openapi({
      description: 'Vehicle license plate; normalized to uppercase alphanumeric characters',
      example: 'AB123CD',
    }),

    type: z
      .enum(vehicleTypes, { error: 'Invalid type' })
      .optional()
      .openapi({ description: 'Vehicle type', example: 'CAR' }),

    brand: z
      .string()
      .max(50, { error: 'Max 50 chars' })
      .trim()
      .optional()
      .openapi({ description: 'Vehicle brand', example: 'Toyota' }),

    model: z
      .string()
      .max(50, { error: 'Max 50 chars' })
      .trim()
      .optional()
      .openapi({ description: 'Vehicle model', example: 'Corolla' }),
  })
  .openapi('VehicleIdentityInput');

export type VehicleIdentityInput = z.infer<typeof vehicleIdentitySchema>;
