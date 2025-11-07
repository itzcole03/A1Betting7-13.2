import { DataSource } from '@/core/DataSource.js';
interface TheOddsConfig {
  apiKey: string;
  baseUrl: string;
  cacheTimeout: number;
}
export interface TheOddsData {
  events: {
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
  }[];
}
export declare class TheOddsAdapter implements DataSource<TheOddsData> {
  readonly id: string;
  readonly type: string;
  private readonly eventBus;
  private readonly performanceMonitor;
  private readonly config;
  private cache;
  constructor(config: TheOddsConfig);
  isAvailable(): Promise<boolean>;
  fetch(): Promise<TheOddsData>;
  private fetchOddsData;
  private isCacheValid;
  clearCache(): void;
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  getData(): Promise<TheOddsData>;
  isConnected(): boolean;
  getMetadata(): Record<string, unknown>;
}
