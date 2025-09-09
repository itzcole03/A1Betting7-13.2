/**
 * +EV Feed Types for Frontend
 * 
 * TypeScript type definitions for the positive Expected Value (EV) feed system.
 * Matches backend models for type safety across the stack.
 */

export enum SportType {
  MLB = "MLB",
  NBA = "NBA",
  NFL = "NFL", 
  NHL = "NHL",
  ALL = "ALL"
}

export enum EVTier {
  LOW = "LOW",       // 3-5% EV
  MEDIUM = "MEDIUM", // 5-8% EV
  HIGH = "HIGH",     // 8-12% EV
  EXTREME = "EXTREME" // 12%+ EV
}

export enum MarketType {
  MONEYLINE = "moneyline",
  SPREAD = "spread",
  TOTAL = "total",
  PLAYER_PROPS = "player_props",
  TEAM_PROPS = "team_props"
}

export interface EVOpportunity {
  /** Unique identifier for the opportunity */
  id: string;
  /** Player name (or team for team bets) */
  player: string;
  /** Market description (e.g., 'Points Over 25.5') */
  market: string;
  /** Sport type */
  sport: SportType;
  /** Market category */
  market_type: MarketType;
  
  // Odds and EV calculation
  /** Our calculated fair odds */
  our_fair_odds: number;
  /** Market odds from sportsbook */
  market_odds: number;
  /** Expected value percentage */
  ev_percent: number;
  
  // Source and metadata
  /** Source sportsbook */
  source_book: string;
  /** Game context (e.g., 'Yankees @ Red Sox') */
  game_info: string;
  /** Last update timestamp */
  updated_at: string;
  
  // Additional context
  /** Confidence in fair odds calculation */
  confidence_score?: number;
  /** Betting volume indicator */
  volume_indicator?: string;
  /** Recent line movement */
  line_movement?: string;
  
  // Computed properties
  /** EV tier for badge coloring */
  ev_tier: EVTier;
  /** Market implied probability */
  implied_probability: number;
  /** Fair implied probability */
  fair_implied_probability: number;
  /** Fine-grained edge tier (micro|solid|strong|elite) mapped from backend edge_tier */
  edgeTier?: string;
}

export interface EVFeedRequest {
  /** Minimum EV percentage (default: 3.0) */
  min_ev?: number;
  /** Sport filter (default: ALL) */
  sport?: SportType;
  /** Market type filter */
  market_type?: MarketType;
  /** Sportsbook filter */
  source_book?: string;
  /** Maximum number of opportunities (default: 100) */
  limit?: number;
}

export interface EVFeedResponse {
  /** List of +EV opportunities */
  opportunities: EVOpportunity[];
  /** Total opportunities before limit */
  total_count: number;
  /** Applied filters */
  filters_applied: Record<string, string | number | boolean>;
  /** Last cache update time */
  last_updated: string;
  /** Age of cached data in seconds */
  cache_age_seconds: number;
}

export interface EVCalculationInput {
  /** Market odds */
  market_odds: number;
  /** Fair odds calculation */
  fair_odds: number;
  /** Stake amount for calculation (default: 100) */
  stake?: number;
}

export interface EVCalculationResult {
  /** Expected value percentage */
  ev_percent: number;
  /** Expected value in dollars */
  ev_dollar: number;
  /** Market implied probability */
  implied_probability: number;
  /** Fair probability */
  fair_probability: number;
  /** Whether EV is positive */
  is_positive: boolean;
}

export interface EVFeedStats {
  /** Total opportunities in feed */
  total_opportunities: number;
  /** Opportunities by sport */
  by_sport: Record<string, number>;
  /** Opportunities by EV tier */
  by_tier: Record<string, number>;
  /** Average EV percentage */
  avg_ev_percent: number;
  /** Last feed generation time */
  last_generation_time: string;
  /** Feed generation time in milliseconds */
  generation_duration_ms: number;
}

export interface EVFeedFilters {
  /** Minimum EV percentage */
  minEV: number;
  /** Selected sport */
  sport: SportType;
  /** Selected market type */
  marketType?: MarketType;
  /** Selected sportsbook */
  sourceBook?: string;
}

export interface EVBadgeProps {
  /** EV tier for badge styling */
  tier: EVTier;
  /** EV percentage to display */
  evPercent: number;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Show percentage text */
  showPercent?: boolean;
}

