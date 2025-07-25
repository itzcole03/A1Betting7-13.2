import _apiService from './unified/ApiService';

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
  progressNotes: Array<{
    date: Date;
    note: string;
    source: string;
  }>;
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
  [key: string]: any; // Add index signature
}

class InjuryService {
  private apiService: typeof _apiService;
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  constructor() {
    this.apiService = _apiService;
  }

  private getCacheKey(method: string, params?: any): string {
    return `${method}_${JSON.stringify(params || {})}`;
  }

  private isValidCache(_cacheKey: string): boolean {
    const _cached = this.cache.get(_cacheKey);
    if (!_cached) return false;
    return Date.now() - _cached.timestamp < this.CACHE_TTL;
  }

  private getFromCache<T>(_cacheKey: string): T | null {
    const _cached = this.cache.get(_cacheKey);
    return _cached ? _cached.data : null;
  }

  private setCache(_cacheKey: string, data: any): void {
    this.cache.set(_cacheKey, {
      data,
      timestamp: Date.now(),
    });
  }

  /**
   * Get all active injuries with optional filtering
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

      const _injuries = (_response.data as any[]).map((_injury: any) => ({
        id: _injury.id,
        playerId: _injury.playerId,
        playerName: _injury.playerName,
        team: _injury.team,
        position: _injury.position,
        sport: _injury.sport,
        injuryType: _injury.injuryType,
        bodyPart: _injury.bodyPart,
        severity: _injury.severity,
        status: _injury.status,
        injuryDate: new Date(_injury.injuryDate),
        estimatedReturn: _injury.estimatedReturn ? new Date(_injury.estimatedReturn) : null,
        actualReturn: _injury.actualReturn ? new Date(_injury.actualReturn) : null,
        gamesAffected: _injury.gamesAffected,
        description: _injury.description,
        progressNotes: (_injury.progressNotes || []).map((_note: any) => ({
          date: new Date(_note.date),
          note: _note.note,
          source: _note.source,
        })),
        marketImpact: _injury.marketImpact,
        replacementPlayer: _injury.replacementPlayer,
        upcomingGames: _injury.upcomingGames,
        lastUpdated: new Date(_injury.lastUpdated),
      }));

      this.setCache(_cacheKey, _injuries);
      return _injuries;
    } catch (error) {
      console.error('Error fetching injuries:', error);

      // Return fallback data if API fails
      return this.getFallbackInjuries();
    }
  }

  /**
   * Get injury details for a specific player
   */
  async getPlayerInjury(playerId: string): Promise<PlayerInjury | null> {
    const _cacheKey = this.getCacheKey('getPlayerInjury', { playerId });

    if (this.isValidCache(_cacheKey)) {
      return this.getFromCache<PlayerInjury>(_cacheKey);
    }

    try {
      const _response = await this.apiService.get(`/injuries/player/${playerId}`);

      if (!_response.data) return null;

      const _injuryData = _response.data as any; // Cast to any for easier property access
      const _injury: PlayerInjury = {
        id: _injuryData.id,
        playerId: _injuryData.playerId,
        playerName: _injuryData.playerName,
        team: _injuryData.team,
        position: _injuryData.position,
        sport: _injuryData.sport,
        injuryType: _injuryData.injuryType,
        bodyPart: _injuryData.bodyPart,
        severity: _injuryData.severity,
        status: _injuryData.status,
        injuryDate: new Date(_injuryData.injuryDate),
        estimatedReturn: _injuryData.estimatedReturn ? new Date(_injuryData.estimatedReturn) : null,
        actualReturn: _injuryData.actualReturn ? new Date(_injuryData.actualReturn) : null,
        gamesAffected: _injuryData.gamesAffected,
        description: _injuryData.description,
        progressNotes: (_injuryData.progressNotes || []).map((_note: any) => ({
          date: new Date(_note.date),
          note: _note.note,
          source: _note.source,
        })),
        marketImpact: _injuryData.marketImpact,
        replacementPlayer: _injuryData.replacementPlayer,
        upcomingGames: _injuryData.upcomingGames,
        lastUpdated: new Date(_injuryData.lastUpdated),
      };

      this.setCache(_cacheKey, _injury);
      return _injury;
    } catch (error) {
      console.error('Error fetching player injury:', error);
      return null;
    }
  }

