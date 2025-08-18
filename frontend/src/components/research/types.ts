// Types for Research Dashboard components

export interface GamePerformance {
  date: string;
  opponent: string;
  stats: Record<string, number>;
  gameResult: 'W' | 'L';
  venue: 'HOME' | 'AWAY';
}

export interface UpcomingGameInfo {
  opponent: string;
  time: string;
  venue: 'home' | 'away';
  date?: string;
}

export interface InjuryStatus {
  status: 'healthy' | 'questionable' | 'day-to-day' | 'out' | 'ir';
  lastUpdate: Date;
  description?: string;
}

export interface TrendData {
  metric: string;
  direction: 'up' | 'down' | 'stable';
  percentage: number;
  period: string;
}

export interface AdvancedMetrics {
  wOBA?: number;
  xwOBA?: number;
  hardHitRate?: number;
  barrelRate?: number;
  exitVelocity?: number;
  launchAngle?: number;
  [key: string]: number | undefined;
}
