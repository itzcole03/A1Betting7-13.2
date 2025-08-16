/**
 * RealtimeStatusBanner Component
 * Shows "Realtime Disconnected – Operating in Local Mode" when fallback is active or no WebSocket
 * Pulsing warning icon, dismissible, but reappears if state changes
 */

import React, { useState, useEffect } from 'react';
import { AlertTriangle, X, Wifi, WifiOff } from 'lucide-react';

interface RealtimeStatus {
  isConnected: boolean;
  isFallbackActive: boolean;
  consecutiveFailures: number;
  lastConnectionTime: number | null;
  connectionType: 'websocket' | 'sse' | 'offline';
}

interface RealtimeStatusBannerProps {
  status: RealtimeStatus;
  onRetryConnection?: () => void;
  className?: string;
}

const RealtimeStatusBanner: React.FC<RealtimeStatusBannerProps> = ({
  status,
  onRetryConnection,
  className = ''
}) => {
  const [isDismissed, setIsDismissed] = useState(false);
  const [lastStatusHash, setLastStatusHash] = useState<string>('');

  // Create a hash of the status to detect changes
  const createStatusHash = (status: RealtimeStatus): string => {
    return JSON.stringify({
      isConnected: status.isConnected,
      isFallbackActive: status.isFallbackActive,
      connectionType: status.connectionType
    });
  };

  // Check if banner should be shown
  const shouldShowBanner = !status.isConnected || status.isFallbackActive;

  useEffect(() => {
    const currentHash = createStatusHash(status);
    
    // If status changed and banner should be shown, reset dismissed state
    if (currentHash !== lastStatusHash && shouldShowBanner) {
      setIsDismissed(false);
    }
    
    setLastStatusHash(currentHash);
  }, [status, shouldShowBanner, lastStatusHash]);

  const handleDismiss = () => {
    setIsDismissed(true);
  };

  const handleRetry = () => {
    if (onRetryConnection) {
      onRetryConnection();
    }
  };

  // Don't render if banner shouldn't be shown or is dismissed
  if (!shouldShowBanner || isDismissed) {
    return null;
  }

  const getBannerContent = () => {
    if (status.isFallbackActive) {
      return {
        title: 'Realtime Disconnected – Operating in Local Mode',
        subtitle: `Using fallback connection (${status.consecutiveFailures} WebSocket failures)`,
        icon: WifiOff,
        iconColor: 'text-amber-500',
        bgColor: 'bg-amber-50 border-amber-200',
        textColor: 'text-amber-800'
      };
    } else if (!status.isConnected) {
      return {
        title: 'Realtime Disconnected – Operating in Local Mode',
        subtitle: 'Live updates temporarily unavailable',
        icon: WifiOff,
        iconColor: 'text-red-500',
        bgColor: 'bg-red-50 border-red-200',
        textColor: 'text-red-800'
      };
    } else {
      // This shouldn't happen based on shouldShowBanner logic
      return {
        title: 'Connection Status Unknown',
        subtitle: 'Checking connection...',
        icon: AlertTriangle,
        iconColor: 'text-gray-500',
        bgColor: 'bg-gray-50 border-gray-200',
        textColor: 'text-gray-800'
      };
    }
  };

  const bannerContent = getBannerContent();
  const IconComponent = bannerContent.icon;

  return (
    <div 
      className={`
        fixed top-0 left-0 right-0 z-50 
        ${bannerContent.bgColor} 
        border-b 
        px-4 py-3 
        ${className}
      `}
      role="alert"
      aria-live="polite"
    >
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center space-x-3">
          {/* Pulsing Icon */}
          <div className="relative">
            <IconComponent 
              className={`
                w-5 h-5 ${bannerContent.iconColor}
                ${status.isFallbackActive ? 'animate-pulse' : ''}
              `} 
            />
            {/* Additional pulse ring for emphasis */}
            {status.isFallbackActive && (
              <div className="absolute -top-1 -left-1 w-7 h-7 bg-amber-400 rounded-full opacity-20 animate-ping"></div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1">
            <div className={`font-medium text-sm ${bannerContent.textColor}`}>
              {bannerContent.title}
            </div>
            <div className={`text-xs mt-0.5 ${bannerContent.textColor} opacity-75`}>
              {bannerContent.subtitle}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-2 ml-4">
          {/* Connection Status Indicator */}
          <div className="flex items-center space-x-2 text-xs">
            <div className="flex items-center space-x-1">
              {status.connectionType === 'websocket' && (
                <Wifi className="w-3 h-3 text-green-500" />
              )}
              {status.connectionType === 'sse' && (
                <div className="w-3 h-3 bg-amber-500 rounded-full animate-pulse"></div>
              )}
              {status.connectionType === 'offline' && (
                <WifiOff className="w-3 h-3 text-red-500" />
              )}
              <span className={`${bannerContent.textColor} opacity-75`}>
                {status.connectionType.toUpperCase()}
              </span>
            </div>
          </div>

          {/* Retry Button */}
          {onRetryConnection && (
            <button
              onClick={handleRetry}
              className={`
                px-3 py-1 text-xs font-medium rounded-md
                ${bannerContent.textColor}
                bg-white bg-opacity-50
                hover:bg-opacity-75
                transition-colors duration-200
                border border-current border-opacity-25
              `}
              aria-label="Retry connection"
            >
              Retry
            </button>
          )}

          {/* Dismiss Button */}
          <button
            onClick={handleDismiss}
            className={`
              p-1 rounded-md 
              ${bannerContent.textColor} 
              hover:bg-white hover:bg-opacity-25
              transition-colors duration-200
            `}
            aria-label="Dismiss notification"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

/**
 * Hook to manage realtime status banner state
 */
export const useRealtimeStatusBanner = () => {
  const [status, setStatus] = useState<RealtimeStatus>({
    isConnected: false,
    isFallbackActive: false,
    consecutiveFailures: 0,
    lastConnectionTime: null,
    connectionType: 'offline'
  });

  const updateStatus = (newStatus: Partial<RealtimeStatus>) => {
    setStatus(prevStatus => ({
      ...prevStatus,
      ...newStatus,
      lastConnectionTime: newStatus.isConnected ? Date.now() : prevStatus.lastConnectionTime
    }));
  };

  const reportWebSocketSuccess = () => {
    updateStatus({
      isConnected: true,
      isFallbackActive: false,
      consecutiveFailures: 0,
      connectionType: 'websocket'
    });
  };

  const reportWebSocketFailure = (consecutiveFailures: number) => {
    updateStatus({
      isConnected: false,
      consecutiveFailures,
      connectionType: consecutiveFailures >= 3 ? 'sse' : 'offline'
    });
  };

  const reportFallbackActivated = () => {
    updateStatus({
      isConnected: false,
      isFallbackActive: true,
      connectionType: 'sse'
    });
  };

  const reportFallbackDeactivated = () => {
    updateStatus({
      isFallbackActive: false
    });
  };

  return {
    status,
    updateStatus,
    reportWebSocketSuccess,
    reportWebSocketFailure,
    reportFallbackActivated,
    reportFallbackDeactivated
  };
};

/**
 * Example usage component
 */
export const RealtimeStatusExample: React.FC = () => {
  const {
    status,
    reportWebSocketSuccess,
    reportWebSocketFailure,
    reportFallbackActivated,
    reportFallbackDeactivated
  } = useRealtimeStatusBanner();

  const handleRetryConnection = async () => {
    console.log('Retrying connection...');
    // Simulate connection attempt
    setTimeout(() => {
      reportWebSocketSuccess();
    }, 2000);
  };

  // Example of simulating different states for testing
  const simulateStates = () => {
    // Simulate WebSocket failures
    setTimeout(() => reportWebSocketFailure(1), 1000);
    setTimeout(() => reportWebSocketFailure(2), 2000);
    setTimeout(() => reportWebSocketFailure(3), 3000);
    setTimeout(() => reportFallbackActivated(), 3500);
    
    // Simulate recovery
    setTimeout(() => reportWebSocketSuccess(), 8000);
    setTimeout(() => reportFallbackDeactivated(), 8500);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Banner will appear at top when status changes */}
      <RealtimeStatusBanner 
        status={status}
        onRetryConnection={handleRetryConnection}
      />
      
      {/* Main content with top padding to account for banner */}
      <div className="pt-16 p-8">
        <h1 className="text-2xl font-bold mb-6">Realtime Status Banner Demo</h1>
        
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-lg shadow">
            <h2 className="font-semibold mb-2">Current Status:</h2>
            <pre className="text-sm bg-gray-100 p-2 rounded">
              {JSON.stringify(status, null, 2)}
            </pre>
          </div>

          <div className="bg-white p-4 rounded-lg shadow">
            <h2 className="font-semibold mb-3">Test Controls:</h2>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => reportWebSocketFailure(1)}
                className="px-3 py-1 bg-red-500 text-white rounded text-sm"
              >
                WS Failure (1)
              </button>
              <button
                onClick={() => reportWebSocketFailure(3)}
                className="px-3 py-1 bg-red-600 text-white rounded text-sm"
              >
                WS Failure (3)
              </button>
              <button
                onClick={reportFallbackActivated}
                className="px-3 py-1 bg-amber-500 text-white rounded text-sm"
              >
                Activate Fallback
              </button>
              <button
                onClick={reportWebSocketSuccess}
                className="px-3 py-1 bg-green-500 text-white rounded text-sm"
              >
                WS Success
              </button>
              <button
                onClick={reportFallbackDeactivated}
                className="px-3 py-1 bg-blue-500 text-white rounded text-sm"
              >
                Deactivate Fallback
              </button>
              <button
                onClick={simulateStates}
                className="px-3 py-1 bg-purple-500 text-white rounded text-sm"
              >
                Simulate Sequence
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RealtimeStatusBanner;
export type { RealtimeStatus };