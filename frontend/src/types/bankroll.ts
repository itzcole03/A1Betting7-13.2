// Bankroll Management Types

export interface BetRecordRequest {
  stake: number;
  odds: number;
  bet_type: string;
  selection: string;
  sportsbook: string;
  market: string;
  player_name?: string;
  fair_odds?: number;
  confidence_score?: number;
  notes?: string;
  match_id?: number;
  sport?: string;
  game_date?: string;
}

export interface BetResponse {
  id: number;
  stake: number;
  odds: number;
  bet_type: string;
  selection: string;
  result?: string;
  pnl?: number;
  roi_percent?: number;
  ev_percent?: number;
  kelly_fraction_used?: number;
  clv_percent?: number;
  sportsbook: string;
  market: string;
  player_name?: string;
  confidence_score?: number;
  placed_at: string;
  settled_at?: string;
  status: string;
  is_settled: boolean;
}

export interface KellyCalculationRequest {
  fair_probability: number;
  market_odds: number;
  bankroll?: number;
  variant?: string;
  fraction_cap?: number;
}

export interface KellyCalculationResponse {
  kelly_fraction: number;
  recommended_bet_size: number;
  expected_value: number;
  expected_growth_rate?: number;
  ev_percent: number;
  fair_probability: number;
  market_odds: number;
  bankroll_used: number;
  variant_used: string;
  risk_assessment: {
    edge_percent: number;
    max_loss_percent: number;
    confidence_level: string;
    recommendation: string;
  };
}

export interface BankrollSummaryResponse {
  current_bankroll: number;
  total_bets: number;
  total_wagered: number;
  total_pnl: number;
  roi_percent: number;
  win_rate: number;
  avg_bet_size: number;
  avg_odds: number;
  avg_kelly_fraction?: number;
  kelly_efficiency?: number;
  avg_ev_percent?: number;
  avg_clv_percent?: number;
  positive_clv_rate?: number;
  max_drawdown_percent?: number;
  volatility?: number;
  sharpe_ratio?: number;
  sport_breakdown?: Record<string, unknown>;
  market_breakdown?: Record<string, unknown>;
  sportsbook_breakdown?: Record<string, unknown>;
  period_start: string;
  period_end: string;
}

export interface PerformanceStats {
  period_summary: {
    days: number;
    start_date: string;
    end_date: string;
    total_bets: number;
    total_wagered: number;
    total_pnl: number;
    roi_percent: number;
  };
  win_loss_analysis: {
    wins: number;
    losses: number;
    pushes: number;
    win_rate_percent: number;
    avg_win_odds: number;
    avg_loss_odds: number;
    avg_win_payout: number;
    avg_loss_amount: number;
  };
  streak_analysis: {
    current_streak: number;
    current_streak_type?: string;
    max_win_streak: number;
    max_loss_streak: number;
  };
  profitability: {
    profitable_days: number;
    total_days: number;
    profitable_day_rate: number;
    best_day: number;
    worst_day: number;
  };
  market_breakdown: Record<string, {
    bets: number;
    wins: number;
    losses: number;
    pushes: number;
    wagered: number;
    pnl: number;
    win_rate: number;
    roi: number;
  }>;
}

export interface APIResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}
