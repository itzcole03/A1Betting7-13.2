// Error types
export enum ErrorType {
  NETWORK = 'NETWORK',
  API = 'API',
  VALIDATION = 'VALIDATION',
  RUNTIME = 'RUNTIME',
  CHUNK_LOAD = 'CHUNK_LOAD',
  WEBSOCKET = 'WEBSOCKET',
  PERFORMANCE = 'PERFORMANCE',
  UNKNOWN = 'UNKNOWN'
}

export enum ErrorSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

// Error interfaces
interface AppError {
  id: string;
  type: ErrorType;
  severity: ErrorSeverity;
  message: string;
  stack?: string;
  context?: Record<string, any>;
  timestamp: number;
  userId?: string;
  sessionId?: string;
  url?: string;
  userAgent?: string;
  componentStack?: string;
}

interface ErrorRecoveryStrategy {
  type: 'retry' | 'fallback' | 'redirect' | 'refresh' | 'ignore';
  action?: () => void;
  maxRetries?: number;
  redirectUrl?: string;
}

// Error handler class
export class GlobalErrorHandler {
  private static instance: GlobalErrorHandler;
  private errors: AppError[] = [];
  private errorListeners: Array<(error: AppError) => void> = [];
  private retryStrategies: Map<string, ErrorRecoveryStrategy> = new Map();
  private sessionId: string;

  static getInstance(): GlobalErrorHandler {
    if (!GlobalErrorHandler.instance) {
      GlobalErrorHandler.instance = new GlobalErrorHandler();
    }
    return GlobalErrorHandler.instance;
  }

  constructor() {
    this.sessionId = this.generateSessionId();
    this.setupGlobalErrorHandlers();
    this.setupRetryStrategies();
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private setupGlobalErrorHandlers(): void {
    // Unhandled JavaScript errors
    window.addEventListener('error', (event) => {
      this.handleError({
        type: ErrorType.RUNTIME,
        severity: ErrorSeverity.HIGH,
        message: event.message || 'Unknown runtime error',
        stack: event.error?.stack,
        context: {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno
        }
      });
    });

    // Unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      const error = event.reason;
      this.handleError({
        type: this.determineErrorType(error),
        severity: ErrorSeverity.MEDIUM,
        message: error?.message || 'Unhandled promise rejection',
        stack: error?.stack,
        context: {
          reason: event.reason
        }
      });
    });

