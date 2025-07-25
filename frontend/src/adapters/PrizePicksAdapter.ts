import {
  PrizePicksData,
  PrizePicksLeague,
  PrizePicksPlayer,
  PrizePicksProjection,
} from '@/types/prizePicksUnified';
import {
  PrizePicksAPI,
  PrizePicksAPIResponse,
  RawPrizePicksIncludedLeague,
  RawPrizePicksIncludedPlayer,
  RawPrizePicksProjection,
} from './../api/PrizePicksAPI'; // Updated import path
import { unifiedMonitor } from './../core/UnifiedMonitor'; // Updated import path

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
      apiKey: this.config.apiKey, // This will be an empty string if not in .env
      baseUrl: this.config.baseUrl || 'https://api.prizepicks.com',
    });
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
    const _trace = unifiedMonitor.startTrace('PrizePicksAdapter.fetch', {
      category: 'adapter.fetch',
    });

    try {
      if (this.isCacheValid()) {
        return this.cache.data!;
      }

      // Fetch data from API
      const _apiResponse = await this.prizePicksApi.getProjections();
      const _transformedData = this.transformData(apiResponse);

      this.cache = {
        data: transformedData,
        timestamp: Date.now(),
      };

      unifiedMonitor.endTrace(trace);
      return transformedData;
    } catch (error) {
      unifiedMonitor.endTrace(trace);
      throw error;
    }
  }

  private transformData(
    apiResponse: PrizePicksAPIResponse<RawPrizePicksProjection>
  ): PrizePicksData {
    const _includedPlayersMap = new Map<string, PrizePicksPlayer>();
    const _includedLeaguesMap = new Map<string, PrizePicksLeague>();

    if (apiResponse.included) {
      apiResponse.included.forEach((item: unknown) => {
        if (item.type === 'new_player') {
          const _rawPlayer = item as RawPrizePicksIncludedPlayer;
          includedPlayersMap.set(rawPlayer.id, {
            id: rawPlayer.id,
            name: rawPlayer.attributes.name,
            team: rawPlayer.attributes.team_name,
            position: rawPlayer.attributes.position,
            image_url: rawPlayer.attributes.image_url,
          });
        } else if (item.type === 'league') {
          const _rawLeague = item as RawPrizePicksIncludedLeague;
          includedLeaguesMap.set(rawLeague.id, {
            id: rawLeague.id,
            name: rawLeague.attributes.name,
            sport: rawLeague.attributes.sport,
          });
        }
      });
    }

    const _projections: PrizePicksProjection[] = apiResponse.data.map((rawProj: unknown) => {
      const _playerId = rawProj.relationships?.new_player?.data?.id || '';
      const _playerDetail = includedPlayersMap.get(playerId);

      return {
        id: rawProj.id,
        playerId: playerId,
        player: playerDetail,
        statType: rawProj.attributes.stat_type,
        line: rawProj.attributes.line_score,
        description: rawProj.attributes.description,
        startTime: rawProj.attributes.start_time,
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
    const _age = Date.now() - this.cache.timestamp;
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
