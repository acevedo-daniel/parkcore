import type { ParkingSession } from '../../../prisma/generated/client.js';
import { z } from 'zod';
import { paginationMetaSchema } from '../../utils/pagination.schema.js';
import { createVehicleSchema } from '../vehicle/vehicle.schema.js';

const parkingSessionStatusSchema = z.enum(['ACTIVE', 'COMPLETED', 'CANCELLED']);

export const checkInSchema = createVehicleSchema;

export const parkingParamsSchema = z.strictObject({
  parkingId: z.uuid({ error: 'Invalid ID' }).openapi({ description: 'Parking UUID' }),
});

export const parkingSessionParamsSchema = z.strictObject({
  sessionId: z.uuid({ error: 'Invalid ID' }).openapi({ description: 'Parking session UUID' }),
});

export const parkingSessionQuerySchema = z.strictObject({
  page: z.coerce
    .number()
    .int()
    .positive()
    .default(1)
    .openapi({ description: 'Page number', example: 1 }),
  limit: z.coerce
    .number()
    .int()
    .positive()
    .max(100)
    .default(10)
    .openapi({ description: 'Items per page', example: 10 }),
  status: parkingSessionStatusSchema
    .optional()
    .openapi({ description: 'Filter by session status', example: 'ACTIVE' }),
});

export const parkingSessionResponseSchema = z
  .strictObject({
    id: z.uuid().openapi({ description: 'Parking session UUID' }),
    startTime: z.date().openapi({ description: 'Check-in time' }),
    endTime: z.date().nullable().openapi({ description: 'Check-out time' }),
    hourlyRateCents: z.int().openapi({ description: 'Hourly rate snapshot in integer cents' }),
    currency: z.string().openapi({ description: 'ISO 4217 currency snapshot' }),
    totalAmountCents: z
      .int()
      .nullable()
      .openapi({ description: 'Final amount in integer cents; present after checkout' }),
    status: parkingSessionStatusSchema.openapi({ description: 'Parking session status' }),
    parkingId: z.uuid().openapi({ description: 'Parking UUID' }),
    vehicleId: z.uuid().openapi({ description: 'Vehicle UUID' }),
    createdAt: z.date().openapi({ description: 'Creation date' }),
    updatedAt: z.date().openapi({ description: 'Update date' }),
  })
  .openapi('ParkingSessionResponse');

export const parkingSessionListResponseSchema = z
  .strictObject({
    data: z.array(parkingSessionResponseSchema),
    meta: paginationMetaSchema,
  })
  .openapi('ParkingSessionListResponse');

export type CheckIn = z.infer<typeof checkInSchema>;
export type ParkingSessionQuery = z.infer<typeof parkingSessionQuerySchema>;
export type ParkingParams = z.infer<typeof parkingParamsSchema>;
export type ParkingSessionParams = z.infer<typeof parkingSessionParamsSchema>;
export type ParkingSessionResponse = z.infer<typeof parkingSessionResponseSchema>;

export function toParkingSessionResponse(session: ParkingSession): ParkingSessionResponse {
  return {
    id: session.id,
    startTime: session.startTime,
    endTime: session.endTime,
    hourlyRateCents: session.hourlyRateCents,
    currency: session.currency,
    totalAmountCents: session.totalAmountCents,
    status: session.status,
    parkingId: session.parkingId,
    vehicleId: session.vehicleId,
    createdAt: session.createdAt,
    updatedAt: session.updatedAt,
  };
}
