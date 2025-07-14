// import { DataSource } from '@/core/DataSource.ts';
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
export declare class ESPNAdapter /* implements DataSource<ESPNData> */ {
  readonly id: string;
  readonly type: string;
  private readonly eventBus;
  private readonly performanceMonitor;
  private cache;
  constructor();
  isAvailable(): Promise<boolean>;
  fetch(): Promise<ESPNData>;
  private fetchGames;
  private fetchHeadlines;
  private isCacheValid;
  clearCache(): void;
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  getData(): Promise<ESPNData>;
  isConnected(): boolean;
  getMetadata(): Record<string, unknown>;
}
