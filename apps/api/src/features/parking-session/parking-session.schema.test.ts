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
});
