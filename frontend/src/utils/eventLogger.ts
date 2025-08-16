/**
 * Event Logger Utility
 * 
 * Lightweight event logger with batching, component integration, and structured logging
 * for WebSocket/realtime events and system diagnostics.
 */

export type EventSeverity = 'debug' | 'info' | 'warn' | 'error' | 'critical';
export type EventCategory = 'websocket' | 'sse' | 'validation' | 'ui' | 'performance' | 'security' | 'config';

export interface LogEvent {
  id: string;
  timestamp: number;
  severity: EventSeverity;
  category: EventCategory;
  component: string;
  message: string;
  data?: Record<string, unknown>;
  tags?: string[];
  sessionId?: string;
  userId?: string;
}

export interface LogBatch {
  batchId: string;
  timestamp: number;
  events: LogEvent[];
  metadata: {
    userAgent: string;
    url: string;
    environment: string;
    buildVersion?: string;
  };
}

export interface EventLoggerConfig {
  batchSize: number;
  batchTimeout: number; // milliseconds
  maxBatchSize: number;
  enableConsoleOutput: boolean;
  enableRemoteLogging: boolean;
  remoteEndpoint?: string;
  minimumSeverity: EventSeverity;
  retainedEventCount: number;
  autoFlush: boolean;
}

class EventLogger {
  private config: EventLoggerConfig;
  private eventBuffer: LogEvent[] = [];
  private batchTimer?: NodeJS.Timeout;
  private eventHistory: LogEvent[] = [];
  private sessionId: string;
  private eventIdCounter = 0;

