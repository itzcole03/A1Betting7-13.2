/**
 * Modernized Performance Analytics Dashboard
 * Features real-time data integration, responsive design, and modern React patterns
 * Part of Phase 3 Advanced UI Features implementation
 */

import React, { Suspense, useMemo, useState } from 'react';
import {
  useAnalyticsDashboard,
  useAnalyticsHealth,
  usePerformanceAlerts,
} from '../../hooks/useAnalytics';

// Direct imports to avoid module resolution issues
import CrossSportInsights from './CrossSportInsights';
import DashboardFiltersPanel, { DashboardFilters } from './DashboardFiltersPanel';
import DashboardOverview from './DashboardOverview';
import ModelsPerformanceGrid from './ModelsPerformanceGrid';
import PerformanceAlertsPanel from './PerformanceAlertsPanel';

// Loading skeleton component
const LoadingSkeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`animate-pulse bg-gray-200 dark:bg-gray-700 rounded-lg ${className}`}>
    <div className='h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4 mb-2'></div>
    <div className='h-4 bg-gray-300 dark:bg-gray-600 rounded w-1/2'></div>
  </div>
);

// Error boundary component
interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends React.Component<React.PropsWithChildren<{}>, ErrorBoundaryState> {
  constructor(props: React.PropsWithChildren<{}>) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Analytics Dashboard Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className='bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6'>
          <h3 className='text-lg font-semibold text-red-800 dark:text-red-200 mb-2'>
            Something went wrong
          </h3>
          <p className='text-red-600 dark:text-red-300 mb-4'>
            There was an error loading the analytics dashboard.
          </p>
          <button
            onClick={() => this.setState({ hasError: false })}
            className='bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors'
          >
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// Health indicator component
const HealthIndicator: React.FC = () => {
  const { health, isLoading, error } = useAnalyticsHealth();

  const getHealthColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'text-green-600 bg-green-100 dark:bg-green-900/30';
      case 'degraded':
        return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30';
      case 'unhealthy':
        return 'text-red-600 bg-red-100 dark:bg-red-900/30';
      default:
        return 'text-gray-600 bg-gray-100 dark:bg-gray-700';
    }
  };

  if (isLoading) {
    return <LoadingSkeleton className='h-6 w-20' />;
  }

  if (error) {
    return (
      <span className='text-red-600 bg-red-100 dark:bg-red-900/30 px-2 py-1 rounded-full text-xs font-medium'>
        Error
      </span>
    );
  }

  return (
    <span
      className={`px-2 py-1 rounded-full text-xs font-medium ${getHealthColor(health)}`}
      title={`Analytics services are ${health}`}
    >
      {health.charAt(0).toUpperCase() + health.slice(1)}
    </span>
  );
};

