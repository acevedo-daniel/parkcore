export const DEFAULT_TIMEZONE = 'America/Argentina/Buenos_Aires';

export const isValidIanaTimezone = (timezone: string): boolean => {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: timezone }).format();
    return true;
  } catch {
    return false;
  }
};
