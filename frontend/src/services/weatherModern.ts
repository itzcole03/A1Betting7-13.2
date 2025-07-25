// @ts-expect-error TS(2307): Cannot find module '@/unified/EventBus.js' or its ... Remove this comment to see the full error message
import { EventBus } from '@/unified/EventBus.js';
// @ts-expect-error TS(2307): Cannot find module '@/types/core.js' or its corres... Remove this comment to see the full error message
import type { WeatherData } from '@/types/core.js';

export class WeatherService {
  private readonly eventBus: EventBus;
  private cache = new Map<string, { data: WeatherData; timestamp: number }>();
  private readonly CACHE_TTL = 600000; // 10 minutes;

  constructor() {
    this.eventBus = EventBus.getInstance();
  }

  /**
   * Get current weather for a location;
   */
  async getCurrentWeather(location: string): Promise<unknown> {
    // TODO: Integrate with real weather API endpoints for current, historical, and alerts
    throw new Error('Weather API integration not implemented.');
  }

  /**
   * Get historical weather data;
   */

  async getHistoricalWeather(location: string, date: string): Promise<unknown> {
    // TODO: Replace with real API call
    throw new Error('Historical weather API integration not implemented.');
  }

  /**
   * Get weather alerts for a location;
   */

  async getWeatherAlerts(location: string): Promise<unknown> {
    // TODO: Replace with real API call
    throw new Error('Weather alerts API integration not implemented.');
  }

  /**
   * Get cached data if still valid;
   */
  private getCachedData(key: string): WeatherData | null {
    // This method is no longer used as the cache is removed.
    return null;
  }
}

// Export singleton instance;
export const _weatherService = new WeatherService();
