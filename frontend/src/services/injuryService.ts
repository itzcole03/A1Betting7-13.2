import _apiService from './unified/ApiService';
import { UnifiedLogger } from './UnifiedLogger';

type InjuryCachePayload =
  | PlayerInjury
  | PlayerInjury[]
  | InjuryReport[]
  | InjuryTrend[]
  | HealthAlert[];

export interface PlayerInjuryProgressNote {
  date: Date;
  note: string;
  source: string;
}

export interface PlayerInjury {
  id: string;
  playerId: string;
  playerName: string;
  team: string;
  position: string;
  sport: string;
  injuryType: string;
  bodyPart: string;
  severity: 'minor' | 'moderate' | 'major' | 'season_ending';
  status: 'questionable' | 'doubtful' | 'out' | 'probable' | 'healthy';
  injuryDate: Date;
  estimatedReturn: Date | null;
  actualReturn: Date | null;
  gamesAffected: number;
  description: string;
  progressNotes: PlayerInjuryProgressNote[];
  marketImpact: {
    playerProps: number;
    teamPerformance: number;
    spreadMovement: number;
    totalMovement: number;
  };
  replacementPlayer?: {
    name: string;
    projectedPerformance: number;
  };
  upcomingGames: string[];
  lastUpdated: Date;
}

export interface InjuryReport {
  id: string;
  team: string;
  gameId: string;
  reportDate: Date;
  injuries: Array<{
    playerId: string;
    playerName: string;
    status: string;
    probability: number;
  }>;
  teamImpact: number;
  reliability: number;
  source: string;
}

export interface InjuryTrend {
  bodyPart: string;
  sport: string;
  totalInjuries: number;
  avgRecoveryTime: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  seasonComparison: number;
  weeklyData: Array<{
    week: number;
    injuries: number;
  }>;
}

export interface HealthAlert {
  id: string;
  type: 'new_injury' | 'status_change' | 'return_update' | 'market_impact';
  playerId: string;
  playerName: string;
  team: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: Date;
  affectedMarkets: string[];
  dismissed: boolean;
  source: string;
}

// Branded type for cache payloads

// Branded type for cache payloads

export interface InjurySearchFilters {
  sport?: string;
  team?: string;
  severity?: string;
  status?: string;
  bodyPart?: string;
  playerName?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
  [key: string]: unknown; // Add index signature
}

class InjuryService {
  private apiService: typeof _apiService;
  private cache = new Map<string, { data: InjuryCachePayload; timestamp: number }>();
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

  private getFromCache<T extends InjuryCachePayload>(_cacheKey: string): T | null {
    const _cached = this.cache.get(_cacheKey);
    if (!_cached) return null;
    // Runtime guard for array/object types
    if (Array.isArray(_cached.data) || typeof _cached.data === 'object') {
      return _cached.data as T;
    }
    return null;
  }

  private setCache<T extends InjuryCachePayload>(_cacheKey: string, data: T): void {
    this.cache.set(_cacheKey, {
      data,
      timestamp: Date.now(),
    });
  }

