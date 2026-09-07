import { render, screen } from '@testing-library/react';
import { Headphones } from 'lucide-react';
import { describe, expect, it, vi } from 'vitest';
import type { CategoryCatalog } from '../types/resource';
import { CategoryPage } from './CategoryPage';

const metadata = {
  id: 'listening',
  nameKey: 'listening',
  icon: Headphones,
  resources: [],
};

const catalog: CategoryCatalog = {
  category: 'listening',
  totalCount: 9,
  lockedCount: 8,
  resources: [{
    id: 41,
    category: 'listening',
    name: 'Authorized NHK',
    description: 'Visible through the catalog RPC',
    url: 'https://example.com/visible',
    tags: ['news'],
    source: 'public',
    marked: false,
    sortOrder: 1,
  }],
};

describe('CategoryPage', () => {
  it('renders only catalog resources and the server supplied locked count', () => {
    render(
      <CategoryPage
        category={catalog}
        metadata={metadata}
        darkMode={false}
        t={(key) => ({ listening: '听力', lockedResources: '还有 8 个资源', loginToViewMore: '登录查看更多' }[key] ?? key)}
        onLoginRequired={vi.fn()}
      />,
    );

    expect(screen.getByRole('heading', { name: 'Authorized NHK' })).toBeInTheDocument();
    expect(screen.getByText('还有 8 个资源')).toBeInTheDocument();
  });

  it('does not show a lock card when lockedCount is zero', () => {
    render(
      <CategoryPage
        category={{ ...catalog, lockedCount: 0, totalCount: 1 }}
        metadata={metadata}
        darkMode={false}
        t={(key) => ({ listening: '听力', lockedResources: '隐藏资源' }[key] ?? key)}
        onLoginRequired={vi.fn()}
      />,
    );

    expect(screen.queryByText('隐藏资源')).not.toBeInTheDocument();
  });
});
