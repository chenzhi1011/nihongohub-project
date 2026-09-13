import { describe, expect, it } from 'vitest';
import { buildMonthlyCheckinCalendar, toLocalDateString } from './dailyCheckinService';

describe('dailyCheckinService', () => {
  it('formats a date from local components instead of converting it to UTC', () => {
    const localLateNight = new Date(2026, 8, 3, 23, 30);
    expect(toLocalDateString(localLateNight)).toBe('2026-09-03');
  });

  it('builds a Sunday-first month with exclusive query boundaries', () => {
    const result = buildMonthlyCheckinCalendar(
      new Date(2026, 8, 13, 10),
      ['2026-09-01', '2026-09-13'],
    );

    expect(result).toMatchObject({
      year: 2026,
      month: 9,
      leadingBlankCount: 2,
      startDate: '2026-09-01',
      endDateExclusive: '2026-10-01',
    });
    expect(result.days).toHaveLength(30);
    expect(result.days[0]).toMatchObject({ date: '2026-09-01', dayOfMonth: 1, checked: true });
    expect(result.days[12]).toMatchObject({ date: '2026-09-13', today: true, future: false, checked: true });
    expect(result.days[13]).toMatchObject({ date: '2026-09-14', today: false, future: true, checked: false });
  });

  it('includes February 29 in a leap year', () => {
    const result = buildMonthlyCheckinCalendar(new Date(2028, 1, 10), ['2028-02-29']);

    expect(result.days).toHaveLength(29);
    expect(result.days[28]).toMatchObject({
      date: '2028-02-29',
      dayOfMonth: 29,
      checked: true,
      future: true,
    });
  });

  it('ignores checked dates outside the displayed month', () => {
    const result = buildMonthlyCheckinCalendar(
      new Date(2026, 8, 13),
      ['2026-08-31', '2026-10-01'],
    );

    expect(result.days.every((day) => !day.checked)).toBe(true);
  });
});
