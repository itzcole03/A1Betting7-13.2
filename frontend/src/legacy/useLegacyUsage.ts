/**
 * Legacy Usage Hook
 * 
 * React hook for polling legacy endpoint usage data from the backend telemetry API.
 * Provides real-time monitoring of deprecated endpoint usage for migration planning.
 * 
 * Features:
 * - Configurable polling interval
 * - Error handling with retry logic
 * - TypeScript interface definitions
 * - Loading states
 */

import { useEffect, useState, useCallback } from 'react';

export interface LegacyEndpointEntry {
  path: string;
  count: number;
  forward?: string;
  last_access_ts?: number;
  last_access_iso?: string;
}

export interface LegacyUsageData {
  enabled: boolean;
  endpoints: LegacyEndpointEntry[];
  total: number;
  first_recorded_ts: number;
  first_recorded_iso: string;
  since_seconds: number;
  sunset_date?: string;
}

export interface MigrationAnalysis {
  high_usage_endpoints: Array<{
    path: string;
    count: number;
    forward?: string;
  }>;
  recommendations: string[];
}

export interface MigrationReadinessData {
  score: number;
  readiness_level: string;
  total_calls_last_24h: number;
  usage_rate_per_hour: number;
  threshold_per_hour: number;
  analysis: MigrationAnalysis;
}

export interface LegacyUsageHookOptions {
  pollInterval?: number;
  enablePolling?: boolean;
  onError?: (error: Error) => void;
  includeReadiness?: boolean;
  threshold?: number;
}

export interface LegacyUsageHookResult {
  data: LegacyUsageData | null;
  readiness: MigrationReadinessData | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  totalCalls: number;
  hasHighUsage: boolean;
  isLegacyEnabled: boolean;
}

const DEFAULT_POLL_INTERVAL = 60000; // 60 seconds
const DEFAULT_THRESHOLD = 50;

export const useLegacyUsage = (options: LegacyUsageHookOptions = {}): LegacyUsageHookResult => {
  const {
    pollInterval = DEFAULT_POLL_INTERVAL,
    enablePolling = true,
    onError,
    includeReadiness = true,
    threshold = DEFAULT_THRESHOLD
  } = options;

  const [data, setData] = useState<LegacyUsageData | null>(null);
  const [readiness, setReadiness] = useState<MigrationReadinessData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLegacyUsage = useCallback(async (): Promise<void> => {
    try {
      setError(null);
      
      // Fetch usage data
      const usageResponse = await fetch('/api/v2/meta/legacy-usage');
      if (!usageResponse.ok) {
        throw new Error(`HTTP ${usageResponse.status}: ${usageResponse.statusText}`);
      }
      const usageData: LegacyUsageData = await usageResponse.json();
      setData(usageData);

      // Optionally fetch migration readiness
      if (includeReadiness) {
        const readinessResponse = await fetch(`/api/v2/meta/migration-readiness?threshold=${threshold}`);
        if (readinessResponse.ok) {
          const readinessData: MigrationReadinessData = await readinessResponse.json();
          setReadiness(readinessData);
        } else {
          // Migration readiness data unavailable but not critical
          setReadiness(null);
        }
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      
      if (onError) {
        onError(err instanceof Error ? err : new Error(errorMessage));
      }
      
      // Error already handled by onError callback or stored in state
    }
  }, [includeReadiness, threshold, onError]);

  const refetch = useCallback(async (): Promise<void> => {
    setLoading(true);
    try {
      await fetchLegacyUsage();
    } finally {
      setLoading(false);
    }
  }, [fetchLegacyUsage]);

  // Initial fetch
  useEffect(() => {
    refetch();
  }, [refetch]);

  // Polling effect
  useEffect(() => {
    if (!enablePolling || pollInterval <= 0) {
      return;
    }

    const interval = setInterval(() => {
      fetchLegacyUsage(); // Don't set loading for polling updates
    }, pollInterval);

    return () => clearInterval(interval);
  }, [enablePolling, pollInterval, fetchLegacyUsage]);

  // Computed values
  const totalCalls = data?.total || 0;
  const hasHighUsage = (readiness?.score || 1.0) < 0.5;
  const isLegacyEnabled = data?.enabled || false;

  return {
    data,
    readiness,
    loading,
    error,
    refetch,
    totalCalls,
    hasHighUsage,
    isLegacyEnabled
  };
};

export default useLegacyUsage;