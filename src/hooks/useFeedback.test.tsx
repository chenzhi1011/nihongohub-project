import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AppError } from '../errors/appError';
import { configureErrorReporter } from '../observability/errorReporter';
import { useFeedback, type FeedbackDependencies } from './useFeedback';

const messages: Record<string, string> = {
  feedbackInvalidError: '反馈内容无效。',
  feedbackRateLimitError: '请稍后再发送。',
  feedbackDailyLimitError: '今日反馈次数已达上限。',
  feedbackSubmitFailed: '反馈提交失败，请重试。',
  loginRequired: '请先登录',
};
const t = (key: string) => messages[key] ?? key;

const dependencies = (submitFeedback = vi.fn().mockResolvedValue({ feedbackId: 'feedback-1' })): FeedbackDependencies => ({
  submitFeedback,
  now: () => 100,
});

afterEach(() => configureErrorReporter(null));

describe('useFeedback', () => {
  it('tracks a successful submission and can clear its state', async () => {
    const deps = dependencies();
    const { result } = renderHook(() => useFeedback(t, deps));

    let succeeded = false;
    await act(async () => { succeeded = await result.current.submitFeedback('Useful feedback'); });

    expect(succeeded).toBe(true);
    expect(deps.submitFeedback).toHaveBeenCalledWith('Useful feedback');
    expect(result.current.succeeded).toBe(true);
    expect(result.current.error).toBeNull();

    act(() => result.current.clearFeedbackState());
    expect(result.current.succeeded).toBe(false);
  });

  it('suppresses concurrent submissions', async () => {
    let resolveRequest: (value: { feedbackId: string }) => void = () => undefined;
    const pending = new Promise<{ feedbackId: string }>((resolve) => { resolveRequest = resolve; });
    const submitFeedback = vi.fn().mockReturnValue(pending);
    const { result } = renderHook(() => useFeedback(t, dependencies(submitFeedback)));

    let first!: Promise<boolean>;
    act(() => {
      first = result.current.submitFeedback('First');
      void result.current.submitFeedback('Second');
    });
    expect(submitFeedback).toHaveBeenCalledOnce();
    expect(result.current.submitting).toBe(true);

    await act(async () => {
      resolveRequest({ feedbackId: 'feedback-1' });
      await first;
    });
    expect(result.current.submitting).toBe(false);
  });

  it.each([
    ['VALIDATION_ERROR', '反馈内容无效。'],
    ['FEEDBACK_RATE_LIMITED', '请稍后再发送。'],
    ['FEEDBACK_DAILY_LIMIT_REACHED', '今日反馈次数已达上限。'],
    ['NETWORK_ERROR', '反馈提交失败，请重试。'],
  ] as const)('maps %s to a user-facing message', async (code, expectedMessage) => {
    const failure = new AppError({ code, message: 'internal', operationId: 'op-feedback', retryable: false });
    const { result } = renderHook(() => useFeedback(t, dependencies(vi.fn().mockRejectedValue(failure))));

    let succeeded = true;
    await act(async () => { succeeded = await result.current.submitFeedback('Keep this draft'); });

    expect(succeeded).toBe(false);
    expect(result.current.error).toBe(expectedMessage);
    expect(result.current.succeeded).toBe(false);
  });

  it('reports one structured failure without feedback content or email', async () => {
    const provider = vi.fn();
    configureErrorReporter(provider);
    const failure = new AppError({
      code: 'NETWORK_ERROR', message: 'internal', operationId: 'op-feedback', retryable: true,
    });
    const { result } = renderHook(() => useFeedback(t, dependencies(vi.fn().mockRejectedValue(failure))));

    await act(() => result.current.submitFeedback('private feedback body'));

    expect(provider).toHaveBeenCalledOnce();
    const report = provider.mock.calls[0][0];
    expect(report.context).toMatchObject({
      event: 'feedback.submit.failed',
      operationId: 'op-feedback',
      errorCode: 'NETWORK_ERROR',
      layer: 'hook',
    });
    expect(report.context).not.toHaveProperty('content');
    expect(report.context).not.toHaveProperty('email');
    expect(JSON.stringify(report.context)).not.toContain('private feedback body');
  });
});
