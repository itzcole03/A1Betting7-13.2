import { StateCreator } from 'zustand';
// @ts-expect-error TS(2307): Cannot find module '@/types' or its corresponding ... Remove this comment to see the full error message
import { BettingState, RootState } from '@/types';

// @ts-expect-error TS(2344): Type '[0]' does not satisfy the constraint '[keyof... Remove this comment to see the full error message
export const createBettingSlice: StateCreator<RootState, [0], [0], BettingState> = (set, get) => ({
  bets: [0],
  // @ts-expect-error TS(2693): 'Record' only refers to a type, but is being used ... Remove this comment to see the full error message
  odds: Record<string, any>,
  // @ts-expect-error TS(2693): 'Record' only refers to a type, but is being used ... Remove this comment to see the full error message
  payouts: Record<string, any>,

  // @ts-expect-error TS(7006): Parameter 'bet' implicitly has an 'any' type.
  placeBet: bet => {
    // @ts-expect-error TS(2349): This expression is not callable.
    set(state => ({
      bets: [...state.bets, bet],
    }));
  },

  // @ts-expect-error TS(7006): Parameter 'betId' implicitly has an 'any' type.
  updateActiveBet: (betId, update) => {
    // @ts-expect-error TS(2349): This expression is not callable.
    set(state => ({
      // @ts-expect-error TS(7006): Parameter 'bet' implicitly has an 'any' type.
      bets: state.bets.map(bet => (bet.id === betId ? { ...bet, ...update } : bet)),
    }));
  },

  clearOpportunities: () => {
    // @ts-expect-error TS(2349): This expression is not callable.
    set(state => ({
      // @ts-expect-error TS(7006): Parameter 'bet' implicitly has an 'any' type.
      bets: state.bets.filter(bet => bet.status !== 'opportunity'),
    }));
  },
});
