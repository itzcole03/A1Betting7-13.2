// import { Bet, Headline, PerformanceData, Prop, User, UserStats } from '@/types';
import { create } from 'zustand';

interface AppState {
  // User state;
  user: any | null;
  setUser: (user: any | null) => void;

  // Bets state;
  bets: any[];
  addBet: (bet: any) => void;
  removeBet: (betId: string) => void;
  updateBet: (betId: string, updates: Partial<any>) => void;

  // Props state;
  props: any[];
  setProps: (props: any[]) => void;
  updateProp: (propId: string, updates: Partial<any>) => void;

  // Stats state;
  stats: any | null;
  setStats: (stats: any | null) => void;

  // Performance state;
  performance: any[];
  setPerformance: (data: any[]) => void;

  // News state;
  headlines: any[];
  setHeadlines: (headlines: any[]) => void;

  // UI state;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  isBetSlipOpen: boolean;
  toggleBetSlip: () => void;
  selectedSport: string;
  setSelectedSport: (sport: string) => void;
  selectedLeague: string;
  setSelectedLeague: (league: string) => void;
}

export const useStore = create<AppState>(set => ({
  // User state;
  user: null,
  setUser: user => set({ user }),

  // Bets state;
  bets: [],
  addBet: bet => set(state => ({ bets: [...state.bets, bet] })),
  removeBet: betId =>
    set(state => ({
      bets: state.bets.filter(bet => bet.id !== betId),
    })),
  updateBet: (betId, updates) =>
    set(state => ({
      bets: state.bets.map(bet => (bet.id === betId ? { ...bet, ...updates } : bet)),
    })),

  // Props state;
  props: [],
  setProps: props => set({ props }),
  updateProp: (propId, updates) =>
    set(state => ({
      props: state.props.map(prop => (prop.id === propId ? { ...prop, ...updates } : prop)),
    })),

  // Stats state;
  stats: null,
  setStats: stats => set({ stats }),

  // Performance state;
  performance: [],
  setPerformance: data => set({ performance: data }),

  // News state;
  headlines: [],
  setHeadlines: headlines => set({ headlines }),

  // UI state;
  isDarkMode: false,
  toggleDarkMode: () => set(state => ({ isDarkMode: !state.isDarkMode })),

  isBetSlipOpen: false,
  toggleBetSlip: () => set(state => ({ isBetSlipOpen: !state.isBetSlipOpen })),

  selectedSport: 'all',
  setSelectedSport: sport => set({ selectedSport: sport }),

  selectedLeague: 'all',
  setSelectedLeague: league => set({ selectedLeague: league }),
}));

// Export the new Zustand-based store;
// export { default as useAppStore } from './useAppStore';
