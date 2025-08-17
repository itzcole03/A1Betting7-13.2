/**
 * Unified API Hooks for Phase 3
 * React hooks for consuming the unified backend architecture
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { unifiedApiService, type PredictionRequest, type PredictionResponse, type HealthData, type AnalyticsData } from '../services/unifiedApiService';
import { useMetricsStore } from '../metrics/metricsStore';

// Generic API hook with loading states and error handling
export function useApiState<T>(initialData: T | null = null) {
  const [data, setData] = useState<T | null>(initialData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(async (apiCall: () => Promise<T>) => {
    try {
      setLoading(true);
      setError(null);
      const result = await apiCall();
      setData(result);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { data, loading, error, execute, setData };
}

// Health check hook
export function useHealthCheck(interval: number = 30000) {
  const { data: health, loading, error, execute } = useApiState<HealthData>();
  const { updateFromRaw } = useMetricsStore();

  const checkHealth = useCallback(async () => {
    const healthData = await execute(() => unifiedApiService.getHealth());
    if (healthData) {
      updateFromRaw(healthData);
    }
    return healthData;
  }, [execute, updateFromRaw]);

  useEffect(() => {
    checkHealth();
    const intervalId = setInterval(checkHealth, interval);
    return () => clearInterval(intervalId);
  }, [checkHealth, interval]);

  return {
    health,
    loading,
    error,
    checkHealth,
    isHealthy: health?.status === 'healthy'
  };
}

// Analytics hook
export function useAnalytics(refreshInterval: number = 60000) {
  const { data: analytics, loading, error, execute } = useApiState<AnalyticsData>();
  const { updateFromRaw } = useMetricsStore();

  const loadAnalytics = useCallback(async () => {
    const analyticsData = await execute(() => unifiedApiService.getAnalytics());
    if (analyticsData) {
      updateFromRaw(analyticsData);
    }
    return analyticsData;
  }, [execute, updateFromRaw]);

  useEffect(() => {
    loadAnalytics();
    const intervalId = setInterval(loadAnalytics, refreshInterval);
    return () => clearInterval(intervalId);
  }, [loadAnalytics, refreshInterval]);

  return {
    analytics,
    loading,
    error,
    refresh: loadAnalytics
  };
}

// Predictions hook
export function usePredictions() {
  const { data: predictions, loading, error, execute, setData } = useApiState<PredictionResponse[]>([]);
  const [createLoading, setCreateLoading] = useState(false);

  const loadPredictions = useCallback((params?: { sport?: string; limit?: number }) => {
    return execute(async () => {
      const response = await unifiedApiService.getRecentPredictions(params);
      return response.predictions || [];
    });
  }, [execute]);

  const createPrediction = useCallback(async (request: PredictionRequest): Promise<PredictionResponse> => {
    try {
      setCreateLoading(true);
      const newPrediction = await unifiedApiService.createPrediction(request);
      
      // Add to current predictions list
      setData(prev => prev ? [newPrediction, ...prev.slice(0, 9)] : [newPrediction]);
      
      return newPrediction;
    } catch (err) {
      console.error('Failed to create prediction:', err);
      throw err;
    } finally {
      setCreateLoading(false);
    }
  }, [setData]);

  const getPrediction = useCallback(async (predictionId: string): Promise<PredictionResponse> => {
    return unifiedApiService.getPrediction(predictionId);
  }, []);

  const getPredictionExplanation = useCallback(async (predictionId: string) => {
    return unifiedApiService.getPredictionExplanation(predictionId);
  }, []);

  useEffect(() => {
    loadPredictions();
  }, [loadPredictions]);

  return {
    predictions,
    loading,
    createLoading,
    error,
    createPrediction,
    getPrediction,
    getPredictionExplanation,
    refresh: loadPredictions
  };
}

// Sports data hook
export function useSportsData(sport?: string) {
  const { data: sportsData, loading, error, execute } = useApiState<any>();

  const loadSportsData = useCallback((sportType: string, params: Record<string, any> = {}) => {
    return execute(() => unifiedApiService.getSportsData(sportType, params));
  }, [execute]);

  useEffect(() => {
    if (sport) {
      loadSportsData(sport);
    }
  }, [sport, loadSportsData]);

  return {
    sportsData,
    loading,
    error,
    loadSportsData
  };
}

// Live odds hook
export function useLiveOdds(sport?: string, refreshInterval: number = 30000) {
  const { data: odds, loading, error, execute } = useApiState<any>();

  const loadOdds = useCallback(() => {
    return execute(() => unifiedApiService.getLiveOdds(sport));
  }, [execute, sport]);

  useEffect(() => {
    loadOdds();
    const intervalId = setInterval(loadOdds, refreshInterval);
    return () => clearInterval(intervalId);
  }, [loadOdds, refreshInterval]);

  return {
    odds,
    loading,
    error,
    refresh: loadOdds
  };
}

// Integration status hook
export function useIntegrationStatus() {
  const { data: integrationStatus, loading, error, execute } = useApiState<any>();

  const loadIntegrationStatus = useCallback(() => {
    return execute(() => unifiedApiService.getIntegrationStatus());
  }, [execute]);

  useEffect(() => {
    loadIntegrationStatus();
  }, [loadIntegrationStatus]);

  return {
    integrationStatus,
    loading,
    error,
    refresh: loadIntegrationStatus
  };
}

// Arbitrage opportunities hook
export function useArbitrageOpportunities(sport?: string, refreshInterval: number = 60000) {
  const { data: opportunities, loading, error, execute } = useApiState<any[]>([]);

  const loadOpportunities = useCallback(() => {
    return execute(() => unifiedApiService.getArbitrageOpportunities(sport));
  }, [execute, sport]);

  useEffect(() => {
    loadOpportunities();
    const intervalId = setInterval(loadOpportunities, refreshInterval);
    return () => clearInterval(intervalId);
  }, [loadOpportunities, refreshInterval]);

  return {
    opportunities,
    loading,
    error,
    refresh: loadOpportunities
  };
}

// Portfolio optimization hook
export function usePortfolioOptimization() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const optimizePortfolio = useCallback(async (params: {
    bankroll: number;
    risk_tolerance: 'conservative' | 'moderate' | 'aggressive';
    predictions?: any[];
  }) => {
    try {
      setLoading(true);
      setError(null);
      return await unifiedApiService.optimizePortfolio(params);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Optimization failed';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const calculateKelly = useCallback(async (params: {
    probability: number;
    odds: number;
    bankroll: number;
  }) => {
    try {
      setLoading(true);
      setError(null);
      return await unifiedApiService.calculateKelly(params);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Kelly calculation failed';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    optimizePortfolio,
    calculateKelly
  };
}

// System administration hooks
export function useSystemInfo() {
  const { data: systemInfo, loading, error, execute } = useApiState<any>();

  const loadSystemInfo = useCallback(() => {
    return execute(() => unifiedApiService.getSystemInfo());
  }, [execute]);

  return {
    systemInfo,
    loading,
    error,
    refresh: loadSystemInfo
  };
}

export function useCacheStats() {
  const { data: cacheStats, loading, error, execute } = useApiState<any>();

  const loadCacheStats = useCallback(() => {
    return execute(() => unifiedApiService.getCacheStats());
  }, [execute]);

  return {
    cacheStats,
    loading,
    error,
    refresh: loadCacheStats
  };
}

// Combined domain status hook
export function useDomainStatus() {
  const { health } = useHealthCheck();
  const { analytics } = useAnalytics();
  const { integrationStatus } = useIntegrationStatus();

  const domainStatus = useMemo(() => {
    if (!health) return null;

    return {
      prediction: {
        status: health.domains.prediction?.status || 'unknown',
        metrics: analytics ? {
          accuracy: analytics.model_performance.ensemble_accuracy,
          predictions_today: analytics.model_performance.predictions_today
        } : null
      },
      data: {
        status: health.domains.data?.status || 'unknown',
        metrics: null
      },
      analytics: {
        status: health.domains.analytics?.status || 'unknown',
        metrics: analytics ? {
          response_time: analytics.system_performance.avg_response_time_ms,
          uptime: analytics.system_performance.uptime_percent
        } : null
      },
      integration: {
        status: health.domains.integration?.status || 'unknown',
        metrics: integrationStatus ? {
          active_connections: integrationStatus.sportsbook_status?.active_connections,
          arbitrage_opportunities: integrationStatus.odds_data?.arbitrage_opportunities
        } : null
      },
      optimization: {
        status: health.domains.optimization?.status || 'unknown',
        metrics: null
      }
    };
  }, [health, analytics, integrationStatus]);

  return domainStatus;
}

// Performance monitoring hook
export function usePerformanceMetrics() {
  const { health } = useHealthCheck();
  const { analytics } = useAnalytics();
  const { updateFromRaw } = useMetricsStore();

  const performanceMetrics = useMemo(() => {
    if (!health || !analytics) return null;

    // Combine data and update metrics store
    const combinedData = {
      ...health,
      ...analytics,
      // Merge infrastructure and performance data
      infrastructure: health.infrastructure,
      system_performance: analytics.system_performance,
      model_performance: analytics.model_performance
    };
    
    updateFromRaw(combinedData);

    return {
      system: {
        response_time_ms: analytics.system_performance.avg_response_time_ms,
        p95_response_time_ms: analytics.system_performance.p95_response_time_ms,
        memory_usage_mb: health.infrastructure.performance.memory_usage_mb,
        cpu_usage_percent: health.infrastructure.performance.cpu_usage_percent,
        cache_hit_rate: health.infrastructure.cache.hit_rate_percent,
        uptime_percent: analytics.system_performance.uptime_percent,
        error_rate_percent: analytics.system_performance.error_rate_percent
      },
      consolidation: health.consolidation_stats,
      model: {
        accuracy: analytics.model_performance.ensemble_accuracy,
        predictions_today: analytics.model_performance.predictions_today,
        successful_predictions: analytics.model_performance.successful_predictions,
        trend: analytics.model_performance.accuracy_trend
      },
      users: {
        active_users: analytics.user_metrics.active_users,
        new_users_today: analytics.user_metrics.new_users_today,
        total_predictions_requested: analytics.user_metrics.total_predictions_requested
      }
    };
  }, [health, analytics, updateFromRaw]);

  return performanceMetrics;
}

export default {
  useHealthCheck,
  useAnalytics,
  usePredictions,
  useSportsData,
  useLiveOdds,
  useIntegrationStatus,
  useArbitrageOpportunities,
  usePortfolioOptimization,
  useSystemInfo,
  useCacheStats,
  useDomainStatus,
  usePerformanceMetrics
};
