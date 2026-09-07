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
}));

vi.mock('./hooks/useCatalog', () => ({
  useCatalog: () => mocks.catalog,
}));

vi.mock('./hooks/useSupabaseAuth', () => ({
  useSupabaseAuth: () => ({
    user: null,
    loading: false,
    error: null,
    signInWithGoogle: vi.fn(),
    signInWithWeChat: vi.fn(),
    signOut: vi.fn(),
  }),
}));

vi.mock('./hooks/useResourceActions', () => ({
  useResourceActions: () => ({
    error: null,
    markPendingIds: [],
    resolveMarked: (_id: number, marked: boolean) => marked,
    toggleMark: vi.fn(),
    recordVisit: vi.fn(),
  }),
}));

import App from './App';

describe('App catalog states', () => {
  beforeEach(() => {
    mocks.catalog.data = [];
    mocks.catalog.loading = true;
    mocks.catalog.error = null;
    mocks.catalog.retry.mockClear();
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
});
