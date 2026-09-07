import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BookOpen } from 'lucide-react';
import { describe, expect, it, vi } from 'vitest';
import { Header } from './Header';

const baseProps = {
  categories: [{ id: 'basic', nameKey: 'basicLearning', icon: BookOpen, resources: [] }],
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
  it('asks the parent to open login for a guest', async () => {
    const onOpenLogin = vi.fn();
    render(<Header {...baseProps} userEmail={null} onOpenLogin={onOpenLogin} />);

    await userEvent.click(screen.getByRole('button', { name: '登录' }));

    expect(onOpenLogin).toHaveBeenCalledOnce();
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
