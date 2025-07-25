import React, { useState, useEffect } from 'react';
// @ts-expect-error TS(2307): Cannot find module '@/lib/utils' or its correspond... Remove this comment to see the full error message
import { cn } from '@/lib/utils';

// Types for notification system
interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'bet' | 'system';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category?: string;
  actionUrl?: string;
  actionLabel?: string;
  dismissible?: boolean;
  autoExpire?: number; // seconds
}

interface NotificationGroup {
  category: string;
  notifications: Notification[];
  unreadCount: number;
}

interface NotificationCenterProps {
  notifications?: Notification[];
  variant?: 'default' | 'cyber' | 'compact' | 'detailed';
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'center';
  maxVisible?: number;
  showUnreadOnly?: boolean;
  groupByCategory?: boolean;
  className?: string;
  onNotificationClick?: (notification: Notification) => void;
  onNotificationDismiss?: (notificationId: string) => void;
  onMarkAllRead?: () => void;
  onClearAll?: () => void;
}

const _getNotificationIcon = (type: string) => {
  const _icons = {
    info: '💡',
    success: '✅',
    warning: '⚠️',
    error: '❌',
    bet: '🎯',
    system: '⚙️',
  };
  return icons[type as keyof typeof icons] || '📢';
};

const _getNotificationColor = (type: string, variant: string = 'default') => {
  const _colors = {
    default: {
      info: 'border-blue-200 bg-blue-50',
      success: 'border-green-200 bg-green-50',
      warning: 'border-yellow-200 bg-yellow-50',
      error: 'border-red-200 bg-red-50',
      bet: 'border-purple-200 bg-purple-50',
      system: 'border-gray-200 bg-gray-50',
    },
    cyber: {
      info: 'border-cyan-500/30 bg-cyan-500/10 shadow-cyan-500/20',
      success: 'border-green-500/30 bg-green-500/10 shadow-green-500/20',
      warning: 'border-yellow-500/30 bg-yellow-500/10 shadow-yellow-500/20',
      error: 'border-red-500/30 bg-red-500/10 shadow-red-500/20',
      bet: 'border-purple-500/30 bg-purple-500/10 shadow-purple-500/20',
      system: 'border-blue-500/30 bg-blue-500/10 shadow-blue-500/20',
    },
  };

  return variant === 'cyber'
    ? colors.cyber[type as keyof typeof colors.cyber] || colors.cyber.info
    : colors.default[type as keyof typeof colors.default] || colors.default.info;
};

const _getPriorityIndicator = (priority: string, variant: string = 'default') => {
  if (priority === 'urgent') {
    return variant === 'cyber'
      ? 'animate-pulse bg-red-500 shadow-red-500/50'
      : 'animate-pulse bg-red-500';
  }
  if (priority === 'high') {
    return variant === 'cyber' ? 'bg-orange-500 shadow-orange-500/50' : 'bg-orange-500';
  }
  return 'bg-gray-400';
};

const _formatTimeAgo = (date: Date) => {
  const _now = new Date();
  const _diffMs = now.getTime() - date.getTime();
  const _diffMins = Math.floor(diffMs / 60000);
  const _diffHours = Math.floor(diffMs / 3600000);
  const _diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
};

