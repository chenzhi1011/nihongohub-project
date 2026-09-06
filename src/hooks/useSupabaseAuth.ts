import { useCallback, useEffect, useMemo, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../api/supabaseClient';

type AuthState = {
  user: User | null;
  loading: boolean;
  error: string | null;
  signInWithGoogle: () => Promise<void>;
  signInWithWeChat: () => Promise<void>;
  signOut: () => Promise<void>;
};

export function useSupabaseAuth(): AuthState {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let unsub: { data: { subscription: { unsubscribe: () => void } } } | null = null;

    async function init() {
      try {
        if (!supabase) {
          setError('缺少 Supabase 配置（VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY）。');
          setUser(null);
          return;
        }

        const { data } = await supabase.auth.getSession();
        setUser(data.session?.user ?? null);

        unsub = supabase.auth.onAuthStateChange((_event, session) => {
          setUser(session?.user ?? null);
        });
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Auth 初始化失败');
      } finally {
        setLoading(false);
      }
    }

    init();

    return () => {
      try {
        if (unsub?.data.subscription) unsub.data.subscription.unsubscribe();
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
    if (!supabase) return;
    setError(null);
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo },
    });
  }, [redirectTo]);

  const signInWithWeChat = useCallback(async () => {
    if (!supabase) return;
    setError(null);

    // Supabase WeChat provider 可能是 `weixin` 或 `wechat`，这里做一次兜底
    try {
      await supabase.auth.signInWithOAuth({
        provider: 'weixin',
        options: { redirectTo },
      });
    } catch {
      try {
        await supabase.auth.signInWithOAuth({
          provider: 'wechat',
          options: { redirectTo },
        });
      } catch (e2) {
        setError(e2 instanceof Error ? e2.message : '微信登录失败');
      }
    }
  }, [redirectTo]);

  const signOut = useCallback(async () => {
    if (!supabase) return;
    setError(null);
    await supabase.auth.signOut();
  }, []);

  return { user, loading, error, signInWithGoogle, signInWithWeChat, signOut };
}
