/**
 * Standardized TypeScript types for betting components
 * Following A1Betting Component Coding Standards
 */

// Base betting data types
export interface BettingOpportunity {
  id: string;
  player: string;
  team: string;
  opponent: string;
  sport: 'NBA' | 'NFL' | 'MLB' | 'NHL' | 'MLS' | 'NCAA';
  market: string;
  line: number;
  pick: 'over' | 'under' | 'yes' | 'no';
  odds: number;
  impliedProbability: number;
  aiProbability: number;
  confidence: number;
  expectedValue: number;
  edge: number;
  riskLevel: 'low' | 'medium' | 'high' | 'extreme';
  venue: 'home' | 'away';
  timeToGame: string;
  bookmaker: string;
  lastUpdate: string;
}

export interface BetSlipItem {
  id: string;
  opportunityId: string;
  opportunity: BettingOpportunity;
  stake: number;
  potentialPayout: number;
  addedAt: string;
}

export interface BetSlip {
  items: BetSlipItem[];
  totalStake: number;
  totalPotentialPayout: number;
  totalOdds: number;
  maxPayout: number;
}

// Component prop interfaces following {ComponentName}Props pattern
export interface BetSlipComponentProps {
  selectedProps: BetSlipItem[];
  entryAmount: number;
  onRemoveProp: (propId: string) => void;
  onEntryAmountChange: (amount: number) => void;
  onClearSlip: () => void;
  onPlaceBet: () => void;
  isLoading?: boolean;
  className?: string;
}

export interface BettingOpportunityCardProps {
  opportunity: BettingOpportunity;
  onSelect: (opportunity: BettingOpportunity) => void;
  onQuickBet: (opportunity: BettingOpportunity, stake: number) => void;
  isSelected?: boolean;
  isDisabled?: boolean;
  variant?: 'default' | 'compact' | 'expanded';
  className?: string;
}

export interface BettingDashboardProps {
  opportunities: BettingOpportunity[];
  betSlip: BetSlip;
  onOpportunitySelect: (opportunity: BettingOpportunity) => void;
  onBetSlipUpdate: (betSlip: BetSlip) => void;
  filters: BettingFilters;
  onFiltersChange: (filters: BettingFilters) => void;
  isLoading?: boolean;
  className?: string;
}

export interface BettingFilters {
  sports: string[];
  markets: string[];
  confidenceRange: [number, number];
  edgeRange: [number, number];
  riskLevels: RiskLevel[];
  bookmakers: string[];
  timeToGameMax: number;
  minOdds: number;
  maxOdds: number;
  showOnlyPositiveEV: boolean;
  sortBy: BettingSortOption;
  sortOrder: 'asc' | 'desc';
}

export interface BettingHistoryProps {
  bets: HistoricalBet[];
  onBetSelect: (bet: HistoricalBet) => void;
  filters: BettingHistoryFilters;
  onFiltersChange: (filters: BettingHistoryFilters) => void;
  isLoading?: boolean;
  className?: string;
}

export interface BettingAnalyticsProps {
  data: BettingAnalyticsData;
  timeRange: TimeRange;
  onTimeRangeChange: (range: TimeRange) => void;
  refreshInterval?: number;
  className?: string;
}

// Supporting types
export type RiskLevel = 'low' | 'medium' | 'high' | 'extreme';

export type BettingSortOption = 
  | 'confidence' 
  | 'expectedValue' 
  | 'edge' 
  | 'timeToGame' 
  | 'odds' 
  | 'alphabetical';

export type TimeRange = '1d' | '7d' | '30d' | '90d' | '1y' | 'all';

export type BetStatus = 'pending' | 'won' | 'lost' | 'cancelled' | 'partial';

export interface HistoricalBet {
  id: string;
  opportunities: BettingOpportunity[];
  totalStake: number;
  potentialPayout: number;
  actualPayout: number;
  status: BetStatus;
  placedAt: string;
  settledAt?: string;
  roi: number;
  profit: number;
}

