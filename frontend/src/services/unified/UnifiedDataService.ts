function isGameData(obj: unknown): obj is GameData {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof (obj as GameData).gameId === 'string' &&
    typeof (obj as GameData).homeTeam === 'string' &&
    typeof (obj as GameData).awayTeam === 'string' &&
    typeof (obj as GameData).startTime === 'string'
  );
}
function isSportsData(obj: unknown): obj is SportsData {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof (obj as SportsData).sport === 'string' &&
    Array.isArray((obj as SportsData).games) &&
    (obj as SportsData).games.every(isGameData)
  );
}

function isPlayerStat(obj: unknown): obj is PlayerStat {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof (obj as PlayerStat).statType === 'string' &&
    typeof (obj as PlayerStat).value === 'number'
  );
}
function isPlayerStats(obj: unknown): obj is PlayerStats {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof (obj as PlayerStats).playerId === 'string' &&
    Array.isArray((obj as PlayerStats).stats) &&
    (obj as PlayerStats).stats.every(isPlayerStat)
  );
}

function isRosterMember(obj: unknown): obj is RosterMember {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof (obj as RosterMember).playerId === 'string' &&
    typeof (obj as RosterMember).name === 'string' &&
    typeof (obj as RosterMember).position === 'string'
  );
}
function isTeamStat(obj: unknown): obj is TeamStat {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof (obj as TeamStat).statType === 'string' &&
    typeof (obj as TeamStat).value === 'number'
  );
}
function isTeamData(obj: unknown): obj is TeamData {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof (obj as TeamData).teamId === 'string' &&
    Array.isArray((obj as TeamData).roster) &&
    (obj as TeamData).roster.every(isRosterMember) &&
    Array.isArray((obj as TeamData).stats) &&
    (obj as TeamData).stats.every(isTeamStat)
  );
}
// Type interfaces for returned data
export type GameData = {
  gameId: string;
  homeTeam: string;
  awayTeam: string;
  startTime: string;
  [key: string]: string | number | boolean | undefined;
};
export interface SportsData {
  sport: string;
  games: GameData[];
}

export type PlayerStat = {
  statType: string;
  value: number;
  [key: string]: string | number | boolean | undefined;
};
export interface PlayerStats {
  playerId: string;
  stats: PlayerStat[];
}

export type RosterMember = {
  playerId: string;
  name: string;
  position: string;
  [key: string]: string | number | boolean | undefined;
};
export type TeamStat = {
  statType: string;
  value: number;
  [key: string]: string | number | boolean | undefined;
};
export interface TeamData {
  teamId: string;
  roster: RosterMember[];
  stats: TeamStat[];
}
import { BaseService } from './BaseService';
import { UnifiedCache } from './UnifiedCache';
import { UnifiedServiceRegistry } from './UnifiedServiceRegistry';

export class UnifiedDataService extends BaseService {
  private static instance: UnifiedDataService;
  protected cache: UnifiedCache;

  protected constructor() {
    super('UnifiedDataService', UnifiedServiceRegistry.getInstance());
    this.cache = UnifiedCache.getInstance();
  }

  static getInstance(): UnifiedDataService {
    if (!UnifiedDataService.instance) {
      UnifiedDataService.instance = new UnifiedDataService();
    }
    return UnifiedDataService.instance;
  }

  async fetchSportsData(sport: string, date?: string): Promise<SportsData> {
    try {
      const cacheKey = `sports_data_${sport}_${date || 'today'}`;
      const cached = this.cache.get<SportsData>(cacheKey);
      if (cached && isSportsData(cached)) return cached;

      const response = await this.get<SportsData>(
        `/api/sports/${sport}${date ? `?date=${date}` : ''}`
      );
      this.cache.set(cacheKey, response, 300000); // 5 min cache
      if (isSportsData(response)) return response;
      throw new Error('Invalid sports data response');
    } catch (error) {
      this.logger.error('Failed to fetch sports data', error);
      throw error;
    }
  }

  async fetchPlayerStats(playerId: string, sport: string): Promise<PlayerStats> {
    try {
      const cacheKey = `player_stats_${playerId}_${sport}`;
      const cached = this.cache.get<PlayerStats>(cacheKey);
      if (cached && isPlayerStats(cached)) return cached;

      const response = await this.get<PlayerStats>(`/api/players/${playerId}/stats?sport=${sport}`);
      this.cache.set(cacheKey, response, 600000); // 10 min cache
      if (isPlayerStats(response)) return response;
      throw new Error('Invalid player stats response');
    } catch (error) {
      this.logger.error('Failed to fetch player stats', error);
      throw error;
    }
  }

  async fetchTeamData(teamId: string, sport: string): Promise<TeamData> {
    try {
      const cacheKey = `team_data_${teamId}_${sport}`;
      const cached = this.cache.get<TeamData>(cacheKey);
      if (cached && isTeamData(cached)) return cached;

      const response = await this.get<TeamData>(`/api/teams/${teamId}?sport=${sport}`);
      this.cache.set(cacheKey, response, 600000); // 10 min cache
      if (isTeamData(response)) return response;
      throw new Error('Invalid team data response');
    } catch (error) {
      this.logger.error('Failed to fetch team data', error);
      throw error;
    }
  }

  async fetchLiveData<T extends object = GameData | PlayerStat | TeamStat>(
    sport: string
  ): Promise<T> {
    try {
      // No caching for live data
      const response = await this.get<T>(`/api/live/${sport}`);
      if (typeof response !== 'object' || response === null) {
        throw new Error('Invalid live data response');
      }
      return response;
    } catch (error) {
      this.logger.error('Failed to fetch live data', error);
      throw error;
    }
  }

  async searchData<T extends object = GameData[]>(
    query: string,
    filters: Partial<GameData | PlayerStat | TeamStat> = {}
  ): Promise<T> {
    try {
      const cacheKey = `search_${query}_${JSON.stringify(filters)}`;
      const cached = this.cache.get<T>(cacheKey);
      if (cached) return cached;

      const response = await this.post<T>('/api/search', { query, filters });
      if (typeof response !== 'object' || response === null) {
        throw new Error('Invalid search data response');
      }
      this.cache.set(cacheKey, response, 180000); // 3 min cache
      return response;
    } catch (error) {
      this.logger.error('Failed to search data', error);
      throw error;
    }
  }

  clearCache(pattern?: string): void {
    if (pattern) {
      const keys = this.cache.getKeys().filter(key => key.includes(pattern));
      keys.forEach(key => this.cache.delete(key));
    } else {
      this.cache.clear();
    }
    this.logger.info('Cache cleared', { pattern });
  }

  private async get<T>(url: string): Promise<T> {
    return this.api.get(url).then(response => response.data as T);
  }

  private async post<T>(url: string, data: object): Promise<T> {
    return this.api.post(url, data).then(response => response.data as T);
  }
}

export default UnifiedDataService;
