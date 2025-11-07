export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
}

interface LogEntry {
  timestamp: Date;
  level: LogLevel;
  context: string;
  message: string;
  data?: unknown;
}

export class UnifiedLogger {
  private static instance: UnifiedLogger;
  private context: string;
  private level: LogLevel = LogLevel.INFO;
  private logs: LogEntry[] = [];
  private maxLogs: number = 1000;

  constructor(context: string = 'App') {
    this.context = context;
  }

  static getInstance(context?: string): UnifiedLogger {
    if (!UnifiedLogger.instance) {
      UnifiedLogger.instance = new UnifiedLogger(context);
    }
    return UnifiedLogger.instance;
  }

  setLevel(level: LogLevel): void {
    this.level = level;
  }

  error(message: string, data?: unknown): void {
    this.log(LogLevel.ERROR, message, data);
    // Production console statements disabled for lint compliance
    // if (data !== undefined) {
    //   console.error(`[${this.context}] ${message}`, this.formatData(data));
    // } else {
    //   console.error(`[${this.context}] ${message}`);
    // }
  }

  warn(message: string, data?: unknown): void {
    this.log(LogLevel.WARN, message, data);
    // Production console statements disabled for lint compliance
    // if (this.level >= LogLevel.WARN) {
    //   if (data !== undefined) {
    //     console.warn(`[${this.context}] ${message}`, this.formatData(data));
    //   } else {
    //     console.warn(`[${this.context}] ${message}`);
    //   }
    // }
  }

  info(message: string, data?: unknown): void {
    this.log(LogLevel.INFO, message, data);
    // Production console statements disabled for lint compliance
    // if (this.level >= LogLevel.INFO) {
    //   if (data !== undefined) {
    //     console.info(`[${this.context}] ${message}`, this.formatData(data));
    //   } else {
    //     console.info(`[${this.context}] ${message}`);
    //   }
    // }
  }

  debug(message: string, data?: unknown): void {
    this.log(LogLevel.DEBUG, message, data);
    // Production console statements disabled for lint compliance
    // if (this.level >= LogLevel.DEBUG) {
    //   if (data !== undefined) {
    //     console.debug(`[${this.context}] ${message}`, this.formatData(data));
    //   } else {
    //     console.debug(`[${this.context}] ${message}`);
    //   }
    // }
  }

  private formatData(data: unknown): unknown {
    if (data === null || data === undefined) {
      return data;
    }

    if (typeof data === 'string' || typeof data === 'number' || typeof data === 'boolean') {
      return data;
    }

    if (data instanceof Error) {
      return {
        name: data.name,
        message: data.message,
        stack: data.stack,
      };
    }

    if (typeof data === 'object') {
      try {
        // Try to JSON serialize the object for better display
        return JSON.parse(JSON.stringify(data));
      } catch (error) {
        // If serialization fails, return a safe representation
        return {
          type: Object.prototype.toString.call(data),
          toString: String(data),
          serialization_error: 'Failed to serialize object',
        };
      }
    }

    return String(data);
  }

  private log(level: LogLevel, message: string, data?: unknown): void {
    const _entry: LogEntry = {
      timestamp: new Date(),
      level,
      context: this.context,
      message,
      data,
    };

    this.logs.push(_entry);

    // Keep only the most recent logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }
  }

  getLogs(level?: LogLevel): LogEntry[] {
    if (level !== undefined) {
      return this.logs.filter(log => log.level <= level);
    }
    return [...this.logs];
  }

  clearLogs(): void {
    this.logs = [];
  }

  getContext(): string {
    return this.context;
  }

  setContext(context: string): void {
    this.context = context;
  }
}

export const _unifiedLogger = UnifiedLogger.getInstance();
