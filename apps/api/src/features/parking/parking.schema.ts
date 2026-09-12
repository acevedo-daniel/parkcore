import { z } from 'zod';
import type { Parking } from '../../../prisma/generated/client.js';
import { supportedCurrencies } from '../../utils/currency.js';
import { paginationMetaSchema } from '../../utils/pagination.schema.js';
import {
  DEFAULT_TIMEZONE,
  getScheduleState,
  isValidIanaTimezone,
  validateDailySchedule,
} from '../../utils/timezone.js';

export type ParkingWithActiveSessionIds = Parking & {
  parkingSessions?: readonly { id: string }[];
};

export const parkingAvailabilityStates = ['AVAILABLE', 'LIMITED', 'FULL', 'CLOSED'] as const;
export const ownerParkingAvailabilityStates = [...parkingAvailabilityStates, 'PAUSED'] as const;

export type ParkingAvailabilityState = (typeof parkingAvailabilityStates)[number];
export type OwnerParkingAvailabilityState = (typeof ownerParkingAvailabilityStates)[number];

export interface ParkingAvailabilitySnapshot {
  activeSessionCount: number;
  availableSpaces: number;
  occupancyPercent: number;
  isOpen: boolean;
  availabilityState: ParkingAvailabilityState;
  nextOpeningAt: string | null;
}

export interface OwnerParkingOperationalSnapshot extends Omit<
  ParkingAvailabilitySnapshot,
  'availabilityState'
> {
  availabilityState: OwnerParkingAvailabilityState;
}

export const deriveParkingAvailabilitySnapshot = (
  parking: ParkingWithActiveSessionIds,
  now = new Date(),
): ParkingAvailabilitySnapshot => {
  const timezone = parking.timezone || DEFAULT_TIMEZONE;
  const schedule = getScheduleState(
    {
      timezone,
      is24Hours: parking.is24Hours,
      opensAt: parking.opensAt,
      closesAt: parking.closesAt,
    },
    now,
  );
  const capacity = Math.max(0, parking.capacity);
  const activeSessionCount = Math.min(parking.parkingSessions?.length ?? 0, capacity);
  const availableSpaces = Math.max(0, capacity - activeSessionCount);
  const occupancyPercent =
    capacity === 0 ? 0 : Math.min(100, (activeSessionCount / capacity) * 100);
  const availabilityState: ParkingAvailabilityState = !schedule.isOpen
    ? 'CLOSED'
    : availableSpaces === 0
      ? 'FULL'
      : occupancyPercent >= 80
        ? 'LIMITED'
        : 'AVAILABLE';

  return {
    activeSessionCount,
    availableSpaces,
    occupancyPercent,
    isOpen: schedule.isOpen,
    availabilityState,
    nextOpeningAt: schedule.nextOpeningAt?.toISOString() ?? null,
  };
};

export const deriveOwnerParkingSnapshot = (
  parking: ParkingWithActiveSessionIds,
  now = new Date(),
): OwnerParkingOperationalSnapshot => {
  const snapshot = deriveParkingAvailabilitySnapshot(parking, now);
  return {
    ...snapshot,
    availabilityState: parking.isActive ? snapshot.availabilityState : 'PAUSED',
  };
};

const localTimeSchema = z
  .string()
  .regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/, { error: 'Must use HH:mm' });

const scheduleFields = {
  timezone: z
    .string()
    .trim()
    .refine(isValidIanaTimezone, { error: 'Invalid IANA timezone' })
    .optional()
    .openapi({ description: 'IANA timezone used for local operations' }),
  is24Hours: z.boolean().openapi({ description: 'Whether the parking is open all day' }),
  opensAt: localTimeSchema
    .nullable()
    .optional()
    .openapi({ description: 'Local opening time in HH:mm' }),
  closesAt: localTimeSchema
    .nullable()
    .optional()
    .openapi({ description: 'Local closing time in HH:mm' }),
};

const validateScheduleShape = (
  value: Partial<{
    timezone: string;
    is24Hours: boolean;
    opensAt: string | null;
    closesAt: string | null;
  }>,
  ctx: z.RefinementCtx,
) => {
  if (value.is24Hours === undefined) return;
  const opensAt = value.opensAt ?? null;
  const closesAt = value.closesAt ?? null;
  const error = validateDailySchedule({
    timezone: value.timezone ?? DEFAULT_TIMEZONE,
    is24Hours: value.is24Hours,
    opensAt,
    closesAt,
  });
  if (error) ctx.addIssue({ code: 'custom', path: ['is24Hours'], message: error });
};

const parkingFields = {
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

  neighborhood: z
    .string({ error: 'Required' })
    .trim()
    .min(2, { error: 'Min 2 chars' })
    .max(100, { error: 'Max 100 chars' })
    .openapi({ description: 'Neighborhood or area', example: 'Palermo' }),

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

  ...scheduleFields,
};

export const createParkingSchema = z
  .strictObject({
    ...parkingFields,
    is24Hours: z
      .boolean()
      .default(true)
      .openapi({ description: 'Whether the parking is open all day' }),
    isListed: z
      .boolean()
      .default(false)
      .openapi({ description: 'Whether the facility is listed in public discovery' }),
  })
  .superRefine(validateScheduleShape)
  .openapi('CreateParkingRequest');

