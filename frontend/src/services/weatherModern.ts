import { EventBus } from '@/unified/EventBus.js';
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
  async getCurrentWeather(location: string): Promise<any> {
    // TODO: Integrate with real weather API endpoints for current, historical, and alerts
    throw new Error('Weather API integration not implemented.');
  }

  /**
   * Get historical weather data;
   */

  async getHistoricalWeather(location: string, date: string): Promise<any> {
    // TODO: Replace with real API call
    throw new Error('Historical weather API integration not implemented.');
  }

  /**
   * Get weather alerts for a location;
   */

  async getWeatherAlerts(location: string): Promise<any> {
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
export const weatherService = new WeatherService();
