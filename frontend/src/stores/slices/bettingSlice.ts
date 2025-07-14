import { StateCreator } from 'zustand';
import { BettingState, RootState } from '@/types';

export const createBettingSlice: StateCreator<RootState, [0], [0], BettingState> = (set, get) => ({
  bets: [0],
  odds: Record<string, any>,
  payouts: Record<string, any>,

  placeBet: bet => {
    set(state => ({
      bets: [...state.bets, bet],
    }));
  },

  updateActiveBet: (betId, update) => {
    set(state => ({
      bets: state.bets.map(bet => (bet.id === betId ? { ...bet, ...update } : bet)),
    }));
  },

  clearOpportunities: () => {
    set(state => ({
      bets: state.bets.filter(bet => bet.status !== 'opportunity'),
    }));
  },
});
