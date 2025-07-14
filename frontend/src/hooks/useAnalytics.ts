import { useState, useEffect, useCallback } from 'react';
import { masterServiceRegistry } from '../services/MasterServiceRegistry';

interface AnalyticsData {
  totalBets: number;
  winRate: number;
  roi: number;
  profit: number;
  avgOdds: number;
  lastUpdated: Date;
}

interface AnalyticsFilters {
  sport?: string;
  dateRange?: { start: Date; end: Date };
  minOdds?: number;
  maxOdds?: number;
}

export const useAnalytics = () => {
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalBets: 0,
    winRate: 0,
    roi: 0,
    profit: 0,
    avgOdds: 0,
    lastUpdated: new Date(),
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = useCallback(async (filters?: AnalyticsFilters) => {
    try {
      setLoading(true);
      setError(null);

      const analyticsService = masterServiceRegistry.getService('analytics');
      if (!analyticsService) {
        throw new Error('Analytics service not available');
      }

      const data = await analyticsService.getAnalytics(filters);
      setAnalytics({
        totalBets: data.totalBets || 0,
        winRate: data.winRate || 0,
        roi: data.roi || 0,
        profit: data.profit || 0,
        avgOdds: data.avgOdds || 0,
        lastUpdated: new Date(),
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch analytics';
      setError(errorMessage);
      console.error('Analytics fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshAnalytics = useCallback(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const trackEvent = useCallback(async (event: string, data?: any) => {
    try {
      const analyticsService = masterServiceRegistry.getService('analytics');
      if (analyticsService?.trackEvent) {
        await analyticsService.trackEvent(event, data);
      }
    } catch (err) {
      console.error('Failed to track event:', err);
    }
  }, []);

  const trackBet = useCallback(
    async (betData: any) => {
      try {
        const analyticsService = masterServiceRegistry.getService('analytics');
        if (analyticsService?.trackBet) {
          await analyticsService.trackBet(betData);
          // Refresh analytics after tracking a bet
          refreshAnalytics();
        }
      } catch (err) {
        console.error('Failed to track bet:', err);
      }
    },
    [refreshAnalytics]
  );

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  return {
    analytics,
    loading,
    error,
    fetchAnalytics,
    refreshAnalytics,
    trackEvent,
    trackBet,
  };
};

export default useAnalytics;
