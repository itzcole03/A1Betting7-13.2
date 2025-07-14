import { ErrorMetrics } from '@/types/core.ts';
export declare class ErrorHandler {
  private static instance;
  private errorMetrics;
  private eventBus;
  private constructor();
  static getInstance(): ErrorHandler;
  handleError(error: Error, context: string): void;
  getErrorMetrics(context: string): ErrorMetrics | undefined;
  getAllErrorMetrics(): Map<string, ErrorMetrics>;
  clearErrorMetrics(context?: string): void;
  getErrorCount(context: string): number;
  getLastError(context: string): Error | undefined;
  getLastErrorTimestamp(context: string): number | undefined;
}
