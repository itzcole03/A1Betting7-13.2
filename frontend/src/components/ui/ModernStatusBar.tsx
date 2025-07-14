import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

// Types for status bar
interface StatusItem {
  id: string;
  label: string;
  value: string | number;
  icon?: string;
  status: 'normal' | 'warning' | 'error' | 'success' | 'loading';
  tooltip?: string;
  clickable?: boolean;
  priority: number; // Higher = more important
  category: 'system' | 'network' | 'user' | 'data' | 'performance' | 'betting';
  unit?: string;
  trend?: 'up' | 'down' | 'stable';
  onClick?: () => void;
}

interface SystemMetrics {
  cpu: number;
  memory: number;
  network: {
    latency: number;
    bandwidth: number;
    status: 'connected' | 'disconnected' | 'slow';
  };
  dataFreshness: number; // seconds since last update
  activeUsers: number;
  serverLoad: number;
  errorRate: number;
}

interface ApplicationStatus {
  mode: 'development' | 'staging' | 'production';
  version: string;
  buildTime: Date;
  uptime: number; // seconds
  features: {
    realTime: boolean;
    notifications: boolean;
    ai: boolean;
    betting: boolean;
  };
  maintenance: {
    scheduled: boolean;
    startTime?: Date;
    duration?: number;
    message?: string;
  };
}

interface ModernStatusBarProps {
  statusItems?: StatusItem[];
  systemMetrics?: SystemMetrics;
  applicationStatus?: ApplicationStatus;
  variant?: 'default' | 'cyber' | 'minimal' | 'compact' | 'floating';
  position?: 'top' | 'bottom' | 'fixed-bottom' | 'fixed-top';
  showClock?: boolean;
  showMetrics?: boolean;
  showVersion?: boolean;
  showNotifications?: boolean;
  showUserInfo?: boolean;
  showConnectionStatus?: boolean;
  autoHide?: boolean;
  animateUpdates?: boolean;
  maxItems?: number;
  className?: string;
  onItemClick?: (item: StatusItem) => void;
  onSystemAlert?: (alert: { type: string; message: string }) => void;
}

const getStatusColor = (status: string, variant: string = 'default') => {
  const colors = {
    default: {
      normal: 'text-gray-600',
      success: 'text-green-600',
      warning: 'text-yellow-600',
      error: 'text-red-600',
      loading: 'text-blue-600',
    },
    cyber: {
      normal: 'text-cyan-400',
      success: 'text-green-300',
      warning: 'text-yellow-300',
      error: 'text-red-300',
      loading: 'text-blue-300',
    },
  };

  return variant === 'cyber'
    ? colors.cyber[status as keyof typeof colors.cyber] || colors.cyber.normal
    : colors.default[status as keyof typeof colors.default] || colors.default.normal;
};

const getStatusIcon = (status: string) => {
  const icons = {
    normal: '●',
    success: '✓',
    warning: '⚠',
    error: '✗',
    loading: '⟳',
  };
  return icons[status as keyof typeof icons] || icons.normal;
};

const formatUptime = (seconds: number): string => {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
};

const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

const formatNumber = (num: number): string => {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
};

const getCurrentTime = (): string => {
  return new Date().toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
};

