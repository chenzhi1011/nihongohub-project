import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useCatalog } from './useCatalog';

describe('useCatalog', () => {
  it('exposes loading and successful catalog data', async () => {
    const data = [{ category: 'basic' as const, resources: [], totalCount: 5, lockedCount: 0 }];
    const fetcher = vi.fn().mockResolvedValue(data);
    const { result } = renderHook(() => useCatalog(fetcher));

    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data).toEqual(data);
    expect(result.current.error).toBeNull();
  });

  it('keeps failure visible and supports retry', async () => {
    const fetcher = vi.fn()
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValueOnce([]);
    const { result } = renderHook(() => useCatalog(fetcher));

    await waitFor(() => expect(result.current.error).toBeInstanceOf(Error));
    await act(() => result.current.retry());
    await waitFor(() => expect(result.current.error).toBeNull());
    expect(fetcher).toHaveBeenCalledTimes(2);
  });

  it('ignores an older response that finishes after a retry', async () => {
    let resolveFirst!: (value: []) => void;
    let resolveSecond!: (value: [{ category: 'basic'; resources: []; totalCount: 1; lockedCount: 0 }]) => void;
    const first = new Promise<[]>((resolve) => { resolveFirst = resolve; });
    const second = new Promise<[{ category: 'basic'; resources: []; totalCount: 1; lockedCount: 0 }]>(
      (resolve) => { resolveSecond = resolve; },
    );
    const fetcher = vi.fn().mockReturnValueOnce(first).mockReturnValueOnce(second);
    const { result } = renderHook(() => useCatalog(fetcher));

    act(() => { void result.current.retry(); });
    act(() => resolveSecond([{ category: 'basic', resources: [], totalCount: 1, lockedCount: 0 }]));
    await waitFor(() => expect(result.current.data[0]?.totalCount).toBe(1));
    act(() => resolveFirst([]));
    await waitFor(() => expect(result.current.data[0]?.totalCount).toBe(1));
  });
});
