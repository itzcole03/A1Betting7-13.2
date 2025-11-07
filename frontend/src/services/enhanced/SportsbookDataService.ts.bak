/**
 * Enhanced Sportsbook Data Service
 *
 * Frontend service for integrating with multiple sportsbook APIs:
 * - DraftKings, BetMGM, Caesars integration
 * - Unified odds comparison
 * - Arbitrage opportunity detection
 * - Real-time line tracking
 * - Performance monitoring
 */

import { CacheCategory, getCacheManager } from '../ConsolidatedCacheManager';

// Types and Interfaces
export interface SportsbookOdds {
  provider: string;
  eventId: string;
  marketId: string;
  playerName: string;
  team: string;
  opponent: string;
  league: string;
  sport: string;
  marketType: 'player_props' | 'game_lines';
  betType: string;
  line: number;
  odds: number; // American odds
  decimalOdds: number;
  side: 'over' | 'under' | 'home' | 'away';
  timestamp: string;
  gameTime: string;
  status: 'active' | 'suspended' | 'settled';
  confidenceScore: number;
}

export interface BestOdds {
  playerName: string;
  betType: string;
  line: number;

  // Best Over odds
  bestOverOdds: number;
  bestOverProvider: string;
  bestOverDecimal: number;

  // Best Under odds
  bestUnderOdds: number;
  bestUnderProvider: string;
  bestUnderDecimal: number;

  // Market analysis
  totalBooks: number;
  lineConsensus: number;
  sharpMove: boolean;
  arbitrageOpportunity: boolean;
  arbitrageProfit: number;

  allOdds: SportsbookOdds[];
}

export interface ArbitrageOpportunity {
  playerName: string;
  betType: string;
  line: number;

  // Over side
  overOdds: number;
  overProvider: string;
  overStakePercentage: number;

  // Under side
  underOdds: number;
  underProvider: string;
  underStakePercentage: number;

  // Profit calculation
  guaranteedProfitPercentage: number;
  minimumBetAmount: number;
  expectedReturn: number;

  confidenceLevel: 'high' | 'medium' | 'low';
  timeSensitivity: 'urgent' | 'moderate' | 'stable';
}

export interface SportsbookPerformance {
  providers: Record<
    string,
    {
      requests: number;
      successes: number;
      failures: number;
      avgResponseTime: number;
      lastSuccess: string | null;
      reliabilityScore: number;
    }
  >;
  summary: {
    totalProviders: number;
    healthyProviders: number;
    avgReliability: number;
    fastestProvider: string;
  };
}

export interface LineMovement {
  timestamp: string;
  line: number;
  odds: number;
  provider: string;
  volume?: number;
}

export interface SportsbookFilters {
  sport?: string;
  league?: string;
  playerName?: string;
  betType?: string;
  minOdds?: number;
  maxOdds?: number;
  providers?: string[];
  onlyArbitrage?: boolean;
}

export class SportsbookDataService {
  private baseUrl: string;
  private cache = getCacheManager();
  private wsConnection: WebSocket | null = null;
  private lineMovementHistory: Map<string, LineMovement[]> = new Map();
  // optional injected deps for testability
  private apiClient: any | undefined;
  private errorService: any | undefined;
  private websocketStore: any | undefined;
  private realtimeSubscriptions: Set<string> = new Set();
  private enableRealtimeFlag = false;
  private inFlight: Map<string, Promise<any>> = new Map();

  constructor(opts?: {
    apiClient?: any;
    cache?: any;
    errorService?: any;
    websocketStore?: any;
    enableRealtime?: boolean;
  }) {
    this.baseUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000';
    if (opts?.cache) this.cache = opts.cache;
    if (opts?.apiClient) this.apiClient = opts.apiClient;
    if (opts?.errorService) this.errorService = opts.errorService;
    if (opts?.websocketStore) this.websocketStore = opts.websocketStore;
    this.enableRealtimeFlag = !!opts?.enableRealtime;

    // If a websocketStore is provided (tests), do not create a real WebSocket connection.
    if (!this.websocketStore && this.enableRealtimeFlag) {
      this.initializeWebSocket();
    }
  }

