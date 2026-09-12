import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BookOpen } from 'lucide-react';
import { describe, expect, it, vi } from 'vitest';
import { Header } from './Header';

const baseProps = {
  categories: [{ id: 'basic', nameKey: 'basicLearning', icon: BookOpen }],
  activeCategory: 'home',
  darkMode: false,
  language: 'zh' as const,
  mobileMenuOpen: false,
  onToggleMobileMenu: vi.fn(),
  onToggleDarkMode: vi.fn(),
  onToggleLanguage: vi.fn(),
  onCategoryClick: vi.fn(),
  onLogoClick: vi.fn(),
  t: (key: string) => ({
    title: '日本語 HUB',
    basicLearning: '基础学习',
    login: '登录',
    logout: '退出',
    space: '我的 Space',
  }[key] ?? key),
  authLoading: false,
  onOpenLogin: vi.fn(),
  onOpenSpace: vi.fn(),
  onSignOut: vi.fn(async () => undefined),
};

describe('Header authentication actions', () => {
  it('keeps wide navigation and account actions hidden until 2xl screens', () => {
    const { container } = render(<Header {...baseProps} userEmail={null} />);

    expect(container.querySelector('nav')).toHaveClass('hidden', '2xl:flex');
    expect(screen.getByTestId('desktop-account-actions')).toHaveClass('hidden', '2xl:flex');
    expect(screen.getByRole('button', { name: 'Open navigation menu' })).toHaveClass('2xl:hidden');
  });

  it('shows account actions inside the compact navigation menu without wrapping labels', () => {
    render(<Header {...baseProps} userEmail="learner@example.com" mobileMenuOpen />);

    const spaceActions = screen.getAllByRole('button', { name: '我的 Space' });
    expect(spaceActions[spaceActions.length - 1]).toHaveClass('whitespace-nowrap');
  });

  it('shows Space for a guest and opens login when it is clicked', async () => {
    const onOpenLogin = vi.fn();
    render(<Header {...baseProps} userEmail={null} onOpenLogin={onOpenLogin} />);

    await userEvent.click(screen.getByRole('button', { name: '我的 Space' }));

    expect(onOpenLogin).toHaveBeenCalledOnce();
    expect(screen.queryByRole('button', { name: '登录' })).not.toBeInTheDocument();
  });

  it('shows Space and logout actions for an authenticated user', async () => {
    const onOpenSpace = vi.fn();
    const onSignOut = vi.fn(async () => undefined);
    render(
      <Header
        {...baseProps}
        userEmail="learner@example.com"
        onOpenSpace={onOpenSpace}
        onSignOut={onSignOut}
      />,
    );

    await userEvent.click(screen.getByRole('button', { name: '我的 Space' }));
    await userEvent.click(screen.getByRole('button', { name: /退出/ }));

    expect(onOpenSpace).toHaveBeenCalledOnce();
    expect(onSignOut).toHaveBeenCalledOnce();
  });
});
