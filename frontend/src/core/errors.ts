// @ts-expect-error TS(2305): Module '"./UnifiedError"' has no exported member '... Remove this comment to see the full error message
import { ErrorCategory, ErrorSeverity, ErrorContext } from './UnifiedError';

export class SystemError extends Error {
  public readonly context: ErrorContext;

  constructor(message: string, details?: Record<string, unknown>) {
    super(message);
    this.name = 'SystemError';
    this.context = {
      code: 'SYSTEM_ERROR',
      message,
      category: ErrorCategory.SYSTEM,
      severity: ErrorSeverity.CRITICAL,
      timestamp: Date.now(),
      //       details
    };
  }
}
