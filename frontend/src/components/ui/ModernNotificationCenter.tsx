import React, { useState, useEffect, useRef } from 'react';
// @ts-expect-error TS(2307): Cannot find module '@/lib/utils' or its correspond... Remove this comment to see the full error message
import { cn } from '@/lib/utils';

// Types for modern notification system
interface NotificationAction {
  id: string;
  label: string;
  variant: 'primary' | 'secondary' | 'danger' | 'ghost';
  icon?: string;
  onClick: () => void;
}

interface NotificationAttachment {
  id: string;
  type: 'image' | 'document' | 'link' | 'data';
  url: string;
  name: string;
  size?: number;
  thumbnail?: string;
}

interface NotificationData {
  value?: number | string;
  change?: number;
  trend?: 'up' | 'down' | 'stable';
  chart?: number[];
  metadata?: Record<string, unknown>;
}

interface ModernNotification {
  id: string;
  type:
    | 'info'
    | 'success'
    | 'warning'
    | 'error'
    | 'bet'
    | 'system'
    | 'social'
    | 'achievement'
    | 'financial';
  title: string;
  message: string;
  description?: string;
  timestamp: Date;
  read: boolean;
  priority: 'low' | 'medium' | 'high' | 'urgent' | 'critical';
  category: 'betting' | 'account' | 'system' | 'social' | 'financial' | 'security' | 'marketing';
  source: {
    id: string;
    name: string;
    avatar?: string;
    type: 'user' | 'system' | 'api' | 'bot';
  };
  actions?: NotificationAction[];
  attachments?: NotificationAttachment[];
  data?: NotificationData;
  tags?: string[];
  persistent?: boolean;
  autoExpire?: number; // milliseconds
  interactive?: boolean;
  groupId?: string;
  relatedNotifications?: string[];
  deepLink?: string;
}

interface NotificationGroup {
  id: string;
  title: string;
  notifications: ModernNotification[];
  collapsed: boolean;
  priority: 'low' | 'medium' | 'high';
}

interface NotificationFilter {
  types?: string[];
  categories?: string[];
  priorities?: string[];
  read?: boolean;
  dateRange?: { start: Date; end: Date };
  sources?: string[];
  tags?: string[];
}

interface ModernNotificationCenterProps {
  notifications: ModernNotification[];
  isOpen: boolean;
  variant?: 'default' | 'cyber' | 'minimal' | 'sidebar' | 'overlay';
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'center';
  maxVisible?: number;
  showFilters?: boolean;
  showSearch?: boolean;
  showMarkAllRead?: boolean;
  showClearAll?: boolean;
  groupByCategory?: boolean;
  groupByDate?: boolean;
  enableRealTime?: boolean;
  enableSound?: boolean;
  enablePush?: boolean;
  autoMarkAsRead?: boolean;
  className?: string;
  onClose?: () => void;
  onNotificationClick?: (notification: ModernNotification) => void;
  onNotificationRead?: (notificationId: string) => void;
  onNotificationDismiss?: (notificationId: string) => void;
  onMarkAllRead?: () => void;
  onClearAll?: () => void;
  onFilterChange?: (filter: NotificationFilter) => void;
}

const _getNotificationIcon = (type: string) => {
  const _icons = {
    info: 'ℹ️',
    success: '✅',
    warning: '⚠️',
    error: '❌',
    bet: '🎯',
    system: '⚙️',
    social: '👥',
    achievement: '🏆',
    financial: '💰',
  };
  return icons[type as keyof typeof icons] || 'ℹ️';
};

