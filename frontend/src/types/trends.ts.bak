// Trends-related type definitions

export type TrendMetric = 'over_hit_rate' | 'avg_ev' | 'arbitrage_count' | 'high_confidence_rate';
export type SportFilter = 'ALL' | 'MLB' | 'NBA' | 'NFL' | 'NHL';
export type MarketTypeFilter = 'all' | 'player_props' | 'team_totals' | 'spreads' | 'moneylines';

export interface TrendLeaderboardEntry {
  playerId: string;
  playerName: string;
  team?: string;
  sport: string;
  marketType: string;
  overHitRate: number;
  avgEv: number;
  arbitrageCount: number;
  highConfidenceRate: number;
  totalProps: number;
  samplePeriodDays: number;
  lastUpdated: string;
  rank?: number;
}

export interface TrendLeaderboardFilters {
  metric: TrendMetric;
  sport: SportFilter;
  marketType: MarketTypeFilter;
  minSamples: number;
  periodDays: number;
  limit: number;
}

export interface TrendLeaderboardResponse {
  success: boolean;
  data: TrendLeaderboardEntry[];
  filters: TrendLeaderboardFilters;
  metadata: Record<string, unknown>;
  totalEntries: number;
  cacheTimestamp?: string;
  error?: string;
}

export interface TrendStatsSummary {
  totalPlayers: number;
  totalPropsAnalyzed: number;
  sportsCovered: string[];
  dateRange: {
    startDate: string;
    endDate: string;
  };
  topPerformers: Record<string, TrendLeaderboardEntry>;
  cacheStatus: Record<string, unknown>;
}

export interface TrendCacheStatus {
  lastComputed: string;
  nextRefresh: string;
  cacheHitRate: number;
  entriesCached: number;
  computationTimeMs: number;
}

export interface AvailableMetricsResponse {
  success: boolean;
  metrics: Record<
    string,
    {
      name: string;
      description: string;
      unit: string;
      higherIsBetter: boolean;
    }
  >;
  sports: string[];
  marketTypes: string[];
}

// UI-specific types
export interface SortConfig {
  field: keyof TrendLeaderboardEntry;
  direction: 'asc' | 'desc';
}

export interface FilterState {
  metric: TrendMetric;
  sport: SportFilter;
  marketType: MarketTypeFilter;
  minSamples: number;
  periodDays: number;
  searchTerm: string;
  minHitRate: number;
  minAvgEv: number;
  arbitrageOnly: boolean;
  highConfidenceOnly: boolean;
}

export interface TrendsTableColumn {
  key: keyof TrendLeaderboardEntry;
  label: string;
  sortable: boolean;
  format?: (value: unknown) => string;
  className?: string;
}
