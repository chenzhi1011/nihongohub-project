import { describe, expect, it, vi } from 'vitest';
import type { AppSupabaseClient } from './supabaseClient';
import { createResourceApi } from './resourceApi';

const input = {
  category: 'listening' as const,
  name: 'Audio',
  description: 'Listening resource',
  url: 'https://audio.example.test/path',
  tags: ['audio'],
};

describe('resourceApi', () => {
  it('sends Mark and history identity-free RPC parameters', async () => {
    const rpc = vi.fn().mockResolvedValue({ data: undefined, error: null });
    const api = createResourceApi({ rpc } as unknown as AppSupabaseClient);

    await api.setResourceMark(4, true);
    await api.recordResourceVisit(4);

    expect(rpc).toHaveBeenNthCalledWith(1, 'set_resource_mark', { p_resource_id: 4, p_marked: true });
    expect(rpc).toHaveBeenNthCalledWith(2, 'record_resource_visit', { p_resource_id: 4 });
  });

  it('maps similarity results returned by the RPC', async () => {
    const rpc = vi.fn().mockResolvedValue({ data: [{
      resource_id: 8, category: 'reading', sort_order: 2, name: 'News', description: 'Easy',
      url: 'https://news.example.test/path', tags: ['news'], source: 'public',
      match_type: 'same_normalized_url',
    }], error: null });
    const api = createResourceApi({ rpc } as unknown as AppSupabaseClient);

    const result = await api.findSimilarResources('https://news.example.test/other');

    expect(rpc).toHaveBeenCalledWith('find_similar_resources', {
      p_url: 'https://news.example.test/other', p_exclude_resource_id: undefined,
    });
    expect(result[0].resource.id).toBe(8);
  });

  it('maps create and update result unions', async () => {
    const rpc = vi.fn()
      .mockResolvedValueOnce({ data: { status: 'saved', resourceId: 11 }, error: null })
      .mockResolvedValueOnce({ data: { status: 'invalid_input' }, error: null });
    const api = createResourceApi({ rpc } as unknown as AppSupabaseClient);

    await expect(api.createPrivateResource(input, { similarResourcesReviewed: true }))
      .resolves.toEqual({ status: 'saved', resourceId: 11 });
    await expect(api.updatePrivateResource(11, input, { similarResourcesReviewed: false }))
      .resolves.toEqual({ status: 'invalid_input' });

    expect(rpc).toHaveBeenNthCalledWith(1, 'create_private_resource', {
      p_category: 'listening', p_name: 'Audio', p_description: 'Listening resource',
      p_url: 'https://audio.example.test/path', p_tags: ['audio'],
      p_similar_resources_reviewed: true,
    });
    expect(rpc).toHaveBeenNthCalledWith(2, 'update_private_resource', expect.objectContaining({
      p_resource_id: 11, p_similar_resources_reviewed: false,
    }));
  });

  it('deletes by resource id without accepting owner identity', async () => {
    const eq = vi.fn().mockResolvedValue({ error: null });
    const deleteQuery = vi.fn().mockReturnValue({ eq });
    const from = vi.fn().mockReturnValue({ delete: deleteQuery });
    const api = createResourceApi({ from } as unknown as AppSupabaseClient);

    await api.deletePrivateResource(17);

    expect(from).toHaveBeenCalledWith('resources');
    expect(deleteQuery).toHaveBeenCalledOnce();
    expect(eq).toHaveBeenCalledWith('id', 17);
  });

  it('converts RPC errors instead of leaking Supabase errors', async () => {
    const rpc = vi.fn().mockResolvedValue({ data: null, error: { message: 'RESOURCE_NOT_PUBLIC' } });
    const api = createResourceApi({ rpc } as unknown as AppSupabaseClient);

    await expect(api.setResourceMark(5, true)).rejects.toMatchObject({ code: 'FORBIDDEN' });
  });

  it('reads only the recent history shape authorized by RLS', async () => {
    const limit = vi.fn().mockResolvedValue({ data: [{
      visit_count: 2, last_visited_at: '2026-09-07T01:00:00Z',
      resources: {
        id: 3, name: 'Visited', description: 'History', url: 'https://visited.example.test',
        tags: [], owner_id: null,
        resource_categories: [{ category: 'reading', sort_order: 0 }],
      },
    }], error: null });
    const order = vi.fn().mockReturnValue({ limit });
    const select = vi.fn().mockReturnValue({ order });
    const from = vi.fn().mockReturnValue({ select });
    const api = createResourceApi({ from } as unknown as AppSupabaseClient);

    const result = await api.fetchRecentHistory(30);

    expect(from).toHaveBeenCalledWith('resource_history');
    expect(order).toHaveBeenCalledWith('last_visited_at', { ascending: false });
    expect(limit).toHaveBeenCalledWith(30);
    expect(result[0]).toMatchObject({ visitCount: 2, resource: { id: 3 } });
  });
});
