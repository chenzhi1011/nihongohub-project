import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { LockedResourcesCard } from './LockedResourcesCard';

describe('LockedResourcesCard', () => {
  it('shows the supplied hidden count and asks for login', async () => {
    const onLoginRequired = vi.fn();
    render(
      <LockedResourcesCard
        lockedCount={12}
        darkMode={false}
        onLoginRequired={onLoginRequired}
        t={(key) => ({ lockedResources: '还有 12 个资源', loginToViewMore: '登录查看更多' }[key] ?? key)}
      />,
    );

    expect(screen.getByText('还有 12 个资源')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: '登录查看更多' }));
    expect(onLoginRequired).toHaveBeenCalledOnce();
  });
});
