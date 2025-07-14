/**
 * Enhanced Caching and Storage Service with Prediction Comparison
 * Maintains historical predictions and performs accuracy tracking
 */

export interface CachedPrediction {
  id: string;
  player_name: string;
  stat_type: string;
  line: number;
  prediction: number;
  confidence: number;
  recommendation: string;
  timestamp: string;
  game_time: string;
  accuracy_score?: number;
  historical_accuracy?: number;
}

export interface PredictionComparison {
  cached_prediction: CachedPrediction;
  previous_prediction?: CachedPrediction;
  accuracy_trend: 'improving' | 'declining' | 'stable' | 'new';
  confidence_change: number;
  prediction_change: number;
  recommendation_change: boolean;
  freshness_score: number;
  is_significant_change: boolean;
  change_reasons: string[];
  time_since_last_update: number;
}

export interface CacheMetrics {
  total_predictions: number;
  accurate_predictions: number;
  overall_accuracy: number;
  last_updated: string;
  cache_hit_rate: number;
  staleness_score: number;
}

class PredictionCacheService {
  private cache: Map<string, CachedPrediction[]> = new Map();
  private aiExplanationCache: Map<string, any> = new Map();
  private accuracyHistory: Map<string, number[]> = new Map();
  private cacheMetrics: CacheMetrics = {
    total_predictions: 0,
    accurate_predictions: 0,
    overall_accuracy: 0,
    last_updated: new Date().toISOString(),
    cache_hit_rate: 0,
    staleness_score: 0,
  };

  // Cache configuration
  private readonly MAX_CACHE_AGE = 5 * 60 * 1000; // 5 minutes
  private readonly MAX_HISTORY_LENGTH = 10;
  private readonly STALENESS_THRESHOLD = 2 * 60 * 1000; // 2 minutes
  private readonly AI_EXPLANATION_TTL = 10 * 60 * 1000; // 10 minutes

  /**
   * Store a new prediction and compare with previous ones
   */
  storePrediction(prediction: CachedPrediction): PredictionComparison {
    const key = this.generateKey(prediction.player_name, prediction.stat_type, prediction.line);
    const history = this.cache.get(key) || [];

    // Get the most recent prediction for comparison
    const previous = history.length > 0 ? history[history.length - 1] : undefined;

    // Add timestamp if not present
    prediction.timestamp = prediction.timestamp || new Date().toISOString();

    // Calculate accuracy score if we have historical data
    if (previous) {
      prediction.accuracy_score = this.calculateAccuracyScore(prediction, previous);
      prediction.historical_accuracy = this.getHistoricalAccuracy(key);
    }

    // Update history
    history.push(prediction);

    // Keep only recent predictions
    if (history.length > this.MAX_HISTORY_LENGTH) {
      history.splice(0, history.length - this.MAX_HISTORY_LENGTH);
    }

    this.cache.set(key, history);
    this.updateMetrics();

    // Generate comparison result
    return this.createComparison(prediction, previous, key);
  }

  /**
   * Get current prediction with freshness check
   */
  getCurrentPrediction(
    player_name: string,
    stat_type: string,
    line: number
  ): CachedPrediction | null {
    const key = this.generateKey(player_name, stat_type, line);
    const history = this.cache.get(key);

    if (!history || history.length === 0) {
      return null;
    }

    const latest = history[history.length - 1];
    const age = Date.now() - new Date(latest.timestamp).getTime();

    // Return null if too old
    if (age > this.MAX_CACHE_AGE) {
      return null;
    }

    return latest;
  }

  /**
   * Get prediction comparison for analysis
   */
  getPredictionComparison(
    player_name: string,
    stat_type: string,
    line: number
  ): PredictionComparison | null {
    const key = this.generateKey(player_name, stat_type, line);
    const history = this.cache.get(key);

    if (!history || history.length === 0) {
      return null;
    }

    const current = history[history.length - 1];
    const previous = history.length > 1 ? history[history.length - 2] : undefined;

    return this.createComparison(current, previous, key);
  }

