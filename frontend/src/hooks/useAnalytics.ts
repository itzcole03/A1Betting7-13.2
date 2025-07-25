/**
 * Consolidated Analytics Hook
 * Combines unified analytics, betting analytics, and general analytics functionality
 */

import { useCallback, useEffect, useState } from 'react';

// Consolidated interface combining all analytics functionality
export interface AnalyticsMetrics {
  // Performance metrics
  performance: {
    totalBets: number;
    activeBets: number;
    winningBets: number;
    losingBets: number;
    winRate: number;
    roi: number;
    profit: number;
    avgStake: number;
    avgOdds: number;
    bestWin: number;
    worstLoss: number;
    streak: number;
    bestDay: number;
    worstDay: number;
  };

  // Time-based performance
  timeframe: {
    profitToday: number;
    profitThisWeek: number;
    profitThisMonth: number;
    betsToday: number;
    betsThisWeek: number;
    betsThisMonth: number;
  };

  // Model performance metrics
  models: {
    [modelName: string]: {
      accuracy: number;
      precision: number;
      recall: number;
      f1Score: number;
      predictions: number;
      confidence: number;
    };
  };

  // Sports breakdown
  sports: {
    [sport: string]: {
      bets: number;
      winRate: number;
      roi: number;
      profit: number;
      avgValue: number;
    };
  };

  // Market analysis
  markets: {
    [market: string]: {
      volume: number;
      accuracy: number;
      avgValue: number;
      profitability: number;
    };
  };

  // Trend analysis
  trends: {
    daily: Array<{ date: string; profit: number; bets: number; winRate: number }>;
    weekly: Array<{ week: string; profit: number; bets: number; winRate: number }>;
    monthly: Array<{ month: string; profit: number; bets: number; winRate: number }>;
  };
}

export interface BettingOpportunity {
  id: string;
  sport: string;
  game: string;
  market: string;
  odds: number;
  value: number;
  confidence: number;
  recommendedStake: number;
  bookmaker: string;
  timestamp: Date;
}

