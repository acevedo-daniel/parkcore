import { z } from 'zod';
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

    pricePerHour: z
      .number({ error: 'Required' })
      .positive({ error: 'Must be positive' })
      .openapi({ description: 'Hourly rate in local currency', example: 15.5 }),

    totalSpaces: z
      .int({ error: 'Must be integer' })
      .positive({ error: 'Must be positive' })
      .openapi({ description: 'Total capacity', example: 100 }),

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
    minPrice: z.coerce
      .number()
      .positive()
      .optional()
      .openapi({ description: 'Minimum price filter' }),
    maxPrice: z.coerce
      .number()
      .positive()
      .optional()
      .openapi({ description: 'Maximum price filter' }),
    ownerId: z.uuid().optional().openapi({ description: 'Filter by owner ID' }),
  })
  .refine(
    ({ minPrice, maxPrice }) =>
      minPrice === undefined || maxPrice === undefined || minPrice <= maxPrice,
    {
      message: 'minPrice must be less than or equal to maxPrice',
      path: ['minPrice'],
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
    pricePerHour: z.number().openapi({ description: 'Price per hour' }),
    totalSpaces: z.number().openapi({ description: 'Total spaces' }),
    lat: z.number().openapi({ description: 'Latitude' }),
    lng: z.number().openapi({ description: 'Longitude' }),
    isActive: z.boolean().openapi({ description: 'Is active' }),
    ownerId: z.uuid().openapi({ description: 'Owner UUID' }),
    createdAt: z.date().openapi({ description: 'Creation date' }),
    updatedAt: z.date().openapi({ description: 'Update date' }),
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
export type ParkingParams = z.infer<typeof parkingParamsSchema>;
export type ParkingQuery = z.infer<typeof parkingQuerySchema>;
export type ParkingResponse = z.infer<typeof parkingResponseSchema>;
export type ParkingListResponse = z.infer<typeof parkingListResponseSchema>;