  /**
   * Store AI explanation with TTL
   */
  storeAiExplanation(propId: string, explanation: any): void {
    const entry = {
      data: explanation,
      timestamp: Date.now(),
      ttl: this.AI_EXPLANATION_TTL,
    };
    this.aiExplanationCache.set(propId, entry);
  }

  /**
   * Get AI explanation if still fresh
   */
  getAiExplanation(propId: string): any | null {
    const entry = this.aiExplanationCache.get(propId);

    if (!entry) {
      return null;
    }

    const age = Date.now() - entry.timestamp;
    if (age > entry.ttl) {
      this.aiExplanationCache.delete(propId);
      return null;
    }

    return entry.data;
  }

  /**
   * Get recommendations that need refreshing
   */
  getStaleRecommendations(): string[] {
    const staleKeys: string[] = [];
    const now = Date.now();

    for (const [key, history] of this.cache.entries()) {
      if (history.length === 0) continue;

      const latest = history[history.length - 1];
      const age = now - new Date(latest.timestamp).getTime();

      if (age > this.STALENESS_THRESHOLD) {
        staleKeys.push(key);
      }
    }

    return staleKeys;
  }

  /**
   * Clean expired entries
   */
  cleanExpiredEntries(): number {
    let cleaned = 0;
    const now = Date.now();

    // Clean prediction cache
    for (const [key, history] of this.cache.entries()) {
      const filtered = history.filter(pred => {
        const age = now - new Date(pred.timestamp).getTime();
        return age <= this.MAX_CACHE_AGE * 2; // Keep double the max age for analysis
      });

      if (filtered.length !== history.length) {
        cleaned += history.length - filtered.length;
        if (filtered.length === 0) {
          this.cache.delete(key);
        } else {
          this.cache.set(key, filtered);
        }
      }
    }

    // Clean AI explanation cache
    for (const [key, entry] of this.aiExplanationCache.entries()) {
      const age = now - entry.timestamp;
      if (age > entry.ttl) {
        this.aiExplanationCache.delete(key);
        cleaned++;
      }
    }

    this.updateMetrics();
    return cleaned;
  }

  /**
   * Get cache metrics for monitoring
   */
  getCacheMetrics(): CacheMetrics {
    return { ...this.cacheMetrics };
  }

  /**
   * Generate cache key
   */
  private generateKey(player_name: string, stat_type: string, line: number): string {
    return `${player_name.toLowerCase().replace(/\s+/g, '_')}_${stat_type
      .toLowerCase()
      .replace(/\s+/g, '_')}_${line}`;
  }

  /**
   * Calculate accuracy score based on prediction vs actual performance
   */
  private calculateAccuracyScore(current: CachedPrediction, previous: CachedPrediction): number {
    // This is a simplified accuracy calculation
    // In a real implementation, you'd compare against actual game results
    const predictionDiff = Math.abs(current.prediction - previous.prediction);
    const confidenceFactor = (current.confidence + previous.confidence) / 200;

    // Lower difference and higher confidence = higher accuracy
    return Math.max(0, 100 - predictionDiff * 10) * confidenceFactor;
  }

  /**
   * Get historical accuracy for a prediction key
   */
  private getHistoricalAccuracy(key: string): number {
    const history = this.cache.get(key);
    if (!history || history.length === 0) return 0;

    const accuracyScores = history
      .filter(pred => pred.accuracy_score !== undefined)
      .map(pred => pred.accuracy_score!);

    if (accuracyScores.length === 0) return 0;

    return accuracyScores.reduce((sum, score) => sum + score, 0) / accuracyScores.length;
  }

