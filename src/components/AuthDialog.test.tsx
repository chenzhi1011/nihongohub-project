import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { AuthDialog } from './AuthDialog';

const t = (key: string) => ({
  loginMethodTitle: '选择登录方式',
  loginMethodDesc: '使用以下方式快速登录',
  emailAddress: '邮箱地址',
  emailPlaceholder: 'you@example.com',
  loginEmail: '发送登录链接',
  magicLinkSent: '登录链接已发送，请检查邮箱。',
  loginGoogle: 'Google 登录',
  devInProgressOk: '关闭',
}[key] ?? key);

describe('AuthDialog', () => {
  it('starts Google login and disables the action while it is pending', async () => {
    let finishLogin: (() => void) | undefined;
    const onGoogleLogin = vi.fn(() => new Promise<void>((resolve) => {
      finishLogin = resolve;
    }));

    render(
      <AuthDialog
        open
        darkMode={false}
        error={null}
        t={t}
        onClose={vi.fn()}
        onEmailLogin={vi.fn()}
        onGoogleLogin={onGoogleLogin}
      />,
    );

    const loginButton = screen.getByRole('button', { name: 'Google 登录' });
    await userEvent.click(loginButton);

    expect(onGoogleLogin).toHaveBeenCalledOnce();
    expect(loginButton).toBeDisabled();

    await act(async () => {
      finishLogin?.();
    });
  });

  it('sends a magic link to the entered email and confirms delivery', async () => {
    const onEmailLogin = vi.fn().mockResolvedValue(undefined);
    render(
      <AuthDialog
        open
        darkMode={false}
        error={null}
        t={t}
        onClose={vi.fn()}
        onEmailLogin={onEmailLogin}
        onGoogleLogin={vi.fn()}
      />,
    );

    await userEvent.type(screen.getByRole('textbox', { name: '邮箱地址' }), 'learner@example.com');
    await userEvent.click(screen.getByRole('button', { name: '发送登录链接' }));

    expect(onEmailLogin).toHaveBeenCalledWith('learner@example.com');
    expect(screen.getByRole('status')).toHaveTextContent('登录链接已发送，请检查邮箱。');
  });

  it('shows the supplied authentication error', () => {
    render(
      <AuthDialog
        open
        darkMode={false}
        error="Google 登录暂时失败，请重试。"
        t={t}
        onClose={vi.fn()}
        onEmailLogin={vi.fn()}
        onGoogleLogin={vi.fn()}
      />,
    );

    expect(screen.getByRole('alert')).toHaveTextContent('Google 登录暂时失败，请重试。');
  });

  it('renders nothing while closed', () => {
    render(
      <AuthDialog
        open={false}
        darkMode={false}
        error={null}
        t={t}
        onClose={vi.fn()}
        onEmailLogin={vi.fn()}
        onGoogleLogin={vi.fn()}
      />,
    );

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
