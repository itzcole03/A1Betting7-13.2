/**
 * PR9: Inference Audit Hook
 * 
 * Custom React hook for polling inference audit data and managing
 * inference observability state in the frontend.
 */

import { useState, useEffect, useCallback, useRef } from 'react';

// Types for inference audit data
export interface AuditEntry {
  request_id: string;
  timestamp: number;
  model_version: string;
  feature_hash: string;
  latency_ms: number;
  prediction: number;
  confidence: number;
  shadow_version?: string;
  shadow_prediction?: number;
  shadow_diff?: number;
  shadow_latency_ms?: number;
  status: string;
  schema_version?: string; // PR10: Schema versioning
}

export interface DriftWindow {
  mean_abs_diff: number;
  pct_large_diff: number;
  std_dev_primary: number;
  sample_count: number;
}

export interface DriftMetrics {
  mean_abs_diff: number;
  pct_large_diff: number;
  windows: {
    w50?: DriftWindow;
    w200?: DriftWindow;
    wall?: DriftWindow;
  };
  status: 'NORMAL' | 'WATCH' | 'DRIFTING';
  thresholds: {
    warn: number;
    alert: number;
  };
  earliest_detected_ts?: number;
}

export interface ReadinessMetrics {
  score: number;
  recommendation: 'PROMOTE' | 'MONITOR' | 'HOLD';
  reasoning: string;
  latency_penalty_applied: boolean;
}

export interface CalibrationMetrics {
  count: number;
  mae: number;
  buckets: {
    lt_0_25: number;
    lt_0_5: number;
    lt_0_75: number;
    gte_0_75: number;
  };
}

export interface AuditSummary {
  rolling_count: number;
  avg_latency_ms: number;
  shadow_avg_diff?: number;
  prediction_mean: number;
  confidence_histogram: Record<string, number>;
  shadow_enabled: boolean;
  active_model: string;
  shadow_model?: string;
  success_rate: number;
  error_count: number;
  // PR10: Enhanced metrics
  drift?: DriftMetrics;
  readiness?: ReadinessMetrics;
  calibration?: CalibrationMetrics;
}

export interface DriftStatus {
  drift_status: 'NORMAL' | 'WATCH' | 'DRIFTING' | 'UNKNOWN' | 'UNAVAILABLE';
  earliest_detected_ts?: number;
  last_update_ts: number;
  sample_count: number;
  alert_active: boolean;
}

export interface ModelRegistryInfo {
  available_versions: string[];
  active_version: string;
  shadow_version?: string;
  shadow_enabled: boolean;
}

export interface InferenceAuditState {
  // Data
  summary: AuditSummary | null;
  recentEntries: AuditEntry[];
  registryInfo: ModelRegistryInfo | null;
  driftStatus: DriftStatus | null; // PR10: Drift status
  
  // State management
  loading: boolean;
  error: string | null;
  lastUpdated: number | null;
  
  // Actions
  refresh: () => Promise<void>;
  togglePolling: () => void;
  isPolling: boolean;
  recordOutcome: (featureHash: string, outcomeValue: number) => Promise<void>; // PR10: Outcome recording
}

// Configuration
const DEFAULT_POLLING_INTERVALS = {
  development: 30000, // 30s in dev
  production: 60000,  // 60s in prod
} as const;

const API_ENDPOINTS = {
  summary: '/api/v2/models/audit/summary',
  recent: '/api/v2/models/audit/recent',
  registry: '/api/v2/models/registry',
  driftStatus: '/api/v2/models/audit/status', // PR10: Drift status endpoint
  outcomes: '/api/v2/models/outcomes', // PR10: Outcomes endpoint
} as const;

/**
 * Custom hook for managing inference audit data with polling capabilities
 */
