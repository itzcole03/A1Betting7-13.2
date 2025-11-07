import { Contest, ContestsResponseSchema } from '../schemas/contest';
import _apiService from './unified/ApiService';

// Branded type for cache payloads
type LineupCachePayload =
  | Contest[]
  | Player[]
  | PlayerProjection[]
  | LineupOptimization[]
  | LineupStrategy[]
  | { [playerId: string]: number }
  | { [playerId: string]: { [playerId: string]: number } };

// Branded type for cache payloads

export interface Player {
  id: string;
  name: string;
  team: string;
  position: string;
  salary: number;
  projectedPoints: number;
  ownership: number;
  value: number;
  matchup: string;
  gameTime: Date;
  isLocked: boolean;
  recentForm: number[];
  ceiling: number;
  floor: number;
  consistency: number;
  news: string[];
  stats: {
    avgPoints: number;
    gamesPlayed: number;
    totalPoints: number;
    bestGame: number;
    worstGame: number;
  };
  tags: string[];
  tier: 'elite' | 'solid' | 'value' | 'punt';
  injuryStatus: string;
  weatherImpact: number;
  vegas: {
    impliedTotal: number;
    spread: number;
    gameTotal: number;
  };
}

export interface LineupOptimization {
  lineup: Player[];
  totalSalary: number;
  projectedPoints: number;
  ownership: number;
  ceiling: number;
  floor: number;
  variance: number;
  correlation: number;
  uniqueness: number;
  confidence: number;
  stackInfo: {
    teams: string[];
    games: string[];
    correlations: Array<{
      players: string[];
      correlation: number;
    }>;
  };
  riskMetrics: {
    injuryRisk: number;
    weatherRisk: number;
    chalkLevel: number;
    diversification: number;
  };
}

export interface LineupStrategy {
  id: string;
  name: string;
  description: string;
  settings: {
    exposureTargets: { [playerId: string]: number };
    stackingRules: Array<{
      type: 'team' | 'position' | 'game';
      minPlayers: number;
      maxPlayers: number;
      positions?: string[];
    }>;
    diversificationLevel: number;
    varianceTarget: 'low' | 'medium' | 'high';
    contestType: 'cash' | 'gpp' | 'tournament';
    maxOwnership: number;
    minProjection: number;
    correlationThreshold: number;
  };
}

export interface PlayerProjection {
  playerId: string;
  baseline: number;
  ceiling: number;
  floor: number;
  median: number;
  consistency: number;
  volatility: number;
  confidence: number;
  factors: {
    matchup: number;
    recent_form: number;
    venue: number;
    weather: number;
    pace: number;
    usage: number;
  };
}

export interface OptimizationConstraints {
  lockedPlayers: string[];
  excludedPlayers: string[];
  minSalary?: number;
  maxSalary?: number;
  teamConstraints?: {
    [team: string]: {
      min: number;
      max: number;
    };
  };
  positionConstraints?: {
    [position: string]: {
      min: number;
      max: number;
    };
  };
  correlationRules?: Array<{
    players: string[];
    type: 'require' | 'avoid';
  }>;
}

class LineupService {
  private apiService: typeof _apiService;
  private cache = new Map<string, { data: LineupCachePayload; timestamp: number }>();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  constructor() {
    this.apiService = _apiService;
  }

  private getCacheKey(method: string, params?: object): string {
    return `${method}_${JSON.stringify(params ?? {})}`;
  }

  private isValidCache(_cacheKey: string): boolean {
    const _cached = this.cache.get(_cacheKey);
    if (!_cached) return false;
    return Date.now() - _cached.timestamp < this.CACHE_TTL;
  }

  private getFromCache<T extends LineupCachePayload>(_cacheKey: string): T | null {
    const _cached = this.cache.get(_cacheKey);
    if (!_cached) return null;
    // Runtime guard for array/object types
    if (Array.isArray(_cached.data)) {
      return _cached.data as T;
    }
    if (typeof _cached.data === 'object' && _cached.data !== null) {
      return _cached.data as T;
    }
    return null;
  }

  private setCache<T extends LineupCachePayload>(_cacheKey: string, data: T): void {
    this.cache.set(_cacheKey, {
      data,
      timestamp: Date.now(),
    });
  }

