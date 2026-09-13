import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AppError } from '../errors/appError';
import { useDailyCheckin, type DailyCheckinDependencies } from './useDailyCheckin';

const now = new Date(2026, 8, 13, 10);

function dependencies(
  overrides: Partial<DailyCheckinDependencies> = {},
): DailyCheckinDependencies {
  return {
    fetchMonthlyCheckins: vi.fn().mockResolvedValue([]),
    checkInToday: vi.fn().mockResolvedValue('checked'),
    now: () => now,
    ...overrides,
  };
}

describe('useDailyCheckin', () => {
  it('does not load personal records while anonymous', () => {
    const deps = dependencies();
    const { result } = renderHook(() => useDailyCheckin(false, null, deps));

    expect(result.current.loading).toBe(false);
    expect(result.current.checkedToday).toBe(false);
    expect(deps.fetchMonthlyCheckins).not.toHaveBeenCalled();
  });

  it('loads the current local month and derives today state', async () => {
    const deps = dependencies({
      fetchMonthlyCheckins: vi.fn().mockResolvedValue(['2026-09-03', '2026-09-13']),
    });
    const { result } = renderHook(() => useDailyCheckin(true, 'user-a', deps));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(deps.fetchMonthlyCheckins).toHaveBeenCalledWith('2026-09-01', '2026-10-01');
    expect(result.current.checkedToday).toBe(true);
    expect(result.current.calendar.days.filter((day) => day.checked)).toHaveLength(2);
  });

  it.each(['checked', 'already_checked'] as const)(
    'synchronizes today after the API returns %s',
    async (status) => {
      const deps = dependencies({ checkInToday: vi.fn().mockResolvedValue(status) });
      const { result } = renderHook(() => useDailyCheckin(true, 'user-a', deps));
      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(() => result.current.checkIn());

      expect(deps.checkInToday).toHaveBeenCalledWith('2026-09-13');
      expect(result.current.checkedToday).toBe(true);
      expect(result.current.calendar.days[12].checked).toBe(true);
    },
  );

  it('suppresses concurrent submissions', async () => {
    let resolveRequest: (value: 'checked') => void = () => undefined;
    const pending = new Promise<'checked'>((resolve) => { resolveRequest = resolve; });
    const checkInToday = vi.fn().mockReturnValue(pending);
    const deps = dependencies({ checkInToday });
    const { result } = renderHook(() => useDailyCheckin(true, 'user-a', deps));
    await waitFor(() => expect(result.current.loading).toBe(false));

    let first!: Promise<void>;
    act(() => {
      first = result.current.checkIn();
      void result.current.checkIn();
    });
    expect(checkInToday).toHaveBeenCalledOnce();

    await act(async () => {
      resolveRequest('checked');
      await first;
    });
  });

  it('keeps today unchecked after failure and succeeds on retry', async () => {
    const failure = new AppError({
      code: 'NETWORK_ERROR', message: 'offline', operationId: 'op-checkin', retryable: true,
    });
    const checkInToday = vi.fn()
      .mockRejectedValueOnce(failure)
      .mockResolvedValueOnce('checked');
    const deps = dependencies({ checkInToday });
    const { result } = renderHook(() => useDailyCheckin(true, 'user-a', deps));
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(() => result.current.checkIn());
    expect(result.current.checkedToday).toBe(false);
    expect(result.current.error).toBe(failure);

    await act(() => result.current.checkIn());
    expect(result.current.checkedToday).toBe(true);
    expect(result.current.error).toBeNull();
  });

  it('clears personal state when the user logs out', async () => {
    const deps = dependencies({
      fetchMonthlyCheckins: vi.fn().mockResolvedValue(['2026-09-13']),
    });
    const { result, rerender } = renderHook(
      ({ authenticated, userId }) => useDailyCheckin(authenticated, userId, deps),
      { initialProps: { authenticated: true, userId: 'user-a' as string | null } },
    );
    await waitFor(() => expect(result.current.checkedToday).toBe(true));

    rerender({ authenticated: false, userId: null });

    expect(result.current.checkedToday).toBe(false);
    expect(result.current.loading).toBe(false);
  });
});
