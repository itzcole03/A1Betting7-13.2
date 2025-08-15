import React from 'react';
import { useHealthStatus, type ComponentHealth } from './useHealthStatus';

/**
 * Props for HealthBadge component
 */
export interface HealthBadgeProps {
  /** Whether to show detailed component status (default: false) */
  showDetails?: boolean;
  /** Custom polling interval in milliseconds */
  pollInterval?: number;
  /** Custom CSS classes for styling */
  className?: string;
  /** Whether to show uptime (default: true) */
  showUptime?: boolean;
  /** Whether to show last checked timestamp (default: false) */
  showLastChecked?: boolean;
}

/**
 * Get color class for health status
 */
const getHealthStatusColor = (status: string): string => {
  switch (status) {
    case 'ok':
      return 'bg-green-500 text-white';
    case 'degraded':
      return 'bg-yellow-500 text-black';
    case 'unhealthy':
      return 'bg-red-500 text-white';
    default:
      return 'bg-gray-500 text-white';
  }
};

/**
 * Get color class for component health status
 */
const getComponentStatusColor = (status: string): string => {
  switch (status) {
    case 'up':
      return 'text-green-600';
    case 'degraded':
      return 'text-yellow-600';
    case 'down':
      return 'text-red-600';
    default:
      return 'text-gray-500';
  }
};

/**
 * Get status icon for health status
 */
const getHealthStatusIcon = (status: string): string => {
  switch (status) {
    case 'ok':
      return '✅';
    case 'degraded':
      return '⚠️';
    case 'unhealthy':
      return '❌';
    default:
      return '❓';
  }
};

/**
 * Get component status icon
 */
const getComponentStatusIcon = (status: string): string => {
  switch (status) {
    case 'up':
      return '🟢';
    case 'degraded':
      return '🟡';
    case 'down':
      return '🔴';
    default:
      return '⚪';
  }
};

/**
 * Format uptime in human readable format
 */
const formatUptime = (uptimeSeconds: number): string => {
  if (uptimeSeconds < 60) {
    return `${Math.round(uptimeSeconds)}s`;
  } else if (uptimeSeconds < 3600) {
    return `${Math.round(uptimeSeconds / 60)}m`;
  } else if (uptimeSeconds < 86400) {
    const hours = Math.round(uptimeSeconds / 3600);
    return `${hours}h`;
  } else {
    const days = Math.round(uptimeSeconds / 86400);
    return `${days}d`;
  }
};

/**
 * Format timestamp for display
 */
const formatTimestamp = (timestamp: Date): string => {
  return timestamp.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
};

/**
 * Component status detail item
 */
const ComponentStatusItem: React.FC<{ name: string; health: ComponentHealth }> = ({ 
  name, 
  health 
}) => (
  <div className="flex items-center justify-between py-1 px-2 text-sm">
    <span className="flex items-center gap-1">
      <span>{getComponentStatusIcon(health.status)}</span>
      <span className="capitalize">{name.replace('_', ' ')}</span>
    </span>
    <span className={`font-medium ${getComponentStatusColor(health.status)}`}>
      {health.status}
      {health.response_time_ms && (
        <span className="ml-1 text-xs text-gray-500">
          ({Math.round(health.response_time_ms)}ms)
        </span>
      )}
    </span>
  </div>
);

/**
 * Lightweight health status badge component
 * 
 * Displays system health information in a compact badge format with optional detailed view
 */
export const HealthBadge: React.FC<HealthBadgeProps> = ({
  showDetails = false,
  pollInterval = 60000,
  className = '',
  showUptime = true,
  showLastChecked = false
}) => {
  const { data, loading, error, lastChecked } = useHealthStatus({ pollInterval });

  // Loading state
  if (loading && !data) {
    return (
      <div className={`inline-flex items-center px-2 py-1 rounded text-sm bg-gray-100 text-gray-600 ${className}`}>
        <span className="animate-pulse">Health: ⏳</span>
      </div>
    );
  }

  // Error state
  if (error && !data) {
    return (
      <div 
        className={`inline-flex items-center px-2 py-1 rounded text-sm bg-red-100 text-red-700 cursor-help ${className}`}
        title={`Health check failed: ${error.message}`}
      >
        <span>Health: ❌ Error</span>
      </div>
    );
  }

  // No data state
  if (!data) {
    return (
      <div className={`inline-flex items-center px-2 py-1 rounded text-sm bg-gray-100 text-gray-600 ${className}`}>
        <span>Health: ❓ Unknown</span>
      </div>
    );
  }

  const healthColor = getHealthStatusColor(data.status);
  const healthIcon = getHealthStatusIcon(data.status);
  const componentCount = Object.keys(data.components).length;
  const upCount = Object.values(data.components).filter(c => c.status === 'up').length;
  const degradedCount = Object.values(data.components).filter(c => c.status === 'degraded').length;
  const downCount = Object.values(data.components).filter(c => c.status === 'down').length;

  if (showDetails) {
    return (
      <div className={`inline-block bg-white border border-gray-200 rounded-lg shadow-sm ${className}`}>
        {/* Header */}
        <div className={`px-3 py-2 rounded-t-lg ${healthColor}`}>
          <div className="flex items-center justify-between">
            <span className="font-medium flex items-center gap-1">
              <span>{healthIcon}</span>
              System Health: {data.status.toUpperCase()}
            </span>
            {showUptime && (
              <span className="text-sm opacity-90">
                ⏱️ {formatUptime(data.uptime_seconds)}
              </span>
            )}
          </div>
        </div>

        {/* Component Details */}
        {componentCount > 0 && (
          <div className="px-2 py-2 border-t border-gray-100">
            <div className="text-xs text-gray-500 mb-2 px-1">
              Components: {upCount} up, {degradedCount} degraded, {downCount} down
            </div>
            <div className="space-y-1">
              {Object.entries(data.components).map(([name, health]) => (
                <ComponentStatusItem key={name} name={name} health={health} />
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="px-3 py-2 bg-gray-50 rounded-b-lg border-t border-gray-100 text-xs text-gray-500">
          <div className="flex items-center justify-between">
            <span>Version: {data.version}</span>
            {showLastChecked && lastChecked && (
              <span>Last checked: {formatTimestamp(lastChecked)}</span>
            )}
          </div>
          {data.build_info?.deprecated && (
            <div className="mt-1 text-yellow-600">
              ⚠️ Using deprecated health endpoint
            </div>
          )}
        </div>
      </div>
    );
  }

  // Compact view
  return (
    <div 
      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${healthColor} ${className}`}
      title={`System Health: ${data.status} | Uptime: ${formatUptime(data.uptime_seconds)} | Components: ${upCount}/${componentCount} healthy`}
    >
      <span className="flex items-center gap-1">
        <span>{healthIcon}</span>
        <span>Health: {data.status}</span>
        {showUptime && (
          <>
            <span className="opacity-70">|</span>
            <span className="opacity-90">{formatUptime(data.uptime_seconds)}</span>
          </>
        )}
      </span>
      {error && (
        <span className="ml-2 opacity-75" title={error.message}>
          ⚠️
        </span>
      )}
    </div>
  );
};

export default HealthBadge;