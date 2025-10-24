import {
  ErrorCategory as ServiceErrorCategory,
  ErrorSeverity as ServiceErrorSeverity,
  UnifiedErrorService,
} from '../services/unified/UnifiedErrorService';
import type {
  ErrorCategory as CoreErrorCategory,
  ErrorSeverity as CoreErrorSeverity,
  ErrorContext,
} from '../types/core';
import { getLogger, type ScopedLogger } from './UnifiedLogger';

type TelemetryEvent = {
  name: string;
  properties: Record<string, unknown>;
  metrics?: Record<string, number>;
};

export interface HandleErrorOptions {
  source?: string;
  component?: string;
  operation?: string;
  code?: string;
  category?: CoreErrorCategory;
  severity?: CoreErrorSeverity;
  contextData?: Record<string, unknown>;
  userContext?: ErrorContext['userContext'];
  userMessage?: string;
  retryable?: boolean;
  retryCount?: number;
  recoveryStrategy?: ErrorContext['recoveryStrategy'];
}

export interface HandledError {
  error: Error;
  context: ErrorContext;
  userMessage: string;
  telemetryEvent: TelemetryEvent;
  errorId?: string;
}

type HandledErrorListener = (handled: HandledError) => void;

interface NormalizedError {
  error: Error;
  context: ErrorContext;
  userMessage: string;
}

const CORE_TO_SERVICE_CATEGORY: Record<CoreErrorCategory, ServiceErrorCategory> = {
  SYSTEM: ServiceErrorCategory.SYSTEM,
  VALIDATION: ServiceErrorCategory.VALIDATION,
  NETWORK: ServiceErrorCategory.NETWORK,
  AUTH: ServiceErrorCategory.AUTHENTICATION,
  BUSINESS: ServiceErrorCategory.BUSINESS_LOGIC,
  DATABASE: ServiceErrorCategory.SYSTEM,
  CONFIGURATION: ServiceErrorCategory.SYSTEM,
  MODEL: ServiceErrorCategory.BUSINESS_LOGIC,
};

const CORE_TO_SERVICE_SEVERITY: Record<CoreErrorSeverity, ServiceErrorSeverity> = {
  LOW: ServiceErrorSeverity.LOW,
  MEDIUM: ServiceErrorSeverity.MEDIUM,
  HIGH: ServiceErrorSeverity.HIGH,
  CRITICAL: ServiceErrorSeverity.CRITICAL,
};

export class UnifiedErrorHandler {
  private static instance: UnifiedErrorHandler | null = null;

  private readonly logger: ScopedLogger;
  private readonly errorService = UnifiedErrorService.getInstance();
  private readonly listeners = new Set<HandledErrorListener>();

  private constructor() {
    this.logger = getLogger('core/UnifiedErrorHandler');
  }

  public static getInstance(): UnifiedErrorHandler {
    if (!UnifiedErrorHandler.instance) {
      UnifiedErrorHandler.instance = new UnifiedErrorHandler();
    }
    return UnifiedErrorHandler.instance;
  }

  public handle(errorInput: unknown, options: HandleErrorOptions = {}): HandledError {
    const normalized = this.normalizeError(errorInput, options);
    const errorId = this.forwardToErrorService(normalized.error, normalized.context);

    const telemetryEvent = this.buildTelemetryEvent(normalized.context, options, errorId);

    this.logger.error('Handled error', {
      code: normalized.context.code,
      category: normalized.context.category,
      severity: normalized.context.severity,
      component: normalized.context.component,
      source: options.source,
      retryable: normalized.context.retryable,
    });

    const handled: HandledError = {
      error: normalized.error,
      context: normalized.context,
      userMessage: normalized.userMessage,
      telemetryEvent,
      errorId,
    };

    this.notifyListeners(handled);

    return handled;
  }

