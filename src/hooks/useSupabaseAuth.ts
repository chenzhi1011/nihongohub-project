import { useCallback, useEffect, useMemo, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import {
  getCurrentUser,
  signInWithMagicLink as startMagicLinkLogin,
  signInWithGoogle as startGoogleLogin,
  signOut as endSession,
  subscribeToAuthState,
} from '../api/authApi';

type AuthState = {
  user: User | null;
  loading: boolean;
  error: string | null;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string) => Promise<void>;
  signInWithWeChat: () => Promise<void>;
  signOut: () => Promise<void>;
};

export function useSupabaseAuth(): AuthState {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let unsubscribe: (() => void) | null = null;

    async function init() {
      try {
        setUser(await getCurrentUser());
        unsubscribe = subscribeToAuthState(setUser);
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
  }, []);

  const redirectTo = useMemo(() => {
    // Supabase OAuth 回调后会在当前域名恢复 session
    return typeof window !== 'undefined' ? window.location.origin : '';
  }, []);

  const signInWithGoogle = useCallback(async () => {
    setError(null);
    try {
      await startGoogleLogin(redirectTo);
    } catch {
      setError('Google 登录暂时失败，请重试。');
    }
  }, [redirectTo]);

  const signInWithEmail = useCallback(async (email: string) => {
    setError(null);
    try {
      await startMagicLinkLogin(email.trim(), redirectTo);
    } catch (error) {
      setError('登录链接发送失败，请稍后重试。');
      throw error;
    }
  }, [redirectTo]);

  const signInWithWeChat = useCallback(async () => {
    setError('微信登录将在后续版本开放，请先使用 Google 登录。');
  }, []);

  const signOut = useCallback(async () => {
    setError(null);
    try {
      await endSession();
    } catch {
      setError('退出失败，请重试。');
    }
  }, []);

  return { user, loading, error, signInWithGoogle, signInWithEmail, signInWithWeChat, signOut };
}
