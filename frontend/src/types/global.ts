// Core Application Types - Consolidated for better maintainability

// API Response Types
export interface ApiResponse<T = unknown> {
  data: T;
  success: boolean;
  message?: string;
  error?: string;
  timestamp?: string;
}

// Sports Data Types
export interface SportsSport {
  id: string;
  name: string;
  abbreviation: string;
  active: boolean;
}

export interface SportsTeam {
  id: string;
  name: string;
  abbreviation: string;
  market: string;
  logo_url?: string;
}

export interface SportsPlayer {
  id: string;
  name: string;
  team: string;
  position: string;
  status: 'active' | 'injured' | 'inactive';
}

export interface SportsGame {
  id: string;
  date: string;
  home_team: SportsTeam;
  away_team: SportsTeam;
  status: 'scheduled' | 'in_progress' | 'completed' | 'postponed';
  score?: {
    home: number;
    away: number;
  };
  players?: SportsPlayer[];
}

// Projection and Prediction Types
export interface PlayerProjection {
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
}

export interface ProjectionAnalysis {
  player: string;
  team: string;
  confidence: number;
  predictions: Record<
    string,
    {
      predicted: number;
      confidence: number;
    }
  >;
  metadata?: Record<string, unknown>;
}

export interface PredictionResult {
  value: number;
  confidence: number;
  data: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  timestamp: number;
}

// Betting Types
export interface BettingContext {
  sport: string;
  market: string;
  player?: string;
  team?: string;
  odds: number;
  stake: number;
  timestamp: number;
}

export interface BettingDecision {
  action: 'bet' | 'pass' | 'hedge';
  confidence: number;
  stake: number;
  expectedValue: number;
  reasoning: string[];
}

export interface BetRecord {
  id: string;
  player: string;
  market: string;
  odds: number;
  amount: number;
  outcome: 'won' | 'lost' | 'pending';
  timestamp: number;
}

export interface BettingAnalysis {
  predictionConfidence: number;
  recommendedStake: number;
  expectedValue: number;
  riskAssessment: {
    level: 'low' | 'medium' | 'high';
    factors: string[];
  };
  hedgingOpportunities: Array<{
    market: string;
    odds: number;
    recommendedStake: number;
  }>;
}

// Sentiment and Social Types
export interface SocialSentimentData {
  player: string;
  sentiment: {
    score: number; // -1 to 1
    volume: number;
  };
  trending: boolean;
  keywords: string[];
  timestamp: string;
}

export interface InjuryData {
  player: string;
  status: string;
  type: string;
  severity?: 'minor' | 'moderate' | 'severe';
  estimated_return?: string;
}

// Service Configuration Types
export interface ServiceConfig {
  apiKey?: string;
  baseUrl?: string;
  timeout?: number;
  retries?: number;
  rateLimit?: {
    requests: number;
    window: number;
  };
}

export interface CacheConfig {
  ttl: number; // Time to live in milliseconds
  maxSize?: number;
  strategy?: 'lru' | 'fifo';
}

// Error Types
export interface AppError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  timestamp: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

// UI Component Types
export interface LoadingState {
  isLoading: boolean;
  message?: string;
  progress?: number;
}

export interface FilterOptions {
  sport?: string;
  team?: string;
  player?: string;
  date?: string;
  minConfidence?: number;
  maxRisk?: string;
}

// ML and Analytics Types
export interface ModelPerformance {
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  auc?: number;
  lastUpdated: string;
}

export interface SHAPValue {
  feature: string;
  value: number;
  impact: 'positive' | 'negative';
}

export interface ModelExplanation {
  shapValues: SHAPValue[];
  featureImportance: Record<string, number>;
  confidence: number;
  uncertainty?: number;
}

// Legacy types preserved for compatibility
export interface EngineeredFeatures {
  numerical: number[];
  categorical: string[];
  temporal: number[];
  metadata: {
    timestamp: number;
    version: string;
    source: string;
  };
}

export interface FeatureConfig {
  version: string;
  features: {
    numerical: boolean;
    categorical: boolean;
    temporal: boolean;
  };
}

export interface RawPlayerData {
  id: string;
  name: string;
  team: string;
  position: string;
  stats: Record<string, number>;
  [key: string]: unknown;
}

// Performance Monitor Types
export interface PerformanceTrace {
  id: string;
  name: string;
  startTime: number;
  endTime?: number;
  metadata?: Record<string, unknown>;
}

export interface PerformanceSpan {
  id: string;
  traceId: string;
  name: string;
  startTime: number;
  endTime?: number;
  metadata?: Record<string, unknown>;
}

// DailyFantasy API Types
export interface DailyFantasyRequest {
  site: string;
  date: string;
  sport: string;
}

export interface DailyFantasyPlayer {
  name: string;
  position: string;
  team: string;
  salary: number;
  projectedPoints: number;
  ownership?: number;
}

// Enhanced Analysis Types
export interface SentimentEnhancedInput {
  projectionAnalysis: ProjectionAnalysis[];
  sentimentData: SocialSentimentData[];
  oddsData: Array<{
    player: string;
    moneyline?: number;
    spread?: number;
    total?: number;
    consensus?: {
      over: number;
      under: number;
    };
  }>;
  sportsRadarData: {
    games: Array<{
      players: Array<{
        name: string;
        injuries: Array<{
          status: string;
          type: string;
        }>;
      }>;
    }>;
  };
}

// Utility Types
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type NonEmptyArray<T> = [T, ...T[]];

export type AsyncResult<T> = Promise<{ data: T; error: null } | { data: null; error: AppError }>;

// CLV Analysis Types
export interface ClvAnalysis {
  originalOdds: number;
  closingOdds: number;
  clvPercentage: number;
  expectedValue: number;
  classification: 'positive' | 'negative' | 'neutral';
}