  /**
   * Get available contests for a specific sport and date
   */
  async getContests(sport: string, date?: Date): Promise<Contest[]> {
    const _cacheKey = this.getCacheKey('getContests', { sport, date });

    if (this.isValidCache(_cacheKey)) {
      return this.getFromCache<Contest[]>(_cacheKey) || [];
    }

    try {
      const _response = await this.apiService.get('/contests', {
        params: {
          sport,
          date: date?.toISOString(),
        },
      });

      // Zod validation for strict type safety
      const parsed = ContestsResponseSchema.safeParse(_response.data);
      if (!parsed.success) {
        console.error('Contest API response validation failed:', parsed.error);
        return this.getFallbackContests();
      }

      // Convert startTime to Date if needed
      const _contests = parsed.data.map(contest => ({
        ...contest,
        startTime:
          typeof contest.startTime === 'string' ? new Date(contest.startTime) : contest.startTime,
      }));

      this.setCache(_cacheKey, _contests);
      return _contests;
    } catch (error) {
      console.error('Error fetching contests:', error);
      return this.getFallbackContests();
    }
  }

  /**
   * Get player pool for a specific contest
   */
  async getPlayerPool(
    contestId: string,
    filters?: {
      position?: string;
      team?: string;
      salaryRange?: [number, number];
      projectionRange?: [number, number];
    }
  ): Promise<Player[]> {
    const _cacheKey = this.getCacheKey('getPlayerPool', { contestId, filters });

    if (this.isValidCache(_cacheKey)) {
      return this.getFromCache<Player[]>(_cacheKey) || [];
    }

    try {
      const _response = await this.apiService.get(`/contests/${contestId}/players`, {
        params: filters,
      });

      // Zod validation for strict type safety
      const { PlayerPoolResponseSchema } = await import('../schemas/player');
      const parsed = PlayerPoolResponseSchema.safeParse(_response.data);
      if (!parsed.success) {
        console.error('Player pool API response validation failed:', parsed.error);
        return this.getFallbackPlayers();
      }

      // Convert gameTime to Date if needed
      const _players = parsed.data.map(player => ({
        ...player,
        gameTime: typeof player.gameTime === 'string' ? new Date(player.gameTime) : player.gameTime,
      }));

      this.setCache(_cacheKey, _players);
      return _players;
    } catch (error) {
      console.error('Error fetching player pool:', error);
      return this.getFallbackPlayers();
    }
  }

  /**
   * Get player projections with advanced analytics
   */
  async getPlayerProjections(playerIds: string[]): Promise<PlayerProjection[]> {
    const _cacheKey = this.getCacheKey('getPlayerProjections', { playerIds });

    if (this.isValidCache(_cacheKey)) {
      return this.getFromCache<PlayerProjection[]>(_cacheKey) || [];
    }

    try {
      const _response = await this.apiService.post('/projections/players', {
        playerIds,
      });

      // Zod validation for strict type safety
      const { PlayerProjectionsResponseSchema } = await import('../schemas/playerProjection');
      const parsed = PlayerProjectionsResponseSchema.safeParse(_response.data);
      if (!parsed.success) {
        console.error('Player projections API response validation failed:', parsed.error);
        return [];
      }

      this.setCache(_cacheKey, parsed.data);
      return parsed.data;
    } catch (error) {
      console.error('Error fetching player projections:', error);
      return [];
    }
  }

  /**
   * Optimize lineup using advanced algorithms
   */
  async optimizeLineup(
    contestId: string,
    strategy: LineupStrategy,
    constraints: OptimizationConstraints,
    options: {
      numLineups?: number;
      randomness?: number;
      iterations?: number;
      algorithm?: 'genetic' | 'simulated_annealing' | 'linear_programming';
    } = {}
  ): Promise<LineupOptimization[]> {
    try {
      const _response = await this.apiService.post('/lineups/optimize', {
        contestId,
        strategy,
        constraints,
        options: {
          numLineups: 1,
          randomness: 0.1,
          iterations: 10000,
          algorithm: 'genetic',
          ...options,
        },
      });
      // Runtime guard for array of LineupOptimization
      if (!Array.isArray(_response.data)) return this.getFallbackOptimization();
      return _response.data.map((opt: Partial<LineupOptimization>) => ({
        ...opt,
        lineup: Array.isArray(opt.lineup)
          ? opt.lineup.map((player: Partial<Player>) => ({
              ...player,
              gameTime: player.gameTime ? new Date(player.gameTime) : new Date(),
            }))
          : [],
      })) as LineupOptimization[];
    } catch (error) {
      console.error('Error optimizing lineup:', error);
      return this.getFallbackOptimization();
    }
  }

