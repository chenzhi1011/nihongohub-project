import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { PrivateResourceInput, ResourceRecord, SavePrivateResourceResult } from '../types/resource';
import { PrivateResourceDialog } from './PrivateResourceDialog';

const labels: Record<string, string> = {
  addResource: '添加资源',
  resourceCategory: '主题',
  resourceName: '名称',
  resourceDescription: '描述',
  resourceUrl: 'URL',
  resourceTags: '标签',
  saveResource: '保存',
  continueSave: '确认并继续保存',
  close: '关闭',
  basicLearning: '基础',
  examPrep: '考试',
  listening: '听力',
  speaking: '口语',
  reading: '阅读',
  writing: '写作',
  tools: '工具',
  studyInJapan: '留学',
  weeklyPicks: '每周',
  resourceNameRequired: '请输入名称',
  similarResourcesFound: '发现相似资源',
  exactResourceExists: '这个 URL 已保存',
  privateResourceLimitReached: '私人资源数量已达上限',
  similarResourceLimitReached: '同源资源数量已达上限',
  resourceSaveFailed: '保存失败，请重试',
  visitResource: '访问资源',
  editResourceTitle: '编辑资源',
  updateResource: '更新',
};
const t = (key: string) => labels[key] ?? key;

const recommendation = {
  resource: {
    id: 9,
    category: 'reading' as const,
    name: 'Existing resource',
    description: 'Already saved',
    url: 'https://example.com/existing',
    tags: [],
    source: 'public' as const,
    marked: false,
    sortOrder: 0,
  },
  matchType: 'same_normalized_url' as const,
};

const privateResource: ResourceRecord = {
  id: 18,
  category: 'listening',
  name: 'My podcast',
  description: 'Daily listening',
  url: 'https://example.com/podcast',
  tags: ['audio', 'daily'],
  source: 'private',
  marked: false,
  sortOrder: 0,
};

const fillValidDraft = async () => {
  await userEvent.selectOptions(screen.getByLabelText('主题'), 'reading');
  await userEvent.type(screen.getByLabelText('名称'), '  My article  ');
  await userEvent.type(screen.getByLabelText('描述'), '  Useful reading  ');
  await userEvent.type(screen.getByLabelText('URL'), 'https://example.com/new');
  await userEvent.type(screen.getByLabelText('标签'), ' news, beginner,news ');
};

const renderDialog = (
  onSubmit: (input: PrivateResourceInput, reviewed: boolean) => Promise<SavePrivateResourceResult>,
  options: { mode?: 'create' | 'edit'; initialResource?: ResourceRecord | null } = {},
) => {
  const onClose = vi.fn();
  const view = render(
    <PrivateResourceDialog
      open
      darkMode={false}
      t={t}
      onClose={onClose}
      onSubmit={onSubmit}
      onMarkRecommendation={vi.fn()}
      mode={options.mode}
      initialResource={options.initialResource}
    />,
  );
  return { onClose, ...view };
};

