type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogEntry {
  level: LogLevel;
  message: string;
  data?: unknown;
  context?: string;
  timestamp: string;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';

  private formatMessage(
    level: LogLevel,
    message: string,
    data?: unknown,
    context?: string
  ): LogEntry {
    return {
      level,
      message,
      data,
      context,
      timestamp: new Date().toISOString(),
    };
  }

  private logToConsole(entry: LogEntry) {
    // Log to console only in development environment
    if (!this.isDevelopment) return;

    const { level, message, data, context, timestamp } = entry;
    const prefix = context ? `[${context}]` : '';
    const fullMessage = `${timestamp} ${prefix} ${message}`;

    // Properly serialize data for logging
    const logData = data !== undefined ? (
      typeof data === 'object' && data !== null
        ? JSON.stringify(data, null, 2)
        : data
    ) : '';

    switch (level) {
      case 'info':
        if (logData) {
          console.info(fullMessage, logData);
        } else {
          console.info(fullMessage);
        }
        break;
      case 'warn':
        if (logData) {
          console.warn(fullMessage, logData);
        } else {
          console.warn(fullMessage);
        }
        break;
      case 'error':
        if (logData) {
          console.error(fullMessage, logData);
        } else {
          console.error(fullMessage);
        }
        break;
      case 'debug':
        if (logData) {
          console.debug(fullMessage, logData);
        } else {
          console.debug(fullMessage);
        }
        break;
    }
  }

  info(message: string, data?: unknown, context?: string) {
    const entry = this.formatMessage('info', message, data, context);
    this.logToConsole(entry);
  }

  warn(message: string, data?: unknown, context?: string) {
    const entry = this.formatMessage('warn', message, data, context);
    this.logToConsole(entry);
  }

  error(message: string, data?: unknown, context?: string) {
    const entry = this.formatMessage('error', message, data, context);
    this.logToConsole(entry);
  }

  debug(message: string, data?: unknown, context?: string) {
    const entry = this.formatMessage('debug', message, data, context);
    this.logToConsole(entry);
  }
}

export const logger = new Logger();