const _getNotificationColor = (type: string, variant: string = 'default') => {
  const _colors = {
    default: {
      info: 'border-blue-200 bg-blue-50 text-blue-800',
      success: 'border-green-200 bg-green-50 text-green-800',
      warning: 'border-yellow-200 bg-yellow-50 text-yellow-800',
      error: 'border-red-200 bg-red-50 text-red-800',
      bet: 'border-purple-200 bg-purple-50 text-purple-800',
      system: 'border-gray-200 bg-gray-50 text-gray-800',
      social: 'border-pink-200 bg-pink-50 text-pink-800',
      achievement: 'border-yellow-200 bg-yellow-50 text-yellow-800',
      financial: 'border-green-200 bg-green-50 text-green-800',
    },
    cyber: {
      info: 'border-cyan-500/30 bg-cyan-500/10 text-cyan-300',
      success: 'border-green-500/30 bg-green-500/10 text-green-300',
      warning: 'border-yellow-500/30 bg-yellow-500/10 text-yellow-300',
      error: 'border-red-500/30 bg-red-500/10 text-red-300',
      bet: 'border-purple-500/30 bg-purple-500/10 text-purple-300',
      system: 'border-slate-500/30 bg-slate-500/10 text-slate-300',
      social: 'border-pink-500/30 bg-pink-500/10 text-pink-300',
      achievement: 'border-yellow-500/30 bg-yellow-500/10 text-yellow-300',
      financial: 'border-green-500/30 bg-green-500/10 text-green-300',
    },
  };

  return variant === 'cyber'
    ? colors.cyber[type as keyof typeof colors.cyber] || colors.cyber.info
    : colors.default[type as keyof typeof colors.default] || colors.default.info;
};

