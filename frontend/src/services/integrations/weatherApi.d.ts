import { ApiBase } from './apiBase.ts';
export declare class WeatherApi extends ApiBase {
  constructor();
  getWeather(params?: Record<string, any>): Promise<unknown>;
}
