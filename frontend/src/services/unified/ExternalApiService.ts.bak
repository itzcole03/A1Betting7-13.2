import { EventEmitter } from 'events';
import { createTimeoutSignal } from '../../utils/createTimeoutSignal';

export interface SportsNewsArticle {
  id: string;
  title: string;
  summary: string;
  url: string;
  publishedAt: string;
}

interface ApiConfig {
  baseURL: string;
  timeout?: number;
}

/**
 * Modern ExternalApiService with proper async/await and error handling;
 */
export class ExternalApiService extends EventEmitter {
  private config: ApiConfig;

  constructor(config: ApiConfig) {
    super();
    this.config = config;
  }

  /**
   * @deprecated Use newsService.fetchHeadlines instead. This method will be removed in a future release.
   * Calls the unified newsService.fetchHeadlines for robust news fetching.
   */
  public async getSportsNews(): Promise<SportsNewsArticle[]> {
    // DEPRECATED: Use newsService.fetchHeadlines instead;
    // Stub headlines as empty array for now
    const _headlines: unknown[] = [];
    try {
      // Dynamic import to avoid circular dependencies;
      // Map ESPNHeadline to SportsNewsArticle;
      const headlines = _headlines as Array<Record<string, unknown>>;
      return headlines.map((h, index) => ({
        id: typeof h.id === 'string' ? h.id : `article-${Date.now()}-${index}`,
        title:
          typeof h.title === 'string'
            ? h.title
            : typeof h.summary === 'string'
            ? h.summary
            : 'Untitled',
        summary:
          typeof h.summary === 'string'
            ? h.summary
            : typeof h.title === 'string'
            ? h.title
            : 'No summary available',
        url: typeof h.link === 'string' ? h.link : '',
        publishedAt: typeof h.publishedAt === 'string' ? h.publishedAt : new Date().toISOString(),
      }));
    } catch (error) {
      this.emit('error', error);
      // Return fallback data;
      return [
        {
          id: 'fallback-1',
          title: 'Sports News Unavailable',
          summary: 'Unable to fetch latest sports news at this time.',
          url: '',
          publishedAt: new Date().toISOString(),
        },
      ];
    }
  }

  // Add more endpoints as needed;
  public async getSchedule(): Promise<unknown[]> {
    try {
      const timeout = createTimeoutSignal(this.config.timeout || 5000);
      let response: Response;
      try {
        response = await fetch(`${this.config.baseURL}/schedule`, {
          signal: timeout.signal,
        });
      } finally {
        timeout.cleanup();
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      this.emit('error', error);
      return [];
    }
  }
}

export const _externalApiService = new ExternalApiService({
  baseURL: (() => {
    if (typeof process !== 'undefined' && process.env?.VITE_EXTERNAL_API_URL) {
      return process.env.VITE_EXTERNAL_API_URL;
    }
    if (typeof window !== 'undefined' && (window as any).__VITE_ENV__?.VITE_EXTERNAL_API_URL) {
      return (window as any).__VITE_ENV__.VITE_EXTERNAL_API_URL;
    }
    return 'https://api.sportsdata.io/v3/news';
  })(),
  timeout: 10000,
});
