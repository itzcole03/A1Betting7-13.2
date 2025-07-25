import React, { useState, useEffect, useRef } from 'react';
// @ts-expect-error TS(2307): Cannot find module '@/lib/utils' or its correspond... Remove this comment to see the full error message
import { cn } from '@/lib/utils';

// Types for activity feed
interface ActivityUser {
  id: string;
  name: string;
  avatar?: string;
  role?: 'user' | 'admin' | 'moderator' | 'system';
  verified?: boolean;
}

interface ActivityData {
  value?: number | string;
  oldValue?: number | string;
  details?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

interface ActivityItem {
  id: string;
  type:
    | 'bet_placed'
    | 'bet_won'
    | 'bet_lost'
    | 'deposit'
    | 'withdrawal'
    | 'login'
    | 'system'
    | 'achievement'
    | 'prediction'
    | 'custom';
  user: ActivityUser;
  action: string;
  description: string;
  timestamp: Date;
  data?: ActivityData;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: 'betting' | 'financial' | 'account' | 'system' | 'social' | 'achievement';
  status?: 'pending' | 'completed' | 'failed' | 'cancelled';
  relatedItems?: string[]; // IDs of related activities
  tags?: string[];
  location?: string;
  device?: string;
  ipAddress?: string;
}

interface ActivityFilter {
  types?: string[];
  users?: string[];
  categories?: string[];
  dateRange?: { start: Date; end: Date };
  priority?: string[];
  status?: string[];
  searchQuery?: string;
}

interface ModernActivityFeedProps {
  activities: ActivityItem[];
  variant?: 'default' | 'cyber' | 'minimal' | 'card' | 'timeline';
  layout?: 'list' | 'grid' | 'timeline' | 'masonry';
  showFilters?: boolean;
  showSearch?: boolean;
  showGrouping?: boolean;
  showInfiniteScroll?: boolean;
  showRealTimeUpdates?: boolean;
  maxItems?: number;
  autoRefresh?: boolean;
  refreshInterval?: number; // seconds
  groupBy?: 'date' | 'user' | 'category' | 'type' | 'none';
  className?: string;
  onActivityClick?: (activity: ActivityItem) => void;
  onUserClick?: (user: ActivityUser) => void;
  onFilterChange?: (filter: ActivityFilter) => void;
  onLoadMore?: () => void;
  onRefresh?: () => void;
}

const _getActivityIcon = (type: string) => {
  const _icons = {
    bet_placed: '🎯',
    bet_won: '🎉',
    bet_lost: '😞',
    deposit: '💰',
    withdrawal: '🏧',
    login: '🔓',
    system: '⚙️',
    achievement: '🏆',
    prediction: '🔮',
    custom: '📝',
  };
  return icons[type as keyof typeof icons] || '📋';
};

const _getActivityColor = (type: string, variant: string = 'default') => {
  const _colors = {
    default: {
      bet_placed: 'text-blue-600 bg-blue-50 border-blue-200',
      bet_won: 'text-green-600 bg-green-50 border-green-200',
      bet_lost: 'text-red-600 bg-red-50 border-red-200',
      deposit: 'text-green-600 bg-green-50 border-green-200',
      withdrawal: 'text-blue-600 bg-blue-50 border-blue-200',
      login: 'text-gray-600 bg-gray-50 border-gray-200',
      system: 'text-purple-600 bg-purple-50 border-purple-200',
      achievement: 'text-yellow-600 bg-yellow-50 border-yellow-200',
      prediction: 'text-indigo-600 bg-indigo-50 border-indigo-200',
      custom: 'text-gray-600 bg-gray-50 border-gray-200',
    },
    cyber: {
      bet_placed: 'text-cyan-300 bg-cyan-500/20 border-cyan-500/30',
      bet_won: 'text-green-300 bg-green-500/20 border-green-500/30',
      bet_lost: 'text-red-300 bg-red-500/20 border-red-500/30',
      deposit: 'text-green-300 bg-green-500/20 border-green-500/30',
      withdrawal: 'text-cyan-300 bg-cyan-500/20 border-cyan-500/30',
      login: 'text-slate-300 bg-slate-500/20 border-slate-500/30',
      system: 'text-purple-300 bg-purple-500/20 border-purple-500/30',
      achievement: 'text-yellow-300 bg-yellow-500/20 border-yellow-500/30',
      prediction: 'text-indigo-300 bg-indigo-500/20 border-indigo-500/30',
      custom: 'text-slate-300 bg-slate-500/20 border-slate-500/30',
    },
  };

  return variant === 'cyber'
    ? colors.cyber[type as keyof typeof colors.cyber] || colors.cyber.custom
    : colors.default[type as keyof typeof colors.default] || colors.default.custom;
};

const _getPriorityIndicator = (priority: string, variant: string = 'default') => {
  const _indicators = {
    default: {
      urgent: 'bg-red-500 animate-pulse',
      high: 'bg-orange-500',
      medium: 'bg-yellow-500',
      low: 'bg-green-500',
    },
    cyber: {
      urgent: 'bg-red-400 animate-pulse shadow-red-400/50',
      high: 'bg-orange-400 shadow-orange-400/50',
      medium: 'bg-yellow-400 shadow-yellow-400/50',
      low: 'bg-green-400 shadow-green-400/50',
    },
  };

  return variant === 'cyber'
    ? indicators.cyber[priority as keyof typeof indicators.cyber] || indicators.cyber.low
    : indicators.default[priority as keyof typeof indicators.default] || indicators.default.low;
};

const _formatTimeAgo = (date: Date): string => {
  const _now = new Date();
  const _diffMs = now.getTime() - date.getTime();
  const _diffMins = Math.floor(diffMs / 60000);
  const _diffHours = Math.floor(diffMs / 3600000);
  const _diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
};

const _formatValue = (value: number | string): string => {
  if (typeof value === 'number') {
    if (Math.abs(value) >= 1000000) {
      return (value / 1000000).toFixed(1) + 'M';
    }
    if (Math.abs(value) >= 1000) {
      return (value / 1000).toFixed(1) + 'K';
    }
    return value.toLocaleString();
  }
  return String(value);
};

export const _ModernActivityFeed: React.FC<ModernActivityFeedProps> = ({
  activities,
  variant = 'default',
  layout = 'list',
  showFilters = true,
  showSearch = true,
  showGrouping = true,
  showInfiniteScroll = false,
  showRealTimeUpdates = true,
  maxItems = 50,
  autoRefresh = false,
  refreshInterval = 30,
  groupBy = 'date',
  className,
  onActivityClick,
  onUserClick,
  onFilterChange,
  onLoadMore,
  onRefresh,
}) => {
  const [filteredActivities, setFilteredActivities] = useState<ActivityItem[]>(activities);
  const [currentFilter, setCurrentFilter] = useState<ActivityFilter>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [groupedActivities, setGroupedActivities] = useState<Record<string, ActivityItem[]>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [newActivitiesCount, setNewActivitiesCount] = useState(0);
  const _feedRef = useRef<HTMLDivElement>(null);

  // Filter and group activities
  useEffect(() => {
    let _filtered = activities;

    // Apply filters
    if (currentFilter.types?.length) {
      filtered = filtered.filter(a => currentFilter.types!.includes(a.type));
    }
    if (currentFilter.categories?.length) {
      filtered = filtered.filter(a => currentFilter.categories!.includes(a.category));
    }
    if (currentFilter.priority?.length) {
      filtered = filtered.filter(a => currentFilter.priority!.includes(a.priority));
    }
    if (currentFilter.status?.length) {
      filtered = filtered.filter(a => a.status && currentFilter.status!.includes(a.status));
    }
    if (currentFilter.users?.length) {
      filtered = filtered.filter(a => currentFilter.users!.includes(a.user.id));
    }
    if (currentFilter.dateRange) {
      filtered = filtered.filter(
        a =>
          a.timestamp >= currentFilter.dateRange!.start &&
          a.timestamp <= currentFilter.dateRange!.end
      );
    }

    // Apply search
    if (searchQuery) {
      const _query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        a =>
          a.action.toLowerCase().includes(query) ||
          a.description.toLowerCase().includes(query) ||
          a.user.name.toLowerCase().includes(query) ||
          a.tags?.some(tag => tag.toLowerCase().includes(query))
      );
    }

    // Limit items
    filtered = filtered.slice(0, maxItems);

    setFilteredActivities(filtered);

    // Group activities
    if (showGrouping && groupBy !== 'none') {
      const _grouped = filtered.reduce(
        (groups, activity) => {
          let _key: string;

          switch (groupBy) {
            case 'date':
              key = activity.timestamp.toDateString();
              break;
            case 'user':
              key = activity.user.name;
              break;
            case 'category':
              key = activity.category;
              break;
            case 'type':
              key = activity.type;
              break;
            default:
              key = 'All';
          }

          if (!groups[key]) {
            groups[key] = [];
          }
          groups[key].push(activity);
          return groups;
        },
        {} as Record<string, ActivityItem[]>
      );

      setGroupedActivities(grouped);
    }
  }, [activities, currentFilter, searchQuery, maxItems, showGrouping, groupBy]);

