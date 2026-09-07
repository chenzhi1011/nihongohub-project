import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { HistoryItem, ResourceRecord } from '../types/resource';
import { HistoryRail } from './HistoryRail';

const resource = (id: number, name: string): ResourceRecord => ({
  id,
  category: 'reading',
  name,
  description: `${name} description`,
  url: `https://example.com/${id}`,
  tags: [],
  source: 'public',
  marked: false,
  sortOrder: id,
});

const items: HistoryItem[] = [
  { resource: resource(2, 'Newest'), visitCount: 3, lastVisitedAt: '2026-09-07T03:00:00Z' },
  { resource: resource(1, 'Older'), visitCount: 1, lastVisitedAt: '2026-09-06T03:00:00Z' },
];

describe('HistoryRail', () => {
  it('renders API order in one horizontally scrollable rail', () => {
    render(<HistoryRail items={items} darkMode={false} t={(key) => key} onVisit={vi.fn()} />);

    const rail = screen.getByRole('region', { name: 'recentHistory' });
    expect(rail).toHaveClass('overflow-x-auto');
    expect(within(rail).getAllByRole('link').map((link) => link.textContent)).toEqual([
      expect.stringContaining('Newest'),
      expect.stringContaining('Older'),
    ]);
  });

  it('keeps native external navigation and records another visit', () => {
    const onVisit = vi.fn();
    render(<HistoryRail items={items} darkMode={false} t={(key) => key} onVisit={onVisit} />);

    const link = screen.getByRole('link', { name: /Newest/ });
    const click = new MouseEvent('click', { bubbles: true, cancelable: true });
    fireEvent(link, click);

    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    expect(click.defaultPrevented).toBe(false);
    expect(onVisit).toHaveBeenCalledWith(2);
  });
});
