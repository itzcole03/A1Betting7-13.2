import {
  PrizePicksData,
  PrizePicksLeague,
  PrizePicksPlayer,
  PrizePicksProjection,
} from '../types/prizePicksUnified';
import {
  PrizePicksAPI,
  PrizePicksAPIResponse,
  RawPrizePicksIncludedLeague,
  RawPrizePicksIncludedPlayer,
  RawPrizePicksProjection,
} from './../api/PrizePicksAPI'; // Updated import path
import { UnifiedMonitor } from './../core/UnifiedMonitor'; // Updated import path

interface PrizePicksAdapterConfig {
  apiKey?: string; // VITE_PRIZEPICKS_API_KEY - made optional
  baseUrl?: string; // Optional: api.prizepicks.com is default in PrizePicksAPI
  cacheTimeout?: number; // Milliseconds, e.g., 5 minutes
  defaultLeagueId?: string; // e.g., NBA league ID for default fetches
}

export class PrizePicksAdapter {
  public readonly id = 'prize-picks';
  public readonly type = 'sports-projections';

  private readonly prizePicksApi: PrizePicksAPI;
  private readonly config: PrizePicksAdapterConfig;
  private readonly unifiedMonitor: UnifiedMonitor;
  private cache: {
    data: PrizePicksData | null;
    timestamp: number;
  };

  constructor(config: PrizePicksAdapterConfig) {
    this.config = {
      cacheTimeout: 300000, // Default 5 minutes
      apiKey: '', // Explicitly pass empty string if not provided
      ...config,
    };
    this.prizePicksApi = new PrizePicksAPI({
      apiKey: this.config.apiKey || '', // Ensure string, not undefined
      baseUrl: this.config.baseUrl || 'https://api.prizepicks.com',
    });
    this.unifiedMonitor = UnifiedMonitor.getInstance();
    this.cache = {
      data: null,
      timestamp: 0,
    };
  }

  public async isAvailable(): Promise<boolean> {
    // return Boolean(this.config.apiKey); // No longer dependent on API key
    return true; // Assume available for scraping
  }

  public async fetch(): Promise<PrizePicksData> {
    const trace = this.unifiedMonitor.startTrace('PrizePicksAdapter.fetch');

    try {
      if (this.isCacheValid()) {
        return this.cache.data!;
      }

      // Fetch data from API
      const apiResponse = await this.prizePicksApi.getProjections();
      const transformedData = this.transformData(apiResponse);

      this.cache = {
        data: transformedData,
        timestamp: Date.now(),
      };

      this.unifiedMonitor.endTrace(trace);
      return transformedData;
    } catch (error) {
      this.unifiedMonitor.endTrace(trace);
      throw error;
    }
  }

  private transformData(
    apiResponse: PrizePicksAPIResponse<RawPrizePicksProjection>
  ): PrizePicksData {
    const includedPlayersMap = new Map<string, PrizePicksPlayer>();
    const includedLeaguesMap = new Map<string, PrizePicksLeague>();

    if (apiResponse.included) {
      apiResponse.included.forEach((item: any) => {
        if (item.type === 'new_player') {
          const rawPlayer = item as RawPrizePicksIncludedPlayer;
          includedPlayersMap.set(rawPlayer.id, {
            id: rawPlayer.id,
            name: rawPlayer.attributes.name,
            team: rawPlayer.attributes.team_name,
            position: rawPlayer.attributes.position,
            image_url: rawPlayer.attributes.image_url,
          });
        } else if (item.type === 'league') {
          const rawLeague = item as RawPrizePicksIncludedLeague;
          includedLeaguesMap.set(rawLeague.id, {
            id: rawLeague.id,
            name: rawLeague.attributes.name,
            sport: rawLeague.attributes.sport,
            abbreviation: rawLeague.attributes.abbreviation || rawLeague.attributes.name,
            active: rawLeague.attributes.active ?? true,
          });
        }
      });
    }

    const projections: PrizePicksProjection[] = apiResponse.data.map((rawProj: any) => {
      const playerId: string = rawProj.relationships?.new_player?.data?.id || '';
      let playerDetail: PrizePicksPlayer;
      const fallbackPlayer: PrizePicksPlayer = {
        id: playerId,
        name: 'Unknown Player',
        team: 'Unknown Team',
        position: 'Unknown',
        image_url: '',
        league: '',
        sport: '',
      };
      playerDetail = includedPlayersMap.get(playerId) || fallbackPlayer;

      return {
        id: String(rawProj.id),
        player_id: playerId,
        player: playerDetail,
        player_name: playerDetail.name,
        team: playerDetail.team,
        position: playerDetail.position,
        league: playerDetail.league || 'Unknown League',
        sport: playerDetail.sport || 'Unknown Sport',
        stat_type: String(rawProj.attributes.stat_type),
        line_score: Number(rawProj.attributes.line_score),
        over_odds:
          typeof rawProj.attributes.over_odds === 'number' ? rawProj.attributes.over_odds : 1.0,
        under_odds:
          typeof rawProj.attributes.under_odds === 'number' ? rawProj.attributes.under_odds : 1.0,
        description: String(rawProj.attributes.description || ''),
        start_time: String(rawProj.attributes.start_time),
        status: String(rawProj.attributes.status || 'active'),
        rank: Number(rawProj.attributes.rank || 0),
        is_promo: Boolean(rawProj.attributes.is_promo),
        confidence:
          typeof rawProj.attributes.confidence === 'number' ? rawProj.attributes.confidence : 0.5,
        market_efficiency:
          typeof rawProj.attributes.market_efficiency === 'number'
            ? rawProj.attributes.market_efficiency
            : 0.5,
      };
    });

    return {
      projections: projections,
      players: Array.from(includedPlayersMap.values()),
      leagues: Array.from(includedLeaguesMap.values()),
      lastUpdated: new Date().toISOString(),
    };
  }

  private isCacheValid(): boolean {
    if (!this.cache.data) return false;
    const age = Date.now() - this.cache.timestamp;
    return age < (this.config.cacheTimeout || 0);
  }

  public clearCache(): void {
    this.cache = { data: null, timestamp: 0 };
  }

  public async connect(): Promise<void> {
    /* No-op */
  }

  public async disconnect(): Promise<void> {
    /* No-op */
  }

  public async getData(): Promise<PrizePicksData> {
    if (!this.cache.data) {
      // Attempt to fetch if no data is available, common for initial load or if cache cleared
      return await this.fetch();
    }
    return this.cache.data;
  }

  public isConnected(): boolean {
    return true;
  }

  public getMetadata(): Record<string, unknown> {
    return {
      id: this.id,
      type: this.type,
      description: 'Adapter for PrizePicks projection data',
      defaultLeagueId: this.config.defaultLeagueId,
    };
  }
}
