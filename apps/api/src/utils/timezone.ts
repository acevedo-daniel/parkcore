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

export type CalendarPeriod = 'today' | '7d' | '30d';

const periodDays: Record<CalendarPeriod, number> = {
  today: 1,
  '7d': 7,
  '30d': 30,
};

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

export const getLocalDateParts = (date: Date, timezone: string): LocalDateTimeParts => {
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
    const actual = getLocalDateParts(new Date(guess), timezone);
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

const shiftLocalDate = (parts: LocalDateTimeParts, days: number): LocalDateTimeParts => {
  const shifted = new Date(Date.UTC(parts.year, parts.month - 1, parts.day + days));
  return {
    ...parts,
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth() + 1,
    day: shifted.getUTCDate(),
  };
};

export const getLocalDateKey = (date: Date, timezone: string): string => {
  const parts = getLocalDateParts(date, timezone);
  return [parts.year, parts.month, parts.day]
    .map((value, index) => String(value).padStart(index === 0 ? 4 : 2, '0'))
    .join('-');
};

export const getLocalDateKeys = (days: number, timezone: string, now = new Date()): string[] => {
  const current = getLocalDateParts(now, timezone);
  const first = shiftLocalDate(current, -(days - 1));
  return Array.from({ length: days }, (_, index) =>
    getLocalDateKey(
      localDateTimeToUtc({ ...shiftLocalDate(first, index), hour: 12, minute: 0 }, timezone),
      timezone,
    ),
  );
};

export const getLocalPeriodWindow = (
  period: CalendarPeriod,
  timezone: string,
  now = new Date(),
): { start: Date; end: Date } => {
  const current = getLocalDateParts(now, timezone);
  const start = shiftLocalDate(current, -(periodDays[period] - 1));
  return {
    start: localDateTimeToUtc({ ...start, hour: 0, minute: 0 }, timezone),
    end: now,
  };
};

export const formatZonedIso = (value: Date, timezone: string): string => {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      fractionalSecondDigits: 3,
      hourCycle: 'h23',
      timeZoneName: 'longOffset',
    })
      .formatToParts(value)
      .filter(({ type }) => type !== 'literal')
      .map(({ type, value: partValue }) => [type, partValue]),
  ) as Record<string, string>;
  const offsetMatch = /^GMT([+-])(\d{2}):(\d{2})$/.exec(parts.timeZoneName);
  const offset = offsetMatch ? `${offsetMatch[1]}${offsetMatch[2]}:${offsetMatch[3]}` : '+00:00';
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}:${parts.second}.${parts.fractionalSecond}${offset}`;
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

  const current = getLocalDateParts(now, schedule.timezone);
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
