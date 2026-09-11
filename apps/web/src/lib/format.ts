import { DEFAULT_LOCALE, type Locale } from './localization.js';

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
  const minutes = Math.floor((milliseconds % 3_600_000) / 60_000);
  const formatPart = (value: number) =>
    formatNumber(value, locale, { minimumIntegerDigits: 2, useGrouping: false });
  return `${formatPart(hours)}:${formatPart(minutes)}`;
}

export function checkoutPreview(startTime: string, hourlyRateCents: number) {
  const elapsedHours = (Date.now() - new Date(startTime).getTime()) / 3_600_000;
  const chargedHours = Math.max(1, Math.ceil(elapsedHours));
  return { chargedHours, totalAmountCents: chargedHours * hourlyRateCents };
}
