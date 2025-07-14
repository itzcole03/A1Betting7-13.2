import { UnifiedMonitor } from '@/core/UnifiedMonitor';
import { DataSource } from '@/unified/DataSource';
import { EventBus } from '@/unified/EventBus';

interface DailyFantasyConfig {
  apiKey: string;
  baseUrl: string;
  cacheTimeout: number;
}

export interface DailyFantasyData {
  projections: {
    name: string;
    team: string;
    position: string;
    opp_team: string;
    game_date: string;
    is_home: boolean;
    pts: number;
    reb: number;
    ast: number;
    stl: number;
    blk: number;
    three_pt: number;
    min: number;
  }[];
}

export class DailyFantasyAdapter implements DataSource<DailyFantasyData> {
  public readonly id = 'daily-fantasy';
  public readonly type = 'sports-projections';

  private readonly eventBus: EventBus;
  private readonly monitor: UnifiedMonitor;
  private readonly config: DailyFantasyConfig;
  private cache: {
    data: DailyFantasyData | null;
    timestamp: number;
  };

  constructor(config: DailyFantasyConfig) {
    this.eventBus = EventBus.getInstance();
    this.monitor = UnifiedMonitor.getInstance();
    this.config = config;
    this.cache = {
      data: null,
      timestamp: 0,
    };
  }

  /**
   * Fetches real daily fantasy projections from the configured API.
   * @returns DailyFantasyData with projections array.
   */
  public async fetchData(): Promise<DailyFantasyData> {
    const trace = this.monitor.startTrace('daily-fantasy-fetch', {
      category: 'adapter.fetch',
      description: 'Fetching daily fantasy data',
    });

    try {
      // Check cache first
      if (this.isCacheValid()) {
        this.monitor.endTrace(trace);
        return this.cache.data!;
      }

      const response = await fetch(`${this.config.baseUrl}/nba/projections`, {
        headers: {
          Authorization: `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // Update cache
      this.cache = {
        data,
        timestamp: Date.now(),
      };

      // Update game status for each projection
      for (const projection of data.projections) {
        await this.eventBus.publish({
          type: 'player:update',
          payload: {
            player: {
              id: projection.name.toLowerCase().replace(/\s+/g, '-'),
              name: projection.name,
              team: projection.team,
              position: projection.position,
              stats: {
                pts: projection.pts,
                reb: projection.reb,
                ast: projection.ast,
                stl: projection.stl,
                blk: projection.blk,
                three_pt: projection.three_pt,
                min: projection.min,
              },
            },
            timestamp: Date.now(),
          },
        });
      }

      this.monitor.endTrace(trace);
      return data;
    } catch (error) {
      this.monitor.endTrace(trace, error as Error);
      throw error;
    }
  }

  public async isAvailable(): Promise<boolean> {
    return Boolean(this.config.apiKey);
  }

  private isCacheValid(): boolean {
    if (!this.cache.data) return false;
    const age = Date.now() - this.cache.timestamp;
    return age < this.config.cacheTimeout;
  }

  public clearCache(): void {
    this.cache = {
      data: null,
      timestamp: 0,
    };
  }

  public async connect(): Promise<void> {
    // Implementation for connection
  }

  public async disconnect(): Promise<void> {
    // Implementation for disconnection
  }

  public async getData(): Promise<DailyFantasyData> {
    return this.cache.data as DailyFantasyData;
  }

  public isConnected(): boolean {
    return true;
  }

  public getMetadata(): Record<string, unknown> {
    return { id: this.id, type: this.type };
  }
}

// RESOLVED: Update EventMap in ../types/core to include 'daily-fantasy:data-updated' and 'social-sentiment-updated' event types for type safety.
