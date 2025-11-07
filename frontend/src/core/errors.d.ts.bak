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

export declare function createErrorContext(input: ErrorContextInput): ErrorContext;
export declare function createError(options: CreateErrorOptions): ErrorWithContext;
export declare function attachContextToError(
  error: Error,
  contextInput: ErrorContextInput
): ErrorWithContext;
export declare function ensureErrorWithContext(
  input: unknown,
  fallback: CreateErrorOptions
): ErrorWithContext;
export declare function createSystemErrorWithContext(
  message: string,
  overrides?: ErrorFactoryOverrides
): ErrorWithContext;
export declare function createValidationErrorWithContext(
  code: string,
  message: string,
  overrides?: ErrorFactoryOverrides
): ErrorWithContext;
export declare function createNetworkErrorWithContext(
  code: string,
  message: string,
  overrides?: ErrorFactoryOverrides
): ErrorWithContext;
export declare function ensureCanonicalError(
  input: unknown,
  fallback: CreateErrorOptions
): CanonicalError;
export declare function isErrorWithContext(value: unknown): value is ErrorWithContext;
export declare function serializeErrorContext(context: ErrorContext): SerializedErrorContext;
export declare function deserializeErrorContext(payload: unknown): ErrorContext;
export declare function contextToTelemetry(context: ErrorContext): TelemetryPayload;

export declare class StructuredError extends Error {
  readonly context: ErrorContext;
  constructor(options: CreateErrorOptions);
}

export declare class SystemError extends StructuredError {
  constructor(message: string, details?: PlainObject);
}

export declare class ValidationError extends StructuredError {
  constructor(code: string, message: string, details?: PlainObject);
}

export declare class NetworkError extends StructuredError {
  constructor(code: string, message: string, details?: PlainObject);
}

export declare function isErrorContext(value: unknown): value is ErrorContext;
export declare function isStructuredError(value: unknown): value is StructuredError;

declare const _default: {
  createErrorContext: typeof createErrorContext;
  createError: typeof createError;
  attachContextToError: typeof attachContextToError;
  ensureErrorWithContext: typeof ensureErrorWithContext;
  ensureCanonicalError: typeof ensureCanonicalError;
  serializeErrorContext: typeof serializeErrorContext;
  deserializeErrorContext: typeof deserializeErrorContext;
  contextToTelemetry: typeof contextToTelemetry;
  createSystemErrorWithContext: typeof createSystemErrorWithContext;
  createValidationErrorWithContext: typeof createValidationErrorWithContext;
  createNetworkErrorWithContext: typeof createNetworkErrorWithContext;
  isErrorWithContext: typeof isErrorWithContext;
  isErrorContext: typeof isErrorContext;
  isStructuredError: typeof isStructuredError;
};

export default _default;