  /**
   * Create enhanced comparison object
   */
  private createComparison(
    current: CachedPrediction,
    previous: CachedPrediction | undefined,
    key: string
  ): PredictionComparison {
    const now = Date.now();
    const currentTime = new Date(current.timestamp).getTime();
    const age = now - currentTime;
    const freshness_score = Math.max(0, 100 - (age / this.MAX_CACHE_AGE) * 100);

    if (!previous) {
      return {
        cached_prediction: current,
        previous_prediction: undefined,
        accuracy_trend: 'new',
        confidence_change: 0,
        prediction_change: 0,
        recommendation_change: false,
        freshness_score,
        is_significant_change: false,
        change_reasons: ['New prediction'],
        time_since_last_update: 0,
      };
    }

    const confidence_change = current.confidence - previous.confidence;
    const prediction_change = current.prediction - previous.prediction;
    const recommendation_change = current.recommendation !== previous.recommendation;
    const time_since_last_update = currentTime - new Date(previous.timestamp).getTime();

    // Determine if this is a significant change
    const is_significant_change =
      recommendation_change ||
      Math.abs(confidence_change) > 10 ||
      Math.abs(prediction_change) > current.line * 0.1; // 10% of line value

    // Generate change reasons
    const change_reasons: string[] = [];
    if (recommendation_change) change_reasons.push('Recommendation changed');
    if (Math.abs(confidence_change) > 10)
      change_reasons.push(
        `Confidence ${confidence_change > 0 ? 'increased' : 'decreased'} by ${Math.abs(
          confidence_change
        )}%`
      );
    if (Math.abs(prediction_change) > current.line * 0.05)
      change_reasons.push(`Prediction shifted by ${prediction_change.toFixed(2)}`);
    if (change_reasons.length === 0) change_reasons.push('Minor adjustments');

    let accuracy_trend: 'improving' | 'declining' | 'stable' = 'stable';
    if (current.accuracy_score && previous.accuracy_score) {
      const diff = current.accuracy_score - previous.accuracy_score;
      if (diff > 5) accuracy_trend = 'improving';
      else if (diff < -5) accuracy_trend = 'declining';
    }

    return {
      cached_prediction: current,
      previous_prediction: previous,
      accuracy_trend,
      confidence_change,
      prediction_change,
      recommendation_change,
      freshness_score,
      is_significant_change,
      change_reasons,
      time_since_last_update,
    };
  }

  /**
   * Update cache metrics
   */
  private updateMetrics(): void {
    let totalPredictions = 0;
    let accuratePredictions = 0;

    for (const history of this.cache.values()) {
      totalPredictions += history.length;
      accuratePredictions += history.filter(p => p.accuracy_score && p.accuracy_score > 70).length;
    }

    this.cacheMetrics = {
      total_predictions: totalPredictions,
      accurate_predictions: accuratePredictions,
      overall_accuracy: totalPredictions > 0 ? (accuratePredictions / totalPredictions) * 100 : 0,
      last_updated: new Date().toISOString(),
      cache_hit_rate: this.calculateHitRate(),
      staleness_score: this.calculateStalenessScore(),
    };
  }

  /**
   * Calculate cache hit rate
   */
  private calculateHitRate(): number {
    // Simplified hit rate calculation
    return Math.min(100, this.cache.size * 10);
  }

  /**
   * Calculate staleness score
   */
  private calculateStalenessScore(): number {
    const staleKeys = this.getStaleRecommendations();
    const totalKeys = this.cache.size;

    if (totalKeys === 0) return 0;

    return (staleKeys.length / totalKeys) * 100;
  }

  /**
   * Update prediction accuracy after game result
   */
  updatePredictionAccuracy(
    player_name: string,
    stat_type: string,
    line: number,
    actualResult: number
  ): void {
    const key = this.generateKey(player_name, stat_type, line);
    const history = this.cache.get(key);

    if (!history || history.length === 0) return;

    const latestPrediction = history[history.length - 1];
    const predictionDiff = Math.abs(latestPrediction.prediction - actualResult);
    const lineDiff = Math.abs(line - actualResult);

    // Calculate accuracy based on how close prediction was compared to the line
    let accuracy_score: number;
    if (predictionDiff < lineDiff) {
      accuracy_score = Math.max(70, 100 - (predictionDiff / line) * 50);
    } else {
      accuracy_score = Math.max(30, 70 - (predictionDiff / line) * 40);
    }

    // Update the prediction with accuracy score
    latestPrediction.accuracy_score = accuracy_score;

    // Track historical accuracy for this prop type
    const accuracyKey = `${player_name}_${stat_type}`;
    const accuracyHistory = this.accuracyHistory.get(accuracyKey) || [];
    accuracyHistory.push(accuracy_score);

    // Keep only last 10 results
    if (accuracyHistory.length > 10) {
      accuracyHistory.shift();
    }

    this.accuracyHistory.set(accuracyKey, accuracyHistory);
    latestPrediction.historical_accuracy =
      accuracyHistory.reduce((a, b) => a + b, 0) / accuracyHistory.length;

    this.updateMetrics();
  }

