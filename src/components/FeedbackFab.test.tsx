import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { FeedbackFab } from './FeedbackFab';

const t = (key: string) => ({
  dailyCheckInButton: '今日打卡',
  dailyCheckInDone: '今日已打卡',
  dailyCheckInSubmitting: '打卡中…',
  feedbackTitle: '发送意见',
}[key] ?? key);

const baseProps = {
  darkMode: false,
  t,
  checkedToday: false,
  checkinSubmitting: false,
  onCheckIn: vi.fn(),
  onLoginRequired: vi.fn(),
};

describe('FeedbackFab daily check-in', () => {
  it('opens login instead of checking in for an anonymous user', async () => {
    const onLoginRequired = vi.fn();
    const onCheckIn = vi.fn();
    render(<FeedbackFab {...baseProps} authenticated={false} onLoginRequired={onLoginRequired} onCheckIn={onCheckIn} />);

    await userEvent.click(screen.getByRole('button', { name: '今日打卡' }));

    expect(onLoginRequired).toHaveBeenCalledOnce();
    expect(onCheckIn).not.toHaveBeenCalled();
  });

  it('checks in directly for an authenticated user', async () => {
    const onCheckIn = vi.fn();
    render(<FeedbackFab {...baseProps} authenticated onCheckIn={onCheckIn} />);

    await userEvent.click(screen.getByRole('button', { name: '今日打卡' }));

    expect(onCheckIn).toHaveBeenCalledOnce();
    expect(screen.queryByText('devInProgressTitle')).not.toBeInTheDocument();
  });

  it('does not submit again after today is checked', async () => {
    const onCheckIn = vi.fn();
    render(<FeedbackFab {...baseProps} authenticated checkedToday onCheckIn={onCheckIn} />);

    const button = screen.getByRole('button', { name: '今日已打卡' });
    expect(button).toBeDisabled();
    await userEvent.click(button);
    expect(onCheckIn).not.toHaveBeenCalled();
  });
});