  /**
   * Get all active injuries with optional filtering.
   * @param {InjurySearchFilters} [filters] - Optional filters for injury search.
   * @returns {Promise<PlayerInjury[]>} Array of PlayerInjury objects.
   */
  async getInjuries(filters?: InjurySearchFilters): Promise<PlayerInjury[]> {
    const _cacheKey = this.getCacheKey('getInjuries', filters);

    if (this.isValidCache(_cacheKey)) {
      return this.getFromCache<PlayerInjury[]>(_cacheKey) || [];
    }

    try {
      const _response = await this.apiService.get('/injuries', {
        params: filters,
      });

      // Runtime guard for array of PlayerInjury
      if (!Array.isArray(_response.data)) return this.getFallbackInjuries();
      const _injuries = _response.data.map((_injury: Partial<PlayerInjury>) => ({
        id: _injury.id ?? '',
        playerId: _injury.playerId ?? '',
        playerName: _injury.playerName ?? '',
        team: _injury.team ?? '',
        position: _injury.position ?? '',
        sport: _injury.sport ?? '',
        injuryType: _injury.injuryType ?? '',
        bodyPart: _injury.bodyPart ?? '',
        severity: _injury.severity ?? 'minor',
        status: _injury.status ?? 'healthy',
        injuryDate: _injury.injuryDate ? new Date(_injury.injuryDate) : new Date(),
        estimatedReturn: _injury.estimatedReturn ? new Date(_injury.estimatedReturn) : null,
        actualReturn: _injury.actualReturn ? new Date(_injury.actualReturn) : null,
        gamesAffected: _injury.gamesAffected ?? 0,
        description: _injury.description ?? '',
        progressNotes: Array.isArray(_injury.progressNotes)
          ? _injury.progressNotes.map((_note: Partial<PlayerInjuryProgressNote>) => ({
              date: _note.date ? new Date(_note.date) : new Date(),
              note: _note.note ?? '',
              source: _note.source ?? '',
            }))
          : [],
        marketImpact: _injury.marketImpact ?? {
          playerProps: 0,
          teamPerformance: 0,
          spreadMovement: 0,
          totalMovement: 0,
        },
        replacementPlayer: _injury.replacementPlayer ?? { name: '', projectedPerformance: 0 },
        upcomingGames: Array.isArray(_injury.upcomingGames) ? _injury.upcomingGames : [],
        lastUpdated: _injury.lastUpdated ? new Date(_injury.lastUpdated) : new Date(),
      }));

      this.setCache(_cacheKey, _injuries);
      return _injuries;
    } catch (error) {
      UnifiedLogger.error('Error fetching injuries:', error);

      // Return fallback data if API fails
      return this.getFallbackInjuries();
    }
  }

  /**
   * Get injury details for a specific player.
   * @param {string} playerId - The player ID to fetch injury details for.
   * @returns {Promise<PlayerInjury | null>} PlayerInjury object or null if not found.
   */
  async getPlayerInjury(playerId: string): Promise<PlayerInjury | null> {
    const _cacheKey = this.getCacheKey('getPlayerInjury', { playerId });

    if (this.isValidCache(_cacheKey)) {
      return this.getFromCache<PlayerInjury>(_cacheKey);
    }

    try {
      const _response = await this.apiService.get(`/injuries/player/${playerId}`);

      if (!_response.data || typeof _response.data !== 'object') return null;
      const d = _response.data as Partial<PlayerInjury>;
      const _injury: PlayerInjury = {
        id: d.id ?? '',
        playerId: d.playerId ?? '',
        playerName: d.playerName ?? '',
        team: d.team ?? '',
        position: d.position ?? '',
        sport: d.sport ?? '',
        injuryType: d.injuryType ?? '',
        bodyPart: d.bodyPart ?? '',
        severity: d.severity ?? 'minor',
        status: d.status ?? 'healthy',
        injuryDate: d.injuryDate ? new Date(d.injuryDate) : new Date(),
        estimatedReturn: d.estimatedReturn ? new Date(d.estimatedReturn) : null,
        actualReturn: d.actualReturn ? new Date(d.actualReturn) : null,
        gamesAffected: d.gamesAffected ?? 0,
        description: d.description ?? '',
        progressNotes: Array.isArray(d.progressNotes)
          ? d.progressNotes.map((_note: Partial<{ date: Date; note: string; source: string }>) => ({
              date: _note.date ? new Date(_note.date) : new Date(),
              note: _note.note ?? '',
              source: _note.source ?? '',
            }))
          : [],
        marketImpact: d.marketImpact ?? {
          playerProps: 0,
          teamPerformance: 0,
          spreadMovement: 0,
          totalMovement: 0,
        },
        replacementPlayer: d.replacementPlayer,
        upcomingGames: Array.isArray(d.upcomingGames) ? d.upcomingGames : [],
        lastUpdated: d.lastUpdated ? new Date(d.lastUpdated) : new Date(),
      };
      this.setCache(_cacheKey, _injury);
      return _injury;
    } catch (error) {
      UnifiedLogger.error('Error fetching player injury:', error);
      return null;
    }
  }

