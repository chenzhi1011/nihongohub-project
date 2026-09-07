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
}));

vi.mock('./hooks/useCatalog', () => ({
  useCatalog: () => mocks.catalog,
}));

vi.mock('./hooks/useSupabaseAuth', () => ({
  useSupabaseAuth: () => ({
    user: mocks.auth.user,
    loading: mocks.auth.loading,
    error: null,
    signInWithGoogle: vi.fn(),
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
  });
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
    mocks.space.data = null;
    mocks.space.loading = false;
    mocks.space.error = null;
    mocks.space.retry.mockClear();
    mocks.spaceEnabled.length = 0;
    mocks.resourceDependencies = null;
    mocks.createResource.mockReset();
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
});
