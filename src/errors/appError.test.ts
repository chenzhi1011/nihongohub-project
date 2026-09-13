import { describe, expect, it } from 'vitest';
import { AppError, createOperationId } from './appError';

describe('AppError', () => {
  it('keeps a stable code, operation ID, retry decision, and original cause', () => {
    const cause = new Error('database unavailable');
    const error = new AppError({
      code: 'NETWORK_ERROR',
      message: '资源加载失败',
      operationId: 'op-123',
      retryable: true,
      cause,
    });

    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe('AppError');
    expect(error.code).toBe('NETWORK_ERROR');
    expect(error.operationId).toBe('op-123');
    expect(error.retryable).toBe(true);
    expect(error.cause).toBe(cause);
  });
});

describe('createOperationId', () => {
  it('creates a different non-empty ID for each operation', () => {
    const first = createOperationId();
    const second = createOperationId();

    expect(first).not.toBe('');
    expect(second).not.toBe(first);
  });
});
