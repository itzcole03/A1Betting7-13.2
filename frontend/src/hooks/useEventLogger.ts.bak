import React, { useCallback, useEffect, useRef } from 'react';
import { eventLogger, EventCategory, EventSeverity } from '../utils/eventLogger';

/**
 * React Hook for Event Logger Integration
 * 
 * Provides easy access to event logging within React components with
 * automatic component identification and lifecycle integration.
 */

interface UseEventLoggerOptions {
  componentName?: string;
  autoLogMount?: boolean;
  autoLogUnmount?: boolean;
  defaultCategory?: EventCategory;
  enablePerformanceTracking?: boolean;
}

interface EventLoggerHook {
  log: (severity: EventSeverity, category: EventCategory, message: string, data?: Record<string, unknown>) => string;
  debug: (message: string, data?: Record<string, unknown>) => string;
  info: (message: string, data?: Record<string, unknown>) => string;
  warn: (message: string, data?: Record<string, unknown>) => string;
  error: (message: string, data?: Record<string, unknown>) => string;
  critical: (message: string, data?: Record<string, unknown>) => string;
  logWebSocket: (event: 'connect' | 'disconnect' | 'reconnect' | 'error' | 'message', details?: Record<string, unknown>) => string;
  logSSE: (event: 'activate' | 'deactivate' | 'connect' | 'error' | 'message', details?: Record<string, unknown>) => string;
  logPerformance: (operation: string, durationMs: number, details?: Record<string, unknown>) => string;
  logValidation: (validationType: string, result: 'pass' | 'fail' | 'warn', details?: Record<string, unknown>) => string;
  trackOperation: <T>(operation: string, fn: () => T | Promise<T>) => Promise<T>;
  componentName: string;
}

export function useEventLogger(options: UseEventLoggerOptions = {}): EventLoggerHook {
  const {
    componentName = 'UnknownComponent',
    autoLogMount = false,
    autoLogUnmount = false,
    defaultCategory = 'ui',
    enablePerformanceTracking = false
  } = options;

  const mountTimeRef = useRef<number | undefined>(undefined);

  // Log component mount
  useEffect(() => {
    mountTimeRef.current = Date.now();
    
    if (autoLogMount) {
      eventLogger.debug(defaultCategory, componentName, 'Component mounted');
    }

    if (enablePerformanceTracking) {
      eventLogger.logPerformance(componentName, 'mount_start', 0, { 
        phase: 'mount_start' 
      });
    }

    return () => {
      if (autoLogUnmount) {
        const mountDuration = mountTimeRef.current ? Date.now() - mountTimeRef.current : 0;
        eventLogger.debug(defaultCategory, componentName, 'Component unmounted', {
          mountDurationMs: mountDuration
        });
      }

      if (enablePerformanceTracking && mountTimeRef.current) {
        const mountDuration = Date.now() - mountTimeRef.current;
        eventLogger.logPerformance(componentName, 'total_mount_duration', mountDuration, {
          phase: 'unmount'
        });
      }
    };
  }, [componentName, autoLogMount, autoLogUnmount, defaultCategory, enablePerformanceTracking]);

  // Base logging function with component context
  const log = useCallback((severity: EventSeverity, category: EventCategory, message: string, data?: Record<string, unknown>) => {
    return eventLogger.log(severity, category, componentName, message, data);
  }, [componentName]);

  // Convenience methods with default category
  const debug = useCallback((message: string, data?: Record<string, unknown>) => {
    return log('debug', defaultCategory, message, data);
  }, [log, defaultCategory]);

  const info = useCallback((message: string, data?: Record<string, unknown>) => {
    return log('info', defaultCategory, message, data);
  }, [log, defaultCategory]);

  const warn = useCallback((message: string, data?: Record<string, unknown>) => {
    return log('warn', defaultCategory, message, data);
  }, [log, defaultCategory]);

  const error = useCallback((message: string, data?: Record<string, unknown>) => {
    return log('error', defaultCategory, message, data);
  }, [log, defaultCategory]);

  const critical = useCallback((message: string, data?: Record<string, unknown>) => {
    return log('critical', defaultCategory, message, data);
  }, [log, defaultCategory]);

  // WebSocket logging helper
  const logWebSocket = useCallback((event: 'connect' | 'disconnect' | 'reconnect' | 'error' | 'message', details?: Record<string, unknown>) => {
    return eventLogger.logWebSocketEvent(componentName, event, details);
  }, [componentName]);

  // SSE logging helper
  const logSSE = useCallback((event: 'activate' | 'deactivate' | 'connect' | 'error' | 'message', details?: Record<string, unknown>) => {
    return eventLogger.logSSEEvent(componentName, event, details);
  }, [componentName]);

  // Performance logging helper
  const logPerformance = useCallback((operation: string, durationMs: number, details?: Record<string, unknown>) => {
    return eventLogger.logPerformance(componentName, operation, durationMs, details);
  }, [componentName]);

  // Validation logging helper
  const logValidation = useCallback((validationType: string, result: 'pass' | 'fail' | 'warn', details?: Record<string, unknown>) => {
    return eventLogger.logValidation(componentName, validationType, result, details);
  }, [componentName]);

  // Operation tracking with automatic performance measurement
  const trackOperation = useCallback(async <T>(operation: string, fn: () => T | Promise<T>): Promise<T> => {
    const startTime = Date.now();
    
    try {
      debug(`Starting operation: ${operation}`);
      const result = await fn();
      const duration = Date.now() - startTime;
      
      logPerformance(operation, duration, { status: 'success' });
      return result;
    } catch (operationError) {
      const duration = Date.now() - startTime;
      
      error(`Operation failed: ${operation}`, {
        error: operationError instanceof Error ? operationError.message : String(operationError),
        durationMs: duration
      });
      
      logPerformance(operation, duration, { 
        status: 'error',
        error: operationError instanceof Error ? operationError.message : String(operationError)
      });
      
      throw operationError;
    }
  }, [debug, error, logPerformance]);

  return {
    log,
    debug,
    info,
    warn,
    error,
    critical,
    logWebSocket,
    logSSE,
    logPerformance,
    logValidation,
    trackOperation,
    componentName
  };
}

/**
 * Higher-order component that automatically provides event logging
 */
export function withEventLogger<P extends object>(
  Component: React.ComponentType<P>,
  loggerOptions?: UseEventLoggerOptions
): React.ComponentType<P> {
  const EventLoggerWrapper: React.FC<P> = (props: P) => {
    const logger = useEventLogger({
      componentName: Component.displayName || Component.name || 'AnonymousComponent',
      ...loggerOptions
    });

    // Add logger to props if component expects it
    const enhancedProps = {
      ...props,
      eventLogger: logger
    } as P & { eventLogger: EventLoggerHook };

    return React.createElement(Component, enhancedProps);
  };

  EventLoggerWrapper.displayName = `withEventLogger(${Component.displayName || Component.name})`;
  return EventLoggerWrapper;
}

export type { EventLoggerHook, UseEventLoggerOptions };