import { describe, expect, it } from 'vitest';
import { getScheduleState, validateDailySchedule } from './timezone.js';

const timezone = 'America/Argentina/Buenos_Aires';

describe('parking schedule time utility', () => {
  it('keeps a 24-hour facility open without a next opening', () => {
    expect(
      getScheduleState({ timezone, is24Hours: true, opensAt: null, closesAt: null }, new Date()),
    ).toEqual({ isOpen: true, nextOpeningAt: null });
  });

  it('derives same-day open state and next opening in the parking timezone', () => {
    const schedule = { timezone, is24Hours: false, opensAt: '08:00', closesAt: '18:00' };

    expect(getScheduleState(schedule, new Date('2026-09-11T12:00:00.000Z')).isOpen).toBe(true);
    expect(getScheduleState(schedule, new Date('2026-09-11T23:00:00.000Z'))).toMatchObject({
      isOpen: false,
      nextOpeningAt: new Date('2026-09-12T11:00:00.000Z'),
    });
  });

  it('keeps cross-midnight schedules open after midnight', () => {
    const schedule = { timezone, is24Hours: false, opensAt: '18:00', closesAt: '02:00' };

    expect(getScheduleState(schedule, new Date('2026-09-11T04:00:00.000Z')).isOpen).toBe(true);
    expect(getScheduleState(schedule, new Date('2026-09-11T07:00:00.000Z')).nextOpeningAt).toEqual(
      new Date('2026-09-11T21:00:00.000Z'),
    );
    expect(getScheduleState(schedule, new Date('2026-09-11T07:00:00.000Z')).isOpen).toBe(false);
  });

  it('rejects incomplete and equal non-24-hour schedules', () => {
    expect(
      validateDailySchedule({ timezone, is24Hours: false, opensAt: null, closesAt: '18:00' }),
    ).toContain('requires');
    expect(
      validateDailySchedule({ timezone, is24Hours: false, opensAt: '10:00', closesAt: '10:00' }),
    ).toContain('equal');
  });
});
