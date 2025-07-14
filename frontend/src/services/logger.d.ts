import { Logger } from '@/types.ts';
declare class LoggerService implements Logger {
  private static instance;
  private isDevelopment;
  private constructor();
  static getInstance(): LoggerService;
  info(message: string, meta?: Record<string, any>): void;
  error(message: string, meta?: Record<string, any>): void;
  warn(message: string, meta?: Record<string, any>): void;
  debug(message: string, meta?: Record<string, any>): void;
}
export declare const logger: LoggerService;
export default logger;
