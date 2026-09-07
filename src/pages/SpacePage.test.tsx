import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { SpaceSnapshot } from '../types/resource';
import { SpacePage } from './SpacePage';

const t = (key: string) => ({
  space: '我的 Space',
  loginRequired: '请先登录',
  login: '登录',
  spaceLoading: '正在加载 Space…',
  spaceLoadFailed: 'Space 加载失败',
  retry: '重试',
  spaceEmpty: '你的 Space 还是空的',
  addResource: '添加资源',
  resourceCategory: '主题',
  resourceName: '名称',
  resourceDescription: '描述',
  resourceUrl: 'URL',
  resourceTags: '标签',
  saveResource: '保存',
  close: '关闭',
  resourceActions: '资源操作',
  editResource: '编辑',
  deleteResource: '删除',
  editResourceTitle: '编辑资源',
  updateResource: '更新',
  deleteResourceTitle: '删除资源',
  deleteResourceQuestion: '确定要永久删除这个资源吗？',
  cancel: '取消',
  confirmDeleteResource: '确认删除',
}[key] ?? key);

const emptySnapshot: SpaceSnapshot = { recentHistory: [], sections: [] };
const publicResource = {
  id: 21,
  category: 'reading' as const,
  name: 'Marked public',
  description: 'Public description',
  url: 'https://example.com/public',
  tags: ['reading'],
  source: 'public' as const,
  marked: true,
  sortOrder: 1,
};
const privateResource = {
  ...publicResource,
  id: 22,
  name: 'My private resource',
  url: 'https://example.com/private',
  source: 'private' as const,
  marked: false,
};

const renderSpace = (overrides: Partial<React.ComponentProps<typeof SpacePage>> = {}) => {
  const props: React.ComponentProps<typeof SpacePage> = {
    authenticated: true,
    loading: false,
    error: null,
    data: emptySnapshot,
    darkMode: false,
    t,
    onLoginRequired: vi.fn(),
    onRetry: vi.fn(),
    resolveMarked: (_id, marked) => marked,
    markPendingIds: [],
    onToggleMark: vi.fn(),
    onVisit: vi.fn(),
    onCreateResource: vi.fn().mockResolvedValue({ status: 'saved', resourceId: 24 }),
    onUpdateResource: vi.fn().mockResolvedValue({ status: 'saved', resourceId: 22 }),
    onDeleteResource: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
  render(<SpacePage {...props} />);
  return props;
};

describe('SpacePage states', () => {
  it('shows a login action for direct anonymous access', async () => {
    const props = renderSpace({ authenticated: false, loading: true, error: new Error('must stay private'), data: null });

    expect(screen.getByText('请先登录')).toBeInTheDocument();
    expect(screen.queryByText('must stay private')).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: '登录' }));
    expect(props.onLoginRequired).toHaveBeenCalledOnce();
  });

  it('shows loading while personal data is loading', () => {
    renderSpace({ loading: true, data: null });
    expect(screen.getByRole('status')).toHaveTextContent('正在加载 Space…');
  });

  it('shows an explicit failure and retry action instead of an empty Space', async () => {
    const props = renderSpace({ error: new Error('offline'), data: null });

    expect(screen.getByRole('alert')).toHaveTextContent('Space 加载失败');
    expect(screen.queryByText('你的 Space 还是空的')).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: '重试' }));
    expect(props.onRetry).toHaveBeenCalledOnce();
  });

  it('shows a genuine empty state after a successful empty snapshot', () => {
    renderSpace();
    expect(screen.getByText('你的 Space 还是空的')).toBeInTheDocument();
  });

  it('opens private resource creation for an authenticated user', async () => {
    renderSpace();

    await userEvent.click(screen.getByRole('button', { name: '添加资源' }));

    expect(screen.getByRole('dialog', { name: '添加资源' })).toBeInTheDocument();
  });

  it('does not expose private resource creation to an anonymous user', () => {
    renderSpace({ authenticated: false });

    expect(screen.queryByRole('button', { name: '添加资源' })).not.toBeInTheDocument();
  });

  it('renders history and non-empty theme sections in snapshot order', () => {
    renderSpace({
      data: {
        recentHistory: [{ resource: publicResource, visitCount: 2, lastVisitedAt: '2026-09-07T03:00:00Z' }],
        sections: [
          { category: 'reading', resources: [publicResource, privateResource] },
          { category: 'tools', resources: [{ ...privateResource, id: 23, category: 'tools', name: 'Tool resource' }] },
        ],
      },
    });

    expect(screen.getByRole('region', { name: 'recentHistory' })).toBeInTheDocument();
    const sectionHeadings = screen.getAllByRole('heading', { level: 2 }).map((heading) => heading.textContent);
    expect(sectionHeadings).toEqual(['reading', 'tools']);
    expect(screen.getByRole('heading', { name: 'Marked public' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'My private resource' })).toBeInTheDocument();
  });

  it('hides an optimistically unmarked public resource but keeps private resources', () => {
    renderSpace({
      data: {
        recentHistory: [],
        sections: [{ category: 'reading', resources: [publicResource, privateResource] }],
      },
      resolveMarked: (id, marked) => id === 21 ? false : marked,
    });

    expect(screen.queryByRole('heading', { name: 'Marked public' })).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'My private resource' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Mark/ })).not.toBeInTheDocument();
  });

  it('opens a prefilled edit form and submits the selected private resource', async () => {
    const props = renderSpace({
      data: { recentHistory: [], sections: [{ category: 'reading', resources: [privateResource] }] },
    });

    await userEvent.click(screen.getByRole('button', { name: '资源操作' }));
    await userEvent.click(screen.getByRole('button', { name: '编辑' }));

    expect(screen.getByRole('dialog', { name: '编辑资源' })).toBeInTheDocument();
    expect(screen.getByLabelText('名称')).toHaveValue('My private resource');
    await userEvent.click(screen.getByRole('button', { name: '更新' }));
    expect(props.onUpdateResource).toHaveBeenCalledWith(22, expect.objectContaining({
      name: 'My private resource',
      category: 'reading',
    }), false);
  });

  it('requires confirmation before deleting the selected private resource', async () => {
    const props = renderSpace({
      data: { recentHistory: [], sections: [{ category: 'reading', resources: [privateResource] }] },
    });

    await userEvent.click(screen.getByRole('button', { name: '资源操作' }));
    await userEvent.click(screen.getByRole('button', { name: '删除' }));

    expect(screen.getByRole('dialog', { name: '删除资源' })).toHaveTextContent('My private resource');
    expect(props.onDeleteResource).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole('button', { name: '确认删除' }));
    expect(props.onDeleteResource).toHaveBeenCalledWith(22);
  });

  it('does not expose private actions on a public resource', () => {
    renderSpace({ data: { recentHistory: [], sections: [{ category: 'reading', resources: [publicResource] }] } });

    expect(screen.queryByRole('button', { name: '资源操作' })).not.toBeInTheDocument();
  });
});
