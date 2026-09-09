import { describe, expect, it } from 'vitest';
import { parkingSessionQuerySchema } from './parking-session.schema.js';

describe('parking session query schema', () => {
  it('normalizes plate filters and applies pagination defaults', () => {
    expect(
      parkingSessionQuerySchema.parse({ plate: ' ab-123 cd ', status: 'COMPLETED' }),
    ).toMatchObject({
      page: 1,
      limit: 10,
      plate: 'AB123CD',
      status: 'COMPLETED',
    });
  });

  it('rejects a reversed date range', () => {
    expect(() =>
      parkingSessionQuerySchema.parse({
        dateFrom: '2026-02-28T00:00:00.000Z',
        dateTo: '2026-02-01T00:00:00.000Z',
      }),
    ).toThrow('dateFrom must be less than or equal to dateTo');
  });

  it('accepts date-only filters for history queries', () => {
    expect(
      parkingSessionQuerySchema.parse({
        dateFrom: '2026-02-01',
        dateTo: '2026-02-28',
      }),
    ).toMatchObject({ dateFrom: '2026-02-01', dateTo: '2026-02-28' });
  });

  it('compares mixed date-only and date-time filters by instant', () => {
    expect(
      parkingSessionQuerySchema.parse({
        dateFrom: '2026-02-01',
        dateTo: '2026-02-01T23:59:59.000Z',
      }),
    ).toMatchObject({ dateFrom: '2026-02-01', dateTo: '2026-02-01T23:59:59.000Z' });
  });
});
