import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { ResourceRecord } from '../types/resource';
import { ResourceCard } from './ResourceCard';

const publicResource: ResourceRecord & { categoryName?: string } = {
  id: 41,
  category: 'listening',
  name: 'NHK Easy News',
  description: 'Japanese news with audio',
  url: 'https://example.com/news',
  tags: ['beginner', 'news'],
  source: 'public',
  marked: false,
  sortOrder: 1,
  categoryName: '听力',
};

const t = (key: string) => ({
  from: '来自：',
  visitResource: '访问资源',
  markResource: 'Mark 资源',
  unmarkResource: '取消 Mark',
  resourceActions: '资源操作',
  editResource: '编辑',
  deleteResource: '删除',
}[key] ?? key);

const renderCard = (overrides: Partial<React.ComponentProps<typeof ResourceCard>> = {}) => {
  const props: React.ComponentProps<typeof ResourceCard> = {
    resource: publicResource,
    authenticated: true,
    marked: false,
    darkMode: false,
    t,
    variant: 'search',
    showCategoryLine: true,
    onToggleMark: vi.fn(),
    onLoginRequired: vi.fn(),
    onVisit: vi.fn(),
    ...overrides,
  };
  render(<ResourceCard {...props} />);
  return props;
};

describe('ResourceCard', () => {
  it('renders resource content and a safe external link', () => {
    renderCard();

    expect(screen.getByRole('heading', { name: 'NHK Easy News' })).toBeInTheDocument();
    expect(screen.getByText('Japanese news with audio')).toBeInTheDocument();
    expect(screen.getByText('beginner')).toBeInTheDocument();
    expect(screen.getByText((_, element) => element?.textContent === '来自：听力')).toBeInTheDocument();

    const link = screen.getByRole('link', { name: /访问资源/ });
    expect(link).toHaveAttribute('href', 'https://example.com/news');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('shows a pressed star for a marked public resource when authenticated', async () => {
    const onToggleMark = vi.fn();
    renderCard({ marked: true, onToggleMark });

    const star = screen.getByRole('button', { name: '取消 Mark' });
    expect(star).toHaveAttribute('aria-pressed', 'true');

    await userEvent.click(star);
    expect(onToggleMark).toHaveBeenCalledWith(41, true);
  });

  it('keeps the Mark control and hides ownership actions for a public resource', () => {
    renderCard();

    expect(screen.getByRole('button', { name: 'Mark 资源' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '资源操作' })).not.toBeInTheDocument();
  });

  it('shows a private overflow menu instead of Mark', async () => {
    renderCard({
      resource: { ...publicResource, source: 'private' },
      onEditPrivate: vi.fn(),
      onDeletePrivate: vi.fn(),
    });

    expect(screen.queryByRole('button', { name: /Mark/ })).not.toBeInTheDocument();
    const menuButton = screen.getByRole('button', { name: '资源操作' });
    expect(screen.queryByRole('button', { name: '编辑' })).not.toBeInTheDocument();

    await userEvent.click(menuButton);

    expect(screen.getByRole('button', { name: '编辑' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '删除' })).toBeInTheDocument();
  });

  it('emits the selected private resource for edit and delete', async () => {
    const privateResource = { ...publicResource, source: 'private' as const };
    const onEditPrivate = vi.fn();
    const onDeletePrivate = vi.fn();
    renderCard({ resource: privateResource, onEditPrivate, onDeletePrivate });

    await userEvent.click(screen.getByRole('button', { name: '资源操作' }));
    await userEvent.click(screen.getByRole('button', { name: '编辑' }));
    expect(onEditPrivate).toHaveBeenCalledWith(privateResource);

    await userEvent.click(screen.getByRole('button', { name: '资源操作' }));
    await userEvent.click(screen.getByRole('button', { name: '删除' }));
    expect(onDeletePrivate).toHaveBeenCalledWith(privateResource);
  });

  it('asks for login when a guest attempts to Mark', async () => {
    const onLoginRequired = vi.fn();
    const onToggleMark = vi.fn();
    renderCard({ authenticated: false, onLoginRequired, onToggleMark });

    await userEvent.click(screen.getByRole('button', { name: 'Mark 资源' }));

    expect(onLoginRequired).toHaveBeenCalledOnce();
    expect(onToggleMark).not.toHaveBeenCalled();
  });

  it('records an authenticated visit without preventing native navigation', () => {
    const onVisit = vi.fn();
    renderCard({ onVisit });

    const link = screen.getByRole('link', { name: /访问资源/ });
    const click = new MouseEvent('click', { bubbles: true, cancelable: true });
    fireEvent(link, click);

    expect(click.defaultPrevented).toBe(false);
    expect(onVisit).toHaveBeenCalledWith(41);
  });

  it('does not record anonymous browsing history', () => {
    const onVisit = vi.fn();
    renderCard({ authenticated: false, onVisit });

    fireEvent.click(screen.getByRole('link', { name: /访问资源/ }));

    expect(onVisit).not.toHaveBeenCalled();
  });
});
