import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SpaceLaunchAnnouncement } from './SpaceLaunchAnnouncement';

const t = (key: string) => ({
  spaceLaunchTitle: '我的学习空间已上线',
  spaceLaunchDescription: '把资源整理成自己的学习路径。',
  spaceLaunchMark: 'Mark 公共资源',
  spaceLaunchPrivateResource: '添加私人资源',
  spaceLaunchPath: '形成学习路径',
  spaceLaunchCheckin: '每日学习打卡',
  spaceLaunchLater: '稍后看看',
  spaceLaunchLogin: '立即登录',
  close: '关闭',
}[key] ?? key);

const baseProps = {
  authenticated: false,
  authLoading: false,
  darkMode: false,
  t,
  onLogin: vi.fn(),
};

beforeEach(() => {
  window.localStorage.clear();
  baseProps.onLogin.mockClear();
});

afterEach(() => vi.restoreAllMocks());

describe('SpaceLaunchAnnouncement', () => {
  it('shows the Space capabilities once authentication is ready', () => {
    render(<SpaceLaunchAnnouncement {...baseProps} />);

    expect(screen.getByRole('dialog', { name: '我的学习空间已上线' })).toBeInTheDocument();
    expect(screen.getByText('Mark 公共资源')).toBeInTheDocument();
    expect(screen.getByText('添加私人资源')).toBeInTheDocument();
    expect(screen.getByText('形成学习路径')).toBeInTheDocument();
    expect(screen.getByText('每日学习打卡')).toBeInTheDocument();
  });

  it('waits for auth and never interrupts an authenticated user', () => {
    const view = render(<SpaceLaunchAnnouncement {...baseProps} authLoading />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    view.rerender(<SpaceLaunchAnnouncement {...baseProps} authenticated authLoading={false} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    view.rerender(<SpaceLaunchAnnouncement {...baseProps} authenticated={false} authLoading={false} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('records dismissal and does not show the same version again', async () => {
    const view = render(<SpaceLaunchAnnouncement {...baseProps} />);
    await userEvent.click(screen.getByRole('button', { name: '稍后看看' }));

    expect(window.localStorage.getItem('nihongohub.announcement.spaceLaunch.v1')).toBe('1');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    view.unmount();
    render(<SpaceLaunchAnnouncement {...baseProps} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('records the announcement before opening login', async () => {
    render(<SpaceLaunchAnnouncement {...baseProps} />);
    await userEvent.click(screen.getByRole('button', { name: '立即登录' }));

    expect(window.localStorage.getItem('nihongohub.announcement.spaceLaunch.v1')).toBe('1');
    expect(baseProps.onLogin).toHaveBeenCalledOnce();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('can close for the current page when localStorage is unavailable', async () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('blocked'); });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('blocked'); });
    render(<SpaceLaunchAnnouncement {...baseProps} />);

    await userEvent.click(screen.getByRole('button', { name: '关闭' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('dismisses with Escape', () => {
    render(<SpaceLaunchAnnouncement {...baseProps} />);
    act(() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' })));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(window.localStorage.getItem('nihongohub.announcement.spaceLaunch.v1')).toBe('1');
  });
});
