import { describe, expect, it } from 'vitest';
import { toAppError } from './apiError';

describe('toAppError', () => {
  it('maps stable database authorization messages', () => {
    const error = toAppError({ code: 'P0001', message: 'RESOURCE_NOT_OWNED' }, 'op-1');
    expect(error).toMatchObject({ code: 'FORBIDDEN', operationId: 'op-1', retryable: false });
  });

  it('maps browser transport failures without exposing raw details', () => {
    const error = toAppError(new TypeError('Failed to fetch'), 'op-2');
    expect(error).toMatchObject({ code: 'NETWORK_ERROR', operationId: 'op-2', retryable: true });
    expect(error.message).not.toContain('Failed to fetch');
  });

  it('preserves an existing AppError', () => {
    const first = toAppError({ message: 'RESOURCE_NOT_VISIBLE' }, 'op-3');
    expect(toAppError(first, 'different')).toBe(first);
  });
});
