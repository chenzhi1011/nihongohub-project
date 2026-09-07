import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useResourceActions } from './useResourceActions';

const input = {
  category: 'reading' as const, name: 'Resource', description: 'Description',
  url: 'https://example.test/path', tags: [],
};

describe('useResourceActions', () => {
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
