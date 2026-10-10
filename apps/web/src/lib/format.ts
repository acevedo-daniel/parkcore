import { DEFAULT_LOCALE, type Locale } from './localization.js';

export const LONG_STAY_DISPLAY_HOURS = 48;

export function formatNumber(
  value: number,
  locale: Locale = DEFAULT_LOCALE,
  options?: Intl.NumberFormatOptions,
) {
  return new Intl.NumberFormat(locale, options).format(value);
}

export function formatMoney(
  cents: number,
  currency: 'ARS' | 'USD' = 'USD',
  locale: Locale = DEFAULT_LOCALE,
) {
  return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(cents / 100);
}

export function formatTimestamp(value: string, timezone?: string, locale: Locale = DEFAULT_LOCALE) {
  return new Intl.DateTimeFormat(locale, {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    ...(timezone ? { timeZone: timezone } : {}),
  }).format(new Date(value));
}

export function formatDuration(
  startTime: string,
  endTime = new Date().toISOString(),
  locale: Locale = DEFAULT_LOCALE,
) {
  const milliseconds = Math.max(0, new Date(endTime).getTime() - new Date(startTime).getTime());
  const hours = Math.floor(milliseconds / 3_600_000);
  if (hours >= LONG_STAY_DISPLAY_HOURS) return formatElapsedHours(hours, locale);

  const minutes = Math.floor((milliseconds % 3_600_000) / 60_000);
  const formatPart = (value: number) =>
    formatNumber(value, locale, { minimumIntegerDigits: 2, useGrouping: false });
  return `${formatPart(hours)}:${formatPart(minutes)}`;
}

export function formatElapsedHours(hours: number, locale: Locale) {
  const elapsedHours = Math.floor(hours);
  const formatUnit = (value: number, unit: 'day' | 'hour') =>
    new Intl.NumberFormat(locale, { style: 'unit', unit, unitDisplay: 'long' }).format(value);

  if (elapsedHours < LONG_STAY_DISPLAY_HOURS) return formatUnit(elapsedHours, 'hour');

  const days = Math.floor(elapsedHours / 24);
  const remainingHours = elapsedHours % 24;
  const parts = [formatUnit(days, 'day')];
  if (remainingHours > 0) parts.push(formatUnit(remainingHours, 'hour'));

  return new Intl.ListFormat(locale, { type: 'unit', style: 'long' }).format(parts);
}

export function checkoutPreview(startTime: string, hourlyRateCents: number) {
  const elapsedHours = (Date.now() - new Date(startTime).getTime()) / 3_600_000;
  const chargedHours = Math.max(1, Math.ceil(elapsedHours));
  return { chargedHours, totalAmountCents: chargedHours * hourlyRateCents };
}
