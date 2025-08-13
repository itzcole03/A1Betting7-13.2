import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

// Types for bet history
export interface BetEntry {
  betId: string;
  date: string;
  betType: string;
  amount: number;
  odds: number;
  result: 'Win' | 'Loss' | 'Push' | 'Pending';
  profit: number;
}

export interface UserHistory {
  totalBets: number;
  winRate: number;
  totalProfit: number;
  roi: number;
  entries: BetEntry[];
}

export interface ModelEntry {
  date: string;
  prediction: string;
  confidence: number;
  outcome: 'Correct' | 'Incorrect' | 'Pending';
  accuracy: number;
}

export interface ModelHistory {
  model: string;
  market: string;
  accuracy: number;
  totalPredictions: number;
  entries: ModelEntry[];
}

export interface BetHistoryState {
  userHistory: UserHistory;
  modelHistory: ModelHistory[];
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchUserHistory: () => Promise<void>;
  fetchModelHistory: () => Promise<void>;
  addBetEntry: (entry: BetEntry) => void;
  updateBetResult: (betId: string, result: BetEntry['result'], profit: number) => void;
  clearHistory: () => void;
}

// Initial state with mock data
const initialUserHistory: UserHistory = {
  totalBets: 127,
  winRate: 68.5,
  totalProfit: 2847.5,
  roi: 23.8,
  entries: [
    {
      betId: 'bet_001',
      date: '2024-01-08',
      betType: 'Moneyline',
      amount: 100,
      odds: 1.85,
      result: 'Win',
      profit: 85,
    },
    {
      betId: 'bet_002',
      date: '2024-01-07',
      betType: 'Spread',
      amount: 150,
      odds: 1.91,
      result: 'Win',
      profit: 136.5,
    },
    {
      betId: 'bet_003',
      date: '2024-01-06',
      betType: 'Over/Under',
      amount: 75,
      odds: 1.95,
      result: 'Loss',
      profit: -75,
    },
    {
      betId: 'bet_004',
      date: '2024-01-05',
      betType: 'Parlay',
      amount: 50,
      odds: 3.2,
      result: 'Win',
      profit: 110,
    },
  ],
};

const initialModelHistory: ModelHistory[] = [
  {
    model: 'Neural Network Alpha',
    market: 'NBA Spreads',
    accuracy: 72.3,
    totalPredictions: 156,
    entries: [
      {
        date: '2024-01-08',
        prediction: 'Lakers -4.5',
        confidence: 89,
        outcome: 'Correct',
        accuracy: 72.3,
      },
      {
        date: '2024-01-07',
        prediction: 'Warriors +2.5',
        confidence: 78,
        outcome: 'Correct',
        accuracy: 72.1,
      },
      {
        date: '2024-01-06',
        prediction: 'Celtics -6.0',
        confidence: 85,
        outcome: 'Incorrect',
        accuracy: 71.8,
      },
    ],
  },
  {
    model: 'Ensemble Model Beta',
    market: 'NFL Totals',
    accuracy: 68.9,
    totalPredictions: 89,
    entries: [
      {
        date: '2024-01-08',
        prediction: 'Chiefs vs Bills O47.5',
        confidence: 82,
        outcome: 'Correct',
        accuracy: 68.9,
      },
      {
        date: '2024-01-07',
        prediction: 'Ravens vs Steelers U44.0',
        confidence: 76,
        outcome: 'Correct',
        accuracy: 68.7,
      },
    ],
  },
];

export const useBetHistoryStore = create<BetHistoryState>()(
  devtools(
    (set, get) => ({
      userHistory: initialUserHistory,
      modelHistory: initialModelHistory,
      isLoading: false,
      error: null,

      fetchUserHistory: async () => {
        set({ isLoading: true, error: null });
        try {
          // In a real app, this would fetch from an API
          await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call

          // For now, just use the initial data
          set({ userHistory: initialUserHistory, isLoading: false });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to fetch user history',
            isLoading: false,
          });
        }
      },

      fetchModelHistory: async () => {
        set({ isLoading: true, error: null });
        try {
          // In a real app, this would fetch from an API
          await new Promise(resolve => setTimeout(resolve, 800)); // Simulate API call

          // For now, just use the initial data
          set({ modelHistory: initialModelHistory, isLoading: false });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to fetch model history',
            isLoading: false,
          });
        }
      },

      addBetEntry: (entry: BetEntry) => {
        const { userHistory } = get();
        const updatedEntries = [entry, ...userHistory.entries];
        const totalBets = updatedEntries.length;
        const wins = updatedEntries.filter(e => e.result === 'Win').length;
        const totalProfit = updatedEntries.reduce((sum, e) => sum + e.profit, 0);
        const totalAmount = updatedEntries.reduce((sum, e) => sum + e.amount, 0);

        set({
          userHistory: {
            ...userHistory,
            entries: updatedEntries,
            totalBets,
            winRate: (wins / totalBets) * 100,
            totalProfit,
            roi: totalAmount > 0 ? (totalProfit / totalAmount) * 100 : 0,
          },
        });
      },

      updateBetResult: (betId: string, result: BetEntry['result'], profit: number) => {
        const { userHistory } = get();
        const updatedEntries = userHistory.entries.map(entry =>
          entry.betId === betId ? { ...entry, result, profit } : entry
        );

        const wins = updatedEntries.filter(e => e.result === 'Win').length;
        const totalProfit = updatedEntries.reduce((sum, e) => sum + e.profit, 0);
        const totalAmount = updatedEntries.reduce((sum, e) => sum + e.amount, 0);

        set({
          userHistory: {
            ...userHistory,
            entries: updatedEntries,
            winRate: (wins / updatedEntries.length) * 100,
            totalProfit,
            roi: totalAmount > 0 ? (totalProfit / totalAmount) * 100 : 0,
          },
        });
      },

      clearHistory: () => {
        set({
          userHistory: {
            totalBets: 0,
            winRate: 0,
            totalProfit: 0,
            roi: 0,
            entries: [],
          },
          modelHistory: [],
        });
      },
    }),
    {
      name: 'bet-history-store',
    }
  )
);

export default useBetHistoryStore;
