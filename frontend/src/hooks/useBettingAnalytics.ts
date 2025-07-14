import { useState, useEffect, useCallback } from 'react';
import { masterServiceRegistry } from '../services/MasterServiceRegistry';

interface BettingMetrics {
  totalBets: number;
  activeBets: number;
  winningBets: number;
  losingBets: number;
  winRate: number;
  roi: number;
  totalProfit: number;
  avgStake: number;
  avgOdds: number;
  bestWin: number;
  worstLoss: number;
  profitToday: number;
  profitThisWeek: number;
  profitThisMonth: number;
}

interface BettingOpportunity {
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

export const useBettingAnalytics = () => {
  const [metrics, setMetrics] = useState<BettingMetrics>({
    totalBets: 0,
    activeBets: 0,
    winningBets: 0,
    losingBets: 0,
    winRate: 0,
    roi: 0,
    totalProfit: 0,
    avgStake: 0,
    avgOdds: 0,
    bestWin: 0,
    worstLoss: 0,
    profitToday: 0,
    profitThisWeek: 0,
    profitThisMonth: 0,
  });

  const [opportunities, setOpportunities] = useState<BettingOpportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBettingMetrics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const bettingService = masterServiceRegistry.getService('betting');
      if (!bettingService) {
        throw new Error('Betting service not available');
      }

      const metricsData = await bettingService.getBettingMetrics();
      setMetrics(metricsData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch betting metrics';
      setError(errorMessage);
      console.error('Betting metrics fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchBettingOpportunities = useCallback(async () => {
    try {
      const bettingService = masterServiceRegistry.getService('betting');
      if (!bettingService) {
        return;
      }

      const opportunitiesData = await bettingService.getBettingOpportunities();
      setOpportunities(opportunitiesData || []);
    } catch (err) {
      console.error('Failed to fetch betting opportunities:', err);
      setOpportunities([]);
    }
  }, []);

  const placeBet = useCallback(
    async (betData: any) => {
      try {
        const bettingService = masterServiceRegistry.getService('betting');
        if (!bettingService) {
          throw new Error('Betting service not available');
        }

        const success = await bettingService.placeBet(betData);
        if (success) {
          // Refresh metrics after placing a bet
          await fetchBettingMetrics();
          await fetchBettingOpportunities();
        }
        return success;
      } catch (err) {
        console.error('Failed to place bet:', err);
        throw err;
      }
    },
    [fetchBettingMetrics, fetchBettingOpportunities]
  );

  const getBetHistory = useCallback(async (filters?: any) => {
    try {
      const bettingService = masterServiceRegistry.getService('betting');
      if (!bettingService) {
        return [];
      }

      return await bettingService.getBetHistory(filters);
    } catch (err) {
      console.error('Failed to fetch bet history:', err);
      return [];
    }
  }, []);

  const updateBettingConfig = useCallback(async (config: any) => {
    try {
      const bettingService = masterServiceRegistry.getService('betting');
      if (!bettingService) {
        return false;
      }

      bettingService.setConfig(config);
      return true;
    } catch (err) {
      console.error('Failed to update betting config:', err);
      return false;
    }
  }, []);

  const refreshData = useCallback(async () => {
    await Promise.all([fetchBettingMetrics(), fetchBettingOpportunities()]);
  }, [fetchBettingMetrics, fetchBettingOpportunities]);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  return {
    metrics,
    opportunities,
    loading,
    error,
    fetchBettingMetrics,
    fetchBettingOpportunities,
    placeBet,
    getBetHistory,
    updateBettingConfig,
    refreshData,
  };
};

export default useBettingAnalytics;
