import { useCallback, useEffect, useMemo, useState } from 'react';
import type { User } from '@supabase/supabase-js';
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
      setError('验证码发送失败，请稍后重试。');
      throw error;
    }
  }, [dependencies]);

  const verifyEmailOtp = useCallback(async (email: string, token: string) => {
    setError(null);
    try {
      await dependencies.verifyEmailOtp(email, token);
    } catch (error) {
      setError('验证码无效或已过期，请重新输入。');
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