describe('PrivateResourceDialog', () => {
  it('keeps invalid input local and does not call onCreate', async () => {
    const onCreate = vi.fn();
    renderDialog(onCreate);

    await userEvent.click(screen.getByRole('button', { name: '保存' }));

    expect(onCreate).not.toHaveBeenCalled();
    expect(screen.getByText('请输入名称')).toBeInTheDocument();
  });

  it('submits normalized input with reviewed=false and closes after saved', async () => {
    const onCreate = vi.fn().mockResolvedValue({ status: 'saved', resourceId: 12 });
    const { onClose } = renderDialog(onCreate);
    await fillValidDraft();

    await userEvent.click(screen.getByRole('button', { name: '保存' }));

    expect(onCreate).toHaveBeenCalledWith({
      category: 'reading',
      name: 'My article',
      description: 'Useful reading',
      url: 'https://example.com/new',
      tags: ['news', 'beginner'],
    }, false);
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('shows exact duplicate recommendations without a continue action', async () => {
    const onCreate = vi.fn().mockResolvedValue({
      status: 'exact_url_exists',
      recommendations: [{ ...recommendation, matchType: 'exact_url' }],
    });
    renderDialog(onCreate);
    await fillValidDraft();
    await userEvent.click(screen.getByRole('button', { name: '保存' }));

    expect(screen.getByText('这个 URL 已保存')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Existing resource/ })).toHaveAttribute('href', 'https://example.com/existing');
    expect(screen.queryByRole('button', { name: '确认并继续保存' })).not.toBeInTheDocument();
  });

  it('continues a same-source save only after explicit confirmation', async () => {
    const onCreate = vi.fn()
      .mockResolvedValueOnce({ status: 'similar_review_required', recommendations: [recommendation] })
      .mockResolvedValueOnce({ status: 'saved', resourceId: 13 });
    renderDialog(onCreate);
    await fillValidDraft();
    await userEvent.click(screen.getByRole('button', { name: '保存' }));

    expect(screen.getByText('发现相似资源')).toBeInTheDocument();
    expect(onCreate).toHaveBeenCalledTimes(1);

    await userEvent.click(screen.getByRole('button', { name: '确认并继续保存' }));
    expect(onCreate).toHaveBeenNthCalledWith(2, expect.any(Object), true);
  });

  it.each([
    [{ status: 'private_limit_reached', current: 200, limit: 200 }, '私人资源数量已达上限'],
    [{ status: 'similar_limit_reached', recommendations: [recommendation] }, '同源资源数量已达上限'],
  ] as const)('shows a blocking limit result', async (result, message) => {
    renderDialog(vi.fn().mockResolvedValue(result));
    await fillValidDraft();
    await userEvent.click(screen.getByRole('button', { name: '保存' }));

    expect(screen.getByText(message)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '确认并继续保存' })).not.toBeInTheDocument();
  });

  it('preserves the draft after a thrown network error', async () => {
    renderDialog(vi.fn().mockRejectedValue(new Error('offline')));
    await fillValidDraft();
    await userEvent.click(screen.getByRole('button', { name: '保存' }));

    expect(screen.getByText('保存失败，请重试')).toBeInTheDocument();
    expect(screen.getByLabelText('名称')).toHaveValue('  My article  ');
  });

  it('prefills edit mode from a private resource', () => {
    renderDialog(vi.fn(), { mode: 'edit', initialResource: privateResource });

    expect(screen.getByRole('dialog', { name: '编辑资源' })).toBeInTheDocument();
    expect(screen.getByLabelText('主题')).toHaveValue('listening');
    expect(screen.getByLabelText('名称')).toHaveValue('My podcast');
    expect(screen.getByLabelText('描述')).toHaveValue('Daily listening');
    expect(screen.getByLabelText('URL')).toHaveValue('https://example.com/podcast');
    expect(screen.getByLabelText('标签')).toHaveValue('audio, daily');
  });

  it('submits edited normalized input with reviewed=false', async () => {
    const onSubmit = vi.fn().mockResolvedValue({ status: 'saved', resourceId: 18 });
    renderDialog(onSubmit, { mode: 'edit', initialResource: privateResource });
    await userEvent.clear(screen.getByLabelText('名称'));
    await userEvent.type(screen.getByLabelText('名称'), '  Updated podcast  ');

    await userEvent.click(screen.getByRole('button', { name: '更新' }));

    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ name: 'Updated podcast' }), false);
  });

  it('continues an edited same-source resource only after confirmation', async () => {
    const onSubmit = vi.fn()
      .mockResolvedValueOnce({ status: 'similar_review_required', recommendations: [recommendation] })
      .mockResolvedValueOnce({ status: 'saved', resourceId: 18 });
    renderDialog(onSubmit, { mode: 'edit', initialResource: privateResource });

    await userEvent.click(screen.getByRole('button', { name: '更新' }));
    expect(onSubmit).toHaveBeenCalledTimes(1);

    await userEvent.click(screen.getByRole('button', { name: '确认并继续保存' }));
    expect(onSubmit).toHaveBeenNthCalledWith(2, expect.any(Object), true);
  });

  it('restores the selected resource when the edit target changes', () => {
    const onSubmit = vi.fn();
    const { rerender } = renderDialog(onSubmit, { mode: 'edit', initialResource: privateResource });
    const nextResource = { ...privateResource, id: 19, name: 'Second resource', tags: ['new'] };

    rerender(
      <PrivateResourceDialog
        open
        darkMode={false}
        t={t}
        onClose={vi.fn()}
        onSubmit={onSubmit}
        onMarkRecommendation={vi.fn()}
        mode="edit"
        initialResource={nextResource}
      />,
    );

    expect(screen.getByLabelText('名称')).toHaveValue('Second resource');
    expect(screen.getByLabelText('标签')).toHaveValue('new');
  });
});
