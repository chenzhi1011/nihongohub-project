import { Check } from 'lucide-react';
import type { MonthlyCheckinCalendarModel } from '../service/dailyCheckinService';
import { DailyCheckinButton } from './DailyCheckinButton';

type Props = {
  calendar: MonthlyCheckinCalendarModel;
  loading: boolean;
  error: unknown;
  checkedToday: boolean;
  submitting: boolean;
  darkMode: boolean;
  t: (key: string) => string;
  onCheckIn: () => void;
  onRetry: () => void;
};

const weekdayKeys = [
  'weekdaySun', 'weekdayMon', 'weekdayTue', 'weekdayWed',
  'weekdayThu', 'weekdayFri', 'weekdaySat',
];

export function MonthlyCheckinCalendar({
  calendar,
  loading,
  error,
  checkedToday,
  submitting,
  darkMode,
  t,
  onCheckIn,
  onRetry,
}: Props) {
  const textColor = darkMode ? 'text-[#f5ead8]' : 'text-[#2f2218]';
  const mutedColor = darkMode ? 'text-[#a89881]' : 'text-[#8f7f69]';
  const title = t('checkinMonthLabel').replace('{month}', String(calendar.month));

  return (
    <section className={`w-full max-w-[380px] rounded-xl border p-4 ${darkMode ? 'border-[#4a3f33] bg-[#2a241d]' : 'border-[#d8c8ae] bg-[#fff8ec]'}`}>
      <div className="flex items-center justify-between gap-3">
        <h3 className={`text-lg font-semibold ${textColor}`}>{title}</h3>
        <DailyCheckinButton checked={checkedToday} submitting={submitting} compact={false} darkMode={darkMode} t={t} onClick={onCheckIn} />
      </div>

      {Boolean(error) && (
        <div role="alert" className={`mt-4 rounded-lg border p-3 text-sm ${darkMode ? 'border-[#70453e] bg-[#3b2925] text-[#ffd2ca]' : 'border-[#dfb7ae] bg-[#fff0ed] text-[#7d3027]'}`}>
          <span>{t('checkinCalendarLoadFailed')}</span>{' '}
          <button type="button" className="underline" onClick={onRetry}>{t('retry')}</button>
        </div>
      )}

      {loading ? (
        <p role="status" className={`mt-4 text-sm ${mutedColor}`}>{t('checkinCalendarLoading')}</p>
      ) : (
        <div className="mt-4">
          <div className="grid grid-cols-7 gap-1 text-center">
            {weekdayKeys.map((key) => (
              <span key={key} className={`py-1 text-xs font-medium ${mutedColor}`}>{t(key)}</span>
            ))}
            {Array.from({ length: calendar.leadingBlankCount }, (_, index) => (
              <span key={`blank-${index}`} aria-hidden="true" />
            ))}
            {calendar.days.map((day) => {
              const stateLabel = day.checked ? t('checked') : day.future ? t('futureDate') : t('unchecked');
              return (
                <div key={day.date} className="flex h-9 items-center justify-center">
                  <div
                    data-testid="checkin-calendar-day"
                    aria-label={`${day.date}，${stateLabel}`}
                    className={`flex h-8 w-8 items-center justify-center rounded-full text-sm ${
                      day.today ? 'ring-2 ring-[#c86b3c] ring-offset-1' : ''
                    } ${
                      day.checked
                        ? 'bg-[#3b7d67] font-semibold text-white'
                        : day.future
                          ? darkMode ? 'text-[#675d50]' : 'text-[#c3b7a5]'
                          : darkMode ? 'text-[#d8c4ad]' : 'text-[#6b5845]'
                    } ${darkMode && day.today ? 'ring-offset-[#2a241d]' : day.today ? 'ring-offset-[#fff8ec]' : ''}`}
                  >
                    {day.checked ? <><Check aria-hidden="true" className="h-4 w-4" /><span className="sr-only">✓</span></> : day.dayOfMonth}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
