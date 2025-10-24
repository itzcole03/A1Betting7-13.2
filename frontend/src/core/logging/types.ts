export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface SanitizedError {
  name: string;
  message: string;
  stack?: string;
  cause?: unknown;
}

export interface LogRecord {
  level: LogLevel;
  message: string;
  timestamp: Date;
  context?: string;
  data?: unknown;
  error?: SanitizedError;
}

export interface LogTransport {
  name: string;
  write: (record: LogRecord) => void | Promise<void>;
  flush?: () => void | Promise<void>;
  dispose?: () => void | Promise<void>;
}

export interface LoggerOptions {
  defaultContext?: string;
  clock?: () => Date;
  onTransportError?: (transportName: string, error: unknown) => void;
}