export interface AnalyticsHookReturn {
  metrics: AnalyticsMetrics;
  opportunities: BettingOpportunity[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  trackEvent: (event: string, properties?: Record<string, unknown>) => void;
  trackBet: (betData: any) => void;
  refreshMetrics: () => Promise<void>;
  clearCache: () => void;
  
  // Utility functions
  calculateROI: (profit: number, invested: number) => number;
  getWinRate: (wins: number, total: number) => number;
  getBestSport: () => string;
  getWorstSport: () => string;
}

export const useAnalytics = (): AnalyticsHookReturn => {
  const [metrics, setMetrics] = useState<AnalyticsMetrics>({
    performance: {
      totalBets: 0,
      activeBets: 0,
      winningBets: 0,
      losingBets: 0,
      winRate: 0,
      roi: 0,
      profit: 0,
      avgStake: 0,
      avgOdds: 0,
      bestWin: 0,
      worstLoss: 0,
      streak: 0,
      bestDay: 0,
      worstDay: 0,
    },
    timeframe: {
      profitToday: 0,
      profitThisWeek: 0,
      profitThisMonth: 0,
      betsToday: 0,
      betsThisWeek: 0,
      betsThisMonth: 0,
    },
    models: {},
    sports: {},
    markets: {},
    trends: {
      daily: [],
      weekly: [],
      monthly: [],
    },
  });

  const [opportunities, setOpportunities] = useState<BettingOpportunity[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Track events
  const trackEvent = useCallback((event: string, properties?: Record<string, unknown>) => {
    try {
      // Send to analytics service
      console.log('Analytics Event:', event, properties);
      
      // Could integrate with external analytics
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', event, properties);
      }
    } catch (err) {
      console.error('Failed to track event:', err);
    }
  }, []);

  // Track bet-specific data
  const trackBet = useCallback((betData: any) => {
    try {
      trackEvent('bet_placed', {
        sport: betData.sport,
        market: betData.market,
        odds: betData.odds,
        stake: betData.stake,
        value: betData.value,
      });
    } catch (err) {
      console.error('Failed to track bet:', err);
    }
  }, [trackEvent]);

  // Refresh metrics from API
  const refreshMetrics = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // In a real app, this would fetch from your analytics API
      // For now, generate mock data
      const mockMetrics: AnalyticsMetrics = {
        performance: {
          totalBets: 142,
          activeBets: 8,
          winningBets: 95,
          losingBets: 39,
          winRate: 67.3,
          roi: 15.6,
          profit: 2340,
          avgStake: 25,
          avgOdds: -110,
          bestWin: 450,
          worstLoss: -125,
          streak: 5,
          bestDay: 380,
          worstDay: -225,
        },
        timeframe: {
          profitToday: 180,
          profitThisWeek: 520,
          profitThisMonth: 2340,
          betsToday: 5,
          betsThisWeek: 18,
          betsThisMonth: 142,
        },
        models: {
          'Neural Network': { accuracy: 68.2, precision: 71.5, recall: 65.8, f1Score: 68.5, predictions: 89, confidence: 0.72 },
          'Random Forest': { accuracy: 72.1, precision: 74.3, recall: 69.2, f1Score: 71.6, predictions: 76, confidence: 0.68 },
          'XGBoost': { accuracy: 75.4, precision: 78.1, recall: 72.6, f1Score: 75.2, predictions: 92, confidence: 0.81 },
        },
        sports: {
          'NBA': { bets: 43, winRate: 72.1, roi: 18.3, profit: 1250, avgValue: 6.8 },
          'NFL': { bets: 38, winRate: 68.4, roi: 12.7, profit: 890, avgValue: 5.9 },
          'NHL': { bets: 26, winRate: 61.5, roi: 8.2, profit: 200, avgValue: 4.2 },
          'MLB': { bets: 35, winRate: 64.7, roi: -2.1, profit: 0, avgValue: 3.8 },
        },
        markets: {
          'Player Props': { volume: 78, accuracy: 69.2, avgValue: 6.2, profitability: 14.8 },
          'Game Lines': { volume: 34, accuracy: 73.5, avgValue: 7.1, profitability: 18.9 },
          'Totals': { volume: 30, accuracy: 66.7, avgValue: 5.4, profitability: 11.2 },
        },
        trends: {
          daily: [
            { date: '2024-01-15', profit: 180, bets: 5, winRate: 80 },
            { date: '2024-01-14', profit: -75, bets: 3, winRate: 33 },
            { date: '2024-01-13', profit: 220, bets: 6, winRate: 83 },
            { date: '2024-01-12', profit: 95, bets: 4, winRate: 75 },
            { date: '2024-01-11', profit: -50, bets: 2, winRate: 0 },
          ],
          weekly: [
            { week: 'Week 3', profit: 520, bets: 18, winRate: 72 },
            { week: 'Week 2', profit: 380, bets: 22, winRate: 68 },
            { week: 'Week 1', profit: 290, bets: 16, winRate: 75 },
          ],
          monthly: [
            { month: 'January 2024', profit: 2340, bets: 142, winRate: 67 },
            { month: 'December 2023', profit: 1890, bets: 128, winRate: 64 },
            { month: 'November 2023', profit: 1420, bets: 156, winRate: 69 },
          ],
        },
      };

      const mockOpportunities: BettingOpportunity[] = [
        {
          id: '1',
          sport: 'NBA',
          game: 'Lakers vs Celtics',
          market: 'LeBron James Points Over 25.5',
          odds: -110,
          value: 8.2,
          confidence: 87,
          recommendedStake: 50,
          bookmaker: 'PrizePicks',
          timestamp: new Date(),
        },
        {
          id: '2',
          sport: 'NFL',
          game: 'Bills vs Dolphins',
          market: 'Josh Allen Passing Yards Over 287.5',
          odds: -105,
          value: 7.5,
          confidence: 82,
          recommendedStake: 40,
          bookmaker: 'PrizePicks',
          timestamp: new Date(),
        },
      ];

      setMetrics(mockMetrics);
      setOpportunities(mockOpportunities);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch analytics');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Utility functions
  const calculateROI = useCallback((profit: number, invested: number): number => {
    if (invested === 0) return 0;
    return (profit / invested) * 100;
  }, []);

  const getWinRate = useCallback((wins: number, total: number): number => {
    if (total === 0) return 0;
    return (wins / total) * 100;
  }, []);

  const getBestSport = useCallback((): string => {
    const sports = Object.entries(metrics.sports);
    if (sports.length === 0) return 'N/A';
    
    const best = sports.reduce((best, [sport, data]) => 
      data.roi > best[1].roi ? [sport, data] : best
    );
    return best[0];
  }, [metrics.sports]);

  const getWorstSport = useCallback((): string => {
    const sports = Object.entries(metrics.sports);
    if (sports.length === 0) return 'N/A';
    
    const worst = sports.reduce((worst, [sport, data]) => 
      data.roi < worst[1].roi ? [sport, data] : worst
    );
    return worst[0];
  }, [metrics.sports]);

  const clearCache = useCallback(() => {
    setMetrics({
      performance: {
        totalBets: 0, activeBets: 0, winningBets: 0, losingBets: 0,
        winRate: 0, roi: 0, profit: 0, avgStake: 0, avgOdds: 0,
        bestWin: 0, worstLoss: 0, streak: 0, bestDay: 0, worstDay: 0,
      },
      timeframe: {
        profitToday: 0, profitThisWeek: 0, profitThisMonth: 0,
        betsToday: 0, betsThisWeek: 0, betsThisMonth: 0,
      },
      models: {},
      sports: {},
      markets: {},
      trends: { daily: [], weekly: [], monthly: [] },
    });
    setOpportunities([]);
  }, []);

  // Load initial data
  useEffect(() => {
    refreshMetrics();
  }, [refreshMetrics]);

  return {
    metrics,
    opportunities,
    isLoading,
    error,
    trackEvent,
    trackBet,
    refreshMetrics,
    clearCache,
    calculateROI,
    getWinRate,
    getBestSport,
    getWorstSport,
  };
};

// Export for backward compatibility
export const useUnifiedAnalytics = useAnalytics;
export const useBettingAnalytics = useAnalytics;

export default useAnalytics;