export function useInferenceAudit(options?: {
  pollingInterval?: number;
  maxRecentEntries?: number;
  autoStart?: boolean;
}): InferenceAuditState {
  // Configuration
  const pollingInterval = options?.pollingInterval ?? (
    process.env.NODE_ENV === 'development' 
      ? DEFAULT_POLLING_INTERVALS.development 
      : DEFAULT_POLLING_INTERVALS.production
  );
  const maxRecentEntries = options?.maxRecentEntries ?? 25;
  const autoStart = options?.autoStart ?? true;

  // State
  const [summary, setSummary] = useState<AuditSummary | null>(null);
  const [recentEntries, setRecentEntries] = useState<AuditEntry[]>([]);
  const [registryInfo, setRegistryInfo] = useState<ModelRegistryInfo | null>(null);
  const [driftStatus, setDriftStatus] = useState<DriftStatus | null>(null); // PR10: Drift status
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
  const [isPolling, setIsPolling] = useState(autoStart);

  // Refs for cleanup
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  /**
   * Fetch data from API endpoint with error handling
   */
  const fetchData = useCallback(async <T>(
    endpoint: string, 
    options?: RequestInit
  ): Promise<T> => {
    const response = await fetch(endpoint, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API request failed: ${response.status} ${errorText}`);
    }

    return response.json();
  }, []);

  /**
   * Fetch all audit data (summary, recent entries, registry info)
   */
  const fetchAuditData = useCallback(async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    abortControllerRef.current = new AbortController();
    const { signal } = abortControllerRef.current;

    setLoading(true);
    setError(null);

    try {
      // Fetch all data in parallel (PR10: includes drift status)
      const [summaryData, recentData, registryData, driftData] = await Promise.all([
        fetchData<AuditSummary>(API_ENDPOINTS.summary, { signal }),
        fetchData<AuditEntry[]>(`${API_ENDPOINTS.recent}?limit=${maxRecentEntries}`, { signal }),
        fetchData<ModelRegistryInfo>(API_ENDPOINTS.registry, { signal }),
        fetchData<DriftStatus>(API_ENDPOINTS.driftStatus, { signal }).catch(() => null), // Graceful fallback for drift status
      ]);

      setSummary(summaryData);
      setRecentEntries(recentData);
      setRegistryInfo(registryData);
      setDriftStatus(driftData); // PR10: Set drift status
      setLastUpdated(Date.now());
      setError(null);

    } catch (err) {
      if (err instanceof Error && err.name !== 'AbortError') {
        const errorMessage = err.message || 'Failed to fetch audit data';
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  }, [fetchData, maxRecentEntries]);

  /**
   * Manual refresh function
   */
  const refresh = useCallback(async () => {
    await fetchAuditData();
  }, [fetchAuditData]);

  /**
   * Toggle polling on/off
   */
  const togglePolling = useCallback(() => {
    setIsPolling(prev => !prev);
  }, []);

  /**
   * Set up polling effect
   */
  useEffect(() => {
    if (!isPolling) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Initial fetch
    fetchAuditData();

    // Set up polling interval
    intervalRef.current = setInterval(fetchAuditData, pollingInterval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isPolling, fetchAuditData, pollingInterval]);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  /**
   * Record an observed outcome for calibration analysis (PR10)
   */
  const recordOutcome = useCallback(async (featureHash: string, outcomeValue: number) => {
    try {
      await fetchData(API_ENDPOINTS.outcomes, {
        method: 'POST',
        body: JSON.stringify({
          feature_hash: featureHash,
          outcome_value: outcomeValue,
        }),
      });
    } catch {
      // Don't throw error - outcome recording should be non-blocking
      // Error handling can be enhanced with proper logging service if needed
    }
  }, [fetchData]);

  return {
    // Data
    summary,
    recentEntries,
    registryInfo,
    driftStatus, // PR10: Include drift status
    
    // State
    loading,
    error,
    lastUpdated,
    
    // Actions
    refresh,
    togglePolling,
    isPolling,
    recordOutcome, // PR10: Include outcome recording
  };
}

/**
 * Helper hook for confidence distribution visualization
 */
export function useConfidenceDistribution(summary: AuditSummary | null) {
  return {
    data: summary?.confidence_histogram ? Object.entries(summary.confidence_histogram).map(
      ([range, count]) => ({ range, count })
    ) : [],
    total: summary?.rolling_count ?? 0,
  };
}

/**
 * Helper hook for shadow model comparison metrics  
 */
export function useShadowComparison(summary: AuditSummary | null, recentEntries: AuditEntry[]) {
  const shadowEntries = recentEntries.filter(entry => entry.shadow_diff !== undefined);
  
  const avgDiff = summary?.shadow_avg_diff ?? null;
  const maxDiff = shadowEntries.length > 0 
    ? Math.max(...shadowEntries.map(e => e.shadow_diff!)) 
    : null;
  const minDiff = shadowEntries.length > 0 
    ? Math.min(...shadowEntries.map(e => e.shadow_diff!)) 
    : null;

  return {
    enabled: summary?.shadow_enabled ?? false,
    avgDiff,
    maxDiff,
    minDiff,
    entryCount: shadowEntries.length,
    shadowModel: summary?.shadow_model,
  };
}

/**
 * Hook for performance metrics visualization
 */
export function usePerformanceMetrics(summary: AuditSummary | null, recentEntries: AuditEntry[]) {
  const avgLatency = summary?.avg_latency_ms ?? 0;
  const recentLatencies = recentEntries.map(e => e.latency_ms);
  const maxLatency = recentLatencies.length > 0 ? Math.max(...recentLatencies) : 0;
  const minLatency = recentLatencies.length > 0 ? Math.min(...recentLatencies) : 0;

  return {
    avgLatency,
    maxLatency,
    minLatency,
    successRate: summary?.success_rate ?? 1.0,
    errorCount: summary?.error_count ?? 0,
    totalCount: summary?.rolling_count ?? 0,
  };
}