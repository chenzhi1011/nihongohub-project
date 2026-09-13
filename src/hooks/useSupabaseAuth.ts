import { useCallback, useEffect, useMemo, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { AppError } from '../errors/appError';
import { reportError } from '../observability/errorReporter';
import {
  getCurrentUser,
  sendEmailOtp as startEmailOtp,
  signInWithGoogle as startGoogleLogin,
  signOut as endSession,
  subscribeToAuthState,
  verifyEmailOtp as confirmEmailOtp,
} from '../api/authApi';

export type AuthDependencies = {
  getCurrentUser: typeof getCurrentUser;
  subscribeToAuthState: typeof subscribeToAuthState;
  signInWithGoogle: typeof startGoogleLogin;
  sendEmailOtp: typeof startEmailOtp;
  verifyEmailOtp: typeof confirmEmailOtp;
  signOut: typeof endSession;
};

type AuthState = {
  user: User | null;
  loading: boolean;
  error: string | null;
  signInWithGoogle: () => Promise<void>;
  sendEmailOtp: (email: string) => Promise<void>;
  verifyEmailOtp: (email: string, token: string) => Promise<void>;
  signInWithWeChat: () => Promise<void>;
  signOut: () => Promise<void>;
};

const defaultDependencies: AuthDependencies = {
  getCurrentUser,
  subscribeToAuthState,
  signInWithGoogle: startGoogleLogin,
  sendEmailOtp: startEmailOtp,
  verifyEmailOtp: confirmEmailOtp,
  signOut: endSession,
};

function reportAuthError(error: unknown, event: string): void {
  if (!(error instanceof AppError)) return;
  const mode = import.meta.env.MODE;
  reportError(error, {
    event,
    layer: 'hook',
    release: import.meta.env.VITE_VERCEL_GIT_COMMIT_SHA ?? 'local',
    environment: mode === 'production' ? 'production' : mode === 'preview' ? 'preview' : 'development',
  });
}

function isRateLimitError(error: unknown): boolean {
  if (!(error instanceof AppError) || typeof error.cause !== 'object' || error.cause === null) return false;
  return 'status' in error.cause && error.cause.status === 429;
}

export function useSupabaseAuth(dependencies: AuthDependencies = defaultDependencies): AuthState {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let unsubscribe: (() => void) | null = null;

    async function init() {
      try {
        setUser(await dependencies.getCurrentUser());
        unsubscribe = dependencies.subscribeToAuthState(setUser);
      } catch {
        setError('登录状态加载失败，请刷新页面重试。');
      } finally {
        setLoading(false);
      }
    }

    init();

    return () => {
      try {
        unsubscribe?.();
      } catch {
        // ignore
      }
    };
  }, [dependencies]);

  const redirectTo = useMemo(() => {
    // Supabase OAuth 回调后会在当前域名恢复 session
    return typeof window !== 'undefined' ? window.location.origin : '';
  }, []);

  const signInWithGoogle = useCallback(async () => {
    setError(null);
    try {
      await dependencies.signInWithGoogle(redirectTo);
    } catch {
      setError('Google 登录暂时失败，请重试。');
    }
  }, [dependencies, redirectTo]);

  const sendEmailOtp = useCallback(async (email: string) => {
    setError(null);
    try {
      await dependencies.sendEmailOtp(email.trim());
    } catch (error) {
      setError(isRateLimitError(error) ? '发送过于频繁，请稍后再试。' : '验证码发送失败，请稍后重试。');
      reportAuthError(error, 'auth.email_otp.send.failed');
      throw error;
    }
  }, [dependencies]);

  const verifyEmailOtp = useCallback(async (email: string, token: string) => {
    setError(null);
    try {
      await dependencies.verifyEmailOtp(email, token);
    } catch (error) {
      setError('验证码无效或已过期，请重新输入。');
      reportAuthError(error, 'auth.email_otp.verify.failed');
      throw error;
    }
  }, [dependencies]);

  const signInWithWeChat = useCallback(async () => {
    setError('微信登录将在后续版本开放，请先使用 Google 登录。');
  }, []);

  const signOut = useCallback(async () => {
    setError(null);
    try {
      await dependencies.signOut();
    } catch {
      setError('退出失败，请重试。');
    }
  }, [dependencies]);

  return { user, loading, error, signInWithGoogle, sendEmailOtp, verifyEmailOtp, signInWithWeChat, signOut };
}
