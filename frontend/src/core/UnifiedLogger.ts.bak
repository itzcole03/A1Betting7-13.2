import type { LogLevel } from './logging/logger';
import defaultLogger, {
  logger as canonicalLogger,
  createConsoleTransport,
  createNoopTransport,
  Logger,
} from './logging/logger';
export type {
  LoggerOptions,
  LogLevel,
  LogRecord,
  LogTransport,
  SanitizedError,
} from './logging/logger';

type CanonicalLogger = typeof canonicalLogger & {
  getInstance?: () => typeof canonicalLogger;
};

const unifiedLogger = canonicalLogger as CanonicalLogger;

if (typeof unifiedLogger.getInstance !== 'function') {
  Object.defineProperty(unifiedLogger, 'getInstance', {
    value: () => canonicalLogger,
    enumerable: false,
    configurable: false,
    writable: false,
  });
}

export type ScopedLogger = Logger;

export function getLogger(component = 'app'): ScopedLogger {
  return canonicalLogger.child(component);
}

const LEVEL_PRIORITY: LogLevel[] = ['debug', 'info', 'warn', 'error'];

function computeAllowedLevels(level: LogLevel): LogLevel[] {
  const index = LEVEL_PRIORITY.indexOf(level);
  if (index === -1) {
    return LEVEL_PRIORITY;
  }
  return LEVEL_PRIORITY.slice(index);
}

export function setLevel(level: LogLevel): void {
  const allowedLevels = computeAllowedLevels(level);

  // Remove existing console transports to prevent duplicates
  // eslint-disable-next-line no-empty
  while (canonicalLogger.removeTransport('console')) {}

  canonicalLogger.addTransport(
    createConsoleTransport({
      levels: allowedLevels,
    })
  );
}

export { createConsoleTransport, createNoopTransport, canonicalLogger as logger, Logger };

export const UnifiedLogger = canonicalLogger;

export const getInstance = () => canonicalLogger;

export default defaultLogger;
