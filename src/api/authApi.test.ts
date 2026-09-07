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
});
