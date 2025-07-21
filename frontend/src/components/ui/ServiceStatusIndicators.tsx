import React, { useState } from 'react';
// @ts-expect-error TS(2307): Cannot find module '@/lib/utils' or its correspond... Remove this comment to see the full error message
import { cn } from '@/lib/utils';

// Types for service monitoring
interface ServiceMetrics {
  uptime: number; // percentage
  responseTime: number; // ms
  requestsPerMinute: number;
  errorRate: number; // percentage
  lastChecked: Date;
}

interface ServiceStatus {
  id: string;
  name: string;
  description?: string;
  status: 'online' | 'offline' | 'degraded' | 'maintenance' | 'error' | 'warning';
  category: 'core' | 'data' | 'external' | 'monitoring' | 'storage';
  priority: 'critical' | 'high' | 'medium' | 'low';
  url?: string;
  metrics?: ServiceMetrics;
  dependencies?: string[];
  lastIncident?: Date;
  version?: string;
}

interface ServiceGroup {
  category: string;
  label: string;
  services: ServiceStatus[];
  collapsed?: boolean;
}

interface ServiceStatusIndicatorsProps {
  services: ServiceStatus[];
  variant?: 'default' | 'cyber' | 'compact' | 'detailed' | 'grid';
  layout?: 'list' | 'grid' | 'grouped';
  showMetrics?: boolean;
  showCategories?: boolean;
  autoRefresh?: boolean;
  refreshInterval?: number; // seconds
  className?: string;
  onServiceClick?: (service: ServiceStatus) => void;
  onRefresh?: () => void;
}

const getStatusColor = (status: string, variant: string = 'default') => {
  const colors = {
    default: {
      online: 'text-green-600 bg-green-100 border-green-200',
      offline: 'text-red-600 bg-red-100 border-red-200',
      degraded: 'text-yellow-600 bg-yellow-100 border-yellow-200',
      maintenance: 'text-blue-600 bg-blue-100 border-blue-200',
      error: 'text-red-600 bg-red-100 border-red-200',
      warning: 'text-orange-600 bg-orange-100 border-orange-200',
    },
    cyber: {
      online: 'text-green-300 bg-green-500/20 border-green-500/30 shadow-green-500/20',
      offline: 'text-red-300 bg-red-500/20 border-red-500/30 shadow-red-500/20',
      degraded: 'text-yellow-300 bg-yellow-500/20 border-yellow-500/30 shadow-yellow-500/20',
      maintenance: 'text-cyan-300 bg-cyan-500/20 border-cyan-500/30 shadow-cyan-500/20',
      error: 'text-red-300 bg-red-500/20 border-red-500/30 shadow-red-500/20',
      warning: 'text-orange-300 bg-orange-500/20 border-orange-500/30 shadow-orange-500/20',
    },
  };

  return variant === 'cyber'
    ? colors.cyber[status as keyof typeof colors.cyber] || colors.cyber.offline
    : colors.default[status as keyof typeof colors.default] || colors.default.offline;
};

const getStatusIcon = (status: string) => {
  const icons = {
    online: '●',
    offline: '●',
    degraded: '⚠',
    maintenance: '🔧',
    error: '❌',
    warning: '⚠️',
  };
  return icons[status as keyof typeof icons] || '?';
};

const getCategoryIcon = (category: string) => {
  const icons = {
    core: '🏗️',
    data: '📊',
    external: '🌐',
    monitoring: '📡',
    storage: '💾',
  };
  return icons[category as keyof typeof icons] || '⚙️';
};

const formatUptime = (uptime: number) => {
  return `${uptime.toFixed(2)}%`;
};

