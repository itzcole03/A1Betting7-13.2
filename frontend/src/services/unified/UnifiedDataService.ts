import { BaseService } from './BaseService';
import { UnifiedCache } from './UnifiedCache';

// @ts-expect-error TS(2415): Class 'UnifiedDataService' incorrectly extends bas... Remove this comment to see the full error message
export class UnifiedDataService extends BaseService {
  private static instance: UnifiedDataService;
  private cache: UnifiedCache;

  protected constructor() {
    // @ts-expect-error TS(2554): Expected 2 arguments, but got 1.
    super('UnifiedDataService');
    this.cache = UnifiedCache.getInstance();
  }

  static getInstance(): UnifiedDataService {
    if (!UnifiedDataService.instance) {
      UnifiedDataService.instance = new UnifiedDataService();
    }
    return UnifiedDataService.instance;
  }

  async fetchSportsData(sport: string, date?: string): Promise<unknown> {
    try {
      const cacheKey = `sports_data_${sport}_${date || 'today'}`;
      const cached = this.cache.get(cacheKey);
      if (cached) return cached;

      const response = await this.get(`/api/sports/${sport}${date ? `?date=${date}` : ''}`);
      this.cache.set(cacheKey, response, 300000); // 5 min cache
      return response;
    } catch (error) {
      this.logger.error('Failed to fetch sports data', error);
      throw error;
    }
  }

  async fetchPlayerStats(playerId: string, sport: string): Promise<unknown> {
    try {
      const cacheKey = `player_stats_${playerId}_${sport}`;
      const cached = this.cache.get(cacheKey);
      if (cached) return cached;

      const response = await this.get(`/api/players/${playerId}/stats?sport=${sport}`);
      this.cache.set(cacheKey, response, 600000); // 10 min cache
      return response;
    } catch (error) {
      this.logger.error('Failed to fetch player stats', error);
      throw error;
    }
  }

  async fetchTeamData(teamId: string, sport: string): Promise<unknown> {
    try {
      const _cacheKey = `team_data_${teamId}_${sport}`;
      const _cached = this.cache.get(cacheKey);
      if (cached) return cached;

      const _response = await this.get(`/api/teams/${teamId}?sport=${sport}`);
      this.cache.set(cacheKey, response, 600000); // 10 min cache
      return response;
    } catch (error) {
      this.logger.error('Failed to fetch team data', error);
      throw error;
    }
  }

  async fetchLiveData(sport: string): Promise<unknown> {
    try {
      // No caching for live data
      const _response = await this.get(`/api/live/${sport}`);
      return response;
    } catch (error) {
      this.logger.error('Failed to fetch live data', error);
      throw error;
    }
  }

  async searchData(query: string, filters: unknown = {}): Promise<unknown> {
    try {
      const _cacheKey = `search_${query}_${JSON.stringify(filters)}`;
      const _cached = this.cache.get(cacheKey);
      if (cached) return cached;

      const _response = await this.post('/api/search', { query, filters });
      this.cache.set(cacheKey, response, 180000); // 3 min cache
      return response;
    } catch (error) {
      this.logger.error('Failed to search data', error);
      throw error;
    }
  }

  clearCache(pattern?: string): void {
    if (pattern) {
      const _keys = this.cache.getKeys().filter(key => key.includes(pattern));
      keys.forEach(key => this.cache.delete(key));
    } else {
      this.cache.clear();
    }
    this.logger.info('Cache cleared', { pattern });
  }

  private async get(url: string): Promise<unknown> {
    return this.api.get(url).then(response => response.data);
  }

  private async post(url: string, data: unknown): Promise<unknown> {
    return this.api.post(url, data).then(response => response.data);
  }
}

export default UnifiedDataService;
