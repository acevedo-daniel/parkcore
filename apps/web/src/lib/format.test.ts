import { describe, expect, it } from 'vitest';

import {
  formatDuration,
  formatElapsedHours,
  formatMoney,
  formatNumber,
  formatTimestamp,
} from './format.js';

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

  it('keeps durations concise below 48 hours and reads longer stays in days and hours', () => {
    const startTime = '2026-01-15T15:00:00Z';

    expect(formatDuration(startTime, '2026-01-17T14:59:00Z', 'es-AR')).toBe('47:59');
    expect(formatDuration(startTime, '2026-01-17T14:59:00Z', 'en-US')).toBe('47:59');
    expect(formatDuration(startTime, '2026-01-17T15:00:00Z', 'es-AR')).toBe('2 días');
    expect(formatDuration(startTime, '2026-01-17T15:00:00Z', 'en-US')).toBe('2 days');
    expect(formatDuration(startTime, '2026-01-17T16:30:00Z', 'es-AR')).toBe('2 días y 1 hora');
    expect(formatDuration(startTime, '2026-01-17T16:30:00Z', 'en-US')).toBe('2 days, 1 hour');
    expect(formatDuration(startTime, '2026-01-18T15:00:00Z', 'es-AR')).toBe('3 días');
    expect(formatDuration(startTime, '2026-01-18T15:00:00Z', 'en-US')).toBe('3 days');
  });

  it('formats floored elapsed hours and locale-aware long durations', () => {
    expect(formatElapsedHours(1, 'es-AR')).toBe('1 hora');
    expect(formatElapsedHours(1, 'en-US')).toBe('1 hour');
    expect(formatElapsedHours(9.9, 'es-AR')).toBe('9 horas');
    expect(formatElapsedHours(9.9, 'en-US')).toBe('9 hours');
    expect(formatElapsedHours(1_000 * 24 + 23, 'es-AR')).toBe('1.000 días y 23 horas');
    expect(formatElapsedHours(1_000 * 24 + 23, 'en-US')).toBe('1,000 days, 23 hours');
  });
});
