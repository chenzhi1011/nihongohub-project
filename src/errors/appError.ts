export type AppErrorCode =
  | 'AUTH_REQUIRED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'EXACT_URL_EXISTS'
  | 'SIMILAR_RESOURCE_LIMIT_REACHED'
  | 'PRIVATE_RESOURCE_LIMIT_REACHED'
  | 'FEEDBACK_RATE_LIMITED'
  | 'FEEDBACK_DAILY_LIMIT_REACHED'
  | 'VALIDATION_ERROR'
  | 'NETWORK_ERROR'
  | 'UNKNOWN';

type AppErrorOptions = {
  code: AppErrorCode;
  message: string;
  operationId: string;
  retryable: boolean;
  cause?: unknown;
};

export class AppError extends Error {
  readonly code: AppErrorCode;
  readonly operationId: string;
  readonly retryable: boolean;
  readonly cause?: unknown;

  constructor({ code, message, operationId, retryable, cause }: AppErrorOptions) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.operationId = operationId;
    this.retryable = retryable;
    this.cause = cause;
  }
}

export function createOperationId(): string {
  return globalThis.crypto.randomUUID();
}
