/**
 * Health Store - Manages diagnostic health data state
 * Follows established Zustand patterns with DevTools and selectors
 */

import { create } from 'zustand';
import { devtools, subscribeWithSelector } from 'zustand/middleware';
import { HealthStoreState, DiagnosticsError } from '../types/diagnostics';
import { DiagnosticsService } from '../services/diagnostics/DiagnosticsService';

interface HealthActions {
  fetchHealth: (force?: boolean) => Promise<void>;
  clearError: () => void;
  reset: () => void;
}

type HealthStore = HealthStoreState & HealthActions;

const useHealthStore = create<HealthStore>()(
  devtools(
    subscribeWithSelector((set, get) => ({
      // Initial state
      health: null,
      loading: false,
      error: null,
      lastFetched: null,

      // Actions
      fetchHealth: async (force = false) => {
        const state = get();
        const now = Date.now();
        
        // Skip if already loading (prevents duplicate requests)
        if (state.loading) {
          return;
        }
        
        // Skip if recently fetched (unless forced)
        if (!force && state.lastFetched && (now - state.lastFetched) < 30000) { // 30 seconds
          return;
        }

        set({ loading: true, error: null }, false, 'fetchHealth:start');

        try {
          const diagnosticsService = DiagnosticsService.getInstance();
          const health = await diagnosticsService.fetchHealth();
          
          set({
            health,
            loading: false,
            error: null,
            lastFetched: now,
          }, false, 'fetchHealth:success');
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown health fetch error';
          const errorCode = (error as DiagnosticsError).code || 'UNKNOWN_ERROR';
          
          set({
            loading: false,
            error: `${errorCode}: ${errorMessage}`,
            lastFetched: now, // Still update timestamp to prevent immediate retries
          }, false, 'fetchHealth:error');
        }
      },

      clearError: () => set({ error: null }, false, 'clearError'),
      
      reset: () => set({
        health: null,
        loading: false,
        error: null,
        lastFetched: null,
      }, false, 'reset'),
    })),
    {
      name: 'HealthStore'
    }
  )
);

// Selectors for optimized access
export const healthSelectors = {
  isLoading: (state: HealthStore) => state.loading,
  hasError: (state: HealthStore) => !!state.error,
  errorMessage: (state: HealthStore) => state.error,
  isHealthy: (state: HealthStore) => state.health?.overall_status === 'ok',
  isDegraded: (state: HealthStore) => state.health?.overall_status === 'degraded',
  isDown: (state: HealthStore) => state.health?.overall_status === 'down',
  
  // Performance metrics
  cacheHitRate: (state: HealthStore) => state.health?.performance?.cache_hit_rate ?? 0,
  cpuPercent: (state: HealthStore) => state.health?.performance?.cpu_percent ?? 0,
  p95Latency: (state: HealthStore) => state.health?.performance?.p95_latency_ms ?? 0,
  activeConnections: (state: HealthStore) => state.health?.performance?.active_connections ?? 0,
  
  // Service status
  healthyServices: (state: HealthStore) => 
    state.health?.services?.filter((s: { status: string }) => s.status === 'ok') ?? [],
  degradedServices: (state: HealthStore) => 
    state.health?.services?.filter((s: { status: string }) => s.status === 'degraded') ?? [],
  downServices: (state: HealthStore) => 
    state.health?.services?.filter((s: { status: string }) => s.status === 'down') ?? [],
  
  // Infrastructure info
  activeEdges: (state: HealthStore) => state.health?.infrastructure?.active_edges ?? 0,
  databaseStatus: (state: HealthStore) => state.health?.infrastructure?.database?.status ?? 'down',
  cacheStatus: (state: HealthStore) => state.health?.infrastructure?.cache?.status ?? 'down',
  
  // Timestamps and metadata
  lastFetched: (state: HealthStore) => state.lastFetched,
  isStale: (state: HealthStore) => {
    if (!state.lastFetched) return true;
    return (Date.now() - state.lastFetched) > 120000; // 2 minutes
  },
  uptime: (state: HealthStore) => state.health?.uptime_seconds ?? 0,
  version: (state: HealthStore) => state.health?.version,
};

export type { HealthStore };
export default useHealthStore;