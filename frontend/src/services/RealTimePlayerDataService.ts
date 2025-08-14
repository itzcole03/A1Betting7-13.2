/**
 * Real-Time Player Data Service
 * Implements optimizations from A1Betting Real-Time Data Analysis
 * 
 * Key Features:
 * - WebSocket-based real-time updates
 * - Intelligent caching with cache invalidation
 * - Rate limiting and API call optimization
 * - Circuit breaker pattern for resilience
 * - Data quality validation and normalization
 */

import { WS_URL } from '../config/apiConfig';

import { Player } from '../components/player/PlayerDashboardContainer';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  quality: 'high' | 'medium' | 'low';
}

interface APIHealthMetrics {
  responseTime: number;
  successRate: number;
  lastError?: string;
  consecutiveFailures: number;
}

interface RealTimeUpdate {
  type: 'player_stats' | 'injury_update' | 'lineup_change' | 'trade';
  playerId: string;
  data: any;
  timestamp: number;
  source: string;
}

export class RealTimePlayerDataService {
  private static instance: RealTimePlayerDataService;
  private cache = new Map<string, CacheEntry<any>>();
  private websocket: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private healthMetrics = new Map<string, APIHealthMetrics>();
  private circuitBreakers = new Map<string, { isOpen: boolean; lastFailure: number; failures: number }>();
  private subscribers = new Map<string, Set<(data: any) => void>>();
  
  // Configuration based on analysis recommendations
  private readonly config = {
    cacheTTL: {
      playerProfile: 5 * 60 * 1000, // 5 minutes
      recentStats: 2 * 60 * 1000,   // 2 minutes  
      liveData: 30 * 1000,          // 30 seconds
      searchResults: 10 * 60 * 1000  // 10 minutes
    },
    apiTimeout: 5000,
    circuitBreakerThreshold: 5,
    circuitBreakerResetTime: 60000,
    websocketReconnectDelay: 1000,
    maxConcurrentRequests: 10,
    rateLimitWindow: 60000, // 1 minute
    rateLimitMaxRequests: 100
  };

  private pendingRequests = new Map<string, Promise<any>>();
  private requestQueue: Array<() => Promise<any>> = [];
  private activeRequests = 0;
  private rateLimitWindow = new Map<string, { count: number; resetTime: number }>();

  public static getInstance(): RealTimePlayerDataService {
    if (!RealTimePlayerDataService.instance) {
      RealTimePlayerDataService.instance = new RealTimePlayerDataService();
    }
    return RealTimePlayerDataService.instance;
  }

  private constructor() {
    this.initializeWebSocket();
    this.startCacheCleanup();
    this.startHealthMonitoring();
  }

