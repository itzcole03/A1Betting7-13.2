/**
 * Reliability Store - Manages diagnostic reliability report state
 * Follows established Zustand patterns with DevTools and selectors
 */

import { create } from 'zustand';
import { devtools, subscribeWithSelector } from 'zustand/middleware';
import { ReliabilityStoreState, DiagnosticsError, Anomaly } from '../types/diagnostics';
import { DiagnosticsService, FetchReliabilityOptions } from '../services/diagnostics/DiagnosticsService';

interface ReliabilityActions {
  fetchReport: (options?: FetchReliabilityOptions) => Promise<void>;
  clearError: () => void;
  reset: () => void;
}

type ReliabilityStore = ReliabilityStoreState & ReliabilityActions;

const useReliabilityStore = create<ReliabilityStore>()(
  devtools(
    subscribeWithSelector((set, get) => ({
      // Initial state
      report: null,
      loading: false,
      error: null,
      anomalies: [],
      lastFetched: null,

      // Actions
      fetchReport: async (options = {}) => {
        const state = get();
        const now = Date.now();
        const { force = false } = options;
        
        // Skip if already loading (prevents duplicate requests)
        if (state.loading) {
          return;
        }
        
        // Skip if recently fetched (unless forced)
        if (!force && state.lastFetched && (now - state.lastFetched) < 60000) { // 1 minute
          return;
        }

        set({ loading: true, error: null }, false, 'fetchReport:start');

        try {
          const diagnosticsService = DiagnosticsService.getInstance();
          const report = await diagnosticsService.fetchReliability(options);
          
          set({
            report,
            loading: false,
            error: null,
            anomalies: report.anomalies || [],
            lastFetched: now,
          }, false, 'fetchReport:success');
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown reliability fetch error';
          const errorCode = (error as DiagnosticsError).code || 'UNKNOWN_ERROR';
          
          set({
            loading: false,
            error: `${errorCode}: ${errorMessage}`,
            lastFetched: now, // Still update timestamp to prevent immediate retries
          }, false, 'fetchReport:error');
        }
      },

      clearError: () => set({ error: null }, false, 'clearError'),
      
      reset: () => set({
        report: null,
        loading: false,
        error: null,
        anomalies: [],
        lastFetched: null,
      }, false, 'reset'),
    })),
    {
      name: 'ReliabilityStore'
    }
  )
);

// Selectors for optimized access
export const reliabilitySelectors = {
  isLoading: (state: ReliabilityStore) => state.loading,
  hasError: (state: ReliabilityStore) => !!state.error,
  errorMessage: (state: ReliabilityStore) => state.error,
  isReliable: (state: ReliabilityStore) => state.report?.overall_status === 'ok',
  isDegraded: (state: ReliabilityStore) => state.report?.overall_status === 'degraded',
  isDown: (state: ReliabilityStore) => state.report?.overall_status === 'down',
  
  // Anomaly selectors
  allAnomalies: (state: ReliabilityStore) => state.anomalies,
  criticalAnomalies: (state: ReliabilityStore) => 
    state.anomalies.filter((anomaly: Anomaly) => anomaly.severity === 'critical'),
  warningAnomalies: (state: ReliabilityStore) => 
    state.anomalies.filter((anomaly: Anomaly) => anomaly.severity === 'warning'),
  infoAnomalies: (state: ReliabilityStore) => 
    state.anomalies.filter((anomaly: Anomaly) => anomaly.severity === 'info'),
  
  // Anomaly counts
  totalAnomalies: (state: ReliabilityStore) => state.anomalies.length,
  criticalCount: (state: ReliabilityStore) => 
    state.anomalies.filter((anomaly: Anomaly) => anomaly.severity === 'critical').length,
  warningCount: (state: ReliabilityStore) => 
    state.anomalies.filter((anomaly: Anomaly) => anomaly.severity === 'warning').length,
  
  // Metrics
  predictionAccuracy: (state: ReliabilityStore) => state.report?.prediction_accuracy ?? 0,
  systemStability: (state: ReliabilityStore) => state.report?.system_stability ?? 0,
  dataQualityScore: (state: ReliabilityStore) => state.report?.data_quality_score ?? 0,
  
  // Trends
  metricTrends: (state: ReliabilityStore) => state.report?.metric_trends ?? [],
  improvingTrends: (state: ReliabilityStore) => 
    state.report?.metric_trends?.filter(trend => trend.trend === 'improving') ?? [],
  degradingTrends: (state: ReliabilityStore) => 
    state.report?.metric_trends?.filter(trend => trend.trend === 'degrading') ?? [],
  
  // Timestamps and metadata
  lastFetched: (state: ReliabilityStore) => state.lastFetched,
  isStale: (state: ReliabilityStore) => {
    if (!state.lastFetched) return true;
    return (Date.now() - state.lastFetched) > 300000; // 5 minutes
  },
  timestamp: (state: ReliabilityStore) => state.report?.timestamp,
  hasTraces: (state: ReliabilityStore) => !!state.report?.traces?.length,
};

// Named selectors for convenience
export const selectCriticalAnomalies = reliabilitySelectors.criticalAnomalies;
export const selectWarningAnomalies = reliabilitySelectors.warningAnomalies;

export type { ReliabilityStore };
export default useReliabilityStore;