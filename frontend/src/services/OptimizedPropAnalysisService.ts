/**
 * Optimized Prop Analysis Service
 * High-performance frontend service with intelligent batching and caching
 */

import axios from 'axios';
import { EnhancedPropAnalysis } from './EnhancedPropAnalysisService';

interface OptimizedBatchRequest {
  requests: Array<{
    prop_id: string;
    player_name: string;
    stat_type: string;
    line: number;
    team: string;
    matchup: string;
    priority?: number;
  }>;
  use_cache?: boolean;
  warm_cache?: boolean;
}

interface BatchProcessingResult {
  successful: EnhancedPropAnalysis[];
  failed: Array<{ prop_id: string; error: string; type: string }>;
  performance: {
    total_processed: number;
    processing_time: number;
    cache_hit_rate: number;
    successful_count: number;
    failed_count: number;
  };
  optimization: {
    batch_size: number;
    cache_enabled: boolean;
    cache_warming: boolean;
  };
}

interface PerformanceMetrics {
  cache_metrics: {
    hit_rate: number;
    total_hits: number;
    total_misses: number;
    evictions: number;
    memory_usage: {
      current_size: number;
      max_size: number;
      utilization: number;
    };
  };
  processing_metrics: {
    total_batches: number;
    total_requests: number;
    avg_processing_time: number;
    avg_cache_hit_rate: number;
    error_rate: number;
  };
  optimization_stats: {
    service_initialized: boolean;
    optimized_service_available: boolean;
  };
  timestamp: string;
}

class OptimizedPropAnalysisService {
  private baseUrl: string;
  private requestQueue: OptimizedBatchRequest['requests'] = [];
  private batchTimer: NodeJS.Timeout | null = null;
  private readonly batchWindow = 200; // 200ms batch window
  private readonly maxBatchSize = 15;

  // Performance tracking
  private performanceStats = {
    totalRequests: 0,
    batchRequests: 0,
    avgBatchSize: 0,
    avgResponseTime: 0,
    cacheHitRate: 0,
    errorRate: 0,
  };

  constructor() {
    this.baseUrl = 'http://localhost:8000/api/v1/optimized';
  }

  /**
   * Get enhanced prop analysis with intelligent batching
   */
  async getEnhancedPropAnalysis(
    propId: string,
    playerName: string,
    statType: string,
    line: number,
    team: string,
    matchup: string,
    priority: number = 1
  ): Promise<EnhancedPropAnalysis | null> {
    return new Promise((resolve, reject) => {
      // Add to batch queue
      const request = {
        prop_id: propId,
        player_name: playerName,
        stat_type: statType,
        line,
        team,
        matchup,
        priority,
        resolve,
        reject,
      };

      this.requestQueue.push(request as any);
      this.performanceStats.totalRequests++;

      // Start batch timer if not already running
      if (!this.batchTimer) {
        this.batchTimer = setTimeout(() => {
          this.processBatch();
        }, this.batchWindow);
      }

      // Process immediately if batch is full
      if (this.requestQueue.length >= this.maxBatchSize) {
        this.processBatch();
      }
    });
  }

  /**
   * Process queued requests as an optimized batch
   */
  private async processBatch(): Promise<void> {
    if (this.requestQueue.length === 0) return;

    // Clear timer
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = null;
    }

    // Extract current batch
    const currentBatch = this.requestQueue.splice(0, this.maxBatchSize);
    const startTime = performance.now();

    try {
      console.log(`[OptimizedPropAnalysis] Processing batch of ${currentBatch.length} requests`);

      // Prepare batch request
      const batchRequest: OptimizedBatchRequest = {
        requests: currentBatch.map(req => ({
          prop_id: req.prop_id,
          player_name: req.player_name,
          stat_type: req.stat_type,
          line: req.line,
          team: req.team,
          matchup: req.matchup,
          priority: req.priority || 1,
        })),
        use_cache: true,
        warm_cache: true,
      };

      // Send batch request
      const response = await axios.post<BatchProcessingResult>(
        `${this.baseUrl}/batch-prop-analysis`,
        batchRequest,
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: 30000, // 30 second timeout for batch requests
        }
      );

      const result = response.data;
      const processingTime = performance.now() - startTime;

      // Update performance stats
      this.updatePerformanceStats(result, processingTime, currentBatch.length);

      // Resolve successful requests
      const successMap = new Map<string, EnhancedPropAnalysis>();
      result.successful.forEach(analysis => {
        successMap.set(analysis.prop_id, analysis);
      });

      // Resolve individual promises
      currentBatch.forEach(request => {
        const analysis = successMap.get(request.prop_id);
        if (analysis) {
          (request as any).resolve(analysis);
        } else {
          // Find error for this request
          const error = result.failed.find(f => f.prop_id === request.prop_id);
          (request as any).reject(new Error(error?.error || 'Analysis failed'));
        }
      });

