/**
 * Modern State Management with Zustand
 *
 * This file implements modern state management patterns using Zustand
 * for client-side state, while TanStack Query handles server state.
 *
 * Architecture:
 * - Server State: TanStack Query (cache, sync, mutations)
 * - Client State: Zustand (local app state)
 * - UI State: React 18 concurrent features (useTransition, useDeferredValue)
 */

import { create } from 'zustand';
import { persist, subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

// =============================================================================
// BETTING STORE
// =============================================================================

interface BetSlipItem {
  id: string;
  gameId: string;
  playerId: string;
  stat: string;
  line: number;
  odds: number;
  type: 'over' | 'under';
  timestamp: number;
}

interface BettingState {
  // State
  selectedBets: BetSlipItem[];
  betSlipOpen: boolean;
  stakes: Record<string, number>;

  // Actions
  addBet: (bet: BetSlipItem) => void;
  removeBet: (betId: string) => void;
  clearBetSlip: () => void;
  toggleBetSlip: () => void;
  updateStake: (betId: string, stake: number) => void;

  // Computed
  getTotalStake: () => number;
  getTotalPayout: () => number;
  getValidBets: () => BetSlipItem[];
}

export const useBettingStore = create<BettingState>()(
  persist(
    subscribeWithSelector(
      immer((set, get) => ({
        // Initial state
        selectedBets: [],
        betSlipOpen: false,
        stakes: {},

        // Actions
        addBet: bet =>
          set(state => {
            // Prevent duplicate bets
            const existingBet = state.selectedBets.find(b => b.id === bet.id);
            if (!existingBet) {
              state.selectedBets.push(bet);
              state.stakes[bet.id] = 10; // Default stake
            }
          }),

        removeBet: betId =>
          set(state => {
            state.selectedBets = state.selectedBets.filter(bet => bet.id !== betId);
            delete state.stakes[betId];
          }),

        clearBetSlip: () =>
          set(state => {
            state.selectedBets = [];
            state.stakes = {};
          }),

        toggleBetSlip: () =>
          set(state => {
            state.betSlipOpen = !state.betSlipOpen;
          }),

        updateStake: (betId, stake) =>
          set(state => {
            if (stake > 0) {
              state.stakes[betId] = stake;
            }
          }),

        // Computed values
        getTotalStake: () => {
          const { stakes } = get();
          return Object.values(stakes).reduce((sum, stake) => sum + stake, 0);
        },

        getTotalPayout: () => {
          const { selectedBets, stakes } = get();
          return selectedBets.reduce((total, bet) => {
            const stake = stakes[bet.id] || 0;
            return total + stake * bet.odds;
          }, 0);
        },

        getValidBets: () => {
          const { selectedBets, stakes } = get();
          return selectedBets.filter(bet => {
            const stake = stakes[bet.id] || 0;
            return stake > 0;
          });
        },
      }))
    ),
    {
      name: 'betting-store',
      partialize: state => ({
        selectedBets: state.selectedBets,
        stakes: state.stakes,
      }),
    }
  )
);

// =============================================================================
// UI STATE STORE
// =============================================================================

interface UIState {
  // Theme and layout
  theme: 'light' | 'dark' | 'system';
  sidebarOpen: boolean;
  compactMode: boolean;

  // Filters and search
  selectedSport: string;
  searchQuery: string;
  activeFilters: Record<string, any>;

  // Loading and error states
  isLoading: Record<string, boolean>;
  errors: Record<string, string | null>;

  // Actions
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  toggleSidebar: () => void;
  toggleCompactMode: () => void;
  setSelectedSport: (sport: string) => void;
  setSearchQuery: (query: string) => void;
  updateFilter: (key: string, value: any) => void;
  clearFilters: () => void;
  setLoading: (key: string, loading: boolean) => void;
  setError: (key: string, error: string | null) => void;
  clearError: (key: string) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    subscribeWithSelector(
      immer(set => ({
        // Initial state
        theme: 'system',
        sidebarOpen: true,
        compactMode: false,
        selectedSport: 'MLB',
        searchQuery: '',
        activeFilters: {},
        isLoading: {},
        errors: {},

        // Actions
        setTheme: theme =>
          set(state => {
            state.theme = theme;
          }),

        toggleSidebar: () =>
          set(state => {
            state.sidebarOpen = !state.sidebarOpen;
          }),

        toggleCompactMode: () =>
          set(state => {
            state.compactMode = !state.compactMode;
          }),

        setSelectedSport: sport =>
          set(state => {
            state.selectedSport = sport;
            // Clear search and filters when changing sports
            state.searchQuery = '';
            state.activeFilters = {};
          }),

        setSearchQuery: query =>
          set(state => {
            state.searchQuery = query;
          }),

        updateFilter: (key, value) =>
          set(state => {
            if (value === null || value === undefined || value === '') {
              delete state.activeFilters[key];
            } else {
              state.activeFilters[key] = value;
            }
          }),

        clearFilters: () =>
          set(state => {
            state.activeFilters = {};
          }),

        setLoading: (key, loading) =>
          set(state => {
            if (loading) {
              state.isLoading[key] = true;
            } else {
              delete state.isLoading[key];
            }
          }),

        setError: (key, error) =>
          set(state => {
            if (error) {
              state.errors[key] = error;
            } else {
              delete state.errors[key];
            }
          }),

        clearError: key =>
          set(state => {
            delete state.errors[key];
          }),
      }))
    ),
    {
      name: 'ui-store',
      partialize: state => ({
        theme: state.theme,
        sidebarOpen: state.sidebarOpen,
        compactMode: state.compactMode,
        selectedSport: state.selectedSport,
      }),
    }
  )
);

