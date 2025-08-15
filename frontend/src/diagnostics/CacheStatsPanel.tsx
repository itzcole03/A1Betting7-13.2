/**
 * Cache Statistics Panel Component
 * 
 * Provides comprehensive cache observability UI with:
 * - Real-time cache metrics display with formatted values
 * - Hit ratio progress indicators and performance metrics
 * - Namespace breakdown with detailed statistics
 * - Latency percentiles visualization
 * - Error states with retry capabilities
 * - Graceful loading and empty states
 * 
 * Usage:
 * ```tsx
 * <CacheStatsPanel
 *   refreshInterval={30000}
 *   showNamespaceBreakdown={true}
 *   onError={(error) => console.error('Cache stats error:', error)}
 * />
 * ```
 */

import React, { useState, useMemo } from 'react';
import { 
  useCacheStats, 
  useCacheHealth, 
  formatCacheStats,
  type CacheStats, 
  type CacheHealth 
} from '../cache/useCacheStats';

// Component props interface
export interface CacheStatsPanelProps {
  refreshInterval?: number;
  showNamespaceBreakdown?: boolean;
  showLatencyMetrics?: boolean;
  showHealthIndicator?: boolean;
  onError?: (error: Error) => void;
  onStatsUpdate?: (stats: CacheStats) => void;
  className?: string;
}

