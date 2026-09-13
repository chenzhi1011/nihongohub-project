import { describe, expect, it, vi } from 'vitest';
import type { AppSupabaseClient } from './supabaseClient';
import { createDailyCheckinApi } from './dailyCheckinApi';

describe('dailyCheckinApi', () => {
  it('reads only check-in dates inside the requested month', async () => {
    const lt = vi.fn().mockResolvedValue({
      data: [{ checkin_date: '2026-09-02' }, { checkin_date: '2026-09-13' }],
      error: null,
    });
    const gte = vi.fn().mockReturnValue({ lt });
    const select = vi.fn().mockReturnValue({ gte });
    const from = vi.fn().mockReturnValue({ select });
    const api = createDailyCheckinApi({ from } as unknown as AppSupabaseClient);

    await expect(api.fetchMonthlyCheckins('2026-09-01', '2026-10-01'))
      .resolves.toEqual(['2026-09-02', '2026-09-13']);

    expect(from).toHaveBeenCalledWith('daily_checkins');
    expect(select).toHaveBeenCalledWith('checkin_date');
    expect(gte).toHaveBeenCalledWith('checkin_date', '2026-09-01');
    expect(lt).toHaveBeenCalledWith('checkin_date', '2026-10-01');
  });

  it.each(['checked', 'already_checked'] as const)(
    'returns the stable %s RPC result',
    async (status) => {
      const rpc = vi.fn().mockResolvedValue({ data: status, error: null });
      const api = createDailyCheckinApi({ rpc } as unknown as AppSupabaseClient);

      await expect(api.checkInToday('2026-09-13')).resolves.toBe(status);
      expect(rpc).toHaveBeenCalledWith('check_in_today', { p_checkin_date: '2026-09-13' });
    },
  );

  it('rejects an unknown RPC result instead of leaking it to UI code', async () => {
    const rpc = vi.fn().mockResolvedValue({ data: 'unexpected', error: null });
    const api = createDailyCheckinApi({ rpc } as unknown as AppSupabaseClient);

    await expect(api.checkInToday('2026-09-13')).rejects.toMatchObject({ code: 'UNKNOWN' });
  });

  it('converts database errors to safe application errors', async () => {
    const rpc = vi.fn().mockResolvedValue({
      data: null,
      error: { code: 'P0001', message: 'INVALID_CHECKIN_DATE' },
    });
    const api = createDailyCheckinApi({ rpc } as unknown as AppSupabaseClient);

    await expect(api.checkInToday('2026-01-01')).rejects.toMatchObject({
      code: 'VALIDATION_ERROR',
      retryable: false,
    });
  });
});