  /**
   * Get available optimization strategies
   */
  async getStrategies(contestType?: string): Promise<LineupStrategy[]> {
    const _cacheKey = this.getCacheKey('getStrategies', { contestType });

    if (this.isValidCache(_cacheKey)) {
      return this.getFromCache<LineupStrategy[]>(_cacheKey) || [];
    }

    try {
      const _response = await this.apiService.get('/strategies', {
        params: { contestType },
      });
      // Runtime guard for array of LineupStrategy
      if (Array.isArray(_response.data)) {
        this.setCache(_cacheKey, _response.data as LineupStrategy[]);
        return _response.data as LineupStrategy[];
      }
      return this.getFallbackStrategies();
    } catch (error) {
      console.error('Error fetching strategies:', error);
      return this.getFallbackStrategies();
    }
  }

  /**
   * Save custom strategy
   */
  async saveStrategy(strategy: Omit<LineupStrategy, 'id'>): Promise<LineupStrategy> {
    try {
      const _response = await this.apiService.post('/strategies', strategy);

      // Invalidate strategies cache
      Array.from(this.cache.keys())
        .filter(_key => _key.includes('getStrategies'))
        .forEach(_key => this.cache.delete(_key));

      return _response.data as LineupStrategy;
    } catch (error) {
      console.error('Error saving strategy:', error);
      throw error;
    }
  }

