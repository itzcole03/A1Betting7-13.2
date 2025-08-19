/**
 * PropFinder Data Service
 * 
 * Handles all data fetching and processing for the PropFinder dashboard.
 * Integrates with backend PropFinder API endpoints and provides data transformation,
 * caching, and error handling for the PropFinder interface.
 */

import { EnhancedLogger } from './EnhancedLogger';

interface PropFinderGame {
  id: number;
  away_team: string;
  home_team: string;
  away_team_id: number;
  home_team_id: number;
  game_date: string;
  game_time: string;
  status: string;
  venue: string;
  is_locked: boolean;
}

interface PropFinderPlayer {
  id: string;
  name: string;
  team: string;
  position: string;
  jersey_number: number;
  image_url: string;
  pf_rating: number;
  l10_avg: number;
  l5_avg: number;
  season_stats: Record<string, number>;
  is_active: boolean;
  // PropFinder dashboard specific fields
  prop: string;
  odds: string;
  matchup: string;
  percentages: {
    '2024': number;
    '2025': number;
    'h2h': number;
    'l5': number;
    'last': number;
    'l4': number;
  };
  streak: number;
  isFavorite: boolean;
}

interface ComprehensiveStatsResponse {
  player_id: string;
  player_name: string;
  team: string;
  position: string;
  statistics: {
    l5_avg: number;
    l10_avg: number;
    season_avg: number;
    percentages: {
      '2024': number;
      '2025': number;
      'h2h': number;
      'l5': number;
      'last': number;
      'l4': number;
    };
    streak: number;
    form: string;
    pf_rating: number;
  };
  metadata: {
    games_played: number;
    last_game_performance: number | null;
    calculation_confidence: number;
    data_quality_score: number;
    stat_type: string;
    season_year: number;
  };
}

interface BatchStatsResponse {
  players: ComprehensiveStatsResponse[];
  total_processed: number;
}

interface PropFinderProp {
  id: string;
  player_id: string;
  player_name: string;
  team: string;
  position: string;
  category: string;
  prop_type: string;
  target: number;
  line: number;
  over_odds: number;
  under_odds: number;
  odds: string;
  pf_rating: number;
  recommendation: 'STRONG' | 'LEAN' | 'AVOID';
  confidence: number;
  l10_avg: number;
  l5_avg: number;
  streak: number;
  matchup: string;
  percentages: {
    '2024': number;
    '2025': number;
    'h2h': number;
    'l5': number;
    'last': number;
    'l4': number;
  };
  recent_trend: 'UP' | 'DOWN' | 'STABLE';
  value_rating: number;
  book: string;
}

interface PropFinderResponse<T> {
  success: boolean;
  data: T;
  message: string;
  timestamp: string;
  total_count?: number;
}

interface PlayerStats {
  player_id: string;
  season_stats: Record<string, number>;
  last_10_games: Record<string, number>;
  last_5_games: Record<string, number>;
  career_averages: Record<string, number>;
  recent_performance: {
    trend: 'UP' | 'DOWN' | 'STABLE';
    streak_type: 'OVER' | 'UNDER' | 'MIXED';
    streak_length: number;
  };
}

interface CacheEntry {
  data: unknown;
  timestamp: number;
  ttl: number;
}

interface PropDisplayFormat {
  id: string;
  player: {
    id: string;
    name: string;
    team: string;
    imageUrl: string;
  };
  category: string;
  propType: string;
  line: number;
  odds: {
    over: number;
    under: number;
  };
  analysis: {
    pfRating: number;
    recommendation: string;
    confidence: number;
    l10Avg: number;
    l5Avg: number;
    trend: string;
    valueRating: number;
  };
  book: string;
  sport: string;
}

