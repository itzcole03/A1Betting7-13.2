import React, { useMemo, useState, useTransition } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import {
  useConcurrentFilter,
  useNonBlockingUpdate,
  withSuspense,
} from '../../../app/providers/ConcurrentFeaturesProvider';

// TypeScript discriminated unions for analytics data
type MetricType = 'accuracy' | 'roi' | 'volume' | 'confidence';

// Local analytics metric interface for the dashboard
interface DashboardMetric {
  id: string;
  type: MetricType;
  label: string;
  value: number;
  trend: 'up' | 'down' | 'stable';
  change: number;
  period: 'day' | 'week' | 'month';
}

interface DashboardState {
  metrics: DashboardMetric[];
  loading: boolean;
  error: string | null;
}

// Modern component patterns with compound components
interface ModernAnalyticsDashboardProps {
  className?: string;
}

interface MetricCardProps {
  metric: DashboardMetric;
  onClick?: (metric: DashboardMetric) => void;
}

interface MetricGridProps {
  metrics: DashboardMetric[];
  onMetricClick: (metric: DashboardMetric) => void;
}

interface DashboardFiltersProps {
  timeRange: string;
  onTimeRangeChange: (range: string) => void;
  metricType: MetricType | 'all';
  onMetricTypeChange: (type: MetricType | 'all') => void;
}

// Compound component: MetricCard
const MetricCard: React.FC<MetricCardProps> = ({ metric, onClick }) => {
  const { isPending, updateWithTransition } = useNonBlockingUpdate();

  const handleClick = () => {
    updateWithTransition(() => {
      onClick?.(metric);
    });
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return '↗️';
      case 'down':
        return '↘️';
      default:
        return '➡️';
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'up':
        return 'text-green-600';
      case 'down':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div
      className={`
        bg-white rounded-lg p-6 shadow-sm border border-gray-200 
        hover:shadow-md transition-shadow cursor-pointer
        ${isPending ? 'opacity-70' : ''}
      `}
      onClick={handleClick}
    >
      <div className='flex items-center justify-between mb-4'>
        <h3 className='text-sm font-medium text-gray-500 uppercase tracking-wide'>
          {metric.label}
        </h3>
        <span className={`text-sm ${getTrendColor(metric.trend)}`}>
          {getTrendIcon(metric.trend)} {Math.abs(metric.change)}%
        </span>
      </div>

      <div className='flex items-baseline'>
        <p className='text-2xl font-bold text-gray-900'>
          {metric.type === 'roi' ? '$' : ''}
          {metric.value.toLocaleString()}
          {metric.type === 'accuracy' ? '%' : ''}
        </p>
        <p className='ml-2 text-sm text-gray-600'>this {metric.period}</p>
      </div>
    </div>
  );
};