// =============================================================================
// ANALYTICS STORE
// =============================================================================

interface AnalyticsMetric {
  id: string;
  name: string;
  value: number;
  change: number;
  timestamp: number;
}

interface AnalyticsState {
  // State
  selectedTimeRange: '1h' | '24h' | '7d' | '30d';
  metrics: AnalyticsMetric[];
  dashboardLayout: string[];

  // Actions
  setTimeRange: (range: '1h' | '24h' | '7d' | '30d') => void;
  updateMetric: (metric: AnalyticsMetric) => void;
  updateDashboardLayout: (layout: string[]) => void;

  // Computed
  getMetricByName: (name: string) => AnalyticsMetric | undefined;
  getRecentMetrics: () => AnalyticsMetric[];
}

export const useAnalyticsStore = create<AnalyticsState>()(
  subscribeWithSelector(
    immer((set, get) => ({
      // Initial state
      selectedTimeRange: '24h',
      metrics: [],
      dashboardLayout: ['performance', 'predictions', 'betting'],

      // Actions
      setTimeRange: range =>
        set(state => {
          state.selectedTimeRange = range;
        }),

      updateMetric: metric =>
        set(state => {
          const existingIndex = state.metrics.findIndex(m => m.id === metric.id);
          if (existingIndex >= 0) {
            state.metrics[existingIndex] = metric;
          } else {
            state.metrics.push(metric);
          }
        }),

      updateDashboardLayout: layout =>
        set(state => {
          state.dashboardLayout = layout;
        }),

      // Computed
      getMetricByName: name => {
        const { metrics } = get();
        return metrics.find(m => m.name === name);
      },

      getRecentMetrics: () => {
        const { metrics } = get();
        const oneHourAgo = Date.now() - 60 * 60 * 1000;
        return metrics.filter(m => m.timestamp > oneHourAgo);
      },
    }))
  )
);

// =============================================================================
// STORE SUBSCRIPTIONS AND REACTIONS
// =============================================================================

// Subscribe to betting store changes for analytics
useBettingStore.subscribe(
  state => state.selectedBets,
  selectedBets => {
    // Track bet selection analytics
    const analyticsStore = useAnalyticsStore.getState();
    analyticsStore.updateMetric({
      id: 'active-bets',
      name: 'Active Bets',
      value: selectedBets.length,
      change: 0, // Calculate change if needed
      timestamp: Date.now(),
    });
  }
);

// Subscribe to UI store theme changes
useUIStore.subscribe(
  state => state.theme,
  theme => {
    // Apply theme to document
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else if (theme === 'light') {
      document.documentElement.classList.remove('dark');
    } else {
      // System theme
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  }
);

// =============================================================================
// CUSTOM HOOKS FOR STORE SLICES
// =============================================================================

// Betting hooks
export const useBetSlip = () =>
  useBettingStore(state => ({
    selectedBets: state.selectedBets,
    betSlipOpen: state.betSlipOpen,
    stakes: state.stakes,
    addBet: state.addBet,
    removeBet: state.removeBet,
    clearBetSlip: state.clearBetSlip,
    toggleBetSlip: state.toggleBetSlip,
    updateStake: state.updateStake,
    totalStake: state.getTotalStake(),
    totalPayout: state.getTotalPayout(),
    validBets: state.getValidBets(),
  }));

// UI hooks
export const useTheme = () =>
  useUIStore(state => ({
    theme: state.theme,
    setTheme: state.setTheme,
  }));

export const useSidebar = () =>
  useUIStore(state => ({
    sidebarOpen: state.sidebarOpen,
    toggleSidebar: state.toggleSidebar,
  }));

export const useAppFilters = () =>
  useUIStore(state => ({
    selectedSport: state.selectedSport,
    searchQuery: state.searchQuery,
    activeFilters: state.activeFilters,
    setSelectedSport: state.setSelectedSport,
    setSearchQuery: state.setSearchQuery,
    updateFilter: state.updateFilter,
    clearFilters: state.clearFilters,
  }));

// Analytics hooks
export const useAnalytics = () =>
  useAnalyticsStore(state => ({
    selectedTimeRange: state.selectedTimeRange,
    metrics: state.metrics,
    dashboardLayout: state.dashboardLayout,
    setTimeRange: state.setTimeRange,
    updateMetric: state.updateMetric,
    updateDashboardLayout: state.updateDashboardLayout,
    getMetricByName: state.getMetricByName,
    getRecentMetrics: state.getRecentMetrics,
  }));

// =============================================================================
// STORE DEVTOOLS
// =============================================================================

// Enable Redux DevTools for development
if (process.env.NODE_ENV === 'development') {
  // @ts-ignore
  window.__ZUSTAND_STORES__ = {
    betting: useBettingStore,
    ui: useUIStore,
    analytics: useAnalyticsStore,
  };
}
