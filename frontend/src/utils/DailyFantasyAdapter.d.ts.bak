// import { DataSource } from '@/core/DataSource.ts';
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
export declare class DailyFantasyAdapter /* implements DataSource<DailyFantasyData> */ {
  readonly id = 'daily-fantasy';
  readonly type = 'sports-projections';
  private readonly eventBus;
  private readonly performanceMonitor;
  private readonly config;
  private cache;
  constructor(config: DailyFantasyConfig);
  isAvailable(): Promise<boolean>;
  fetch(): Promise<DailyFantasyData>;
  private isCacheValid;
  clearCache(): void;
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  getData(): Promise<DailyFantasyData>;
  isConnected(): boolean;
  getMetadata(): Record<string, unknown>;
}
