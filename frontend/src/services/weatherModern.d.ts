import type { WeatherData } from '@/types/core.js';
export declare class WeatherService {
  private readonly eventBus;
  private readonly config;
  private cache;
  private readonly CACHE_TTL;
  constructor();
  /**
   * Get current weather for a location;
   */
  getCurrentWeather(location: string): Promise<WeatherData>;
  /**
   * Get historical weather data;
   */
  getHistoricalWeather(_location: string, _date: string): Promise<WeatherData>;
  /**
   * Get weather alerts for a location;
   */
  getWeatherAlerts(_location: string): Promise<WeatherData['alerts']>;
  /**
   * Get cached data if still valid;
   */
  private getCachedData;
}
export declare const weatherService: WeatherService;