const formatResponseTime = (time: number) => {
  if (time < 1000) return `${time}ms`;
  return `${(time / 1000).toFixed(1)}s`;
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

export const ServiceStatusIndicators: React.FC<ServiceStatusIndicatorsProps> = ({
  services,
  variant = 'default',
  layout = 'list',
  showMetrics = false,
  showCategories = true,
  autoRefresh = false,
  refreshInterval = 30,
  className,
  onServiceClick,
  onRefresh,
}) => {
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const [lastRefresh, setLastRefresh] = useState(new Date());

  // Group services by category
  const groupedServices = showCategories
    ? services.reduce(
        (groups, service) => {
          if (!groups[service.category]) {
            groups[service.category] = [];
          }
          groups[service.category].push(service);
          return groups;
        },
        {} as Record<string, ServiceStatus[]>
      )
    : null;

  const toggleGroup = (category: string) => {
    const newCollapsed = new Set(collapsedGroups);
    if (newCollapsed.has(category)) {
      newCollapsed.delete(category);
    } else {
      newCollapsed.add(category);
    }
    setCollapsedGroups(newCollapsed);
  };

  const handleRefresh = () => {
    setLastRefresh(new Date());
    onRefresh?.();
  };

  // Auto refresh
  React.useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      handleRefresh();
    }, refreshInterval * 1000);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval]);

  const overallStatus =
    services.length > 0
      ? services.every(s => s.status === 'online')
        ? 'online'
        : services.some(s => s.status === 'offline' || s.status === 'error')
          ? 'error'
          : 'warning'
      : 'unknown';

  const variantClasses = {
    default: 'bg-white border border-gray-200 rounded-lg shadow-sm',
    cyber:
      'bg-slate-900/95 border border-cyan-500/30 rounded-lg shadow-2xl shadow-cyan-500/20 backdrop-blur-md',
    compact: 'bg-white border border-gray-200 rounded-md shadow-sm',
    detailed: 'bg-white border border-gray-300 rounded-xl shadow-lg',
    grid: 'bg-gray-50 rounded-lg',
  };

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
          <div className={cn('w-3 h-3 rounded-full', getStatusColor(overallStatus, variant))} />
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <h3
            className={cn('font-semibold', variant === 'cyber' ? 'text-cyan-300' : 'text-gray-900')}
          >
            Service Status
          </h3>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <span
            className={cn(
              'text-sm px-2 py-1 rounded-full',
              variant === 'cyber' ? 'bg-cyan-500/20 text-cyan-300' : 'bg-gray-100 text-gray-600'
            )}
          >
            {services.length} services
          </span>
        </div>

        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <div className='flex items-center space-x-2'>
          {autoRefresh && (
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <span
              className={cn('text-xs', variant === 'cyber' ? 'text-cyan-400/70' : 'text-gray-500')}
            >
              Last updated: {formatTimeAgo(lastRefresh)}
            </span>
          )}
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
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

      {/* Services */}
      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <div className='p-4'>
        {layout === 'grid' ? (
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
            {services.map(service => (
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <ServiceCard
                key={service.id}
                service={service}
                variant={variant}
                showMetrics={showMetrics}
                onClick={onServiceClick}
              />
            ))}
          </div>
        ) : showCategories && groupedServices ? (
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div className='space-y-4'>
            {Object.entries(groupedServices).map(([category, categoryServices]) => (
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <div key={category} className='space-y-2'>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <button
                  onClick={() => toggleGroup(category)}
                  className={cn(
                    'flex items-center justify-between w-full p-2 rounded transition-colors',
                    variant === 'cyber'
                      ? 'hover:bg-cyan-500/10 text-cyan-300'
                      : 'hover:bg-gray-50 text-gray-700'
                  )}
                >
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <div className='flex items-center space-x-2'>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <span>{getCategoryIcon(category)}</span>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <span className='font-medium capitalize'>{category}</span>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <span
                      className={cn(
                        'text-xs px-2 py-1 rounded-full',
                        variant === 'cyber' ? 'bg-cyan-500/20' : 'bg-gray-200'
                      )}
                    >
                      {categoryServices.length}
                    </span>
                  </div>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <span
                    className={cn(
                      'text-sm',
                      collapsedGroups.has(category) ? 'rotate-0' : 'rotate-90'
                    )}
                  >
                    ▶
                  </span>
                </button>

                {!collapsedGroups.has(category) && (
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <div className='space-y-2 ml-4'>
                    {categoryServices.map(service => (
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <ServiceItem
                        key={service.id}
                        service={service}
                        variant={variant}
                        showMetrics={showMetrics}
                        onClick={onServiceClick}
                      />
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div className='space-y-2'>
            {services.map(service => (
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <ServiceItem
                key={service.id}
                service={service}
                variant={variant}
                showMetrics={showMetrics}
                onClick={onServiceClick}
              />
            ))}
          </div>
        )}
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

// Individual service item component
interface ServiceItemProps {
  service: ServiceStatus;
  variant: string;
  showMetrics: boolean;
  onClick?: (service: ServiceStatus) => void;
}

const ServiceItem: React.FC<ServiceItemProps> = ({ service, variant, showMetrics, onClick }) => {
  return (
    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <div
      className={cn(
        'flex items-center justify-between p-3 rounded border transition-all duration-200',
        getStatusColor(service.status, variant),
        onClick && 'cursor-pointer hover:shadow-md'
      )}
      onClick={() => onClick?.(service)}
    >
      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <div className='flex items-center space-x-3'>
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <div className={cn('w-2 h-2 rounded-full', service.status === 'online' && 'animate-pulse')}>
          {getStatusIcon(service.status)}
        </div>

        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <div>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div className='flex items-center space-x-2'>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <span className='font-medium'>{service.name}</span>
            {service.priority === 'critical' && (
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
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
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          {service.description && <p className='text-xs opacity-70 mt-1'>{service.description}</p>}
        </div>
      </div>

      {showMetrics && service.metrics && (
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <div className='text-xs space-y-1 text-right'>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div>Uptime: {formatUptime(service.metrics.uptime)}</div>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div>Response: {formatResponseTime(service.metrics.responseTime)}</div>
        </div>
      )}
    </div>
  );
};

// Service card component for grid layout
interface ServiceCardProps {
  service: ServiceStatus;
  variant: string;
  showMetrics: boolean;
  onClick?: (service: ServiceStatus) => void;
}

const ServiceCard: React.FC<ServiceCardProps> = ({ service, variant, showMetrics, onClick }) => {
  return (
    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <div
      className={cn(
        'p-4 rounded-lg border transition-all duration-200',
        getStatusColor(service.status, variant),
        onClick && 'cursor-pointer hover:shadow-lg'
      )}
      onClick={() => onClick?.(service)}
    >
      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <div className='flex items-center justify-between mb-2'>
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <span className='font-medium'>{service.name}</span>
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <span className='text-lg'>{getStatusIcon(service.status)}</span>
      </div>

      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      {service.description && <p className='text-xs opacity-70 mb-3'>{service.description}</p>}

      {showMetrics && service.metrics && (
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <div className='grid grid-cols-2 gap-2 text-xs'>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div className='opacity-70'>Uptime</div>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div className='font-medium'>{formatUptime(service.metrics.uptime)}</div>
          </div>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div className='opacity-70'>Response</div>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div className='font-medium'>{formatResponseTime(service.metrics.responseTime)}</div>
          </div>
        </div>
      )}
    </div>
  );
};
