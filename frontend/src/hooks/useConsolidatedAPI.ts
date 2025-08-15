/**
 * Consolidated API React Hook - Post-Phase 5 Integration
 * 
 * This hook provides a React-friendly interface to the consolidated API.
 * It handles loading states, error handling, and caching automatically.
 * 
 * Features:
 * - Automatic loading states
 * - Error handling with retry logic
 * - Request caching and deduplication
 * - Type-safe API calls
 * - Performance monitoring
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  prizePicksIntegration,
  mlServiceIntegration,
  adminServiceIntegration,
  healthMonitoringIntegration,
} from '../services/APIIntegrationLayer';
import type {
  PrizePicksProps,
  MLPrediction,
  AdminHealthStatus,
  AdminMetrics,
  UserProfile,
} from '../services/ConsolidatedAPIClient';

// Hook state types
interface APIState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  lastUpdated: number | null;
}

interface UseAPIOptions {
  autoFetch?: boolean;
  cacheTTL?: number; // Cache time-to-live in milliseconds
  retryAttempts?: number;
  retryDelay?: number;
}

/**
 * Main hook for consolidated API access
 */
export function useConsolidatedAPI<T>(
  apiCall: () => Promise<T>,
  dependencies: unknown[] = [],
  options: UseAPIOptions = {}
): APIState<T> & {
  refetch: () => Promise<void>;
  clearError: () => void;
} {
  const {
    autoFetch = true,
    cacheTTL = 5 * 60 * 1000, // 5 minutes default
    retryAttempts = 3,
    retryDelay = 1000,
  } = options;

  const [state, setState] = useState<APIState<T>>({
    data: null,
    loading: false,
    error: null,
    lastUpdated: null,
  });

  const retryCountRef = useRef(0);
  const cacheRef = useRef<Map<string, { data: T; timestamp: number }>>(new Map());

  const fetchData = useCallback(async (isRetry = false) => {
    const cacheKey = JSON.stringify(dependencies);
    const cached = cacheRef.current.get(cacheKey);
    
    // Check cache validity
    if (cached && Date.now() - cached.timestamp < cacheTTL) {
      setState(prev => ({
        ...prev,
        data: cached.data,
        loading: false,
        error: null,
        lastUpdated: cached.timestamp,
      }));
      return;
    }

    setState(prev => ({ ...prev, loading: true }));

    try {
      const result = await apiCall();
      const now = Date.now();
      
      // Cache the result
      cacheRef.current.set(cacheKey, { data: result, timestamp: now });
      
      setState({
        data: result,
        loading: false,
        error: null,
        lastUpdated: now,
      });
      
      retryCountRef.current = 0;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      // Retry logic
      if (!isRetry && retryCountRef.current < retryAttempts) {
        retryCountRef.current++;
        setTimeout(() => {
          fetchData(true);
        }, retryDelay * retryCountRef.current);
        return;
      }

      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));
      
      retryCountRef.current = 0;
    }
    // Disable exhaustive-deps as dependencies array is handled externally
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiCall, cacheTTL, retryAttempts, retryDelay]);

  const refetch = useCallback(async () => {
    // Clear cache and fetch fresh data
    const cacheKey = JSON.stringify(dependencies);
    cacheRef.current.delete(cacheKey);
    await fetchData();
  }, [fetchData, dependencies]);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  useEffect(() => {
    if (autoFetch) {
      fetchData();
    }
  }, [fetchData, autoFetch]);

  return {
    ...state,
    refetch,
    clearError,
  };
}

/**
 * Hook for PrizePicks data
 */
export function usePrizePicksProps(
  sport: string = 'MLB',
  options: UseAPIOptions = {}
) {
  const apiCall = useCallback(
    () => prizePicksIntegration.getEnhancedProps(sport),
    [sport]
  );

  return useConsolidatedAPI<PrizePicksProps[]>(apiCall, [sport], options);
}

/**
 * Hook for ML predictions
 */
export function useMLPredictions(
  sport: string,
  gameIds?: string[],
  options: UseAPIOptions = {}
) {
  const apiCall = useCallback(
    () => mlServiceIntegration.getEnhancedPredictions(sport, gameIds),
    [sport, gameIds]
  );

  return useConsolidatedAPI<MLPrediction[]>(
    apiCall, 
    [sport, JSON.stringify(gameIds)], 
    options
  );
}

/**
 * Hook for batch ML predictions
 */
export function useBatchMLPredictions(
  requests: { sport: string; player_id: string; stat_type: string }[],
  options: UseAPIOptions = {}
) {
  const apiCall = useCallback(
    () => mlServiceIntegration.getBatchPredictions(requests),
    [requests]
  );

  return useConsolidatedAPI<MLPrediction[]>(
    apiCall,
    [JSON.stringify(requests)],
    options
  );
}

