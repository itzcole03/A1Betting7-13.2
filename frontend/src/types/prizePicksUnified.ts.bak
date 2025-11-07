/**
 * UNIFIED PRIZEPICKS TYPE SYSTEM
 *
 * This file consolidates all PrizePicks-related types from across the codebase
 * into a single, authoritative source. This replaces:
 * - frontend/src/types/prizePicks.ts
 * - frontend/src/shared/prizePicks.ts
 * - Individual component interfaces
 * - API response types
 *
 * Version: 2.0.0 - Consolidated from recursive type analysis
 */

// ===== CORE PLAYER TYPES =====

export interface PrizePicksPlayer {
  id: string;
  name: string;
  display_name?: string;
  short_name?: string;
  team: string;
  team_name?: string;
  team_nickname?: string;
  position: string;
  image_url?: string;
  league?: string;
  sport?: string;
}

// ===== ML PREDICTION TYPES =====

export interface MLPrediction {
  prediction: number;
  confidence: number;
  ensemble_score: number;
  model_weights: Record<string, number>;
  factors: Record<string, number>;
  risk_assessment: {
    level: 'low' | 'medium' | 'high';
    score: number;
    factors: string[];
  };
}

export interface ShapValues {
  base_value: number;
  shap_values: Record<string, number>;
  feature_importance: Record<string, number>;
  explanation: string;
}

// ===== COMPREHENSIVE PROJECTION TYPE =====

export interface PrizePicksProjection {
  // Core identification
  id: string;
  player_id: string;

  // Player information (consolidated from all sources)
  player_name: string;
  playerName?: string; // Legacy alias for backward compatibility
  player?: PrizePicksPlayer; // Optional player object
  team: string;
  position: string;
  league: string;
  sport: string;

  // Stat information (supporting all naming conventions)
  stat_type: string;
  statType?: string; // Legacy alias
  stat?: string; // Legacy alias
  display_stat?: string; // API alias

  // Line information (consolidated)
  line_score: number;
  line?: number; // Legacy alias
  flash_sale_line_score?: number; // Special promotions

  // Odds information
  over_odds: number;
  under_odds: number;
  overOdds?: number; // Legacy alias
  underOdds?: number; // Legacy alias
  over?: number; // Component alias
  under?: number; // Component alias
  odds_type?: string;

  // Timing information
  start_time: string; // ISO 8601 string
  startTime?: string; // Legacy alias
  gameTime?: Date; // Component version
  updated_at?: string;

  // Status and metadata
  status: string;
  description: string;
  rank: number;
  is_promo: boolean;
  promotion_id?: string | null;
  projection_type?: string;
  refundable?: boolean;
  source?: string;
  custom_image_url?: string | null;

  // Confidence and predictions
  confidence: number;
  market_efficiency: number;
  ml_prediction?: MLPrediction;
  shap_values?: ShapValues;

  // Value metrics
  value_rating?: number;
  value?: number; // Legacy alias
  kelly_percentage?: number;
  edge?: number; // Component version

  // Statistical data (from component versions)
  projection?: number; // AI projection value
  recentAvg?: number;
  recent_avg?: number; // API version
  seasonAvg?: number;
  season_avg?: number; // API version
  matchup?: string;
  weather?: string;
  injury?: string;

  // Trend analysis
  trends?: {
    last5: number[];
    homeAway: { home: number; away: number };
    vsOpponent: number;
  };

  // API relationships (for raw API responses)
  relationships?: {
    league: { data: { id: string; type: 'league' } };
    new_player: { data: { id: string; type: 'new_player' } };
    stat_type: { data: { id: string; type: 'stat_type' } };
  };
}

// ===== LEGACY TYPE ALIASES FOR BACKWARD COMPATIBILITY =====

export interface PrizePicksProps extends Omit<PrizePicksProjection, 'player_id'> {
  playerId: string; // Legacy field name
}

export interface PlayerProp extends Omit<PrizePicksProjection, 'player_id' | 'player_name'> {
  playerId: string; // Legacy field name
  playerName: string; // Legacy field name
}

// ===== LINEUP AND OPTIMIZATION TYPES =====

export interface LineupEntry {
  id: string;
  projection: PrizePicksProjection;
  selection: 'over' | 'under';
  confidence: number;
  expected_value: number;
  kelly_percentage: number;
}

export interface OptimizedLineup {
  entries: LineupEntry[];
  total_confidence: number;
  expected_payout: number;
  kelly_optimization: number;
  risk_score: number;
  value_score: number;
  correlation_matrix: number[][];
}

