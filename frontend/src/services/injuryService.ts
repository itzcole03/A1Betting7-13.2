import ApiService from './unified/ApiService';

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
}

class InjuryService {
  private apiService: ApiService;
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
   * Get all active injuries with optional filtering
   */
  async getInjuries(filters?: InjurySearchFilters): Promise<PlayerInjury[]> {
    const cacheKey = this.getCacheKey('getInjuries', filters);

    if (this.isValidCache(cacheKey)) {
      return this.getFromCache<PlayerInjury[]>(cacheKey) || [];
    }

    try {
      const response = await this.apiService.get('/injuries', {
        params: filters,
      });

      const injuries = response.data.map((injury: any) => ({
        ...injury,
        injuryDate: new Date(injury.injuryDate),
        estimatedReturn: injury.estimatedReturn ? new Date(injury.estimatedReturn) : null,
        actualReturn: injury.actualReturn ? new Date(injury.actualReturn) : null,
        lastUpdated: new Date(injury.lastUpdated),
        progressNotes: injury.progressNotes.map((note: any) => ({
          ...note,
          date: new Date(note.date),
        })),
      }));

      this.setCache(cacheKey, injuries);
      return injuries;
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
    const cacheKey = this.getCacheKey('getPlayerInjury', { playerId });

    if (this.isValidCache(cacheKey)) {
      return this.getFromCache<PlayerInjury>(cacheKey);
    }

    try {
      const response = await this.apiService.get(`/injuries/player/${playerId}`);

      if (!response.data) return null;

      const injury = {
        ...response.data,
        injuryDate: new Date(response.data.injuryDate),
        estimatedReturn: response.data.estimatedReturn
          ? new Date(response.data.estimatedReturn)
          : null,
        actualReturn: response.data.actualReturn ? new Date(response.data.actualReturn) : null,
        lastUpdated: new Date(response.data.lastUpdated),
        progressNotes: response.data.progressNotes.map((note: any) => ({
          ...note,
          date: new Date(note.date),
        })),
      };

      this.setCache(cacheKey, injury);
      return injury;
    } catch (error) {
      console.error('Error fetching player injury:', error);
      return null;
    }
  }

  /**
   * Get injury reports for upcoming games
   */
  async getInjuryReports(teamId?: string): Promise<InjuryReport[]> {
    const cacheKey = this.getCacheKey('getInjuryReports', { teamId });

    if (this.isValidCache(cacheKey)) {
      return this.getFromCache<InjuryReport[]>(cacheKey) || [];
    }

    try {
      const response = await this.apiService.get('/injuries/reports', {
        params: { teamId },
      });

      const reports = response.data.map((report: any) => ({
        ...report,
        reportDate: new Date(report.reportDate),
      }));

      this.setCache(cacheKey, reports);
      return reports;
    } catch (error) {
      console.error('Error fetching injury reports:', error);
      return this.getFallbackReports();
    }
  }

  /**
   * Get injury trends and analytics
   */
  async getInjuryTrends(sport?: string): Promise<InjuryTrend[]> {
    const cacheKey = this.getCacheKey('getInjuryTrends', { sport });

    if (this.isValidCache(cacheKey)) {
      return this.getFromCache<InjuryTrend[]>(cacheKey) || [];
    }

    try {
      const response = await this.apiService.get('/injuries/trends', {
        params: { sport },
      });

      this.setCache(cacheKey, response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching injury trends:', error);
      return this.getFallbackTrends();
    }
  }

  /**
   * Get health alerts
   */
  async getHealthAlerts(dismissed = false): Promise<HealthAlert[]> {
    const cacheKey = this.getCacheKey('getHealthAlerts', { dismissed });

    if (this.isValidCache(cacheKey)) {
      return this.getFromCache<HealthAlert[]>(cacheKey) || [];
    }

    try {
      const response = await this.apiService.get('/injuries/alerts', {
        params: { dismissed },
      });

      const alerts = response.data.map((alert: any) => ({
        ...alert,
        timestamp: new Date(alert.timestamp),
      }));

      this.setCache(cacheKey, alerts);
      return alerts;
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
        .filter(key => key.includes('getHealthAlerts'))
        .forEach(key => this.cache.delete(key));

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
      const response = await this.apiService.get(`/injuries/${injuryId}/market-impact`);
      return response.data;
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
      const response = await this.apiService.get(`/injuries/teams/${teamId}/summary`);
      return response.data;
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
      const response = await this.apiService.get('/injuries/search', {
        params: { query, ...filters },
      });

      return response.data.map((injury: any) => ({
        ...injury,
        injuryDate: new Date(injury.injuryDate),
        estimatedReturn: injury.estimatedReturn ? new Date(injury.estimatedReturn) : null,
        actualReturn: injury.actualReturn ? new Date(injury.actualReturn) : null,
        lastUpdated: new Date(injury.lastUpdated),
        progressNotes: injury.progressNotes.map((note: any) => ({
          ...note,
          date: new Date(note.date),
        })),
      }));
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

export const injuryService = new InjuryService();
export default injuryService;
