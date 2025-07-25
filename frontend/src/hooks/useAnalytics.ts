import { useCallback, useEffect, useState } from 'react';

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

export const _useAnalytics = () => {
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

  const _fetchAnalytics = useCallback(async (filters?: AnalyticsFilters) => {
    try {
      setLoading(true);
      setError(null);

      const _analyticsService = masterServiceRegistry.getService('analytics');
      if (!analyticsService) {
        throw new Error('Analytics service not available');
      }

      const _data = await analyticsService.getAnalytics(filters);
      setAnalytics({
        totalBets: data.totalBets || 0,
        winRate: data.winRate || 0,
        roi: data.roi || 0,
        profit: data.profit || 0,
        avgOdds: data.avgOdds || 0,
        lastUpdated: new Date(),
      });
    } catch (err) {
      const _errorMessage = err instanceof Error ? err.message : 'Failed to fetch analytics';
      setError(errorMessage);
      console.error('Analytics fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const _refreshAnalytics = useCallback(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const _trackEvent = useCallback(async (event: string, data?: unknown) => {
    try {
      const _analyticsService = masterServiceRegistry.getService('analytics');
      if (analyticsService?.trackEvent) {
        await analyticsService.trackEvent(event, data);
      }
    } catch (err) {
      console.error('Failed to track event:', err);
    }
  }, []);

  const _trackBet = useCallback(
    async (betData: unknown) => {
      try {
        const _analyticsService = masterServiceRegistry.getService('analytics');
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
