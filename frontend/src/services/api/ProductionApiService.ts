/**
 * Production-ready API service with comprehensive error handling, retries, and caching;
 */

interface ApiConfig {
  baseUrl: string;
  timeout: number;
  retries: number;
  retryDelay: number;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: number;
  cached?: boolean;
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

export class ProductionApiService {
  private config: ApiConfig;
  private cache = new Map<string, CacheEntry<any>>();
  private abortControllers = new Map<string, AbortController>();

  constructor(config: Partial<ApiConfig> = {}) {
    this.config = {
      baseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000',
      timeout: 30000,
      retries: 3,
      retryDelay: 1000,
      ...config,
    };
  }

  private generateCacheKey(endpoint: string, params?: Record<string, any>): string {
    return `${endpoint}:${JSON.stringify(params || {})}`;
  }

  private isValidCacheEntry<T>(entry: CacheEntry<T>): boolean {
    return Date.now() - entry.timestamp < entry.ttl;
  }

  private getFromCache<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (entry && this.isValidCacheEntry(entry)) {
      return entry.data;
    }
    if (entry) {
      this.cache.delete(key);
    }
    return null;
  }

  private setCache<T>(key: string, data: T, ttl: number = 300000): void {
    this.cache.set(key, { data, timestamp: Date.now(), ttl });
  }

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async fetchWithRetry<T>(
    url: string,
    options: RequestInit = {},
    retries: number = this.config.retries
  ): Promise<T> {
    let lastError: Error;
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const requestId = `${Date.now()}-${Math.random()}`;
        const controller = new AbortController();
        this.abortControllers.set(requestId, controller);
        const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);
        const response = await fetch(url, {
          ...options,
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
        this.abortControllers.delete(requestId);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        return (await response.json()) as T;
      } catch (error) {
        lastError = error as Error;
        if (attempt === retries) {
          break;
        }
        if (lastError.name !== 'AbortError') {
          await this.delay(this.config.retryDelay * Math.pow(2, attempt));
        }
      }
    }
    throw lastError!;
  }

  async get<T>(
    endpoint: string,
    params?: Record<string, any>,
    options: { cache?: boolean; cacheTtl?: number } = {}
  ): Promise<ApiResponse<T>> {
    try {
      const { cache = true, cacheTtl = 300000 } = options;
      // Construct URL
      const url = new URL(this.config.baseUrl + endpoint);
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          url.searchParams.append(key, String(value));
        });
      }
      // Generate cache key
      const cacheKey = this.generateCacheKey(endpoint, params);
      // Check cache first
      if (cache) {
        const cachedData = this.getFromCache<T>(cacheKey);
        if (cachedData) {
          return {
            success: true,
            data: cachedData,
            timestamp: Date.now(),
            cached: true,
          };
        }
      }
      // Fetch data
      const data = await this.fetchWithRetry<T>(url.toString(), {}, this.config.retries);
      // Cache successful responses
      if (cache) {
        this.setCache(cacheKey, data, cacheTtl);
      }
      return {
        success: true,
        data,
        timestamp: Date.now(),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: Date.now(),
      };
    }
  }

  async post<T>(
    endpoint: string,
    body?: any,
    headers?: Record<string, string>
  ): Promise<ApiResponse<T>> {
    try {
      const url = new URL(this.config.baseUrl + endpoint);
      const data = await this.fetchWithRetry<T>(
        url.toString(),
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(headers || {}),
          },
          body: body ? JSON.stringify(body) : undefined,
        },
        this.config.retries
      );
      return {
        success: true,
        data,
        timestamp: Date.now(),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: Date.now(),
      };
    }
  }

  async put<T>(
    endpoint: string,
    body?: any,
    headers?: Record<string, string>
  ): Promise<ApiResponse<T>> {
    try {
      const url = new URL(this.config.baseUrl + endpoint);
      const data = await this.fetchWithRetry<T>(
        url.toString(),
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            ...(headers || {}),
          },
          body: body ? JSON.stringify(body) : undefined,
        },
        this.config.retries
      );
      return {
        success: true,
        data,
        timestamp: Date.now(),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: Date.now(),
      };
    }
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    try {
      const url = new URL(this.config.baseUrl + endpoint);
      const data = await this.fetchWithRetry<T>(
        url.toString(),
        {
          method: 'DELETE',
        },
        this.config.retries
      );
      return {
        success: true,
        data,
        timestamp: Date.now(),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: Date.now(),
      };
    }
  }

  // Abort all pending requests;
  abortAllRequests(): void {
    this.abortControllers.forEach(controller => {
      controller.abort();
    });
    this.abortControllers.clear();
  }

  // Clear cache;
  clearCache(): void {
    this.cache.clear();
  }

  // Get cache stats;
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }

  // Health check endpoint;
  async healthCheck(): Promise<boolean> {
    try {
      // TODO: Implement actual health check logic
      return true;
    } catch {
      return false;
    }
  }
}