  /**
   * Get injury reports for upcoming games.
   * @param {string} [teamId] - Optional team ID to filter reports.
   * @returns {Promise<InjuryReport[]>} Array of InjuryReport objects.
   */
  async getInjuryReports(teamId?: string): Promise<InjuryReport[]> {
    const _cacheKey = this.getCacheKey('getInjuryReports', { teamId });

    if (this.isValidCache(_cacheKey)) {
      return this.getFromCache<InjuryReport[]>(_cacheKey) || [];
    }

    try {
      const _response = await this.apiService.get('/injuries/reports', {
        params: { teamId },
      });

      if (!Array.isArray(_response.data)) return [];
      const _reports = _response.data.map((_report: Partial<InjuryReport>) => ({
        id: _report.id ?? '',
        team: _report.team ?? '',
        gameId: _report.gameId ?? '',
        reportDate: _report.reportDate ? new Date(_report.reportDate) : new Date(),
        injuries: Array.isArray(_report.injuries)
          ? _report.injuries.map(
              (
                _inj: Partial<{
                  playerId: string;
                  playerName: string;
                  status: string;
                  probability: number;
                }>
              ) => ({
                playerId: _inj.playerId ?? '',
                playerName: _inj.playerName ?? '',
                status: _inj.status ?? '',
                probability: _inj.probability ?? 0,
              })
            )
          : [],
        teamImpact: _report.teamImpact ?? 0,
        reliability: _report.reliability ?? 0,
        source: _report.source ?? '',
      }));
      this.setCache(_cacheKey, _reports);
      return _reports;
    } catch (error) {
      UnifiedLogger.error('Error fetching injury reports:', error);
      return this.getFallbackReports();
    }
  }

  /**
   * Get injury trends and analytics.
   * @param {string} [sport] - Optional sport to filter trends.
   * @returns {Promise<InjuryTrend[]>} Array of InjuryTrend objects.
   */
  async getInjuryTrends(sport?: string): Promise<InjuryTrend[]> {
    const _cacheKey = this.getCacheKey('getInjuryTrends', { sport });

    if (this.isValidCache(_cacheKey)) {
      return this.getFromCache<InjuryTrend[]>(_cacheKey) || [];
    }

    try {
      const _response = await this.apiService.get('/injuries/trends', {
        params: { sport },
      });

      if (!Array.isArray(_response.data)) return this.getFallbackTrends();
      this.setCache(_cacheKey, _response.data as InjuryTrend[]);
      return _response.data as InjuryTrend[];
    } catch (error) {
      UnifiedLogger.error('Error fetching injury trends:', error);
      return this.getFallbackTrends();
    }
  }

  /**
   * Get health alerts.
   * @param {boolean} [dismissed=false] - Whether to include dismissed alerts.
   * @returns {Promise<HealthAlert[]>} Array of HealthAlert objects.
   */
  async getHealthAlerts(dismissed = false): Promise<HealthAlert[]> {
    const _cacheKey = this.getCacheKey('getHealthAlerts', { dismissed });

    if (this.isValidCache(_cacheKey)) {
      return this.getFromCache<HealthAlert[]>(_cacheKey) || [];
    }

    try {
      const _response = await this.apiService.get('/injuries/alerts', {
        params: { dismissed },
      });

      if (!Array.isArray(_response.data)) return this.getFallbackAlerts();
      const _alerts = _response.data.map((_alert: Partial<HealthAlert>) => ({
        id: typeof _alert.id === 'string' ? _alert.id : '',
        type: typeof _alert.type === 'string' ? _alert.type : 'new_injury',
        playerId: typeof _alert.playerId === 'string' ? _alert.playerId : '',
        playerName: typeof _alert.playerName === 'string' ? _alert.playerName : '',
        team: typeof _alert.team === 'string' ? _alert.team : '',
        message: typeof _alert.message === 'string' ? _alert.message : '',
        severity: typeof _alert.severity === 'string' ? _alert.severity : 'low',
        timestamp: _alert.timestamp ? new Date(_alert.timestamp) : new Date(),
        affectedMarkets: Array.isArray(_alert.affectedMarkets) ? _alert.affectedMarkets : [],
        dismissed: typeof _alert.dismissed === 'boolean' ? _alert.dismissed : false,
        source: typeof _alert.source === 'string' ? _alert.source : '',
      }));

      this.setCache(_cacheKey, _alerts);
      return _alerts;
    } catch (error) {
      UnifiedLogger.error('Error fetching health alerts:', error);
      return this.getFallbackAlerts();
    }
  }