class PropFinderDataService {
  private static instance: PropFinderDataService;
  private logger: EnhancedLogger;
  private cache: Map<string, CacheEntry>;
  private readonly API_BASE = '/api/propfinder';
  private readonly CACHE_TTL_GAMES = 5 * 60 * 1000; // 5 minutes
  private readonly CACHE_TTL_PLAYERS = 10 * 60 * 1000; // 10 minutes
  private readonly CACHE_TTL_PROPS = 2 * 60 * 1000; // 2 minutes
  private readonly CACHE_TTL_STATS = 15 * 60 * 1000; // 15 minutes

  private constructor() {
    this.logger = new EnhancedLogger({
      level: 'info',
      enableConsole: true,
      enableStorage: true
    });
    this.cache = new Map();
    
    // Setup cache cleanup
    setInterval(() => this.cleanupCache(), 60000); // Cleanup every minute
  }

  public static getInstance(): PropFinderDataService {
    if (!PropFinderDataService.instance) {
      PropFinderDataService.instance = new PropFinderDataService();
    }
    return PropFinderDataService.instance;
  }

  /**
   * Get today's MLB games formatted for PropFinder
   */
  public async getTodaysGames(includeOdds: boolean = false): Promise<PropFinderGame[]> {
    const cacheKey = `games_today_${includeOdds}`;
    
    // Check cache first
    const cached = this.getCached<PropFinderGame[]>(cacheKey);
    if (cached) {
      this.logger.debug('PropFinderDataService', 'cache', 'Returning cached games data');
      return cached;
    }

    try {
      this.logger.info('PropFinderDataService', 'api', 'Fetching today\'s games from PropFinder API');
      
      const response = await fetch(
        `${this.API_BASE}/games/today?include_odds=${includeOdds}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result: PropFinderResponse<PropFinderGame[]> = await response.json();
      
      if (!result.success) {
        throw new Error(`API Error: ${result.message}`);
      }

      // Cache the result
      this.setCached(cacheKey, result.data, this.CACHE_TTL_GAMES);
      
      this.logger.info('PropFinderDataService', 'data', `Successfully fetched ${result.data.length} games`);

      return result.data;
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error('PropFinderDataService', 'api', 'Failed to fetch today\'s games', { error: errorMessage });
      throw new Error(`Failed to fetch games: ${errorMessage}`);
    }
  }

  /**
   * Get players for a specific game
   */
  public async getGamePlayers(gameId: number): Promise<PropFinderPlayer[]> {
    const cacheKey = `players_${gameId}`;
    
    // Check cache first
    const cached = this.getCached<PropFinderPlayer[]>(cacheKey);
    if (cached) {
      this.logger.debug('PropFinderDataService', 'cache', 'Returning cached players data');
      return cached;
    }

    try {
      this.logger.info('PropFinderDataService', 'api', 'Fetching game players from PropFinder API');
      
      const response = await fetch(
        `${this.API_BASE}/players/${gameId}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result: PropFinderResponse<PropFinderPlayer[]> = await response.json();
      
      if (!result.success) {
        throw new Error(`API Error: ${result.message}`);
      }

      // Cache the result
      this.setCached(cacheKey, result.data, this.CACHE_TTL_PLAYERS);
      
      this.logger.info('PropFinderDataService', 'data', `Successfully fetched ${result.data.length} players for game ${gameId}`);

      return result.data;
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error('PropFinderDataService', 'api', 'Failed to fetch game players', { gameId, error: errorMessage });
      throw new Error(`Failed to fetch players for game ${gameId}: ${errorMessage}`);
    }
  }

  /**
   * Get props for a specific game
   */
  public async getGameProps(
    gameId: number, 
    category?: string,
    minRating?: number
  ): Promise<PropFinderProp[]> {
    const cacheKey = `props_${gameId}_${category || 'all'}_${minRating || 0}`;
    
    // Check cache first
    const cached = this.getCached<PropFinderProp[]>(cacheKey);
    if (cached) {
      this.logger.debug('PropFinderDataService', 'cache', 'Returning cached props data');
      return cached;
    }

    try {
      this.logger.info('PropFinderDataService', 'api', `Fetching game props for game ${gameId}`);
      
      const params = new URLSearchParams({ 
        optimize_performance: 'true' 
      });
      if (category) params.append('category', category);

      const response = await fetch(
        `${this.API_BASE}/props/${gameId}?${params.toString()}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result: PropFinderResponse<PropFinderProp[]> = await response.json();
      
      if (!result.success) {
        throw new Error(`API Error: ${result.message}`);
      }

      // Filter by minimum rating if specified
      let filteredProps = result.data;
      if (minRating) {
        filteredProps = result.data.filter(prop => prop.pf_rating >= minRating);
      }

      // Cache the result
      this.setCached(cacheKey, filteredProps, this.CACHE_TTL_PROPS);
      
      this.logger.info('PropFinderDataService', 'data', `Successfully fetched ${filteredProps.length} props for game ${gameId}`);

      return filteredProps;
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error('PropFinderDataService', 'api', 'Failed to fetch game props', { gameId, error: errorMessage });
      throw new Error(`Failed to fetch props for game ${gameId}: ${errorMessage}`);
    }
  }

  /**
   * Get detailed statistics for a specific player
   */
  public async getPlayerStats(playerId: string): Promise<PlayerStats> {
    const cacheKey = `stats_${playerId}`;
    
    // Check cache first
    const cached = this.getCached<PlayerStats>(cacheKey);
    if (cached) {
      this.logger.debug('PropFinderDataService', 'cache', 'Returning cached player stats');
      return cached;
    }

    try {
      this.logger.info('PropFinderDataService', 'api', 'Fetching player stats from PropFinder API');
      
      const response = await fetch(
        `${this.API_BASE}/player/${playerId}/stats`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result: PropFinderResponse<PlayerStats> = await response.json();
      
      if (!result.success) {
        throw new Error(`API Error: ${result.message}`);
      }

      // Cache the result
      this.setCached(cacheKey, result.data, this.CACHE_TTL_STATS);
      
      this.logger.info('PropFinderDataService', 'data', `Successfully fetched player stats for ${playerId}`);

      return result.data;
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error('PropFinderDataService', 'api', 'Failed to fetch player stats', { playerId, error: errorMessage });
      throw new Error(`Failed to fetch stats for player ${playerId}: ${errorMessage}`);
    }
  }

  /**
   * Transform PropFinder props to match dashboard display format
   */
  public transformPropsForDisplay(props: PropFinderProp[]): PropDisplayFormat[] {
    return props.map(prop => ({
      id: prop.id,
      player: {
        id: prop.player_id,
        name: prop.player_name,
        team: prop.team,
        imageUrl: `https://img.mlbstatic.com/mlb-photos/image/upload/c_fill,g_auto/w_180,h_180/v1/people/${prop.player_id}/headshot/67/current`
      },
      category: prop.category,
      propType: prop.prop_type,
      line: prop.line,
      odds: {
        over: prop.over_odds,
        under: prop.under_odds
      },
      analysis: {
        pfRating: prop.pf_rating,
        recommendation: prop.recommendation,
        confidence: prop.confidence,
        l10Avg: prop.l10_avg,
        l5Avg: prop.l5_avg,
        trend: prop.recent_trend,
        valueRating: prop.value_rating
      },
      book: prop.book,
      sport: 'MLB' // PropFinder is MLB focused
    }));
  }

  /**
   * Calculate PF rating display formatting
   */
  public formatPFRating(rating: number): { value: number; class: string; label: string } {
    if (rating >= 85) {
      return { value: rating, class: 'pf-rating-excellent', label: 'STRONG' };
    } else if (rating >= 70) {
      return { value: rating, class: 'pf-rating-good', label: 'LEAN' };
    } else if (rating >= 50) {
      return { value: rating, class: 'pf-rating-average', label: 'FAIR' };
    } else {
      return { value: rating, class: 'pf-rating-poor', label: 'AVOID' };
    }
  }

  /**
   * Get recommendation styling based on prop analysis
   */
  public getRecommendationStyle(recommendation: string): { 
    backgroundColor: string; 
    textColor: string; 
    label: string 
  } {
    switch (recommendation) {
      case 'STRONG_BET':
        return {
          backgroundColor: '#22c55e',
          textColor: '#ffffff',
          label: 'STRONG BET'
        };
      case 'LEAN_BET':
        return {
          backgroundColor: '#3b82f6',
          textColor: '#ffffff',
          label: 'LEAN BET'
        };
      case 'AVOID':
        return {
          backgroundColor: '#ef4444',
          textColor: '#ffffff',
          label: 'AVOID'
        };
      default:
        return {
          backgroundColor: '#6b7280',
          textColor: '#ffffff',
          label: 'NEUTRAL'
        };
    }
  }

  /**
   * Cache management methods
   */
  private getCached<T>(key: string): T | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() < cached.timestamp + cached.ttl) {
      return cached.data as T;
    }
    if (cached) {
      this.cache.delete(key); // Remove expired cache
    }
    return null;
  }

  private setCached(key: string, data: unknown, ttl: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  private cleanupCache(): void {
    const now = Date.now();
    const toDelete: string[] = [];

    for (const [key, cached] of this.cache.entries()) {
      if (now >= cached.timestamp + cached.ttl) {
        toDelete.push(key);
      }
    }

    toDelete.forEach(key => this.cache.delete(key));
    
    if (toDelete.length > 0) {
      this.logger.debug('PropFinderDataService', 'cache', `Cleaned up ${toDelete.length} expired cache entries`);
    }
  }

  /**
   * Get comprehensive player statistics with advanced analytics
   */
  public async getPlayerComprehensiveStats(
    playerId: string,
    statType: string = 'hits',
    seasonYear?: number
  ): Promise<ComprehensiveStatsResponse> {
    const cacheKey = `comprehensive_stats_${playerId}_${statType}_${seasonYear}`;
    const cached = this.getCached(cacheKey) as ComprehensiveStatsResponse | null;
    if (cached) return cached;

    try {
      this.logger.info('PropFinderDataService', 'stats', `Fetching comprehensive stats for player ${playerId}`);
      
      const params = new URLSearchParams({
        stat_type: statType,
        ...(seasonYear && { season_year: seasonYear.toString() })
      });

      const response = await fetch(`/api/propfinder/player/${playerId}/comprehensive-stats?${params}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch comprehensive stats: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Cache for 5 minutes
      this.setCached(cacheKey, data, 5 * 60 * 1000);
      
      this.logger.debug('PropFinderDataService', 'stats', `Retrieved comprehensive stats for player ${playerId}`);
      return data;

    } catch (error) {
      this.logger.error('PropFinderDataService', 'stats', `Error fetching comprehensive stats for player ${playerId}:`, error);
      throw error;
    }
  }

  /**
   * Get comprehensive statistics for multiple players (batch processing)
   */
  public async getBatchPlayerStats(
    playerIds: string[],
    statType: string = 'hits'
  ): Promise<BatchStatsResponse> {
    const cacheKey = `batch_stats_${playerIds.join(',')}_${statType}`;
    const cached = this.getCached(cacheKey) as BatchStatsResponse | null;
    if (cached) return cached;

    try {
      this.logger.info('PropFinderDataService', 'stats', `Fetching batch stats for ${playerIds.length} players`);
      
      // Create query parameters for multiple player IDs
      const params = new URLSearchParams();
      playerIds.forEach(id => params.append('player_ids', id));
      params.append('stat_type', statType);

      const response = await fetch(`/api/propfinder/players/batch-stats?${params}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch batch stats: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Cache for 5 minutes
      this.setCached(cacheKey, data, 5 * 60 * 1000);
      
      this.logger.debug('PropFinderDataService', 'stats', `Retrieved batch stats for ${playerIds.length} players`);
      return data;

    } catch (error) {
      this.logger.error('PropFinderDataService', 'stats', `Error fetching batch stats for ${playerIds.length} players:`, error);
      throw error;
    }
  }

  /**
   * Transform comprehensive stats API response to PropFinder player format
   */
  public transformComprehensiveStats(statsResponse: ComprehensiveStatsResponse): PropFinderPlayer {
    try {
      const { player_id, player_name, team, position, statistics, metadata } = statsResponse;

      return {
        id: player_id,
        name: player_name,
        team: team || 'Unknown',
        position: position || 'Unknown',
        jersey_number: 0, // Will be populated from roster data
        image_url: `https://img.mlbstatic.com/mlb-photos/image/upload/c_fill,g_auto/w_180,h_180/v1/people/${player_id}/headshot/67/current`,
        pf_rating: statistics.pf_rating || 0,
        l10_avg: statistics.l10_avg || 0,
        l5_avg: statistics.l5_avg || 0,
        season_stats: {
          season_avg: statistics.season_avg || 0,
          games_played: metadata.games_played || 0,
          confidence: metadata.calculation_confidence || 0,
          quality: metadata.data_quality_score || 0
        },
        is_active: true,
        // Additional PropFinder-specific fields
        prop: 'hits', // Will be set based on selected prop type
        odds: '+100', // Will be populated from sportsbook data
        matchup: 'vs Opponent', // Will be populated from game data
        percentages: statistics.percentages || {
          '2024': 0,
          '2025': 0,
          'h2h': 0,
          'l5': 0,
          'last': 0,
          'l4': 0
        },
        streak: statistics.streak || 0,
        isFavorite: false
      };

    } catch (error) {
      this.logger.error('PropFinderDataService', 'transform', 'Error transforming comprehensive stats:', error);
      throw new Error('Failed to transform comprehensive stats data');
    }
  }

  /**
   * Enhanced getGameProps that uses comprehensive statistics
   */
  public async getEnhancedGameProps(
    gameId: number,
    propType: string = 'hits'
  ): Promise<PropFinderPlayer[]> {
    try {
      this.logger.info('PropFinderDataService', 'enhanced', `Fetching enhanced props for game ${gameId}`);

      // First get basic game props to extract player information
      const basicProps = await this.getGameProps(gameId);
      
      if (basicProps.length === 0) {
        return [];
      }

      // Extract player IDs from the props
      const playerIds = [...new Set(basicProps.map(prop => prop.player_id))];
      
      // Get comprehensive statistics for all players
      const batchStats = await this.getBatchPlayerStats(playerIds, propType);
      
      if (!batchStats.players) {
        this.logger.warn('PropFinderDataService', 'enhanced', 'No comprehensive stats returned from batch API');
        // Return empty array instead of mismatched types
        return [];
      }

      // Transform and enhance the player data
      const enhancedPlayers = batchStats.players.map((statsResponse: ComprehensiveStatsResponse) => {
        return this.transformComprehensiveStats(statsResponse);
      });

      this.logger.debug('PropFinderDataService', 'enhanced', `Enhanced ${enhancedPlayers.length} players with comprehensive stats`);
      return enhancedPlayers;

    } catch (error) {
      this.logger.error('PropFinderDataService', 'enhanced', `Error fetching enhanced props for game ${gameId}:`, error);
      // Return empty array on error instead of mismatched types
      return [];
    }
  }

  /**
   * Clear all cached data (useful for forcing refresh)
   */
  public clearCache(): void {
    this.cache.clear();
    this.logger.info('PropFinderDataService', 'cache', 'All cached data cleared');
  }

  /**
   * Get cache statistics
   */
  public getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

export default PropFinderDataService;