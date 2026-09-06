import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ResourceCard } from './ResourceCard';

describe('ResourceCard', () => {
  it('renders resource content and a safe external link', () => {
    render(
      <ResourceCard
        resource={{
          name: 'NHK Easy News',
          description: 'Japanese news with audio',
          url: 'https://example.com/news',
          tags: ['beginner', 'news'],
          categoryName: '听力',
        }}
        darkMode={false}
        t={(key) => ({ from: '来自：', visitResource: '访问资源' })[key] ?? key}
        variant="search"
        showCategoryLine
      />,
    );

    expect(screen.getByRole('heading', { name: 'NHK Easy News' })).toBeInTheDocument();
    expect(screen.getByText('Japanese news with audio')).toBeInTheDocument();
    expect(screen.getByText('beginner')).toBeInTheDocument();
    expect(
      screen.getByText((_, element) => element?.textContent === '来自：听力'),
    ).toBeInTheDocument();

    const link = screen.getByRole('link', { name: /访问资源/ });
    expect(link).toHaveAttribute('href', 'https://example.com/news');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });
});
