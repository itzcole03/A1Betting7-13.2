/**
 * CONSOLIDATED STORE INDEX
 * Central export point for all Zustand stores with performance optimizations
 */

import { create } from 'zustand';
import { persist, subscribeWithSelector, devtools } from 'zustand/middleware';

// Import centralized types
import type { 
  AppState, 
  BettingState, 
  PredictionState,
  User,
  Bet,
  Prediction
} from './types';

// ===== MAIN APP STORE =====

const useAppStore = create<AppState>()(
  devtools(
    persist(
      subscribeWithSelector((_set, _get) => ({
        // Initial state
        user: null,
        isAuthenticated: false,
        theme: 'cyber',
        sidebarOpen: true,
        loading: false,
        notifications: [],

        // User actions
        setUser: (user: User | null) => _set({ user, isAuthenticated: !!user }, false, 'setUser'),
        logout: () => _set({ user: null, isAuthenticated: false }, false, 'logout'),

        // UI actions
        setTheme: (theme) => _set({ theme }, false, 'setTheme'),
        setSidebarOpen: (sidebarOpen) => _set({ sidebarOpen }, false, 'setSidebarOpen'),
        setLoading: (loading) => _set({ loading }, false, 'setLoading'),

        // Notification actions
        addNotification: (notification) => _set((state) => ({
          notifications: [
            ...state.notifications,
            {
              ...notification,
              id: Date.now().toString(),
              timestamp: new Date(),
            },
          ],
        }), false, 'addNotification'),
        removeNotification: (id) => _set((state) => ({
          notifications: state.notifications.filter(n => n.id !== id),
        }), false, 'removeNotification'),
        clearNotifications: () => _set({ notifications: [] }, false, 'clearNotifications'),
      })),
      {
        name: 'app-store',
        partialize: (state) => ({
          user: state.user,
          isAuthenticated: state.isAuthenticated,
          theme: state.theme,
          sidebarOpen: state.sidebarOpen,
        }),
      }
    ),
    {
      name: 'AppStore'
    }
  )
);

// ===== BETTING STORE =====

const useBettingStore = create<BettingState>()(
  devtools(
    persist(
      (set, get) => ({
        bets: [],
        activeBets: [],
        betHistory: [],
        totalStaked: 0,
        totalWon: 0,
        winRate: 0,

        addBet: (betData) => {
          const bet: Bet = {
            ...betData,
            id: Date.now().toString(),
            timestamp: new Date(),
          };
          set((state) => ({
            bets: [...state.bets, bet],
            activeBets: bet.status === 'pending' ? [...state.activeBets, bet] : state.activeBets,
            betHistory: bet.status !== 'pending' ? [...state.betHistory, bet] : state.betHistory,
          }), false, 'addBet');
          get().calculateStats();
        },

        updateBet: (id, updates) => {
          set((state) => {
            const updatedBets = state.bets.map(bet => 
              bet.id === id ? { ...bet, ...updates } : bet
            );
            return {
              bets: updatedBets,
              activeBets: updatedBets.filter(bet => bet.status === 'pending'),
              betHistory: updatedBets.filter(bet => bet.status !== 'pending'),
            };
          }, false, 'updateBet');
          get().calculateStats();
        },

        removeBet: (id) => {
          set((state) => ({
            bets: state.bets.filter(bet => bet.id !== id),
            activeBets: state.activeBets.filter(bet => bet.id !== id),
            betHistory: state.betHistory.filter(bet => bet.id !== id),
          }), false, 'removeBet');
          get().calculateStats();
        },

        clearHistory: () => set({ betHistory: [] }, false, 'clearHistory'),

        calculateStats: () => {
          const { bets } = get();
          const completedBets = bets.filter(bet => bet.status !== 'pending');
          const wonBets = completedBets.filter(bet => bet.status === 'won');
          
          const totalStaked = completedBets.reduce((sum, bet) => sum + bet.amount, 0);
          const totalWon = wonBets.reduce((sum, bet) => sum + (bet.amount * Math.abs(bet.odds / 100)), 0);
          const winRate = completedBets.length > 0 ? (wonBets.length / completedBets.length) * 100 : 0;

          set({ totalStaked, totalWon, winRate }, false, 'calculateStats');
        },
      }),
      {
        name: 'betting-store',
      }
    ),
    {
      name: 'BettingStore'
    }
  )
);

