import { afterEach, describe, expect, it, vi } from 'vitest';
import { AppError } from '../errors/appError';
import { configureErrorReporter, reportError } from './errorReporter';

const appError = new AppError({
  code: 'NETWORK_ERROR',
  message: '资源加载失败',
  operationId: 'op-123',
  retryable: true,
});

afterEach(() => {
  configureErrorReporter(null);
});

describe('reportError', () => {
  it('sends one structured event to the configured provider', () => {
    const provider = vi.fn();
    configureErrorReporter(provider);

    reportError(appError, {
      event: 'catalog.fetch.failed',
      layer: 'hook',
      release: 'abc123',
      environment: 'development',
      durationMs: 42,
    });

    expect(provider).toHaveBeenCalledTimes(1);
    expect(provider).toHaveBeenCalledWith({
      error: appError,
      context: {
        event: 'catalog.fetch.failed',
        operationId: 'op-123',
        errorCode: 'NETWORK_ERROR',
        layer: 'hook',
        release: 'abc123',
        environment: 'development',
        durationMs: 42,
      },
    });
  });

  it('does not let a reporting failure escape into the business flow', () => {
    configureErrorReporter(() => {
      throw new Error('logging unavailable');
    });

    expect(() =>
      reportError(appError, {
        event: 'catalog.fetch.failed',
        layer: 'hook',
        release: 'abc123',
        environment: 'development',
      }),
    ).not.toThrow();
  });
});
