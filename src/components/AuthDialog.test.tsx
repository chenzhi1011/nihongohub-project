import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AuthDialog } from './AuthDialog';

const t = (key: string) => ({
  loginMethodTitle: '选择登录方式', loginMethodDesc: '使用以下方式快速登录',
  loginEmailOtp: '邮箱验证码登录', loginGoogle: 'Google 登录',
  emailOtpTitle: '邮箱验证码登录', emailAddress: '邮箱地址',
  emailPlaceholder: 'you@example.com', sendEmailOtp: '发送验证码',
  emailOtpSending: '正在发送…', emailOtpSentTo: '验证码已发送至 {email}',
  emailOtpCode: '6 位验证码', emailOtpCodePlaceholder: '请输入验证码',
  verifyEmailOtp: '验证并登录', emailOtpVerifying: '正在验证…',
  resendEmailOtpIn: '{seconds} 秒后可重新发送', resendEmailOtp: '重新发送验证码',
  emailOtpResent: '验证码已重新发送。', changeEmail: '更换邮箱',
  backToLoginMethods: '返回登录方式', loginPending: '正在跳转…', close: '关闭',
}[key] ?? key);

const renderDialog = (overrides: Partial<React.ComponentProps<typeof AuthDialog>> = {}) => {
  const props: React.ComponentProps<typeof AuthDialog> = {
    open: true, darkMode: false, error: null, t, onClose: vi.fn(),
    onSendEmailOtp: vi.fn().mockResolvedValue(undefined),
    onVerifyEmailOtp: vi.fn().mockResolvedValue(undefined),
    onGoogleLogin: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
  const view = render(<AuthDialog {...props} />);
  return { props, ...view };
};

async function reachOtpStep() {
  const result = renderDialog();
  await userEvent.click(screen.getByRole('button', { name: '邮箱验证码登录' }));
  await userEvent.type(screen.getByRole('textbox', { name: '邮箱地址' }), 'learner@example.com');
  await userEvent.click(screen.getByRole('button', { name: '发送验证码' }));
  return result;
}

afterEach(() => vi.useRealTimers());

describe('AuthDialog', () => {
  it('starts with only email OTP and Google login methods', () => {
    renderDialog();
    expect(screen.getByRole('button', { name: '邮箱验证码登录' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Google 登录' })).toBeInTheDocument();
    expect(screen.queryByRole('textbox', { name: '邮箱地址' })).not.toBeInTheDocument();
  });

  it('sends an OTP from the email step', async () => {
    const { props } = renderDialog();
    await userEvent.click(screen.getByRole('button', { name: '邮箱验证码登录' }));
    await userEvent.type(screen.getByRole('textbox', { name: '邮箱地址' }), 'learner@example.com');
    await userEvent.click(screen.getByRole('button', { name: '发送验证码' }));
    expect(props.onSendEmailOtp).toHaveBeenCalledWith('learner@example.com');
    expect(screen.getByText('验证码已发送至 learner@example.com')).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: '6 位验证码' })).toBeInTheDocument();
  });

  it('stays on the email step when sending fails', async () => {
    renderDialog({ onSendEmailOtp: vi.fn().mockRejectedValue(new Error('offline')) });
    await userEvent.click(screen.getByRole('button', { name: '邮箱验证码登录' }));
    await userEvent.type(screen.getByRole('textbox', { name: '邮箱地址' }), 'learner@example.com');
    await userEvent.click(screen.getByRole('button', { name: '发送验证码' }));

    expect(screen.getByRole('textbox', { name: '邮箱地址' })).toHaveValue('learner@example.com');
    expect(screen.queryByRole('textbox', { name: '6 位验证码' })).not.toBeInTheDocument();
  });

  it('keeps only six digits and verifies the OTP', async () => {
    const { props } = await reachOtpStep();
    const otpInput = screen.getByRole('textbox', { name: '6 位验证码' });
    await userEvent.type(otpInput, '12a-34567');
    expect(otpInput).toHaveValue('123456');
    await userEvent.click(screen.getByRole('button', { name: '验证并登录' }));
    expect(props.onVerifyEmailOtp).toHaveBeenCalledWith('learner@example.com', '123456');
  });

  it('enables resend after 60 seconds and restarts the countdown after success', async () => {
    vi.useFakeTimers();
    const onSendEmailOtp = vi.fn().mockResolvedValue(undefined);
    renderDialog({ onSendEmailOtp });
    fireEvent.click(screen.getByRole('button', { name: '邮箱验证码登录' }));
    fireEvent.change(screen.getByRole('textbox', { name: '邮箱地址' }), { target: { value: 'learner@example.com' } });
    await act(async () => fireEvent.submit(screen.getByRole('button', { name: '发送验证码' }).closest('form')!));
    expect(screen.getByRole('button', { name: '60 秒后可重新发送' })).toBeDisabled();
    act(() => vi.advanceTimersByTime(60_000));
    const resend = screen.getByRole('button', { name: '重新发送验证码' });
    expect(resend).toBeEnabled();
    await act(async () => fireEvent.click(resend));
    expect(onSendEmailOtp).toHaveBeenCalledTimes(2);
    expect(screen.getByRole('status')).toHaveTextContent('验证码已重新发送。');
    expect(screen.getByRole('button', { name: '60 秒后可重新发送' })).toBeDisabled();
  });

  it('can change the email and resets to methods after closing and reopening', async () => {
    const { props, rerender } = await reachOtpStep();
    await userEvent.click(screen.getByRole('button', { name: '更换邮箱' }));
    expect(screen.getByRole('textbox', { name: '邮箱地址' })).toHaveValue('learner@example.com');
    rerender(<AuthDialog {...props} open={false} />);
    rerender(<AuthDialog {...props} open />);
    expect(screen.getByRole('button', { name: '邮箱验证码登录' })).toBeInTheDocument();
    expect(screen.queryByRole('textbox', { name: '邮箱地址' })).not.toBeInTheDocument();
  });

  it('shows the supplied authentication error', () => {
    renderDialog({ error: '验证码无效或已过期，请重新输入。' });
    expect(screen.getByRole('alert')).toHaveTextContent('验证码无效或已过期，请重新输入。');
  });

  it('renders nothing while closed', () => {
    renderDialog({ open: false });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
