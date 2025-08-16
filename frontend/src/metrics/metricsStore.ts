/**
 * Central Metrics Store
 * 
 * Zustand store that guarantees a non-null normalized metrics object
 * at all times to prevent runtime crashes from undefined metric properties.
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { normalizeMetrics, mergeMetrics, DEFAULT_METRICS, NormalizedMetrics } from './normalizeMetrics';

interface MetricsState {
  /** Current normalized metrics with guaranteed defaults */
  current: NormalizedMetrics;
  /** Last update timestamp */
  lastUpdated: number;
  /** Loading state for UI components */
  isLoading: boolean;
  /** Source of last update */
  lastSource?: string;
  /** Error state if metric updates fail */
  error?: string;
}

interface MetricsActions {
  /** Update metrics from raw backend data */
  updateFromRaw: (raw: unknown, source?: string) => void;
  /** Merge multiple raw metric sources */
  updateFromMultipleSources: (sources: { data: unknown; source: string }[]) => void;
  /** Clear any error state */
  clearError: () => void;
  /** Reset to default metrics */
  reset: () => void;
  /** Set loading state */
  setLoading: (loading: boolean) => void;
}

type MetricsStore = MetricsState & MetricsActions;

const initialState: MetricsState = {
  current: { ...DEFAULT_METRICS },
  lastUpdated: Date.now(),
  isLoading: false,
  error: undefined,
  lastSource: 'default',
};

export const useMetricsStore = create<MetricsStore>()(
  subscribeWithSelector((set, get) => ({
    ...initialState,

    updateFromRaw: (raw: unknown, source = 'unknown') => {
      try {
        const normalized = normalizeMetrics(raw);
        const current = get().current;
        
        set({
          // Merge with existing metrics to preserve values
          current: { ...current, ...normalized },
          lastUpdated: Date.now(),
          lastSource: source,
          error: undefined,
          isLoading: false,
        });

        // Development logging
        if (import.meta.env?.DEV) {
          /* eslint-disable-next-line no-console */
          console.debug('[MetricsStore] Updated from', source, normalized);
        }
      } catch (error) {
        /* eslint-disable-next-line no-console */
        console.warn('[MetricsStore] Update failed:', error);
        set({
          error: error instanceof Error ? error.message : 'Unknown error',
          isLoading: false,
        });
      }
    },

    updateFromMultipleSources: (sources) => {
      try {
        const rawData = sources.map(s => s.data);
        const merged = mergeMetrics(...rawData);
        const current = get().current;
        
        set({
          current: { ...current, ...merged },
          lastUpdated: Date.now(),
          lastSource: sources.map(s => s.source).join(', '),
          error: undefined,
          isLoading: false,
        });

        if (import.meta.env?.DEV) {
          /* eslint-disable-next-line no-console */
          console.debug('[MetricsStore] Updated from multiple sources:', sources.map(s => s.source));
        }
      } catch (error) {
        /* eslint-disable-next-line no-console */
        console.warn('[MetricsStore] Multi-source update failed:', error);
        set({
          error: error instanceof Error ? error.message : 'Unknown error',
          isLoading: false,
        });
      }
    },

    clearError: () => set({ error: undefined }),

    reset: () => set({
      current: { ...DEFAULT_METRICS },
      lastUpdated: Date.now(),
      lastSource: 'reset',
      error: undefined,
      isLoading: false,
    }),

    setLoading: (isLoading: boolean) => set({ isLoading }),
  }))
);

/**
 * Hook to access normalized metrics - guaranteed to never be null
 */
export function useMetrics() {
  const current = useMetricsStore(state => state.current);
  const isLoading = useMetricsStore(state => state.isLoading);
  const error = useMetricsStore(state => state.error);
  const lastUpdated = useMetricsStore(state => state.lastUpdated);
  const lastSource = useMetricsStore(state => state.lastSource);

  return {
    metrics: current, // Guaranteed to have safe defaults
    isLoading,
    error,
    lastUpdated,
    lastSource,
  };
}

/**
 * Hook to access metric store actions
 */
export function useMetricsActions() {
  const updateFromRaw = useMetricsStore(state => state.updateFromRaw);
  const updateFromMultipleSources = useMetricsStore(state => state.updateFromMultipleSources);
  const clearError = useMetricsStore(state => state.clearError);
  const reset = useMetricsStore(state => state.reset);
  const setLoading = useMetricsStore(state => state.setLoading);

  return {
    updateFromRaw,
    updateFromMultipleSources,
    clearError,
    reset,
    setLoading,
  };
}

/**
 * Hook to get specific metric with fallback
 */
export function useMetric<K extends keyof NormalizedMetrics>(
  key: K,
  fallback?: NormalizedMetrics[K]
): NormalizedMetrics[K] {
  return useMetricsStore(state => {
    const value = state.current[key];
    return value !== undefined && value !== null 
      ? value 
      : fallback !== undefined 
        ? fallback 
        : DEFAULT_METRICS[key];
  });
}

/**
 * Hook for cache hit rate with automatic percentage formatting
 */
export function useCacheHitRate(): { 
  rate: number; 
  percentage: string; 
  formatted: string;
} {
  const rate = useMetric('cacheHitRate', 0);
  
  // Handle both decimal (0.85) and percentage (85) formats
  const normalizedRate = typeof rate === 'number' 
    ? (rate <= 1 ? rate * 100 : rate)
    : 0;
    
  return {
    rate: normalizedRate,
    percentage: `${normalizedRate.toFixed(1)}%`,
    formatted: `${normalizedRate.toFixed(1)}%`,
  };
}

/**
 * Initialize metrics store with health check
 */
export function initializeMetricsStore(): void {
  const store = useMetricsStore.getState();
  
  // Verify store is working
  if (!store.current) {
    /* eslint-disable-next-line no-console */
    console.warn('[MetricsStore] Store initialization failed, resetting...');
    store.reset();
  }
  
  if (import.meta.env?.DEV) {
    /* eslint-disable-next-line no-console */
    console.debug('[MetricsStore] Initialized with defaults:', store.current);
  }
}