  /**
   * Validate lineup against contest rules
   */
  async validateLineup(
    contestId: string,
    lineup: Player[]
  ): Promise<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
    totalSalary: number;
    projectedPoints: number;
  }> {
    try {
      const _response = await this.apiService.post(`/contests/${contestId}/validate`, {
        lineup: lineup.map(p => p.id),
      });
      // Runtime guard for expected response shape
      const d = _response.data;
      if (
        typeof d === 'object' &&
        d !== null &&
        'isValid' in d &&
        typeof (d as any).isValid === 'boolean' &&
        'errors' in d &&
        Array.isArray((d as any).errors) &&
        'warnings' in d &&
        Array.isArray((d as any).warnings) &&
        'totalSalary' in d &&
        typeof (d as any).totalSalary === 'number' &&
        'projectedPoints' in d &&
        typeof (d as any).projectedPoints === 'number'
      ) {
        return d as {
          isValid: boolean;
          errors: string[];
          warnings: string[];
          totalSalary: number;
          projectedPoints: number;
        };
      }
      return {
        isValid: false,
        errors: ['Validation failed'],
        warnings: [],
        totalSalary: lineup.reduce((sum, p) => sum + p.salary, 0),
        projectedPoints: lineup.reduce((sum, p) => sum + p.projectedPoints, 0),
      };
    } catch (error) {
      console.error('Error validating lineup:', error);
      return {
        isValid: false,
        errors: ['Validation failed'],
        warnings: [],
        totalSalary: lineup.reduce((sum, p) => sum + p.salary, 0),
        projectedPoints: lineup.reduce((sum, p) => sum + p.projectedPoints, 0),
      };
    }
  }

  /**
   * Get ownership projections for contest
   */
  async getOwnershipProjections(contestId: string): Promise<{ [playerId: string]: number }> {
    const _cacheKey = this.getCacheKey('getOwnershipProjections', { contestId });

    if (this.isValidCache(_cacheKey)) {
      return this.getFromCache<{ [playerId: string]: number }>(_cacheKey) || {};
    }

    try {
      const _response = await this.apiService.get(`/contests/${contestId}/ownership`);
      // Runtime guard for object with string keys and number values
      if (
        typeof _response.data === 'object' &&
        _response.data !== null &&
        Object.values(_response.data).every(v => typeof v === 'number')
      ) {
        this.setCache(_cacheKey, _response.data as { [playerId: string]: number });
        return _response.data as { [playerId: string]: number };
      }
      return {};
    } catch (error) {
      console.error('Error fetching ownership projections:', error);
      return {};
    }
  }

  /**
   * Get correlation matrix for players
   */
  async getCorrelationMatrix(playerIds: string[]): Promise<{
    [playerId: string]: { [playerId: string]: number };
  }> {
    const _cacheKey = this.getCacheKey('getCorrelationMatrix', { playerIds });

    if (this.isValidCache(_cacheKey)) {
      return (
        this.getFromCache<{
          [playerId: string]: { [playerId: string]: number };
        }>(_cacheKey) || {}
      );
    }

    try {
      const _response = await this.apiService.post('/analytics/correlations', {
        playerIds,
      });
      // Runtime guard for object with string keys and values as objects of string:number
      if (
        typeof _response.data === 'object' &&
        _response.data !== null &&
        !('playerIds' in _response.data) &&
        Object.values(_response.data).every(
          v =>
            typeof v === 'object' &&
            v !== null &&
            Object.values(v).every(n => typeof n === 'number')
        )
      ) {
        this.setCache(
          _cacheKey,
          _response.data as { [playerId: string]: { [playerId: string]: number } }
        );
        return _response.data as { [playerId: string]: { [playerId: string]: number } };
      }
      return {};
    } catch (error) {
      console.error('Error fetching correlation matrix:', error);
      return {};
    }
  }

  /**
   * Export lineup to various formats
   */
  async exportLineup(
    lineup: Player[],
    format: 'csv' | 'json' | 'draftkings' | 'fanduel',
    contestId?: string
  ): Promise<string> {
    try {
      const _response = await this.apiService.post('/lineups/export', {
        lineup: lineup.map(p => p.id),
        format,
        contestId,
      });
      // Runtime guard for string response
      if (typeof _response.data === 'string') {
        return _response.data;
      }
      return '';
    } catch (error) {
      console.error('Error exporting lineup:', error);
      throw error;
    }
  }

  /**
   * Import lineup from CSV/JSON
   */
  async importLineup(
    content: string,
    format: 'csv' | 'json',
    contestId: string
  ): Promise<Player[]> {
    try {
      const _response = await this.apiService.post('/lineups/import', {
        content,
        format,
        contestId,
      });
      // Runtime guard for array of Player
      if (!Array.isArray(_response.data)) return [];
      return _response.data.map((player: Partial<Player>) => ({
        ...player,
        gameTime: player.gameTime ? new Date(player.gameTime) : new Date(),
      })) as Player[];
    } catch (error) {
      console.error('Error importing lineup:', error);
      throw error;
    }
  }

  /**
   * Get lineup analytics and metrics
   */
  async getLineupAnalytics(
    lineup: Player[],
    contestId: string
  ): Promise<{
    ownership: number;
    correlation: number;
    ceiling: number;
    floor: number;
    variance: number;
    uniqueness: number;
    stackAnalysis: {
      teams: Array<{
        team: string;
        players: string[];
        correlation: number;
      }>;
      games: Array<{
        game: string;
        players: string[];
        correlation: number;
      }>;
    };
    riskMetrics: {
      injuryRisk: number;
      weatherRisk: number;
      chalkLevel: number;
    };
  }> {
    try {
      const _response = await this.apiService.post(`/contests/${contestId}/analytics`, {
        lineup: lineup.map(p => p.id),
      });

      const _data = _response.data as any;
      return {
        ownership: _data.ownership || 0,
        correlation: _data.correlation || 0,
        ceiling: _data.ceiling || 0,
        floor: _data.floor || 0,
        variance: _data.variance || 0,
        uniqueness: _data.uniqueness || 0,
        stackAnalysis: _data.stackAnalysis || { teams: [], games: [] },
        riskMetrics: _data.riskMetrics || { injuryRisk: 0, weatherRisk: 0, chalkLevel: 0 },
      };
    } catch (error) {
      console.error('Error fetching lineup analytics:', error);
      return {
        ownership: 0,
        correlation: 0,
        ceiling: 0,
        floor: 0,
        variance: 0,
        uniqueness: 0,
        stackAnalysis: { teams: [], games: [] },
        riskMetrics: { injuryRisk: 0, weatherRisk: 0, chalkLevel: 0 },
      };
    }
  }

  /**
   * Get lineup recommendations based on player pool
   */
  async getRecommendations(
    contestId: string,
    currentLineup: Player[],
    strategy: LineupStrategy
  ): Promise<{
    suggestions: Array<{
      action: 'add' | 'remove' | 'swap';
      player: Player;
      replacement?: Player;
      reasoning: string;
      impact: number;
    }>;
    improvements: Array<{
      metric: string;
      current: number;
      potential: number;
      confidence: number;
    }>;
  }> {
    try {
      const _response = await this.apiService.post(`/contests/${contestId}/recommendations`, {
        currentLineup: currentLineup.map(p => p.id),
        strategy,
      });
      // Runtime guard for expected object shape
      const d = _response.data;
      const hasSuggestions =
        d && typeof d === 'object' && 'suggestions' in d && Array.isArray(d.suggestions);
      const hasImprovements =
        d && typeof d === 'object' && 'improvements' in d && Array.isArray(d.improvements);
      return {
        suggestions: hasSuggestions
          ? (
              d.suggestions as Array<{
                action: 'add' | 'remove' | 'swap';
                player: Player;
                replacement?: Player;
                reasoning: string;
                impact: number;
              }>
            ).map(suggestion => ({
              ...suggestion,
              player:
                suggestion.player && suggestion.player.gameTime
                  ? { ...suggestion.player, gameTime: new Date(suggestion.player.gameTime) }
                  : suggestion.player,
              replacement:
                suggestion.replacement && suggestion.replacement.gameTime
                  ? {
                      ...suggestion.replacement,
                      gameTime: new Date(suggestion.replacement.gameTime),
                    }
                  : suggestion.replacement,
            }))
          : [],
        improvements: hasImprovements
          ? (d.improvements as Array<{
              metric: string;
              current: number;
              potential: number;
              confidence: number;
            }>)
          : [],
      };
    } catch (error) {
      console.error('Error fetching recommendations:', error);
      return { suggestions: [], improvements: [] };
    }
  }

  /**
   * Fetch live betting recommendations from the backend
   */
  async getLiveRecommendations(): Promise<Player[]> {
    try {
      const _response = await this.apiService.get(`/api/betting/recommendations`, { cache: false });
      // Runtime guard for array of Player
      if (!Array.isArray(_response.data)) return [];
      return _response.data.map((player: Partial<Player>) => ({
        ...player,
        gameTime: player.gameTime ? new Date(player.gameTime) : new Date(),
      })) as Player[];
    } catch (error) {
      console.error('Error fetching live recommendations:', error);
      return [];
    }
  }

  // Branded type for cache payloads

  /**
   * Clear all cached data
   */
  clearCache(): void {
    this.cache.clear();
  }

  // Fallback data methods
  private getFallbackContests(): Contest[] {
    return [
      {
        id: 'contest-001',
        name: 'NFL Sunday Million',
        entryFee: 20,
        totalPrizes: 4000000,
        entries: 175000,
        maxEntries: 200000,
        payoutStructure: 'top_heavy',
        sport: 'NFL',
        slate: 'Main',
        startTime: new Date(Date.now() + 3 * 60 * 60 * 1000),
        positions: {
          QB: 1,
          RB: 2,
          WR: 3,
          TE: 1,
          FLEX: 1,
          DST: 1,
        },
        salaryCap: 50000,
        site: 'draftkings',
      },
    ];
  }

  private getFallbackPlayers(): Player[] {
    return [
      {
        id: 'player-001',
        name: 'Josh Allen',
        team: 'BUF',
        position: 'QB',
        salary: 8500,
        projectedPoints: 23.5,
        ownership: 18.2,
        value: 2.76,
        matchup: 'vs KC',
        gameTime: new Date(Date.now() + 3 * 60 * 60 * 1000),
        isLocked: false,
        recentForm: [28.4, 19.8, 31.2, 26.7, 22.1],
        ceiling: 35.8,
        floor: 12.4,
        consistency: 85,
        news: ['Full practice participation', 'No injury concerns'],
        stats: {
          avgPoints: 24.2,
          gamesPlayed: 16,
          totalPoints: 387.2,
          bestGame: 42.8,
          worstGame: 8.9,
        },
        tags: ['Elite', 'Safe', 'High Ceiling'],
        tier: 'elite',
        injuryStatus: 'Healthy',
        weatherImpact: 0,
        vegas: {
          impliedTotal: 28.5,
          spread: -2.5,
          gameTotal: 57,
        },
      },
    ];
  }

  private getFallbackStrategies(): LineupStrategy[] {
    return [
      {
        id: 'strategy-001',
        name: 'Tournament GPP',
        description: 'High variance lineup for large field tournaments',
        settings: {
          exposureTargets: {},
          stackingRules: [
            { type: 'team', minPlayers: 2, maxPlayers: 4 },
            { type: 'game', minPlayers: 2, maxPlayers: 5 },
          ],
          diversificationLevel: 0.3,
          varianceTarget: 'high',
          contestType: 'tournament',
          maxOwnership: 25,
          minProjection: 8,
          correlationThreshold: 0.1,
        },
      },
    ];
  }

  private getFallbackOptimization(): LineupOptimization[] {
    return [
      {
        lineup: this.getFallbackPlayers().slice(0, 9),
        totalSalary: 49500,
        projectedPoints: 165.8,
        ownership: 12.4,
        ceiling: 245.2,
        floor: 98.4,
        variance: 146.8,
        correlation: 0.85,
        uniqueness: 87.6,
        confidence: 88,
        stackInfo: {
          teams: ['BUF'],
          games: ['BUF@KC'],
          correlations: [],
        },
        riskMetrics: {
          injuryRisk: 0.05,
          weatherRisk: 0.02,
          chalkLevel: 0.15,
          diversification: 0.78,
        },
      },
    ];
  }
}

export const _lineupService = new LineupService();
export default _lineupService;
