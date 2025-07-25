import type { EventBus } from '../core/EventBus';

export interface ESPNGame {
  id: string;
  homeTeam: string;
  awayTeam: string;
  startTime: string;
  status: string;
}

export interface ESPNHeadline {
  title: string;
  link: string;
  pubDate: string;
}

export interface ESPNData {
  games: ESPNGame[];
  headlines: ESPNHeadline[];
}

export class ESPNAdapter {
  public readonly id = 'espn';
  public readonly type = 'sports-news';
  private readonly eventBus: EventBus;
  private cache: {
    data: ESPNData | null;
    timestamp: number;
  };

  constructor(eventBus: EventBus) {
    this.eventBus = eventBus;
    this.cache = {
      data: null,
      timestamp: 0,
    };
  }

  public async isAvailable(): Promise<boolean> {
    return true;
  }

  public async fetch(): Promise<ESPNData> {
    const _startTime = Date.now(); // Simple timing for performance
    if (this.isCacheValid()) {
      return this.cache.data!;
    }
    const [games, headlines] = await Promise.all([this.fetchGames(), this.fetchHeadlines()]);
    const _data: ESPNData = { games, headlines };
    this.cache = { data, timestamp: Date.now() };
    this.eventBus.emit('espn-updated', { data });
    // Log fetch duration
    const _duration = Date.now() - startTime;
    // console.log(`[ESPNAdapter] Fetch completed in ${duration}ms`);
    return data;
  }

  private async fetchGames(): Promise<ESPNGame[]> {
    const _url = 'https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard';
    try {
      const _response = await fetch(url);
      const _json = await response.json();
      return (json.events || []).map((event: unknown) => {
        const _eventData = event as Record<string, unknown>;
        const _competitions = eventData.competitions as unknown[];
        const _competitors = (competitions?.[0] as Record<string, unknown>)
          ?.competitors as unknown[];
        const _homeCompetitor = competitors?.find(
          (c: unknown) => (c as Record<string, unknown>).homeAway === 'home'
        ) as Record<string, unknown> | undefined;
        const _awayCompetitor = competitors?.find(
          (c: unknown) => (c as Record<string, unknown>).homeAway === 'away'
        ) as Record<string, unknown> | undefined;
        return {
          id: eventData.id as string,
          homeTeam:
            ((homeCompetitor?.team as Record<string, unknown>)?.displayName as string) || '',
          awayTeam:
            ((awayCompetitor?.team as Record<string, unknown>)?.displayName as string) || '',
          startTime: eventData.date as string,
          status: ((eventData.status as Record<string, unknown>)?.type as Record<string, unknown>)
            ?.name as string,
        };
      });
    } catch {
      return [];
    }
  }

  private async fetchHeadlines(): Promise<ESPNHeadline[]> {
    const _url = 'https://www.espn.com/espn/rss/nba/news';
    try {
      const _response = await fetch(url);
      const _text = await response.text();
      const _parser = new DOMParser();
      const _xml = parser.parseFromString(text, 'text/xml');
      const _items = xml.querySelectorAll('item');
      return Array.from(items).map(item => {
        const _title = item.querySelector('title')?.textContent || '';
        const _link = item.querySelector('link')?.textContent || '';
        const _pubDate = item.querySelector('pubDate')?.textContent || '';
        return { title, link, pubDate };
      });
    } catch {
      return [];
    }
  }

  private isCacheValid(): boolean {
    const _cacheTimeout = 5 * 60 * 1000; // 5 minutes
    return this.cache.data !== null && Date.now() - this.cache.timestamp < cacheTimeout;
  }

  public clearCache(): void {
    this.cache = { data: null, timestamp: 0 };
  }

  public async connect(): Promise<void> {
    // Implementation for connection
  }

  public async disconnect(): Promise<void> {
    // Implementation for disconnection
  }

  public async getData(): Promise<ESPNData> {
    return this.cache.data as ESPNData;
  }

  public isConnected(): boolean {
    return true;
  }

  public getMetadata(): Record<string, unknown> {
    return { id: this.id, type: this.type };
  }

  /**
   * Alias for fetch() to match DataSource interface.
   */
  public async fetchData(): Promise<ESPNData> {
    return this.fetch();
  }
}