export interface Lineup {
  id: string;
  name: string;
  picks: LineupEntry[] | PlayerProp[]; // Support both formats
  totalValue: number;
  expectedReturn: number;
  risk: 'low' | 'medium' | 'high';
  confidence: number;
  multiplier: number;
  cost: number;
  createdAt: Date;
  validated: boolean;
  projectedPayout: number;
  entryAmount: number;
}

// ===== DATA CONTAINER TYPES =====

export interface PrizePicksData {
  projections: PrizePicksProjection[];
  players: PrizePicksPlayer[];
  leagues: PrizePicksLeague[];
  lastUpdated: string;
}

export interface PrizePicksLeague {
  id: string;
  name: string;
  sport: string;
  abbreviation: string;
  active: boolean;
}

// ===== STATS AND ANALYTICS TYPES =====

export interface PrizePicksStats {
  totalLineups: number;
  winRate: number;
  avgMultiplier: number;
  totalWinnings: number;
  bestStreak: number;
  currentStreak: number;
  avgConfidence: number;
}

// ===== API RESPONSE TYPES =====

export interface RawPrizePicksProjection {
  id: string;
  type: 'projection';
  attributes: {
    description: string;
    display_stat: string;
    flash_sale_line_score?: number;
    is_promo: boolean;
    line_score: number;
    odds_type: string;
    promotion_id?: string | null;
    projection_type: string;
    pt_old?: string | null;
    rank: number;
    refundable: boolean;
    source: string;
    start_time: string;
    stat_type: string;
    status: string;
    custom_image_url?: string | null;
    updated_at: string;
  };
  relationships: {
    league: { data: { id: string; type: 'league' } };
    new_player: { data: { id: string; type: 'new_player' } };
    stat_type: { data: { id: string; type: 'stat_type' } };
  };
}

export interface RawPrizePicksIncludedPlayer {
  id: string;
  type: 'new_player';
  attributes: {
    name: string;
    display_name: string;
    short_name: string;
    position: string;
    team_name: string;
    team_nickname: string;
    image_url: string;
  };
}

export interface RawPrizePicksIncludedLeague {
  id: string;
  type: 'league';
  attributes: {
    name: string;
    sport: string;
    abbreviation: string;
    active: boolean;
  };
}

export interface RawPrizePicksIncludedStatType {
  id: string;
  type: 'stat_type';
  attributes: {
    name: string;
    display_name: string;
    abbreviation: string;
  };
}

export type PrizePicksIncludedResource =
  | RawPrizePicksIncludedPlayer
  | RawPrizePicksIncludedLeague
  | RawPrizePicksIncludedStatType;

export interface PrizePicksAPIResponse<T> {
  data: T[];
  included?: PrizePicksIncludedResource[];
  links?: {
    first?: string;
    last?: string;
    next?: string | null;
    prev?: string | null;
  };
  meta?: Record<string, unknown>;
}

// ===== COMPONENT PROP TYPES =====

export interface PrizePicksProUnifiedProps {
  variant?: 'default' | 'cyber' | 'pro' | 'minimal';
  className?: string;
  maxSelections?: number;
  enableMLPredictions?: boolean;
  enableShapExplanations?: boolean;
  enableKellyOptimization?: boolean;
  enableCorrelationAnalysis?: boolean;
  autoRefresh?: boolean;
  refreshInterval?: number;
  onLineupGenerated?: (lineup: OptimizedLineup) => void;
  onBetPlaced?: (lineup: OptimizedLineup) => void;
}

// ===== HOOK RESULT TYPES =====

export interface UsePrizePicksPropsResult {
  data: PrizePicksProjection[];
  loading: boolean;
  error: string | null;
}

// ===== POE ADAPTER TYPES =====

export interface PoePropCardContent {
  playerId?: string;
  playerName?: string;
  player?: string;
  playerImage?: string;
  statType?: string;
  stat?: string;
  line?: number;
  overOdds?: number;
  underOdds?: number;
  lastUpdated?: string;
}

export interface PoeDataBlock {
  id: string;
  type: string;
  title: string;
  content: unknown;
  metadata?: Record<string, unknown>;
}

export interface PoeApiResponse {
  success: boolean;
  timestamp: number;
  dataBlocks: PoeDataBlock[];
}

// ===== FILTER AND SELECTION TYPES =====