// Create singleton instance;
export const productionApiService = new ProductionApiService();

// Specific API endpoints with proper typing;
export interface User {
  id: string;
  name: string;
  email: string;
  tier: string;
  balance: number;
  winRate: number;
  totalProfit: number;
}

export interface Prediction {
  id: string;
  event: string;
  outcome: string;
  odds: number;
  confidence: number;
  edge: number;
  modelProb: number;
  commenceTime: string;
  sport: string;
  league: string;
}

export interface SystemHealth {
  status: 'online' | 'offline' | 'degraded';
  accuracy: number;
  activePredictions: number;
  uptime: number;
  lastUpdate: string;
}

// Typed API methods;
export const api = {
  // User endpoints;
  async getUser(userId: string): Promise<ApiResponse<User>> {
    return productionApiService.get<User>(`/users/${userId}`);
  },

  async updateUser(userId: string, userData: Partial<User>): Promise<ApiResponse<User>> {
    return productionApiService.put<User>(`/users/${userId}`, userData);
  },

  // Prediction endpoints;
  async getPredictions(sport?: string, league?: string): Promise<ApiResponse<Prediction[]>> {
    const params: Record<string, any> = {};
    if (sport) params.sport = sport;
    if (league) params.league = league;
    return productionApiService.get<Prediction[]>('/predictions', params);
  },

  async getPrediction(predictionId: string): Promise<ApiResponse<Prediction>> {
    return productionApiService.get<Prediction>(`/predictions/${predictionId}`);
  },

  // System health;
  async getSystemHealth(): Promise<ApiResponse<SystemHealth>> {
    return productionApiService.get<SystemHealth>('/health');
  },

  async getAccuracyMetrics(): Promise<
    ApiResponse<{ overall_accuracy: number; daily_accuracy: number }>
  > {
    return productionApiService.get('/metrics/accuracy');
  },

  async getUserAnalytics(userId: string): Promise<ApiResponse<{ yearly: Record<number, number> }>> {
    return productionApiService.get(`/analytics/users/${userId}`);
  },

  // Health check;
  async healthCheck(): Promise<boolean> {
    return productionApiService.healthCheck();
  },

  // PrizePicks specific endpoints;
  async getPrizePicksProps(params: {
    sport?: string;
    minConfidence?: number;
  }): Promise<ApiResponse<any[]>> {
    return productionApiService.get<any[]>('/api/prizepicks/props', params);
  },

  async getPrizePicksRecommendations(params: {
    sport?: string;
    strategy?: string;
    minConfidence?: number;
  }): Promise<ApiResponse<any[]>> {
    return productionApiService.get<any[]>('/api/prizepicks/recommendations', params);
  },

  // Money Maker Pro endpoints;
  async getBettingOpportunities(params?: {
    sport?: string;
    minEdge?: number;
  }): Promise<ApiResponse<any[]>> {
    return productionApiService.get<any[]>('/api/betting-opportunities', params);
  },

  async getArbitrageOpportunities(): Promise<ApiResponse<any[]>> {
    return productionApiService.get<any[]>('/api/arbitrage-opportunities');
  },

  async getPortfolioAnalysis(userId: string): Promise<ApiResponse<any>> {
    return productionApiService.get<any>(`/api/portfolio/${userId}/analysis`);
  },

  // PropOllama chat endpoint;
  async sendChatMessage(message: string, context?: any): Promise<ApiResponse<any>> {
    return productionApiService.post<any>('/api/propollama/chat', {
      message,
      //       context
    });
  },
};
