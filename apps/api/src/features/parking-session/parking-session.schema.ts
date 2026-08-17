import type { ParkingSession, Vehicle } from '../../../prisma/generated/client.js';
import { z } from 'zod';
import { supportedCurrencies } from '../../utils/currency.js';
import { paginationMetaSchema } from '../../utils/pagination.schema.js';
import { vehicleIdentitySchema } from '../vehicle/vehicle.schema.js';

const parkingSessionStatusSchema = z.enum(['ACTIVE', 'COMPLETED', 'CANCELLED']);
const currencySchema = z.enum(supportedCurrencies);
const dateTimeSchema = z.iso.datetime().openapi({ format: 'date-time' });

export const checkInSchema = vehicleIdentitySchema
  .extend({
    customerName: z
      .string()
      .max(100, { error: 'Max 100 chars' })
      .trim()
      .optional()
      .openapi({ description: 'Visitor name for this stay', example: 'Jane Doe' }),
    customerPhone: z
      .string()
      .max(20, { error: 'Max 20 chars' })
      .trim()
      .optional()
      .openapi({ description: 'Visitor phone for this stay', example: '+1234567890' }),
    notes: z
      .string()
      .max(500, { error: 'Max 500 chars' })
      .trim()
      .optional()
      .openapi({ description: 'Operational notes for this stay', example: 'Scratch on left door' }),
  })
  .openapi('CheckInRequest');

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

export const vehicleSummarySchema = z
  .strictObject({
    id: z.uuid().openapi({ description: 'Vehicle UUID' }),
    plate: z.string().openapi({ description: 'Normalized parking-scoped plate' }),
    type: z.enum(['CAR', 'MOTORCYCLE', 'LARGE']).openapi({ description: 'Vehicle type' }),
    brand: z.string().nullable().openapi({ description: 'Vehicle brand' }),
    model: z.string().nullable().openapi({ description: 'Vehicle model' }),
  })
  .openapi('VehicleSummary');

export const parkingSessionResponseSchema = z
  .strictObject({
    id: z.uuid().openapi({ description: 'Parking session UUID' }),
    startTime: dateTimeSchema.openapi({ description: 'Check-in time' }),
    endTime: dateTimeSchema.nullable().openapi({ description: 'Check-out time' }),
    hourlyRateCents: z.int().openapi({ description: 'Hourly rate snapshot in integer cents' }),
    currency: currencySchema.openapi({
      description: 'Supported currency snapshot',
      example: 'USD',
    }),
    totalAmountCents: z
      .int()
      .nullable()
      .openapi({ description: 'Final amount in integer cents; present after checkout' }),
    status: parkingSessionStatusSchema.openapi({ description: 'Parking session status' }),
    parkingId: z.uuid().openapi({ description: 'Parking UUID' }),
    vehicleId: z.uuid().openapi({ description: 'Vehicle UUID' }),
    customerName: z.string().nullable().openapi({ description: 'Visitor name for this stay' }),
    customerPhone: z.string().nullable().openapi({ description: 'Visitor phone for this stay' }),
    notes: z.string().nullable().openapi({ description: 'Operational notes for this stay' }),
    createdAt: dateTimeSchema.openapi({ description: 'Creation time' }),
    updatedAt: dateTimeSchema.openapi({ description: 'Last update time' }),
    vehicle: vehicleSummarySchema,
  })
  .openapi('ParkingSessionResponse');

export const parkingSessionListResponseSchema = z
  .strictObject({ data: z.array(parkingSessionResponseSchema), meta: paginationMetaSchema })
  .openapi('ParkingSessionListResponse');

export type CheckIn = z.infer<typeof checkInSchema>;
export type ParkingSessionQuery = z.infer<typeof parkingSessionQuerySchema>;
export type ParkingSessionResponse = z.infer<typeof parkingSessionResponseSchema>;
export type VisitData = Pick<CheckIn, 'customerName' | 'customerPhone' | 'notes'>;

type ParkingSessionForResponse = Pick<
  ParkingSession,
  | 'id'
  | 'startTime'
  | 'endTime'
  | 'hourlyRateCents'
  | 'currency'
  | 'totalAmountCents'
  | 'status'
  | 'parkingId'
  | 'vehicleId'
  | 'customerName'
  | 'customerPhone'
  | 'notes'
  | 'createdAt'
  | 'updatedAt'
> & {
  vehicle: Pick<Vehicle, 'id' | 'plate' | 'type' | 'brand' | 'model'>;
};

export function toParkingSessionResponse(
  session: ParkingSessionForResponse,
): ParkingSessionResponse {
  return {
    id: session.id,
    startTime: session.startTime.toISOString(),
    endTime: session.endTime?.toISOString() ?? null,
    hourlyRateCents: session.hourlyRateCents,
    currency: session.currency,
    totalAmountCents: session.totalAmountCents,
    status: session.status,
    parkingId: session.parkingId,
    vehicleId: session.vehicleId,
    customerName: session.customerName,
    customerPhone: session.customerPhone,
    notes: session.notes,
    createdAt: session.createdAt.toISOString(),
    updatedAt: session.updatedAt.toISOString(),
    vehicle: {
      id: session.vehicle.id,
      plate: session.vehicle.plate,
      type: session.vehicle.type,
      brand: session.vehicle.brand,
      model: session.vehicle.model,
    },
  };
}
