/**
 * Optimized Dashboard Component
 * 
 * Improvements:
 * - Real-time refresh status indicators
 * - Stale data warnings
 * - Better loading state transitions
 * - Performance metrics display
 * - Manual refresh with visual feedback
 * - Auto-refresh toggle with visual indicator
 */

import React, { useEffect, useState } from 'react';
import { useOptimizedPropFinderData, useRefreshStatus } from '../hooks/useOptimizedPropFinderData';
import { PropOpportunity } from '../hooks/usePropFinderData';

interface OptimizedDashboardProps {
  className?: string;
  autoRefresh?: boolean;
  showMetrics?: boolean;
}

interface RefreshIndicator {
  isRefreshing: boolean;
  lastRefresh?: Date;
  nextRefresh?: Date;
  isStale: boolean;
  staleDurationMs?: number;
}

export const OptimizedDashboard: React.FC<OptimizedDashboardProps> = ({
  className = '',
  autoRefresh = true,
  showMetrics = true,
}) => {
  // Use optimized hook with deduplication
  const propData = useOptimizedPropFinderData({
    autoRefresh,
    deduplicateRequests: true,
    refreshJitterMs: 1000,
    enableStaleWhileRevalidate: true,
    limit: 25,
  });

  const refreshStatus = useRefreshStatus(propData);

  const [sortBy, setSortBy] = useState<'confidence' | 'edge' | 'last_updated'>('confidence');
  const [filterStale, setFilterStale] = useState(false);

  // Sort opportunities based on selected criterion
  const sortedOpportunities = React.useMemo(() => {
    let sorted = [...propData.opportunities];

    // Filter out stale opportunities if requested
    if (filterStale && propData.isStale) {
      sorted = sorted.slice(); // Show warning instead
    }

    switch (sortBy) {
      case 'confidence':
        sorted.sort((a, b) => (b.confidence ?? 0) - (a.confidence ?? 0));
        break;
      case 'edge':
        sorted.sort((a, b) => (b.edge ?? 0) - (a.edge ?? 0));
        break;
      case 'last_updated':
        sorted.sort((a, b) => {
          const aTime = a.lastUpdated ? new Date(a.lastUpdated).getTime() : 0;
          const bTime = b.lastUpdated ? new Date(b.lastUpdated).getTime() : 0;
          return bTime - aTime;
        });
        break;
    }

    return sorted;
  }, [propData.opportunities, sortBy, filterStale, propData.isStale]);

  return (
    <div className={`optimized-dashboard ${className}`}>
      {/* Header with refresh status */}
      <div className='dashboard-header bg-white shadow-sm border-b p-4 sticky top-0 z-10'>
        <div className='flex justify-between items-center'>
          <div>
            <h1 className='text-2xl font-bold text-gray-900'>PropFinder Dashboard</h1>
            <p className='text-sm text-gray-600'>
              {propData.stats?.total_opportunities || 0} opportunities • Last updated{' '}
              {refreshStatus.lastRefresh
                ? `${formatTimeAgo(refreshStatus.lastRefresh)}`
                : 'never'}
            </p>
          </div>

          {/* Refresh Status Indicator */}
          <RefreshStatusIndicator
            isRefreshing={refreshStatus.isRefreshing}
            isStale={refreshStatus.isStale}
            lastRefresh={refreshStatus.lastRefresh}
            onRefresh={propData.refreshData}
            onToggleAutoRefresh={() => propData.toggleAutoRefresh()}
            isAutoRefreshEnabled={propData.isAutoRefreshEnabled}
          />
        </div>

        {/* Stale data warning */}
        {propData.isStale && (
          <div className='mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800'>
            ⚠️ Data is stale (not updated for {formatTimeDiff(propData.staleSince || 0)}). Try
            refreshing.
          </div>
        )}
      </div>

      {/* Main content */}
      <div className='dashboard-content p-6'>
        {/* Controls */}
        <div className='mb-6 flex justify-between items-center bg-gray-50 p-4 rounded-lg'>
          <div className='flex gap-4'>
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>Sort by</label>
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value as any)}
                className='px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500'
              >
                <option value='confidence'>Confidence</option>
                <option value='edge'>Edge</option>
                <option value='last_updated'>Last Updated</option>
              </select>
            </div>

            <div className='flex items-end'>
              <label className='flex items-center gap-2 cursor-pointer'>
                <input
                  type='checkbox'
                  checked={filterStale}
                  onChange={e => setFilterStale(e.target.checked)}
                  className='rounded'
                />
                <span className='text-sm text-gray-700'>Hide stale data</span>
              </label>
            </div>
          </div>

          {/* Performance metrics */}
          {showMetrics && propData.lastFetchDurationMs !== null && (
            <div className='text-right text-sm text-gray-600'>
              <p>Fetch time: {propData.lastFetchDurationMs}ms</p>
              <p>Items: {sortedOpportunities.length}</p>
            </div>
          )}
        </div>

        {/* Loading state */}
        {propData.loading && propData.fetchStage === 'fetching' && (
          <div className='flex items-center justify-center py-12'>
            <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600'></div>
            <span className='ml-4 text-gray-600'>Fetching opportunities...</span>
          </div>
        )}

        {/* Processing state */}
        {propData.loading && propData.fetchStage === 'processing' && (
          <div className='flex items-center justify-center py-12'>
            <div className='text-gray-600'>Processing data...</div>
          </div>
        )}

        {/* Error state */}
        {propData.error && (
          <div className='p-4 bg-red-50 border border-red-200 rounded-lg text-red-800'>
            <p className='font-semibold'>Error loading data</p>
            <p className='text-sm mt-1'>{propData.error}</p>
            <button
              onClick={propData.refreshData}
              className='mt-2 px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm'
            >
              Retry
            </button>
          </div>
        )}

        {/* Opportunities list */}
        {!propData.loading && sortedOpportunities.length > 0 && (
          <div className='space-y-4'>
            {sortedOpportunities.map(opp => (
              <OpportunityCard key={opp.id} opportunity={opp} />
            ))}

            {/* Load more button */}
            {propData.hasMore && (
              <button
                onClick={propData.loadMore}
                disabled={propData.loading}
                className='w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50'
              >
                {propData.loading ? 'Loading...' : 'Load More'}
              </button>
            )}
          </div>
        )}

        {/* Empty state */}
        {!propData.loading && sortedOpportunities.length === 0 && (
          <div className='text-center py-12 text-gray-600'>
            <p>No opportunities found</p>
            <p className='text-sm mt-1'>Try adjusting your filters or refreshing the data</p>
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Refresh Status Indicator Component
 */
interface RefreshStatusIndicatorProps {
  isRefreshing: boolean;
  isStale: boolean;
  lastRefresh?: Date;
  onRefresh: () => Promise<void>;
  onToggleAutoRefresh: () => void;
  isAutoRefreshEnabled: boolean;
}

const RefreshStatusIndicator: React.FC<RefreshStatusIndicatorProps> = ({
  isRefreshing,
  isStale,
  lastRefresh,
  onRefresh,
  onToggleAutoRefresh,
  isAutoRefreshEnabled,
}) => {
  const [isManualRefreshing, setIsManualRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsManualRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setIsManualRefreshing(false);
    }
  };

  const statusColor = isStale
    ? 'text-yellow-600'
    : isRefreshing
      ? 'text-blue-600'
      : 'text-green-600';

  return (
    <div className='flex items-center gap-3'>
      {/* Status indicator */}
      <div className={`flex items-center gap-2 ${statusColor}`}>
        {isRefreshing || isManualRefreshing ? (
          <>
            <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-current'></div>
            <span className='text-sm font-medium'>Updating...</span>
          </>
        ) : isStale ? (
          <>
            <span className='text-lg'>⚠️</span>
            <span className='text-sm font-medium'>Stale</span>
          </>
        ) : (
          <>
            <span className='text-lg'>✓</span>
            <span className='text-sm font-medium'>Current</span>
          </>
        )}
      </div>

      {/* Manual refresh button */}
      <button
        onClick={handleRefresh}
        disabled={isManualRefreshing || isRefreshing}
        title='Manual refresh'
        className='p-2 hover:bg-gray-100 rounded transition-colors disabled:opacity-50'
      >
        🔄
      </button>

      {/* Auto-refresh toggle */}
      <button
        onClick={onToggleAutoRefresh}
        title={isAutoRefreshEnabled ? 'Disable auto-refresh' : 'Enable auto-refresh'}
        className={`p-2 rounded transition-colors ${
          isAutoRefreshEnabled ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:bg-gray-100'
        }`}
      >
        ⚡
      </button>
    </div>
  );
};

/**
 * Opportunity Card Component
 */
const OpportunityCard: React.FC<{ opportunity: PropOpportunity }> = ({ opportunity }) => {
  const getConfidenceColor = (confidence?: number) => {
    if (!confidence) return 'text-gray-600';
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className='bg-white rounded-lg shadow p-4 hover:shadow-lg transition-shadow'>
      <div className='flex justify-between items-start mb-2'>
        <div>
          <h3 className='font-semibold text-gray-900'>{opportunity.player || 'Unknown'}</h3>
          <p className='text-sm text-gray-600'>
            {opportunity.market} • {opportunity.stat}
          </p>
        </div>
        <div className='text-right'>
          <div className={`text-lg font-bold ${getConfidenceColor(opportunity.confidence)}`}>
            {opportunity.confidence ? `${(opportunity.confidence * 100).toFixed(0)}%` : 'N/A'}
          </div>
          <div className='text-sm text-gray-600'>Confidence</div>
        </div>
      </div>

      <div className='grid grid-cols-3 gap-4 py-2 border-t text-sm'>
        <div>
          <span className='text-gray-600'>Line: </span>
          <span className='font-medium'>{opportunity.line?.toFixed(1) || 'N/A'}</span>
        </div>
        <div>
          <span className='text-gray-600'>Odds: </span>
          <span className='font-medium'>{opportunity.odds?.toFixed(0) || 'N/A'}</span>
        </div>
        <div>
          <span className='text-gray-600'>Edge: </span>
          <span className='font-medium text-blue-600'>{opportunity.edge?.toFixed(1) || 'N/A'}%</span>
        </div>
      </div>

      {opportunity.isBookmarked && (
        <div className='mt-2 text-xs text-blue-600'>🔖 Bookmarked</div>
      )}
    </div>
  );
};

// Utility functions
function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);

  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

function formatTimeDiff(ms: number): string {
  if (ms < 1000) return `${Math.floor(ms)}ms`;
  if (ms < 60000) return `${Math.floor(ms / 1000)}s`;
  if (ms < 3600000) return `${Math.floor(ms / 60000)}m`;
  return `${Math.floor(ms / 3600000)}h`;
}

export default OptimizedDashboard;
