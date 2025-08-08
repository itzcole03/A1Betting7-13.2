import { BaseService } from './BaseService';

export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export enum ErrorCategory {
  NETWORK = 'network',
  VALIDATION = 'validation',
  AUTHENTICATION = 'authentication',
  PERMISSION = 'permission',
  BUSINESS_LOGIC = 'business_logic',
  SYSTEM = 'system',
  UNKNOWN = 'unknown',
}

export interface ErrorDetails {
  id: string;
  message: string;
  code?: string;
  category: ErrorCategory;
  severity: ErrorSeverity;
  context: unknown;
  timestamp: Date;
  stack?: string;
  resolved: boolean;
  retryCount: number;
}

export class UnifiedErrorService extends BaseService {
  private static instance: UnifiedErrorService;
  private errors: Map<string, ErrorDetails> = new Map();
  private errorCounter = 0;
  private maxRetries = 3;
  private retryDelays = [1000, 2000, 5000]; // milliseconds

  protected constructor() {
    // @ts-expect-error TS(2554): Expected 2 arguments, but got 1.
    super('UnifiedErrorService');
  }

  static getInstance(): UnifiedErrorService {
    if (!UnifiedErrorService.instance) {
      UnifiedErrorService.instance = new UnifiedErrorService();
    }
    return UnifiedErrorService.instance;
  }

  reportError(
    error: Error | string,
    context: unknown = {},
    category: ErrorCategory = ErrorCategory.UNKNOWN,
    severity: ErrorSeverity = ErrorSeverity.MEDIUM
  ): string {
    const _errorId = `error_${++this.errorCounter}_${Date.now()}`;

    // Properly serialize error and context objects
    let errorMessage = '';
    let errorCode = 'UNKNOWN_ERROR';
    let errorStack = '';

    if (typeof error === 'string') {
      errorMessage = error;
    } else if (error instanceof Error) {
      errorMessage = error.message;
      errorCode = error.name || 'Error';
      errorStack = error.stack || '';
    } else if (error && typeof error === 'object') {
      errorMessage = JSON.stringify(error);
      errorCode = (error as any).code || (error as any).name || 'ObjectError';
    } else {
      errorMessage = String(error);
    }

    // Serialize context safely
    let serializedContext: any = {};
    try {
      serializedContext = typeof context === 'object' && context !== null
        ? JSON.parse(JSON.stringify(context))
        : context;
    } catch (serializationError) {
      serializedContext = { error: 'Failed to serialize context', original: String(context) };
    }

    const _errorDetails: ErrorDetails = {
      id: _errorId,
      message: errorMessage,
      code: errorCode,
      category,
      severity,
      context: serializedContext,
      timestamp: new Date(),
      stack: errorStack,
      resolved: false,
      retryCount: 0,
    };

    this.errors.set(_errorId, _errorDetails);

    // Log with properly serialized data
    console.error('[UnifiedErrorService] Error reported:', {
      id: _errorId,
      message: errorMessage,
      code: errorCode,
      category,
      severity,
      context: serializedContext,
      timestamp: _errorDetails.timestamp.toISOString()
    });

    this.logger.error('Error reported', _errorDetails);
    this.emit('error_reported', _errorDetails);

    // Auto-resolve low severity errors after some time
    if (severity === ErrorSeverity.LOW) {
      setTimeout(() => this.resolveError(_errorId), 60000); // 1 minute
    }

    // Notify if critical
    if (severity === ErrorSeverity.CRITICAL) {
      this.emit('critical_error', _errorDetails);
    }

    return _errorId;
  }

