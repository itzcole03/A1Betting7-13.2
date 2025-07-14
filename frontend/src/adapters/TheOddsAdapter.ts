import { UnifiedMonitor } from '@/core/UnifiedMonitor';
import { DataSource } from '@/unified/DataSource';
import { EventBus } from '@/unified/EventBus';

interface TheOddsConfig {
  apiKey: string;
  baseUrl: string;
  cacheTimeout: number;
}

export interface TheOddsData {
  events: Array<{
    id: string;
    sport: string;
    commence_time: string;
    home_team: string;
    away_team: string;
    bookmakers: Array<{
      key: string;
      title: string;
      markets: Array<{
        key: string;
        outcomes: Array<{
          name: string;
          price: number;
          point?: number;
        }>;
      }>;
    }>;
  }>;
}

export class TheOddsAdapter implements DataSource<TheOddsData> {
  public readonly id = 'the-odds';
  public readonly type = 'betting-odds';

  private readonly eventBus: EventBus;
  private readonly monitor: UnifiedMonitor;
  private readonly config: TheOddsConfig;
  private cache: {
    data: TheOddsData | null;
    timestamp: number;
  };

  constructor(config: TheOddsConfig) {
    this.eventBus = EventBus.getInstance();
    this.monitor = UnifiedMonitor.getInstance();
    this.config = config;
    this.cache = {
      data: null,
      timestamp: 0,
    };
  }

  public async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch(`${this.config.baseUrl}/status?apiKey=${this.config.apiKey}`);
      return response.ok;
    } catch {
      return false;
    }
  }

  public async fetchData(): Promise<TheOddsData> {
    const trace = this.monitor.startTrace('the-odds-fetch', {
      category: 'adapter.fetch',
      description: 'Fetching odds data',
    });

    try {
      if (this.isCacheValid()) {
        this.monitor.endTrace(trace);
        return this.cache.data!;
      }

      const data = await this.fetchOddsData();

      this.cache = {
        data,
        timestamp: Date.now(),
      };

      // Update game status for each event
      for (const event of data.events) {
        await this.eventBus.publish('game:status', {
          game: {
            id: event.id,
            homeTeam: event.home_team,
            awayTeam: event.away_team,
            startTime: event.commence_time,
            status: 'scheduled',
          },
          timestamp: Date.now(),
        });
      }

      this.monitor.endTrace(trace);
      return data;
    } catch (error) {
      this.monitor.endTrace(trace, error as Error);
      throw error;
    }
  }

  private async fetchOddsData(): Promise<TheOddsData> {
    const response = await fetch(
      `${this.config.baseUrl}/odds?apiKey=${this.config.apiKey}&regions=us&markets=h2h,spreads,totals`
    );

    if (!response.ok) {
      throw new Error(`TheOdds API error: ${response.statusText}`);
    }

    return await response.json();
  }

  private isCacheValid(): boolean {
    return this.cache.data !== null && Date.now() - this.cache.timestamp < this.config.cacheTimeout;
  }

  public clearCache(): void {
    this.cache = {
      data: null,
      timestamp: 0,
    };
  }

  public async connect(): Promise<void> {
    // Implementation needed
  }

  public async disconnect(): Promise<void> {
    // Implementation needed
  }

  public async getData(): Promise<TheOddsData> {
    return this.cache.data as TheOddsData;
  }

  public isConnected(): boolean {
    return true;
  }

  public getMetadata(): Record<string, unknown> {
    return { id: this.id, type: this.type };
  }
}
