/**
 * React Hooks for Typed API Client
 * 
 * Provides React hooks for type-safe API interactions
 * with automatic loading states, error handling, and caching
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { 
  TypedAPIClient, 
  TypedAPIClientConfig, 
  UseAPIOptions,
  SportsProp,
  MLBGame,
  PredictionResponse,
  HealthResponse,
} from '../services/TypedAPIClient';

// Global API client instance
let globalAPIClient: TypedAPIClient | null = null;

export function getAPIClient(config?: Partial<TypedAPIClientConfig>): TypedAPIClient {
  if (!globalAPIClient || config) {
    globalAPIClient = new TypedAPIClient(config);
  }
  return globalAPIClient;
}

// ===== BASE HOOK TYPES =====

export interface APIHookState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

// ===== GENERIC API HOOK =====

export function useAPICall<T>(
  apiCall: () => Promise<T>,
  options: UseAPIOptions = {}
): APIHookState<T> {
  const { immediate = true, onSuccess, onError } = options;
  
  const [state, setState] = useState<{
    data: T | null;
    loading: boolean;
    error: Error | null;
  }>({
    data: null,
    loading: false,
    error: null,
  });

  const isMounted = useRef(true);
  const currentCall = useRef<Promise<T> | null>(null);

  const execute = useCallback(async () => {
    if (!isMounted.current) return;

    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const promise = apiCall();
      currentCall.current = promise;
      const result = await promise;
      
      // Only update state if this is still the current call and component is mounted
      if (currentCall.current === promise && isMounted.current) {
        setState({ data: result, loading: false, error: null });
        onSuccess?.(result);
      }
    } catch (error) {
      if (isMounted.current && currentCall.current) {
        const errorObj = error instanceof Error ? error : new Error(String(error));
        setState(prev => ({ ...prev, loading: false, error: errorObj }));
        onError?.(errorObj);
      }
    }
  }, [apiCall, onSuccess, onError]);

  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, [immediate, execute]);

  useEffect(() => {
    return () => {
      isMounted.current = false;
      currentCall.current = null;
    };
  }, []);

  return {
    ...state,
    refetch: execute,
  };
}

// ===== SPECIFIC API HOOKS =====

/**
 * Hook for fetching health status
 */
export function useHealthCheck(options: UseAPIOptions = {}) {
  const client = getAPIClient();
  return useAPICall<HealthResponse>(
    () => client.getHealth(),
    options
  );
}

/**
 * Hook for fetching API health
 */
export function useAPIHealth(options: UseAPIOptions = {}) {
  const client = getAPIClient();
  return useAPICall<{ status: string }>(
    () => client.getAPIHealth(),
    options
  );
}

/**
 * Hook for activating sports
 */
export function useSportActivation() {
  const client = getAPIClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const activateSport = useCallback(async (sport: 'MLB' | 'NBA' | 'NFL' | 'NHL') => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await client.activateSport(sport);
      setLoading(false);
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      setLoading(false);
      throw error;
    }
  }, [client]);

  return { activateSport, loading, error };
}

/**
 * Hook for fetching MLB today's games
 */
export function useMLBTodaysGames(options: UseAPIOptions = {}) {
  const client = getAPIClient();
  return useAPICall<MLBGame[]>(
    () => client.getMLBTodaysGames(),
    options
  );
}

/**
 * Hook for fetching comprehensive props with caching
 */
export function useMLBComprehensiveProps(
  gameId: string | null,
  optimizePerformance = false,
  options: UseAPIOptions = {}
) {
  const client = getAPIClient();
  
  return useAPICall(
    () => {
      if (!gameId) throw new Error('Game ID is required');
      return client.getMLBComprehensiveProps(gameId, optimizePerformance);
    },
    {
      ...options,
      immediate: options.immediate && !!gameId,
      dependencies: [gameId, optimizePerformance, ...(options.dependencies || [])],
    }
  );
}

/**
 * Hook for fetching featured props with filtering
 */
export function useFeaturedProps(
  filters?: {
    sport?: string;
    player_name?: string;
    prop_type?: string;
    confidence_threshold?: number;
  },
  options: UseAPIOptions = {}
) {
  const client = getAPIClient();
  
  return useAPICall<SportsProp[]>(
    () => client.getFeaturedProps(filters),
    {
      ...options,
      dependencies: [JSON.stringify(filters), ...(options.dependencies || [])],
    }
  );
}

/**
 * Hook for predictions with mutation support
 */
export function usePredictions(options: UseAPIOptions = {}) {
  const client = getAPIClient();
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<Error | null>(null);

  const fetchState = useAPICall<PredictionResponse[]>(
    () => client.getPredictions(),
    options
  );

  const createPrediction = useCallback(async (request: {
    player_name: string;
    sport: 'MLB' | 'NBA' | 'NFL' | 'NHL';
    prop_type: string;
    line_score: number;
    game_date?: string;
    opponent?: string;
  }) => {
    setCreating(true);
    setCreateError(null);
    
    try {
      const result = await client.createPrediction(request);
      setCreating(false);
      
      // Refetch predictions to get updated list
      fetchState.refetch();
      
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setCreateError(error);
      setCreating(false);
      throw error;
    }
  }, [client, fetchState]);

  return {
    ...fetchState,
    createPrediction,
    creating,
    createError,
  };
}

