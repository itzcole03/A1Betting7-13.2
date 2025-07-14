import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

// Types for data source health monitoring
interface SourceHealth {
  id: string;
  name: string;
  type: 'api' | 'database' | 'feed' | 'scraper' | 'stream' | 'webhook';
  status: 'healthy' | 'degraded' | 'unhealthy' | 'offline' | 'unknown';
  healthScore: number; // 0-100
  lastUpdate: Date;
  responseTime: number; // ms
  successRate: number; // percentage
  errorCount: number;
  dataFreshness: number; // minutes since last data
  priority: 'critical' | 'high' | 'medium' | 'low';
  url?: string;
  region?: string;
}

interface SourceHealthBarProps {
  sources: SourceHealth[];
  variant?: 'default' | 'cyber' | 'compact' | 'detailed' | 'horizontal';
  showMetrics?: boolean;
  showLabels?: boolean;
  sortBy?: 'health' | 'priority' | 'name' | 'lastUpdate';
  filterBy?: 'all' | 'healthy' | 'issues' | 'critical';
  autoRefresh?: boolean;
  refreshInterval?: number; // seconds
  className?: string;
  onSourceClick?: (source: SourceHealth) => void;
  onRefresh?: () => void;
}

const getHealthColor = (healthScore: number, variant: string = 'default') => {
  let color = 'green';
  if (healthScore < 30) color = 'red';
  else if (healthScore < 60) color = 'orange';
  else if (healthScore < 80) color = 'yellow';

  const colors = {
    default: {
      red: 'bg-red-500',
      orange: 'bg-orange-500',
      yellow: 'bg-yellow-500',
      green: 'bg-green-500',
    },
    cyber: {
      red: 'bg-red-400 shadow-red-400/50',
      orange: 'bg-orange-400 shadow-orange-400/50',
      yellow: 'bg-yellow-400 shadow-yellow-400/50',
      green: 'bg-green-400 shadow-green-400/50',
    },
  };

  return variant === 'cyber'
    ? colors.cyber[color as keyof typeof colors.cyber]
    : colors.default[color as keyof typeof colors.default];
};

const getStatusColor = (status: string, variant: string = 'default') => {
  const colors = {
    default: {
      healthy: 'text-green-700 bg-green-100 border-green-200',
      degraded: 'text-yellow-700 bg-yellow-100 border-yellow-200',
      unhealthy: 'text-red-700 bg-red-100 border-red-200',
      offline: 'text-gray-700 bg-gray-100 border-gray-200',
      unknown: 'text-gray-700 bg-gray-100 border-gray-200',
    },
    cyber: {
      healthy: 'text-green-300 bg-green-500/20 border-green-500/30',
      degraded: 'text-yellow-300 bg-yellow-500/20 border-yellow-500/30',
      unhealthy: 'text-red-300 bg-red-500/20 border-red-500/30',
      offline: 'text-gray-300 bg-gray-500/20 border-gray-500/30',
      unknown: 'text-gray-300 bg-gray-500/20 border-gray-500/30',
    },
  };

  return variant === 'cyber'
    ? colors.cyber[status as keyof typeof colors.cyber] || colors.cyber.unknown
    : colors.default[status as keyof typeof colors.default] || colors.default.unknown;
};

const getTypeIcon = (type: string) => {
  const icons = {
    api: '🔌',
    database: '🗄️',
    feed: '📡',
    scraper: '🕷️',
    stream: '🌊',
    webhook: '🔗',
  };
  return icons[type as keyof typeof icons] || '📊';
};

const formatTimeAgo = (date: Date) => {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  return `${diffHours}h ago`;
};

const formatResponseTime = (time: number) => {
  if (time < 1000) return `${time}ms`;
  return `${(time / 1000).toFixed(1)}s`;
};

