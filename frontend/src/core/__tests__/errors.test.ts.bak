import { describe, expect, it } from '@jest/globals';
import type { CreateErrorOptions } from '../errors';
import {
  contextToTelemetry,
  createError,
  createErrorContext,
  createNetworkErrorWithContext,
  createSystemErrorWithContext,
  createValidationErrorWithContext,
  deserializeErrorContext,
  ensureCanonicalError,
  ensureErrorWithContext,
  serializeErrorContext,
  StructuredError,
  ValidationError,
} from '../errors';

describe('core/errors helpers', () => {
  it('creates error with default severity for category', () => {
    const { error, context } = createError({
      code: 'NETWORK_TIMEOUT',
      message: 'Request timed out',
      category: 'NETWORK',
      details: { attempt: 1 },
    });

    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe('NetworkError');
    expect(context.category).toBe('NETWORK');
    expect(context.severity).toBe('MEDIUM');
    expect(context.details).toEqual({ attempt: 1 });
    expect(context.stack).toEqual(error.stack);
  });

  it('serializes and deserializes complex detail payloads', () => {
    const details = {
      payload: new Map<string, unknown>([
        ['requestId', 'abc123'],
        ['metadata', { nested: true }],
      ]),
      attempts: 2,
    } as const;

    const { context } = createError({
      code: 'NETWORK_TIMEOUT',
      message: 'Request timed out',
      category: 'NETWORK',
      details: details as unknown as Record<string, unknown>,
    });

    const serialized = serializeErrorContext(context);

    expect(serialized.details).toMatchObject({
      payload: {
        requestId: 'abc123',
        metadata: { nested: true },
      },
      attempts: 2,
    });

    const roundTrip = deserializeErrorContext(serialized);
    expect(roundTrip.details).toMatchObject({
      payload: {
        requestId: 'abc123',
        metadata: { nested: true },
      },
      attempts: 2,
    });
  });

  it('produces telemetry payload with enriched properties and metrics', () => {
    const context = createErrorContext({
      code: 'AUTH_REQUIRED',
      message: 'Sign-in required',
      category: 'AUTH',
      severity: 'HIGH',
      retryable: true,
      userContext: { userId: 'user-123', sessionId: 'session-abc' },
      metrics: { retryCount: 2, recoveryTime: 150 },
    });

    const telemetry = contextToTelemetry(context);

    expect(telemetry.properties).toMatchObject({
      code: 'AUTH_REQUIRED',
      category: 'AUTH',
      severity: 'HIGH',
      retryable: true,
      userId: 'user-123',
      sessionId: 'session-abc',
    });
    expect(telemetry.metrics).toMatchObject({ retryCount: 2, recoveryTime: 150 });
  });

  it('ensures errors obtain structured context during wrapping', () => {
    const baseError = new Error('Upstream failure');

    const wrapped = ensureErrorWithContext(baseError, {
      code: 'SYSTEM_FAIL',
      message: 'Fallback message',
      category: 'SYSTEM',
    });

    expect(wrapped.error).toBe(baseError);
    expect(wrapped.context.message).toBe('Upstream failure');
    expect(wrapped.context.category).toBe('SYSTEM');
    expect(wrapped.context.severity).toBe('HIGH');
  });

  it('provides structured errors with attached context', () => {
    const structured = new StructuredError({
      code: 'VALIDATION_FAIL',
      message: 'Invalid payload provided',
      category: 'VALIDATION',
      details: { field: 'username' },
    });

    expect(structured.name).toBe('ValidationError');
    expect(structured.context.code).toBe('VALIDATION_FAIL');
    expect(structured.context.details).toEqual({ field: 'username' });
    expect(structured.context.severity).toBe('LOW');
  });

  it('builds categorized errors with canonical defaults and overrides', () => {
    const system = createSystemErrorWithContext('System blew up', {
      details: { feature: 'prop-dashboard' },
    });

    expect(system.context.code).toBe('SYSTEM_ERROR');
    expect(system.context.severity).toBe('CRITICAL');
    expect(system.context.details.feature).toBe('prop-dashboard');

    const validation = createValidationErrorWithContext('VALIDATION_EMAIL', 'Invalid email', {
      severity: 'MEDIUM',
      retryable: false,
    });

    expect(validation.context.severity).toBe('MEDIUM');
    expect(validation.context.retryable).toBe(false);

    const network = createNetworkErrorWithContext('NETWORK_TIMEOUT', 'Request timed out', {
      retryable: true,
      metrics: { retryCount: 3 },
    });

    expect(network.context.category).toBe('NETWORK');
    expect(network.context.metrics?.retryCount).toBe(3);
  });

  it('sanitizes causes and circular references during serialization', () => {
    const circular: { self?: unknown } = {};
    circular.self = circular;

    const context = createErrorContext({
      code: 'SANITIZE_TEST',
      message: 'Testing serialization',
      category: 'SYSTEM',
      details: {
        circular,
        fn: () => true,
      },
      cause: new Error('root cause'),
    });

    const serialized = serializeErrorContext(context);
    const serializedDetails = serialized.details as Record<string, unknown>;

    expect(serializedDetails.fn).toBe('fn');
    expect((serializedDetails.circular as { self: unknown }).self).toBe('[Circular]');
    expect(serializedDetails.cause).toMatchObject({ name: 'Error', message: 'root cause' });

    const roundTrip = deserializeErrorContext(serialized);
    expect(roundTrip.details.fn).toBe('fn');
  });

  it('returns canonical error payloads with telemetry when available', () => {
    const fallback: CreateErrorOptions = {
      code: 'FALLBACK',
      message: 'Fallback',
      category: 'SYSTEM',
    };

    const structured = new ValidationError('VALIDATION_FAILED', 'Bad payload', {
      field: 'email',
    });

    const canonical = ensureCanonicalError(structured, fallback);

    expect(canonical.error).toBe(structured);
    expect(canonical.context).toBe(structured.context);
    expect(canonical.telemetry.properties.code).toBe('VALIDATION_FAILED');

    const plain = new Error('Network offline');
    const ensured = ensureErrorWithContext(plain, {
      code: 'NETWORK_ERROR',
      message: 'Network offline',
      category: 'NETWORK',
      details: { attempt: 1 },
    });

    expect(ensured.error).toBe(plain);
    expect(ensured.context.details.attempt).toBe(1);
  });
});