// Compound component: MetricGrid with concurrent rendering
const MetricGrid: React.FC<MetricGridProps> = ({ metrics, onMetricClick }) => {
  const [isPending, startTransition] = useTransition();

  const handleMetricClick = (metric: DashboardMetric) => {
    startTransition(() => {
      onMetricClick(metric);
    });
  };

  return (
    <div
      className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 ${
        isPending ? 'opacity-70' : ''
      }`}
    >
      {metrics.map(metric => (
        <MetricCard key={metric.id} metric={metric} onClick={handleMetricClick} />
      ))}
    </div>
  );
};

// Compound component: DashboardFilters with concurrent updates
const DashboardFilters: React.FC<DashboardFiltersProps> = ({
  timeRange,
  onTimeRangeChange,
  metricType,
  onMetricTypeChange,
}) => {
  const [isPending, startTransition] = useTransition();

  const handleTimeRangeChange = (range: string) => {
    startTransition(() => {
      onTimeRangeChange(range);
    });
  };

  const handleMetricTypeChange = (type: MetricType | 'all') => {
    startTransition(() => {
      onMetricTypeChange(type);
    });
  };

  return (
    <div className={`flex flex-col sm:flex-row gap-4 mb-6 ${isPending ? 'opacity-70' : ''}`}>
      <div className='flex-1'>
        <label htmlFor='timeRange' className='block text-sm font-medium text-gray-700 mb-2'>
          Time Range
        </label>
        <select
          id='timeRange'
          value={timeRange}
          onChange={e => handleTimeRangeChange(e.target.value)}
          className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
        >
          <option value='day'>Last 24 Hours</option>
          <option value='week'>Last 7 Days</option>
          <option value='month'>Last 30 Days</option>
          <option value='quarter'>Last 90 Days</option>
        </select>
      </div>

      <div className='flex-1'>
        <label htmlFor='metricType' className='block text-sm font-medium text-gray-700 mb-2'>
          Metric Type
        </label>
        <select
          id='metricType'
          value={metricType}
          onChange={e => handleMetricTypeChange(e.target.value as MetricType | 'all')}
          className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
        >
          <option value='all'>All Metrics</option>
          <option value='accuracy'>Accuracy</option>
          <option value='roi'>ROI</option>
          <option value='volume'>Volume</option>
          <option value='confidence'>Confidence</option>
        </select>
      </div>
    </div>
  );
};

// Main dashboard component with modern patterns
const ModernAnalyticsDashboard: React.FC<ModernAnalyticsDashboardProps> = ({ className = '' }) => {
  // Local state for this component
  const [timeRange, setTimeRange] = useState<string>('week');
  const [metrics, setMetrics] = useState<DashboardMetric[]>([]);

  // Create filters for concurrent filtering
  const [metricTypeFilter, setMetricTypeFilter] = useState<MetricType | 'all'>('all');
  const filters = useMemo(
    () => ({
      metricType: metricTypeFilter === 'all' ? null : metricTypeFilter,
    }),
    [metricTypeFilter]
  );

  const filterFunctions = useMemo(
    () => ({
      metricType: (metric: DashboardMetric, type: MetricType) => metric.type === type,
    }),
    []
  );

  const { filteredItems: filteredMetrics, isFiltering } = useConcurrentFilter(
    metrics,
    filters,
    filterFunctions
  );

  // Mock data for demonstration
  const mockMetrics: DashboardMetric[] = useMemo(
    () => [
      {
        id: '1',
        type: 'accuracy',
        label: 'Accuracy Rate',
        value: 68.5,
        trend: 'up',
        change: 3.2,
        period: 'week',
      },
      {
        id: '2',
        type: 'roi',
        label: 'Return on Investment',
        value: 1247.5,
        trend: 'up',
        change: 12.8,
        period: 'month',
      },
      {
        id: '3',
        type: 'volume',
        label: 'Total Predictions',
        value: 342,
        trend: 'down',
        change: 5.1,
        period: 'week',
      },
      {
        id: '4',
        type: 'confidence',
        label: 'Avg Confidence',
        value: 74.2,
        trend: 'stable',
        change: 0.8,
        period: 'day',
      },
    ],
    []
  );

  // Initialize metrics if empty
  React.useEffect(() => {
    if (metrics.length === 0) {
      setMetrics(mockMetrics);
    }
  }, [metrics.length, mockMetrics]);

  const handleMetricClick = (metric: DashboardMetric) => {
    console.log('Metric clicked:', metric);
    // Could navigate to detailed view or show modal
  };

  const handleTimeRangeChange = (range: string) => {
    setTimeRange(range);
    // Trigger data refetch for new time range
  };

  const handleMetricTypeChange = (type: MetricType | 'all') => {
    setMetricTypeFilter(type);
  };

  // Error fallback component
  const ErrorFallback: React.FC<{ error: Error }> = ({ error }) => (
    <div className='bg-red-50 border border-red-200 rounded-lg p-6'>
      <h3 className='text-lg font-semibold text-red-800 mb-2'>Analytics Dashboard Error</h3>
      <p className='text-red-700 mb-4'>{error.message}</p>
      <button
        onClick={() => window.location.reload()}
        className='px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700'
      >
        Reload Dashboard
      </button>
    </div>
  );

  return (
    <ErrorBoundary fallbackRender={({ error }) => <ErrorFallback error={error} />}>
      <div className={`space-y-6 ${className}`}>
        <div className='flex items-center justify-between'>
          <h2 className='text-2xl font-bold text-gray-900'>Analytics Dashboard</h2>
          <div className='text-sm text-gray-500'>
            Last updated: {new Date().toLocaleTimeString()}
          </div>
        </div>

        <DashboardFilters
          timeRange={timeRange}
          onTimeRangeChange={handleTimeRangeChange}
          metricType={metricTypeFilter}
          onMetricTypeChange={handleMetricTypeChange}
        />

        <MetricGrid metrics={filteredMetrics} onMetricClick={handleMetricClick} />

        {filteredMetrics.length === 0 && (
          <div className='text-center py-12'>
            <p className='text-gray-500'>No metrics found for the selected filters.</p>
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
};

// HOC with Suspense wrapper for async data loading
const ModernAnalyticsDashboardWithSuspense = withSuspense(
  ModernAnalyticsDashboard,
  <div className='animate-pulse space-y-6'>
    <div className='h-8 bg-gray-200 rounded w-1/3'></div>
    <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
      {[...Array(4)].map((_, i) => (
        <div key={i} className='h-32 bg-gray-200 rounded-lg'></div>
      ))}
    </div>
  </div>
);

export default ModernAnalyticsDashboardWithSuspense;
export { DashboardFilters, MetricCard, MetricGrid };
export type { DashboardMetric, DashboardState, MetricType };
