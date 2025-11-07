import type { LogLevel, LogRecord, LogTransport, LoggerOptions, SanitizedError } from './types';

const DEFAULT_CIRCULAR_PLACEHOLDER = '[Circular]';

const DEFAULT_ERROR_HANDLER = (transportName: string, error: unknown) => {
  if (typeof console !== 'undefined' && typeof console.warn === 'function') {
    console.warn(`[logger] transport "${transportName}" failed`, error);
  }
};

const DEFAULT_CLOCK = () => new Date();

const DEFAULT_ALLOWED_LEVELS: LogLevel[] = ['debug', 'info', 'warn', 'error'];

type NormalizedPayload = {
  data?: unknown;
  error?: SanitizedError;
};

function sanitizeError(error: Error): SanitizedError {
  const sanitized: SanitizedError = {
    name: error.name,
    message: error.message,
  };

  if (error.stack) {
    sanitized.stack = error.stack;
  }

  const anyError = error as unknown as { cause?: unknown };
  if ('cause' in anyError && anyError.cause !== undefined) {
    sanitized.cause = serializeValue(anyError.cause);
  }

  return sanitized;
}

function serializeValue(value: unknown, seen: WeakSet<object> = new WeakSet()): unknown {
  if (value instanceof Error) {
    return sanitizeError(value);
  }

  if (value === null || typeof value !== 'object') {
    if (typeof value === 'bigint') {
      return value.toString();
    }
    return value;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (value instanceof Map) {
    const mapped: Record<string, unknown> = {};
    value.forEach((entryValue, entryKey) => {
      mapped[String(entryKey)] = serializeValue(entryValue, seen);
    });
    return mapped;
  }

  if (value instanceof Set) {
    return Array.from(value, entry => serializeValue(entry, seen));
  }

  if (seen.has(value as object)) {
    return DEFAULT_CIRCULAR_PLACEHOLDER;
  }

  seen.add(value as object);

  if (Array.isArray(value)) {
    const serializedArray = value.map(item => serializeValue(item, seen));
    seen.delete(value as object);
    return serializedArray;
  }

  const serializedObject: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
    serializedObject[key] = serializeValue(val, seen);
  }

  seen.delete(value as object);
  return serializedObject;
}

function normalizePayload(input?: unknown): NormalizedPayload {
  if (input === undefined) {
    return {};
  }

  if (input instanceof Error) {
    return { error: sanitizeError(input) };
  }

  return { data: serializeValue(input) };
}

function resolveContext(base: string | undefined, next: string | undefined): string | undefined {
  if (!base && !next) {
    return undefined;
  }

  if (!base) {
    return next;
  }

  if (!next) {
    return base;
  }

  return `${base}/${next}`;
}

function isPromise<T>(value: unknown): value is Promise<T> {
  return !!value && typeof (value as Promise<T>).then === 'function';
}

export interface ConsoleTransportOptions {
  levels?: LogLevel[];
  enableOutsideDevelopment?: boolean;
}

export function createConsoleTransport(options: ConsoleTransportOptions = {}): LogTransport {
  const allowedLevels = new Set(options.levels ?? DEFAULT_ALLOWED_LEVELS);
  const environment = typeof process !== 'undefined' ? process.env.NODE_ENV : undefined;
  const shouldLog = options.enableOutsideDevelopment || environment === 'development';

  const consoleTransport: LogTransport = {
    name: 'console',
    write: (record: LogRecord) => {
      if (!shouldLog || !allowedLevels.has(record.level)) {
        return;
      }

      const methodName = record.level === 'debug' ? 'debug' : record.level;
      const consoleRecord = console as unknown as Record<string, (...args: unknown[]) => void>;
      const selected = typeof console !== 'undefined' ? consoleRecord[methodName] : undefined;
      const consoleMethod = typeof selected === 'function' ? selected : console.log.bind(console);

      const prefix = record.context ? `[${record.context}]` : '';
      const baseMessage = `${record.timestamp.toISOString()} ${prefix} ${record.message}`.trim();

      const payload: Record<string, unknown> = {};
      if (record.data !== undefined) {
        payload.data = record.data;
      }
      if (record.error) {
        payload.error = record.error;
      }

      if (Object.keys(payload).length > 0) {
        consoleMethod(baseMessage, payload);
      } else {
        consoleMethod(baseMessage);
      }
    },
  };

  return consoleTransport;
}

export function createNoopTransport(): LogTransport {
  return {
    name: 'noop',
    write: () => {
      /* intentionally empty */
    },
  };
}

class TransportRegistry {
  private readonly transports = new Map<string, LogTransport>();

  constructor(initialTransports: LogTransport[] = []) {
    initialTransports.forEach(transport => this.add(transport));
  }

  add(transport: LogTransport): void {
    this.transports.set(transport.name, transport);
  }

  remove(name: string): boolean {
    return this.transports.delete(name);
  }

  clear(): void {
    this.transports.clear();
  }

  values(): LogTransport[] {
    return Array.from(this.transports.values());
  }
}

export class Logger {
  private readonly registry: TransportRegistry;
  private readonly clock: () => Date;
  private readonly onTransportError: (transportName: string, error: unknown) => void;
  private readonly defaultContext?: string;

  constructor(transports: LogTransport[] = [], options: LoggerOptions = {}) {
    const resolvedTransports =
      transports.length > 0 ? transports : [createConsoleTransport(), createNoopTransport()];
    this.registry = new TransportRegistry(resolvedTransports);
    this.clock = options.clock ?? DEFAULT_CLOCK;
    this.onTransportError = options.onTransportError ?? DEFAULT_ERROR_HANDLER;
    this.defaultContext = options.defaultContext;
  }

  addTransport(transport: LogTransport): void {
    this.registry.add(transport);
  }

  removeTransport(name: string): boolean {
    return this.registry.remove(name);
  }

  clearTransports(): void {
    this.registry.clear();
  }

  getTransports(): LogTransport[] {
    return this.registry.values();
  }

  child(context: string): Logger {
    return new Logger(this.getTransports(), {
      clock: this.clock,
      onTransportError: this.onTransportError,
      defaultContext: resolveContext(this.defaultContext, context),
    });
  }

  log(level: LogLevel, message: string, data?: unknown, context?: string): void {
    const normalized = normalizePayload(data);
    const record: LogRecord = {
      level,
      message,
      timestamp: this.clock(),
      context: resolveContext(this.defaultContext, context),
      ...normalized,
    };

    this.dispatch(record);
  }

  info(message: string, data?: unknown, context?: string): void {
    this.log('info', message, data, context);
  }

  warn(message: string, data?: unknown, context?: string): void {
    this.log('warn', message, data, context);
  }

  error(message: string, data?: unknown, context?: string): void {
    this.log('error', message, data, context);
  }

  debug(message: string, data?: unknown, context?: string): void {
    this.log('debug', message, data, context);
  }

  private dispatch(record: LogRecord): void {
    for (const transport of this.registry.values()) {
      try {
        const result = transport.write(record);
        if (isPromise(result)) {
          result.catch(error => this.onTransportError(transport.name, error));
        }
      } catch (error) {
        this.onTransportError(transport.name, error);
      }
    }
  }
}

const defaultLogger = new Logger();

export const logger = defaultLogger;

export type { LogLevel, LogRecord, LogTransport, LoggerOptions, SanitizedError } from './types';
export {};

export default defaultLogger;
