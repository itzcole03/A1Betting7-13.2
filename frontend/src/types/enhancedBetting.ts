/**
 * Enhanced Betting Types - Unified System
 *
 * Type definitions combining PrizePicks, MoneyMaker, and Lineup Builder features
 */

export interface EnhancedPrediction {
  // Core PrizePicks data
  id: string;
  player_name: string;
  team: string;
  sport: string;
  stat_type: string;
  line_score: number;
  recommendation: 'OVER' | 'UNDER';
  confidence: number;

  // MoneyMaker AI features
  kelly_fraction: number;
  expected_value: number;
  quantum_confidence: number;
  neural_score: number;

  // Lineup optimization features
  correlation_score: number;
  synergy_rating: number;
  stack_potential: number;
  diversification_value: number;

  // Advanced analytics
  shap_explanation: SHAPExplanation;
  risk_assessment: RiskAssessment;
  weather_impact?: number;
  injury_risk: number;

  // Portfolio metrics
  optimal_stake: number;
  portfolio_impact: number;
  variance_contribution: number;

  // Multi-platform data
  source: string;
  arbitrage_opportunities?: ArbitrageOpportunity[];
}

export interface SHAPExplanation {
  baseline: number;
  features: Record<string, number>;
  prediction: number;
  top_factors: Array<[string, number]>;
}

export interface RiskAssessment {
  overall_risk: number;
  confidence_risk: number;
  line_risk: number;
  market_risk: number;
  risk_level: 'low' | 'medium' | 'high';
}

export interface ArbitrageOpportunity {
  platform_a: string;
  platform_b: string;
  profit_margin: number;
  total_stake: number;
  guaranteed_profit: number;
}

export interface PortfolioMetrics {
  total_expected_value: number;
  total_risk_score: number;
  diversification_score: number;
  kelly_optimization: number;
  correlation_matrix: number[][];
  optimal_allocation: Record<string, number>;
  risk_adjusted_return: number;
  sharpe_ratio: number;
  max_drawdown: number;
  confidence_interval: [number, number];
}

export interface AIInsights {
  quantum_analysis: string;
  neural_patterns: string[];
  shap_factors: Array<{ factor: string; impact: number }>;
  risk_factors: string[];
  opportunity_score: number;
  market_edge: number;
  confidence_reasoning: string;
}

export interface LiveGameContext {
  game_id: string;
  status: 'scheduled' | 'in_progress' | 'completed';
  current_time?: string;
  score: {
    home: { team: string; score: number };
    away: { team: string; score: number };
  };
  relevant_bets: Array<{
    bet_id: string;
    player_name: string;
    team: string;
    stat_type: string;
    line_score: number;
    current_performance: number;
    pace_to_hit: 'ON_PACE' | 'BEHIND_PACE' | 'AHEAD_PACE';
    confidence: number;
    live_adjustment: number;
  }>;
  live_opportunities: Array<{
    type: string;
    description: string;
    confidence: number;
    recommended_action: 'INCREASE_STAKE' | 'HOLD' | 'CONSIDER_EXIT';
  }>;
  last_update: string;
}

export interface MultiPlatformOpportunity {
  player_name: string;
  stat_type: string;
  platforms: Array<{
    platform: string;
    line: number;
    odds: number;
    confidence: number;
    available: boolean;
  }>;
  recommended_platform: string;
  best_value: {
    platform: string;
    line: number;
    odds: number;
    confidence: number;
  };
}

export interface EnhancedBetsResponse {
  enhanced_bets: EnhancedPrediction[];
  count: number;
  portfolio_metrics?: PortfolioMetrics;
  ai_insights?: AIInsights[];
  filters: {
    sport?: string;
    min_confidence: number;
    max_results: number;
  };
  status: string;
}

export interface PortfolioAnalysis {
  portfolio_summary: {
    total_bets: number;
    total_expected_value: number;
    average_confidence: number;
    total_kelly_allocation: number;
    average_risk: number;
    diversification_score: number;
    correlation_score: number;
  };
  allocation_recommendations: Array<{
    bet_id: string;
    player_name: string;
    sport: string;
    recommended_amount: number;
    kelly_fraction: number;
    expected_value: number;
    confidence: number;
    risk_level: string;
  }>;
  risk_metrics: {
    portfolio_risk: number;
    correlation_risk: number;
    concentration_risk: number;
    overall_risk_rating: 'LOW' | 'MEDIUM' | 'HIGH';
  };
  performance_projections: {
    expected_return: number;
    best_case: number;
    worst_case: number;
    confidence_interval: [number, number];
  };
  recommendations: string[];
}

// Stacking and correlation types
export interface StackSuggestion {
  type: 'team' | 'game' | 'player_prop';
  players: string[];
  correlation_score: number;
  synergy_rating: number;
  expected_boost: number;
  risk_level: 'low' | 'medium' | 'high';
  explanation: string;
}

export interface CorrelationMatrix {
  players: string[];
  matrix: number[][];
  insights: Array<{
    player_a: string;
    player_b: string;
    correlation: number;
    recommendation: 'STACK' | 'AVOID' | 'NEUTRAL';
  }>;
}

// UI Component Props
export interface AIInsightsPanelProps {
  insights: AIInsights[];
  selectedBet?: EnhancedPrediction;
  onBetSelect: (bet: EnhancedPrediction) => void;
}

export interface PortfolioOptimizerProps {
  metrics: PortfolioMetrics;
  predictions: EnhancedPrediction[];
  onOptimize: (selectedBets: string[]) => void;
  investmentAmount: number;
  onInvestmentChange: (amount: number) => void;
}

export interface SmartStackingPanelProps {
  suggestions: StackSuggestion[];
  correlationMatrix: CorrelationMatrix;
  onStackSelect: (playerIds: string[]) => void;
}

export interface LiveContextOverlayProps {
  gameContext: LiveGameContext;
  onBetAdjust: (betId: string, action: string) => void;
}

// API Response types
export interface UnifiedApiResponse<T> {
  data: T;
  status: 'success' | 'error';
  message?: string;
  timestamp: string;
}

export interface PlatformConfig {
  name: string;
  priority: number;
  features: string[];
  api_endpoint: string;
  enabled: boolean;
}

export interface UserSettings {
  default_investment: number;
  risk_tolerance: 'conservative' | 'moderate' | 'aggressive';
  preferred_sports: string[];
  kelly_multiplier: number;
  auto_stacking: boolean;
  notification_preferences: {
    bet_alerts: boolean;
    portfolio_updates: boolean;
    arbitrage_opportunities: boolean;
  };
}
