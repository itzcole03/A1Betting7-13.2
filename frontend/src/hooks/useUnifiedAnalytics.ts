import { useCallback, useEffect, useState } from 'react';

interface AnalyticsMetrics {
  performance: {
    totalBets: number;
    winRate: number;
    roi: number;
    profit: number;
    streak: number;
    bestDay: number;
    worstDay: number;
  };
  models: {
    [modelName: string]: {
      accuracy: number;
      precision: number;
      recall: number;
      f1Score: number;
      predictions: number;
    };
  };
  sports: {
    [sport: string]: {
      bets: number;
      winRate: number;
      roi: number;
      profit: number;
    };
  };
  markets: {
    [market: string]: {
      volume: number;
      accuracy: number;
      avgValue: number;
    };
  };
  trends: {
    daily: Array<{ date: string; profit: number; bets: number }>;
    weekly: Array<{ week: string; profit: number; bets: number }>;
    monthly: Array<{ month: string; profit: number; bets: number }>;
  };
}

export const _useUnifiedAnalytics = () => {
  const [metrics, setMetrics] = useState<AnalyticsMetrics>({
    performance: {
      totalBets: 0,
      winRate: 0,
      roi: 0,
      profit: 0,
      streak: 0,
      bestDay: 0,
      worstDay: 0,
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

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');

  const _fetchAnalytics = useCallback(
    async (range?: string) => {
      try {
        setLoading(true);
        setError(null);

        const _analyticsService = masterServiceRegistry.getService('analytics');
        if (!analyticsService) {
          throw new Error('Analytics service not available');
        }

        const _data = await analyticsService.getUnifiedMetrics({
          timeRange: range || timeRange,
          includeModels: true,
          includeSports: true,
          includeMarkets: true,
          includeTrends: true,
        });

        setMetrics(data);
      } catch (err) {
        const _errorMessage = err instanceof Error ? err.message : 'Failed to fetch analytics';
        setError(errorMessage);
        console.error('Unified analytics fetch error:', err);
      } finally {
        setLoading(false);
      }
    },
    [timeRange]
  );

  const _generateReport = useCallback(
    async (options: {
      timeRange: string;
      sports?: string[];
      includeCharts?: boolean;
      format?: 'json' | 'pdf' | 'csv';
    }) => {
      try {
        const _analyticsService = masterServiceRegistry.getService('analytics');
        if (!analyticsService?.generateReport) {
          throw new Error('Report generation not available');
        }

        return await analyticsService.generateReport(options);
      } catch (err) {
        console.error('Failed to generate report:', err);
        throw err;
      }
    },
    []
  );

  const _trackEvent = useCallback(async (event: string, properties: unknown) => {
    try {
      const _analyticsService = masterServiceRegistry.getService('analytics');
      if (analyticsService?.trackEvent) {
        await analyticsService.trackEvent(event, properties);
      }
    } catch (err) {
      console.error('Failed to track event:', err);
    }
  }, []);

  const _getModelPerformance = useCallback(
    (modelName: string) => {
      return metrics.models[modelName] || null;
    },
    [metrics.models]
  );

  const _getSportPerformance = useCallback(
    (sport: string) => {
      return metrics.sports[sport] || null;
    },
    [metrics.sports]
  );

  const _getMarketAnalysis = useCallback(
    (market: string) => {
      return metrics.markets[market] || null;
    },
    [metrics.markets]
  );

  const _getTopPerformingSports = useCallback(
    (limit = 5) => {
      return Object.entries(metrics.sports)
        .sort(([, a], [, b]) => b.roi - a.roi)
        .slice(0, limit)
        .map(([sport, data]) => ({ sport, ...data }));
    },
    [metrics.sports]
  );

  const _getTopPerformingModels = useCallback(
    (limit = 5) => {
      return Object.entries(metrics.models)
        .sort(([, a], [, b]) => b.accuracy - a.accuracy)
        .slice(0, limit)
        .map(([model, data]) => ({ model, ...data }));
    },
    [metrics.models]
  );

  const _calculateWinStreaks = useCallback(() => {
    const _daily = metrics.trends.daily;
    if (!daily.length) return { current: 0, longest: 0 };

    let _current = 0;
    let _longest = 0;
    let _temp = 0;

    for (let _i = daily.length - 1; i >= 0; i--) {
      if (daily[i].profit > 0) {
        temp++;
        if (i === daily.length - 1) current = temp;
      } else {
        longest = Math.max(longest, temp);
        temp = 0;
      }
    }

    longest = Math.max(longest, temp);
    return { current, longest };
  }, [metrics.trends.daily]);

  const _getProfitTrend = useCallback(
    (period: 'daily' | 'weekly' | 'monthly' = 'daily') => {
      const _data = metrics.trends[period];
      if (!data.length) return { trend: 'flat', change: 0 };

      const _recent = data.slice(-7); // Last 7 periods
      const _older = data.slice(-14, -7); // Previous 7 periods

      // @ts-expect-error TS(2349): This expression is not callable.
      const _recentAvg =
        recent.reduce((sum: unknown, item: unknown) => sum + item.profit, 0) / recent.length;
      // @ts-expect-error TS(2349): This expression is not callable.
      const _olderAvg =
        older.reduce((sum: unknown, item: unknown) => sum + item.profit, 0) / older.length || 1;

      const _change = ((recentAvg - olderAvg) / Math.abs(olderAvg)) * 100;
      const _trend = change > 5 ? 'up' : change < -5 ? 'down' : 'flat';

      return { trend, change };
    },
    [metrics.trends]
  );

  const _exportData = useCallback(
    async (format: 'csv' | 'json' = 'json') => {
      try {
        const _analyticsService = masterServiceRegistry.getService('analytics');
        if (!analyticsService?.exportData) {
          // Fallback to client-side export
          const _dataStr =
            format === 'json' ? JSON.stringify(metrics, null, 2) : convertToCSV(metrics);

          const _blob = new Blob([dataStr], {
            type: format === 'json' ? 'application/json' : 'text/csv',
          });

          const _url = URL.createObjectURL(blob);
          const _a = document.createElement('a');
          a.href = url;
          a.download = `analytics-${new Date().toISOString().split('T')[0]}.${format}`;
          a.click();
          URL.revokeObjectURL(url);

          return;
        }

        return await analyticsService.exportData(format, metrics);
      } catch (err) {
        console.error('Failed to export data:', err);
        throw err;
      }
    },
    [metrics]
  );

  const _convertToCSV = useCallback((data: unknown) => {
    // Simple CSV conversion for performance data
    const _headers = ['Date', 'Profit', 'Bets', 'Win Rate'];
    const _rows = data.trends.daily.map((item: unknown) => [
      item.date,
      item.profit,
      item.bets,
      data.performance.winRate,
    ]);

    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }, []);

  const _refreshAnalytics = useCallback(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const _setAnalyticsTimeRange = useCallback(
    (range: '7d' | '30d' | '90d' | '1y') => {
      setTimeRange(range);
      fetchAnalytics(range);
    },
    [fetchAnalytics]
  );

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  return {
    metrics,
    loading,
    error,
    timeRange,
    fetchAnalytics,
    generateReport,
    trackEvent,
    getModelPerformance,
    getSportPerformance,
    getMarketAnalysis,
    getTopPerformingSports,
    getTopPerformingModels,
    calculateWinStreaks,
    getProfitTrend,
    exportData,
    refreshAnalytics,
    setAnalyticsTimeRange,
  };
};

export default useUnifiedAnalytics;
