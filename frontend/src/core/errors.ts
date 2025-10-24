import type { ErrorCategory, ErrorContext, ErrorSeverity } from '../types/core';

type PlainObject = Record<string, unknown>;

export interface ErrorContextInput {
  code: string;
  message: string;
  category: ErrorCategory;
  severity?: ErrorSeverity;
  details?: PlainObject;
  component?: string;
  context?: PlainObject;
  userContext?: ErrorContext['userContext'];
  recoveryStrategy?: ErrorContext['recoveryStrategy'];
  retryable?: boolean;
  retryCount?: number;
  metrics?: Partial<NonNullable<ErrorContext['metrics']>>;
  timestamp?: number;
  stack?: string;
  cause?: unknown;
}

export interface CreateErrorOptions extends ErrorContextInput {
  name?: string;
}

export interface ErrorWithContext {
  error: Error;
  context: ErrorContext;
}

export interface SerializedErrorContext extends PlainObject {}

export interface TelemetryPayload {
  properties: PlainObject;
  metrics?: Record<string, number>;
}

export interface CanonicalError {
  error: Error;
  context: ErrorContext;
  telemetry: TelemetryPayload;
}

export type ErrorFactoryOverrides = Partial<
  Omit<CreateErrorOptions, 'category' | 'message' | 'code'>
> & {
  code?: string;
};

const DEFAULT_SEVERITY_BY_CATEGORY: Record<ErrorCategory, ErrorSeverity> = {
  SYSTEM: 'HIGH',
  VALIDATION: 'LOW',
  NETWORK: 'MEDIUM',
  AUTH: 'HIGH',
  BUSINESS: 'MEDIUM',
  DATABASE: 'HIGH',
  CONFIGURATION: 'HIGH',
  MODEL: 'MEDIUM',
};