export const ModernStatusBar: React.FC<ModernStatusBarProps> = ({
  statusItems = [],
  systemMetrics,
  applicationStatus,
  variant = 'default',
  position = 'bottom',
  showClock = true,
  showMetrics = true,
  showVersion = true,
  showNotifications = true,
  showUserInfo = false,
  showConnectionStatus = true,
  autoHide = false,
  animateUpdates = true,
  maxItems = 10,
  className,
  onItemClick,
  onSystemAlert,
}) => {
  const [currentTime, setCurrentTime] = useState(getCurrentTime());
  const [isVisible, setIsVisible] = useState(true);
  const [lastActivity, setLastActivity] = useState(Date.now());
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  // Update clock
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(getCurrentTime());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Auto-hide functionality
  useEffect(() => {
    if (!autoHide) return;

    const handleActivity = () => {
      setLastActivity(Date.now());
      setIsVisible(true);
    };

    const checkActivity = () => {
      if (Date.now() - lastActivity > 5000) {
        // 5 seconds
        setIsVisible(false);
      }
    };

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    events.forEach(event => {
      document.addEventListener(event, handleActivity, true);
    });

    const activityInterval = setInterval(checkActivity, 1000);

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity, true);
      });
      clearInterval(activityInterval);
    };
  }, [autoHide, lastActivity]);

  // System alerts
  useEffect(() => {
    if (!systemMetrics || !onSystemAlert) return;

    // Check for various system alerts
    if (systemMetrics.cpu > 90) {
      onSystemAlert({ type: 'warning', message: 'High CPU usage detected' });
    }
    if (systemMetrics.memory > 85) {
      onSystemAlert({ type: 'warning', message: 'High memory usage detected' });
    }
    if (systemMetrics.network.latency > 1000) {
      onSystemAlert({ type: 'warning', message: 'High network latency detected' });
    }
    if (systemMetrics.errorRate > 5) {
      onSystemAlert({ type: 'error', message: 'High error rate detected' });
    }
  }, [systemMetrics, onSystemAlert]);

  // Generate system status items
  const systemStatusItems: StatusItem[] = [];

  if (showConnectionStatus && systemMetrics) {
    systemStatusItems.push({
      id: 'network-status',
      label: 'Network',
      value: systemMetrics.network.status,
      icon: systemMetrics.network.status === 'connected' ? '🌐' : '📡',
      status:
        systemMetrics.network.status === 'connected'
          ? 'success'
          : systemMetrics.network.status === 'slow'
            ? 'warning'
            : 'error',
      priority: 10,
      category: 'network',
      tooltip: `Latency: ${systemMetrics.network.latency}ms`,
    });
  }

  if (showMetrics && systemMetrics) {
    systemStatusItems.push(
      {
        id: 'cpu-usage',
        label: 'CPU',
        value: systemMetrics.cpu,
        unit: '%',
        icon: '🖥️',
        status: systemMetrics.cpu > 80 ? 'error' : systemMetrics.cpu > 60 ? 'warning' : 'normal',
        priority: 8,
        category: 'performance',
        tooltip: `CPU Usage: ${systemMetrics.cpu}%`,
      },
      {
        id: 'memory-usage',
        label: 'Memory',
        value: systemMetrics.memory,
        unit: '%',
        icon: '💾',
        status:
          systemMetrics.memory > 85 ? 'error' : systemMetrics.memory > 70 ? 'warning' : 'normal',
        priority: 7,
        category: 'performance',
        tooltip: `Memory Usage: ${systemMetrics.memory}%`,
      },
      {
        id: 'active-users',
        label: 'Users',
        value: formatNumber(systemMetrics.activeUsers),
        icon: '👥',
        status: 'normal',
        priority: 6,
        category: 'user',
        tooltip: `Active Users: ${systemMetrics.activeUsers}`,
      }
    );
  }

  if (showVersion && applicationStatus) {
    systemStatusItems.push({
      id: 'app-version',
      label: 'Version',
      value: applicationStatus.version,
      icon: '📦',
      status: 'normal',
      priority: 3,
      category: 'system',
      tooltip: `Built: ${applicationStatus.buildTime.toLocaleDateString()}`,
    });
  }

  // Combine and sort all status items
  const allItems = [...statusItems, ...systemStatusItems]
    .sort((a, b) => b.priority - a.priority)
    .slice(0, maxItems);

  const positionClasses = {
    top: 'top-0',
    bottom: 'bottom-0',
    'fixed-top': 'fixed top-0 z-40',
    'fixed-bottom': 'fixed bottom-0 z-40',
  };

  const variantClasses = {
    default: 'bg-white border-t border-gray-200 shadow-sm',
    cyber:
      'bg-slate-900/95 border-t border-cyan-500/30 shadow-lg shadow-cyan-500/20 backdrop-blur-md',
    minimal: 'bg-gray-50 border-t border-gray-100',
    compact: 'bg-white border-t border-gray-200 shadow-sm py-1',
    floating: 'bg-white/90 border border-gray-200 rounded-lg shadow-lg m-4 backdrop-blur-md',
  };

  if (!isVisible && autoHide) {
    return null;
  }

  return (
    <div
      className={cn(
        'w-full transition-all duration-300',
        positionClasses[position],
        variantClasses[variant],
        !isVisible && autoHide && 'opacity-0 transform translate-y-full',
        className
      )}
    >
      <div
        className={cn(
          'flex items-center justify-between px-4',
          variant === 'compact' ? 'py-1' : 'py-2'
        )}
      >
        {/* Left Section - System Status */}
        <div className='flex items-center space-x-4'>
          {/* Application Mode */}
          {applicationStatus && (
            <div className='flex items-center space-x-2'>
              <div
                className={cn(
                  'w-2 h-2 rounded-full',
                  applicationStatus.mode === 'production'
                    ? 'bg-green-500'
                    : applicationStatus.mode === 'staging'
                      ? 'bg-yellow-500'
                      : 'bg-blue-500'
                )}
              />
              <span
                className={cn(
                  'text-xs font-medium uppercase',
                  variant === 'cyber' ? 'text-cyan-400' : 'text-gray-600'
                )}
              >
                {applicationStatus.mode}
              </span>
            </div>
          )}

          {/* Status Items */}
          <div className='flex items-center space-x-3'>
            {allItems.map(item => (
              <div
                key={item.id}
                className={cn(
                  'flex items-center space-x-1 transition-all duration-200',
                  item.clickable && 'cursor-pointer hover:opacity-80',
                  animateUpdates && 'animate-fade-in'
                )}
                onClick={() => item.clickable && onItemClick?.(item)}
                onMouseEnter={() => setHoveredItem(item.id)}
                onMouseLeave={() => setHoveredItem(null)}
                title={item.tooltip}
              >
                {/* Icon */}
                {item.icon && <span className='text-sm'>{item.icon}</span>}

                {/* Status Indicator */}
                <span
                  className={cn(
                    'text-xs',
                    getStatusColor(item.status, variant),
                    item.status === 'loading' && 'animate-spin'
                  )}
                >
                  {getStatusIcon(item.status)}
                </span>

                {/* Label and Value */}
                <span
                  className={cn('text-xs', variant === 'cyber' ? 'text-cyan-300' : 'text-gray-700')}
                >
                  {variant !== 'compact' && `${item.label}: `}
                  {item.value}
                  {item.unit}
                </span>

                {/* Trend Indicator */}
                {item.trend && (
                  <span
                    className={cn(
                      'text-xs',
                      item.trend === 'up'
                        ? 'text-green-500'
                        : item.trend === 'down'
                          ? 'text-red-500'
                          : 'text-gray-500'
                    )}
                  >
                    {item.trend === 'up' ? '↗' : item.trend === 'down' ? '↘' : '→'}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Center Section - Maintenance Notice */}
        {applicationStatus?.maintenance.scheduled && (
          <div
            className={cn(
              'flex items-center space-x-2 px-3 py-1 rounded animate-pulse',
              variant === 'cyber'
                ? 'bg-yellow-500/20 border border-yellow-500/30 text-yellow-300'
                : 'bg-yellow-100 border border-yellow-200 text-yellow-800'
            )}
          >
            <span>🔧</span>
            <span className='text-xs font-medium'>
              {applicationStatus.maintenance.message || 'Maintenance scheduled'}
            </span>
          </div>
        )}

        {/* Right Section - Clock & System Info */}
        <div className='flex items-center space-x-4'>
          {/* Uptime */}
          {applicationStatus && variant !== 'compact' && (
            <div
              className={cn('text-xs', variant === 'cyber' ? 'text-cyan-400/70' : 'text-gray-500')}
            >
              Uptime: {formatUptime(applicationStatus.uptime)}
            </div>
          )}

          {/* Data Freshness */}
          {systemMetrics && showMetrics && (
            <div
              className={cn(
                'text-xs flex items-center space-x-1',
                systemMetrics.dataFreshness > 60
                  ? 'text-yellow-500'
                  : systemMetrics.dataFreshness > 300
                    ? 'text-red-500'
                    : variant === 'cyber'
                      ? 'text-cyan-400/70'
                      : 'text-gray-500'
              )}
            >
              <span>📊</span>
              <span>{systemMetrics.dataFreshness}s</span>
            </div>
          )}

          {/* Clock */}
          {showClock && (
            <div
              className={cn(
                'text-sm font-mono',
                variant === 'cyber' ? 'text-cyan-300' : 'text-gray-900'
              )}
            >
              {currentTime}
            </div>
          )}

          {/* Feature Status */}
          {applicationStatus && variant !== 'compact' && (
            <div className='flex items-center space-x-1'>
              {Object.entries(applicationStatus.features).map(([feature, enabled]) => (
                <div
                  key={feature}
                  className={cn('w-2 h-2 rounded-full', enabled ? 'bg-green-500' : 'bg-gray-400')}
                  title={`${feature}: ${enabled ? 'enabled' : 'disabled'}`}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Hover Tooltip */}
      {hoveredItem && (
        <div
          className={cn(
            'absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2',
            'px-2 py-1 text-xs rounded shadow-lg pointer-events-none',
            variant === 'cyber'
              ? 'bg-slate-800 border border-cyan-500/30 text-cyan-300'
              : 'bg-gray-900 text-white'
          )}
        >
          {allItems.find(item => item.id === hoveredItem)?.tooltip}
        </div>
      )}

      {/* Cyber Effects */}
      {variant === 'cyber' && (
        <>
          <div className='absolute inset-0 bg-gradient-to-r from-cyan-500/5 to-purple-500/5 pointer-events-none' />
          <div className='absolute inset-0 bg-grid-white/[0.02] pointer-events-none' />
        </>
      )}
    </div>
  );
};

// Pre-built status items for common use cases
export const createCommonStatusItems = (): StatusItem[] => [
  {
    id: 'sync-status',
    label: 'Sync',
    value: 'Connected',
    icon: '🔄',
    status: 'success',
    priority: 9,
    category: 'data',
    tooltip: 'Data synchronization active',
  },
  {
    id: 'betting-engine',
    label: 'Betting',
    value: 'Active',
    icon: '🎯',
    status: 'success',
    priority: 8,
    category: 'betting',
    tooltip: 'Betting engine operational',
  },
  {
    id: 'ai-models',
    label: 'AI',
    value: 'Running',
    icon: '🤖',
    status: 'success',
    priority: 7,
    category: 'system',
    tooltip: 'AI prediction models running',
  },
  {
    id: 'notifications',
    label: 'Alerts',
    value: 'On',
    icon: '🔔',
    status: 'success',
    priority: 6,
    category: 'system',
    tooltip: 'Notification system enabled',
  },
];