// Performance indicator component
const PerformanceIndicator: React.FC<{
  label: string;
  value: number;
  format: (value: number) => string;
  thresholds: { good: number; warning: number };
  higher_is_better?: boolean;
}> = ({ label, value, format, thresholds, higher_is_better = true }) => {
  const getIndicatorColor = (val: number) => {
    if (higher_is_better) {
      if (val >= thresholds.good) return 'text-green-600 bg-green-100';
      if (val >= thresholds.warning) return 'text-yellow-600 bg-yellow-100';
      return 'text-red-600 bg-red-100';
    } else {
      if (val <= thresholds.good) return 'text-green-600 bg-green-100';
      if (val <= thresholds.warning) return 'text-yellow-600 bg-yellow-100';
      return 'text-red-600 bg-red-100';
    }
  };

  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
      <span className="text-sm font-medium text-gray-700">{label}</span>
      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getIndicatorColor(value)}`}>
        {format(value)}
      </span>
    </div>
  );
};

// Hit ratio progress bar component
const HitRatioBar: React.FC<{ ratio: number; total_operations: number }> = ({ ratio, total_operations }) => {
  const percentage = ratio * 100;
  const getColor = (pct: number) => {
    if (pct >= 90) return 'bg-green-500';
    if (pct >= 75) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium text-gray-700">Hit Ratio</span>
        <span className="text-sm text-gray-500">
          {formatCacheStats.count(total_operations)} operations
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-3">
        <div 
          className={`h-3 rounded-full transition-all duration-300 ${getColor(percentage)}`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
      <div className="text-right">
        <span className="text-lg font-bold text-gray-800">
          {formatCacheStats.hitRatio(ratio)}
        </span>
      </div>
    </div>
  );
};

// Namespace stats table component
const NamespaceBreakdown: React.FC<{ stats: CacheStats }> = ({ stats }) => {
  const [sortBy, setSortBy] = useState<'namespace' | 'count' | 'percentage'>('count');
  const [sortDesc, setSortDesc] = useState(true);

  const sortedNamespaces = useMemo(() => {
    // Guard against missing namespaced_counts
    if (!stats.namespaced_counts) {
      return [];
    }

    const namespaceEntries = Object.entries(stats.namespaced_counts).map(([namespace, count]) => ({
      namespace,
      count,
      percentage: stats.total_keys > 0 ? (count / stats.total_keys) * 100 : 0,
    }));

    return namespaceEntries.sort((a, b) => {
      const factor = sortDesc ? -1 : 1;
      switch (sortBy) {
        case 'namespace':
          return factor * a.namespace.localeCompare(b.namespace);
        case 'count':
          return factor * (a.count - b.count);
        case 'percentage':
          return factor * (a.percentage - b.percentage);
        default:
          return 0;
      }
    });
  }, [stats.namespaced_counts, stats.total_keys, sortBy, sortDesc]);

  const handleSort = (column: typeof sortBy) => {
    if (sortBy === column) {
      setSortDesc(!sortDesc);
    } else {
      setSortBy(column);
      setSortDesc(true);
    }
  };

  if (sortedNamespaces.length === 0) {
    return (
      <div className="text-center py-4 text-gray-500">
        No namespace data available
      </div>
    );
  }

  return (
    <div className="overflow-hidden border border-gray-200 rounded-lg">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th 
              className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              onClick={() => handleSort('namespace')}
            >
              Namespace {sortBy === 'namespace' && (sortDesc ? '↓' : '↑')}
            </th>
            <th 
              className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              onClick={() => handleSort('count')}
            >
              Keys {sortBy === 'count' && (sortDesc ? '↓' : '↑')}
            </th>
            <th 
              className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              onClick={() => handleSort('percentage')}
            >
              % of Total {sortBy === 'percentage' && (sortDesc ? '↓' : '↑')}
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {sortedNamespaces.map(({ namespace, count, percentage }) => (
            <tr key={namespace} className="hover:bg-gray-50">
              <td className="px-4 py-3 whitespace-nowrap">
                <span className="text-sm font-mono text-gray-900">{namespace}</span>
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-right">
                <span className="text-sm text-gray-900">{formatCacheStats.count(count)}</span>
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-right">
                <span className="text-sm text-gray-500">{percentage.toFixed(1)}%</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// Latency percentiles component
const LatencyMetrics: React.FC<{ stats: CacheStats }> = ({ stats }) => {
  // Guard against missing latency_percentiles
  if (!stats.latency_percentiles) {
    return null;
  }

  const percentiles = [
    { label: 'P50 (Median)', value: stats.latency_percentiles.p50 },
    { label: 'P90', value: stats.latency_percentiles.p90 },
    { label: 'P95', value: stats.latency_percentiles.p95 },
    { label: 'P99', value: stats.latency_percentiles.p99 },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {percentiles.map(({ label, value }) => (
        <div key={label} className="text-center p-3 bg-gray-50 rounded-lg">
          <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">{label}</div>
          <div className="text-lg font-bold text-gray-800">
            {formatCacheStats.latency(value)}
          </div>
        </div>
      ))}
    </div>
  );
};

// Health indicator component
const HealthIndicator: React.FC<{ health: CacheHealth | null; loading: boolean; error: Error | null }> = ({ 
  health, 
  loading, 
  error 
}) => {
  if (loading) {
    return (
      <div className="flex items-center space-x-2">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500" />
        <span className="text-sm text-gray-500">Checking health...</span>
      </div>
    );
  }

  if (error || !health) {
    return (
      <div className="flex items-center space-x-2">
        <div className="h-3 w-3 bg-red-500 rounded-full" />
        <span className="text-sm text-red-600">Health check failed</span>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-2">
      <div className={`h-3 w-3 rounded-full ${health.healthy ? 'bg-green-500' : 'bg-yellow-500'}`} />
      <span className={`text-sm ${health.healthy ? 'text-green-600' : 'text-yellow-600'}`}>
        {health.healthy ? 'Healthy' : 'Degraded'}
      </span>
    </div>
  );
};

// Error state component
const ErrorState: React.FC<{ error: Error; onRetry: () => void; retryCount: number }> = ({ 
  error, 
  onRetry, 
  retryCount 
}) => (
  <div className="text-center py-8 px-4 bg-red-50 border border-red-200 rounded-lg">
    <div className="text-red-600 mb-4">
      <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    </div>
    <h3 className="text-lg font-medium text-red-800 mb-2">Failed to load cache statistics</h3>
    <p className="text-sm text-red-600 mb-4">
      {error.message}
      {retryCount > 0 && (
        <span className="block mt-1 text-xs">
          ({retryCount} retry attempts made)
        </span>
      )}
    </p>
    <button
      onClick={onRetry}
      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
    >
      Retry
    </button>
  </div>
);

// Loading state component
const LoadingState: React.FC = () => (
  <div className="text-center py-8 px-4">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4" />
    <p className="text-gray-600">Loading cache statistics...</p>
  </div>
);

// Main component
export const CacheStatsPanel: React.FC<CacheStatsPanelProps> = ({
  refreshInterval,
  showNamespaceBreakdown = true,
  showLatencyMetrics = true,
  showHealthIndicator = true,
  onError,
  onStatsUpdate,
  className = '',
}) => {
  // Use cache stats hook with configuration
  const { 
    data: stats, 
    loading, 
    error, 
    refetch, 
    lastUpdated, 
    retryCount 
  } = useCacheStats({
    pollInterval: refreshInterval,
    onError: (err) => {
      onError?.(err);
    },
  });

  // Use cache health hook if enabled
  const healthResult = useCacheHealth();

  // Notify parent of stats updates
  React.useEffect(() => {
    if (stats && onStatsUpdate) {
      onStatsUpdate(stats);
    }
  }, [stats, onStatsUpdate]);

  // Handle loading state
  if (loading && !stats) {
    return (
      <div className={`bg-white shadow-lg rounded-lg p-6 ${className}`}>
        <LoadingState />
      </div>
    );
  }

  // Handle error state
  if (error && !stats) {
    return (
      <div className={`bg-white shadow-lg rounded-lg p-6 ${className}`}>
        <ErrorState error={error} onRetry={refetch} retryCount={retryCount} />
      </div>
    );
  }

  // Handle empty state
  if (!stats) {
    return (
      <div className={`bg-white shadow-lg rounded-lg p-6 ${className}`}>
        <div className="text-center py-8 text-gray-500">
          No cache statistics available
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white shadow-lg rounded-lg ${className}`}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-800">Cache Statistics</h3>
          <div className="flex items-center space-x-4">
            {showHealthIndicator && (
              <HealthIndicator 
                health={healthResult.data} 
                loading={healthResult.loading} 
                error={healthResult.error} 
              />
            )}
            <div className="text-xs text-gray-500">
              {lastUpdated && (
                <>
                  Last updated: {lastUpdated.toLocaleTimeString()}
                  {loading && <span className="ml-1 animate-pulse">●</span>}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Overview metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <PerformanceIndicator
            label="Cache Hit Ratio"
            value={stats.hit_ratio}
            format={formatCacheStats.hitRatio}
            thresholds={{ good: 0.9, warning: 0.75 }}
            higher_is_better={true}
          />
          <PerformanceIndicator
            label="Average Latency"
            value={stats.average_get_latency_ms}
            format={formatCacheStats.latency}
            thresholds={{ good: 5, warning: 20 }}
            higher_is_better={false}
          />
          <PerformanceIndicator
            label="Total Keys"
            value={stats.total_keys}
            format={formatCacheStats.count}
            thresholds={{ good: 1000, warning: 100 }}
            higher_is_better={true}
          />
        </div>

        {/* Hit ratio visualization */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <HitRatioBar ratio={stats.hit_ratio} total_operations={stats.total_operations} />
        </div>

        {/* Additional metrics grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Rebuild Events</div>
            <div className="text-lg font-bold text-gray-800">{formatCacheStats.count(stats.rebuild_events)}</div>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Stampede Prevented</div>
            <div className="text-lg font-bold text-gray-800">{formatCacheStats.count(stats.stampede_preventions)}</div>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Active Locks</div>
            <div className="text-lg font-bold text-gray-800">{stats.active_locks}</div>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Uptime</div>
            <div className="text-lg font-bold text-gray-800">{formatCacheStats.uptime(stats.uptime_seconds)}</div>
          </div>
        </div>

        {/* Latency percentiles */}
        {showLatencyMetrics && (
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-3">Latency Percentiles</h4>
            <LatencyMetrics stats={stats} />
          </div>
        )}

        {/* Namespace breakdown */}
        {showNamespaceBreakdown && (
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-3">Namespace Breakdown</h4>
            <NamespaceBreakdown stats={stats} />
          </div>
        )}

        {/* Cache version and metadata */}
        <div className="pt-4 border-t border-gray-200">
          <div className="flex justify-between items-center text-xs text-gray-500">
            <span>Cache Version: {stats.cache_version}</span>
            <span>Statistics from: {new Date(stats.timestamp).toLocaleString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Export default
export default CacheStatsPanel;