export const _NotificationCenter: React.FC<NotificationCenterProps> = ({
  notifications = [],
  variant = 'default',
  position = 'top-right',
  maxVisible = 10,
  showUnreadOnly = false,
  groupByCategory = false,
  className,
  onNotificationClick,
  onNotificationDismiss,
  onMarkAllRead,
  onClearAll,
}) => {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [visibleNotifications, setVisibleNotifications] = useState<Notification[]>([]);

  // Filter and sort notifications
  useEffect(() => {
    let _filtered = notifications;

    if (showUnreadOnly) {
      filtered = filtered.filter(n => !n.read);
    }

    // Sort by priority and timestamp
    filtered = filtered.sort((a, b) => {
      const _priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
      const _aPriority = priorityOrder[a.priority] || 1;
      const _bPriority = priorityOrder[b.priority] || 1;

      if (aPriority !== bPriority) {
        return bPriority - aPriority;
      }

      return b.timestamp.getTime() - a.timestamp.getTime();
    });

    setVisibleNotifications(filtered.slice(0, maxVisible));
  }, [notifications, showUnreadOnly, maxVisible]);

  // Group notifications if needed
  const _groupedNotifications = groupByCategory
    ? visibleNotifications.reduce(
        (groups, notification) => {
          const _category = notification.category || 'General';
          if (!groups[category]) {
            groups[category] = [];
          }
          groups[category].push(notification);
          return groups;
        },
        {} as Record<string, Notification[]>
      )
    : null;

  const _positionClasses = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    center: 'top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2',
  };

  const _variantClasses = {
    default: 'bg-white border border-gray-200 rounded-lg shadow-lg',
    cyber:
      'bg-slate-900/95 border border-cyan-500/30 rounded-lg shadow-2xl shadow-cyan-500/20 backdrop-blur-md',
    compact: 'bg-white border border-gray-200 rounded-md shadow-md',
    detailed: 'bg-white border border-gray-300 rounded-xl shadow-xl',
  };

  const _unreadCount = notifications.filter(n => !n.read).length;

  const _toggleGroup = (category: string) => {
    const _newExpanded = new Set(expandedGroups);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedGroups(newExpanded);
  };

  const _handleNotificationClick = (notification: Notification) => {
    onNotificationClick?.(notification);
  };

  const _handleDismiss = (notificationId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    onNotificationDismiss?.(notificationId);
  };

  if (visibleNotifications.length === 0) {
    return null;
  }

  return (
    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <div
      className={cn(
        'fixed z-50 max-w-sm w-full max-h-96 overflow-hidden',
        positionClasses[position],
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
        <div className='flex items-center space-x-2'>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <h3
            className={cn('font-semibold', variant === 'cyber' ? 'text-cyan-300' : 'text-gray-900')}
          >
            Notifications
          </h3>
          {unreadCount > 0 && (
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <span
              className={cn(
                'px-2 py-1 text-xs rounded-full',
                variant === 'cyber' ? 'bg-cyan-500 text-black' : 'bg-blue-500 text-white'
              )}
            >
              {unreadCount}
            </span>
          )}
        </div>

        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <div className='flex items-center space-x-2'>
          {onMarkAllRead && unreadCount > 0 && (
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <button
              onClick={onMarkAllRead}
              className={cn(
                'text-xs px-2 py-1 rounded transition-colors',
                variant === 'cyber'
                  ? 'text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10'
                  : 'text-blue-600 hover:text-blue-800 hover:bg-blue-50'
              )}
            >
              Mark all read
            </button>
          )}
          {onClearAll && (
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <button
              onClick={onClearAll}
              className={cn(
                'text-xs px-2 py-1 rounded transition-colors',
                variant === 'cyber'
                  ? 'text-red-400 hover:text-red-300 hover:bg-red-500/10'
                  : 'text-red-600 hover:text-red-800 hover:bg-red-50'
              )}
            >
              Clear all
            </button>
          )}
        </div>
      </div>

      {/* Notifications List */}
      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <div className='overflow-y-auto max-h-80'>
        {groupByCategory && groupedNotifications
          ? // Grouped view
            Object.entries(groupedNotifications).map(([category, categoryNotifications]) => (
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <div key={category}>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <button
                  onClick={() => toggleGroup(category)}
                  className={cn(
                    'w-full px-4 py-2 text-left border-b transition-colors',
                    variant === 'cyber'
                      ? 'border-cyan-500/20 hover:bg-cyan-500/5 text-cyan-300'
                      : 'border-gray-100 hover:bg-gray-50 text-gray-700',
                    'flex items-center justify-between'
                  )}
                >
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <span className='font-medium'>{category}</span>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <span
                    className={cn(
                      'text-xs px-2 py-1 rounded-full',
                      variant === 'cyber' ? 'bg-cyan-500/20' : 'bg-gray-200'
                    )}
                  >
                    {categoryNotifications.length}
                  </span>
                </button>

                {expandedGroups.has(category) && (
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <div>
                    {categoryNotifications.map(notification => (
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <NotificationItem
                        key={notification.id}
                        notification={notification}
                        variant={variant}
                        onClick={handleNotificationClick}
                        onDismiss={handleDismiss}
                      />
                    ))}
                  </div>
                )}
              </div>
            ))
          : // Flat view
            visibleNotifications.map(notification => (
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <NotificationItem
                key={notification.id}
                notification={notification}
                variant={variant}
                onClick={handleNotificationClick}
                onDismiss={handleDismiss}
              />
            ))}
      </div>

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

// Individual notification item component
interface NotificationItemProps {
  notification: Notification;
  variant: string;
  onClick: (notification: Notification) => void;
  onDismiss: (notificationId: string, event: React.MouseEvent) => void;
}

const _NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  variant,
  onClick,
  onDismiss,
}) => {
  return (
    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <div
      className={cn(
        'relative border-b cursor-pointer transition-all duration-200',
        variant === 'cyber'
          ? 'border-cyan-500/20 hover:bg-cyan-500/5'
          : 'border-gray-100 hover:bg-gray-50',
        !notification.read && (variant === 'cyber' ? 'bg-cyan-500/5' : 'bg-blue-50'),
        getNotificationColor(notification.type, variant)
      )}
      onClick={() => onClick(notification)}
    >
      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <div className='p-4'>
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <div className='flex items-start justify-between'>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div className='flex items-start space-x-3 flex-1'>
            {/* Priority indicator */}
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div
              className={cn(
                'w-1 h-full absolute left-0 top-0',
                getPriorityIndicator(notification.priority, variant)
              )}
            />

            {/* Icon */}
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <span className='text-lg'>{getNotificationIcon(notification.type)}</span>

            {/* Content */}
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div className='flex-1 min-w-0'>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <div className='flex items-center justify-between'>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <h4
                  className={cn(
                    'font-medium truncate',
                    variant === 'cyber' ? 'text-cyan-100' : 'text-gray-900'
                  )}
                >
                  {notification.title}
                </h4>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <span
                  className={cn(
                    'text-xs whitespace-nowrap ml-2',
                    variant === 'cyber' ? 'text-cyan-400/70' : 'text-gray-500'
                  )}
                >
                  {formatTimeAgo(notification.timestamp)}
                </span>
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

              {notification.actionLabel && (
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <button
                  className={cn(
                    'text-xs mt-2 px-2 py-1 rounded transition-colors',
                    variant === 'cyber'
                      ? 'bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30'
                      : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                  )}
                >
                  {notification.actionLabel}
                </button>
              )}
            </div>
          </div>

          {/* Dismiss button */}
          {notification.dismissible !== false && (
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <button
              onClick={e => onDismiss(notification.id, e)}
              className={cn(
                'ml-2 p-1 rounded transition-colors',
                variant === 'cyber'
                  ? 'text-cyan-400/70 hover:text-cyan-300 hover:bg-cyan-500/10'
                  : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
              )}
            >
              ✕
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
