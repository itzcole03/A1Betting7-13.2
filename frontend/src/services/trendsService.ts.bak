import { TrendLeaderboardFilters, TrendLeaderboardResponse, TrendStatsSummary, TrendCacheStatus, AvailableMetricsResponse } from '../types/trends';

interface CacheEntry {
  data: unknown;
  timestamp: number;
}

export interface TrendsApiClient {
  getTrendsLeaderboard(filters: TrendLeaderboardFilters): Promise<TrendLeaderboardResponse>;
  getTrendsSummary(): Promise<TrendStatsSummary>;
  getCacheStatus(): Promise<TrendCacheStatus>;
  clearCache(): Promise<{ success: boolean; message: string }>;
  getAvailableMetrics(): Promise<AvailableMetricsResponse>;
}

class TrendsService implements TrendsApiClient {
  private baseUrl: string;
  private cache: Map<string, CacheEntry> = new Map();
  private cacheTimeout = 5 * 60 * 1000; // 5 minutes

  constructor(baseUrl: string = '') {
    this.baseUrl = baseUrl;
  }

  private getCacheKey(filters: TrendLeaderboardFilters): string {
    return `trends_${filters.metric}_${filters.sport}_${filters.marketType}_${filters.minSamples}_${filters.periodDays}`;
  }

  private isCacheValid(cacheKey: string): boolean {
    const cached = this.cache.get(cacheKey);
    if (!cached) return false;
    
    const age = Date.now() - cached.timestamp;
    return age < this.cacheTimeout;
  }

  private async fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${this.baseUrl}${url}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  async getTrendsLeaderboard(filters: TrendLeaderboardFilters): Promise<TrendLeaderboardResponse> {
    const cacheKey = this.getCacheKey(filters);
    
    // Check cache first
    if (this.isCacheValid(cacheKey)) {
      return this.cache.get(cacheKey)!.data as TrendLeaderboardResponse;
    }

    // Build query parameters
    const params = new URLSearchParams({
      metric: filters.metric,
      sport: filters.sport,
      market_type: filters.marketType,
      min_samples: filters.minSamples.toString(),
      period_days: filters.periodDays.toString(),
      limit: filters.limit.toString(),
    });

    try {
      const data = await this.fetchJson<TrendLeaderboardResponse>(
        `/api/trends/props?${params.toString()}`
      );

      // Cache the response
      this.cache.set(cacheKey, {
        data,
        timestamp: Date.now(),
      });

      return data;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('[TrendsService] Error fetching trends leaderboard:', error);
      throw error;
    }
  }

  async getTrendsSummary(): Promise<TrendStatsSummary> {
    try {
      return await this.fetchJson<TrendStatsSummary>('/api/trends/summary');
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('[TrendsService] Error fetching trends summary:', error);
      throw error;
    }
  }

  async getCacheStatus(): Promise<TrendCacheStatus> {
    try {
      return await this.fetchJson<TrendCacheStatus>('/api/trends/cache/status');
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('[TrendsService] Error fetching cache status:', error);
      throw error;
    }
  }

  async clearCache(): Promise<{ success: boolean; message: string }> {
    try {
      const result = await this.fetchJson<{ success: boolean; message: string }>(
        '/api/trends/cache/clear',
        { method: 'POST' }
      );
      
      // Clear local cache as well
      this.cache.clear();
      
      return result;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('[TrendsService] Error clearing cache:', error);
      throw error;
    }
  }

  async getAvailableMetrics(): Promise<AvailableMetricsResponse> {
    try {
      return await this.fetchJson<AvailableMetricsResponse>('/api/trends/metrics/available');
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('[TrendsService] Error fetching available metrics:', error);
      throw error;
    }
  }

  // Local cache management
  clearLocalCache(): void {
    this.cache.clear();
  }

  getCacheInfo(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }
}

// Export singleton instance
export const trendsService = new TrendsService();
export default trendsService;