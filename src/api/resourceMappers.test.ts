import { describe, expect, it } from 'vitest';
import { mapCatalogRows, mapHistoryRows, mapMutationResult, mapPrivateResourceRows, mapSimilarRows } from './resourceMappers';

describe('resource transport mappers', () => {
  it('groups catalog rows while preserving one canonical id across themes', () => {
    const result = mapCatalogRows([
      {
        category: 'listening', resource_id: 7, name: 'NHK', description: 'News',
        url: 'https://example.test/news', tags: ['news'], sort_order: 1,
        total_count: 8, locked_count: 2, marked: true,
      },
      {
        category: 'reading', resource_id: 7, name: 'NHK', description: 'News',
        url: 'https://example.test/news', tags: ['news'], sort_order: 2,
        total_count: 6, locked_count: 0, marked: true,
      },
    ]);

    expect(result).toEqual([
      {
        category: 'listening', totalCount: 8, lockedCount: 2,
        resources: [{
          id: 7, category: 'listening', name: 'NHK', description: 'News',
          url: 'https://example.test/news', tags: ['news'], source: 'public',
          marked: true, sortOrder: 1,
        }],
      },
      {
        category: 'reading', totalCount: 6, lockedCount: 0,
        resources: [{
          id: 7, category: 'reading', name: 'NHK', description: 'News',
          url: 'https://example.test/news', tags: ['news'], source: 'public',
          marked: true, sortOrder: 2,
        }],
      },
    ]);
  });

  it('maps similarity rows without inventing a category', () => {
    expect(mapSimilarRows([{
      resource_id: 9, category: 'tools', sort_order: 0, name: '辞書',
      description: 'Dictionary', url: 'https://example.test/dict', tags: ['tool'],
      source: 'private', match_type: 'same_normalized_url',
    }])).toEqual([{
      resource: {
        id: 9, category: 'tools', sortOrder: 0, name: '辞書', description: 'Dictionary',
        url: 'https://example.test/dict', tags: ['tool'], source: 'private', marked: false,
      },
      matchType: 'same_normalized_url',
    }]);
  });

  it('maps stable mutation statuses', () => {
    expect(mapMutationResult({ status: 'saved', resourceId: 12 })).toEqual({ status: 'saved', resourceId: 12 });
    expect(mapMutationResult({ status: 'private_limit_reached', current: 200, limit: 200 }))
      .toEqual({ status: 'private_limit_reached', current: 200, limit: 200 });
  });

  it('maps history using one deterministic resource placement', () => {
    expect(mapHistoryRows([{
      visit_count: 3,
      last_visited_at: '2026-09-07T01:00:00Z',
      resources: {
        id: 20, name: 'History', description: 'Visited', url: 'https://history.example.test',
        tags: ['history'], owner_id: null,
        resource_categories: [{ category: 'reading', sort_order: 4 }],
      },
    }])).toEqual([{
      visitCount: 3,
      lastVisitedAt: '2026-09-07T01:00:00Z',
      resource: {
        id: 20, category: 'reading', name: 'History', description: 'Visited',
        url: 'https://history.example.test', tags: ['history'], source: 'public',
        marked: false, sortOrder: 4,
      },
    }]);
  });

  it('maps one private resource with its single theme placement', () => {
    expect(mapPrivateResourceRows([{
      id: 31, name: 'Mine', description: 'Private', url: 'https://mine.example.test',
      tags: ['mine'], resource_categories: [{ category: 'speaking', sort_order: 0 }],
    }])).toEqual([{
      id: 31, category: 'speaking', name: 'Mine', description: 'Private',
      url: 'https://mine.example.test', tags: ['mine'], source: 'private',
      marked: false, sortOrder: 0,
    }]);

    expect(() => mapPrivateResourceRows([{
      id: 32, name: 'Broken', description: 'No placement', url: 'https://broken.example.test',
      tags: [], resource_categories: [],
    }])).toThrow('Invalid private resource row');
  });

  it('rejects malformed RPC payloads at the API boundary', () => {
    expect(() => mapMutationResult({ status: 'saved', resourceId: 'wrong' })).toThrow('Invalid resource mutation response');
    expect(() => mapCatalogRows([{ category: 'unknown' }])).toThrow('Invalid catalog row');
  });
});
