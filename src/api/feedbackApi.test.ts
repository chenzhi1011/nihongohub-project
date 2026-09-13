import { describe, expect, it, vi } from 'vitest';
import type { AppSupabaseClient } from './supabaseClient';
import { createFeedbackApi } from './feedbackApi';

describe('feedbackApi', () => {
  it('submits feedback through the protected RPC and returns its id', async () => {
    const rpc = vi.fn().mockResolvedValue({
      data: '90f65b75-c5fb-4daa-93b6-b0dd14d2ea31',
      error: null,
    });
    const api = createFeedbackApi({ rpc } as unknown as AppSupabaseClient);

    await expect(api.submitFeedback('  useful feedback  ')).resolves.toEqual({
      feedbackId: '90f65b75-c5fb-4daa-93b6-b0dd14d2ea31',
    });
    expect(rpc).toHaveBeenCalledWith('submit_feedback', {
      p_content: '  useful feedback  ',
    });
  });

  it.each([
    ['feedback_auth_required', 'AUTH_REQUIRED', false],
    ['feedback_invalid_content', 'VALIDATION_ERROR', false],
    ['feedback_rate_limited', 'FEEDBACK_RATE_LIMITED', true],
    ['feedback_daily_limit_reached', 'FEEDBACK_DAILY_LIMIT_REACHED', false],
  ] as const)('maps %s to %s', async (message, code, retryable) => {
    const rpc = vi.fn().mockResolvedValue({
      data: null,
      error: { code: 'P0001', message },
    });
    const api = createFeedbackApi({ rpc } as unknown as AppSupabaseClient);

    await expect(api.submitFeedback('feedback')).rejects.toMatchObject({ code, retryable });
  });

  it('rejects an invalid RPC response', async () => {
    const rpc = vi.fn().mockResolvedValue({ data: null, error: null });
    const api = createFeedbackApi({ rpc } as unknown as AppSupabaseClient);

    await expect(api.submitFeedback('feedback')).rejects.toMatchObject({ code: 'UNKNOWN' });
  });

  it('returns a safe configuration error when Supabase is unavailable', async () => {
    const api = createFeedbackApi(null);

    await expect(api.submitFeedback('feedback')).rejects.toMatchObject({
      code: 'UNKNOWN',
      retryable: false,
    });
  });
});
