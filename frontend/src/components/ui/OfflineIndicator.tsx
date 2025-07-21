import React, { useState, useEffect, useRef } from 'react';
// @ts-expect-error TS(2307): Cannot find module '@/lib/utils' or its correspond... Remove this comment to see the full error message
import { cn } from '@/lib/utils';

// Types for offline indicator
interface NetworkStatus {
  isOnline: boolean;
  connectionType?: string;
  effectiveType?: string;
  downlink?: number;
  rtt?: number;
  saveData?: boolean;
}

interface OfflineData {
  pendingRequests: number;
  cachedItems: number;
  lastSyncTime?: Date;
  syncQueue: Array<{
    id: string;
    type: string;
    data: any;
    timestamp: Date;
  }>;
}

interface OfflineIndicatorProps {
  variant?: 'default' | 'cyber' | 'minimal' | 'toast' | 'banner';
  position?:
    | 'top-left'
    | 'top-right'
    | 'bottom-left'
    | 'bottom-right'
    | 'top-center'
    | 'bottom-center';
  showWhenOnline?: boolean;
  showNetworkInfo?: boolean;
  showSyncStatus?: boolean;
  showRetryButton?: boolean;
  autoHide?: boolean;
  hideDelay?: number; // seconds
  enableOfflineMode?: boolean;
  offlineData?: OfflineData;
  className?: string;
  onRetry?: () => void;
  onOfflineModeToggle?: (enabled: boolean) => void;
  onSyncRequest?: () => void;
}

const useNetworkStatus = () => {
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>({
    isOnline: navigator.onLine,
  });

  useEffect(() => {
    const updateNetworkStatus = () => {
      const status: NetworkStatus = {
        isOnline: navigator.onLine,
      };

      // Get network information if available
      if ('connection' in navigator) {
        const connection = (navigator as any).connection;
        status.connectionType = connection.type;
        status.effectiveType = connection.effectiveType;
        status.downlink = connection.downlink;
        status.rtt = connection.rtt;
        status.saveData = connection.saveData;
      }

      setNetworkStatus(status);
    };

    const handleOnline = () => updateNetworkStatus();
    const handleOffline = () => updateNetworkStatus();

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Listen for connection changes
    if ('connection' in navigator) {
      (navigator as any).connection.addEventListener('change', updateNetworkStatus);
    }

    // Initial check
    updateNetworkStatus();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if ('connection' in navigator) {
        (navigator as any).connection.removeEventListener('change', updateNetworkStatus);
      }
    };
  }, []);

  return networkStatus;
};

const formatConnectionSpeed = (downlink?: number, effectiveType?: string) => {
  if (downlink !== undefined) {
    if (downlink >= 10) return 'Fast';
    if (downlink >= 1.5) return 'Good';
    if (downlink >= 0.5) return 'Slow';
    return 'Very Slow';
  }

  if (effectiveType) {
    switch (effectiveType) {
      case '4g':
        return 'Fast';
      case '3g':
        return 'Good';
      case '2g':
        return 'Slow';
      case 'slow-2g':
        return 'Very Slow';
      default:
        return 'Unknown';
    }
  }

  return 'Unknown';
};

const formatLastSync = (date?: Date): string => {
  if (!date) return 'Never';

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return date.toLocaleDateString();
};

