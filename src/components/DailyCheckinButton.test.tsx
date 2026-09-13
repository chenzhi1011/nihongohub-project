import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { DailyCheckinButton } from './DailyCheckinButton';

const t = (key: string) => ({
  dailyCheckInButton: '今日打卡',
  dailyCheckInDone: '今日已打卡',
  dailyCheckInSubmitting: '打卡中…',
}[key] ?? key);

describe('DailyCheckinButton', () => {
  it('submits an unchecked day', async () => {
    const onClick = vi.fn();
    render(<DailyCheckinButton checked={false} submitting={false} compact={false} darkMode={false} t={t} onClick={onClick} />);

    await userEvent.click(screen.getByRole('button', { name: '今日打卡' }));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('shows a disabled checked state that cannot be undone', () => {
    render(<DailyCheckinButton checked submitting={false} compact={false} darkMode={false} t={t} onClick={vi.fn()} />);

    expect(screen.getByRole('button', { name: '今日已打卡' })).toBeDisabled();
  });

  it('blocks another click while submitting', () => {
    render(<DailyCheckinButton checked={false} submitting compact darkMode t={t} onClick={vi.fn()} />);

    expect(screen.getByRole('button', { name: '打卡中…' })).toBeDisabled();
  });
});