export const updateParkingSchema = z
  .strictObject(parkingFields)
  .partial()
  .extend({
    isActive: z
      .boolean()
      .optional()
      .openapi({ description: 'Whether the parking accepts check-ins' }),
    isListed: z
      .boolean()
      .optional()
      .openapi({ description: 'Whether the facility is listed in public discovery' }),
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
      .openapi({ description: 'Search term for title, neighborhood, or address' }),
    currency: z
      .enum(supportedCurrencies)
      .optional()
      .openapi({ description: 'Currency context for public price filtering' }),
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
    availableNow: z
      .enum(['true', 'false'])
      .transform((value) => value === 'true')
      .optional()
      .openapi({ description: 'Return only AVAILABLE or LIMITED facilities' }),
  })
  .superRefine((query, ctx) => {
    if (
      (query.minHourlyRateCents !== undefined || query.maxHourlyRateCents !== undefined) &&
      query.currency === undefined
    ) {
      ctx.addIssue({
        code: 'custom',
        path: ['currency'],
        message: 'Currency is required when filtering by price',
      });
    }
    if (
      query.minHourlyRateCents !== undefined &&
      query.maxHourlyRateCents !== undefined &&
      query.minHourlyRateCents > query.maxHourlyRateCents
    ) {
      ctx.addIssue({
        code: 'custom',
        path: ['minHourlyRateCents'],
        message: 'minHourlyRateCents must be less than or equal to maxHourlyRateCents',
      });
    }
  })
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
    neighborhood: z.string().openapi({ description: 'Neighborhood or area' }),
    timezone: z.string().openapi({ description: 'IANA timezone used for local operations' }),
    is24Hours: z.boolean().openapi({ description: 'Whether the parking is open all day' }),
    opensAt: z.string().nullable().openapi({ description: 'Local opening time in HH:mm' }),
    closesAt: z.string().nullable().openapi({ description: 'Local closing time in HH:mm' }),
    isListed: z.boolean().openapi({ description: 'Whether the facility is publicly listed' }),
    activeSessionCount: z
      .int()
      .nonnegative()
      .openapi({ description: 'Current active sessions in this facility' }),
    availableSpaces: z.int().nonnegative().openapi({ description: 'Current available spaces' }),
    occupancyPercent: z
      .number()
      .nonnegative()
      .max(100)
      .openapi({ description: 'Current occupancy percentage' }),
    isOpen: z.boolean().openapi({ description: 'Whether the facility schedule is open now' }),
    availabilityState: z
      .enum(ownerParkingAvailabilityStates)
      .openapi({ description: 'Derived owner operational state' }),
    nextOpeningAt: z.iso
      .datetime()
      .nullable()
      .openapi({ description: 'Next opening time as an ISO date-time' }),
    createdAt: z.iso.datetime().openapi({ description: 'Creation time', format: 'date-time' }),
    updatedAt: z.iso.datetime().openapi({ description: 'Last update time', format: 'date-time' }),
  })
  .openapi('ParkingResponse');

export const publicParkingResponseSchema = z
  .strictObject({
    id: z.uuid().openapi({ description: 'Parking UUID' }),
    title: z.string().openapi({ description: 'Parking title' }),
    description: z.string().nullable().openapi({ description: 'Description' }),
    image: z.string().nullable().openapi({ description: 'Image URL' }),
    neighborhood: z.string().openapi({ description: 'Neighborhood or area' }),
    address: z.string().openapi({ description: 'Address' }),
    hourlyRateCents: z.int().openapi({ description: 'Hourly rate in integer cents' }),
    currency: z.enum(supportedCurrencies).openapi({ description: 'Supported currency code' }),
    capacity: z.int().openapi({ description: 'Maximum simultaneous active vehicle stays' }),
    lat: z.number().openapi({ description: 'Latitude' }),
    lng: z.number().openapi({ description: 'Longitude' }),
    timezone: z.string().openapi({ description: 'IANA timezone used for local operations' }),
    is24Hours: z.boolean().openapi({ description: 'Whether the parking is open all day' }),
    opensAt: z.string().nullable().openapi({ description: 'Local opening time in HH:mm' }),
    closesAt: z.string().nullable().openapi({ description: 'Local closing time in HH:mm' }),
    isShowcase: z.boolean().openapi({ description: 'Whether this is fictional showcase data' }),
    isOpen: z.boolean().openapi({ description: 'Whether the facility is open now' }),
    availabilityState: z
      .enum(parkingAvailabilityStates)
      .openapi({ description: 'Derived public availability state' }),
    availableSpaces: z.int().nonnegative().openapi({ description: 'Current available spaces' }),
    occupancyPercent: z
      .number()
      .nonnegative()
      .max(100)
      .openapi({ description: 'Current occupancy' }),
    nextOpeningAt: z.iso
      .datetime()
      .nullable()
      .openapi({ description: 'Next opening time as an ISO date-time' }),
  })
  .openapi('PublicParkingResponse');

export const publicParkingListResponseSchema = z
  .strictObject({
    data: z.array(publicParkingResponseSchema),
    meta: paginationMetaSchema,
  })
  .openapi('PublicParkingListResponse');

export type CreateParking = z.infer<typeof createParkingSchema>;
export type UpdateParking = z.infer<typeof updateParkingSchema>;
export type ParkingQuery = z.infer<typeof parkingQuerySchema>;
export type ParkingResponse = z.infer<typeof parkingResponseSchema>;
export type PublicParkingResponse = z.infer<typeof publicParkingResponseSchema>;
export type PublicParkingListResponse = z.infer<typeof publicParkingListResponseSchema>;

export const toParkingResponse = (parking: ParkingWithActiveSessionIds): ParkingResponse => {
  const snapshot = deriveOwnerParkingSnapshot(parking);

  return {
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
    neighborhood: parking.neighborhood,
    timezone: parking.timezone || DEFAULT_TIMEZONE,
    is24Hours: parking.is24Hours,
    opensAt: parking.opensAt,
    closesAt: parking.closesAt,
    isListed: parking.isListed,
    ...snapshot,
    createdAt: parking.createdAt.toISOString(),
    updatedAt: parking.updatedAt.toISOString(),
  };
};
