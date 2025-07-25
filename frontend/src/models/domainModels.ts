// Domain models for props, predictions, and best bets

export interface PropProjection {
  id: string;
  player: string;
  team: string;
  sport: string;
  statType: string;
  line: number;
  overOdds: number;
  underOdds: number;
  confidence: number;
  value: number;
  reasoning: string;
}

export interface SelectedProp {
  id: string;
  player: string;
  statType: string;
  line: number;
  choice: 'over' | 'under';
  odds: number;
}

export interface GamePrediction {
  id: string;
  homeTeam: string;
  awayTeam: string;
  sport: string;
  league: string;
  gameTime: string;
  homeSpread: number;
  awaySpread: number;
  overUnder: number;
  homeWinProb: number;
  awayWinProb: number;
  confidence: number;
  recommendation: 'home' | 'away' | 'over' | 'under';
  reasoning: string;
  status: 'upcoming' | 'live' | 'completed';
}

export interface BestBet {
  id: string;
  player_name: string;
  sport: string;
  stat_type: string;
  line: number;
  recommendation: 'OVER' | 'UNDER';
  confidence: number;
  reasoning: string;
  expected_value: number;
}