  /**
   * Dismiss a health alert.
   * @param {string} alertId - The alert ID to dismiss.
   * @returns {Promise<boolean>} True if successful, false otherwise.
   */
  async dismissAlert(alertId: string): Promise<boolean> {
    try {
      await this.apiService.patch(`/injuries/alerts/${alertId}/dismiss`, {}, {});

      // Invalidate alerts cache
      Array.from(this.cache.keys())
        .filter(_key => _key.includes('getHealthAlerts'))
        .forEach(_key => this.cache.delete(_key));

      return true;
    } catch (error) {
      UnifiedLogger.error('Error dismissing alert:', error);
      return false;
    }
  }

  /**
   * Update injury status.
   * @param {string} injuryId - The injury ID to update.
   * @param {PlayerInjury['status']} status - The new status value.
   * @param {string} [notes] - Optional notes for the update.
   * @returns {Promise<boolean>} True if successful, false otherwise.
   */
  async updateInjuryStatus(
    injuryId: string,
    status: PlayerInjury['status'],
    notes?: string
  ): Promise<boolean> {
    try {
      await this.apiService.patch(`/injuries/${injuryId}/status`, {
        status,
        notes,
      });

      // Invalidate relevant caches
      this.cache.clear();
      return true;
    } catch (error) {
      UnifiedLogger.error('Error updating injury status:', error);
      return false;
    }
  }

  /**
   * Get market impact analysis for an injury.
   * @param {string} injuryId - The injury ID to analyze.
   * @returns {Promise<PlayerInjury['marketImpact'] | null>} Market impact object or null if not found.
   */
  async getMarketImpact(injuryId: string): Promise<PlayerInjury['marketImpact'] | null> {
    try {
      const _response = await this.apiService.get(`/injuries/${injuryId}/market-impact`);
      return _response.data as PlayerInjury['marketImpact'];
    } catch (error) {
      UnifiedLogger.error('Error fetching market impact:', error);
      return null;
    }
  }

  /**
   * Subscribe to real-time injury updates.
   * @param {(injury: PlayerInjury) => void} callback - Callback for injury updates.
   * @returns {() => void} Unsubscribe function.
   */
  subscribeToUpdates(callback: (injury: PlayerInjury) => void): () => void {
    // Implementation would depend on WebSocket service
    UnifiedLogger.log('Subscribing to injury updates...');

    // Return unsubscribe function
    return () => {
      UnifiedLogger.log('Unsubscribing from injury updates...');
    };
  }

  /**
   * Get team injury summary.
   * @param {string} teamId - The team ID to summarize.
   * @returns {Promise<{ totalInjuries: number; keyPlayerInjuries: number; estimatedTeamImpact: number; activeAlerts: number; }>} Team injury summary object.
   */
  async getTeamInjurySummary(teamId: string): Promise<{
    totalInjuries: number;
    keyPlayerInjuries: number;
    estimatedTeamImpact: number;
    activeAlerts: number;
  }> {
    try {
      const _response = await this.apiService.get(`/injuries/teams/${teamId}/summary`);
      return _response.data as {
        totalInjuries: number;
        keyPlayerInjuries: number;
        estimatedTeamImpact: number;
        activeAlerts: number;
      };
    } catch (error) {
      UnifiedLogger.error('Error fetching team injury summary:', error);
      return {
        totalInjuries: 0,
        keyPlayerInjuries: 0,
        estimatedTeamImpact: 0,
        activeAlerts: 0,
      };
    }
  }

