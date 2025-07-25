export interface LockedBet {
  id: string;
  sportsbook?: string; // e.g., 'PrizePicks', 'FanDuel', etc.
  label?: string; // Display label for the source
  event?: string;
  market?: string;
  odds?: string;
  prediction?: string;
  timestamp?: string;
  // Extended fields for enhanced LockedBet usage
  player_name?: string;
  team?: string;
  sport?: string;
  stat_type?: string;
  line_score?: number;
  recommendation?: 'OVER' | 'UNDER';
  confidence?: number;
  ensemble_confidence?: number;
  win_probability?: number;
  expected_value?: number;
  kelly_fraction?: number;
  risk_score?: number;
  source?: string;
  opponent?: string;
  venue?: string;
  ai_explanation?: {
    explanation: string;
    key_factors: string[];
    risk_level: string;
  };
  value_rating?: number;
  kelly_percentage?: number;
}
