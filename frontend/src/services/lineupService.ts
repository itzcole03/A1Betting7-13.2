import ApiService from './unified/ApiService';

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

export interface Contest {
  id: string;
  name: string;
  entryFee: number;
  totalPrizes: number;
  entries: number;
  maxEntries: number;
  payoutStructure: 'top_heavy' | 'flat' | 'winner_take_all';
  sport: string;
  slate: string;
  startTime: Date;
  positions: {
    [key: string]: number;
  };
  salaryCap: number;
  site: 'draftkings' | 'fanduel' | 'superdraft' | 'yahoo';
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
  private apiService: typeof ApiService;
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  constructor() {
    this.apiService = ApiService;
  }

  private getCacheKey(method: string, params?: any): string {
    return `${method}_${JSON.stringify(params || {})}`;
  }

  private isValidCache(cacheKey: string): boolean {
    const cached = this.cache.get(cacheKey);
    if (!cached) return false;
    return Date.now() - cached.timestamp < this.CACHE_TTL;
  }

  private getFromCache<T>(cacheKey: string): T | null {
    const cached = this.cache.get(cacheKey);
    return cached ? cached.data : null;
  }

  private setCache(cacheKey: string, data: any): void {
    this.cache.set(cacheKey, {
      data,
      timestamp: Date.now(),
    });
  }

  /**
   * Get available contests for a specific sport and date
   */
  async getContests(sport: string, date?: Date): Promise<Contest[]> {
    const cacheKey = this.getCacheKey('getContests', { sport, date });

    if (this.isValidCache(cacheKey)) {
      return this.getFromCache<Contest[]>(cacheKey) || [];
    }

    try {
      const response = await this.apiService.get('/contests', {
        params: {
          sport,
          date: date?.toISOString(),
        },
      });

      const contests = (response.data as any).map((contest: any) => ({
        ...contest,
        startTime: new Date(contest.startTime),
      }));

      this.setCache(cacheKey, contests);
      return contests;
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
    const cacheKey = this.getCacheKey('getPlayerPool', { contestId, filters });

    if (this.isValidCache(cacheKey)) {
      return this.getFromCache<Player[]>(cacheKey) || [];
    }

    try {
      const response = await this.apiService.get(`/contests/${contestId}/players`, {
        params: filters,
      });

      const players = response.data.map((player: any) => ({
        ...player,
        gameTime: new Date(player.gameTime),
      }));

      this.setCache(cacheKey, players);
      return players;
    } catch (error) {
      console.error('Error fetching player pool:', error);
      return this.getFallbackPlayers();
    }
  }

  /**
   * Get player projections with advanced analytics
   */
  async getPlayerProjections(playerIds: string[]): Promise<PlayerProjection[]> {
    const cacheKey = this.getCacheKey('getPlayerProjections', { playerIds });

    if (this.isValidCache(cacheKey)) {
      return this.getFromCache<PlayerProjection[]>(cacheKey) || [];
    }

    try {
      const response = await this.apiService.post('/projections/players', {
        playerIds,
      });

      this.setCache(cacheKey, response.data);
      return response.data as any as PlayerProjection[];
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
      const response = await this.apiService.post('/lineups/optimize', {
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

      return response.data.map((optimization: any) => ({
        ...optimization,
        lineup: optimization.lineup.map((player: any) => ({
          ...player,
          gameTime: new Date(player.gameTime),
        })),
      }));
    } catch (error) {
      console.error('Error optimizing lineup:', error);
      return this.getFallbackOptimization();
    }
  }

  /**
   * Get available optimization strategies
   */
  async getStrategies(contestType?: string): Promise<LineupStrategy[]> {
    const cacheKey = this.getCacheKey('getStrategies', { contestType });

    if (this.isValidCache(cacheKey)) {
      return this.getFromCache<LineupStrategy[]>(cacheKey) || [];
    }

    try {
      const response = await this.apiService.get('/strategies', {
        params: { contestType },
      });

      this.setCache(cacheKey, response.data);
      return response.data as any as LineupStrategy[];
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
      const response = await this.apiService.post('/strategies', strategy);

      // Invalidate strategies cache
      Array.from(this.cache.keys())
        .filter(key => key.includes('getStrategies'))
        .forEach(key => this.cache.delete(key));

      return response.data as any as LineupStrategy;
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
      const response = await this.apiService.post(`/contests/${contestId}/validate`, {
        lineup: lineup.map(p => p.id),
      });

      return response.data as any;
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
    const cacheKey = this.getCacheKey('getOwnershipProjections', { contestId });

    if (this.isValidCache(cacheKey)) {
      return this.getFromCache<{ [playerId: string]: number }>(cacheKey) || {};
    }

    try {
      const response = await this.apiService.get(`/contests/${contestId}/ownership`);

      this.setCache(cacheKey, response.data);
      return response.data as any as { [playerId: string]: number };
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
    const cacheKey = this.getCacheKey('getCorrelationMatrix', { playerIds });

    if (this.isValidCache(cacheKey)) {
      return this.getFromCache<any>(cacheKey) || {};
    }

    try {
      const response = await this.apiService.post('/analytics/correlations', {
        playerIds,
      });

      this.setCache(cacheKey, response.data);
      return response.data as any as { [playerId: string]: { [playerId: string]: number } };
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
      const response = await this.apiService.post('/lineups/export', {
        lineup: lineup.map(p => p.id),
        format,
        contestId,
      });

      return response.data as any;
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
      const response = await this.apiService.post('/lineups/import', {
        content,
        format,
        contestId,
      });

      return response.data.map((player: any) => ({
        ...player,
        gameTime: new Date(player.gameTime),
      }));
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
      const response = await this.apiService.post(`/contests/${contestId}/analytics`, {
        lineup: lineup.map(p => p.id),
      });

      return response.data as any;
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
      const response = await this.apiService.post(`/contests/${contestId}/recommendations`, {
        currentLineup: currentLineup.map(p => p.id),
        strategy,
      });

      const data = response.data as any;
      return {
        ...(data || {}),
        suggestions: (data?.suggestions || []).map((suggestion: any) => ({
          ...suggestion,
          player: {
            ...suggestion.player,
            gameTime: new Date(suggestion.player.gameTime),
          },
          replacement: suggestion.replacement
            ? {
                ...suggestion.replacement,
                gameTime: new Date(suggestion.replacement.gameTime),
              }
            : undefined,
        })),
      };
    } catch (error) {
      console.error('Error fetching recommendations:', error);
      return { suggestions: [], improvements: [] };
    }
  }

  /**
   * Fetch live betting recommendations from the backend
   */
  async getLiveRecommendations(): Promise<any[]> {
    try {
      const response = await this.apiService.get(`/api/betting/recommendations`, { cache: false });
      // Return the recommendations array from the backend
      return response.data as any;
    } catch (error) {
      console.error('Error fetching live recommendations:', error);
      return [];
    }
  }

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

export const lineupService = new LineupService();
export default lineupService;
