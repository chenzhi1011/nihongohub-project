import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { ResourceRecord } from '../types/resource';
import { DeleteResourceDialog } from './DeleteResourceDialog';

const resource: ResourceRecord = {
  id: 31,
  category: 'reading',
  name: 'My reading list',
  description: 'Private notes',
  url: 'https://example.com/list',
  tags: [],
  source: 'private',
  marked: false,
  sortOrder: 0,
};

const labels: Record<string, string> = {
  deleteResourceTitle: '删除资源',
  deleteResourceQuestion: '确定要永久删除这个资源吗？',
  cancel: '取消',
  confirmDeleteResource: '确认删除',
  deletingResource: '正在删除…',
  resourceDeleteFailed: '删除失败，请重试',
  close: '关闭',
};
const t = (key: string) => labels[key] ?? key;

function renderDialog(onDelete: (resourceId: number) => Promise<void>) {
  const onClose = vi.fn();
  render(
    <DeleteResourceDialog
      open
      resource={resource}
      darkMode={false}
      t={t}
      onClose={onClose}
      onDelete={onDelete}
    />,
  );
  return { onClose };
}

describe('DeleteResourceDialog', () => {
  it('names the resource and does not delete when cancelled', async () => {
    const onDelete = vi.fn();
    const { onClose } = renderDialog(onDelete);

    expect(screen.getByRole('dialog', { name: '删除资源' })).toHaveTextContent('My reading list');
    expect(screen.getByText('确定要永久删除这个资源吗？')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: '取消' }));

    expect(onDelete).not.toHaveBeenCalled();
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('waits for confirmation and closes after successful deletion', async () => {
    const onDelete = vi.fn().mockResolvedValue(undefined);
    const { onClose } = renderDialog(onDelete);

    expect(onDelete).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole('button', { name: '确认删除' }));

    expect(onDelete).toHaveBeenCalledWith(31);
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('keeps the dialog open with a safe retry message after failure', async () => {
    const onDelete = vi.fn()
      .mockRejectedValueOnce(new Error('database detail must stay hidden'))
      .mockResolvedValueOnce(undefined);
    const { onClose } = renderDialog(onDelete);

    await userEvent.click(screen.getByRole('button', { name: '确认删除' }));

    expect(screen.getByText('删除失败，请重试')).toBeInTheDocument();
    expect(screen.queryByText(/database detail/)).not.toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole('button', { name: '确认删除' }));
    expect(onDelete).toHaveBeenCalledTimes(2);
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('prevents duplicate confirmation while deletion is pending', async () => {
    let finishDelete: (() => void) | undefined;
    const onDelete = vi.fn(() => new Promise<void>((resolve) => { finishDelete = resolve; }));
    const { onClose } = renderDialog(onDelete);

    await userEvent.click(screen.getByRole('button', { name: '确认删除' }));

    expect(screen.getByRole('button', { name: '正在删除…' })).toBeDisabled();
    expect(onDelete).toHaveBeenCalledOnce();
    finishDelete?.();
    await waitFor(() => expect(onClose).toHaveBeenCalledOnce());
  });
});
