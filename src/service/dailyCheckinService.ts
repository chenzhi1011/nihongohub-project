export type CheckinCalendarDay = {
  date: string;
  dayOfMonth: number;
  checked: boolean;
  today: boolean;
  future: boolean;
};

export type MonthlyCheckinCalendarModel = {
  year: number;
  month: number;
  leadingBlankCount: number;
  days: CheckinCalendarDay[];
  startDate: string;
  endDateExclusive: string;
};

function padDatePart(value: number): string {
  return String(value).padStart(2, '0');
}

export function toLocalDateString(date: Date): string {
  return `${date.getFullYear()}-${padDatePart(date.getMonth() + 1)}-${padDatePart(date.getDate())}`;
}

export function buildMonthlyCheckinCalendar(
  now: Date,
  checkedDates: string[],
): MonthlyCheckinCalendarModel {
  const year = now.getFullYear();
  const monthIndex = now.getMonth();
  const month = monthIndex + 1;
  const firstDay = new Date(year, monthIndex, 1);
  const nextMonth = new Date(year, monthIndex + 1, 1);
  const dayCount = new Date(year, monthIndex + 1, 0).getDate();
  const today = toLocalDateString(now);
  const checkedDateSet = new Set(checkedDates);
  const days = Array.from({ length: dayCount }, (_, index): CheckinCalendarDay => {
    const dayOfMonth = index + 1;
    const date = toLocalDateString(new Date(year, monthIndex, dayOfMonth));
    return {
      date,
      dayOfMonth,
      checked: checkedDateSet.has(date),
      today: date === today,
      future: date > today,
    };
  });

  return {
    year,
    month,
    leadingBlankCount: firstDay.getDay(),
    days,
    startDate: toLocalDateString(firstDay),
    endDateExclusive: toLocalDateString(nextMonth),
  };
}