      console.log(
        `[OptimizedPropAnalysis] Batch completed: ${result.successful.length} successful, ` +
          `${result.failed.length} failed, ${result.performance.processing_time.toFixed(2)}s, ` +
          `${(result.performance.cache_hit_rate * 100).toFixed(1)}% cache hit rate`
      );
    } catch (error) {
      console.error('[OptimizedPropAnalysis] Batch processing failed:', error);

      // Reject all requests in this batch
      currentBatch.forEach(request => {
        (request as any).reject(error);
      });
    }
  }

  /**
   * Get comprehensive player data with caching
   */
  async getOptimizedPlayerData(
    playerName: string,
    statTypes: string[] = ['hits', 'runs', 'home_runs'],
    forceRefresh: boolean = false
  ): Promise<any> {
    try {
      const params = new URLSearchParams();
      statTypes.forEach(statType => params.append('stat_types', statType));
      params.append('force_refresh', String(forceRefresh));

      const response = await axios.get(
        `${this.baseUrl}/player-data/${encodeURIComponent(playerName)}?${params}`,
        { timeout: 15000 }
      );

      return response.data;
    } catch (error) {
      console.error(`[OptimizedPropAnalysis] Error getting player data for ${playerName}:`, error);
      throw error;
    }
  }

  /**
   * Proactively warm cache for multiple players
   */
  async warmCache(
    playerNames: string[],
    statTypes: string[] = ['hits', 'runs', 'home_runs']
  ): Promise<void> {
    try {
      console.log(`[OptimizedPropAnalysis] Warming cache for ${playerNames.length} players`);

      await axios.post(
        `${this.baseUrl}/warm-cache`,
        { player_names: playerNames, stat_types: statTypes },
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: 60000, // 60 second timeout for cache warming
        }
      );

      console.log('[OptimizedPropAnalysis] Cache warming completed');
    } catch (error) {
      console.warn('[OptimizedPropAnalysis] Cache warming failed:', error);
      // Don't throw - cache warming is optimization, not critical
    }
  }

  /**
   * Get performance metrics for monitoring
   */
  async getPerformanceMetrics(): Promise<PerformanceMetrics> {
    try {
      const response = await axios.get<PerformanceMetrics>(`${this.baseUrl}/performance-metrics`, {
        timeout: 10000,
      });

      return response.data;
    } catch (error) {
      console.error('[OptimizedPropAnalysis] Error getting performance metrics:', error);
      throw error;
    }
  }

  /**
   * Get cache statistics for optimization insights
   */
  async getCacheStatistics(): Promise<any> {
    try {
      const response = await axios.get(`${this.baseUrl}/cache-stats`, { timeout: 10000 });

      return response.data;
    } catch (error) {
      console.error('[OptimizedPropAnalysis] Error getting cache statistics:', error);
      throw error;
    }
  }

  /**
   * Benchmark performance comparison
   */
  async benchmarkPerformance(
    playerNames: string[] = ['Aaron Judge', 'Mookie Betts', 'Shohei Ohtani'],
    statTypes: string[] = ['hits', 'runs', 'home_runs'],
    iterations: number = 3
  ): Promise<any> {
    try {
      console.log('[OptimizedPropAnalysis] Starting performance benchmark...');

      const params = new URLSearchParams();
      playerNames.forEach(name => params.append('player_names', name));
      statTypes.forEach(type => params.append('stat_types', type));
      params.append('iterations', String(iterations));

      const response = await axios.post(
        `${this.baseUrl}/benchmark-performance?${params}`,
        {},
        { timeout: 120000 } // 2 minute timeout for benchmarks
      );

      console.log('[OptimizedPropAnalysis] Benchmark completed:', response.data.summary);
      return response.data;
    } catch (error) {
      console.error('[OptimizedPropAnalysis] Benchmark failed:', error);
      throw error;
    }
  }

  /**
   * Update performance statistics
   */
  private updatePerformanceStats(
    result: BatchProcessingResult,
    processingTime: number,
    batchSize: number
  ): void {
    this.performanceStats.batchRequests++;

    // Update running averages
    const totalBatches = this.performanceStats.batchRequests;

    this.performanceStats.avgBatchSize =
      (this.performanceStats.avgBatchSize * (totalBatches - 1) + batchSize) / totalBatches;

    this.performanceStats.avgResponseTime =
      (this.performanceStats.avgResponseTime * (totalBatches - 1) + processingTime) / totalBatches;

    this.performanceStats.cacheHitRate =
      (this.performanceStats.cacheHitRate * (totalBatches - 1) +
        result.performance.cache_hit_rate) /
      totalBatches;

    const errorRate = result.failed.length / Math.max(1, result.performance.total_processed);
    this.performanceStats.errorRate =
      (this.performanceStats.errorRate * (totalBatches - 1) + errorRate) / totalBatches;
  }

  /**
   * Get current performance statistics
   */
  getClientPerformanceStats() {
    return {
      ...this.performanceStats,
      queueSize: this.requestQueue.length,
      batchTimerActive: this.batchTimer !== null,
    };
  }

  /**
   * Clear request queue (for testing/debugging)
   */
  clearQueue(): void {
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = null;
    }

    // Reject all pending requests
    this.requestQueue.forEach(request => {
      (request as any).reject(new Error('Queue cleared'));
    });

    this.requestQueue = [];
  }

  /**
   * Force immediate processing of current queue
   */
  async flushQueue(): Promise<void> {
    if (this.requestQueue.length > 0) {
      await this.processBatch();
    }
  }
}

// Export singleton instance
export const optimizedPropAnalysisService = new OptimizedPropAnalysisService();
export default optimizedPropAnalysisService;