  /**
   * Get injury reports for upcoming games
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

      const _reports = (_response.data as any[]).map((_report: any) => ({
        id: _report.id,
        team: _report.team,
        gameId: _report.gameId,
        reportDate: new Date(_report.reportDate),
        injuries: (_report.injuries || []).map((_inj: any) => ({
          playerId: _inj.playerId,
          playerName: _inj.playerName,
          status: _inj.status,
          probability: _inj.probability,
        })),
        teamImpact: _report.teamImpact,
        reliability: _report.reliability,
        source: _report.source,
      }));

      this.setCache(_cacheKey, _reports);
      return _reports;
    } catch (error) {
      console.error('Error fetching injury reports:', error);
      return this.getFallbackReports();
    }
  }

  /**
   * Get injury trends and analytics
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

      this.setCache(_cacheKey, _response.data);
      return _response.data as InjuryTrend[];
    } catch (error) {
      console.error('Error fetching injury trends:', error);
      return this.getFallbackTrends();
    }
  }

  /**
   * Get health alerts
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

      const _alerts = (_response.data as any[]).map((_alert: any) => ({
        id: _alert.id,
        type: _alert.type,
        playerId: _alert.playerId,
        playerName: _alert.playerName,
        team: _alert.team,
        message: _alert.message,
        severity: _alert.severity,
        timestamp: new Date(_alert.timestamp),
        affectedMarkets: _alert.affectedMarkets,
        dismissed: _alert.dismissed,
        source: _alert.source,
      }));

      this.setCache(_cacheKey, _alerts);
      return _alerts;
    } catch (error) {
      console.error('Error fetching health alerts:', error);
      return this.getFallbackAlerts();
    }
  }

  /**
   * Dismiss a health alert
   */
  async dismissAlert(alertId: string): Promise<boolean> {
    try {
      await this.apiService.patch(`/injuries/alerts/${alertId}/dismiss`);

      // Invalidate alerts cache
      Array.from(this.cache.keys())
        .filter(_key => _key.includes('getHealthAlerts'))
        .forEach(_key => this.cache.delete(_key));

      return true;
    } catch (error) {
      console.error('Error dismissing alert:', error);
      return false;
    }
  }

  /**
   * Update injury status
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
      console.error('Error updating injury status:', error);
      return false;
    }
  }

  /**
   * Get market impact analysis for an injury
   */
  async getMarketImpact(injuryId: string): Promise<PlayerInjury['marketImpact'] | null> {
    try {
      const _response = await this.apiService.get(`/injuries/${injuryId}/market-impact`);
      return _response.data as PlayerInjury['marketImpact'];
    } catch (error) {
      console.error('Error fetching market impact:', error);
      return null;
    }
  }

  /**
   * Subscribe to real-time injury updates
   */
  subscribeToUpdates(callback: (injury: PlayerInjury) => void): () => void {
    // Implementation would depend on WebSocket service
    console.log('Subscribing to injury updates...');

    // Return unsubscribe function
    return () => {
      console.log('Unsubscribing from injury updates...');
    };
  }

  /**
   * Get team injury summary
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
      console.error('Error fetching team injury summary:', error);
      return {
        totalInjuries: 0,
        keyPlayerInjuries: 0,
        estimatedTeamImpact: 0,
        activeAlerts: 0,
      };
    }
  }

  /**
   * Search injuries with advanced filters
   */
  async searchInjuries(query: string, filters?: InjurySearchFilters): Promise<PlayerInjury[]> {
    try {
      const _response = await this.apiService.get(`/injuries/search`, {
        params: { query, ...filters },
      });

      const _injuries = (_response.data as any[]).map((_injury: any) => ({
        id: _injury.id,
        playerId: _injury.playerId,
        playerName: _injury.playerName,
        team: _injury.team,
        position: _injury.position,
        sport: _injury.sport,
        injuryType: _injury.injuryType,
        bodyPart: _injury.bodyPart,
        severity: _injury.severity,
        status: _injury.status,
        injuryDate: new Date(_injury.injuryDate),
        estimatedReturn: _injury.estimatedReturn ? new Date(_injury.estimatedReturn) : null,
        actualReturn: _injury.actualReturn ? new Date(_injury.actualReturn) : null,
        gamesAffected: _injury.gamesAffected,
        description: _injury.description,
        progressNotes: (_injury.progressNotes || []).map((_note: any) => ({
          date: new Date(_note.date),
          note: _note.note,
          source: _note.note,
        })),
        marketImpact: _injury.marketImpact,
        replacementPlayer: _injury.replacementPlayer,
        upcomingGames: _injury.upcomingGames,
        lastUpdated: new Date(_injury.lastUpdated),
      }));

      return _injuries;
    } catch (error) {
      console.error('Error searching injuries:', error);
      return [];
    }
  }

  /**
   * Clear cache
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
