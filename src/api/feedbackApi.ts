import { AppError, createOperationId } from '../errors/appError';
import { toAppError } from './apiError';
import { supabase, type AppSupabaseClient } from './supabaseClient';

export type SubmitFeedbackResult = { feedbackId: string };

type DatabaseError = { message?: unknown };

function requireClient(client: AppSupabaseClient | null, operationId: string): AppSupabaseClient {
  if (client) return client;
  throw new AppError({
    code: 'UNKNOWN',
    message: 'Supabase 尚未配置',
    operationId,
    retryable: false,
  });
}

function mapFeedbackError(error: unknown, operationId: string): AppError {
  const message = typeof error === 'object' && error !== null
    ? (error as DatabaseError).message
    : null;

  if (message === 'feedback_auth_required') {
    return new AppError({ code: 'AUTH_REQUIRED', message: '请先登录', operationId, retryable: false, cause: error });
  }
  if (message === 'feedback_invalid_content') {
    return new AppError({ code: 'VALIDATION_ERROR', message: '反馈内容无效', operationId, retryable: false, cause: error });
  }
  if (message === 'feedback_rate_limited') {
    return new AppError({ code: 'FEEDBACK_RATE_LIMITED', message: '反馈发送过于频繁', operationId, retryable: true, cause: error });
  }
  if (message === 'feedback_daily_limit_reached') {
    return new AppError({ code: 'FEEDBACK_DAILY_LIMIT_REACHED', message: '今日反馈次数已达上限', operationId, retryable: false, cause: error });
  }
  return toAppError(error, operationId);
}

export function createFeedbackApi(client: AppSupabaseClient | null) {
  return {
    async submitFeedback(content: string): Promise<SubmitFeedbackResult> {
      const operationId = createOperationId();
      try {
        const configured = requireClient(client, operationId);
        const { data, error } = await configured.rpc('submit_feedback', { p_content: content });
        if (error) throw mapFeedbackError(error, operationId);
        if (typeof data !== 'string' || data.length === 0) {
          throw new AppError({
            code: 'UNKNOWN',
            message: '反馈提交结果无效',
            operationId,
            retryable: false,
          });
        }
        return { feedbackId: data };
      } catch (error) {
        throw mapFeedbackError(error, operationId);
      }
    },
  };
}

const feedbackApi = createFeedbackApi(supabase);

export const submitFeedback = feedbackApi.submitFeedback;