export const SourceHealthBar: React.FC<SourceHealthBarProps> = ({
  sources,
  variant = 'default',
  showMetrics = true,
  showLabels = true,
  sortBy = 'health',
  filterBy = 'all',
  autoRefresh = false,
  refreshInterval = 30,
  className,
  onSourceClick,
  onRefresh,
}) => {
  const [lastRefresh, setLastRefresh] = useState(new Date());

  // Filter sources
  const filteredSources = sources.filter(source => {
    switch (filterBy) {
      case 'healthy':
        return source.status === 'healthy';
      case 'issues':
        return source.status !== 'healthy';
      case 'critical':
        return source.priority === 'critical' && source.status !== 'healthy';
      default:
        return true;
    }
  });

  // Sort sources
  const sortedSources = [...filteredSources].sort((a, b) => {
    switch (sortBy) {
      case 'health':
        return b.healthScore - a.healthScore;
      case 'priority':
        const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
        return (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0);
      case 'name':
        return a.name.localeCompare(b.name);
      case 'lastUpdate':
        return b.lastUpdate.getTime() - a.lastUpdate.getTime();
      default:
        return 0;
    }
  });

  const handleRefresh = () => {
    setLastRefresh(new Date());
    onRefresh?.();
  };

  // Auto refresh
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      handleRefresh();
    }, refreshInterval * 1000);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval]);

  // Calculate overall health
  const overallHealth =
    sources.length > 0
      ? Math.round(sources.reduce((sum, source) => sum + source.healthScore, 0) / sources.length)
      : 0;

  const healthySources = sources.filter(s => s.status === 'healthy').length;
  const totalSources = sources.length;

  const variantClasses = {
    default: 'bg-white border border-gray-200 rounded-lg shadow-sm',
    cyber:
      'bg-slate-900/95 border border-cyan-500/30 rounded-lg shadow-2xl shadow-cyan-500/20 backdrop-blur-md',
    compact: 'bg-white border border-gray-200 rounded-md shadow-sm p-3',
    detailed: 'bg-white border border-gray-300 rounded-xl shadow-lg',
    horizontal: 'bg-white border border-gray-200 rounded-lg shadow-sm',
  };

  if (variant === 'horizontal') {
    return (
      <div className={cn('flex items-center space-x-4 p-4', variantClasses[variant], className)}>
        {/* Overall Status */}
        <div className='flex items-center space-x-2'>
          <div
            className={cn(
              'w-3 h-3 rounded-full',
              overallHealth >= 80
                ? 'bg-green-500'
                : overallHealth >= 60
                  ? 'bg-yellow-500'
                  : 'bg-red-500'
            )}
          />
          <span className='font-medium text-gray-900'>
            {healthySources}/{totalSources} Healthy
          </span>
        </div>

        {/* Health bars */}
        <div className='flex space-x-1 flex-1'>
          {sortedSources.map(source => (
            <div
              key={source.id}
              className={cn(
                'flex-1 h-2 rounded cursor-pointer transition-all duration-200',
                getHealthColor(source.healthScore, variant),
                'hover:h-3'
              )}
              title={`${source.name}: ${source.healthScore}% healthy`}
              onClick={() => onSourceClick?.(source)}
            />
          ))}
        </div>

        <span className='text-sm text-gray-600'>{overallHealth}% Overall</span>
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className={cn(variantClasses[variant], className)}>
        <div className='flex items-center justify-between mb-2'>
          <span className='font-medium text-gray-900'>Data Sources</span>
          <span
            className={cn(
              'text-xs px-2 py-1 rounded-full',
              overallHealth >= 80
                ? 'bg-green-100 text-green-700'
                : overallHealth >= 60
                  ? 'bg-yellow-100 text-yellow-700'
                  : 'bg-red-100 text-red-700'
            )}
          >
            {overallHealth}%
          </span>
        </div>

        <div className='space-y-1'>
          {sortedSources.slice(0, 5).map(source => (
            <div key={source.id} className='flex items-center justify-between'>
              <div className='flex items-center space-x-2'>
                <span className='text-xs'>{getTypeIcon(source.type)}</span>
                <span className='text-sm truncate'>{source.name}</span>
              </div>
              <div className={cn('w-2 h-2 rounded-full', getHealthColor(source.healthScore))} />
            </div>
          ))}
          {sortedSources.length > 5 && (
            <div className='text-xs text-gray-500 text-center'>
              +{sortedSources.length - 5} more
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={cn(variantClasses[variant], className)}>
      {/* Header */}
      <div
        className={cn(
          'flex items-center justify-between p-4 border-b',
          variant === 'cyber' ? 'border-cyan-500/30' : 'border-gray-200'
        )}
      >
        <div className='flex items-center space-x-3'>
          <h3
            className={cn('font-semibold', variant === 'cyber' ? 'text-cyan-300' : 'text-gray-900')}
          >
            Source Health
          </h3>
          <div
            className={cn(
              'px-2 py-1 text-xs rounded-full',
              variant === 'cyber' ? 'bg-cyan-500/20 text-cyan-300' : 'bg-gray-100 text-gray-600'
            )}
          >
            {healthySources}/{totalSources} Healthy
          </div>
        </div>

        <div className='flex items-center space-x-2'>
          <span
            className={cn(
              'text-sm font-medium',
              variant === 'cyber' ? 'text-cyan-300' : 'text-gray-900'
            )}
          >
            {overallHealth}%
          </span>
          <button
            onClick={handleRefresh}
            className={cn(
              'px-3 py-1 text-xs rounded transition-colors',
              variant === 'cyber'
                ? 'bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            )}
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Sources List */}
      <div className='p-4 space-y-3'>
        {sortedSources.map(source => (
          <div
            key={source.id}
            className={cn(
              'flex items-center justify-between p-3 rounded-lg border transition-all duration-200',
              getStatusColor(source.status, variant),
              onSourceClick && 'cursor-pointer hover:shadow-md'
            )}
            onClick={() => onSourceClick?.(source)}
          >
            <div className='flex items-center space-x-3'>
              <span className='text-lg'>{getTypeIcon(source.type)}</span>

              <div>
                <div className='flex items-center space-x-2'>
                  <span className='font-medium'>{source.name}</span>
                  {source.priority === 'critical' && (
                    <span
                      className={cn(
                        'text-xs px-1 py-0.5 rounded',
                        variant === 'cyber' ? 'bg-red-500/30' : 'bg-red-100'
                      )}
                    >
                      Critical
                    </span>
                  )}
                </div>

                {showLabels && (
                  <div
                    className={cn(
                      'text-xs mt-1',
                      variant === 'cyber' ? 'text-cyan-400/70' : 'text-gray-600'
                    )}
                  >
                    Last update: {formatTimeAgo(source.lastUpdate)}
                  </div>
                )}
              </div>
            </div>

            <div className='flex items-center space-x-4'>
              {showMetrics && (
                <div className='text-xs space-y-1 text-right'>
                  <div>Health: {source.healthScore}%</div>
                  <div>Response: {formatResponseTime(source.responseTime)}</div>
                  <div>Success: {source.successRate.toFixed(1)}%</div>
                </div>
              )}

              {/* Health bar */}
              <div className='w-16 h-2 bg-gray-200 rounded-full overflow-hidden'>
                <div
                  className={cn(
                    'h-full transition-all duration-300',
                    getHealthColor(source.healthScore, variant)
                  )}
                  style={{ width: `${source.healthScore}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Cyber Effects */}
      {variant === 'cyber' && (
        <>
          <div className='absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-blue-500/5 rounded-lg pointer-events-none' />
          <div className='absolute inset-0 bg-grid-white/[0.02] rounded-lg pointer-events-none' />
        </>
      )}
    </div>
  );
};
