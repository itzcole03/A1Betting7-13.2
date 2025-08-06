import { describe, expect, it } from 'vitest';
import { handleHttpError } from '../services/ErrorInterceptor';
import { useErrorStore } from '../stores/errorStore';

// Mock Zustand store reset
beforeEach(() => {
  useErrorStore.getState().clearErrors();
});

describe('Error Store and Correlation ID', () => {
  it('records errors with correlation ID', () => {
    const correlationId = 'test-correlation-id';
    handleHttpError({ message: 'Test error', response: { status: 500 } }, correlationId);
    const errors = useErrorStore.getState().errors;
    expect(errors.length).toBe(1);
    expect(errors[0].correlationId).toBe(correlationId);
    expect(errors[0].message).toBe('Test error');
  });

  it('generates a correlation ID if not provided', () => {
    handleHttpError({ message: 'No ID error', response: { status: 500 } });
    const errors = useErrorStore.getState().errors;
    expect(errors.length).toBe(1);
    expect(errors[0].correlationId).toBeDefined();
  });
});
