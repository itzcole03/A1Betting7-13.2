/**
 * Custom hooks for analytics data fetching and state management
 * Following modern React patterns with proper error handling and loading states
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { analyticsApiService } from '../services/analytics/AnalyticsService';
import {
  ApiError,
  CrossSportInsight,
  DashboardFilters,
  DashboardState,
  ModelDetailedPerformance,
  PerformanceAlert,
  UseAnalyticsDashboardReturn,
  UseModelPerformanceReturn,
  UsePerformanceAlertsReturn,
} from '../types/analytics';

/**
 * Main hook for analytics dashboard data
 * Provides comprehensive dashboard state management with filtering and real-time updates
 */
export function useAnalyticsDashboard(
  autoRefresh: boolean = true,
  refreshInterval: number = 30000 // 30 seconds
): UseAnalyticsDashboardReturn {
  const [dashboardData, setDashboardData] = useState<DashboardState>({
    isLoading: true,
    error: null,
    lastUpdated: null,
    summary: null,
    models: [],
    alerts: [],
    insights: [],
    filters: {},
  });

  const refreshData = useCallback(async () => {
    try {
      setDashboardData(prev => ({ ...prev, isLoading: true, error: null }));

      // Fetch all dashboard data in parallel
      const [summary, modelsData, alerts, insights] = await Promise.all([
        analyticsApiService.getDashboardSummary(),
        analyticsApiService.getAllModelsPerformance(dashboardData.filters.sport),
        analyticsApiService.getPerformanceAlerts(),
        analyticsApiService.getCrossSportInsights(30),
      ]);

      setDashboardData(prev => ({
        ...prev,
        isLoading: false,
        error: null,
        lastUpdated: new Date().toISOString(),
        summary,
        models: modelsData.models,
        alerts: alerts.alerts,
        insights: insights.insights,
      }));
    } catch (error) {
      const apiError = error as ApiError;
      setDashboardData(prev => ({
        ...prev,
        isLoading: false,
        error: apiError.message || 'Failed to fetch dashboard data',
      }));
    }
  }, [dashboardData.filters.sport]);

  const updateFilters = useCallback((newFilters: Partial<DashboardFilters>) => {
    setDashboardData(prev => ({
      ...prev,
      filters: { ...prev.filters, ...newFilters },
    }));
  }, []);

  const exportData = useCallback(
    async (format: 'csv' | 'json' | 'pdf') => {
      try {
        // Implementation for data export
        const exportData = {
          summary: dashboardData.summary,
          models: dashboardData.models,
          alerts: dashboardData.alerts,
          insights: dashboardData.insights,
          exportedAt: new Date().toISOString(),
        };

        if (format === 'json') {
          const blob = new Blob([JSON.stringify(exportData, null, 2)], {
            type: 'application/json',
          });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `analytics-dashboard-${new Date().toISOString().split('T')[0]}.json`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        } else if (format === 'csv') {
          // Convert models data to CSV
          const csvHeaders = [
            'Model Name',
            'Sport',
            'Status',
            'Win Rate',
            'Total ROI',
            'Predictions Count',
            'Error Rate',
          ];
          const csvRows = dashboardData.models.map(model => [
            model.model_name,
            model.sport,
            model.status,
            model.win_rate.toFixed(2),
            model.total_roi.toFixed(2),
            model.predictions_count.toString(),
            model.error_rate.toFixed(3),
          ]);

          const csvContent = [csvHeaders, ...csvRows]
            .map(row => row.map(field => `"${field}"`).join(','))
            .join('\n');

          const blob = new Blob([csvContent], { type: 'text/csv' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `analytics-models-${new Date().toISOString().split('T')[0]}.csv`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }
        // PDF export would require additional libraries like jsPDF
      } catch (error) {
        console.error('Export failed:', error);
        throw new Error('Failed to export data');
      }
    },
    [dashboardData]
  );

  // Auto-refresh effect
  useEffect(() => {
    refreshData();

    if (autoRefresh) {
      const interval = setInterval(refreshData, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [refreshData, autoRefresh, refreshInterval]);

  // Filter models based on current filters
  const filteredModels = useMemo(() => {
    return dashboardData.models.filter(model => {
      const { modelStatus, minWinRate, minROI } = dashboardData.filters;

      if (modelStatus && model.status !== modelStatus) return false;
      if (minWinRate && model.win_rate < minWinRate) return false;
      if (minROI && model.total_roi < minROI) return false;

      return true;
    });
  }, [dashboardData.models, dashboardData.filters]);

  return {
    dashboardData: {
      ...dashboardData,
      models: filteredModels,
    },
    isLoading: dashboardData.isLoading,
    error: dashboardData.error,
    lastUpdated: dashboardData.lastUpdated,
    refreshData,
    updateFilters,
    exportData,
  };
}

/**
 * Hook for detailed model performance data
 */
export function useModelPerformance(
  modelName: string,
  sport: string,
  days: number = 7
): UseModelPerformanceReturn {
  const [state, setState] = useState<{
    modelData: ModelDetailedPerformance | null;
    isLoading: boolean;
    error: string | null;
    lastUpdated: string | null;
  }>({
    modelData: null,
    isLoading: true,
    error: null,
    lastUpdated: null,
  });

  const refreshModel = useCallback(async () => {
    if (!modelName || !sport) return;

    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      const modelData = await analyticsApiService.getModelPerformance(modelName, sport, days);

      setState({
        modelData,
        isLoading: false,
        error: null,
        lastUpdated: new Date().toISOString(),
      });
    } catch (error) {
      const apiError = error as ApiError;
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: apiError.message || 'Failed to fetch model performance',
      }));
    }
  }, [modelName, sport, days]);

  useEffect(() => {
    refreshModel();
  }, [refreshModel]);

  return {
    ...state,
    refreshModel,
  };
}

/**
 * Hook for performance alerts with real-time monitoring
 */
export function usePerformanceAlerts(
  threshold: number = 0.1,
  autoRefresh: boolean = true,
  refreshInterval: number = 60000 // 1 minute
): UsePerformanceAlertsReturn {
  const [state, setState] = useState<{
    alerts: PerformanceAlert[];
    isLoading: boolean;
    error: string | null;
    lastUpdated: string | null;
  }>({
    alerts: [],
    isLoading: true,
    error: null,
    lastUpdated: null,
  });

  const refreshAlerts = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      const alertsData = await analyticsApiService.getPerformanceAlerts(threshold);

      setState({
        alerts: alertsData.alerts,
        isLoading: false,
        error: null,
        lastUpdated: new Date().toISOString(),
      });
    } catch (error) {
      const apiError = error as ApiError;
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: apiError.message || 'Failed to fetch performance alerts',
      }));
    }
  }, [threshold]);

  const dismissAlert = useCallback(async (alertId: string) => {
    // This would typically make an API call to dismiss the alert
    // For now, we'll just remove it from the local state
    setState(prev => ({
      ...prev,
      alerts: prev.alerts.filter(
        alert => `${alert.model_name}-${alert.sport}-${alert.timestamp}` !== alertId
      ),
    }));
  }, []);

  // Auto-refresh effect
  useEffect(() => {
    refreshAlerts();

    if (autoRefresh) {
      const interval = setInterval(refreshAlerts, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [refreshAlerts, autoRefresh, refreshInterval]);

  return {
    ...state,
    refreshAlerts,
    dismissAlert,
  };
}

/**
 * Hook for cross-sport insights and correlations
 */
export function useCrossSportInsights(days: number = 30) {
  const [state, setState] = useState<{
    insights: CrossSportInsight[];
    isLoading: boolean;
    error: string | null;
    lastUpdated: string | null;
  }>({
    insights: [],
    isLoading: true,
    error: null,
    lastUpdated: null,
  });

  const refreshInsights = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      const insightsData = await analyticsApiService.getCrossSportInsights(days);

      setState({
        insights: insightsData.insights,
        isLoading: false,
        error: null,
        lastUpdated: new Date().toISOString(),
      });
    } catch (error) {
      const apiError = error as ApiError;
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: apiError.message || 'Failed to fetch cross-sport insights',
      }));
    }
  }, [days]);

  useEffect(() => {
    refreshInsights();
  }, [refreshInsights]);

  return {
    ...state,
    refreshInsights,
  };
}

/**
 * Hook for analytics health monitoring
 */
export function useAnalyticsHealth() {
  const [state, setState] = useState<{
    health: 'healthy' | 'degraded' | 'unhealthy' | 'unknown';
    components: Record<string, string>;
    isLoading: boolean;
    error: string | null;
    lastChecked: string | null;
  }>({
    health: 'unknown',
    components: {},
    isLoading: true,
    error: null,
    lastChecked: null,
  });

  const checkHealth = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      const healthData = await analyticsApiService.checkHealth();

      setState({
        health: healthData.status,
        components: healthData.components,
        isLoading: false,
        error: null,
        lastChecked: new Date().toISOString(),
      });
    } catch (error) {
      const apiError = error as ApiError;
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: apiError.message || 'Failed to check analytics health',
        health: 'unhealthy',
      }));
    }
  }, []);

  useEffect(() => {
    checkHealth();

    // Check health every 5 minutes
    const interval = setInterval(checkHealth, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [checkHealth]);

  return {
    ...state,
    checkHealth,
  };
}