export interface BettingHistoryFilters {
  status: BetStatus[];
  dateRange: [string, string];
  minStake: number;
  maxStake: number;
  sports: string[];
  profitOnly: boolean;
  sortBy: 'placedAt' | 'settledAt' | 'stake' | 'profit' | 'roi';
  sortOrder: 'asc' | 'desc';
}

export interface BettingAnalyticsData {
  totalBets: number;
  totalStake: number;
  totalProfit: number;
  winRate: number;
  roi: number;
  averageOdds: number;
  profitByDay: Array<{ date: string; profit: number }>;
  winRateByMonth: Array<{ month: string; winRate: number }>;
  profitBySport: Array<{ sport: string; profit: number }>;
  profitByMarket: Array<{ market: string; profit: number }>;
  recentBets: HistoricalBet[];
}

// Event handler types
export type BettingEventHandler<T = void> = (data: T) => void | Promise<void>;

export interface BettingEventHandlers {
  onOpportunitySelect: BettingEventHandler<BettingOpportunity>;
  onBetPlace: BettingEventHandler<BetSlip>;
  onBetRemove: BettingEventHandler<string>;
  onFiltersChange: BettingEventHandler<BettingFilters>;
  onStakeChange: BettingEventHandler<{ opportunityId: string; stake: number }>;
}

// Hook return types
export interface UseBettingStateReturn {
  opportunities: BettingOpportunity[];
  betSlip: BetSlip;
  filters: BettingFilters;
  isLoading: boolean;
  error: string | null;
  actions: {
    addToBetSlip: (opportunity: BettingOpportunity, stake: number) => void;
    removeFromBetSlip: (opportunityId: string) => void;
    clearBetSlip: () => void;
    updateFilters: (filters: Partial<BettingFilters>) => void;
    placeBet: () => Promise<void>;
    refetch: () => Promise<void>;
  };
}

export interface UseBettingAnalyticsReturn {
  data: BettingAnalyticsData | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

// Form types
export interface BetFormData {
  opportunities: string[];
  stakes: Record<string, number>;
  betType: 'single' | 'multiple' | 'system';
  totalStake: number;
  notes?: string;
}

export interface BettingFormProps {
  initialData?: Partial<BetFormData>;
  onSubmit: (data: BetFormData) => Promise<void>;
  onCancel: () => void;
  availableOpportunities: BettingOpportunity[];
  isSubmitting?: boolean;
  className?: string;
}

// Configuration types
export interface BettingConfig {
  maxStakePerBet: number;
  maxTotalStake: number;
  defaultStake: number;
  autoAcceptOddsChanges: boolean;
  riskManagement: {
    maxDailyLoss: number;
    maxWeeklyLoss: number;
    stopLossPercentage: number;
  };
  notifications: {
    oddChanges: boolean;
    betSettlement: boolean;
    profitTargets: boolean;
  };
}

export interface BettingSettingsProps {
  config: BettingConfig;
  onConfigChange: (config: BettingConfig) => void;
  onSave: () => Promise<void>;
  onReset: () => void;
  isSaving?: boolean;
  className?: string;
}

// Error types
export interface BettingError {
  code: string;
  message: string;
  details?: Record<string, any>;
  timestamp: string;
}

export type BettingErrorType = 
  | 'NETWORK_ERROR'
  | 'API_ERROR'
  | 'VALIDATION_ERROR'
  | 'INSUFFICIENT_FUNDS'
  | 'ODDS_CHANGED'
  | 'BET_REJECTED'
  | 'LIMIT_EXCEEDED';

// API response types
export interface BettingApiResponse<T> {
  data: T;
  success: boolean;
  error?: BettingError;
  timestamp: string;
}

export interface PlaceBetResponse {
  betId: string;
  status: BetStatus;
  acceptedStake: number;
  acceptedOdds: number;
  estimatedPayout: number;
  message?: string;
}