const _getPriorityIndicator = (priority: string, variant: string = 'default') => {
  const _indicators = {
    default: {
      critical: 'bg-red-500 animate-pulse border-2 border-red-300',
      urgent: 'bg-orange-500 animate-pulse',
      high: 'bg-orange-400',
      medium: 'bg-blue-400',
      low: 'bg-gray-400',
    },
    cyber: {
      critical: 'bg-red-400 animate-pulse border-2 border-red-500/50 shadow-red-400/50',
      urgent: 'bg-orange-400 animate-pulse shadow-orange-400/50',
      high: 'bg-orange-400 shadow-orange-400/50',
      medium: 'bg-cyan-400 shadow-cyan-400/50',
      low: 'bg-slate-400 shadow-slate-400/50',
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

const _playNotificationSound = (type: string) => {
  // Create a simple audio feedback
  const _audioContext = new (window.AudioContext || (window as unknown).webkitAudioContext)();
  const _oscillator = audioContext.createOscillator();
  const _gainNode = audioContext.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);

  // Different frequencies for different notification types
  const _frequencies = {
    success: 800,
    warning: 600,
    error: 400,
    info: 1000,
    default: 750,
  };

  oscillator.frequency.value = frequencies[type as keyof typeof frequencies] || frequencies.default;
  oscillator.type = 'sine';

  gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

  oscillator.start();
  oscillator.stop(audioContext.currentTime + 0.3);
};

export const _ModernNotificationCenter: React.FC<ModernNotificationCenterProps> = ({
  notifications,
  isOpen,
  variant = 'default',
  position = 'top-right',
  maxVisible = 50,
  showFilters = true,
  showSearch = true,
  showMarkAllRead = true,
  showClearAll = true,
  groupByCategory = false,
  groupByDate = false,
  enableRealTime = true,
  enableSound = true,
  enablePush = false,
  autoMarkAsRead = false,
  className,
  onClose,
  onNotificationClick,
  onNotificationRead,
  onNotificationDismiss,
  onMarkAllRead,
  onClearAll,
  onFilterChange,
}) => {
  const [filteredNotifications, setFilteredNotifications] =
    useState<ModernNotification[]>(notifications);
  const [currentFilter, setCurrentFilter] = useState<NotificationFilter>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [groupedNotifications, setGroupedNotifications] = useState<
    Record<string, ModernNotification[]>
  >({});
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const [lastNotificationCount, setLastNotificationCount] = useState(notifications.length);
  const _containerRef = useRef<HTMLDivElement>(null);

  // Handle new notifications (sound, push, etc.)
  useEffect(() => {
    if (notifications.length > lastNotificationCount && enableRealTime) {
      const _newNotifications = notifications.slice(lastNotificationCount);

      // Play sound for new notifications
      if (
        enableSound &&
        newNotifications.some(n => n.priority === 'urgent' || n.priority === 'critical')
      ) {
        playNotificationSound(newNotifications[0].type);
      }

      // Show browser push notification
      if (enablePush && 'Notification' in window && Notification.permission === 'granted') {
        newNotifications.forEach(notification => {
          if (notification.priority === 'urgent' || notification.priority === 'critical') {
            new Notification(notification.title, {
              body: notification.message,
              icon: '/favicon.ico',
              tag: notification.id,
            });
          }
        });
      }
    }

    setLastNotificationCount(notifications.length);
  }, [notifications.length, lastNotificationCount, enableRealTime, enableSound, enablePush]);

  // Filter and group notifications
  useEffect(() => {
    let _filtered = notifications;

    // Apply filters
    if (currentFilter.types?.length) {
      filtered = filtered.filter(n => currentFilter.types!.includes(n.type));
    }
    if (currentFilter.categories?.length) {
      filtered = filtered.filter(n => currentFilter.categories!.includes(n.category));
    }
    if (currentFilter.priorities?.length) {
      filtered = filtered.filter(n => currentFilter.priorities!.includes(n.priority));
    }
    if (currentFilter.sources?.length) {
      filtered = filtered.filter(n => currentFilter.sources!.includes(n.source.id));
    }
    if (currentFilter.read !== undefined) {
      filtered = filtered.filter(n => n.read === currentFilter.read);
    }
    if (currentFilter.dateRange) {
      filtered = filtered.filter(
        n =>
          n.timestamp >= currentFilter.dateRange!.start &&
          n.timestamp <= currentFilter.dateRange!.end
      );
    }
    if (currentFilter.tags?.length) {
      filtered = filtered.filter(n => n.tags?.some(tag => currentFilter.tags!.includes(tag)));
    }

    // Apply search
    if (searchQuery) {
      const _query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        n =>
          n.title.toLowerCase().includes(query) ||
          n.message.toLowerCase().includes(query) ||
          n.description?.toLowerCase().includes(query) ||
          n.source.name.toLowerCase().includes(query) ||
          n.tags?.some(tag => tag.toLowerCase().includes(query))
      );
    }

    // Sort by priority and timestamp
    filtered = filtered.sort((a, b) => {
      const _priorityOrder = { critical: 5, urgent: 4, high: 3, medium: 2, low: 1 };
      const _aPriority = priorityOrder[a.priority] || 1;
      const _bPriority = priorityOrder[b.priority] || 1;

      if (aPriority !== bPriority) {
        return bPriority - aPriority;
      }

      return b.timestamp.getTime() - a.timestamp.getTime();
    });

    // Limit visible notifications
    filtered = filtered.slice(0, maxVisible);

    setFilteredNotifications(filtered);

    // Group notifications
    if (groupByCategory || groupByDate) {
      const _grouped = filtered.reduce(
        (groups, notification) => {
          let _key: string;

          if (groupByDate) {
            key = notification.timestamp.toDateString();
          } else if (groupByCategory) {
            key = notification.category;
          } else {
            key = 'All';
          }

          if (!groups[key]) {
            groups[key] = [];
          }
          groups[key].push(notification);
          return groups;
        },
        {} as Record<string, ModernNotification[]>
      );

      setGroupedNotifications(grouped);
    }
  }, [notifications, currentFilter, searchQuery, maxVisible, groupByCategory, groupByDate]);

  // Request push notification permission
  useEffect(() => {
    if (enablePush && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, [enablePush]);

  const _handleFilterChange = (newFilter: Partial<NotificationFilter>) => {
    const _updatedFilter = { ...currentFilter, ...newFilter };
    setCurrentFilter(updatedFilter);
    onFilterChange?.(updatedFilter);
  };

  const _handleNotificationClick = (notification: ModernNotification) => {
    // Auto mark as read
    if (autoMarkAsRead && !notification.read) {
      onNotificationRead?.(notification.id);
    }

    onNotificationClick?.(notification);

    // Navigate to deep link if available
    if (notification.deepLink) {
      window.location.href = notification.deepLink;
    }
  };

  const _handleMarkAllRead = () => {
    onMarkAllRead?.();
  };

  const _handleClearAll = () => {
    onClearAll?.();
  };

  const _toggleGroup = (groupId: string) => {
    const _newCollapsed = new Set(collapsedGroups);
    if (newCollapsed.has(groupId)) {
      newCollapsed.delete(groupId);
    } else {
      newCollapsed.add(groupId);
    }
    setCollapsedGroups(newCollapsed);
  };

  const _unreadCount = notifications.filter(n => !n.read).length;
  const _urgentCount = notifications.filter(
    n => n.priority === 'urgent' || n.priority === 'critical'
  ).length;

  if (!isOpen) return null;

  const _positionClasses = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    center: 'top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2',
  };

  const _variantClasses = {
    default: 'bg-white border border-gray-200 rounded-xl shadow-2xl',
    cyber:
      'bg-slate-900/95 border border-cyan-500/30 rounded-xl shadow-2xl shadow-cyan-500/20 backdrop-blur-md',
    minimal: 'bg-white border border-gray-100 rounded-lg shadow-xl',
    sidebar: 'bg-white border-l border-gray-200 shadow-2xl h-full',
    overlay: 'bg-white/90 border border-white/20 rounded-xl shadow-2xl backdrop-blur-md',
  };

  const _displayNotifications =
    groupByCategory || groupByDate ? groupedNotifications : { All: filteredNotifications };

  return (
    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <div className='fixed inset-0 z-50 pointer-events-none'>
      {/* Backdrop for overlay variant */}
      {variant === 'overlay' && (
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <div
          className='absolute inset-0 bg-black/50 backdrop-blur-sm pointer-events-auto'
          onClick={onClose}
        />
      )}

      {/* Notification Center */}
      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <div
        ref={containerRef}
        className={cn(
          'fixed pointer-events-auto',
          variant === 'sidebar' ? 'w-96 h-full' : 'w-96 max-h-[80vh]',
          position !== 'center' && positionClasses[position],
          position === 'center' && positionClasses[position],
          variantClasses[variant],
          className
        )}
      >
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
              Notifications
            </h3>

            {/* Counters */}
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div className='flex items-center space-x-2'>
              {unreadCount > 0 && (
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <span
                  className={cn(
                    'px-2 py-1 text-xs rounded-full',
                    variant === 'cyber'
                      ? 'bg-cyan-500/20 text-cyan-300'
                      : 'bg-blue-100 text-blue-700'
                  )}
                >
                  {unreadCount} unread
                </span>
              )}

              {urgentCount > 0 && (
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <span
                  className={cn(
                    'px-2 py-1 text-xs rounded-full animate-pulse',
                    variant === 'cyber' ? 'bg-red-500/20 text-red-300' : 'bg-red-100 text-red-700'
                  )}
                >
                  {urgentCount} urgent
                </span>
              )}
            </div>
          </div>

          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div className='flex items-center space-x-2'>
            {/* Actions */}
            {showMarkAllRead && unreadCount > 0 && (
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <button
                onClick={handleMarkAllRead}
                className={cn(
                  'px-2 py-1 text-xs rounded transition-colors',
                  variant === 'cyber'
                    ? 'text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10'
                    : 'text-blue-600 hover:text-blue-800 hover:bg-blue-50'
                )}
              >
                Mark all read
              </button>
            )}

            {showClearAll && (
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <button
                onClick={handleClearAll}
                className={cn(
                  'px-2 py-1 text-xs rounded transition-colors',
                  variant === 'cyber'
                    ? 'text-red-400 hover:text-red-300 hover:bg-red-500/10'
                    : 'text-red-600 hover:text-red-800 hover:bg-red-50'
                )}
              >
                Clear all
              </button>
            )}

            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <button
              onClick={onClose}
              className={cn(
                'p-1 rounded transition-colors',
                variant === 'cyber'
                  ? 'text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              )}
            >
              ✕
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
                placeholder='Search notifications...'
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
                      read: e.target.value === '' ? undefined : e.target.value === 'true',
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
                  <option value=''>All</option>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <option value='false'>Unread</option>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <option value='true'>Read</option>
                </select>

                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <select
                  onChange={e =>
                    handleFilterChange({
                      priorities: e.target.value ? [e.target.value] : undefined,
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
                  <option value='critical'>Critical</option>
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

        {/* Notifications List */}
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <div className='flex-1 overflow-y-auto'>
          {Object.entries(displayNotifications).map(([groupKey, groupNotifications]) => (
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div key={groupKey}>
              {/* Group Header */}
              {(groupByCategory || groupByDate) && Object.keys(displayNotifications).length > 1 && (
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <button
                  onClick={() => toggleGroup(groupKey)}
                  className={cn(
                    'w-full flex items-center justify-between p-3 border-b transition-colors',
                    variant === 'cyber'
                      ? 'border-cyan-500/20 hover:bg-cyan-500/5 text-cyan-300'
                      : 'border-gray-100 hover:bg-gray-50 text-gray-700'
                  )}
                >
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <span className='font-medium'>{groupKey}</span>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <div className='flex items-center space-x-2'>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <span
                      className={cn(
                        'text-xs px-2 py-1 rounded-full',
                        variant === 'cyber' ? 'bg-cyan-500/20' : 'bg-gray-200'
                      )}
                    >
                      {groupNotifications.length}
                    </span>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <span
                      className={cn(
                        'text-xs transition-transform',
                        collapsedGroups.has(groupKey) ? 'rotate-0' : 'rotate-90'
                      )}
                    >
                      ▶
                    </span>
                  </div>
                </button>
              )}

              {/* Notifications */}
              {(!collapsedGroups.has(groupKey) || (!groupByCategory && !groupByDate)) && (
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <div>
                  {groupNotifications.map(notification => (
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <NotificationItem
                      key={notification.id}
                      notification={notification}
                      variant={variant}
                      onClick={handleNotificationClick}
                      onRead={onNotificationRead}
                      onDismiss={onNotificationDismiss}
                    />
                  ))}
                </div>
              )}
            </div>
          ))}

          {filteredNotifications.length === 0 && (
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div
              className={cn(
                'p-8 text-center',
                variant === 'cyber' ? 'text-cyan-400/70' : 'text-gray-500'
              )}
            >
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <div className='text-4xl mb-2'>🔔</div>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <div className='text-sm'>No notifications</div>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <div className='text-xs mt-1 opacity-70'>You're all caught up!</div>
            </div>
          )}
        </div>

        {/* Cyber Effects */}
        {variant === 'cyber' && (
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div className='absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-purple-500/5 rounded-xl pointer-events-none' />
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div className='absolute inset-0 bg-grid-white/[0.02] rounded-xl pointer-events-none' />
          </>
        )}
      </div>
    </div>
  );
};

// Individual notification item component
interface NotificationItemProps {
  notification: ModernNotification;
  variant: string;
  onClick: (notification: ModernNotification) => void;
  onRead?: (notificationId: string) => void;
  onDismiss?: (notificationId: string) => void;
}

const _NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  variant,
  onClick,
  onRead,
  onDismiss,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <div
      className={cn(
        'relative border-b transition-all duration-200',
        variant === 'cyber' ? 'border-cyan-500/20' : 'border-gray-100',
        !notification.read && (variant === 'cyber' ? 'bg-cyan-500/5' : 'bg-blue-50'),
        'hover:bg-gray-50',
        variant === 'cyber' && 'hover:bg-cyan-500/10'
      )}
    >
      {/* Priority Indicator */}
      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <div
        className={cn(
          'absolute left-0 top-0 bottom-0 w-1',
          getPriorityIndicator(notification.priority, variant)
        )}
      />

      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <div className='pl-4 pr-3 py-4'>
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <div className='flex items-start space-x-3'>
          {/* Icon/Avatar */}
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div
            className={cn(
              'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm',
              getNotificationColor(notification.type, variant)
            )}
          >
            {notification.source.avatar ? (
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <img
                src={notification.source.avatar}
                alt={notification.source.name}
                className='w-full h-full rounded-full object-cover'
              />
            ) : (
              getNotificationIcon(notification.type)
            )}
          </div>

          {/* Content */}
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div className='flex-1 min-w-0'>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div className='flex items-center justify-between'>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <h4
                className={cn(
                  'font-medium truncate',
                  variant === 'cyber' ? 'text-cyan-300' : 'text-gray-900'
                )}
              >
                {notification.title}
              </h4>

              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <div className='flex items-center space-x-2 ml-2'>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <span
                  className={cn(
                    'text-xs whitespace-nowrap',
                    variant === 'cyber' ? 'text-cyan-400/70' : 'text-gray-500'
                  )}
                >
                  {formatTimeAgo(notification.timestamp)}
                </span>

                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                {!notification.read && <div className='w-2 h-2 bg-blue-500 rounded-full' />}
              </div>
            </div>

            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <p
              className={cn(
                'text-sm mt-1 line-clamp-2',
                variant === 'cyber' ? 'text-cyan-200/80' : 'text-gray-600'
              )}
            >
              {notification.message}
            </p>

            {/* Source */}
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div
              className={cn(
                'text-xs mt-1',
                variant === 'cyber' ? 'text-cyan-400/50' : 'text-gray-500'
              )}
            >
              From {notification.source.name}
            </div>

            {/* Data Display */}
            {notification.data?.value && (
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <div
                className={cn(
                  'mt-2 p-2 rounded border',
                  variant === 'cyber'
                    ? 'bg-slate-800/50 border-cyan-500/20'
                    : 'bg-gray-50 border-gray-200'
                )}
              >
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <div
                  className={cn(
                    'text-lg font-bold',
                    notification.data.trend === 'up'
                      ? 'text-green-500'
                      : notification.data.trend === 'down'
                        ? 'text-red-500'
                        : variant === 'cyber'
                          ? 'text-cyan-300'
                          : 'text-gray-900'
                  )}
                >
                  {typeof notification.data.value === 'number' ? '$' : ''}
                  {notification.data.value}
                  {notification.data.change && (
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <span
                      className={cn(
                        'text-sm ml-2',
                        notification.data.trend === 'up' ? 'text-green-500' : 'text-red-500'
                      )}
                    >
                      {notification.data.trend === 'up' ? '+' : ''}
                      {notification.data.change}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Actions */}
            {notification.actions && notification.actions.length > 0 && (
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <div className='flex space-x-2 mt-3'>
                {notification.actions.map(action => (
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <button
                    key={action.id}
                    onClick={e => {
                      e.stopPropagation();
                      action.onClick();
                    }}
                    className={cn(
                      'px-3 py-1 text-xs rounded transition-colors',
                      action.variant === 'primary' &&
                        (variant === 'cyber'
                          ? 'bg-cyan-500 text-black hover:bg-cyan-400'
                          : 'bg-blue-600 text-white hover:bg-blue-500'),
                      action.variant === 'secondary' &&
                        (variant === 'cyber'
                          ? 'bg-slate-700 text-cyan-300 hover:bg-slate-600'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'),
                      action.variant === 'danger' && 'bg-red-600 text-white hover:bg-red-500',
                      action.variant === 'ghost' &&
                        (variant === 'cyber'
                          ? 'text-cyan-400 hover:bg-cyan-500/10'
                          : 'text-gray-600 hover:bg-gray-100')
                    )}
                  >
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    {action.icon && <span className='mr-1'>{action.icon}</span>}
                    {action.label}
                  </button>
                ))}
              </div>
            )}

            {/* Tags */}
            {notification.tags && notification.tags.length > 0 && (
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <div className='flex flex-wrap gap-1 mt-2'>
                {notification.tags.slice(0, 3).map(tag => (
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <span
                    key={tag}
                    className={cn(
                      'px-1.5 py-0.5 text-xs rounded',
                      variant === 'cyber'
                        ? 'bg-slate-700 text-cyan-400'
                        : 'bg-gray-100 text-gray-600'
                    )}
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div className='flex flex-col space-y-1'>
            {!notification.read && onRead && (
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <button
                onClick={e => {
                  e.stopPropagation();
                  onRead(notification.id);
                }}
                className={cn(
                  'p-1 rounded transition-colors',
                  variant === 'cyber'
                    ? 'text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10'
                    : 'text-blue-600 hover:text-blue-800 hover:bg-blue-50'
                )}
                title='Mark as read'
              >
                👁️
              </button>
            )}

            {onDismiss && (
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <button
                onClick={e => {
                  e.stopPropagation();
                  onDismiss(notification.id);
                }}
                className={cn(
                  'p-1 rounded transition-colors',
                  variant === 'cyber'
                    ? 'text-red-400 hover:text-red-300 hover:bg-red-500/10'
                    : 'text-red-600 hover:text-red-800 hover:bg-red-50'
                )}
                title='Dismiss'
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
