import type { LogLevel, LogTransport, LoggerOptions } from './types';

export type { LogLevel, LogRecord, LogTransport, LoggerOptions, SanitizedError } from './types';

export interface ConsoleTransportOptions {
  levels?: LogLevel[];
  enableOutsideDevelopment?: boolean;
}

export declare function createConsoleTransport(options?: ConsoleTransportOptions): LogTransport;
export declare function createNoopTransport(): LogTransport;

export declare class Logger {
  constructor(transports?: LogTransport[], options?: LoggerOptions);

  addTransport(transport: LogTransport): void;
  removeTransport(name: string): boolean;
  clearTransports(): void;
  getTransports(): LogTransport[];
  child(context: string): Logger;

  log(level: LogLevel, message: string, data?: unknown, context?: string): void;
  info(message: string, data?: unknown, context?: string): void;
  warn(message: string, data?: unknown, context?: string): void;
  error(message: string, data?: unknown, context?: string): void;
  debug(message: string, data?: unknown, context?: string): void;
}

export declare const logger: Logger;

export default logger;