  // Auto refresh
  useEffect(() => {
    if (!autoRefresh) return;

    const _interval = setInterval(() => {
      onRefresh?.();
    }, refreshInterval * 1000);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, onRefresh]);

  // Real-time updates
  useEffect(() => {
    if (showRealTimeUpdates && activities.length > filteredActivities.length) {
      setNewActivitiesCount(activities.length - filteredActivities.length);
    }
  }, [activities.length, filteredActivities.length, showRealTimeUpdates]);

  const _handleFilterChange = (newFilter: Partial<ActivityFilter>) => {
    const _updatedFilter = { ...currentFilter, ...newFilter };
    setCurrentFilter(updatedFilter);
    onFilterChange?.(updatedFilter);
  };

  const _handleRefresh = () => {
    setIsLoading(true);
    setNewActivitiesCount(0);
    onRefresh?.();
    setTimeout(() => setIsLoading(false), 1000);
  };

  const _variantClasses = {
    default: 'bg-white border border-gray-200 rounded-lg shadow-sm',
    cyber:
      'bg-slate-900/95 border border-cyan-500/30 rounded-lg shadow-2xl shadow-cyan-500/20 backdrop-blur-md',
    minimal: 'bg-gray-50 rounded-md',
    card: 'bg-white border border-gray-300 rounded-xl shadow-lg',
    timeline: 'bg-white border-l-4 border-blue-500 shadow-sm',
  };

