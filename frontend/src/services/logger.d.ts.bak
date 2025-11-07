import { Logger } from '@/types.ts';
declare class LoggerService implements Logger {
  private static instance;
  private isDevelopment;
  private constructor();
  static getInstance(): LoggerService;
  info(message: string, meta?: Record<string, unknown>): void;
  error(message: string, meta?: Record<string, unknown>): void;
  warn(message: string, meta?: Record<string, unknown>): void;
  debug(message: string, meta?: Record<string, unknown>): void;
}
export declare const _logger: LoggerService;
export default logger;