    // Chunk loading errors
    window.addEventListener('error', (event) => {
      if (event.target && 'src' in event.target && typeof event.target.src === 'string') {
        if (event.target.src.includes('.js') || event.target.src.includes('.css')) {
          this.handleError({
            type: ErrorType.CHUNK_LOAD,
            severity: ErrorSeverity.CRITICAL,
            message: 'Failed to load application chunk',
            context: {
              src: event.target.src,
              element: event.target.tagName
            }
          });
        }
      }
    }, true);
  }

  private setupRetryStrategies(): void {
    // Network errors - retry with exponential backoff
    this.retryStrategies.set(ErrorType.NETWORK, {
      type: 'retry',
      maxRetries: 3
    });

    // API errors - retry once, then show fallback
    this.retryStrategies.set(ErrorType.API, {
      type: 'retry',
      maxRetries: 1
    });

    // Chunk load errors - refresh page
    this.retryStrategies.set(ErrorType.CHUNK_LOAD, {
      type: 'refresh'
    });

    // WebSocket errors - retry connection
    this.retryStrategies.set(ErrorType.WEBSOCKET, {
      type: 'retry',
      maxRetries: 5
    });
  }

  private determineErrorType(error: any): ErrorType {
    if (!error) return ErrorType.UNKNOWN;

    const message = error.message?.toLowerCase() || '';
    
    if (message.includes('network') || message.includes('fetch')) {
      return ErrorType.NETWORK;
    }
    
    if (message.includes('api') || message.includes('400') || message.includes('500')) {
      return ErrorType.API;
    }
    
    if (message.includes('websocket') || message.includes('ws')) {
      return ErrorType.WEBSOCKET;
    }
    
    if (message.includes('chunk') || message.includes('loading')) {
      return ErrorType.CHUNK_LOAD;
    }

    return ErrorType.RUNTIME;
  }

  handleError(errorInput: Partial<AppError> & { message: string }): void {
    const error: AppError = {
      id: this.generateErrorId(),
      type: errorInput.type || ErrorType.UNKNOWN,
      severity: errorInput.severity || ErrorSeverity.MEDIUM,
      message: errorInput.message,
      stack: errorInput.stack,
      context: errorInput.context || {},
      timestamp: Date.now(),
      sessionId: this.sessionId,
      url: window.location.href,
      userAgent: navigator.userAgent,
      componentStack: errorInput.componentStack
    };

    this.errors.push(error);
    
    // Keep only last 50 errors
    if (this.errors.length > 50) {
      this.errors.shift();
    }

    // Notify listeners
    this.errorListeners.forEach(listener => {
      try {
        listener(error);
      } catch (listenerError) {
        console.error('Error in error listener:', listenerError);
      }
    });

    // Apply recovery strategy
    this.applyRecoveryStrategy(error);

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.group(`🚨 Error [${error.type}] - ${error.severity}`);
      console.error(error.message);
      if (error.stack) console.error(error.stack);
      if (error.context) console.table(error.context);
      console.groupEnd();
    }

    // In production, send to error tracking service
    if (process.env.NODE_ENV === 'production') {
      this.reportError(error);
    }
  }

  private generateErrorId(): string {
    return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private applyRecoveryStrategy(error: AppError): void {
    const strategy = this.retryStrategies.get(error.type);
    
    if (!strategy) return;

    switch (strategy.type) {
      case 'retry':
        if (strategy.action && strategy.maxRetries) {
          this.retryWithBackoff(strategy.action, strategy.maxRetries);
        }
        break;
      
      case 'refresh':
        setTimeout(() => {
          window.location.reload();
        }, 1000);
        break;
      
      case 'redirect':
        if (strategy.redirectUrl) {
          window.location.href = strategy.redirectUrl;
        }
        break;
    }
  }

  private retryWithBackoff(action: () => void, maxRetries: number, currentRetry = 0): void {
    if (currentRetry >= maxRetries) return;
    
    const delay = Math.pow(2, currentRetry) * 1000; // Exponential backoff
    
    setTimeout(() => {
      try {
        action();
      } catch (error) {
        this.retryWithBackoff(action, maxRetries, currentRetry + 1);
      }
    }, delay);
  }

  private reportError(error: AppError): void {
    // In a real application, send to error tracking service like Sentry
    fetch('/api/errors', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(error)
    }).catch(() => {
      // Silently fail if error reporting fails
    });
  }

  addErrorListener(listener: (error: AppError) => void): () => void {
    this.errorListeners.push(listener);
    
    // Return unsubscribe function
    return () => {
      const index = this.errorListeners.indexOf(listener);
      if (index > -1) {
        this.errorListeners.splice(index, 1);
      }
    };
  }

  getErrors(type?: ErrorType): AppError[] {
    if (type) {
      return this.errors.filter(error => error.type === type);
    }
    return [...this.errors];
  }

  clearErrors(): void {
    this.errors = [];
  }

  getErrorStats(): Record<ErrorType, number> {
    const stats: Record<ErrorType, number> = {} as Record<ErrorType, number>;
    
    Object.values(ErrorType).forEach(type => {
      stats[type] = this.errors.filter(error => error.type === type).length;
    });
    
    return stats;
  }
}

// Hook for error handling
export const useErrorHandler = () => {
  const errorHandler = GlobalErrorHandler.getInstance();

  const handleError = (error: Partial<AppError> & { message: string }) => {
    errorHandler.handleError(error);
  };

  const handleAsyncError = (asyncFn: () => Promise<any>) => {
    return asyncFn().catch((error) => {
      handleError({
        type: ErrorType.API,
        severity: ErrorSeverity.MEDIUM,
        message: error.message || 'Async operation failed',
        stack: error.stack
      });
      throw error; // Re-throw to allow caller to handle
    });
  };

  return {
    handleError,
    handleAsyncError,
    getErrors: () => errorHandler.getErrors(),
    clearErrors: () => errorHandler.clearErrors(),
    getErrorStats: () => errorHandler.getErrorStats()
  };
};

export default GlobalErrorHandler;
