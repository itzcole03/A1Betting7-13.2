/**
 * PlayerDataService - Comprehensive player data management service
 * Follows MasterServiceRegistry singleton pattern with caching and error handling
 */

import { ApiService } from '../unified/ApiService';
import { UnifiedCache } from '../unified/UnifiedCache';
import { UnifiedErrorService } from '../unified/UnifiedErrorService';
import { UnifiedLogger } from '../unified/UnifiedLogger';

interface PlayerStats {
  // Batting Stats
  hits?: number;
  home_runs?: number;
  rbis?: number;
  batting_average?: number;
  on_base_percentage?: number;
  slugging_percentage?: number;
  ops?: number;
  strikeouts?: number;
  walks?: number;

  // Advanced Stats
  war?: number;
  babip?: number;
  wrc_plus?: number;
  barrel_rate?: number;
  hard_hit_rate?: number;
  exit_velocity?: number;
  launch_angle?: number;

  // Counting Stats
  games_played?: number;
  plate_appearances?: number;
  at_bats?: number;
  runs?: number;
  doubles?: number;
  triples?: number;
  stolen_bases?: number;
}

interface GameLog {
  date: string;
  opponent: string;
  home: boolean;
  result: 'W' | 'L';
  stats: PlayerStats;
  game_score?: number;
  weather?: {
    temperature?: number;
    wind_speed?: number;
    wind_direction?: string;
  };
}

export interface PlayerData {
  id: string;
  name: string;
  team: string;
  position: string;
  sport: string;
  active: boolean;
  injury_status?: string;

  // Current Season
  season_stats: PlayerStats;

  // Performance Data
  recent_games: GameLog[];
  last_30_games: GameLog[];
  season_games: GameLog[];

  // Trends and Analysis
  performance_trends: {
    last_7_days: PlayerStats;
    last_30_days: PlayerStats;
    home_vs_away: {
      home: PlayerStats;
      away: PlayerStats;
    };
    vs_lefties: PlayerStats;
    vs_righties: PlayerStats;
  };

  // Advanced Metrics
  advanced_metrics: {
    consistency_score: number;
    clutch_performance: number;
    injury_risk: number;
    hot_streak: boolean;
    cold_streak: boolean;
    breakout_candidate: boolean;
  };

  // Predictive Analytics
  projections: {
    next_game: PlayerStats;
    rest_of_season: PlayerStats;
    confidence_intervals: {
      low: PlayerStats;
      high: PlayerStats;
    };
  };
}

export interface Player {
  id: string;
  name: string;
  team: string;
  position: string;
  sport: string;
  active: boolean;
  injury_status?: string;
}

export class PlayerDataService {
  private static instance: PlayerDataService;
  private readonly logger: UnifiedLogger;
  private readonly cache: UnifiedCache;
  private readonly apiService: ApiService;
  private readonly errorService: UnifiedErrorService;

  // Cache configuration
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  private readonly SEARCH_CACHE_TTL = 2 * 60 * 1000; // 2 minutes

  private constructor() {
    this.logger = UnifiedLogger.getInstance();
    this.cache = UnifiedCache.getInstance();
    this.apiService = ApiService.getInstance();
    this.errorService = UnifiedErrorService.getInstance();
  }

  static getInstance(): PlayerDataService {
    if (!PlayerDataService.instance) {
      PlayerDataService.instance = new PlayerDataService();
    }
    return PlayerDataService.instance;
  }

  /**
   * Get comprehensive player data including stats, trends, and projections
   */
  async getPlayer(playerId: string, sport: string = 'MLB'): Promise<PlayerData> {
    const cacheKey = `player:${sport}:${playerId}:dashboard`;

    try {
      // Check cache first
      const cached = this.cache.get<PlayerData>(cacheKey);
      if (cached) {
        this.logger.info('PlayerDataService', `Cache hit for player ${playerId}`);
        return cached;
      }

      this.logger.info('PlayerDataService', `Fetching player data: ${playerId}`);

      // Fetch from API
      const response = await this.apiService.get(`/api/v2/players/${playerId}/dashboard`, {
        params: { sport },
      });

      const playerData = response.data as PlayerData;

      // Validate response
      if (!playerData.id || !playerData.name) {
        throw new Error('Invalid player data received from API');
      }

      // Cache the result
      this.cache.set(cacheKey, playerData, this.CACHE_TTL);

      this.logger.info('PlayerDataService', `Player data fetched successfully: ${playerData.name}`);
      return playerData;
    } catch (error) {
      this.errorService.handleError(error as Error, 'PlayerDataService.getPlayer', {
        playerId,
        sport,
      });
      throw error;
    }
  }

  /**
   * Search for players by name or team
   */
  async searchPlayers(query: string, sport: string = 'MLB', limit: number = 10): Promise<Player[]> {
    const cacheKey = `player:search:${sport}:${query}:${limit}`;

    try {
      // Check cache first
      const cached = this.cache.get<Player[]>(cacheKey);
      if (cached) {
        this.logger.info('PlayerDataService', `Cache hit for search: ${query}`);
        return cached;
      }

      this.logger.info('PlayerDataService', `Searching players: ${query}`);

      // Fetch from API
      const response = await this.apiService.get('/api/v2/players/search', {
        params: {
          q: query,
          sport,
          limit,
        },
      });

      const results = response.data.players as Player[];

      // Cache the result
      this.cache.set(cacheKey, results, this.SEARCH_CACHE_TTL);

      this.logger.info('PlayerDataService', `Found ${results.length} players for query: ${query}`);
      return results;
    } catch (error) {
      this.errorService.handleError(error as Error, 'PlayerDataService.searchPlayers', {
        query,
        sport,
        limit,
      });
      throw error;
    }
  }