export interface EVOpportunityCardProps {
  /** The EV opportunity to display */
  opportunity: EVOpportunity;
  /** Whether the card is expanded */
  isExpanded?: boolean;
  /** Handler for card expansion */
  onToggleExpand?: () => void;
  /** Handler for adding to bet slip */
  onAddToBetSlip?: (opportunity: EVOpportunity) => void;
  /** Show detailed analysis */
  showAnalysis?: boolean;
}

export interface EVFeedSettings {
  /** Auto-refresh enabled */
  autoRefresh: boolean;
  /** Refresh interval in seconds */
  refreshInterval: number;
  /** Sound notifications enabled */
  soundNotifications: boolean;
  /** Minimum EV for notifications */
  notificationThreshold: number;
  /** Preferred sportsbooks */
  preferredBooks: string[];
}

/**
 * EV Tier Color Mapping for UI
 */
export const EV_TIER_COLORS = {
  [EVTier.LOW]: {
    bg: 'bg-green-100',
    text: 'text-green-800',
    border: 'border-green-200',
    badge: 'bg-green-500'
  },
  [EVTier.MEDIUM]: {
    bg: 'bg-yellow-100', 
    text: 'text-yellow-800',
    border: 'border-yellow-200',
    badge: 'bg-yellow-500'
  },
  [EVTier.HIGH]: {
    bg: 'bg-orange-100',
    text: 'text-orange-800', 
    border: 'border-orange-200',
    badge: 'bg-orange-500'
  },
  [EVTier.EXTREME]: {
    bg: 'bg-red-100',
    text: 'text-red-800',
    border: 'border-red-200', 
    badge: 'bg-red-500'
  }
} as const;

/**
 * Sport Display Information
 */
export const SPORT_INFO = {
  [SportType.MLB]: {
    name: 'Baseball',
    icon: '⚾',
    color: 'text-blue-600'
  },
  [SportType.NBA]: {
    name: 'Basketball',
    icon: '🏀',
    color: 'text-orange-600'
  },
  [SportType.NFL]: {
    name: 'Football', 
    icon: '🏈',
    color: 'text-green-600'
  },
  [SportType.NHL]: {
    name: 'Hockey',
    icon: '🏒',
    color: 'text-purple-600'
  },
  [SportType.ALL]: {
    name: 'All Sports',
    icon: '🏆',
    color: 'text-gray-600'
  }
} as const;

/**
 * Market Type Display Information
 */
export const MARKET_TYPE_INFO = {
  [MarketType.MONEYLINE]: {
    name: 'Moneyline',
    description: 'Win/lose bets'
  },
  [MarketType.SPREAD]: {
    name: 'Spread',
    description: 'Point spread bets'
  },
  [MarketType.TOTAL]: {
    name: 'Total',
    description: 'Over/under bets'
  },
  [MarketType.PLAYER_PROPS]: {
    name: 'Player Props',
    description: 'Individual player bets'
  },
  [MarketType.TEAM_PROPS]: {
    name: 'Team Props', 
    description: 'Team performance bets'
  }
} as const;

/**
 * Utility function to determine EV tier from percentage
 */
export function determineEVTier(evPercent: number): EVTier {
  if (evPercent >= 12) return EVTier.EXTREME;
  if (evPercent >= 8) return EVTier.HIGH;
  if (evPercent >= 5) return EVTier.MEDIUM;
  return EVTier.LOW;
}

/**
 * Utility function to format odds display
 */
export function formatOdds(odds: number): string {
  return odds > 0 ? `+${odds}` : `${odds}`;
}

/**
 * Utility function to format EV percentage
 */
export function formatEVPercent(evPercent: number): string {
  return `${evPercent.toFixed(1)}%`;
}

/**
 * Utility function to calculate implied probability from odds
 */
export function calculateImpliedProbability(odds: number): number {
  if (odds > 0) {
    return 100 / (odds + 100);
  } else {
    return Math.abs(odds) / (Math.abs(odds) + 100);
  }
}

/**
 * WebSocket event types for +EV feed
 */
export enum EVWebSocketEvent {
  FEED_UPDATE = 'ev:feed_update',
  NEW_OPPORTUNITY = 'ev:new_opportunity',
  OPPORTUNITY_REMOVED = 'ev:opportunity_removed',
  STATS_UPDATE = 'ev:stats_update'
}

export interface EVWebSocketMessage {
  event: EVWebSocketEvent;
  data: EVOpportunity | EVOpportunity[] | EVFeedStats | Record<string, unknown>;
  timestamp: string;
}