  /**
   * Get accuracy trends for a player/stat combination
   */
  getAccuracyTrend(
    player_name: string,
    stat_type: string
  ): {
    current: number;
    trend: 'improving' | 'declining' | 'stable';
    history: number[];
  } | null {
    const accuracyKey = `${player_name}_${stat_type}`;
    const history = this.accuracyHistory.get(accuracyKey);

    if (!history || history.length < 2) {
      return null;
    }

    const current = history[history.length - 1];
    const previous = history[history.length - 2];
    const trend =
      current > previous + 5 ? 'improving' : current < previous - 5 ? 'declining' : 'stable';

    return {
      current,
      trend,
      history: [...history],
    };
  }

  /**
   * Get fresh predictions that should be prioritized
   */
  getFreshPredictions(): string[] {
    const freshKeys: string[] = [];
    const now = Date.now();

    for (const [key, history] of this.cache.entries()) {
      if (history.length === 0) continue;

      const latest = history[history.length - 1];
      const age = now - new Date(latest.timestamp).getTime();

      // Consider fresh if less than 30 minutes old and high confidence
      if (age < 30 * 60 * 1000 && latest.confidence > 80) {
        freshKeys.push(key);
      }
    }

    return freshKeys;
  }
}

// Create singleton instance
export const predictionCache = new PredictionCacheService();

// Enhanced storage utility functions
export const StorageUtils = {
  /**
   * Store data with expiration
   */
  setWithExpiry: (key: string, value: any, ttlMs: number): void => {
    const now = Date.now();
    const item = {
      value,
      expiry: now + ttlMs,
      timestamp: now,
    };
    try {
      localStorage.setItem(key, JSON.stringify(item));
    } catch (error) {
      console.warn('Failed to store in localStorage:', error);
    }
  },

  /**
   * Get data with expiration check
   */
  getWithExpiry: (key: string): any | null => {
    try {
      const itemStr = localStorage.getItem(key);
      if (!itemStr) return null;

      const item = JSON.parse(itemStr);
      const now = Date.now();

      if (now > item.expiry) {
        localStorage.removeItem(key);
        return null;
      }

      return item.value;
    } catch (error) {
      console.warn('Failed to retrieve from localStorage:', error);
      return null;
    }
  },

  /**
   * Clean expired localStorage entries
   */
  cleanExpired: (): number => {
    let cleaned = 0;
    const keysToRemove: string[] = [];

    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!key) continue;

        const itemStr = localStorage.getItem(key);
        if (!itemStr) continue;

        try {
          const item = JSON.parse(itemStr);
          if (item.expiry && Date.now() > item.expiry) {
            keysToRemove.push(key);
          }
        } catch {
          // Skip invalid entries
        }
      }

      keysToRemove.forEach(key => {
        localStorage.removeItem(key);
        cleaned++;
      });
    } catch (error) {
      console.warn('Failed to clean localStorage:', error);
    }

    return cleaned;
  },

  /**
   * Get storage usage stats
   */
  getStorageStats: (): { used: number; total: number; percentage: number } => {
    try {
      let used = 0;
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          const value = localStorage.getItem(key);
          if (value) {
            used += key.length + value.length;
          }
        }
      }

      // Estimate total available (typically 5-10MB)
      const total = 5 * 1024 * 1024; // 5MB estimate

      return {
        used,
        total,
        percentage: (used / total) * 100,
      };
    } catch (error) {
      return { used: 0, total: 0, percentage: 0 };
    }
  },
};
