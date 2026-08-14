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

export const createVehicleSchema = z
  .strictObject({
    plate: normalizedPlateSchema.openapi({
      description: 'Vehicle license plate; normalized to uppercase alphanumeric characters',
      example: 'AB123CD',
    }),

    type: z
      .enum(vehicleTypes, { error: 'Invalid type' })
      .default('CAR')
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

    customerName: z
      .string()
      .max(100, { error: 'Max 100 chars' })
      .trim()
      .optional()
      .openapi({ description: 'Owner name', example: 'Jane Doe' }),

    customerPhone: z
      .string()
      .max(20, { error: 'Max 20 chars' })
      .trim()
      .optional()
      .openapi({ description: 'Owner phone', example: '+1234567890' }),

    notes: z
      .string()
      .max(500, { error: 'Max 500 chars' })
      .trim()
      .optional()
      .openapi({ description: 'Additional notes', example: 'Scratch on left door' }),
  })
  .openapi('CreateVehicleRequest');

export type CreateVehicle = z.infer<typeof createVehicleSchema>;
