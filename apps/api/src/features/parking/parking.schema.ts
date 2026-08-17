import { z } from 'zod';
import type { Parking } from '../../../prisma/generated/client.js';
import { supportedCurrencies } from '../../utils/currency.js';
import { paginationMetaSchema } from '../../utils/pagination.schema.js';

export const createParkingSchema = z
  .strictObject({
    title: z
      .string({ error: 'Required' })
      .trim()
      .min(5, { error: 'Min 5 chars' })
      .max(100, { error: 'Max 100 chars' })
      .openapi({
        description: 'Business name of the parking facility',
        example: 'Central Parking',
      }),

    description: z
      .string()
      .trim()
      .max(500, { error: 'Max 500 chars' })
      .optional()
      .openapi({ description: 'Optional description of the facility' }),

    address: z
      .string({ error: 'Required' })
      .trim()
      .min(5, { error: 'Min 5 chars' })
      .max(200, { error: 'Max 200 chars' })
      .openapi({ description: 'Full street address', example: '123 Main Street' }),

    image: z.url({ error: 'Invalid URL' }).optional().openapi({
      description: 'URL of the parking facility image',
      example: 'https://example.com/parking.jpg',
    }),

    hourlyRateCents: z
      .int({ error: 'Must be integer' })
      .positive({ error: 'Must be positive' })
      .openapi({ description: 'Hourly rate in integer cents', example: 1550 }),

    currency: z
      .enum(supportedCurrencies, { error: 'Unsupported currency' })
      .openapi({ description: 'Supported currency code', example: 'USD' }),

    capacity: z
      .int({ error: 'Must be integer' })
      .positive({ error: 'Must be positive' })
      .openapi({ description: 'Maximum simultaneous active vehicle stays', example: 100 }),

    lat: z
      .number({ error: 'Required' })
      .min(-90, { error: 'Invalid latitude' })
      .max(90, { error: 'Invalid latitude' })
      .openapi({ description: 'Geographic latitude', example: -34.6037 }),

    lng: z
      .number({ error: 'Required' })
      .min(-180, { error: 'Invalid longitude' })
      .max(180, { error: 'Invalid longitude' })
      .openapi({ description: 'Geographic longitude', example: -58.3816 }),
  })
  .openapi('CreateParkingRequest');

export const updateParkingSchema = z
  .strictObject({
    ...createParkingSchema.partial().shape,
    isActive: z
      .boolean()
      .optional()
      .openapi({ description: 'Whether the parking accepts check-ins' }),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided',
  })
  .openapi('UpdateParkingRequest');

export const parkingParamsSchema = z.strictObject({
  id: z.uuid({ error: 'Invalid parking ID' }).openapi({ description: 'Unique parking ID (UUID)' }),
});

export const parkingQuerySchema = z
  .strictObject({
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
    search: z
      .string()
      .trim()
      .min(1, { error: 'Search must not be empty' })
      .optional()
      .openapi({ description: 'Search term for title or address' }),
    minHourlyRateCents: z.coerce
      .number()
      .int()
      .positive()
      .optional()
      .openapi({ description: 'Minimum hourly rate in cents' }),
    maxHourlyRateCents: z.coerce
      .number()
      .int()
      .positive()
      .optional()
      .openapi({ description: 'Maximum hourly rate in cents' }),
    ownerId: z.uuid().optional().openapi({ description: 'Filter by owner ID' }),
  })
  .refine(
    ({ minHourlyRateCents, maxHourlyRateCents }) =>
      minHourlyRateCents === undefined ||
      maxHourlyRateCents === undefined ||
      minHourlyRateCents <= maxHourlyRateCents,
    {
      message: 'minHourlyRateCents must be less than or equal to maxHourlyRateCents',
      path: ['minHourlyRateCents'],
    },
  )
  .openapi('ParkingQuery');

export const parkingResponseSchema = z
  .strictObject({
    id: z.uuid().openapi({ description: 'Parking UUID' }),
    title: z.string().openapi({ description: 'Parking title' }),
    description: z.string().nullable().openapi({ description: 'Description' }),
    image: z.string().nullable().openapi({ description: 'Image URL' }),
    address: z.string().openapi({ description: 'Address' }),
    hourlyRateCents: z.int().openapi({ description: 'Hourly rate in integer cents' }),
    currency: z.enum(supportedCurrencies).openapi({ description: 'Supported currency code' }),
    capacity: z.int().openapi({ description: 'Maximum simultaneous active vehicle stays' }),
    lat: z.number().openapi({ description: 'Latitude' }),
    lng: z.number().openapi({ description: 'Longitude' }),
    isActive: z.boolean().openapi({ description: 'Is active' }),
    ownerId: z.uuid().openapi({ description: 'Owner UUID' }),
    createdAt: z.iso.datetime().openapi({ description: 'Creation time', format: 'date-time' }),
    updatedAt: z.iso.datetime().openapi({ description: 'Last update time', format: 'date-time' }),
  })
  .openapi('ParkingResponse');

export const parkingListResponseSchema = z
  .strictObject({
    data: z.array(parkingResponseSchema),
    meta: paginationMetaSchema,
  })
  .openapi('ParkingListResponse');

export type CreateParking = z.infer<typeof createParkingSchema>;
export type UpdateParking = z.infer<typeof updateParkingSchema>;
export type ParkingQuery = z.infer<typeof parkingQuerySchema>;
export type ParkingResponse = z.infer<typeof parkingResponseSchema>;
export type ParkingListResponse = z.infer<typeof parkingListResponseSchema>;

export const toParkingResponse = (parking: Parking): ParkingResponse => ({
  id: parking.id,
  title: parking.title,
  description: parking.description,
  image: parking.image,
  address: parking.address,
  hourlyRateCents: parking.hourlyRateCents,
  currency: parking.currency,
  capacity: parking.capacity,
  lat: parking.lat,
  lng: parking.lng,
  isActive: parking.isActive,
  ownerId: parking.ownerId,
  createdAt: parking.createdAt.toISOString(),
  updatedAt: parking.updatedAt.toISOString(),
});
