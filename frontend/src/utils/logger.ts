type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogEntry {
  level: LogLevel;
  message: string;
  data?: any;
  context?: string;
  timestamp: string;
}

class Logger {
  private isDevelopment = import.meta.env.DEV;

  private formatMessage(level: LogLevel, message: string, data?: any, context?: string): LogEntry {
    return {
      level,
      message,
      data,
      context,
      timestamp: new Date().toISOString(),
    };
  }

  private logToConsole(entry: LogEntry) {
    if (!this.isDevelopment) return;

    const { level, message, data, context, timestamp } = entry;
    const prefix = context ? `[${context}]` : '';
    const fullMessage = `${timestamp} ${prefix} ${message}`;

    switch (level) {
      case 'info':
        console.info(fullMessage, data || '');
        break;
      case 'warn':
        console.warn(fullMessage, data || '');
        break;
      case 'error':
        console.error(fullMessage, data || '');
        break;
      case 'debug':
        console.debug(fullMessage, data || '');
        break;
    }
  }

  info(message: string, data?: any, context?: string) {
    const entry = this.formatMessage('info', message, data, context);
    this.logToConsole(entry);
  }

  warn(message: string, data?: any, context?: string) {
    const entry = this.formatMessage('warn', message, data, context);
    this.logToConsole(entry);
  }

  error(message: string, data?: any, context?: string) {
    const entry = this.formatMessage('error', message, data, context);
    this.logToConsole(entry);
  }

  debug(message: string, data?: any, context?: string) {
    const entry = this.formatMessage('debug', message, data, context);
    this.logToConsole(entry);
  }
}

export const logger = new Logger();
