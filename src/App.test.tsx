import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  catalog: {
    data: [],
    loading: true,
    error: null as unknown,
    retry: vi.fn(async () => undefined),
  },
  auth: {
    user: null as null | { id: string; email: string },
    loading: false,
    sendEmailOtp: vi.fn(async () => undefined),
    verifyEmailOtp: vi.fn(async () => undefined),
    signInWithGoogle: vi.fn(async () => undefined),
  },
  space: {
    data: null as null | { recentHistory: never[]; sections: Array<{ category: 'tools'; resources: Array<Record<string, unknown>> }> },
    loading: false,
    error: null as unknown,
    retry: vi.fn(async () => undefined),
  },
  spaceEnabled: [] as boolean[],
  resourceDependencies: null as null | { refreshSpace: () => Promise<unknown> },
  createResource: vi.fn(),
  updateResource: vi.fn(),
  deleteResource: vi.fn(),
  dailyCheckin: {
    calendar: {
      year: 2026, month: 9, leadingBlankCount: 2, days: [],
      startDate: '2026-09-01', endDateExclusive: '2026-10-01',
    },
    loading: false,
    submitting: false,
    checkedToday: false,
    error: null as unknown,
    checkIn: vi.fn(async () => undefined),
    retry: vi.fn(async () => undefined),
  },
  dailyCheckinArgs: [] as Array<[boolean, string | null]>,
}));

vi.mock('./hooks/useCatalog', () => ({
  useCatalog: () => mocks.catalog,
}));

vi.mock('./hooks/useSupabaseAuth', () => ({
  useSupabaseAuth: () => ({
    user: mocks.auth.user,
    loading: mocks.auth.loading,
    error: null,
    signInWithGoogle: mocks.auth.signInWithGoogle,
    sendEmailOtp: mocks.auth.sendEmailOtp,
    verifyEmailOtp: mocks.auth.verifyEmailOtp,
    signInWithWeChat: vi.fn(),
    signOut: vi.fn(),
  }),
}));

vi.mock('./hooks/useSpace', () => ({
  useSpace: (enabled: boolean) => {
    mocks.spaceEnabled.push(enabled);
    return mocks.space;
  },
}));

vi.mock('./hooks/useResourceActions', () => ({
  useResourceActions: (dependencies: { refreshSpace: () => Promise<unknown> }) => {
    mocks.resourceDependencies = dependencies;
    return ({
    error: null,
    markPendingIds: [],
    resolveMarked: (_id: number, marked: boolean) => marked,
    toggleMark: vi.fn(),
    recordVisit: vi.fn(),
    createResource: mocks.createResource,
    updateResource: mocks.updateResource,
    deleteResource: mocks.deleteResource,
  });
  },
}));

vi.mock('./hooks/useDailyCheckin', () => ({
  useDailyCheckin: (authenticated: boolean, userId: string | null) => {
    mocks.dailyCheckinArgs.push([authenticated, userId]);
    return mocks.dailyCheckin;
  },
}));

import App from './App';

