/**
 * Enhanced Cache Management Hook for PrizePicks
 * Provides intelligent caching, prediction comparison, and freshness monitoring
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  CachedPrediction,
  CacheMetrics,
  predictionCache,
  PredictionComparison,
  StorageUtils,
} from '../services/predictionCache';
import { PrizePicksProjection } from '../types/prizePicksUnified';

interface CacheManagerOptions {
  autoRefresh?: boolean;
  refreshInterval?: number;
  maxStaleness?: number;
  enableComparison?: boolean;
}

interface CacheManagerState {
  metrics: CacheMetrics;
  stalePredictions: string[];
  lastCleanup: Date;
  comparisonData: Map<string, PredictionComparison>;
}

export const _usePredictionCacheManager = (options: CacheManagerOptions = {}) => {
  const {
    autoRefresh = true,
    refreshInterval = 30000,
    maxStaleness = 2 * 60 * 1000,
    enableComparison = true,
  } = options;

  const [cacheState, setCacheState] = useState<CacheManagerState>({
    metrics: predictionCache.getCacheMetrics(),
    stalePredictions: [],
    lastCleanup: new Date(),
    comparisonData: new Map(),
  });

  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const _cleanupIntervalRef = useRef<NodeJS.Timeout>();
  const _refreshIntervalRef = useRef<NodeJS.Timeout>();

  /**
   * Store predictions with intelligent comparison
   */
  const _storePredictions = useCallback(
    (projections: PrizePicksProjection[]): PredictionComparison[] => {
      const _comparisons: PredictionComparison[] = [];

      for (const _projection of projections) {
        const _cachedPrediction: CachedPrediction = {
          id: projection.id,
          player_name: projection.player_name,
          stat_type: projection.stat_type,
          line: projection.line_score,
          prediction: projection.ml_prediction?.prediction || projection.line_score,
          confidence: projection.confidence,
          recommendation: getRecommendation(projection),
          timestamp: new Date().toISOString(),
          game_time: projection.start_time,
        };

        const _comparison = predictionCache.storePrediction(cachedPrediction);
        comparisons.push(comparison);

        if (enableComparison) {
          setCacheState(prev => ({
            ...prev,
            comparisonData: new Map(prev.comparisonData.set(projection.id, comparison)),
          }));
        }
      }

      updateCacheMetrics();
      return comparisons;
    },
    [enableComparison]
  );

  /**
   * Get cached prediction with freshness check
   */
  const _getCachedPrediction = useCallback(
    (player_name: string, stat_type: string, line: number): CachedPrediction | null => {
      return predictionCache.getCurrentPrediction(player_name, stat_type, line);
    },
    []
  );

  /**
   * Get prediction comparison data
   */
  const _getPredictionComparison = useCallback(
    (projection: PrizePicksProjection): PredictionComparison | null => {
      if (!enableComparison) return null;

      // First check in-memory comparison data
      const _cached = cacheState.comparisonData.get(projection.id);
      if (cached) return cached;

      // Fall back to cache service
      return predictionCache.getPredictionComparison(
        projection.player_name,
        projection.stat_type,
        projection.line_score
      );
    },
    [enableComparison, cacheState.comparisonData]
  );

  /**
   * Store AI explanation with caching
   */
  const _storeAiExplanation = useCallback((propId: string, explanation: unknown): void => {
    predictionCache.storeAiExplanation(propId, explanation);

    // Also store in localStorage for persistence
    StorageUtils.setWithExpiry(`ai_explanation_${propId}`, explanation, 10 * 60 * 1000);
  }, []);

  /**
   * Get AI explanation with cache fallback
   */
  const _getAiExplanation = useCallback((propId: string): unknown | null => {
    // First try memory cache
    const _explanation = predictionCache.getAiExplanation(propId);

    // Fall back to localStorage
    if (!explanation) {
      explanation = StorageUtils.getWithExpiry(`ai_explanation_${propId}`);
      if (explanation) {
        // Restore to memory cache
        predictionCache.storeAiExplanation(propId, explanation);
      }
    }

    return explanation;
  }, []);

  /**
   * Check if data needs refreshing
   */
  const _needsRefresh = useCallback(
    (projections: PrizePicksProjection[]): string[] => {
      const _staleIds: string[] = [];

      for (const _projection of projections) {
        const _cached = predictionCache.getCurrentPrediction(
          projection.player_name,
          projection.stat_type,
          projection.line_score
        );

        if (!cached) {
          staleIds.push(projection.id);
          continue;
        }

        const _age = Date.now() - new Date(cached.timestamp).getTime();
        if (age > maxStaleness) {
          staleIds.push(projection.id);
        }
      }

      return staleIds;
    },
    [maxStaleness]
  );

  /**
   * Force refresh of stale predictions
   */
  const _refreshStalePredictions = useCallback((): Promise<void> => {
    return new Promise(resolve => {
      setRefreshTrigger(prev => prev + 1);
      setTimeout(resolve, 100); // Small delay to ensure state update
    });
  }, []);

  /**
   * Update cache metrics
   */
  const _updateCacheMetrics = useCallback((): void => {
    const _metrics = predictionCache.getCacheMetrics();
    const _stalePredictions = predictionCache.getStaleRecommendations();

    setCacheState(prev => ({
      ...prev,
      metrics,
      stalePredictions,
    }));
  }, []);

  /**
   * Perform cache cleanup
   */
  const _performCleanup = useCallback((): number => {
    const _memoryCleanedCount = predictionCache.cleanExpiredEntries();
    const _storageCleanedCount = StorageUtils.cleanExpired();

    setCacheState(prev => ({
      ...prev,
      lastCleanup: new Date(),
    }));

    updateCacheMetrics();

    return memoryCleanedCount + storageCleanedCount;
  }, [updateCacheMetrics]);

  /**
   * Update prediction accuracy after actual game result
   */
  const _updateAccuracy = useCallback(
    (player_name: string, stat_type: string, line: number, actualResult: number): void => {
      predictionCache.updatePredictionAccuracy(player_name, stat_type, line, actualResult);
      updateCacheMetrics();
    },
    [updateCacheMetrics]
  );

  /**
   * Get accuracy trend for player/stat combination
   */
  const _getAccuracyTrend = useCallback((player_name: string, stat_type: string) => {
    return predictionCache.getAccuracyTrend(player_name, stat_type);
  }, []);

  /**
   * Get fresh high-confidence predictions
   */
  const _getFreshPredictions = useCallback((): string[] => {
    return predictionCache.getFreshPredictions();
  }, []);

  /**
   * Get enhanced projection with cache data
   */
  const _getEnhancedProjection = useCallback(
    (
      projection: PrizePicksProjection
    ): PrizePicksProjection & {
      cache_status: 'fresh' | 'stale' | 'missing';
      comparison?: PredictionComparison;
      freshness_score: number;
    } => {
      const _cached = getCachedPrediction(
        projection.player_name,
        projection.stat_type,
        projection.line_score
      );
      const _comparison = getPredictionComparison(projection);

      const _cache_status: 'fresh' | 'stale' | 'missing' = 'missing';
      const _freshness_score = 0;

      if (cached) {
        const _age = Date.now() - new Date(cached.timestamp).getTime();
        freshness_score = Math.max(0, 100 - (age / maxStaleness) * 100);

        if (age < maxStaleness / 2) {
          cache_status = 'fresh';
        } else if (age < maxStaleness) {
          cache_status = 'stale';
        }
      }

      return {
        ...projection,
        cache_status,
        comparison: comparison || undefined,
        freshness_score,
      };
    },
    [getCachedPrediction, getPredictionComparison, maxStaleness]
  );

  /**
   * Get cache health score
   */
  const _getCacheHealthScore = useCallback((): number => {
    const _metrics = cacheState.metrics;

    // Combine accuracy, hit rate, and freshness
    const accuracyScore = metrics.overall_accuracy || 0;
    const hitRateScore = metrics.cache_hit_rate || 0;
    const freshnessScore = 100 - (metrics.staleness_score || 0);

    return accuracyScore * 0.4 + hitRateScore * 0.3 + freshnessScore * 0.3;
  }, [cacheState.metrics]);

  // Setup automatic cleanup and refresh
  useEffect(() => {
    if (autoRefresh) {
      cleanupIntervalRef.current = setInterval(
        () => {
          performCleanup();
        },
        5 * 60 * 1000
      ); // Cleanup every 5 minutes

      refreshIntervalRef.current = setInterval(() => {
        updateCacheMetrics();
      }, refreshInterval);
    }

    return () => {
      if (cleanupIntervalRef.current) {
        clearInterval(cleanupIntervalRef.current);
      }
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [autoRefresh, refreshInterval, performCleanup, updateCacheMetrics]);

  // Initial metrics update
  useEffect(() => {
    updateCacheMetrics();
  }, [updateCacheMetrics]);

  return {
    // Core functions
    storePredictions,
    getCachedPrediction,
    getPredictionComparison,
    storeAiExplanation,
    getAiExplanation,

    // Enhancement functions
    needsRefresh,
    refreshStalePredictions,
    getEnhancedProjection,

    // Accuracy tracking
    updateAccuracy,
    getAccuracyTrend,
    getFreshPredictions,

    // Maintenance functions
    performCleanup,
    updateCacheMetrics,

    // State and metrics
    cacheState,
    refreshTrigger,
    getCacheHealthScore,

    // Storage utilities
    storageStats: StorageUtils.getStorageStats(),
  };
};

/**
 * Helper function to determine recommendation from projection
 */
function getRecommendation(_projection: PrizePicksProjection): string {
  if (!projection.ml_prediction) return 'HOLD';

  const _prediction = projection.ml_prediction.prediction;
  const _line = projection.line_score;
  const _confidence = projection.confidence;

  if (confidence < 70) return 'PASS';

  const _diff = Math.abs(prediction - line);
  const _threshold = line * 0.1; // 10% threshold

  if (diff < threshold) return 'PASS';

  return prediction > line ? 'OVER' : 'UNDER';
}
