import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { PrivateResourceInput, SavePrivateResourceResult } from '../types/resource';
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

const fillValidDraft = async () => {
  await userEvent.selectOptions(screen.getByLabelText('主题'), 'reading');
  await userEvent.type(screen.getByLabelText('名称'), '  My article  ');
  await userEvent.type(screen.getByLabelText('描述'), '  Useful reading  ');
  await userEvent.type(screen.getByLabelText('URL'), 'https://example.com/new');
  await userEvent.type(screen.getByLabelText('标签'), ' news, beginner,news ');
};

const renderDialog = (onCreate: (input: PrivateResourceInput, reviewed: boolean) => Promise<SavePrivateResourceResult>) => {
  const onClose = vi.fn();
  render(
    <PrivateResourceDialog
      open
      darkMode={false}
      t={t}
      onClose={onClose}
      onCreate={onCreate}
      onMarkRecommendation={vi.fn()}
    />,
  );
  return { onClose };
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
});
