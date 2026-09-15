import { describe, expect, it } from 'vitest';

import {
  parkingHistorySearchParamsFromState,
  parseParkingHistoryUrlState,
} from './parking-history-query.js';

describe('parking history URL state', () => {
  it('normalizes supported filters and removes default values when serializing', () => {
    const state = parseParkingHistoryUrlState(
      new URLSearchParams('page=3&plate=%20ab-123%20cd&status=COMPLETED&period=7d'),
    );

    expect(state).toEqual({
      page: 3,
      period: '7d',
      plate: 'AB123CD',
      status: 'COMPLETED',
    });
    expect(parkingHistorySearchParamsFromState(state).toString()).toBe(
      'plate=AB123CD&status=COMPLETED&period=7d&page=3',
    );
  });

  it('falls back to a safe default for invalid state', () => {
    const state = parseParkingHistoryUrlState(
      new URLSearchParams('page=0&plate=---&status=UNKNOWN&period=year'),
    );

    expect(state).toEqual({ page: 1, period: '30d' });
    expect(parkingHistorySearchParamsFromState(state).toString()).toBe('');
  });
});