// ===== PREDICTION STORE =====

const usePredictionStore = create<PredictionState>()(
  devtools(
    persist(
      (set) => ({
        predictions: [],
        favorites: [],
        filters: {
          sport: 'All',
          confidence: 0,
          dateRange: null,
        },

        addPrediction: (predictionData) => {
          const prediction: Prediction = {
            ...predictionData,
            id: Date.now().toString(),
            timestamp: new Date(),
          };
          set((state) => ({
            predictions: [...state.predictions, prediction],
          }), false, 'addPrediction');
        },

        removePrediction: (id) => set((state) => ({
          predictions: state.predictions.filter(p => p.id !== id),
          favorites: state.favorites.filter(f => f !== id),
        }), false, 'removePrediction'),

        toggleFavorite: (id) => set((state) => ({
          favorites: state.favorites.includes(id)
            ? state.favorites.filter(f => f !== id)
            : [...state.favorites, id],
        }), false, 'toggleFavorite'),

        setFilters: (newFilters) => set((state) => ({
          filters: { ...state.filters, ...newFilters },
        }), false, 'setFilters'),

        clearPredictions: () => set({ predictions: [], favorites: [] }, false, 'clearPredictions'),
      }),
      {
        name: 'prediction-store',
      }
    ),
    {
      name: 'PredictionStore'
    }
  )
);

// ===== SELECTOR FUNCTIONS FOR COMPONENTS =====

// App Store Selectors (These are selector functions, not hooks)
const appSelectors = {
  isLoggedIn: (state: AppState) => state.isAuthenticated,
  user: (state: AppState) => state.user,
  theme: (state: AppState) => state.theme,
  notifications: (state: AppState) => state.notifications,
  unreadCount: (state: AppState) => state.notifications.length,
  loading: (state: AppState) => state.loading,
  sidebarOpen: (state: AppState) => state.sidebarOpen,
};

// Betting Store Selectors  
const bettingSelectors = {
  activeBets: (state: BettingState) => state.activeBets,
  betHistory: (state: BettingState) => state.betHistory,
  totalProfit: (state: BettingState) => state.totalWon - state.totalStaked,
  winRate: (state: BettingState) => state.winRate,
  activeBetCount: (state: BettingState) => state.activeBets.length,
  recentBets: (state: BettingState) => state.betHistory.slice(-5).reverse(),
};

// Prediction Store Selectors
const predictionSelectors = {
  allPredictions: (state: PredictionState) => state.predictions,
  favorites: (state: PredictionState) => state.favorites,
  filters: (state: PredictionState) => state.filters,
  filteredPredictions: (state: PredictionState) => {
    const { predictions, filters } = state;
    return predictions.filter(prediction => {
      if (filters.sport !== 'All' && prediction.sport !== filters.sport) return false;
      if (prediction.confidence < filters.confidence) return false;
      if (filters.dateRange) {
        const predDate = new Date(prediction.timestamp);
        const [start, end] = filters.dateRange;
        if (predDate < start || predDate > end) return false;
      }
      return true;
    });
  },
  highConfidencePredictions: (state: PredictionState) => 
    state.predictions.filter(p => p.confidence >= 80),
  favoritePredictions: (state: PredictionState) => 
    state.predictions.filter(p => state.favorites.includes(p.id)),
  predictionStats: (state: PredictionState) => ({
    total: state.predictions.length,
    highConfidence: state.predictions.filter(p => p.confidence >= 80).length,
    favorites: state.favorites.length,
  }),
};

// ===== EXPORTS =====

// Export all stores
export {
  useAppStore,
  useBettingStore,
  usePredictionStore,
};

// Export selectors for optimized access
export {
  appSelectors,
  bettingSelectors,
  predictionSelectors,
};

// Export types
export type {
  AppState,
  BettingState,
  PredictionState,
};

// Default export
export default {
  useAppStore,
  useBettingStore,
  usePredictionStore,
  selectors: {
    app: appSelectors,
    betting: bettingSelectors,
    prediction: predictionSelectors,
  },
};