/**
 * Hook for live game stats with auto-refresh
 */
export function useMLBLiveGameStats(
  gameId: string | null,
  refreshInterval = 30000, // 30 seconds
  options: UseAPIOptions = {}
) {
  const client = getAPIClient();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const apiHook = useAPICall(
    () => {
      if (!gameId) throw new Error('Game ID is required');
      return client.getMLBLiveGameStats(gameId);
    },
    {
      ...options,
      immediate: options.immediate && !!gameId,
      dependencies: [gameId, ...(options.dependencies || [])],
    }
  );

  useEffect(() => {
    if (gameId && refreshInterval > 0) {
      intervalRef.current = setInterval(() => {
        apiHook.refetch();
      }, refreshInterval);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [gameId, refreshInterval, apiHook.refetch, apiHook]);

  return apiHook;
}

/**
 * Hook for modern ML health and models
 */
export function useMLHealth(options: UseAPIOptions = {}) {
  const client = getAPIClient();
  return useAPICall(
    () => client.getMLHealth(),
    options
  );
}

/**
 * Hook for ML models
 */
export function useMLModels(options: UseAPIOptions = {}) {
  const client = getAPIClient();
  return useAPICall(
    () => client.getMLModels(),
    options
  );
}

/**
 * Hook for ML strategies
 */
export function useMLStrategies(options: UseAPIOptions = {}) {
  const client = getAPIClient();
  return useAPICall(
    () => client.getMLStrategies(),
    options
  );
}

/**
 * Hook for notifications
 */
export function useNotificationStats(options: UseAPIOptions = {}) {
  const client = getAPIClient();
  return useAPICall(
    () => client.getNotificationStats(),
    options
  );
}

/**
 * Hook for analytics dashboard
 */
export function useAnalytics(options: UseAPIOptions = {}) {
  const client = getAPIClient();
  return useAPICall(
    () => client.getAnalytics(),
    options
  );
}

/**
 * Hook for ML performance metrics
 */
export function useMLPerformance(options: UseAPIOptions = {}) {
  const client = getAPIClient();
  return useAPICall(
    () => client.getMLPerformance(),
    options
  );
}

// ===== UTILITY HOOKS =====

/**
 * Hook for managing API client configuration
 */
export function useAPIConfig() {
  const [config, setConfig] = useState<Partial<TypedAPIClientConfig>>({});

  const updateConfig = useCallback((newConfig: Partial<TypedAPIClientConfig>) => {
    setConfig((prev: Partial<TypedAPIClientConfig>) => ({ ...prev, ...newConfig }));
    // Force recreation of global client with new config
    globalAPIClient = new TypedAPIClient({ ...config, ...newConfig });
  }, [config]);

  return { config, updateConfig };
}

/**
 * Hook for batch API calls with loading coordination
 */
export function useBatchAPI<T extends Record<string, () => Promise<unknown>>>(
  apiCalls: T,
  options: UseAPIOptions = {}
): {
  data: { [K in keyof T]: Awaited<ReturnType<T[K]>> | null };
  loading: boolean;
  errors: { [K in keyof T]: Error | null };
  refetchAll: () => Promise<void>;
} {
  type CallKeys = keyof T;
  type DataType = { [K in CallKeys]: Awaited<ReturnType<T[K]>> | null };
  type ErrorType = { [K in CallKeys]: Error | null };

  const [state, setState] = useState<{
    data: DataType;
    loading: boolean;
    errors: ErrorType;
  }>(() => ({
    data: Object.keys(apiCalls).reduce((acc, key) => {
      acc[key as CallKeys] = null;
      return acc;
    }, {} as DataType),
    loading: false,
    errors: Object.keys(apiCalls).reduce((acc, key) => {
      acc[key as CallKeys] = null;
      return acc;
    }, {} as ErrorType),
  }));

  const refetchAll = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true }));

    const promises = Object.entries(apiCalls).map(async ([key, apiCall]) => {
      try {
        const result = await (apiCall as () => Promise<unknown>)();
        return { key: key as CallKeys, result, error: null };
      } catch (error) {
        const errorObj = error instanceof Error ? error : new Error(String(error));
        return { key: key as CallKeys, result: null, error: errorObj };
      }
    });

    const results = await Promise.all(promises);

    const newData = { ...state.data };
    const newErrors = { ...state.errors };

    results.forEach(({ key, result, error }) => {
      newData[key] = result as Awaited<ReturnType<T[keyof T]>>;
      newErrors[key] = error;
    });

    setState({
      data: newData,
      loading: false,
      errors: newErrors,
    });
  }, [apiCalls, state.data, state.errors]);

  const dependenciesRef = useRef(options.dependencies);
  dependenciesRef.current = options.dependencies;
  
  useEffect(() => {
    if (options.immediate !== false) {
      refetchAll();
    }
  }, [refetchAll, options.immediate]);

  return {
    ...state,
    refetchAll,
  };
}
