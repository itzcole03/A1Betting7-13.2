import { StateCreator } from 'zustand';
import { Bet, BettingState, RootState } from '../../types/betting';

export const _createBettingSlice: StateCreator<RootState, [], [], BettingState> = (set) => ({
  bets: [],
  odds: {} as Record<string, unknown>,
  payouts: {} as Record<string, unknown>,

  placeBet: (bet: Bet) => {
    set((state: RootState) => ({
      betting: {
        ...state.betting,
        bets: [...state.betting.bets, bet],
      },
    }));
  },

  updateActiveBet: (betId: string, update: Partial<Bet>) => {
    set((state: RootState) => ({
      betting: {
        ...state.betting,
        bets: state.betting.bets.map((bet: Bet) =>
          bet.id === betId ? { ...bet, ...update } : bet
        ),
      },
    }));
  },

  clearOpportunities: () => {
    set((state: RootState) => ({
      betting: {
        ...state.betting,
        bets: state.betting.bets.filter((bet: Bet) => bet.status !== 'opportunity'),
      },
    }));
  },
});