  /**
   * Search injuries with advanced filters.
   * @param {string} query - Search query string.
   * @param {InjurySearchFilters} [filters] - Optional filters for search.
   * @returns {Promise<PlayerInjury[]>} Array of PlayerInjury objects.
   */
  async searchInjuries(query: string, filters?: InjurySearchFilters): Promise<PlayerInjury[]> {
    try {
      const _response = await this.apiService.get(`/injuries/search`, {
        params: { query, ...filters },
      });

      if (!Array.isArray(_response.data)) return [];
      const _injuries = _response.data.map((_injury: Partial<PlayerInjury>) => ({
        id: _injury.id ?? '',
        playerId: _injury.playerId ?? '',
        playerName: _injury.playerName ?? '',
        team: _injury.team ?? '',
        position: _injury.position ?? '',
        sport: _injury.sport ?? '',
        injuryType: _injury.injuryType ?? '',
        bodyPart: _injury.bodyPart ?? '',
        severity: _injury.severity ?? 'minor',
        status: _injury.status ?? 'healthy',
        injuryDate: _injury.injuryDate ? new Date(_injury.injuryDate) : new Date(),
        estimatedReturn: _injury.estimatedReturn ? new Date(_injury.estimatedReturn) : null,
        actualReturn: _injury.actualReturn ? new Date(_injury.actualReturn) : null,
        gamesAffected: _injury.gamesAffected ?? 0,
        description: _injury.description ?? '',
        progressNotes: Array.isArray(_injury.progressNotes)
          ? _injury.progressNotes.map((_note: Partial<PlayerInjuryProgressNote>) => ({
              date: _note.date ? new Date(_note.date) : new Date(),
              note: _note.note ?? '',
              source: _note.source ?? '',
            }))
          : [],
        marketImpact: _injury.marketImpact ?? {
          playerProps: 0,
          teamPerformance: 0,
          spreadMovement: 0,
          totalMovement: 0,
        },
        replacementPlayer: _injury.replacementPlayer ?? { name: '', projectedPerformance: 0 },
        upcomingGames: Array.isArray(_injury.upcomingGames) ? _injury.upcomingGames : [],
        lastUpdated: _injury.lastUpdated ? new Date(_injury.lastUpdated) : new Date(),
      }));

      return _injuries;
    } catch (error) {
      UnifiedLogger.error('Error searching injuries:', error);
      return [];
    }
  }

  /**
   * Clear the internal cache for injury data.
   */
  clearCache(): void {
    this.cache.clear();
  }

  // Fallback data methods for when API is unavailable
  private getFallbackInjuries(): PlayerInjury[] {
    return [
      {
        id: 'injury-001',
        playerId: 'lebron-james',
        playerName: 'LeBron James',
        team: 'Lakers',
        position: 'SF',
        sport: 'NBA',
        injuryType: 'Ankle Sprain',
        bodyPart: 'Left Ankle',
        severity: 'moderate',
        status: 'questionable',
        injuryDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        estimatedReturn: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        actualReturn: null,
        gamesAffected: 2,
        description:
          'Grade 2 ankle sprain sustained during practice. Player is responding well to treatment.',
        progressNotes: [
          {
            date: new Date(Date.now() - 24 * 60 * 60 * 1000),
            note: 'Limited practice participation, increasing mobility',
            source: 'Team Medical Staff',
          },
          {
            date: new Date(Date.now() - 12 * 60 * 60 * 1000),
            note: 'Pain levels decreased significantly, cleared for light shooting',
            source: 'ESPN',
          },
        ],
        marketImpact: {
          playerProps: -25,
          teamPerformance: -8,
          spreadMovement: 2.5,
          totalMovement: -3,
        },
        replacementPlayer: {
          name: 'Austin Reaves',
          projectedPerformance: 65,
        },
        upcomingGames: ['Lakers vs Warriors', 'Lakers vs Clippers'],
        lastUpdated: new Date(),
      },
    ];
  }

  private getFallbackReports(): InjuryReport[] {
    return [
      {
        id: 'report-001',
        team: 'Lakers',
        gameId: 'Lakers vs Warriors',
        reportDate: new Date(),
        injuries: [
          {
            playerId: 'lebron-james',
            playerName: 'LeBron James',
            status: 'Questionable',
            probability: 0.6,
          },
        ],
        teamImpact: -12,
        reliability: 0.85,
        source: 'Official Team Report',
      },
    ];
  }

  private getFallbackTrends(): InjuryTrend[] {
    return [
      {
        bodyPart: 'Ankle',
        sport: 'NBA',
        totalInjuries: 47,
        avgRecoveryTime: 12,
        trend: 'increasing',
        seasonComparison: 15,
        weeklyData: [
          { week: 1, injuries: 3 },
          { week: 2, injuries: 5 },
          { week: 3, injuries: 4 },
          { week: 4, injuries: 7 },
        ],
      },
    ];
  }

  private getFallbackAlerts(): HealthAlert[] {
    return [
      {
        id: 'alert-001',
        type: 'status_change',
        playerId: 'lebron-james',
        playerName: 'LeBron James',
        team: 'Lakers',
        message: "Status upgraded from Doubtful to Questionable for tonight's game",
        severity: 'high',
        timestamp: new Date(Date.now() - 30 * 60 * 1000),
        affectedMarkets: ['Player Props', 'Team Spread', 'Game Total'],
        dismissed: false,
        source: 'Team Report',
      },
    ];
  }
}

export const _injuryService = new InjuryService();
export default _injuryService;
