import { describe, expect, it, vi } from 'vitest';
import { AppError } from '../errors/appError';
import { createAuthApi } from './authApi';
import type { AppSupabaseClient } from './supabaseClient';

describe('authApi', () => {
  it('maps an OAuth response error instead of silently succeeding', async () => {
    const client = {
      auth: {
        signInWithOAuth: vi.fn().mockResolvedValue({
          data: { provider: 'google', url: null },
          error: { message: 'provider unavailable', status: 503 },
        }),
      },
    } as unknown as AppSupabaseClient;

    const api = createAuthApi(client);

    await expect(api.signInWithGoogle('https://nihongohub.test')).rejects.toMatchObject({
      name: 'AppError',
      retryable: true,
    } satisfies Partial<AppError>);
  });

  it('uses the configured browser origin for Google OAuth', async () => {
    const signInWithOAuth = vi.fn().mockResolvedValue({
      data: { provider: 'google', url: 'https://accounts.google.com' },
      error: null,
    });
    const client = { auth: { signInWithOAuth } } as unknown as AppSupabaseClient;

    await createAuthApi(client).signInWithGoogle('https://nihongohub.test');

    expect(signInWithOAuth).toHaveBeenCalledWith({
      provider: 'google',
      options: { redirectTo: 'https://nihongohub.test' },
    });
  });

  it('sends an email OTP and allows automatic account creation', async () => {
    const signInWithOtp = vi.fn().mockResolvedValue({ data: {}, error: null });
    const client = { auth: { signInWithOtp } } as unknown as AppSupabaseClient;

    await createAuthApi(client).sendEmailOtp('learner@example.com');

    expect(signInWithOtp).toHaveBeenCalledWith({
      email: 'learner@example.com',
      options: { shouldCreateUser: true },
    });
  });

  it('verifies an email OTP to establish a session', async () => {
    const verifyOtp = vi.fn().mockResolvedValue({ data: { session: {} }, error: null });
    const client = { auth: { verifyOtp } } as unknown as AppSupabaseClient;

    await createAuthApi(client).verifyEmailOtp('learner@example.com', '123456');

    expect(verifyOtp).toHaveBeenCalledWith({
      email: 'learner@example.com',
      token: '123456',
      type: 'email',
    });
  });

  it.each([
    ['sendEmailOtp', 'signInWithOtp'],
    ['verifyEmailOtp', 'verifyOtp'],
  ] as const)('maps errors returned by %s', async (method, sdkMethod) => {
    const client = {
      auth: {
        [sdkMethod]: vi.fn().mockResolvedValue({ data: {}, error: { message: 'auth failed', status: 503 } }),
      },
    } as unknown as AppSupabaseClient;
    const api = createAuthApi(client);

    const action = method === 'sendEmailOtp'
      ? api.sendEmailOtp('learner@example.com')
      : api.verifyEmailOtp('learner@example.com', '123456');

    await expect(action).rejects.toMatchObject({ name: 'AppError', retryable: true } satisfies Partial<AppError>);
  });
});
