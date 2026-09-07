import { AppError } from '../errors/appError';

type ErrorLike = { code?: unknown; message?: unknown };

export function toAppError(error: unknown, operationId: string): AppError {
  if (error instanceof AppError) return error;

  const value = typeof error === 'object' && error !== null ? error as ErrorLike : {};
  const rawMessage = typeof value.message === 'string' ? value.message : '';

  if (rawMessage === 'AUTH_REQUIRED') {
    return new AppError({ code: 'AUTH_REQUIRED', message: '请先登录', operationId, retryable: false, cause: error });
  }

  if (['RESOURCE_NOT_OWNED', 'RESOURCE_NOT_PUBLIC', 'RESOURCE_NOT_VISIBLE'].includes(rawMessage)) {
    return new AppError({ code: 'FORBIDDEN', message: '你没有权限执行此操作', operationId, retryable: false, cause: error });
  }

  if (error instanceof TypeError || /fetch|network/i.test(rawMessage)) {
    return new AppError({ code: 'NETWORK_ERROR', message: '网络连接失败，请稍后重试', operationId, retryable: true, cause: error });
  }

  return new AppError({ code: 'UNKNOWN', message: '操作失败，请稍后重试', operationId, retryable: false, cause: error });
}