export interface PrizePicksFilters {
  sport: string;
  league: string;
  team: string;
  statType: string;
  minConfidence: number;
  maxRisk: 'low' | 'medium' | 'high';
  minValue: number;
  playerSearch: string;
}

export interface SelectedProp {
  propId: string;
  choice: 'over' | 'under';
}

export interface SavedLineup {
  id: string;
  name: string;
  picks: Array<{
    player: string;
    stat: string;
    line: number;
    choice: 'over' | 'under';
    confidence: number;
  }>;
  entryAmount: number;
  projectedPayout: number;
  savedAt: Date;
}

// ===== UTILITY TYPES =====

export interface PrizePicksEntry {
  id: string;
  status?: string;
}

// ===== TYPE GUARDS =====

export function isPrizePicksProjection(_obj: unknown): _obj is PrizePicksProjection {
  const obj = _obj as Record<string, unknown>; // Cast to a record to allow property access
  return (
    obj !== null &&
    typeof obj === 'object' &&
    typeof obj.id === 'string' &&
    typeof obj.player_name === 'string' &&
    typeof obj.stat_type === 'string' &&
    typeof obj.line_score === 'number'
  );
}

export function isLegacyPlayerProp(_obj: unknown): _obj is PlayerProp {
  const obj = _obj as Record<string, unknown>; // Cast to a record to allow property access
  return (
    obj !== null &&
    typeof obj === 'object' &&
    typeof obj.playerId === 'string' &&
    typeof obj.playerName === 'string'
  );
}

// ===== TRANSFORMATION UTILITIES =====

export function transformToProjection(_prop: PlayerProp | PrizePicksProps): PrizePicksProjection {
  // Start with the base properties from PrizePicksProjection, handling common aliases
  const _transformed: PrizePicksProjection = {
    // Initialize all required properties first, using direct property or alias with fallback
    id: _prop.id,
    player_id: ('playerId' in _prop && _prop.playerId) ? _prop.playerId : ('player_id' in _prop ? _prop.player_id : ''),
    player_name: ('playerName' in _prop && _prop.playerName) ? _prop.playerName : ('player_name' in _prop ? _prop.player_name : ''),
    team: _prop.team || '',
    position: _prop.position || '',
    league: _prop.league || '',
    sport: _prop.sport || '',
    stat_type: ('statType' in _prop && _prop.statType) ? _prop.statType : ('stat_type' in _prop ? _prop.stat_type : ''),
    line_score: ('line' in _prop && _prop.line) ? _prop.line : ('line_score' in _prop ? _prop.line_score : 0),
    over_odds: ('overOdds' in _prop && _prop.overOdds) ? _prop.overOdds : ('over_odds' in _prop ? _prop.over_odds : -110),
    under_odds: ('underOdds' in _prop && _prop.underOdds) ? _prop.underOdds : ('under_odds' in _prop ? _prop.under_odds : -110),
    start_time: ('startTime' in _prop && _prop.startTime) ? _prop.startTime : ('start_time' in _prop ? _prop.start_time : new Date().toISOString()),
    status: _prop.status || 'active',
    description: _prop.description || '',
    rank: _prop.rank || 0,
    is_promo: _prop.is_promo || false,
    confidence: _prop.confidence || 75,
    market_efficiency: _prop.market_efficiency || 0.1,

    // Spread any remaining properties from the original _prop, allowing them to override if they exist.
    // This handles other optional fields and ensures all properties from the original are carried over.
    ..._prop as any,
  };

  // Remove legacy aliases if they exist in the final transformed object
  if (('_prop' as any).playerId in _transformed) delete (_transformed as any).playerId;
  if (('_prop' as any).playerName in _transformed) delete (_transformed as any).playerName;
  if (('_prop' as any).statType in _transformed) delete (_transformed as any).statType;
  if (('_prop' as any).line in _transformed) delete (_transformed as any).line;
  if (('_prop' as any).overOdds in _transformed) delete (_transformed as any).overOdds;
  if (('_prop' as any).underOdds in _transformed) delete (_transformed as any).underOdds;
  if (('_prop' as any).startTime in _transformed) delete (_transformed as any).startTime;
  if (('_prop' as any).over in _transformed) delete (_transformed as any).over;
  if (('_prop' as any).under in _transformed) delete (_transformed as any).under;

  return _transformed;
}

export function transformToPlayerProp(_projection: PrizePicksProjection): PlayerProp {
  return {
    ..._projection,
    playerId: _projection.player_id,
    playerName: _projection.player_name,
  } as PlayerProp;
}
