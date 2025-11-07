import type { Logger, LogLevel } from './logging/logger';

export type ScopedLogger = Logger;

export declare function getLogger(component?: string): ScopedLogger;
export declare function setLevel(level: LogLevel): void;
export declare const getInstance: () => Logger;

export declare const logger: Logger;
export declare const UnifiedLogger: Logger;

export { createConsoleTransport, createNoopTransport, Logger } from './logging/logger';

export type {
  LoggerOptions,
  LogLevel,
  LogRecord,
  LogTransport,
  SanitizedError,
} from './logging/logger';

declare const _default: Logger;
export default _default;