function isPlainObject(value: unknown): value is PlainObject {
  if (value === null || typeof value !== 'object') {
    return false;
  }
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

function sanitizeValue(value: unknown, seen = new WeakSet<object>()): unknown {
  if (value === null || value === undefined) {
    return value;
  }
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return value;
  }

  if (value instanceof Error) {
    return {
      name: value.name,
      message: value.message,
      stack: value.stack,
    };
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (value instanceof Map) {
    return Object.fromEntries(
      Array.from(value.entries()).map(([key, entry]) => [key, sanitizeValue(entry, seen)])
    );
  }

  if (value instanceof Set) {
    return Array.from(value.values()).map(item => sanitizeValue(item, seen));
  }

  if (typeof value === 'function') {
    return value.name || 'anonymous_function';
  }

  if (typeof value === 'object') {
    if (seen.has(value as object)) {
      return '[Circular]';
    }
    seen.add(value as object);

    const result: PlainObject = {};
    Object.entries(value as PlainObject).forEach(([key, entry]) => {
      result[key] = sanitizeValue(entry, seen);
    });
    return result;
  }

  return String(value);
}

function ensureDetails(details?: PlainObject): PlainObject {
  if (!details || !isPlainObject(details)) {
    return {};
  }

  const sanitized: PlainObject = {};
  Object.entries(details).forEach(([key, value]) => {
    sanitized[key] = sanitizeValue(value);
  });
  return sanitized;
}

function resolveSeverity(category: ErrorCategory, severity?: ErrorSeverity): ErrorSeverity {
  if (severity) {
    return severity;
  }
  return DEFAULT_SEVERITY_BY_CATEGORY[category] ?? 'HIGH';
}

function isErrorWithContextLike(value: unknown): value is ErrorWithContext {
  return (
    !!value &&
    typeof value === 'object' &&
    value !== null &&
    'error' in value &&
    'context' in value &&
    (value as { error: unknown }).error instanceof Error &&
    isErrorContext((value as { context: unknown }).context)
  );
}

function mergeDetailsWithCause(
  details: PlainObject | undefined,
  cause: unknown
): PlainObject | undefined {
  if (cause === undefined) {
    return details;
  }

  const base = details && isPlainObject(details) ? details : {};
  if (base.cause !== undefined) {
    return base;
  }
  return {
    ...base,
    cause: sanitizeValue(cause),
  };
}

export function createErrorContext(input: ErrorContextInput): ErrorContext {
  const {
    code,
    message,
    category,
    severity,
    details,
    component,
    context,
    userContext,
    recoveryStrategy,
    retryable,
    retryCount,
    metrics,
    timestamp,
    stack,
    cause,
  } = input;

  const resolvedSeverity = resolveSeverity(category, severity);
  const resolvedTimestamp = typeof timestamp === 'number' ? timestamp : Date.now();
  let resolvedMetrics: ErrorContext['metrics'] | undefined;
  if (metrics || typeof retryCount === 'number') {
    resolvedMetrics = {
      retryCount: metrics?.retryCount ?? retryCount ?? 0,
      recoveryTime: metrics?.recoveryTime,
    };
  }

  const detailsWithCause = mergeDetailsWithCause(details, cause);

  return {
    code,
    message,
    category,
    severity: resolvedSeverity,
    timestamp: resolvedTimestamp,
    details: ensureDetails(detailsWithCause),
    stack,
    userContext: userContext && isPlainObject(userContext) ? { ...userContext } : userContext,
    recoveryStrategy:
      recoveryStrategy && isPlainObject(recoveryStrategy)
        ? { ...recoveryStrategy }
        : recoveryStrategy,
    component,
    context: context && isPlainObject(context) ? { ...context } : context,
    retryable,
    metrics: resolvedMetrics,
  };
}

export function createError(options: CreateErrorOptions): ErrorWithContext {
  const {
    name,
    message,
    cause,
    code,
    category,
    severity,
    details,
    component,
    context,
    userContext,
    recoveryStrategy,
    retryable,
    retryCount,
    metrics,
    timestamp,
  } = options;

  const error = new Error(message);
  error.name = name ?? deriveErrorName(category);

  if (cause !== undefined) {
    (error as Error & { cause?: unknown }).cause = cause;
  }

  const contextObject = createErrorContext({
    code,
    message,
    category,
    severity,
    details,
    component,
    context,
    userContext,
    recoveryStrategy,
    retryable,
    retryCount,
    metrics,
    stack: error.stack,
    timestamp,
    cause,
  });

  return {
    error,
    context: contextObject,
  };
}

export function attachContextToError(
  error: Error,
  contextInput: ErrorContextInput
): ErrorWithContext {
  const context = createErrorContext({ ...contextInput, stack: contextInput.stack ?? error.stack });
  return { error, context };
}

export function ensureErrorWithContext(
  input: unknown,
  fallback: CreateErrorOptions
): ErrorWithContext {
  if (isErrorWithContextLike(input)) {
    return input;
  }

  if (input instanceof StructuredError) {
    return { error: input, context: input.context };
  }

  if (input instanceof Error) {
    const detailsFromInput = isPlainObject((input as unknown as { details?: PlainObject }).details)
      ? ((input as unknown as { details?: PlainObject }).details as PlainObject)
      : undefined;

    const context = createErrorContext({
      ...fallback,
      message: input.message || fallback.message,
      stack: input.stack ?? fallback.stack,
      details:
        fallback.details || detailsFromInput
          ? {
              ...(detailsFromInput ?? {}),
              ...(fallback.details ?? {}),
            }
          : undefined,
      cause: (input as Error & { cause?: unknown }).cause ?? fallback.cause,
    });
    return { error: input, context };
  }

  if (input && typeof input === 'object') {
    const candidate = input as { error?: unknown; context?: unknown };
    if (candidate.error instanceof Error && isErrorContext(candidate.context)) {
      return {
        error: candidate.error,
        context: candidate.context,
      };
    }
  }

  return createError(fallback);
}

function createCategorizedError(
  category: ErrorCategory,
  message: string,
  defaultCode: string,
  defaultSeverity: ErrorSeverity | undefined,
  overrides?: ErrorFactoryOverrides
): ErrorWithContext {
  const { code, severity, ...rest } = overrides ?? {};

  const base: CreateErrorOptions = {
    code: code ?? defaultCode,
    message,
    category,
    ...(defaultSeverity ? { severity: defaultSeverity } : {}),
  };

  if (severity) {
    base.severity = severity;
  }

  return createError(Object.assign(base, rest as Partial<CreateErrorOptions>));
}

export function createSystemErrorWithContext(
  message: string,
  overrides?: ErrorFactoryOverrides
): ErrorWithContext {
  return createCategorizedError('SYSTEM', message, 'SYSTEM_ERROR', 'CRITICAL', overrides);
}

export function createValidationErrorWithContext(
  code: string,
  message: string,
  overrides?: ErrorFactoryOverrides
): ErrorWithContext {
  return createCategorizedError('VALIDATION', message, code, 'LOW', overrides);
}

export function createNetworkErrorWithContext(
  code: string,
  message: string,
  overrides?: ErrorFactoryOverrides
): ErrorWithContext {
  return createCategorizedError('NETWORK', message, code, 'MEDIUM', overrides);
}

export function ensureCanonicalError(input: unknown, fallback: CreateErrorOptions): CanonicalError {
  const errorWithContext = ensureErrorWithContext(input, fallback);
  return {
    ...errorWithContext,
    telemetry: contextToTelemetry(errorWithContext.context),
  };
}

export function isErrorWithContext(value: unknown): value is ErrorWithContext {
  return isErrorWithContextLike(value);
}

export function serializeErrorContext(context: ErrorContext): SerializedErrorContext {
  return {
    code: context.code,
    message: context.message,
    category: context.category,
    severity: context.severity,
    timestamp: context.timestamp,
    details: ensureDetails(context.details),
    stack: context.stack,
    userContext: context.userContext ? sanitizeValue(context.userContext) : undefined,
    recoveryStrategy: context.recoveryStrategy
      ? sanitizeValue(context.recoveryStrategy)
      : undefined,
    component: context.component,
    context: context.context ? sanitizeValue(context.context) : undefined,
    retryable: context.retryable,
    metrics: context.metrics ? sanitizeValue(context.metrics) : undefined,
  };
}

export function deserializeErrorContext(payload: unknown): ErrorContext {
  if (!payload || typeof payload !== 'object') {
    throw new Error('Cannot deserialize error context from non-object payload');
  }

  const data = payload as Record<string, unknown>;

  const category = (data.category as ErrorCategory) ?? 'SYSTEM';
  const severity = (data.severity as ErrorSeverity) ?? DEFAULT_SEVERITY_BY_CATEGORY[category];

  return {
    code: typeof data.code === 'string' ? data.code : 'UNKNOWN_ERROR',
    message: typeof data.message === 'string' ? data.message : 'Unknown error',
    category,
    severity,
    timestamp: typeof data.timestamp === 'number' ? data.timestamp : Date.now(),
    details: ensureDetails(isPlainObject(data.details) ? (data.details as PlainObject) : undefined),
    stack: typeof data.stack === 'string' ? data.stack : undefined,
    userContext: isPlainObject(data.userContext)
      ? (data.userContext as ErrorContext['userContext'])
      : undefined,
    recoveryStrategy: isPlainObject(data.recoveryStrategy)
      ? (data.recoveryStrategy as ErrorContext['recoveryStrategy'])
      : undefined,
    component: typeof data.component === 'string' ? data.component : undefined,
    context: isPlainObject(data.context) ? (data.context as PlainObject) : undefined,
    retryable: typeof data.retryable === 'boolean' ? data.retryable : undefined,
    metrics: isPlainObject(data.metrics)
      ? {
          retryCount:
            typeof (data.metrics as PlainObject).retryCount === 'number'
              ? ((data.metrics as PlainObject).retryCount as number)
              : 0,
          recoveryTime:
            typeof (data.metrics as PlainObject).recoveryTime === 'number'
              ? ((data.metrics as PlainObject).recoveryTime as number)
              : undefined,
        }
      : undefined,
  };
}

export function contextToTelemetry(context: ErrorContext): TelemetryPayload {
  const properties: PlainObject = {
    code: context.code,
    category: context.category,
    severity: context.severity,
    component: context.component,
    retryable: context.retryable ?? false,
  };

  if (context.userContext?.userId) {
    properties.userId = context.userContext.userId;
  }

  if (context.userContext?.sessionId) {
    properties.sessionId = context.userContext.sessionId;
  }

  const metrics: Record<string, number> = {};
  if (context.metrics?.retryCount !== undefined) {
    metrics.retryCount = context.metrics.retryCount;
  }
  if (context.metrics?.recoveryTime !== undefined) {
    metrics.recoveryTime = context.metrics.recoveryTime;
  }

  return {
    properties,
    metrics: Object.keys(metrics).length > 0 ? metrics : undefined,
  };
}

function deriveErrorName(category: ErrorCategory): string {
  switch (category) {
    case 'VALIDATION':
      return 'ValidationError';
    case 'NETWORK':
      return 'NetworkError';
    case 'AUTH':
      return 'AuthenticationError';
    case 'BUSINESS':
      return 'BusinessError';
    case 'DATABASE':
      return 'DatabaseError';
    case 'CONFIGURATION':
      return 'ConfigurationError';
    case 'MODEL':
      return 'ModelError';
    default:
      return 'SystemError';
  }
}

export class StructuredError extends Error {
  public readonly context: ErrorContext;

  constructor(options: CreateErrorOptions) {
    super(options.message);
    this.name = options.name ?? deriveErrorName(options.category);
    if (options.cause !== undefined && 'cause' in Error.prototype === false) {
      (this as Error & { cause?: unknown }).cause = options.cause;
    }
    this.context = createErrorContext({ ...options, stack: this.stack });
  }
}

export class SystemError extends StructuredError {
  constructor(message: string, details?: PlainObject) {
    super({
      code: 'SYSTEM_ERROR',
      message,
      category: 'SYSTEM',
      severity: 'CRITICAL',
      details,
    });
  }
}

export class ValidationError extends StructuredError {
  constructor(code: string, message: string, details?: PlainObject) {
    super({
      code,
      message,
      category: 'VALIDATION',
      severity: 'LOW',
      details,
    });
  }
}

export class NetworkError extends StructuredError {
  constructor(code: string, message: string, details?: PlainObject) {
    super({
      code,
      message,
      category: 'NETWORK',
      severity: 'MEDIUM',
      details,
    });
  }
}

export function isErrorContext(value: unknown): value is ErrorContext {
  return (
    !!value &&
    typeof value === 'object' &&
    typeof (value as ErrorContext).code === 'string' &&
    typeof (value as ErrorContext).message === 'string' &&
    typeof (value as ErrorContext).category === 'string' &&
    typeof (value as ErrorContext).severity === 'string' &&
    typeof (value as ErrorContext).timestamp === 'number'
  );
}

export function isStructuredError(value: unknown): value is StructuredError {
  return value instanceof StructuredError;
}

export default {
  createErrorContext,
  createError,
  attachContextToError,
  ensureErrorWithContext,
  ensureCanonicalError,
  serializeErrorContext,
  deserializeErrorContext,
  contextToTelemetry,
  createSystemErrorWithContext,
  createValidationErrorWithContext,
  createNetworkErrorWithContext,
  isErrorWithContext,
  isErrorContext,
  isStructuredError,
};
