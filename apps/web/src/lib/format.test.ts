import { describe, expect, it } from 'vitest';

import { formatDuration, formatMoney, formatNumber, formatTimestamp } from './format.js';

describe('locale-aware formatters', () => {
  it('formats ARS and USD with the selected locale', () => {
    expect(formatMoney(1550, 'ARS', 'es-AR')).toContain('15,50');
    expect(formatMoney(1550, 'USD', 'en-US')).toContain('15.50');
  });

  it('formats numbers and timestamps without reading document language', () => {
    expect(formatNumber(1234567.5, 'es-AR')).toContain('1.234.567,5');
    expect(formatNumber(1234567.5, 'en-US')).toContain('1,234,567.5');
    expect(formatTimestamp('2026-01-15T15:04:00Z', 'UTC', 'es-AR')).toContain('ene');
    expect(formatTimestamp('2026-01-15T15:04:00Z', 'UTC', 'en-US')).toContain('Jan');
  });

  it('formats durations with the typed locale contract', () => {
    expect(formatDuration('2026-01-15T15:00:00Z', '2026-01-15T16:05:00Z', 'es-AR')).toBe('01:05');
    expect(formatDuration('2026-01-15T15:00:00Z', '2026-01-15T16:05:00Z', 'en-US')).toBe('01:05');
  });
});