export const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({
  variant = 'default',
  position = 'top-right',
  showWhenOnline = false,
  showNetworkInfo = false,
  showSyncStatus = false,
  showRetryButton = true,
  autoHide = false,
  hideDelay = 5,
  enableOfflineMode = false,
  offlineData,
  className,
  onRetry,
  onOfflineModeToggle,
  onSyncRequest,
}) => {
  const networkStatus = useNetworkStatus();
  const [isVisible, setIsVisible] = useState(true);
  const [offlineModeEnabled, setOfflineModeEnabled] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const hideTimeoutRef = useRef<NodeJS.Timeout>();

  // Auto-hide functionality
  useEffect(() => {
    if (autoHide && networkStatus.isOnline) {
      hideTimeoutRef.current = setTimeout(() => {
        setIsVisible(false);
      }, hideDelay * 1000);
    } else {
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
      setIsVisible(true);
    }

    return () => {
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
    };
  }, [networkStatus.isOnline, autoHide, hideDelay]);

  // Don't show when online unless configured to
  if (networkStatus.isOnline && !showWhenOnline && !offlineModeEnabled) {
    return null;
  }

  if (!isVisible) {
    return null;
  }

  const handleOfflineModeToggle = () => {
    const newState = !offlineModeEnabled;
    setOfflineModeEnabled(newState);
    onOfflineModeToggle?.(newState);
  };

  const positionClasses = {
    'top-left': 'top-4 left-4',
    'top-right': 'top-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'top-center': 'top-4 left-1/2 transform -translate-x-1/2',
    'bottom-center': 'bottom-4 left-1/2 transform -translate-x-1/2',
  };

  const variantClasses = {
    default: 'bg-white border border-gray-200 rounded-lg shadow-lg',
    cyber:
      'bg-slate-900/95 border border-cyan-500/30 rounded-lg shadow-2xl shadow-cyan-500/20 backdrop-blur-md',
    minimal: 'bg-gray-800 text-white rounded-md shadow-md',
    toast: 'bg-gray-900 text-white rounded-lg shadow-xl',
    banner: 'bg-yellow-50 border-l-4 border-yellow-400 shadow-sm',
  };

  // Toast variant (simple notification)
  if (variant === 'toast') {
    return (
      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <div
        className={cn(
          'fixed z-50 px-4 py-3 max-w-sm',
          positionClasses[position],
          variantClasses[variant],
          className
        )}
      >
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <div className='flex items-center space-x-3'>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div
            className={cn(
              'w-3 h-3 rounded-full',
              networkStatus.isOnline ? 'bg-green-400 animate-pulse' : 'bg-red-400'
            )}
          />
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div className='flex-1'>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div className='font-medium'>
              {networkStatus.isOnline ? 'Back Online' : "You're Offline"}
            </div>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div className='text-sm opacity-80'>
              {networkStatus.isOnline ? 'Connection restored' : 'Some features may be limited'}
            </div>
          </div>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <button onClick={() => setIsVisible(false)} className='text-white/60 hover:text-white'>
            ✕
          </button>
        </div>
      </div>
    );
  }

  // Banner variant (full width)
  if (variant === 'banner') {
    return (
      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <div className={cn('fixed top-0 left-0 right-0 z-50', variantClasses[variant], className)}>
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <div className='max-w-7xl mx-auto px-4 py-3'>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div className='flex items-center justify-between'>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div className='flex items-center space-x-3'>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <div
                className={cn(
                  'w-4 h-4 rounded-full',
                  networkStatus.isOnline ? 'bg-green-500' : 'bg-red-500'
                )}
              />
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <div>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <span className='font-medium text-yellow-800'>
                  {networkStatus.isOnline ? 'Connection Restored' : "You're Currently Offline"}
                </span>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <span className='ml-2 text-sm text-yellow-700'>
                  {networkStatus.isOnline
                    ? 'All features are now available'
                    : 'Some features may not work properly'}
                </span>
              </div>
            </div>

            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div className='flex items-center space-x-2'>
              {!networkStatus.isOnline && showRetryButton && onRetry && (
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <button
                  onClick={onRetry}
                  className='px-3 py-1 bg-yellow-600 text-white rounded text-sm hover:bg-yellow-700 transition-colors'
                >
                  Retry Connection
                </button>
              )}
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <button
                onClick={() => setIsVisible(false)}
                className='text-yellow-600 hover:text-yellow-800'
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Default, cyber, and minimal variants
  return (
    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <div
      className={cn(
        'fixed z-50 max-w-sm',
        positionClasses[position],
        variantClasses[variant],
        className
      )}
    >
      {/* Main Content */}
      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <div className='p-4'>
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <div className='flex items-center justify-between'>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div className='flex items-center space-x-3'>
            {/* Status Indicator */}
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div
              className={cn(
                'relative w-4 h-4 rounded-full',
                networkStatus.isOnline ? 'bg-green-500' : 'bg-red-500'
              )}
            >
              {networkStatus.isOnline && (
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <div className='absolute inset-0 bg-green-500 rounded-full animate-ping opacity-75' />
              )}
            </div>

            {/* Status Text */}
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <div
                className={cn(
                  'font-medium',
                  variant === 'cyber' ? 'text-cyan-300' : 'text-gray-900'
                )}
              >
                {networkStatus.isOnline ? 'Online' : 'Offline'}
              </div>

              {showNetworkInfo && networkStatus.isOnline && (
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <div
                  className={cn(
                    'text-xs mt-0.5',
                    variant === 'cyber' ? 'text-cyan-400/70' : 'text-gray-600'
                  )}
                >
                  {formatConnectionSpeed(networkStatus.downlink, networkStatus.effectiveType)}
                  {networkStatus.connectionType && ` • ${networkStatus.connectionType}`}
                </div>
              )}

              {!networkStatus.isOnline && (
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <div
                  className={cn(
                    'text-xs mt-0.5',
                    variant === 'cyber' ? 'text-cyan-400/70' : 'text-gray-600'
                  )}
                >
                  Limited functionality
                </div>
              )}
            </div>
          </div>

          {/* Expand Button */}
          {(showSyncStatus || enableOfflineMode || showNetworkInfo) && (
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <button
              onClick={() => setExpanded(!expanded)}
              className={cn(
                'p-1 rounded transition-colors',
                variant === 'cyber'
                  ? 'text-cyan-400 hover:bg-cyan-500/10'
                  : 'text-gray-500 hover:bg-gray-100'
              )}
            >
              {expanded ? '▲' : '▼'}
            </button>
          )}
        </div>

        {/* Expanded Content */}
        {expanded && (
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div
            className={cn(
              'mt-4 pt-4 border-t space-y-3',
              variant === 'cyber' ? 'border-cyan-500/30' : 'border-gray-200'
            )}
          >
            {/* Network Details */}
            {showNetworkInfo && networkStatus.isOnline && (
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <div>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <div
                  className={cn(
                    'text-xs font-medium mb-2',
                    variant === 'cyber' ? 'text-cyan-300' : 'text-gray-700'
                  )}
                >
                  Connection Details
                </div>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <div
                  className={cn(
                    'text-xs space-y-1',
                    variant === 'cyber' ? 'text-cyan-400/70' : 'text-gray-600'
                  )}
                >
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  {networkStatus.downlink && <div>Speed: {networkStatus.downlink} Mbps</div>}
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  {networkStatus.rtt && <div>Latency: {networkStatus.rtt}ms</div>}
                  {networkStatus.effectiveType && (
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <div>Type: {networkStatus.effectiveType.toUpperCase()}</div>
                  )}
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  {networkStatus.saveData && <div className='text-yellow-600'>Data Saver: On</div>}
                </div>
              </div>
            )}

            {/* Sync Status */}
            {showSyncStatus && offlineData && (
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <div>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <div
                  className={cn(
                    'text-xs font-medium mb-2',
                    variant === 'cyber' ? 'text-cyan-300' : 'text-gray-700'
                  )}
                >
                  Sync Status
                </div>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <div
                  className={cn(
                    'text-xs space-y-1',
                    variant === 'cyber' ? 'text-cyan-400/70' : 'text-gray-600'
                  )}
                >
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <div>Last sync: {formatLastSync(offlineData.lastSyncTime)}</div>
                  {offlineData.pendingRequests > 0 && (
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <div>Pending: {offlineData.pendingRequests} requests</div>
                  )}
                  {offlineData.cachedItems > 0 && (
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <div>Cached: {offlineData.cachedItems} items</div>
                  )}
                  {offlineData.syncQueue.length > 0 && (
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <div>Queue: {offlineData.syncQueue.length} items</div>
                  )}
                </div>
              </div>
            )}

            {/* Offline Mode Toggle */}
            {enableOfflineMode && (
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <div>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <label className='flex items-center space-x-2 cursor-pointer'>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <input
                    type='checkbox'
                    checked={offlineModeEnabled}
                    onChange={handleOfflineModeToggle}
                    className='rounded'
                  />
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <span
                    className={cn(
                      'text-xs',
                      variant === 'cyber' ? 'text-cyan-300' : 'text-gray-700'
                    )}
                  >
                    Force offline mode
                  </span>
                </label>
              </div>
            )}

            {/* Action Buttons */}
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div className='flex space-x-2'>
              {!networkStatus.isOnline && showRetryButton && onRetry && (
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <button
                  onClick={onRetry}
                  className={cn(
                    'px-3 py-1 text-xs rounded transition-colors',
                    variant === 'cyber'
                      ? 'bg-cyan-500 text-black hover:bg-cyan-400'
                      : 'bg-blue-600 text-white hover:bg-blue-500'
                  )}
                >
                  Retry
                </button>
              )}

              {showSyncStatus && onSyncRequest && (
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <button
                  onClick={onSyncRequest}
                  disabled={!networkStatus.isOnline}
                  className={cn(
                    'px-3 py-1 text-xs rounded transition-colors',
                    networkStatus.isOnline
                      ? variant === 'cyber'
                        ? 'bg-green-500 text-black hover:bg-green-400'
                        : 'bg-green-600 text-white hover:bg-green-500'
                      : 'bg-gray-400 text-gray-200 cursor-not-allowed'
                  )}
                >
                  Sync Now
                </button>
              )}
            </div>
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
          {!networkStatus.isOnline && (
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <div className='absolute top-2 right-2 w-1 h-1 bg-red-400 rounded-full animate-ping' />
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <div className='absolute bottom-2 left-2 w-0.5 h-4 bg-gradient-to-t from-red-500/30 to-transparent' />
            </>
          )}
        </>
      )}
    </div>
  );
};
