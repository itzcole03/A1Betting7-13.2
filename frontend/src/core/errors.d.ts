import { ErrorContext } from './UnifiedError.ts';
export declare class SystemError extends Error {
  readonly context: ErrorContext;
  constructor(message: string, details?: Record<string, any>);
}
