/**
 * Shared types and interfaces for PropOllama components
 */

export interface SelectedProp {
  id: string;
  player: string;
  statType: string;
  line: number | string;
  choice: string;
  odds: number;
  // Advanced analytics
  over_prob?: number;
  under_prob?: number;
  expected_value?: number;
  explanation?: string;
}

export interface ConnectionHealth {
  isHealthy: boolean;
  latency: number;
  lastChecked: number;
}

export interface UpcomingGame {
  game_id?: number;
  home: string;
  away: string;
  time: string;
  event_name: string;
  status?: string;
  venue?: string;
}

export interface SportActivationStatus {
  [sport: string]: {
    activated: boolean;
    error?: string;
    loading?: boolean;
  };
}

export interface LoadingStage {
  stage: 'fetching' | 'filtering' | 'sorting' | 'rendering' | 'complete';
  progress: number;
  message: string;
}

export interface PropFilters {
  selectedSport: string;
  propType: 'team' | 'player';
  selectedStatType: string;
  selectedDate: string;
  searchTerm: string;
  showUpcomingGames: boolean;
}

export interface PropSorting {
  sortBy:
    | 'confidence'
    | 'odds'
    | 'impact'
    | 'alphabetical'
    | 'recent'
    | 'manual'
    | 'analytics_score';
  sortOrder: 'asc' | 'desc';
}

/**
 * FeaturedProp - main prop analytics type
 */
export interface FeaturedProp {
  id: string;
  player: string;
  stat: string;
  line: number;
  confidence: number;
  matchup: string;
  espnPlayerId: string;
  position?: string;
  summary?: string;
  analysis?: string;
  stats?: { label: string; value: number }[];
  insights?: { icon: React.ReactNode; text: string }[];
  _originalData?: Record<string, unknown>;
  alternativeProps?: FeaturedProp[];
  over_prob?: number;
  under_prob?: number;
  expected_value?: number;
  explanation?: string;
}
export interface PropDisplayOptions {
  visiblePropsCount: number;
  useVirtualization: boolean;
  expandedRowKey: string | null;
}

export type SortByType =
  | 'confidence'
  | 'odds'
  | 'impact'
  | 'alphabetical'
  | 'recent'
  | 'manual'
  | 'analytics_score';

// Utility functions
export function safeCell(val: unknown): string {
  if (val === undefined || val === null) return '';
  if (typeof val === 'number' && isNaN(val)) return '';
  return String(val);
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

export function formatPercentage(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

// Main application state interface
export interface PropOllamaState {
  // Data
  visibleProjections: FeaturedProp[];
  selectedProps: SelectedProp[];
  upcomingGames: UpcomingGame[];
  availableSports: string[];
  selectedGameId: number | null;

  // UI State
  loading: boolean;
  loadingMessage: string;
  filters: PropFilters;
  sorting: PropSorting;
  ui: {
    expandedRowKey: string | null;
    visiblePropsCount: number;
  };

  // Performance
  connectionHealth: {
    status: 'healthy' | 'degraded' | 'error';
    latency: number;
    lastCheck: Date;
  };
  performanceMetrics: Record<string, number>;
  performanceSettings: {
    useVirtualization: boolean;
    forceVirtualization: boolean;
  };

  // Betting
  betting: {
    entryAmount: number;
  };

  // Analysis
  enhancedAnalysisCache: Record<string, FeaturedProp | undefined>;
  loadingAnalysis: Record<string, boolean>;
}

// Actions interface
export interface PropOllamaActions {
  // Filters
  updateFilters: (filters: Partial<PropFilters>) => void;

  // Sorting
  updateSorting: (sorting: Partial<PropSorting>) => void;

  // Data

  // Analysis
  loadingAnalysis: Record<string, boolean>;
  updateEntryAmount: (amount: number) => void;
  clearAllProps: () => void;
  placeBet: () => void;
}
