import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useSpace } from './useSpace';
import { AppError } from '../errors/appError';
import { configureErrorReporter } from '../observability/errorReporter';

describe('useSpace', () => {
  it('reports a handled Space AppError once', async () => {
    const reports: unknown[] = [];
    configureErrorReporter((report) => reports.push(report));
    const failure = new AppError({
      code: 'NETWORK_ERROR',
      message: 'Space unavailable',
      operationId: '22222222-2222-4222-8222-222222222222',
      retryable: true,
    });
    const dependencies = {
      fetchCatalog: vi.fn().mockRejectedValue(failure),
      fetchPrivateResources: vi.fn().mockResolvedValue([]),
      fetchRecentHistory: vi.fn().mockResolvedValue([]),
    };

    const { result, unmount } = renderHook(() => useSpace(true, dependencies));
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(reports).toHaveLength(1);
    expect(reports[0]).toMatchObject({
      context: {
        event: 'space_fetch_failed',
        operationId: '22222222-2222-4222-8222-222222222222',
      },
    });
    unmount();
    configureErrorReporter(null);
  });

  it('loads inputs in parallel and composes a Space snapshot', async () => {
    const dependencies = {
      fetchCatalog: vi.fn().mockResolvedValue([]),
      fetchPrivateResources: vi.fn().mockResolvedValue([{
        id: 4, category: 'tools' as const, name: 'Mine', description: 'Private',
        url: 'https://mine.example.test', tags: [], source: 'private' as const,
        marked: false, sortOrder: 0,
      }]),
      fetchRecentHistory: vi.fn().mockResolvedValue([]),
    };
    const { result } = renderHook(() => useSpace(true, dependencies));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data?.sections[0]).toMatchObject({ category: 'tools' });
    expect(Object.values(dependencies).every((fn) => fn.mock.calls.length === 1)).toBe(true);
  });

  it('shows failure instead of pretending Space is empty', async () => {
    const dependencies = {
      fetchCatalog: vi.fn().mockRejectedValue(new Error('offline')),
      fetchPrivateResources: vi.fn().mockResolvedValue([]),
      fetchRecentHistory: vi.fn().mockResolvedValue([]),
    };
    const { result } = renderHook(() => useSpace(true, dependencies));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data).toBeNull();
    expect(result.current.error).toBeInstanceOf(Error);
  });

  it('clears personal data immediately after logout', async () => {
    const dependencies = {
      fetchCatalog: vi.fn().mockResolvedValue([]),
      fetchPrivateResources: vi.fn().mockResolvedValue([]),
      fetchRecentHistory: vi.fn().mockResolvedValue([]),
    };
    const { result, rerender } = renderHook(
      ({ enabled }) => useSpace(enabled, dependencies),
      { initialProps: { enabled: true } },
    );
    await waitFor(() => expect(result.current.data).not.toBeNull());

    rerender({ enabled: false });

    expect(result.current.data).toBeNull();
    expect(result.current.loading).toBe(false);
  });
});
