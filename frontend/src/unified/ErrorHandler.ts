import { ErrorMetrics } from '../types/core';

/**
 * Unified Error Handler for the A1 Betting Platform
 * Provides centralized error handling, logging, and metrics collection
 */
export class ErrorHandler {
  private static instance: ErrorHandler;
  private errorMetrics: Map<string, ErrorMetrics> = new Map();
  private errorListeners: Array<(error: Error, context: string) => void> = [];

  private constructor() {
    this.setupGlobalHandlers();
  }

  /**
   * Get the singleton instance of ErrorHandler
   */
  public static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  /**
   * Set up global error handlers for unhandled errors
   */
  private setupGlobalHandlers(): void {
    // Handle unhandled promise rejections
    if (typeof window !== 'undefined') {
      window.addEventListener('unhandledrejection', event => {
        // Special handling for WebSocket errors
        if (
          event.reason &&
          (event.reason.message?.includes('WebSocket closed without opened') ||
            event.reason.toString?.().includes('WebSocket closed without opened'))
        ) {
          // Log WebSocket errors but don't treat them as critical
          console.warn('WebSocket connection issue (handled):', event.reason);
          event.preventDefault(); // Prevent the error from being logged as unhandled
          return;
        }

        this.handleError(
          new Error(`Unhandled Promise Rejection: ${event.reason}`),
          'unhandled_promise_rejection'
        );
      });

      // Handle general JavaScript errors
      window.addEventListener('error', event => {
        this.handleError(event.error || new Error(event.message), 'javascript_error');
      });
    }
  }

  /**
   * Handle an error with context
   * @param error - The error to handle
   * @param context - Context information about where the error occurred
   */
  public handleError(error: Error, context: string): void {
    try {
      // Log the error
      console.error(`[ErrorHandler] ${context}:`, error);

      // Update error metrics
      this.updateErrorMetrics(error, context);

      // Notify error listeners
      this.notifyErrorListeners(error, context);

      // In development, you might want to show additional debugging info
      if (process.env.NODE_ENV === 'development') {
        console.group(`Error Details - ${context}`);
        console.error('Stack trace:', error.stack);
        console.error('Error name:', error.name);
        console.error('Error message:', error.message);
        console.groupEnd();
      }
    } catch (handlingError) {
      // Prevent recursive error handling
      console.error('[ErrorHandler] Error while handling error:', handlingError);
    }
  }

  /**
   * Update error metrics for monitoring
   */
  private updateErrorMetrics(error: Error, context: string): void {
    const key = `${context}_${error.name}`;
    const existing = this.errorMetrics.get(key) || {
      count: 0,
      lastError: error,
      timestamp: Date.now(),
    };

    this.errorMetrics.set(key, {
      count: existing.count + 1,
      lastError: error,
      timestamp: Date.now(),
    });
  }

  /**
   * Notify registered error listeners
   */
  private notifyErrorListeners(error: Error, context: string): void {
    this.errorListeners.forEach(listener => {
      try {
        listener(error, context);
      } catch (listenerError) {
        console.error('[ErrorHandler] Error in error listener:', listenerError);
      }
    });
  }

  /**
   * Add an error listener
   * @param listener - Function to call when errors occur
   */
  public addErrorListener(listener: (error: Error, context: string) => void): void {
    this.errorListeners.push(listener);
  }

  /**
   * Remove an error listener
   * @param listener - The listener function to remove
   */
  public removeErrorListener(listener: (error: Error, context: string) => void): void {
    const index = this.errorListeners.indexOf(listener);
    if (index !== -1) {
      this.errorListeners.splice(index, 1);
    }
  }

  /**
   * Get error metrics for monitoring
   */
  public getErrorMetrics(): Map<string, ErrorMetrics> {
    return new Map(this.errorMetrics);
  }

  /**
   * Clear error metrics (useful for testing)
   */
  public clearErrorMetrics(): void {
    this.errorMetrics.clear();
  }

  /**
   * Create a wrapped function that handles errors automatically
   * @param fn - Function to wrap
   * @param context - Context for error handling
   */
  public wrapFunction<T extends (...args: any[]) => any>(fn: T, context: string): T {
    return ((...args: any[]) => {
      try {
        const result = fn(...args);
        // Handle async functions
        if (result && typeof result.catch === 'function') {
          return result.catch((error: Error) => {
            this.handleError(error, context);
            throw error;
          });
        }
        return result;
      } catch (error) {
        this.handleError(error as Error, context);
        throw error;
      }
    }) as T;
  }

  /**
   * Handle WebSocket-specific errors with graceful degradation
   * @param error - The WebSocket error
   * @param context - Additional context about the WebSocket operation
   */
  public handleWebSocketError(error: Error, context: string = 'websocket_operation'): void {
    // Check if this is a known non-critical WebSocket error
    const nonCriticalErrors = [
      'WebSocket closed without opened',
      'WebSocket connection timeout',
      'WebSocket connection failed',
      'Connection refused',
    ];

    const isNonCritical = nonCriticalErrors.some(
      pattern => error.message?.includes(pattern) || error.toString().includes(pattern)
    );

    if (isNonCritical) {
      // Log as warning instead of error
      console.warn(`[WebSocket] ${context}:`, error.message);

      // Update metrics but don't notify error listeners
      this.updateErrorMetrics(error, `websocket_${context}`);

      // In development, provide additional debugging info
      if (process.env.NODE_ENV === 'development') {
        console.group(`WebSocket Warning - ${context}`);
        console.warn(
          'This is typically caused by network connectivity issues or server unavailability'
        );
        console.warn(
          'The application will continue to function with reduced real-time capabilities'
        );
        console.groupEnd();
      }
    } else {
      // Handle as regular error for unknown WebSocket issues
      this.handleError(error, `websocket_${context}`);
    }
  }

  /**
   * Destroy the error handler and clean up
   */
  public destroy(): void {
    this.errorListeners = [];
    this.errorMetrics.clear();

    // Remove global handlers if needed
    if (typeof window !== 'undefined') {
      // Note: We can't easily remove these without storing references
      // This is a limitation of the current implementation
    }
  }
}

// Create and export a default instance
const errorHandler = ErrorHandler.getInstance();
export default errorHandler;
