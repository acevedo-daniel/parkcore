import { z } from 'zod';
import { supportedCurrencies } from '../../utils/currency.js';

const currencySchema = z.enum(supportedCurrencies);

export const analyticsQuerySchema = z
  .strictObject({
    days: z.coerce
      .number()
      .int()
      .refine((value) => value === 7 || value === 30, {
        message: 'Days must be 7 or 30',
      })
      .default(30)
      .openapi({ description: 'Number of days in the analytics window', example: 30 }),
  })
  .openapi('AnalyticsQuery');

const facilityAnalyticsSchema = z
  .strictObject({
    parkingId: z.uuid().openapi({ description: 'Parking UUID' }),
    title: z.string().openapi({ description: 'Parking title' }),
    isActive: z.boolean().openapi({ description: 'Whether the facility accepts check-ins' }),
    activeVehicles: z.int().nonnegative().openapi({ description: 'Current active sessions' }),
    capacity: z.int().nonnegative().openapi({ description: 'Maximum active sessions' }),
    occupancyPercent: z
      .number()
      .nonnegative()
      .max(100)
      .openapi({ description: 'Occupancy percentage' }),
    completedSessions: z
      .int()
      .nonnegative()
      .openapi({ description: 'Completed sessions in the selected window' }),
    revenueCents: z
      .int()
      .nonnegative()
      .openapi({ description: 'Completed revenue in integer cents' }),
    currency: currencySchema.openapi({ description: 'Revenue currency' }),
  })
  .openapi('FacilityAnalytics');

export const analyticsSummaryResponseSchema = z
  .strictObject({
    activeVehicles: z.int().nonnegative(),
    totalCapacity: z.int().nonnegative(),
    occupancyPercent: z.number().nonnegative().max(100),
    completedToday: z.int().nonnegative(),
    revenueTodayCents: z.int().nonnegative(),
    currency: currencySchema,
    facilities: z.array(facilityAnalyticsSchema),
  })
  .openapi('AnalyticsSummaryResponse');

export const analyticsRevenueResponseSchema = z
  .strictObject({
    days: z.union([z.literal(7), z.literal(30)]),
    currency: currencySchema,
    data: z.array(
      z.strictObject({
        date: z.iso.date(),
        revenueCents: z.int().nonnegative(),
      }),
    ),
  })
  .openapi('AnalyticsRevenueResponse');

export const analyticsVolumeResponseSchema = z
  .strictObject({
    days: z.union([z.literal(7), z.literal(30)]),
    data: z.array(
      z.strictObject({
        date: z.iso.date(),
        completedSessions: z.int().nonnegative(),
      }),
    ),
  })
  .openapi('AnalyticsVolumeResponse');

export const analyticsFacilitiesResponseSchema = z
  .strictObject({
    days: z.union([z.literal(7), z.literal(30)]),
    data: z.array(facilityAnalyticsSchema),
  })
  .openapi('AnalyticsFacilitiesResponse');

export type AnalyticsQuery = z.infer<typeof analyticsQuerySchema>;
export type AnalyticsFacility = z.infer<typeof facilityAnalyticsSchema>;
