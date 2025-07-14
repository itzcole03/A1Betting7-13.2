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
  context: any;
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
    context: any = {},
    category: ErrorCategory = ErrorCategory.UNKNOWN,
    severity: ErrorSeverity = ErrorSeverity.MEDIUM
  ): string {
    const errorId = `error_${++this.errorCounter}_${Date.now()}`;

    const errorDetails: ErrorDetails = {
      id: errorId,
      message: typeof error === 'string' ? error : error.message,
      code: (error as any)?.code || 'UNKNOWN_ERROR',
      category,
      severity,
      context,
      timestamp: new Date(),
      stack: typeof error !== 'string' ? error.stack : undefined,
      resolved: false,
      retryCount: 0,
    };

    this.errors.set(errorId, errorDetails);

    this.logger.error('Error reported', errorDetails);
    this.emit('error_reported', errorDetails);

    // Auto-resolve low severity errors after some time
    if (severity === ErrorSeverity.LOW) {
      setTimeout(() => this.resolveError(errorId), 60000); // 1 minute
    }

    // Notify if critical
    if (severity === ErrorSeverity.CRITICAL) {
      this.emit('critical_error', errorDetails);
    }

    return errorId;
  }

  async retryOperation<T>(
    operation: () => Promise<T>,
    context: any = {},
    category: ErrorCategory = ErrorCategory.NETWORK
  ): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        if (attempt > 0) {
          const delay = this.retryDelays[Math.min(attempt - 1, this.retryDelays.length - 1)];
          await this.delay(delay);
          this.logger.info('Retrying operation', { attempt, delay, context });
        }

        return await operation();
      } catch (error) {
        lastError = error as Error;

        if (attempt === this.maxRetries) {
          // Final attempt failed
          const errorId = this.reportError(
            lastError,
            { ...context, totalAttempts: attempt + 1 },
            category,
            ErrorSeverity.HIGH
          );

          throw new Error(`Operation failed after ${attempt + 1} attempts. Error ID: ${errorId}`);
        }
      }
    }

    throw lastError;
  }

  resolveError(errorId: string, resolution?: string): boolean {
    const error = this.errors.get(errorId);
    if (!error) {
      this.logger.warn('Attempted to resolve non-existent error', { errorId });
      return false;
    }

    error.resolved = true;
    error.context.resolution = resolution;
    error.context.resolvedAt = new Date();

    this.logger.info('Error resolved', { errorId, resolution });
    this.emit('error_resolved', error);

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
    const allErrors = Array.from(this.errors.values());

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
    const errors = Array.from(this.errors.values());

    const stats = {
      total: errors.length,
      resolved: errors.filter(e => e.resolved).length,
      byCategory: {} as Record<ErrorCategory, number>,
      bySeverity: {} as Record<ErrorSeverity, number>,
    };

    // Initialize counts
    Object.values(ErrorCategory).forEach(cat => (stats.byCategory[cat] = 0));
    Object.values(ErrorSeverity).forEach(sev => (stats.bySeverity[sev] = 0));

    // Count errors
    errors.forEach(error => {
      stats.byCategory[error.category]++;
      stats.bySeverity[error.severity]++;
    });

    return stats;
  }

  clearErrors(olderThan?: Date): number {
    let cleared = 0;

    for (const [id, error] of this.errors.entries()) {
      if (!olderThan || error.timestamp < olderThan) {
        if (error.resolved || error.severity === ErrorSeverity.LOW) {
          this.errors.delete(id);
          cleared++;
        }
      }
    }

    this.logger.info('Errors cleared', { cleared, olderThan });
    return cleared;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Helper methods for common error categories
  reportNetworkError(error: Error, context: any = {}): string {
    return this.reportError(error, context, ErrorCategory.NETWORK, ErrorSeverity.MEDIUM);
  }

  reportValidationError(message: string, context: any = {}): string {
    return this.reportError(message, context, ErrorCategory.VALIDATION, ErrorSeverity.LOW);
  }

  reportAuthError(error: Error, context: any = {}): string {
    return this.reportError(error, context, ErrorCategory.AUTHENTICATION, ErrorSeverity.HIGH);
  }

  reportCriticalError(error: Error, context: any = {}): string {
    return this.reportError(error, context, ErrorCategory.SYSTEM, ErrorSeverity.CRITICAL);
  }
}

export default UnifiedErrorService;
