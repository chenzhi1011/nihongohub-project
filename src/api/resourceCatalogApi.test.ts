import { describe, expect, it, vi } from 'vitest';
import type { AppSupabaseClient } from './supabaseClient';
import { createResourceCatalogApi, searchVisibleCatalog } from './resourceCatalogApi';

const row = {
  category: 'reading' as const, resource_id: 1, name: 'NHK', description: 'News',
  url: 'https://example.test', tags: ['news'], sort_order: 0,
  total_count: 7, locked_count: 1, marked: false,
};

describe('resourceCatalogApi', () => {
  it('calls the catalog RPC without a caller-provided identity', async () => {
    const rpc = vi.fn().mockResolvedValue({ data: [row], error: null });
    const api = createResourceCatalogApi({ rpc } as unknown as AppSupabaseClient);

    const result = await api.fetchCatalog();

    expect(rpc).toHaveBeenCalledWith('get_catalog_snapshot');
    expect(result[0]).toMatchObject({ category: 'reading', totalCount: 7, lockedCount: 1 });
  });

  it('converts Supabase failures to AppError', async () => {
    const rpc = vi.fn().mockResolvedValue({ data: null, error: { message: 'Failed to fetch' } });
    const api = createResourceCatalogApi({ rpc } as unknown as AppSupabaseClient);

    await expect(api.fetchCatalog()).rejects.toMatchObject({ code: 'NETWORK_ERROR', retryable: true });
  });

  it('searches only the catalog rows already authorized by the database', () => {
    const catalog = [{
      category: 'reading' as const, totalCount: 1, lockedCount: 0,
      resources: [{
        id: 1, category: 'reading' as const, name: 'NHK', description: 'Easy news',
        url: 'https://example.test', tags: ['beginner'], source: 'public' as const,
        marked: false, sortOrder: 0,
      }],
    }];

    expect(searchVisibleCatalog(' BEGINNER ', catalog)).toHaveLength(1);
    expect(searchVisibleCatalog('missing', catalog)).toEqual([]);
    expect(searchVisibleCatalog('   ', catalog)).toEqual([]);
  });
});
