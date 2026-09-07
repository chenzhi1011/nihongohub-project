import type { User } from '@supabase/supabase-js';
import { AppError, createOperationId } from '../errors/appError';
import { toAppError } from './apiError';
import { supabase, type AppSupabaseClient } from './supabaseClient';

function requireClient(client: AppSupabaseClient | null, operationId: string): AppSupabaseClient {
  if (client) return client;
  throw new AppError({
    code: 'UNKNOWN',
    message: 'Supabase 尚未配置',
    operationId,
    retryable: false,
  });
}

export function createAuthApi(client: AppSupabaseClient | null) {
  return {
    async getCurrentUser(): Promise<User | null> {
      const operationId = createOperationId();
      try {
        const { data, error } = await requireClient(client, operationId).auth.getSession();
        if (error) throw error;
        return data.session?.user ?? null;
      } catch (error) {
        throw toAppError(error, operationId);
      }
    },

    subscribeToAuthState(onUserChange: (user: User | null) => void): () => void {
      const operationId = createOperationId();
      const configured = requireClient(client, operationId);
      const { data } = configured.auth.onAuthStateChange((_event, session) => {
        onUserChange(session?.user ?? null);
      });
      return () => data.subscription.unsubscribe();
    },

    async signInWithGoogle(redirectTo: string): Promise<void> {
      const operationId = createOperationId();
      try {
        const { error } = await requireClient(client, operationId).auth.signInWithOAuth({
          provider: 'google',
          options: { redirectTo },
        });
        if (error) throw error;
      } catch (error) {
        throw toAppError(error, operationId);
      }
    },

    async signOut(): Promise<void> {
      const operationId = createOperationId();
      try {
        const { error } = await requireClient(client, operationId).auth.signOut();
        if (error) throw error;
      } catch (error) {
        throw toAppError(error, operationId);
      }
    },
  };
}

const authApi = createAuthApi(supabase);

export const getCurrentUser = authApi.getCurrentUser;
export const subscribeToAuthState = authApi.subscribeToAuthState;
export const signInWithGoogle = authApi.signInWithGoogle;
export const signOut = authApi.signOut;