  const _displayActivities =
    showGrouping && groupBy !== 'none'
      ? groupedActivities
      : { 'All Activities': filteredActivities };

  return (
    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <div className={cn('relative', variantClasses[variant], className)}>
      {/* Header */}
      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <div
        className={cn(
          'flex items-center justify-between p-4 border-b',
          variant === 'cyber' ? 'border-cyan-500/30' : 'border-gray-200'
        )}
      >
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <div className='flex items-center space-x-3'>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <h3
            className={cn(
              'text-lg font-semibold',
              variant === 'cyber' ? 'text-cyan-300' : 'text-gray-900'
            )}
          >
            Activity Feed
          </h3>
          {newActivitiesCount > 0 && (
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <span
              className={cn(
                'px-2 py-1 text-xs rounded-full animate-pulse',
                variant === 'cyber' ? 'bg-cyan-500/20 text-cyan-300' : 'bg-blue-100 text-blue-700'
              )}
            >
              {newActivitiesCount} new
            </span>
          )}
        </div>

        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <div className='flex items-center space-x-2'>
          {autoRefresh && (
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div
              className={cn(
                'flex items-center space-x-1 text-xs',
                variant === 'cyber' ? 'text-cyan-400/70' : 'text-gray-500'
              )}
            >
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <div className='w-2 h-2 bg-green-500 rounded-full animate-pulse' />
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <span>Live</span>
            </div>
          )}
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className={cn(
              'px-3 py-1 text-sm rounded transition-colors',
              variant === 'cyber'
                ? 'bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 disabled:opacity-50'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50'
            )}
          >
            {isLoading ? '⟳' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      {(showSearch || showFilters) && (
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <div
          className={cn(
            'p-4 border-b space-y-3',
            variant === 'cyber' ? 'border-cyan-500/30' : 'border-gray-200'
          )}
        >
          {showSearch && (
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <input
              type='text'
              placeholder='Search activities...'
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className={cn(
                'w-full px-3 py-2 border rounded-lg',
                variant === 'cyber'
                  ? 'bg-slate-800 border-cyan-500/30 text-cyan-300 placeholder-cyan-400/50'
                  : 'bg-white border-gray-300'
              )}
            />
          )}

          {showFilters && (
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div className='flex flex-wrap gap-2'>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <select
                onChange={e =>
                  handleFilterChange({
                    categories: e.target.value ? [e.target.value] : undefined,
                  })
                }
                className={cn(
                  'px-2 py-1 text-sm border rounded',
                  variant === 'cyber'
                    ? 'bg-slate-800 border-cyan-500/30 text-cyan-300'
                    : 'bg-white border-gray-300'
                )}
              >
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <option value=''>All Categories</option>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <option value='betting'>Betting</option>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <option value='financial'>Financial</option>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <option value='account'>Account</option>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <option value='system'>System</option>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <option value='social'>Social</option>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <option value='achievement'>Achievement</option>
              </select>

              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <select
                onChange={e =>
                  handleFilterChange({
                    priority: e.target.value ? [e.target.value] : undefined,
                  })
                }
                className={cn(
                  'px-2 py-1 text-sm border rounded',
                  variant === 'cyber'
                    ? 'bg-slate-800 border-cyan-500/30 text-cyan-300'
                    : 'bg-white border-gray-300'
                )}
              >
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <option value=''>All Priorities</option>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <option value='urgent'>Urgent</option>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <option value='high'>High</option>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <option value='medium'>Medium</option>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <option value='low'>Low</option>
              </select>
            </div>
          )}
        </div>
      )}

      {/* Activity Feed */}
      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <div ref={feedRef} className='max-h-96 overflow-y-auto'>
        {Object.entries(displayActivities).map(([groupKey, groupActivities]) => (
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div key={groupKey}>
            {/* Group Header */}
            {showGrouping && groupBy !== 'none' && Object.keys(displayActivities).length > 1 && (
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <div
                className={cn(
                  'sticky top-0 px-4 py-2 border-b text-sm font-medium',
                  variant === 'cyber'
                    ? 'bg-slate-800/90 border-cyan-500/30 text-cyan-300'
                    : 'bg-gray-50 border-gray-200 text-gray-700'
                )}
              >
                {groupKey} ({groupActivities.length})
              </div>
            )}

            {/* Activities */}
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div className='space-y-1'>
              {groupActivities.map(activity => (
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <ActivityItemComponent
                  key={activity.id}
                  activity={activity}
                  variant={variant}
                  layout={layout}
                  onClick={onActivityClick}
                  onUserClick={onUserClick}
                />
              ))}
            </div>
          </div>
        ))}

        {filteredActivities.length === 0 && (
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div
            className={cn(
              'p-8 text-center',
              variant === 'cyber' ? 'text-cyan-400/70' : 'text-gray-500'
            )}
          >
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div className='text-4xl mb-2'>📭</div>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div className='text-sm'>No activities found</div>
          </div>
        )}
      </div>

      {/* Load More */}
      {showInfiniteScroll && filteredActivities.length >= maxItems && (
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <div
          className={cn(
            'p-4 border-t text-center',
            variant === 'cyber' ? 'border-cyan-500/30' : 'border-gray-200'
          )}
        >
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <button
            onClick={onLoadMore}
            className={cn(
              'px-4 py-2 text-sm rounded transition-colors',
              variant === 'cyber'
                ? 'bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            )}
          >
            Load More
          </button>
        </div>
      )}

      {/* Cyber Effects */}
      {variant === 'cyber' && (
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div className='absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-blue-500/5 rounded-lg pointer-events-none' />
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div className='absolute inset-0 bg-grid-white/[0.02] rounded-lg pointer-events-none' />
        </>
      )}
    </div>
  );
};

// Individual activity item component
interface ActivityItemComponentProps {
  activity: ActivityItem;
  variant: string;
  layout: string;
  onClick?: (activity: ActivityItem) => void;
  onUserClick?: (user: ActivityUser) => void;
}

const _ActivityItemComponent: React.FC<ActivityItemComponentProps> = ({
  activity,
  variant,
  layout,
  onClick,
  onUserClick,
}) => {
  return (
    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <div
      className={cn(
        'p-4 border-b transition-all duration-200',
        variant === 'cyber'
          ? 'border-cyan-500/20 hover:bg-cyan-500/5'
          : 'border-gray-100 hover:bg-gray-50',
        onClick && 'cursor-pointer',
        layout === 'card' && 'border rounded-lg mb-2 shadow-sm'
      )}
      onClick={() => onClick?.(activity)}
    >
      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <div className='flex items-start space-x-3'>
        {/* Priority Indicator */}
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <div
          className={cn(
            'w-2 h-2 rounded-full mt-2 flex-shrink-0',
            getPriorityIndicator(activity.priority, variant)
          )}
        />

        {/* Activity Icon */}
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <div
          className={cn(
            'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm',
            getActivityColor(activity.type, variant)
          )}
        >
          {getActivityIcon(activity.type)}
        </div>

        {/* Content */}
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <div className='flex-1 min-w-0'>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div className='flex items-center justify-between'>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div className='flex items-center space-x-2'>
              {/* User */}
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <button
                onClick={e => {
                  e.stopPropagation();
                  onUserClick?.(activity.user);
                }}
                className={cn(
                  'font-medium hover:underline',
                  variant === 'cyber' ? 'text-cyan-300' : 'text-gray-900'
                )}
              >
                {activity.user.name}
              </button>

              {/* User Role Badge */}
              {activity.user.role && activity.user.role !== 'user' && (
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <span
                  className={cn(
                    'px-1.5 py-0.5 text-xs rounded uppercase',
                    variant === 'cyber'
                      ? 'bg-purple-500/20 text-purple-300'
                      : 'bg-purple-100 text-purple-700'
                  )}
                >
                  {activity.user.role}
                </span>
              )}

              {/* Verified Badge */}
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              {activity.user.verified && <span className='text-blue-500'>✓</span>}
            </div>

            {/* Timestamp */}
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <span
              className={cn('text-xs', variant === 'cyber' ? 'text-cyan-400/70' : 'text-gray-500')}
            >
              {formatTimeAgo(activity.timestamp)}
            </span>
          </div>

          {/* Action & Description */}
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div
            className={cn(
              'text-sm mt-1',
              variant === 'cyber' ? 'text-cyan-400/80' : 'text-gray-700'
            )}
          >
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <span className='font-medium'>{activity.action}</span>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            {activity.description && <span className='ml-1'>{activity.description}</span>}
          </div>

          {/* Data Values */}
          {activity.data?.value && (
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div
              className={cn(
                'text-sm mt-1 font-medium',
                variant === 'cyber' ? 'text-cyan-300' : 'text-gray-900'
              )}
            >
              {typeof activity.data.value === 'number' ? '$' : ''}
              {formatValue(activity.data.value)}
            </div>
          )}

          {/* Status */}
          {activity.status && (
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <span
              className={cn(
                'inline-block px-2 py-1 text-xs rounded mt-2 capitalize',
                activity.status === 'completed'
                  ? 'bg-green-100 text-green-700'
                  : activity.status === 'pending'
                    ? 'bg-yellow-100 text-yellow-700'
                    : activity.status === 'failed'
                      ? 'bg-red-100 text-red-700'
                      : 'bg-gray-100 text-gray-700'
              )}
            >
              {activity.status}
            </span>
          )}

          {/* Tags */}
          {activity.tags && activity.tags.length > 0 && (
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div className='flex flex-wrap gap-1 mt-2'>
              {activity.tags.slice(0, 3).map(tag => (
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <span
                  key={tag}
                  className={cn(
                    'px-1.5 py-0.5 text-xs rounded',
                    variant === 'cyber' ? 'bg-slate-700 text-cyan-400' : 'bg-gray-100 text-gray-600'
                  )}
                >
                  #{tag}
                </span>
              ))}
              {activity.tags.length > 3 && (
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <span
                  className={cn(
                    'text-xs',
                    variant === 'cyber' ? 'text-cyan-400/50' : 'text-gray-500'
                  )}
                >
                  +{activity.tags.length - 3} more
                </span>
              )}
            </div>
          )}

          {/* Location & Device */}
          {(activity.location || activity.device) && (
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div
              className={cn(
                'text-xs mt-2 opacity-70',
                variant === 'cyber' ? 'text-cyan-400' : 'text-gray-500'
              )}
            >
              {activity.location && `📍 ${activity.location}`}
              {activity.location && activity.device && ' • '}
              {activity.device && `📱 ${activity.device}`}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
