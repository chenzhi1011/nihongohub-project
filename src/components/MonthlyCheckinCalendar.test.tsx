import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { buildMonthlyCheckinCalendar } from '../service/dailyCheckinService';
import { MonthlyCheckinCalendar } from './MonthlyCheckinCalendar';

const t = (key: string) => ({
  checkinMonthLabel: '{month}月',
  dailyCheckInButton: '今日打卡',
  dailyCheckInDone: '今日已打卡',
  dailyCheckInSubmitting: '打卡中…',
  checkinCalendarLoadFailed: '打卡记录加载失败',
  retry: '重试',
  weekdaySun: '日', weekdayMon: '一', weekdayTue: '二', weekdayWed: '三',
  weekdayThu: '四', weekdayFri: '五', weekdaySat: '六',
  checked: '已打卡', unchecked: '未打卡', futureDate: '未来日期',
}[key] ?? key);

const calendar = buildMonthlyCheckinCalendar(
  new Date(2026, 8, 13, 10),
  ['2026-09-03', '2026-09-13'],
);

describe('MonthlyCheckinCalendar', () => {
  it('renders the whole month and marks checked dates with accessible labels', () => {
    render(<MonthlyCheckinCalendar calendar={calendar} loading={false} error={null} checkedToday darkMode={false} t={t} submitting={false} onCheckIn={vi.fn()} onRetry={vi.fn()} />);

    const heading = screen.getByRole('heading', { name: '9月', level: 3 });
    expect(heading.closest('section')).toHaveClass('max-w-[380px]');
    expect(screen.getByLabelText('2026-09-03，已打卡')).toHaveTextContent('✓');
    expect(screen.getByLabelText('2026-09-03，已打卡')).not.toHaveTextContent('3');
    expect(screen.getByLabelText('2026-09-13，已打卡')).toHaveTextContent('✓');
    expect(screen.getByLabelText('2026-09-14，未来日期')).not.toHaveTextContent('✓');
    expect(screen.getAllByTestId('checkin-calendar-day')).toHaveLength(30);
  });

  it('submits today from the title area', async () => {
    const onCheckIn = vi.fn();
    render(<MonthlyCheckinCalendar calendar={calendar} loading={false} error={null} checkedToday={false} darkMode={false} t={t} submitting={false} onCheckIn={onCheckIn} onRetry={vi.fn()} />);

    await userEvent.click(screen.getByRole('button', { name: '今日打卡' }));
    expect(onCheckIn).toHaveBeenCalledOnce();
  });

  it('shows an independent retry without hiding the calendar shell', async () => {
    const onRetry = vi.fn();
    render(<MonthlyCheckinCalendar calendar={calendar} loading={false} error={new Error('offline')} checkedToday={false} darkMode={false} t={t} submitting={false} onCheckIn={vi.fn()} onRetry={onRetry} />);

    expect(screen.getByRole('alert')).toHaveTextContent('打卡记录加载失败');
    expect(screen.getByRole('heading', { name: '9月', level: 3 })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: '重试' }));
    expect(onRetry).toHaveBeenCalledOnce();
  });
});
