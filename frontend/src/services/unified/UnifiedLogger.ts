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
  data?: any;
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

  error(message: string, data?: any): void {
    this.log(LogLevel.ERROR, message, data);
    console.error(`[${this.context}] ${message}`, data);
  }

  warn(message: string, data?: any): void {
    this.log(LogLevel.WARN, message, data);
    if (this.level >= LogLevel.WARN) {
      console.warn(`[${this.context}] ${message}`, data);
    }
  }

  info(message: string, data?: any): void {
    this.log(LogLevel.INFO, message, data);
    if (this.level >= LogLevel.INFO) {
      console.info(`[${this.context}] ${message}`, data);
    }
  }

  debug(message: string, data?: any): void {
    this.log(LogLevel.DEBUG, message, data);
    if (this.level >= LogLevel.DEBUG) {
      console.debug(`[${this.context}] ${message}`, data);
    }
  }

  private log(level: LogLevel, message: string, data?: any): void {
    const entry: LogEntry = {
      timestamp: new Date(),
      level,
      context: this.context,
      message,
      data,
    };

    this.logs.push(entry);

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

export const unifiedLogger = UnifiedLogger.getInstance();
