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
export function safeCell(val: any): string {
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
  visibleProjections: any[];
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
  enhancedAnalysisCache: Record<string, any>;
  loadingAnalysis: Record<string, boolean>;
}

// Actions interface
export interface PropOllamaActions {
  // Filters
  updateFilters: (filters: Partial<PropFilters>) => void;

  // Sorting
  updateSorting: (sorting: Partial<PropSorting>) => void;

  // UI
  toggleExpand: (key: string) => void;

  // Data
  selectGame: (gameId: number) => void;
  requestEnhancedAnalysis: (prop: any) => void;

  // Betting
  addProp: (prop: SelectedProp) => void;
  removeProp: (propId: string) => void;
  updateEntryAmount: (amount: number) => void;
  clearAllProps: () => void;
  placeBet: () => void;
}
