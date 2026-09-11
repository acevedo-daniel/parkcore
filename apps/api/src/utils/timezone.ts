export const DEFAULT_TIMEZONE = 'America/Argentina/Buenos_Aires';

export const isValidIanaTimezone = (timezone: string): boolean => {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: timezone }).format();
    return true;
  } catch {
    return false;
  }
};

export interface DailySchedule {
  timezone: string;
  is24Hours: boolean;
  opensAt: string | null;
  closesAt: string | null;
}

export interface ScheduleState {
  isOpen: boolean;
  nextOpeningAt: Date | null;
}

const timePattern = /^(?:[01]\d|2[0-3]):[0-5]\d$/;

export const isValidLocalTime = (value: string): boolean => timePattern.test(value);

export const validateDailySchedule = (schedule: DailySchedule): string | null => {
  if (!isValidIanaTimezone(schedule.timezone)) return 'Invalid IANA timezone';

  if (schedule.is24Hours) {
    return schedule.opensAt === null && schedule.closesAt === null
      ? null
      : '24-hour parking must not define opening or closing times';
  }

  if (!schedule.opensAt || !schedule.closesAt) {
    return 'Scheduled parking requires opening and closing times';
  }

  if (!isValidLocalTime(schedule.opensAt) || !isValidLocalTime(schedule.closesAt)) {
    return 'Opening and closing times must use HH:mm';
  }

  if (schedule.opensAt === schedule.closesAt) {
    return 'Opening and closing times cannot be equal';
  }

  return null;
};

interface LocalDateTimeParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
}

const localDateTimeFormatter = (timezone: string) =>
  new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  });

const localParts = (date: Date, timezone: string): LocalDateTimeParts => {
  const parts = Object.fromEntries(
    localDateTimeFormatter(timezone)
      .formatToParts(date)
      .filter(({ type }) => type !== 'literal')
      .map(({ type, value }) => [type, Number(value)]),
  ) as Record<string, number>;

  return {
    year: parts.year,
    month: parts.month,
    day: parts.day,
    hour: parts.hour,
    minute: parts.minute,
  };
};

const localDateTimeToUtc = (parts: LocalDateTimeParts, timezone: string): Date => {
  let guess = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute);

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const actual = localParts(new Date(guess), timezone);
    const targetMillis = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute);
    const actualMillis = Date.UTC(
      actual.year,
      actual.month - 1,
      actual.day,
      actual.hour,
      actual.minute,
    );
    guess += targetMillis - actualMillis;
  }

  return new Date(guess);
};

const parseLocalTime = (value: string): number => {
  const [hours, minutes] = value.split(':').map(Number);
  return hours * 60 + minutes;
};

const nextLocalDay = (parts: LocalDateTimeParts): LocalDateTimeParts => {
  const next = new Date(Date.UTC(parts.year, parts.month - 1, parts.day + 1));
  return {
    ...parts,
    year: next.getUTCFullYear(),
    month: next.getUTCMonth() + 1,
    day: next.getUTCDate(),
  };
};

export const getScheduleState = (schedule: DailySchedule, now = new Date()): ScheduleState => {
  const validationError = validateDailySchedule(schedule);
  if (validationError) throw new Error(validationError);
  if (schedule.is24Hours) return { isOpen: true, nextOpeningAt: null };
  if (!schedule.opensAt || !schedule.closesAt) {
    throw new Error('Scheduled parking requires opening and closing times');
  }

  const current = localParts(now, schedule.timezone);
  const currentMinutes = current.hour * 60 + current.minute;
  const opensAt = parseLocalTime(schedule.opensAt);
  const closesAt = parseLocalTime(schedule.closesAt);
  const isOpen =
    closesAt > opensAt
      ? currentMinutes >= opensAt && currentMinutes < closesAt
      : currentMinutes >= opensAt || currentMinutes < closesAt;

  if (isOpen) return { isOpen: true, nextOpeningAt: null };

  const openingDay =
    closesAt > opensAt
      ? currentMinutes < opensAt
        ? current
        : nextLocalDay(current)
      : currentMinutes >= closesAt && currentMinutes < opensAt
        ? current
        : nextLocalDay(current);

  return {
    isOpen: false,
    nextOpeningAt: localDateTimeToUtc(
      { ...openingDay, hour: Math.floor(opensAt / 60), minute: opensAt % 60 },
      schedule.timezone,
    ),
  };
};

export const isParkingOpen = (schedule: DailySchedule, now = new Date()): boolean =>
  getScheduleState(schedule, now).isOpen;