/**
 * Hook for admin health status
 */
export function useAdminHealthStatus(options: UseAPIOptions = {}) {
  const apiCall = useCallback(
    () => adminServiceIntegration.getHealthStatus(),
    []
  );

  return useConsolidatedAPI<AdminHealthStatus>(apiCall, [], options);
}

/**
 * Hook for admin metrics
 */
export function useAdminMetrics(options: UseAPIOptions = {}) {
  const apiCall = useCallback(
    () => adminServiceIntegration.getMetrics(),
    []
  );

  return useConsolidatedAPI<AdminMetrics>(apiCall, [], options);
}

/**
 * Hook for system connectivity monitoring
 */
export function useSystemConnectivity(options: UseAPIOptions = {}) {
  const apiCall = useCallback(
    () => healthMonitoringIntegration.testAllServices(),
    []
  );

  return useConsolidatedAPI(apiCall, [], {
    autoFetch: true,
    cacheTTL: 30 * 1000, // 30 seconds for connectivity checks
    ...options,
  });
}

/**
 * Hook for lineup optimization
 */
export function useLineupOptimization() {
  const [optimizing, setOptimizing] = useState(false);
  const [optimizedLineup, setOptimizedLineup] = useState<{
    lineup: string[];
    expected_value: number;
    risk_score: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const optimizeLineup = useCallback(async (
    propIds: string[],
    constraints?: {
      maxSalary?: number;
      riskTolerance?: 'low' | 'medium' | 'high';
    }
  ) => {
    setOptimizing(true);
    setError(null);

    try {
      const result = await prizePicksIntegration.optimizeLineup(propIds, constraints);
      setOptimizedLineup(result);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Optimization failed';
      setError(errorMessage);
    } finally {
      setOptimizing(false);
    }
  }, []);

  const clearResults = useCallback(() => {
    setOptimizedLineup(null);
    setError(null);
  }, []);

  return {
    optimizeLineup,
    optimizing,
    optimizedLineup,
    error,
    clearResults,
  };
}

/**
 * Hook for authentication
 */
export function useAuthentication() {
  const [authenticating, setAuthenticating] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [error, setError] = useState<string | null>(null);

  const login = useCallback(async (email: string, password: string) => {
    setAuthenticating(true);
    setError(null);

    try {
      const authResponse = await adminServiceIntegration.login(email, password);
      setUser(authResponse.user);
      return authResponse;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Authentication failed';
      setError(errorMessage);
      throw err;
    } finally {
      setAuthenticating(false);
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('refresh_token');
    setUser(null);
    setError(null);
  }, []);

  const getCurrentUser = useCallback(async () => {
    try {
      const userProfile = await adminServiceIntegration.getCurrentUser();
      setUser(userProfile);
      return userProfile;
    } catch {
      // User not authenticated or token expired
      setUser(null);
      return null;
    }
  }, []);

  useEffect(() => {
    // Check if user is already authenticated on mount
    const token = localStorage.getItem('auth_token');
    if (token) {
      getCurrentUser();
    }
  }, [getCurrentUser]);

  return {
    login,
    logout,
    getCurrentUser,
    authenticating,
    user,
    error,
    isAuthenticated: !!user,
  };
}

/**
 * Performance monitoring hook
 */
export function useAPIPerformance() {
  const [metrics, setMetrics] = useState<{
    requestCount: number;
    averageResponseTime: number;
    errorRate: number;
    cacheHitRate: number;
  }>({
    requestCount: 0,
    averageResponseTime: 0,
    errorRate: 0,
    cacheHitRate: 0,
  });

  const updateMetrics = useCallback((
    responseTime: number,
    isError: boolean,
    isCacheHit: boolean
  ) => {
    setMetrics(prev => {
      const newRequestCount = prev.requestCount + 1;
      const newAverageResponseTime = 
        (prev.averageResponseTime * prev.requestCount + responseTime) / newRequestCount;
      const newErrorRate = 
        ((prev.errorRate * prev.requestCount) + (isError ? 1 : 0)) / newRequestCount * 100;
      const newCacheHitRate = 
        ((prev.cacheHitRate * prev.requestCount) + (isCacheHit ? 1 : 0)) / newRequestCount * 100;

      return {
        requestCount: newRequestCount,
        averageResponseTime: Math.round(newAverageResponseTime),
        errorRate: Math.round(newErrorRate * 100) / 100,
        cacheHitRate: Math.round(newCacheHitRate * 100) / 100,
      };
    });
  }, []);

  return { metrics, updateMetrics };
}