  private readonly severityLevels: Record<EventSeverity, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
    critical: 4
  };

  constructor(config?: Partial<EventLoggerConfig>) {
    this.config = {
      batchSize: 10,
      batchTimeout: 30000, // 30 seconds
      maxBatchSize: 100,
      enableConsoleOutput: process.env.NODE_ENV === 'development',
      enableRemoteLogging: process.env.NODE_ENV === 'production',
      minimumSeverity: process.env.NODE_ENV === 'development' ? 'debug' : 'info',
      retainedEventCount: 1000,
      autoFlush: true,
      ...config
    };

    this.sessionId = this.generateSessionId();
    
    // Auto-flush on page unload
    if (typeof window !== 'undefined' && this.config.autoFlush) {
      window.addEventListener('beforeunload', () => {
        this.flush();
      });

      // Periodic flush for long-running sessions
      setInterval(() => {
        if (this.eventBuffer.length > 0) {
          this.flush();
        }
      }, this.config.batchTimeout);
    }
  }

  /**
   * Log an event with automatic batching
   */
  public log(
    severity: EventSeverity,
    category: EventCategory,
    component: string,
    message: string,
    data?: Record<string, unknown>,
    tags?: string[]
  ): string {
    // Check if event meets minimum severity threshold
    if (this.severityLevels[severity] < this.severityLevels[this.config.minimumSeverity]) {
      return ''; // Event filtered out
    }

    const eventId = this.generateEventId();
    const event: LogEvent = {
      id: eventId,
      timestamp: Date.now(),
      severity,
      category,
      component,
      message,
      data,
      tags,
      sessionId: this.sessionId,
      userId: this.getCurrentUserId()
    };

    // Add to buffer and history
    this.eventBuffer.push(event);
    this.eventHistory.push(event);

    // Maintain history size limit
    if (this.eventHistory.length > this.config.retainedEventCount) {
      this.eventHistory.splice(0, this.eventHistory.length - this.config.retainedEventCount);
    }

    // Console output for development
    if (this.config.enableConsoleOutput) {
      this.outputToConsole(event);
    }

    // Check if we should flush the batch
    if (this.eventBuffer.length >= this.config.batchSize) {
      this.flush();
    } else if (!this.batchTimer) {
      // Set timer for automatic flush
      this.batchTimer = setTimeout(() => {
        this.flush();
      }, this.config.batchTimeout);
    }

    return eventId;
  }

  /**
   * Convenience methods for different severity levels
   */
  public debug(category: EventCategory, component: string, message: string, data?: Record<string, unknown>): string {
    return this.log('debug', category, component, message, data);
  }

  public info(category: EventCategory, component: string, message: string, data?: Record<string, unknown>): string {
    return this.log('info', category, component, message, data);
  }

  public warn(category: EventCategory, component: string, message: string, data?: Record<string, unknown>): string {
    return this.log('warn', category, component, message, data);
  }

  public error(category: EventCategory, component: string, message: string, data?: Record<string, unknown>): string {
    return this.log('error', category, component, message, data);
  }

  public critical(category: EventCategory, component: string, message: string, data?: Record<string, unknown>): string {
    return this.log('critical', category, component, message, data);
  }

  /**
   * WebSocket-specific logging helpers
   */
  public logWebSocketEvent(component: string, event: 'connect' | 'disconnect' | 'reconnect' | 'error' | 'message', details?: Record<string, unknown>): string {
    const severity: EventSeverity = event === 'error' ? 'error' : event === 'connect' ? 'info' : 'debug';
    return this.log(severity, 'websocket', component, `WebSocket ${event}`, details, ['realtime', 'websocket']);
  }

  /**
   * SSE-specific logging helpers
   */
  public logSSEEvent(component: string, event: 'activate' | 'deactivate' | 'connect' | 'error' | 'message', details?: Record<string, unknown>): string {
    const severity: EventSeverity = event === 'error' ? 'error' : event === 'activate' ? 'warn' : 'info';
    return this.log(severity, 'sse', component, `SSE ${event}`, details, ['realtime', 'sse']);
  }

  /**
   * Performance logging
   */
  public logPerformance(component: string, operation: string, durationMs: number, details?: Record<string, unknown>): string {
    const severity: EventSeverity = durationMs > 5000 ? 'warn' : durationMs > 1000 ? 'info' : 'debug';
    return this.log(severity, 'performance', component, `${operation} took ${durationMs}ms`, {
      operation,
      durationMs,
      ...details
    }, ['performance']);
  }

  /**
   * Validation logging
   */
  public logValidation(component: string, validationType: string, result: 'pass' | 'fail' | 'warn', details?: Record<string, unknown>): string {
    const severity: EventSeverity = result === 'fail' ? 'error' : result === 'warn' ? 'warn' : 'debug';
    return this.log(severity, 'validation', component, `Validation ${validationType}: ${result}`, {
      validationType,
      result,
      ...details
    }, ['validation']);
  }

  /**
   * Flush current batch to configured endpoints
   */
  public flush(): void {
    if (this.eventBuffer.length === 0) return;

    const batch: LogBatch = {
      batchId: this.generateBatchId(),
      timestamp: Date.now(),
      events: [...this.eventBuffer],
      metadata: {
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Server',
        url: typeof window !== 'undefined' ? window.location.href : 'N/A',
        environment: process.env.NODE_ENV || 'unknown',
        buildVersion: process.env.REACT_APP_BUILD_VERSION
      }
    };

    // Send to remote endpoint if configured
    if (this.config.enableRemoteLogging && this.config.remoteEndpoint) {
      this.sendBatchToRemote(batch).catch(error => {
        // Fallback: log locally if remote fails
        // eslint-disable-next-line no-console
        console.warn('[EventLogger] Failed to send batch to remote endpoint:', error);
      });
    }

    // Clear buffer and reset timer
    this.eventBuffer = [];
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = undefined;
    }
  }

  /**
   * Get recent events for debugging
   */
  public getRecentEvents(count = 50, category?: EventCategory, severity?: EventSeverity): LogEvent[] {
    let events = this.eventHistory.slice(-count);

    if (category) {
      events = events.filter(event => event.category === category);
    }

    if (severity) {
      const minLevel = this.severityLevels[severity];
      events = events.filter(event => this.severityLevels[event.severity] >= minLevel);
    }

    return events;
  }

  /**
   * Generate diagnostic report
   */
  public generateDiagnosticReport(): string {
    const recentErrors = this.getRecentEvents(20, undefined, 'error');
    const recentWarnings = this.getRecentEvents(20, undefined, 'warn');
    const recentWebSocketEvents = this.getRecentEvents(10, 'websocket');
    const recentSSEEvents = this.getRecentEvents(10, 'sse');

    let report = `=== EVENT LOGGER DIAGNOSTIC REPORT ===\n\n`;
    report += `Session ID: ${this.sessionId}\n`;
    report += `Total Events Logged: ${this.eventHistory.length}\n`;
    report += `Events in Buffer: ${this.eventBuffer.length}\n`;
    report += `Configuration: ${JSON.stringify(this.config, null, 2)}\n\n`;

    if (recentErrors.length > 0) {
      report += `RECENT ERRORS (${recentErrors.length}):\n`;
      recentErrors.forEach((event, index) => {
        report += `${index + 1}. [${new Date(event.timestamp).toISOString()}] ${event.component}: ${event.message}\n`;
      });
      report += '\n';
    }

    if (recentWarnings.length > 0) {
      report += `RECENT WARNINGS (${recentWarnings.length}):\n`;
      recentWarnings.forEach((event, index) => {
        report += `${index + 1}. [${new Date(event.timestamp).toISOString()}] ${event.component}: ${event.message}\n`;
      });
      report += '\n';
    }

    if (recentWebSocketEvents.length > 0) {
      report += `RECENT WEBSOCKET EVENTS (${recentWebSocketEvents.length}):\n`;
      recentWebSocketEvents.forEach((event, index) => {
        report += `${index + 1}. [${new Date(event.timestamp).toISOString()}] ${event.component}: ${event.message}\n`;
      });
      report += '\n';
    }

    if (recentSSEEvents.length > 0) {
      report += `RECENT SSE EVENTS (${recentSSEEvents.length}):\n`;
      recentSSEEvents.forEach((event, index) => {
        report += `${index + 1}. [${new Date(event.timestamp).toISOString()}] ${event.component}: ${event.message}\n`;
      });
    }

    return report;
  }

  /**
   * Output event to console with appropriate styling
   */
  private outputToConsole(event: LogEvent): void {
    const timestamp = new Date(event.timestamp).toISOString();
    const prefix = `[${timestamp}] [${event.category.toUpperCase()}] [${event.component}]`;
    
    switch (event.severity) {
      case 'debug':
        // eslint-disable-next-line no-console
        console.debug(`${prefix} ${event.message}`, event.data);
        break;
      case 'info':
        // eslint-disable-next-line no-console
        console.info(`${prefix} ${event.message}`, event.data);
        break;
      case 'warn':
        // eslint-disable-next-line no-console
        console.warn(`${prefix} ${event.message}`, event.data);
        break;
      case 'error':
      case 'critical':
        // eslint-disable-next-line no-console
        console.error(`${prefix} ${event.message}`, event.data);
        break;
    }
  }

  /**
   * Send batch to remote logging endpoint
   */
  private async sendBatchToRemote(batch: LogBatch): Promise<void> {
    if (!this.config.remoteEndpoint) return;

    const response = await fetch(this.config.remoteEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(batch)
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
  }

  /**
   * Generate unique session ID
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }

  /**
   * Generate unique event ID
   */
  private generateEventId(): string {
    return `event_${++this.eventIdCounter}_${Date.now()}`;
  }

  /**
   * Generate unique batch ID
   */
  private generateBatchId(): string {
    return `batch_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Get current user ID if available
   */
  private getCurrentUserId(): string | undefined {
    // This would integrate with your authentication system
    // For now, return undefined or implement as needed
    return undefined;
  }
}

// Export singleton instance
export const eventLogger = new EventLogger();
export { EventLogger };