import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useResourceActions } from './useResourceActions';
import { AppError } from '../errors/appError';
import { configureErrorReporter } from '../observability/errorReporter';

const input = {
  category: 'reading' as const, name: 'Resource', description: 'Description',
  url: 'https://example.test/path', tags: [],
};

describe('useResourceActions', () => {
  it('reports a handled Mark failure once with its operation ID', async () => {
    const reports: unknown[] = [];
    configureErrorReporter((report) => reports.push(report));
    const failure = new AppError({
      code: 'NETWORK_ERROR',
      message: 'Unable to update Mark',
      operationId: '11111111-1111-4111-8111-111111111111',
      retryable: true,
    });
    const { result, unmount } = renderHook(() => useResourceActions({
      setResourceMark: vi.fn().mockRejectedValue(failure),
      recordResourceVisit: vi.fn(),
      createPrivateResource: vi.fn(),
      updatePrivateResource: vi.fn(),
      deletePrivateResource: vi.fn(),
      refreshSpace: vi.fn(),
    }));

    await act(async () => {
      await expect(result.current.toggleMark(5, false)).rejects.toBe(failure);
    });

    expect(reports).toHaveLength(1);
    expect(reports[0]).toMatchObject({
      context: {
        event: 'resource_mark_failed',
        operationId: '11111111-1111-4111-8111-111111111111',
        resourceId: 5,
      },
    });
    unmount();
    configureErrorReporter(null);
  });

  it('tracks a pending Mark and ignores a duplicate request for the same resource', async () => {
    let finish!: () => void;
    const setResourceMark = vi.fn(() => new Promise<void>((resolve) => { finish = resolve; }));
    const { result } = renderHook(() => useResourceActions({
      setResourceMark,
      recordResourceVisit: vi.fn(),
      createPrivateResource: vi.fn(),
      updatePrivateResource: vi.fn(),
      deletePrivateResource: vi.fn(),
      refreshSpace: vi.fn(),
    }));

    let first!: Promise<void>;
    act(() => {
      first = result.current.toggleMark(5, false);
      void result.current.toggleMark(5, false);
    });

    expect(result.current.markPendingIds).toContain(5);
    expect(setResourceMark).toHaveBeenCalledOnce();

    await act(async () => {
      finish();
      await first;
    });
    expect(result.current.markPendingIds).not.toContain(5);
  });

  it('optimistically changes Mark and rolls back on failure', async () => {
    const setResourceMark = vi.fn().mockRejectedValue(new Error('offline'));
    const { result } = renderHook(() => useResourceActions({
      setResourceMark,
      recordResourceVisit: vi.fn(),
      createPrivateResource: vi.fn(),
      updatePrivateResource: vi.fn(),
      deletePrivateResource: vi.fn(),
      refreshSpace: vi.fn(),
    }));

    let request!: Promise<void>;
    act(() => { request = result.current.toggleMark(5, false); });
    expect(result.current.resolveMarked(5, false)).toBe(true);
    await act(async () => { await expect(request).rejects.toThrow('offline'); });
    expect(result.current.resolveMarked(5, false)).toBe(false);
    expect(result.current.error).toBeInstanceOf(Error);
  });

  it('does not block link navigation when history recording fails', async () => {
    const recordResourceVisit = vi.fn().mockRejectedValue(new Error('history offline'));
    const { result } = renderHook(() => useResourceActions({
      setResourceMark: vi.fn(), recordResourceVisit,
      createPrivateResource: vi.fn(), updatePrivateResource: vi.fn(),
      deletePrivateResource: vi.fn(), refreshSpace: vi.fn(),
    }));

    expect(result.current.recordVisit(8)).toBeUndefined();
    await waitFor(() => expect(result.current.error).toBeInstanceOf(Error));
  });

  it('refreshes Space only after a successful private mutation', async () => {
    const refreshSpace = vi.fn().mockResolvedValue(undefined);
    const createPrivateResource = vi.fn()
      .mockResolvedValueOnce({ status: 'similar_review_required', recommendations: [] })
      .mockResolvedValueOnce({ status: 'saved', resourceId: 9 });
    const { result } = renderHook(() => useResourceActions({
      setResourceMark: vi.fn(), recordResourceVisit: vi.fn(), createPrivateResource,
      updatePrivateResource: vi.fn(), deletePrivateResource: vi.fn(), refreshSpace,
    }));

    await act(async () => {
      const first = await result.current.createResource(input, false);
      expect(first.status).toBe('similar_review_required');
    });
    expect(refreshSpace).not.toHaveBeenCalled();

    await act(async () => {
      const second = await result.current.createResource(input, true);
      expect(second.status).toBe('saved');
    });
    expect(refreshSpace).toHaveBeenCalledOnce();
  });
});
