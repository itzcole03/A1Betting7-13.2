/**
 * Store Type Definitions
 * Centralized type definitions for all Zustand stores
 */

// ===== CORE TYPES =====

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

export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  message: string;
  timestamp: Date;
}

// ===== STORE STATE INTERFACES =====

export interface AppState {
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
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
}

export interface BettingState {
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

export interface PredictionFilters {
  sport: string;
  confidence: number;
  dateRange: [Date, Date] | null;
}

export interface PredictionState {
  predictions: Prediction[];
  favorites: string[];
  filters: PredictionFilters;
  
  addPrediction: (prediction: Omit<Prediction, 'id' | 'timestamp'>) => void;
  removePrediction: (id: string) => void;
  toggleFavorite: (id: string) => void;
  setFilters: (filters: Partial<PredictionFilters>) => void;
  clearPredictions: () => void;
}

// ===== STORE SELECTORS =====

export interface AppSelectors {
  isLoggedIn: (state: AppState) => boolean;
  isDarkTheme: (state: AppState) => boolean;
  unreadNotifications: (state: AppState) => Notification[];
  notificationCount: (state: AppState) => number;
}

export interface BettingSelectors {
  activeBetCount: (state: BettingState) => number;
  totalProfit: (state: BettingState) => number;
  averageOdds: (state: BettingState) => number;
  recentBets: (state: BettingState) => Bet[];
}

export interface PredictionSelectors {
  filteredPredictions: (state: PredictionState) => Prediction[];
  highConfidencePredictions: (state: PredictionState) => Prediction[];
  favoritePredictions: (state: PredictionState) => Prediction[];
  predictionStats: (state: PredictionState) => {
    total: number;
    highConfidence: number;
    favorites: number;
  };
}

// ===== STORE ACTIONS =====

export type StoreAction<T = any> = {
  type: string;
  payload?: T;
};

export interface StoreMiddleware<T> {
  (config: T): T;
}

// ===== PERSISTENCE CONFIGURATION =====

export interface PersistConfig {
  name: string;
  partialize?: (state: any) => Partial<any>;
  skipHydration?: boolean;
  version?: number;
  migrate?: (persistedState: any, version: number) => any;
}