  /**
   * Get player performance trends over time periods
   */
  async getPlayerTrends(
    playerId: string,
    period: '7d' | '30d' | 'season',
    sport: string = 'MLB'
  ): Promise<any[]> {
    const cacheKey = `player:trends:${sport}:${playerId}:${period}`;

    try {
      // Check cache first
      const cached = this.cache.get<any[]>(cacheKey);
      if (cached) {
        this.logger.info('PlayerDataService', `Cache hit for trends: ${playerId}:${period}`);
        return cached;
      }

      this.logger.info('PlayerDataService', `Fetching trends: ${playerId}:${period}`);

      // Fetch from API
      const response = await this.apiService.get(`/api/v2/players/${playerId}/trends`, {
        params: {
          period,
          sport,
        },
      });

      const trends = response.data.trends;

      // Cache the result
      this.cache.set(cacheKey, trends, this.CACHE_TTL);

      this.logger.info('PlayerDataService', `Trends fetched successfully: ${playerId}:${period}`);
      return trends;
    } catch (error) {
      this.errorService.handleError(error as Error, 'PlayerDataService.getPlayerTrends', {
        playerId,
        period,
        sport,
      });
      throw error;
    }
  }

  /**
   * Get player matchup analysis against specific opponents
   */
  async getMatchupAnalysis(
    playerId: string,
    opponentTeam: string,
    sport: string = 'MLB'
  ): Promise<any> {
    const cacheKey = `player:matchup:${sport}:${playerId}:${opponentTeam}`;

    try {
      // Check cache first
      const cached = this.cache.get<any>(cacheKey);
      if (cached) {
        this.logger.info(
          'PlayerDataService',
          `Cache hit for matchup: ${playerId} vs ${opponentTeam}`
        );
        return cached;
      }

      this.logger.info(
        'PlayerDataService',
        `Fetching matchup analysis: ${playerId} vs ${opponentTeam}`
      );

      // Fetch from API
      const response = await this.apiService.get(`/api/v2/players/${playerId}/matchup`, {
        params: {
          opponent: opponentTeam,
          sport,
        },
      });

      const matchup = response.data;

      // Cache the result
      this.cache.set(cacheKey, matchup, this.CACHE_TTL);

      this.logger.info(
        'PlayerDataService',
        `Matchup analysis fetched successfully: ${playerId} vs ${opponentTeam}`
      );
      return matchup;
    } catch (error) {
      this.errorService.handleError(error as Error, 'PlayerDataService.getMatchupAnalysis', {
        playerId,
        opponentTeam,
        sport,
      });
      throw error;
    }
  }

  /**
   * Get player prop predictions and recommendations
   */
  async getPlayerProps(playerId: string, gameId?: string, sport: string = 'MLB'): Promise<any[]> {
    const cacheKey = `player:props:${sport}:${playerId}:${gameId || 'next'}`;

    try {
      // Check cache first
      const cached = this.cache.get<any[]>(cacheKey);
      if (cached) {
        this.logger.info('PlayerDataService', `Cache hit for props: ${playerId}:${gameId}`);
        return cached;
      }

      this.logger.info('PlayerDataService', `Fetching player props: ${playerId}:${gameId}`);

      // Fetch from API
      const response = await this.apiService.get(`/api/v2/players/${playerId}/props`, {
        params: {
          game_id: gameId,
          sport,
        },
      });

      const props = response.data.props;

      // Cache the result
      this.cache.set(cacheKey, props, this.CACHE_TTL);

      this.logger.info(
        'PlayerDataService',
        `Props fetched successfully: ${playerId} (${props.length} props)`
      );
      return props;
    } catch (error) {
      this.errorService.handleError(error as Error, 'PlayerDataService.getPlayerProps', {
        playerId,
        gameId,
        sport,
      });
      throw error;
    }
  }

  /**
   * Clear player data cache (useful for forcing refresh)
   */
  clearPlayerCache(playerId?: string, sport: string = 'MLB'): void {
    if (playerId) {
      // Clear specific player
      const patterns = [
        `player:${sport}:${playerId}:dashboard`,
        `player:trends:${sport}:${playerId}:*`,
        `player:matchup:${sport}:${playerId}:*`,
        `player:props:${sport}:${playerId}:*`,
      ];

      patterns.forEach(pattern => {
        if (pattern.includes('*')) {
          this.cache.deletePattern(pattern);
        } else {
          this.cache.delete(pattern);
        }
      });

      this.logger.info('PlayerDataService', `Cache cleared for player: ${playerId}`);
    } else {
      // Clear all player data
      this.cache.deletePattern(`player:${sport}:*`);
      this.logger.info('PlayerDataService', `All player cache cleared for sport: ${sport}`);
    }
  }

  /**
   * Health check for the service
   */
  async healthCheck(): Promise<boolean> {
    try {
      // Test basic API connectivity
      await this.apiService.get('/api/v2/health');
      return true;
    } catch (error) {
      this.logger.error('PlayerDataService', 'Health check failed', error as Error);
      return false;
    }
  }

  /**
   * Get service metrics
   */
  getMetrics(): any {
    return {
      cacheHitRate: this.cache.getHitRate(),
      totalRequests: this.cache.getStats().hits + this.cache.getStats().misses,
      cacheSize: this.cache.getStats().size,
      lastActivity: new Date().toISOString(),
    };
  }
}

export default PlayerDataService;