  /**
   * WebSocket initialization with auto-reconnect
   * Addresses analysis finding: "Incomplete WebSocket implementation"
   */
  private initializeWebSocket(): void {
    try {
      const wsUrl = WS_URL + '/ws/player-data';
      this.websocket = new WebSocket(wsUrl);

      this.websocket.onopen = () => {
        console.log('[RealTimePlayerData] WebSocket connected');
        this.reconnectAttempts = 0;
      };

      this.websocket.onmessage = (event) => {
        try {
          const update: RealTimeUpdate = JSON.parse(event.data);
          this.handleRealTimeUpdate(update);
        } catch (error) {
          console.error('[RealTimePlayerData] Failed to parse WebSocket message:', error);
        }
      };

      this.websocket.onclose = () => {
        console.log('[RealTimePlayerData] WebSocket disconnected');
        this.scheduleReconnect();
      };

      this.websocket.onerror = (error) => {
        console.warn('[RealTimePlayerData] WebSocket error (non-critical):', error);
        // Don't throw error - WebSocket is optional enhancement
      };

    } catch (error) {
      console.error('[RealTimePlayerData] Failed to initialize WebSocket:', error);
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = this.config.websocketReconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
      
      setTimeout(() => {
        console.log(`[RealTimePlayerData] Attempting WebSocket reconnection (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
        this.initializeWebSocket();
      }, delay);
    }
  }

  /**
   * Handle real-time updates from WebSocket
   */
  private handleRealTimeUpdate(update: RealTimeUpdate): void {
    // Invalidate relevant cache entries
    const cacheKeysToInvalidate = this.getCacheKeysForPlayer(update.playerId);
    cacheKeysToInvalidate.forEach(key => this.cache.delete(key));

    // Notify subscribers
    const subscribers = this.subscribers.get(update.playerId);
    if (subscribers) {
      subscribers.forEach(callback => {
        try {
          callback(update);
        } catch (error) {
          console.error('[RealTimePlayerData] Error in subscriber callback:', error);
        }
      });
    }

    // Update cache with new data if applicable
    if (update.type === 'player_stats') {
      this.updatePlayerStatsCache(update.playerId, update.data);
    }
  }

  private getCacheKeysForPlayer(playerId: string): string[] {
    return Array.from(this.cache.keys()).filter(key => key.includes(playerId));
  }

  /**
   * Subscribe to real-time updates for a specific player
   */
  public subscribeToPlayer(playerId: string, callback: (data: any) => void): () => void {
    if (!this.subscribers.has(playerId)) {
      this.subscribers.set(playerId, new Set());
    }
    
    this.subscribers.get(playerId)!.add(callback);

    // Return unsubscribe function
    return () => {
      const playerSubscribers = this.subscribers.get(playerId);
      if (playerSubscribers) {
        playerSubscribers.delete(callback);
        if (playerSubscribers.size === 0) {
          this.subscribers.delete(playerId);
        }
      }
    };
  }

  /**
   * Get player data with intelligent caching and real-time updates
   * Addresses analysis finding: "Data aggregation and normalization latency"
   */
  public async getPlayerData(playerId: string, sport: string = 'MLB'): Promise<Player | null> {
    const cacheKey = `player:${playerId}:${sport}`;
    
    // Check cache first
    const cached = this.getCachedData<Player>(cacheKey);
    if (cached && this.isCacheValid(cached, this.config.cacheTTL.playerProfile)) {
      return cached.data;
    }

    // Check if request is already pending (deduplication)
    if (this.pendingRequests.has(cacheKey)) {
      return this.pendingRequests.get(cacheKey);
    }

    // Create new request with circuit breaker protection
    const request = this.executeWithCircuitBreaker(`player-api-${sport}`, async () => {
      return this.fetchPlayerDataFromAPI(playerId, sport);
    });

    this.pendingRequests.set(cacheKey, request);

    try {
      const player = await request;
      
      // Cache the result
      if (player) {
        this.setCachedData(cacheKey, player, this.config.cacheTTL.playerProfile, 'high');
      }

      return player;
    } catch (error) {
      console.error(`[RealTimePlayerData] Failed to get player data for ${playerId}:`, error);
      
      // Return stale cache data if available
      if (cached) {
        console.log('[RealTimePlayerData] Returning stale cache data due to API failure');
        return cached.data;
      }
      
      return null;
    } finally {
      this.pendingRequests.delete(cacheKey);
    }
  }

  /**
   * Search players with optimized rate limiting and caching
   * Addresses analysis finding: "API call management and rate limiting issues"
   */
  public async searchPlayers(query: string, sport: string = 'MLB', limit: number = 10): Promise<Player[]> {
    if (query.length < 2) return [];

    const cacheKey = `search:${query.toLowerCase()}:${sport}:${limit}`;
    
    // Check cache first
    const cached = this.getCachedData<Player[]>(cacheKey);
    if (cached && this.isCacheValid(cached, this.config.cacheTTL.searchResults)) {
      return cached.data;
    }

    // Rate limiting check
    if (!this.checkRateLimit('search')) {
      console.warn('[RealTimePlayerData] Search rate limit exceeded');
      return cached?.data || [];
    }

    try {
      const results = await this.executeWithCircuitBreaker(`search-api-${sport}`, async () => {
        return this.fetchSearchResultsFromAPI(query, sport, limit);
      });

      // Cache results
      this.setCachedData(cacheKey, results, this.config.cacheTTL.searchResults, 'medium');
      
      return results;
    } catch (error) {
      console.error('[RealTimePlayerData] Search failed:', error);
      return cached?.data || [];
    }
  }

  /**
   * Circuit breaker pattern implementation
   * Addresses analysis finding: "Insufficient error handling and resilience mechanisms"
   */
  private async executeWithCircuitBreaker<T>(
    serviceName: string, 
    operation: () => Promise<T>
  ): Promise<T> {
    const breaker = this.circuitBreakers.get(serviceName) || {
      isOpen: false,
      lastFailure: 0,
      failures: 0
    };

    // Check if circuit breaker is open
    if (breaker.isOpen) {
      const timeSinceFailure = Date.now() - breaker.lastFailure;
      if (timeSinceFailure < this.config.circuitBreakerResetTime) {
        throw new Error(`Circuit breaker open for ${serviceName}`);
      } else {
        // Half-open state - allow one request
        breaker.isOpen = false;
        breaker.failures = 0;
      }
    }

    try {
      const startTime = Date.now();
      const result = await Promise.race([
        operation(),
        this.timeoutPromise(this.config.apiTimeout)
      ]);
      
      // Success - reset failure count
      breaker.failures = 0;
      this.circuitBreakers.set(serviceName, breaker);
      
      // Update health metrics
      this.updateHealthMetrics(serviceName, Date.now() - startTime, true);
      
      return result;
    } catch (error) {
      // Failure - increment failure count
      breaker.failures++;
      breaker.lastFailure = Date.now();
      
      if (breaker.failures >= this.config.circuitBreakerThreshold) {
        breaker.isOpen = true;
        console.warn(`[RealTimePlayerData] Circuit breaker opened for ${serviceName}`);
      }
      
      this.circuitBreakers.set(serviceName, breaker);
      this.updateHealthMetrics(serviceName, this.config.apiTimeout, false, error.message);
      
      throw error;
    }
  }

  /**
   * Rate limiting implementation
   */
  private checkRateLimit(operation: string): boolean {
    const now = Date.now();
    const window = this.rateLimitWindow.get(operation);
    
    if (!window || now > window.resetTime) {
      this.rateLimitWindow.set(operation, {
        count: 1,
        resetTime: now + this.config.rateLimitWindow
      });
      return true;
    }
    
    if (window.count >= this.config.rateLimitMaxRequests) {
      return false;
    }
    
    window.count++;
    return true;
  }

  /**
   * Fetch player data from API with data quality validation
   */
  private async fetchPlayerDataFromAPI(playerId: string, sport: string): Promise<Player | null> {
    const apiUrl = `/api/v2/players/${playerId}/dashboard`;
    
    const response = await fetch(apiUrl, {
      signal: AbortSignal.timeout(this.config.apiTimeout)
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    const data = await response.json();
    
    // Data quality validation
    const validatedPlayer = this.validateAndNormalizePlayerData(data);
    return validatedPlayer;
  }

  /**
   * Data quality validation and normalization
   * Addresses analysis finding: "Data quality and validation gaps"
   */
  private validateAndNormalizePlayerData(data: any): Player | null {
    try {
      // Basic validation
      if (!data.id || !data.name) {
        console.warn('[RealTimePlayerData] Invalid player data - missing required fields');
        return null;
      }

      // Normalize data structure
      const player: Player = {
        id: data.id,
        name: data.name,
        team: data.team || 'Unknown',
        position: data.position || 'Unknown',
        sport: data.sport || 'MLB',
        active: data.active !== false,
        injury_status: data.injury_status || undefined,
        
        season_stats: {
          hits: this.normalizeNumeric(data.season_stats?.hits, 0),
          home_runs: this.normalizeNumeric(data.season_stats?.home_runs, 0),
          rbis: this.normalizeNumeric(data.season_stats?.rbis, 0),
          batting_average: this.normalizeNumeric(data.season_stats?.batting_average, 0, 0, 1),
          on_base_percentage: this.normalizeNumeric(data.season_stats?.on_base_percentage, 0, 0, 1),
          slugging_percentage: this.normalizeNumeric(data.season_stats?.slugging_percentage, 0, 0, 1),
          ops: this.normalizeNumeric(data.season_stats?.ops, 0, 0, 3),
          strikeouts: this.normalizeNumeric(data.season_stats?.strikeouts, 0),
          walks: this.normalizeNumeric(data.season_stats?.walks, 0),
          games_played: this.normalizeNumeric(data.season_stats?.games_played, 0, 0, 162),
          plate_appearances: this.normalizeNumeric(data.season_stats?.plate_appearances, 0),
          at_bats: this.normalizeNumeric(data.season_stats?.at_bats, 0),
          runs: this.normalizeNumeric(data.season_stats?.runs, 0),
          doubles: this.normalizeNumeric(data.season_stats?.doubles, 0),
          triples: this.normalizeNumeric(data.season_stats?.triples, 0),
          stolen_bases: this.normalizeNumeric(data.season_stats?.stolen_bases, 0),
          war: this.normalizeNumeric(data.season_stats?.war),
          babip: this.normalizeNumeric(data.season_stats?.babip, undefined, 0, 1),
          wrc_plus: this.normalizeNumeric(data.season_stats?.wrc_plus),
          barrel_rate: this.normalizeNumeric(data.season_stats?.barrel_rate),
          hard_hit_rate: this.normalizeNumeric(data.season_stats?.hard_hit_rate),
          exit_velocity: this.normalizeNumeric(data.season_stats?.exit_velocity),
          launch_angle: this.normalizeNumeric(data.season_stats?.launch_angle)
        },

        recent_games: this.normalizeGameData(data.recent_games),
        last_30_games: this.normalizeGameData(data.last_30_games),
        
        performance_trends: data.performance_trends || {
          last_7_days: {},
          last_30_days: {},
          home_vs_away: { home: {}, away: {} },
          vs_lefties: {},
          vs_righties: {}
        },

        advanced_metrics: {
          consistency_score: this.normalizeNumeric(data.advanced_metrics?.consistency_score, 50, 0, 100),
          clutch_performance: this.normalizeNumeric(data.advanced_metrics?.clutch_performance, 50, 0, 100),
          injury_risk: this.normalizeNumeric(data.advanced_metrics?.injury_risk, 20, 0, 100),
          hot_streak: data.advanced_metrics?.hot_streak || false,
          cold_streak: data.advanced_metrics?.cold_streak || false,
          breakout_candidate: data.advanced_metrics?.breakout_candidate || false
        },

        projections: data.projections || {
          next_game: {},
          rest_of_season: {},
          confidence_intervals: { low: {}, high: {} }
        }
      };

      return player;
    } catch (error) {
      console.error('[RealTimePlayerData] Data validation failed:', error);
      return null;
    }
  }

  private normalizeNumeric(value: any, defaultValue?: number, min?: number, max?: number): number | undefined {
    if (value === null || value === undefined || value === '') {
      return defaultValue;
    }
    
    const num = typeof value === 'number' ? value : parseFloat(value);
    if (isNaN(num)) {
      return defaultValue;
    }
    
    if (min !== undefined && num < min) return min;
    if (max !== undefined && num > max) return max;
    
    return num;
  }

  private normalizeGameData(games: any[]): any[] {
    if (!Array.isArray(games)) return [];
    
    return games.map(game => ({
      date: game.date || new Date().toISOString(),
      opponent: game.opponent || 'Unknown',
      home: game.home || false,
      result: game.result || 'Unknown',
      stats: game.stats || {},
      game_score: this.normalizeNumeric(game.game_score),
      weather: game.weather
    }));
  }

  /**
   * Search API implementation
   */
  private async fetchSearchResultsFromAPI(query: string, sport: string, limit: number): Promise<Player[]> {
    const apiUrl = `/api/v2/players/search?q=${encodeURIComponent(query)}&sport=${sport}&limit=${limit}`;
    
    const response = await fetch(apiUrl, {
      signal: AbortSignal.timeout(this.config.apiTimeout)
    });

    if (!response.ok) {
      throw new Error(`Search API request failed: ${response.status}`);
    }

    const data = await response.json();
    
    if (!Array.isArray(data)) {
      console.warn('[RealTimePlayerData] Invalid search response format');
      return [];
    }

    return data.map(item => this.validateAndNormalizePlayerData(item)).filter(Boolean) as Player[];
  }

  // Cache management methods
  private getCachedData<T>(key: string): CacheEntry<T> | null {
    return this.cache.get(key) || null;
  }

  private setCachedData<T>(key: string, data: T, ttl: number, quality: 'high' | 'medium' | 'low'): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
      quality
    });
  }

  private isCacheValid(entry: CacheEntry<any>, maxAge: number): boolean {
    return Date.now() - entry.timestamp < Math.min(entry.ttl, maxAge);
  }

  private updatePlayerStatsCache(playerId: string, newStats: any): void {
    // Find and update relevant cache entries
    for (const [key, entry] of this.cache.entries()) {
      if (key.includes(playerId) && key.startsWith('player:')) {
        const player = entry.data as Player;
        if (player && newStats) {
          // Update specific stats
          Object.assign(player.season_stats, newStats);
          entry.timestamp = Date.now();
        }
      }
    }
  }

  // Utility methods
  private timeoutPromise(ms: number): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Request timeout')), ms);
    });
  }

  private updateHealthMetrics(serviceName: string, responseTime: number, success: boolean, error?: string): void {
    const current = this.healthMetrics.get(serviceName) || {
      responseTime: 0,
      successRate: 1,
      consecutiveFailures: 0
    };

    // Update response time (moving average)
    current.responseTime = (current.responseTime * 0.8) + (responseTime * 0.2);
    
    // Update success rate (moving average)
    current.successRate = (current.successRate * 0.9) + (success ? 1 : 0) * 0.1;
    
    // Update consecutive failures
    if (success) {
      current.consecutiveFailures = 0;
    } else {
      current.consecutiveFailures++;
      current.lastError = error;
    }

    this.healthMetrics.set(serviceName, current);
  }

  // Background tasks
  private startCacheCleanup(): void {
    setInterval(() => {
      const now = Date.now();
      for (const [key, entry] of this.cache.entries()) {
        if (now - entry.timestamp > entry.ttl) {
          this.cache.delete(key);
        }
      }
    }, 60000); // Cleanup every minute
  }

  private startHealthMonitoring(): void {
    setInterval(() => {
      // Log health metrics for monitoring
      for (const [service, metrics] of this.healthMetrics.entries()) {
        if (metrics.consecutiveFailures > 3) {
          console.warn(`[RealTimePlayerData] Service ${service} health degraded:`, metrics);
        }
      }
    }, 30000); // Check every 30 seconds
  }

  /**
   * Get service health metrics
   */
  public getHealthMetrics(): Map<string, APIHealthMetrics> {
    return new Map(this.healthMetrics);
  }

  /**
   * Force cache refresh for a player
   */
  public async refreshPlayerData(playerId: string, sport: string = 'MLB'): Promise<Player | null> {
    const cacheKey = `player:${playerId}:${sport}`;
    this.cache.delete(cacheKey);
    return this.getPlayerData(playerId, sport);
  }

  /**
   * Clear all cached data
   */
  public clearCache(): void {
    this.cache.clear();
    console.log('[RealTimePlayerData] Cache cleared');
  }

  /**
   * Cleanup resources
   */
  public dispose(): void {
    if (this.websocket) {
      this.websocket.close();
      this.websocket = null;
    }
    this.cache.clear();
    this.subscribers.clear();
    this.pendingRequests.clear();
  }
}

export const realTimePlayerDataService = RealTimePlayerDataService.getInstance();