  /**
   * Initialize WebSocket connection for real-time odds updates
   */
  private initializeWebSocket() {
    const wsUrl = `${this.baseUrl.replace('http', 'ws')}/ws/sportsbook`;

    try {
      this.wsConnection = new WebSocket(wsUrl);

      this.wsConnection.onopen = () => {
        console.log('Sportsbook WebSocket connected');
      };

      this.wsConnection.onmessage = event => {
        try {
          const data = JSON.parse(event.data);
          this.handleRealtimeUpdate(data);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      this.wsConnection.onclose = () => {
        console.log('Sportsbook WebSocket disconnected, attempting reconnect...');
        setTimeout(() => this.initializeWebSocket(), 5000);
      };
    } catch (error) {
      console.error('WebSocket initialization failed:', error);
    }
  }

  /**
   * Handle real-time odds updates from WebSocket
   */
  private handleRealtimeUpdate(data: any) {
    if (data.type === 'odds_update') {
      // Invalidate relevant cache
      this.cache.invalidatePattern(CacheCategory.REAL_TIME, /sportsbook_odds/);

      // Store line movement
      const key = `${data.playerName}_${data.betType}_${data.line}`;
      if (!this.lineMovementHistory.has(key)) {
        this.lineMovementHistory.set(key, []);
      }

      this.lineMovementHistory.get(key)!.push({
        timestamp: new Date().toISOString(),
        line: data.line,
        odds: data.odds,
        provider: data.provider,
        volume: data.volume,
      });

      // Keep only last 100 movements per market
      const history = this.lineMovementHistory.get(key)!;
      if (history.length > 100) {
        this.lineMovementHistory.set(key, history.slice(-100));
      }
    }
  }

  // Cache compatibility helpers: support both consolidated cache manager (category, key)
  // and simple MockCache (key) used in tests.
  private readCache(cacheKey: string) {
    // Prefer simple single-arg get(key) used in tests/mocks; fallback to (category, key)
    try {
      const val = (this.cache as any).get(cacheKey);
      if (val !== undefined) return val;
    } catch (_) {}
    try {
      const maybe = (this.cache as any).get(CacheCategory.REAL_TIME, cacheKey);
      if (maybe !== undefined) return maybe;
    } catch (_) {}
    return null;
  }

  private writeCache(cacheKey: string, value: any, ttl?: number) {
    // Prefer simple single-arg set(key, value, ttl) used in tests/mocks; fallback to (category, key, value, ttl)
    try {
      (this.cache as any).set(cacheKey, value, ttl);
      return;
    } catch (_) {}
    try {
      (this.cache as any).set(CacheCategory.REAL_TIME, cacheKey, value, ttl);
    } catch (_) {}
  }

  /**
   * Public API expected by older callers/tests
   */
  async enableRealtimeOdds(filters: any) {
    // If websocketStore is provided (test mock), use it to connect/subscribe
    if (this.websocketStore) {
      const state = this.websocketStore.getState();
      if (state && typeof state.connect === 'function') {
        await state.connect();
      }
      if (!this.realtimeSubscriptions.has(JSON.stringify(filters))) {
        if (state && typeof state.subscribe === 'function') {
          await state.subscribe('sportsbook_odds', filters);
        }
        this.realtimeSubscriptions.add(JSON.stringify(filters));
      }
      return;
    }

    // Fallback: ensure ws connection exists and subscribe via internal mechanism
    if (!this.wsConnection) this.initializeWebSocket();
    // no-op subscribe for legacy path
  }

  async disableRealtimeOdds(filters: any) {
    if (this.websocketStore) {
      const state = this.websocketStore.getState();
      if (state && typeof state.unsubscribe === 'function') {
        await state.unsubscribe('sportsbook_odds', filters);
      }
      this.realtimeSubscriptions.delete(JSON.stringify(filters));
      return;
    }
    // fallback no-op
  }

  ingestRealtimeOdds(payload: any[]) {
    // Mirror the logic used in handleRealtimeUpdate for test compatibility
    try {
      this.cache.deleteByPrefix?.('sportsbook:odds');
    } catch (_) {}

    for (const data of payload) {
      const key = `${data.playerName}_${data.betType}_${data.line}`;
      if (!this.lineMovementHistory.has(key)) this.lineMovementHistory.set(key, []);
      this.lineMovementHistory.get(key)!.push({
        timestamp: new Date().toISOString(),
        line: data.line,
        odds: data.odds,
        provider: data.provider,
        volume: data.volume,
      });
      const history = this.lineMovementHistory.get(key)!;
      if (history.length > 100) this.lineMovementHistory.set(key, history.slice(-100));
    }
  }

  invalidateCache(prefix?: string) {
    if (!prefix) {
      try {
        this.cache.clear();
      } catch (_) {}
      return;
    }
    try {
      this.cache.deleteByPrefix?.(`sportsbook:${prefix}`);
    } catch (_) {}
  }

  /**
   * Get all player props from multiple sportsbooks
   */
  async getAllPlayerProps(sport: string, playerName?: string): Promise<SportsbookOdds[]> {
    const cacheKey = `sportsbook_odds_${sport}_${playerName || 'all'}`;

    // Check cache first
    const cached = this.readCache(cacheKey) as SportsbookOdds[] | null;
    if (cached) {
      return cached;
    }

    try {
      const params = new URLSearchParams({ sport });
      if (playerName) {
        params.append('player_name', playerName);
      }

      // In-flight deduplication: if a request for this cacheKey is already running,
      // return the same promise so parallel callers coalesce.
      if (this.inFlight.has(cacheKey)) {
        return this.inFlight.get(cacheKey) as Promise<SportsbookOdds[]>;
      }

      const doFetch = async () => {
        // Prefer injected apiClient (tests) over global fetch
        if (this.apiClient && typeof this.apiClient.get === 'function') {
          const resp = await this.apiClient.get(`/api/sportsbook/player-props?${params}`);
          const data: SportsbookOdds[] = resp.data ?? [];
          this.writeCache(cacheKey, data, 30000);
          return data;
        }

        const response = await fetch(`${this.baseUrl}/api/sportsbook/player-props?${params}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data: SportsbookOdds[] = await response.json();
        // Cache for 30 seconds (real-time data)
        this.writeCache(cacheKey, data, 30000);
        return data;
      };

      const p = doFetch();
      this.inFlight.set(cacheKey, p);
      try {
        const res = await p;
        return res;
      } finally {
        this.inFlight.delete(cacheKey);
      }
    } catch (error) {
      console.error('Error fetching player props:', error);
      return [];
    }
  }

  /**
   * Get best odds comparison across all sportsbooks
   */
  async getBestOdds(sport: string, filters?: SportsbookFilters): Promise<BestOdds[]> {
    const cacheKey = `best_odds_${sport}_${JSON.stringify(filters)}`;

    // Check cache first
    const cached = this.readCache(cacheKey) as BestOdds[] | null;
    if (cached) {
      return cached;
    }

    try {
      const params = new URLSearchParams({ sport });
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            if (Array.isArray(value)) {
              value.forEach(v => params.append(key, v.toString()));
            } else {
              params.append(key, value.toString());
            }
          }
        });
      }

      if (this.apiClient && typeof this.apiClient.get === 'function') {
        const resp = await this.apiClient.get(`/api/sportsbook/best-odds?${params}`);
        const data: BestOdds[] = resp.data ?? [];
        this.writeCache(cacheKey, data, 45000);
        return data;
      }

      const response = await fetch(`${this.baseUrl}/api/sportsbook/best-odds?${params}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: BestOdds[] = await response.json();

      // Cache for 45 seconds
      this.writeCache(cacheKey, data, 45000);

      return data;
    } catch (error) {
      console.error('Error fetching best odds:', error);
      return [];
    }
  }

  /**
   * Find arbitrage opportunities across sportsbooks
   */
  async getArbitrageOpportunities(
    sport: string,
    minProfit: number = 2.0
  ): Promise<ArbitrageOpportunity[]> {
    const cacheKey = `arbitrage_${sport}_${minProfit}`;

    // Check cache first
    const cached = this.cache.get<ArbitrageOpportunity[]>(CacheCategory.REAL_TIME, cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const params = new URLSearchParams({
        sport,
        min_profit: minProfit.toString(),
      });

      const response = await fetch(`${this.baseUrl}/api/sportsbook/arbitrage?${params}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: ArbitrageOpportunity[] = await response.json();

      // Cache for 20 seconds (arbitrage is time-sensitive)
      this.cache.set(CacheCategory.REAL_TIME, cacheKey, data, 20000);

      return data;
    } catch (error) {
      console.error('Error fetching arbitrage opportunities:', error);
      return [];
    }
  }

  /**
   * Get performance metrics for all sportsbook providers
   */
  async getPerformanceMetrics(): Promise<SportsbookPerformance> {
    const cacheKey = 'sportsbook_performance';

    // Check cache first
    const cached = this.cache.get<SportsbookPerformance>(CacheCategory.API_RESPONSES, cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const response = await fetch(`${this.baseUrl}/api/sportsbook/performance`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: SportsbookPerformance = await response.json();

      // Cache for 5 minutes
      this.cache.set(CacheCategory.API_RESPONSES, cacheKey, data, 300000);

      return data;
    } catch (error) {
      console.error('Error fetching performance metrics:', error);
      return {
        providers: {},
        summary: {
          totalProviders: 0,
          healthyProviders: 0,
          avgReliability: 0,
          fastestProvider: 'unknown',
        },
      };
    }
  }

  /**
   * Get line movement history for a specific market
   */
  getLineMovementHistory(playerName: string, betType: string, line: number): LineMovement[] {
    const key = `${playerName}_${betType}_${line}`;
    return this.lineMovementHistory.get(key) || [];
  }

  /**
   * Get available sports from all sportsbooks
   */
  async getAvailableSports(): Promise<string[]> {
    const cacheKey = 'available_sports';

    // Check cache first
    const cached = this.cache.get<string[]>(CacheCategory.API_RESPONSES, cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const response = await fetch(`${this.baseUrl}/api/sportsbook/sports`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: string[] = await response.json();

      // Cache for 1 hour
      this.cache.set(CacheCategory.API_RESPONSES, cacheKey, data, 3600000);

      return data;
    } catch (error) {
      console.error('Error fetching available sports:', error);
      return ['nba', 'nfl', 'mlb', 'nhl']; // Default fallback
    }
  }

  /**
   * Search for specific player props across all sportsbooks
   */
  async searchPlayerProps(
    playerName: string,
    sport: string,
    betType?: string
  ): Promise<SportsbookOdds[]> {
    const params = new URLSearchParams({
      player_name: playerName,
      sport,
    });
    if (betType) {
      params.append('bet_type', betType);
    }

    try {
      const response = await fetch(`${this.baseUrl}/api/sportsbook/search?${params}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error searching player props:', error);
      return [];
    }
  }

  /**
   * Calculate arbitrage bet sizing
   */
  calculateArbitrageBets(
    overOdds: number,
    underOdds: number,
    totalStake: number
  ): { overStake: number; underStake: number; guaranteedProfit: number } {
    const overDecimal = this.americanToDecimal(overOdds);
    const underDecimal = this.americanToDecimal(underOdds);

    const overStakeRatio = 1 / overDecimal / (1 / overDecimal + 1 / underDecimal);
    const underStakeRatio = 1 / underDecimal / (1 / overDecimal + 1 / underDecimal);

    const overStake = totalStake * overStakeRatio;
    const underStake = totalStake * underStakeRatio;

    // Calculate guaranteed profit
    const overReturn = overStake * overDecimal;
    const underReturn = underStake * underDecimal;
    const guaranteedProfit = Math.min(overReturn, underReturn) - totalStake;

    return {
      overStake: Math.round(overStake * 100) / 100,
      underStake: Math.round(underStake * 100) / 100,
      guaranteedProfit: Math.round(guaranteedProfit * 100) / 100,
    };
  }

  /**
   * Convert American odds to decimal odds
   */
  americanToDecimal(americanOdds: number): number {
    if (americanOdds > 0) {
      return americanOdds / 100 + 1;
    } else {
      return 100 / Math.abs(americanOdds) + 1;
    }
  }

  /**
   * Convert decimal odds to implied probability
   */
  decimalToImpliedProbability(decimalOdds: number): number {
    return (1 / decimalOdds) * 100;
  }

  /**
   * Format odds for display
   */
  formatOdds(odds: number, format: 'american' | 'decimal' | 'fractional' = 'american'): string {
    switch (format) {
      case 'american':
        return odds > 0 ? `+${odds}` : odds.toString();
      case 'decimal':
        return this.americanToDecimal(odds).toFixed(2);
      case 'fractional':
        const decimal = this.americanToDecimal(odds);
        const fraction = decimal - 1;
        // Simple fraction conversion (could be improved)
        return `${Math.round(fraction * 100)}/100`;
      default:
        return odds.toString();
    }
  }

  /**
   * Clean up resources
   */
  dispose() {
    if (this.wsConnection) {
      this.wsConnection.close();
      this.wsConnection = null;
    }
    this.lineMovementHistory.clear();
  }
}

// Singleton instance
let sportsbookServiceInstance: SportsbookDataService | null = null;

export const getSportsbookService = (): SportsbookDataService => {
  if (!sportsbookServiceInstance) {
    sportsbookServiceInstance = new SportsbookDataService();
  }
  return sportsbookServiceInstance;
};

export default SportsbookDataService;
