import { useEffect, useRef, useState, useCallback } from 'react';

/**
 * Component health status as returned by backend
 */
export interface ComponentHealth {
  status: 'up' | 'degraded' | 'down' | 'unknown';
  last_check?: string;
  details?: Record<string, unknown>;
  response_time_ms?: number;
}

/**
 * Structured health status response from new endpoint
 */
export interface HealthStatus {
  status: 'ok' | 'degraded' | 'unhealthy';
  uptime_seconds: number;
  version: string;
  timestamp: string;
  components: Record<string, ComponentHealth>;
  build_info?: Record<string, string>;
}

/**
 * Hook state for health monitoring
 */
export interface HealthHookState {
  data: HealthStatus | null;
  loading: boolean;
  error: Error | null;
  lastChecked: Date | null;
  retryCount: number;
}

/**
 * Options for useHealthStatus hook
 */
export interface HealthStatusOptions {
  /** Polling interval in milliseconds (default: 60000 for production, 30000 for dev) */
  pollInterval?: number;
  /** Maximum retry attempts on failure (default: 5) */
  maxRetries?: number;
  /** Base delay for exponential backoff in milliseconds (default: 1000) */
  baseBackoffMs?: number;
  /** Maximum backoff delay in milliseconds (default: 300000 - 5 minutes) */
  maxBackoffMs?: number;
  /** Enable automatic polling (default: true) */
  enablePolling?: boolean;
}

const HEALTH_ENDPOINT = '/api/v2/diagnostics/health';
const LEGACY_HEALTH_ENDPOINT = '/api/health';

/**
 * Custom hook for monitoring system health with polling and exponential backoff
 * 
 * Features:
 * - Automatic polling with configurable intervals
 * - Exponential backoff on failures up to max 5 minutes
 * - Graceful degradation to legacy endpoint
 * - TypeScript-safe error handling
 * - Automatic retry logic
 * - Memory leak prevention with proper cleanup
 */
export function useHealthStatus(options: HealthStatusOptions = {}): HealthHookState {
  const {
    pollInterval = process.env.NODE_ENV === 'production' ? 60000 : 30000,
    maxRetries = 5,
    baseBackoffMs = 1000,
    maxBackoffMs = 300000, // 5 minutes
    enablePolling = true
  } = options;

  const [state, setState] = useState<HealthHookState>({
    data: null,
    loading: true,
    error: null,
    lastChecked: null,
    retryCount: 0
  });

  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const isMountedRef = useRef(true);

  /**
   * Calculate exponential backoff delay
   */
  const calculateBackoffDelay = useCallback((retryCount: number): number => {
    const delay = Math.min(baseBackoffMs * Math.pow(2, retryCount), maxBackoffMs);
    // Add jitter to prevent thundering herd
    const jitter = Math.random() * 0.1 * delay;
    return delay + jitter;
  }, [baseBackoffMs, maxBackoffMs]);

  /**
   * Fetch health status from backend
   */
  const fetchHealthStatus = useCallback(async (): Promise<HealthStatus> => {
    // Cancel any ongoing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      // Try new structured health endpoint first
      const response = await fetch(HEALTH_ENDPOINT, {
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
          'Cache-Control': 'no-cache'
        }
      });

      if (!response.ok) {
        throw new Error(`Health endpoint returned ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Validate response structure
      if (!data || typeof data.status !== 'string' || typeof data.uptime_seconds !== 'number') {
        throw new Error('Invalid health response structure');
      }

      return data as HealthStatus;

    } catch (error) {
      // If primary endpoint fails, try legacy endpoint
      if (error instanceof Error && !error.message.includes('aborted')) {
        try {
          const legacyResponse = await fetch(LEGACY_HEALTH_ENDPOINT, {
            signal: controller.signal,
            headers: {
              'Accept': 'application/json',
              'Cache-Control': 'no-cache'
            }
          });

          if (legacyResponse.ok) {
            const _legacyData = await legacyResponse.json();
            
            // Transform legacy response to new format
            return {
              status: 'ok',
              uptime_seconds: 0, // Legacy doesn't provide uptime
              version: 'legacy',
              timestamp: new Date().toISOString(),
              components: {},
              build_info: {
                deprecated: 'true',
                message: 'Using legacy health endpoint'
              }
            } as HealthStatus;
          }
        } catch (_legacyError) {
          // Fall through to original error
        }
      }

      throw error;
    }
  }, []);

  /**
   * Perform health check with retry logic
   */
  const performHealthCheck = useCallback(async (isRetry = false): Promise<void> => {
    if (!isMountedRef.current) return;

    try {
      setState(prev => ({ 
        ...prev, 
        loading: true, 
        error: isRetry ? prev.error : null 
      }));

      const healthData = await fetchHealthStatus();

      if (isMountedRef.current) {
        setState(prev => ({
          ...prev,
          data: healthData,
          loading: false,
          error: null,
          lastChecked: new Date(),
          retryCount: 0
        }));
      }

    } catch (error) {
      if (!isMountedRef.current) return;

      const errorObj = error instanceof Error ? error : new Error(String(error));
      
      setState(prev => {
        const newRetryCount = prev.retryCount + 1;
        
        return {
          ...prev,
          loading: false,
          error: errorObj,
          lastChecked: new Date(),
          retryCount: newRetryCount
        };
      });

      // Schedule retry if under max attempts
      if (state.retryCount < maxRetries) {
        const backoffDelay = calculateBackoffDelay(state.retryCount);
        
        retryTimeoutRef.current = setTimeout(() => {
          if (isMountedRef.current) {
            performHealthCheck(true);
          }
        }, backoffDelay);
      }
    }
  }, [fetchHealthStatus, maxRetries, calculateBackoffDelay, state.retryCount]);

  /**
   * Schedule next poll
   */
  const scheduleNextPoll = useCallback(() => {
    if (!enablePolling || !isMountedRef.current) return;

    pollTimeoutRef.current = setTimeout(() => {
      if (isMountedRef.current) {
        performHealthCheck(false);
      }
    }, pollInterval);
  }, [enablePolling, pollInterval, performHealthCheck]);

  /**
   * Manual refresh function for external use
   */
  const refresh = useCallback(() => {
    // Clear any scheduled retry/poll
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
    if (pollTimeoutRef.current) {
      clearTimeout(pollTimeoutRef.current);
      pollTimeoutRef.current = null;
    }

    // Reset retry count and perform check
    setState(prev => ({ ...prev, retryCount: 0 }));
    performHealthCheck(false);
  }, [performHealthCheck]);

  // Initial health check and polling setup
  useEffect(() => {
    isMountedRef.current = true;
    
    // Perform initial health check
    performHealthCheck(false);

    // Cleanup function
    return () => {
      isMountedRef.current = false;
      
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
      if (pollTimeoutRef.current) {
        clearTimeout(pollTimeoutRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [performHealthCheck]);

  // Schedule polling after successful health checks
  useEffect(() => {
    if (!state.loading && !state.error && state.data && enablePolling) {
      scheduleNextPoll();
    }

    return () => {
      if (pollTimeoutRef.current) {
        clearTimeout(pollTimeoutRef.current);
        pollTimeoutRef.current = null;
      }
    };
  }, [state.loading, state.error, state.data, enablePolling, scheduleNextPoll]);

  return {
    ...state,
    // Add refresh method to returned state for external use
    refresh
  } as HealthHookState & { refresh: () => void };
}