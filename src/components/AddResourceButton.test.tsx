import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { AddResourceButton } from './AddResourceButton';

describe('AddResourceButton', () => {
  it('emits an open action without owning another modal', async () => {
    const onClick = vi.fn();
    render(<AddResourceButton darkMode={false} t={() => '添加资源'} onClick={onClick} />);

    await userEvent.click(screen.getByRole('button', { name: '添加资源' }));

    expect(onClick).toHaveBeenCalledOnce();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
