/**
 * CONSOLIDATED STORE INDEX
 * Central export point for all Zustand stores
 */

import { create } from 'zustand';
import { persist, subscribeWithSelector } from 'zustand/middleware';

// ===== TYPES =====

export interface User {
  id: string;
  email: string;
  name: string;
  preferences: Record<string, any>;
}

export interface Bet {
  id: string;
  type: string;
  amount: number;
  odds: number;
  status: 'pending' | 'won' | 'lost';
  sport: string;
  market: string;
  timestamp: Date;
}

export interface Prediction {
  id: string;
  sport: string;
  market: string;
  prediction: any;
  confidence: number;
  timestamp: Date;
}

// ===== MAIN APP STORE =====

interface AppState {
  // User state
  user: User | null;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
  logout: () => void;

  // UI state
  theme: 'light' | 'dark' | 'cyber';
  sidebarOpen: boolean;
  loading: boolean;
  setTheme: (theme: 'light' | 'dark' | 'cyber') => void;
  setSidebarOpen: (open: boolean) => void;
  setLoading: (loading: boolean) => void;

  // Notifications
  notifications: Array<{
    id: string;
    type: 'info' | 'success' | 'warning' | 'error';
    message: string;
    timestamp: Date;
  }>;
  addNotification: (notification: Omit<AppState['notifications'][0], 'id' | 'timestamp'>) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    subscribeWithSelector((set, get) => ({
      // Initial state
      user: null,
      isAuthenticated: false,
      theme: 'cyber',
      sidebarOpen: true,
      loading: false,
      notifications: [],

      // User actions
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      logout: () => set({ user: null, isAuthenticated: false }),

      // UI actions
      setTheme: (theme) => set({ theme }),
      setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
      setLoading: (loading) => set({ loading }),

      // Notification actions
      addNotification: (notification) => set((state) => ({
        notifications: [
          ...state.notifications,
          {
            ...notification,
            id: Date.now().toString(),
            timestamp: new Date(),
          },
        ],
      })),
      removeNotification: (id) => set((state) => ({
        notifications: state.notifications.filter(n => n.id !== id),
      })),
      clearNotifications: () => set({ notifications: [] }),
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
  )
);

// ===== BETTING STORE =====

interface BettingState {
  bets: Bet[];
  activeBets: Bet[];
  betHistory: Bet[];
  totalStaked: number;
  totalWon: number;
  winRate: number;
  
  addBet: (bet: Omit<Bet, 'id' | 'timestamp'>) => void;
  updateBet: (id: string, updates: Partial<Bet>) => void;
  removeBet: (id: string) => void;
  clearHistory: () => void;
  calculateStats: () => void;
}

export const useBettingStore = create<BettingState>()(
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
        }));
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
        });
        get().calculateStats();
      },

      removeBet: (id) => {
        set((state) => ({
          bets: state.bets.filter(bet => bet.id !== id),
          activeBets: state.activeBets.filter(bet => bet.id !== id),
          betHistory: state.betHistory.filter(bet => bet.id !== id),
        }));
        get().calculateStats();
      },

      clearHistory: () => set({ betHistory: [] }),

      calculateStats: () => {
        const { bets } = get();
        const completedBets = bets.filter(bet => bet.status !== 'pending');
        const wonBets = completedBets.filter(bet => bet.status === 'won');
        
        const totalStaked = completedBets.reduce((sum, bet) => sum + bet.amount, 0);
        const totalWon = wonBets.reduce((sum, bet) => sum + (bet.amount * Math.abs(bet.odds / 100)), 0);
        const winRate = completedBets.length > 0 ? (wonBets.length / completedBets.length) * 100 : 0;

        set({ totalStaked, totalWon, winRate });
      },
    }),
    {
      name: 'betting-store',
    }
  )
);

// ===== PREDICTION STORE =====

interface PredictionState {
  predictions: Prediction[];
  favorites: string[];
  filters: {
    sport: string;
    confidence: number;
    dateRange: [Date, Date] | null;
  };
  
  addPrediction: (prediction: Omit<Prediction, 'id' | 'timestamp'>) => void;
  removePrediction: (id: string) => void;
  toggleFavorite: (id: string) => void;
  setFilters: (filters: Partial<PredictionState['filters']>) => void;
  clearPredictions: () => void;
}

export const usePredictionStore = create<PredictionState>()(
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
        }));
      },

      removePrediction: (id) => set((state) => ({
        predictions: state.predictions.filter(p => p.id !== id),
        favorites: state.favorites.filter(f => f !== id),
      })),

      toggleFavorite: (id) => set((state) => ({
        favorites: state.favorites.includes(id)
          ? state.favorites.filter(f => f !== id)
          : [...state.favorites, id],
      })),

      setFilters: (newFilters) => set((state) => ({
        filters: { ...state.filters, ...newFilters },
      })),

      clearPredictions: () => set({ predictions: [], favorites: [] }),
    }),
    {
      name: 'prediction-store',
    }
  )
);

// ===== EXPORTS =====

// Export all stores
export {
  useAppStore,
  useBettingStore,
  usePredictionStore,
};

// Export types
export type {
  User,
  Bet,
  Prediction,
  AppState,
  BettingState,
  PredictionState,
};

// Default export
export default {
  useAppStore,
  useBettingStore,
  usePredictionStore,
};
