import { describe, expect, it } from 'vitest';
import { parkingSessionQuerySchema, vehicleLookupQuerySchema } from './parking-session.schema.js';

describe('parking session query schema', () => {
  it('normalizes plate filters and applies pagination and period defaults', () => {
    expect(
      parkingSessionQuerySchema.parse({ plate: ' ab-123 cd ', status: 'COMPLETED' }),
    ).toMatchObject({
      page: 1,
      limit: 10,
      plate: 'AB123CD',
      status: 'COMPLETED',
      period: '30d',
    });
  });

  it('accepts the canonical history periods', () => {
    expect(() => parkingSessionQuerySchema.parse({ period: 'today' })).not.toThrow();
    expect(parkingSessionQuerySchema.parse({ period: '7d' }).period).toBe('7d');
  });

  it('rejects arbitrary date-range filters', () => {
    expect(() => parkingSessionQuerySchema.parse({ dateFrom: '2026-02-01' })).toThrow();
  });

  it('normalizes returning vehicle lookup plates and requires five characters', () => {
    expect(vehicleLookupQuerySchema.parse({ plate: ' ab-123 cd ' })).toEqual({
      plate: 'AB123CD',
    });
    expect(() => vehicleLookupQuerySchema.parse({ plate: 'ab-12' })).toThrow();
    expect(() => vehicleLookupQuerySchema.parse({ plate: '12345678901' })).toThrow();
    expect(() => vehicleLookupQuerySchema.parse({ plate: '----' })).toThrow();
  });
});