  public onHandled(listener: HandledErrorListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  public clearListeners(): void {
    this.listeners.clear();
  }

  private notifyListeners(event: HandledError): void {
    for (const listener of this.listeners) {
      try {
        listener(event);
      } catch (listenerError) {
        this.logger.warn('Error listener threw during notification', {
          listenerError,
          code: event.context.code,
        });
      }
    }
  }

  private normalizeError(errorInput: unknown, options: HandleErrorOptions): NormalizedError {
    const error = this.ensureError(errorInput);
    const status = this.extractStatus(error, options);
    const category = this.determineCategory(error, status, options.category);
    const severity = this.determineSeverity(category, status, options.severity);
    const code = this.resolveCode(error, status, options.code);

    const details: Record<string, unknown> = {
      ...(options.contextData ?? {}),
      source: options.source,
      operation: options.operation,
      status,
    };

    const timestamp = Date.now();

    const context: ErrorContext = {
      code,
      message: error.message || 'Unknown error',
      category,
      severity,
      timestamp,
      details,
      stack: error.stack,
      userContext: options.userContext,
      recoveryStrategy: options.recoveryStrategy,
      component: options.component,
      context: options.contextData,
      retryable: options.retryable ?? this.isRetryable(category, status),
      metrics: {
        retryCount: options.retryCount ?? 0,
      },
    };

    const userMessage = options.userMessage ?? this.getUserMessage(category, severity);

    return {
      error,
      context,
      userMessage,
    };
  }

  private ensureError(errorInput: unknown): Error {
    if (errorInput instanceof Error) {
      return errorInput;
    }

    if (typeof errorInput === 'string') {
      return new Error(errorInput);
    }

    if (errorInput && typeof errorInput === 'object') {
      const coerced = errorInput as Record<string, unknown>;
      const message = typeof coerced.message === 'string' ? coerced.message : 'Unknown error';
      const error = new Error(message);
      Object.assign(error, coerced);
      return error;
    }

    return new Error('Unknown error');
  }

  private extractStatus(error: Error, options: HandleErrorOptions): number | undefined {
    const candidate =
      (error as unknown as { status?: number }).status ??
      (error as unknown as { response?: { status?: number } }).response?.status ??
      (options.contextData?.status as number | undefined);

    if (typeof candidate === 'number' && Number.isFinite(candidate)) {
      return candidate;
    }

    return undefined;
  }

  private determineCategory(
    error: Error,
    status: number | undefined,
    override?: CoreErrorCategory
  ): CoreErrorCategory {
    if (override) {
      return override;
    }

    if (status) {
      if (status === 401 || status === 403) return 'AUTH';
      if (status === 404) return 'BUSINESS';
      if (status === 422 || status === 400) return 'VALIDATION';
      if (status >= 500) return 'SYSTEM';
    }

    const message = error.message.toLowerCase();

    if (message.includes('network') || message.includes('fetch') || message.includes('timeout')) {
      return 'NETWORK';
    }
    if (
      message.includes('validation') ||
      message.includes('invalid') ||
      message.includes('schema')
    ) {
      return 'VALIDATION';
    }
    if (
      message.includes('auth') ||
      message.includes('unauthorized') ||
      message.includes('forbidden')
    ) {
      return 'AUTH';
    }
    if (message.includes('database') || message.includes('sql') || message.includes('db')) {
      return 'DATABASE';
    }
    if (message.includes('model') || message.includes('prediction')) {
      return 'MODEL';
    }

    return 'SYSTEM';
  }

  private determineSeverity(
    category: CoreErrorCategory,
    status: number | undefined,
    override?: CoreErrorSeverity
  ): CoreErrorSeverity {
    if (override) {
      return override;
    }

    if (status) {
      if (status >= 500) return 'CRITICAL';
      if (status === 401 || status === 403) return 'HIGH';
      if (status === 422 || status === 404 || status === 400) return 'LOW';
    }

    switch (category) {
      case 'VALIDATION':
        return 'LOW';
      case 'NETWORK':
        return 'MEDIUM';
      case 'AUTH':
        return 'HIGH';
      case 'BUSINESS':
      case 'MODEL':
        return 'MEDIUM';
      case 'DATABASE':
      case 'CONFIGURATION':
        return 'HIGH';
      default:
        return 'HIGH';
    }
  }

  private resolveCode(error: Error, status: number | undefined, override?: string): string {
    if (override) {
      return override;
    }

    const explicitCode = (error as unknown as { code?: string | number }).code;
    if (explicitCode) {
      return String(explicitCode).toUpperCase();
    }

    if (status) {
      return `HTTP_${status}`;
    }

    if (error.name) {
      return error.name.toUpperCase().replace(/\s+/g, '_');
    }

    return 'UNKNOWN_ERROR';
  }

  private isRetryable(category: CoreErrorCategory, status: number | undefined): boolean {
    if (status) {
      if (status >= 500) return true;
      if (status === 429) return true;
    }

    return category === 'NETWORK' || category === 'SYSTEM' || category === 'DATABASE';
  }

  private getUserMessage(category: CoreErrorCategory, severity: CoreErrorSeverity): string {
    switch (category) {
      case 'NETWORK':
        return "We're having trouble connecting right now. Please check your connection and try again.";
      case 'VALIDATION':
        return 'Some of the information looks off. Please review the highlighted details and try again.';
      case 'AUTH':
        return 'Your session may have expired. Please sign in again to continue.';
      case 'BUSINESS':
        return "We couldn't complete that action just yet. Please try again in a moment.";
      case 'DATABASE':
        return 'Our data service is temporarily unavailable. We are working to restore access.';
      case 'MODEL':
        return 'Predictions are temporarily unavailable while we refresh our models. Please try again shortly.';
      case 'CONFIGURATION':
        return 'A configuration issue prevented that action. Our team has been notified.';
      default:
        return severity === 'CRITICAL'
          ? 'Something went wrong on our side. Our engineers have been alerted.'
          : 'Something unexpected happened. Please try again in a moment.';
    }
  }

  private forwardToErrorService(error: Error, context: ErrorContext): string | undefined {
    try {
      const serviceCategory = CORE_TO_SERVICE_CATEGORY[context.category];
      const serviceSeverity = CORE_TO_SERVICE_SEVERITY[context.severity];

      return this.errorService.reportError(
        error,
        {
          ...context.details,
          component: context.component,
          code: context.code,
          category: context.category,
          severity: context.severity,
        },
        serviceCategory,
        serviceSeverity
      );
    } catch (serviceError) {
      this.logger.warn('Failed to forward error to UnifiedErrorService', { serviceError });
      return undefined;
    }
  }

  private buildTelemetryEvent(
    context: ErrorContext,
    options: HandleErrorOptions,
    errorId?: string
  ): TelemetryEvent {
    const properties: Record<string, unknown> = {
      code: context.code,
      category: context.category,
      severity: context.severity,
      component: context.component,
      source: options.source,
      operation: options.operation,
      retryable: context.retryable,
      errorId,
    };

    const metrics: Record<string, number> = {};
    if (typeof context.metrics?.retryCount === 'number') {
      metrics.retryCount = context.metrics.retryCount;
    }

    return {
      name: 'core.error',
      properties,
      metrics: Object.keys(metrics).length ? metrics : undefined,
    };
  }
}

const unifiedErrorHandler = UnifiedErrorHandler.getInstance();

export { unifiedErrorHandler };
export default unifiedErrorHandler;
