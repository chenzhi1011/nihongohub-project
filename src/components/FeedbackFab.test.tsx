import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { FeedbackFab } from './FeedbackFab';

const t = (key: string) => ({
  dailyCheckInButton: '今日打卡',
  dailyCheckInDone: '今日已打卡',
  dailyCheckInSubmitting: '打卡中…',
  feedbackTitle: '反馈意见',
  feedbackContentLabel: '反馈内容',
  feedbackPlaceholder: '请告诉我们你的想法',
  feedbackSend: '提交反馈',
  feedbackCancel: '取消',
  feedbackSuccess: '感谢你的反馈！',
  close: '关闭',
}[key] ?? key);

const baseProps = {
  darkMode: false,
  t,
  authenticated: true,
  checkedToday: false,
  checkinSubmitting: false,
  feedbackSubmitting: false,
  feedbackError: null,
  onCheckIn: vi.fn(),
  onLoginRequired: vi.fn(),
  onSubmitFeedback: vi.fn().mockResolvedValue(true),
  onClearFeedbackState: vi.fn(),
};

describe('FeedbackFab', () => {
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
    render(<FeedbackFab {...baseProps} onCheckIn={onCheckIn} />);

    await userEvent.click(screen.getByRole('button', { name: '今日打卡' }));

    expect(onCheckIn).toHaveBeenCalledOnce();
  });

  it('does not submit a check-in again after today is checked', async () => {
    const onCheckIn = vi.fn();
    render(<FeedbackFab {...baseProps} checkedToday onCheckIn={onCheckIn} />);

    const button = screen.getByRole('button', { name: '今日已打卡' });
    expect(button).toBeDisabled();
    await userEvent.click(button);
    expect(onCheckIn).not.toHaveBeenCalled();
  });

  it('opens login instead of feedback for an anonymous user', async () => {
    const onLoginRequired = vi.fn();
    render(<FeedbackFab {...baseProps} authenticated={false} onLoginRequired={onLoginRequired} />);

    await userEvent.click(screen.getByRole('button', { name: '反馈意见' }));

    expect(onLoginRequired).toHaveBeenCalledOnce();
    expect(screen.queryByRole('dialog', { name: '反馈意见' })).not.toBeInTheDocument();
  });

  it('shows only one feedback textbox for an authenticated user', async () => {
    render(<FeedbackFab {...baseProps} />);
    await userEvent.click(screen.getByRole('button', { name: '反馈意见' }));

    expect(screen.getByRole('textbox', { name: '反馈内容' })).toBeInTheDocument();
    expect(screen.getAllByRole('textbox')).toHaveLength(1);
    expect(screen.queryByText('你喜欢添加哪一类资源/工具')).not.toBeInTheDocument();
    expect(screen.queryByText('你希望网站增加什么功能')).not.toBeInTheDocument();
  });

  it('submits trimmed feedback and closes after success', async () => {
    const onSubmitFeedback = vi.fn().mockResolvedValue(true);
    render(<FeedbackFab {...baseProps} onSubmitFeedback={onSubmitFeedback} />);
    await userEvent.click(screen.getByRole('button', { name: '反馈意见' }));
    await userEvent.type(screen.getByRole('textbox', { name: '反馈内容' }), '  Useful idea  ');

    await userEvent.click(screen.getByRole('button', { name: '提交反馈' }));

    expect(onSubmitFeedback).toHaveBeenCalledWith('Useful idea');
    expect(screen.queryByRole('dialog', { name: '反馈意见' })).not.toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('感谢你的反馈！');
  });

  it('keeps the draft visible after a failed submission', async () => {
    const onSubmitFeedback = vi.fn().mockResolvedValue(false);
    render(<FeedbackFab {...baseProps} feedbackError="提交失败" onSubmitFeedback={onSubmitFeedback} />);
    await userEvent.click(screen.getByRole('button', { name: '反馈意见' }));
    const textbox = screen.getByRole('textbox', { name: '反馈内容' });
    await userEvent.type(textbox, 'Keep this');

    await userEvent.click(screen.getByRole('button', { name: '提交反馈' }));

    expect(textbox).toHaveValue('Keep this');
    expect(screen.getByRole('alert')).toHaveTextContent('提交失败');
  });

  it('limits the textbox to 1000 characters and disables blank submissions', async () => {
    render(<FeedbackFab {...baseProps} />);
    await userEvent.click(screen.getByRole('button', { name: '反馈意见' }));
    const textbox = screen.getByRole('textbox', { name: '反馈内容' });
    const submit = screen.getByRole('button', { name: '提交反馈' });

    expect(submit).toBeDisabled();
    fireEvent.change(textbox, { target: { value: 'a'.repeat(1001) } });
    expect(textbox).toHaveValue('a'.repeat(1000));
    expect(screen.getByText('1000 / 1000')).toBeInTheDocument();
  });

  it('disables feedback controls while submitting', async () => {
    render(<FeedbackFab {...baseProps} feedbackSubmitting />);
    await userEvent.click(screen.getByRole('button', { name: '反馈意见' }));
    expect(screen.getByRole('textbox', { name: '反馈内容' })).toBeDisabled();
    expect(screen.getByRole('button', { name: '提交反馈' })).toBeDisabled();
  });
});
