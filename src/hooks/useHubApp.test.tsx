import { act, renderHook } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import type { PropsWithChildren } from 'react';
import type { CategoryCatalog } from '../types/resource';
import { useHubApp } from './useHubApp';

const catalog: CategoryCatalog[] = [{
  category: 'listening',
  totalCount: 1,
  lockedCount: 0,
  resources: [{
    id: 91,
    category: 'listening',
    name: 'Database-only resource',
    description: 'Not present in static data',
    url: 'https://example.com/database-only',
    tags: ['authorized'],
    source: 'public',
    marked: false,
    sortOrder: 0,
  }],
}];

const wrapper = ({ children }: PropsWithChildren) => (
  <MemoryRouter>{children}</MemoryRouter>
);

describe('useHubApp authorized catalog', () => {
  it('searches only the catalog supplied by the caller', () => {
    const { result } = renderHook(() => useHubApp(catalog), { wrapper });

    act(() => result.current.setSearchQuery('database-only'));

    expect(result.current.filteredResources).toHaveLength(1);
    expect(result.current.filteredResources[0]).toMatchObject({ id: 91, category: 'listening' });
  });

  it('keeps the Space route active', () => {
    const spaceWrapper = ({ children }: PropsWithChildren) => (
      <MemoryRouter initialEntries={['/space']}>{children}</MemoryRouter>
    );
    const { result } = renderHook(() => useHubApp(catalog), { wrapper: spaceWrapper });

    expect(result.current.activeCategory).toBe('space');
  });
});
