import { describe, expect, it } from 'vitest';
import type { CategoryCatalog, HistoryItem, ResourceRecord } from '../types/resource';
import { buildSpaceSnapshot } from './spaceService';

const resource = (overrides: Partial<ResourceRecord>): ResourceRecord => ({
  id: 1, category: 'reading', name: 'Resource', description: 'Description',
  url: 'https://example.test', tags: [], source: 'public', marked: false, sortOrder: 0,
  ...overrides,
});

describe('buildSpaceSnapshot', () => {
  it('places history first and groups only marked public plus private resources', () => {
    const markedReading = resource({ id: 1, marked: true, category: 'reading', sortOrder: 2 });
    const unmarkedReading = resource({ id: 2, marked: false, category: 'reading' });
    const markedBasic = resource({ id: 3, marked: true, category: 'basic' });
    const privateReading = resource({ id: 4, source: 'private', category: 'reading', name: 'Mine' });
    const catalog: CategoryCatalog[] = [
      { category: 'reading', resources: [markedReading, unmarkedReading], totalCount: 2, lockedCount: 0 },
      { category: 'basic', resources: [markedBasic], totalCount: 1, lockedCount: 0 },
    ];
    const history: HistoryItem[] = [{ resource: unmarkedReading, visitCount: 2, lastVisitedAt: '2026-09-07T01:00:00Z' }];

    const result = buildSpaceSnapshot(catalog, [privateReading], history);

    expect(result.recentHistory).toEqual(history);
    expect(result.sections.map((section) => section.category)).toEqual(['basic', 'reading']);
    expect(result.sections[1].resources.map((item) => item.id)).toEqual([1, 4]);
    expect(result.sections.flatMap((section) => section.resources)).not.toContainEqual(unmarkedReading);
  });

  it('keeps one canonical marked resource in each of its real theme placements', () => {
    const catalog: CategoryCatalog[] = [
      { category: 'listening', resources: [resource({ id: 7, category: 'listening', marked: true })], totalCount: 1, lockedCount: 0 },
      { category: 'reading', resources: [resource({ id: 7, category: 'reading', marked: true })], totalCount: 1, lockedCount: 0 },
    ];

    const result = buildSpaceSnapshot(catalog, [], []);

    expect(result.sections).toHaveLength(2);
    expect(result.sections.map((section) => section.resources[0].id)).toEqual([7, 7]);
  });

  it('removes empty themes and duplicate id/category placements', () => {
    const duplicate = resource({ id: 9, category: 'tools', source: 'private' });
    const result = buildSpaceSnapshot([], [duplicate, duplicate], []);

    expect(result.sections).toEqual([{ category: 'tools', resources: [duplicate] }]);
  });
});
