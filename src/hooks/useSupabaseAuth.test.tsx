import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AppError } from '../errors/appError';
import type { AuthDependencies } from './useSupabaseAuth';
import { useSupabaseAuth } from './useSupabaseAuth';

function createDependencies(overrides: Partial<AuthDependencies> = {}): AuthDependencies {
  return {
    getCurrentUser: vi.fn().mockResolvedValue(null),
    subscribeToAuthState: vi.fn().mockReturnValue(() => undefined),
    signInWithGoogle: vi.fn().mockResolvedValue(undefined),
    sendEmailOtp: vi.fn().mockResolvedValue(undefined),
    verifyEmailOtp: vi.fn().mockResolvedValue(undefined),
    signOut: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

describe('useSupabaseAuth email OTP', () => {
  it('trims the email before sending an OTP', async () => {
    const dependencies = createDependencies();
    const { result } = renderHook(() => useSupabaseAuth(dependencies));
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(() => result.current.sendEmailOtp(' learner@example.com '));

    expect(dependencies.sendEmailOtp).toHaveBeenCalledWith('learner@example.com');
  });

  it('delegates verification with the email and token', async () => {
    const dependencies = createDependencies();
    const { result } = renderHook(() => useSupabaseAuth(dependencies));
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(() => result.current.verifyEmailOtp('learner@example.com', '123456'));

    expect(dependencies.verifyEmailOtp).toHaveBeenCalledWith('learner@example.com', '123456');
  });

  it('sets a send-specific error and rethrows when delivery fails', async () => {
    const failure = new Error('offline');
    const dependencies = createDependencies({ sendEmailOtp: vi.fn().mockRejectedValue(failure) });
    const { result } = renderHook(() => useSupabaseAuth(dependencies));
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await expect(result.current.sendEmailOtp('learner@example.com')).rejects.toBe(failure);
    });
    expect(result.current.error).toBe('验证码发送失败，请稍后重试。');
  });

  it('sets a verification-specific error and rethrows invalid codes', async () => {
    const failure = new Error('invalid token');
    const dependencies = createDependencies({ verifyEmailOtp: vi.fn().mockRejectedValue(failure) });
    const { result } = renderHook(() => useSupabaseAuth(dependencies));
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await expect(result.current.verifyEmailOtp('learner@example.com', '000000')).rejects.toBe(failure);
    });
    expect(result.current.error).toBe('验证码无效或已过期，请重新输入。');
  });

  it('distinguishes the server-side email rate limit', async () => {
    const failure = new AppError({
      code: 'UNKNOWN', operationId: 'otp-rate-limit', retryable: false,
      message: 'operation failed', cause: { status: 429 },
    });
    const dependencies = createDependencies({ sendEmailOtp: vi.fn().mockRejectedValue(failure) });
    const { result } = renderHook(() => useSupabaseAuth(dependencies));
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await expect(result.current.sendEmailOtp('learner@example.com')).rejects.toBe(failure);
    });
    expect(result.current.error).toBe('发送过于频繁，请稍后再试。');
  });
});