  async retryOperation<T>(
    operation: () => Promise<T>,
    context: unknown = {},
    category: ErrorCategory = ErrorCategory.NETWORK
  ): Promise<T> {
    let lastError: Error | null = null;

    for (let _attempt = 0; _attempt <= this.maxRetries; _attempt++) {
      try {
        if (_attempt > 0) {
          const _delay = this.retryDelays[Math.min(_attempt - 1, this.retryDelays.length - 1)];
          await this.delay(_delay);
          this.logger.info('Retrying operation', { attempt: _attempt, delay: _delay, context });
        }

        return await operation();
      } catch (error) {
        lastError = error as Error;

        if (_attempt === this.maxRetries) {
          // Final attempt failed
          const _errorId = this.reportError(
            lastError,
            { ...context, totalAttempts: _attempt + 1 },
            category,
            ErrorSeverity.HIGH
          );

          throw new Error(`Operation failed after ${_attempt + 1} attempts. Error ID: ${_errorId}`);
        }
      }
    }

    throw lastError;
  }

  resolveError(errorId: string, resolution?: string): boolean {
    const _error = this.errors.get(errorId);
    if (!_error) {
      this.logger.warn('Attempted to resolve non-existent error', { errorId });
      return false;
    }

    _error.resolved = true;
    (_error.context as any).resolution = resolution;
    (_error.context as any).resolvedAt = new Date();

    this.logger.info('Error resolved', { errorId, resolution });
    this.emit('error_resolved', _error);

    return true;
  }

  getError(errorId: string): ErrorDetails | null {
    return this.errors.get(errorId) || null;
  }

  getErrors(
    filters: {
      category?: ErrorCategory;
      severity?: ErrorSeverity;
      resolved?: boolean;
      since?: Date;
    } = {}
  ): ErrorDetails[] {
    const _allErrors = Array.from(this.errors.values());

    return allErrors.filter(error => {
      if (filters.category && error.category !== filters.category) return false;
      if (filters.severity && error.severity !== filters.severity) return false;
      if (filters.resolved !== undefined && error.resolved !== filters.resolved) return false;
      if (filters.since && error.timestamp < filters.since) return false;
      return true;
    });
  }

  getErrorStats(): {
    total: number;
    resolved: number;
    byCategory: Record<ErrorCategory, number>;
    bySeverity: Record<ErrorSeverity, number>;
  } {
    const _errors = Array.from(this.errors.values());

    const _stats = {
      total: _errors.length,
      resolved: _errors.filter(e => e.resolved).length,
      byCategory: {} as Record<ErrorCategory, number>,
      bySeverity: {} as Record<ErrorSeverity, number>,
    };

    // Initialize counts
    Object.values(ErrorCategory).forEach(cat => (_stats.byCategory[cat] = 0));
    Object.values(ErrorSeverity).forEach(sev => (_stats.bySeverity[sev] = 0));

    // Count errors
    _errors.forEach(error => {
      _stats.byCategory[error.category]++;
      _stats.bySeverity[error.severity]++;
    });

    return _stats;
  }

  clearErrors(olderThan?: Date): number {
    let _cleared = 0;

    for (const [id, error] of this.errors.entries()) {
      if (!olderThan || error.timestamp < olderThan) {
        if (error.resolved || error.severity === ErrorSeverity.LOW) {
          this.errors.delete(id);
          _cleared++;
        }
      }
    }

    this.logger.info('Errors cleared', { cleared: _cleared, olderThan });
    return _cleared;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Helper methods for common error categories
  reportNetworkError(error: Error, context: unknown = {}): string {
    return this.reportError(error, context, ErrorCategory.NETWORK, ErrorSeverity.MEDIUM);
  }

  reportValidationError(message: string, context: unknown = {}): string {
    return this.reportError(message, context, ErrorCategory.VALIDATION, ErrorSeverity.LOW);
  }

  reportAuthError(error: Error, context: unknown = {}): string {
    return this.reportError(error, context, ErrorCategory.AUTHENTICATION, ErrorSeverity.HIGH);
  }

  reportCriticalError(error: Error, context: unknown = {}): string {
    return this.reportError(error, context, ErrorCategory.SYSTEM, ErrorSeverity.CRITICAL);
  }
}

export default UnifiedErrorService;
