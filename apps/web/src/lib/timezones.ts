const FALLBACK_TIMEZONES = [
  'America/Argentina/Buenos_Aires',
  'America/Los_Angeles',
  'America/New_York',
  'Asia/Tokyo',
  'Europe/London',
  'Europe/Madrid',
  'UTC',
] as const;

function isTimezone(value: string | undefined): value is string {
  return Boolean(value);
}

export function getTimezoneOptions(): string[] {
  const supportedValuesOf = Reflect.get(Intl, 'supportedValuesOf');
  const supported =
    typeof supportedValuesOf === 'function' ? supportedValuesOf.call(Intl, 'timeZone') : [];
  const current = Intl.DateTimeFormat().resolvedOptions().timeZone;
  return [...new Set([...FALLBACK_TIMEZONES, current, ...supported])]
    .filter(isTimezone)
    .sort((left, right) => left.localeCompare(right));
}