// Main dashboard component
const PerformanceAnalyticsDashboard: React.FC = () => {
  const [refreshInterval, setRefreshInterval] = useState(30000); // 30 seconds default
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Use custom hooks for data management
  const { dashboardData, isLoading, error, lastUpdated, refreshData, updateFilters, exportData } =
    useAnalyticsDashboard(autoRefresh, refreshInterval);

  const {
    alerts,
    isLoading: alertsLoading,
    error: alertsError,
    refreshAlerts,
    dismissAlert,
  } = usePerformanceAlerts(0.1, autoRefresh, 60000); // 1 minute for alerts

  // Filter management
  const handleFilterChange = (newFilters: Partial<DashboardFilters>) => {
    updateFilters(newFilters);
  };

  // Export functionality
  const handleExport = async (format: 'csv' | 'json' | 'pdf') => {
    try {
      await exportData(format);
    } catch (err) {
      console.error('Export failed:', err);
      // In a real app, you'd show a toast notification here
    }
  };

  // Memoized statistics for performance
  const dashboardStats = useMemo(() => {
    if (!dashboardData.summary) {
      return {
        totalModels: 0,
        healthyModels: 0,
        totalPredictions: 0,
        averageROI: 0,
        totalAlerts: 0,
      };
    }

    return {
      totalModels: dashboardData.summary.overall_metrics.total_models,
      healthyModels: dashboardData.summary.overall_metrics.healthy_models,
      totalPredictions: dashboardData.summary.overall_metrics.total_predictions,
      averageROI: dashboardData.summary.overall_metrics.overall_avg_roi,
      totalAlerts: dashboardData.summary.alerts_summary.total_alerts,
    };
  }, [dashboardData.summary]);

  if (error && !dashboardData.summary) {
    return (
      <div className='min-h-screen bg-gray-50 dark:bg-gray-900 p-6'>
        <div className='max-w-7xl mx-auto'>
          <div className='bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6'>
            <h2 className='text-xl font-semibold text-red-800 dark:text-red-200 mb-2'>
              Failed to Load Analytics Dashboard
            </h2>
            <p className='text-red-600 dark:text-red-300 mb-4'>{error}</p>
            <button
              onClick={refreshData}
              className='bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors'
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className='min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200'>
        {/* Header */}
        <div className='bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700'>
          <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
            <div className='flex items-center justify-between h-16'>
              <div className='flex items-center space-x-4'>
                <h1 className='text-2xl font-bold text-gray-900 dark:text-white'>
                  Performance Analytics
                </h1>
                <HealthIndicator />
              </div>

              <div className='flex items-center space-x-4'>
                {/* Auto-refresh toggle */}
                <label className='flex items-center space-x-2 text-sm'>
                  <input
                    type='checkbox'
                    checked={autoRefresh}
                    onChange={e => setAutoRefresh(e.target.checked)}
                    className='rounded border-gray-300 text-blue-600 focus:ring-blue-500'
                  />
                  <span className='text-gray-700 dark:text-gray-300'>Auto-refresh</span>
                </label>

                {/* Refresh interval selector */}
                <select
                  value={refreshInterval}
                  onChange={e => setRefreshInterval(Number(e.target.value))}
                  className='text-sm border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white'
                >
                  <option value={15000}>15s</option>
                  <option value={30000}>30s</option>
                  <option value={60000}>1m</option>
                  <option value={300000}>5m</option>
                </select>

                {/* Export dropdown */}
                <div className='relative group'>
                  <button className='bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors'>
                    Export
                  </button>
                  <div className='absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 hidden group-hover:block z-10'>
                    <div className='py-1'>
                      <button
                        onClick={() => handleExport('csv')}
                        className='block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                      >
                        Export as CSV
                      </button>
                      <button
                        onClick={() => handleExport('json')}
                        className='block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                      >
                        Export as JSON
                      </button>
                      <button
                        onClick={() => handleExport('pdf')}
                        className='block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                      >
                        Export as PDF
                      </button>
                    </div>
                  </div>
                </div>

                {/* Manual refresh button */}
                <button
                  onClick={refreshData}
                  disabled={isLoading}
                  className='bg-gray-600 hover:bg-gray-700 disabled:opacity-50 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors'
                >
                  {isLoading ? 'Refreshing...' : 'Refresh'}
                </button>
              </div>
            </div>

            {/* Last updated indicator */}
            {lastUpdated && (
              <div className='pb-4'>
                <p className='text-xs text-gray-500 dark:text-gray-400'>
                  Last updated: {new Date(lastUpdated).toLocaleString()}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Main content */}
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
          <div className='grid grid-cols-1 lg:grid-cols-4 gap-6'>
            {/* Filters sidebar */}
            <div className='lg:col-span-1'>
              <Suspense fallback={<LoadingSkeleton className='h-96' />}>
                <DashboardFiltersPanel
                  filters={dashboardData.filters}
                  onFiltersChange={handleFilterChange}
                  isLoading={isLoading}
                />
              </Suspense>
            </div>

            {/* Main dashboard content */}
            <div className='lg:col-span-3 space-y-6'>
              {/* Overview cards */}
              <Suspense fallback={<LoadingSkeleton className='h-32' />}>
                <DashboardOverview
                  stats={dashboardStats}
                  sportsBreakdown={dashboardData.summary?.sports_summary || {}}
                  isLoading={isLoading}
                />
              </Suspense>

              {/* Performance alerts */}
              {alerts.length > 0 && (
                <Suspense fallback={<LoadingSkeleton className='h-40' />}>
                  <PerformanceAlertsPanel
                    alerts={alerts}
                    isLoading={alertsLoading}
                    error={alertsError}
                    onDismissAlert={dismissAlert}
                    onRefresh={refreshAlerts}
                  />
                </Suspense>
              )}

              {/* Models performance grid */}
              <Suspense fallback={<LoadingSkeleton className='h-96' />}>
                <ModelsPerformanceGrid
                  models={dashboardData.models}
                  isLoading={isLoading}
                  error={error}
                />
              </Suspense>

              {/* Cross-sport insights */}
              {dashboardData.insights.length > 0 && (
                <Suspense fallback={<LoadingSkeleton className='h-64' />}>
                  <CrossSportInsights insights={dashboardData.insights} isLoading={isLoading} />
                </Suspense>
              )}
            </div>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default React.memo(PerformanceAnalyticsDashboard);