describe('App catalog states', () => {
  beforeEach(() => {
    mocks.catalog.data = [];
    mocks.catalog.loading = true;
    mocks.catalog.error = null;
    mocks.catalog.retry.mockClear();
    mocks.auth.user = null;
    mocks.auth.loading = false;
    mocks.auth.sendEmailOtp.mockClear();
    mocks.auth.verifyEmailOtp.mockClear();
    mocks.auth.signInWithGoogle.mockClear();
    mocks.space.data = null;
    mocks.space.loading = false;
    mocks.space.error = null;
    mocks.space.retry.mockClear();
    mocks.spaceEnabled.length = 0;
    mocks.resourceDependencies = null;
    mocks.createResource.mockReset();
    mocks.updateResource.mockReset();
    mocks.deleteResource.mockReset();
    mocks.dailyCheckin.checkedToday = false;
    mocks.dailyCheckin.submitting = false;
    mocks.dailyCheckin.error = null;
    mocks.dailyCheckin.checkIn.mockClear();
    mocks.dailyCheckin.retry.mockClear();
    mocks.dailyCheckinArgs.length = 0;
  });

  it('shows catalog loading before rendering catalog pages', () => {
    render(<MemoryRouter><App /></MemoryRouter>);

    expect(screen.getByRole('status')).toHaveTextContent(/読み込んでいます|加载/);
  });

  it('shows catalog failure with a retry action', async () => {
    mocks.catalog.loading = false;
    mocks.catalog.error = new Error('offline');
    render(<MemoryRouter><App /></MemoryRouter>);

    await userEvent.click(screen.getByRole('button', { name: /再試行|重试/ }));

    expect(mocks.catalog.retry).toHaveBeenCalledOnce();
    expect(screen.queryByText('offline')).not.toBeInTheDocument();
  });

  it('does not enable personal Space loading for an anonymous visitor', () => {
    mocks.catalog.loading = false;
    render(<MemoryRouter initialEntries={['/space']}><App /></MemoryRouter>);

    expect(mocks.spaceEnabled[mocks.spaceEnabled.length - 1]).toBe(false);
    expect(screen.getByText(/先にログイン|请先登录/)).toBeInTheDocument();
  });

  it('renders the privacy policy at its direct URL', () => {
    mocks.catalog.loading = false;
    render(<MemoryRouter initialEntries={['/privacy']}><App /></MemoryRouter>);

    expect(screen.getByRole('heading', { name: 'プライバシーポリシー' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'chinshi.c@qq.com' })).toHaveAttribute('href', 'mailto:chinshi.c@qq.com');
  });

  it('wires email OTP actions and closes the dialog after authentication', async () => {
    mocks.catalog.loading = false;
    const view = render(<MemoryRouter><App /></MemoryRouter>);

    const spaceButtons = screen.getAllByRole('button', { name: /マイスペース|我的 Space/ });
    await userEvent.click(spaceButtons[0]);
    await userEvent.click(screen.getByRole('button', { name: /メール認証コードでログイン|邮箱验证码登录/ }));
    await userEvent.type(screen.getByRole('textbox', { name: /メールアドレス|邮箱地址/ }), 'learner@example.com');
    await userEvent.click(screen.getByRole('button', { name: /認証コードを送信|发送验证码/ }));
    await userEvent.type(screen.getByRole('textbox', { name: /6桁の認証コード|6 位验证码/ }), '123456');
    await userEvent.click(screen.getByRole('button', { name: /認証してログイン|验证并登录/ }));

    expect(mocks.auth.sendEmailOtp).toHaveBeenCalledWith('learner@example.com');
    expect(mocks.auth.verifyEmailOtp).toHaveBeenCalledWith('learner@example.com', '123456');

    mocks.auth.user = { id: 'user-1', email: 'learner@example.com' };
    view.rerender(<MemoryRouter><App /></MemoryRouter>);
    expect(screen.queryByRole('dialog', { name: /メール認証コードでログイン|邮箱验证码登录/ })).not.toBeInTheDocument();
  });

  it('renders an authenticated Space snapshot', () => {
    mocks.auth.user = { id: 'user-1', email: 'learner@example.com' };
    mocks.catalog.loading = false;
    mocks.space.data = {
      recentHistory: [],
      sections: [{
        category: 'tools',
        resources: [{
          id: 77, category: 'tools', name: 'My dictionary', description: 'Private resource',
          url: 'https://example.com/dictionary', tags: [], source: 'private', marked: false, sortOrder: 0,
        }],
      }],
    };

    render(<MemoryRouter initialEntries={['/space']}><App /></MemoryRouter>);

    expect(mocks.spaceEnabled[mocks.spaceEnabled.length - 1]).toBe(true);
    expect(screen.getByRole('heading', { name: 'My dictionary' })).toBeInTheDocument();
    expect(mocks.dailyCheckinArgs[mocks.dailyCheckinArgs.length - 1]).toEqual([true, 'user-1']);
  });

  it('connects the floating and Space check-in buttons to one shared action', async () => {
    mocks.auth.user = { id: 'user-1', email: 'learner@example.com' };
    mocks.catalog.loading = false;
    mocks.space.data = { recentHistory: [], sections: [] };
    render(<MemoryRouter initialEntries={['/space']}><App /></MemoryRouter>);

    const buttons = screen.getAllByRole('button', { name: /今日チェック|今日打卡/ });
    expect(buttons).toHaveLength(2);
    await userEvent.click(buttons[0]);
    await userEvent.click(buttons[1]);

    expect(mocks.dailyCheckin.checkIn).toHaveBeenCalledTimes(2);
  });

  it('provides a shared refresh for catalog and Space mutations', async () => {
    mocks.auth.user = { id: 'user-1', email: 'learner@example.com' };
    mocks.catalog.loading = false;
    mocks.space.data = { recentHistory: [], sections: [] };
    render(<MemoryRouter initialEntries={['/space']}><App /></MemoryRouter>);

    await mocks.resourceDependencies?.refreshSpace();

    expect(mocks.catalog.retry).toHaveBeenCalledOnce();
    expect(mocks.space.retry).toHaveBeenCalledOnce();
  });

  it('connects private resource creation from Space to the action hook', async () => {
    mocks.auth.user = { id: 'user-1', email: 'learner@example.com' };
    mocks.catalog.loading = false;
    mocks.space.data = { recentHistory: [], sections: [] };
    mocks.createResource.mockResolvedValue({ status: 'saved', resourceId: 88 });
    render(<MemoryRouter initialEntries={['/space']}><App /></MemoryRouter>);

    await userEvent.click(screen.getByRole('button', { name: /リソースを追加|添加资源/ }));

    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('connects private edit and delete dialogs from Space to the action hook', async () => {
    mocks.auth.user = { id: 'user-1', email: 'learner@example.com' };
    mocks.catalog.loading = false;
    mocks.space.data = {
      recentHistory: [],
      sections: [{
        category: 'tools',
        resources: [{
          id: 77, category: 'tools', name: 'My dictionary', description: 'Private resource',
          url: 'https://example.com/dictionary', tags: [], source: 'private', marked: false, sortOrder: 0,
        }],
      }],
    };
    render(<MemoryRouter initialEntries={['/space']}><App /></MemoryRouter>);

    await userEvent.click(screen.getByRole('button', { name: /リソース操作|资源操作/ }));
    await userEvent.click(screen.getByRole('button', { name: /編集|编辑/ }));

    expect(screen.getByRole('dialog', { name: /リソースを編集|编辑资源/ })).toBeInTheDocument();
  });
});
