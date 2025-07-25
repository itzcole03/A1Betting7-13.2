export interface Bet {
  id: string;
  status: string;
  [key: string]: any;
}

export interface BettingState {
  bets: Bet[];
  odds: Record<string, unknown>;
  payouts: Record<string, unknown>;
  placeBet: (bet: Bet) => void;
  updateActiveBet: (betId: string, update: Partial<Bet>) => void;
  clearOpportunities: () => void;
}

export interface RootState {
  betting: BettingState;
}
