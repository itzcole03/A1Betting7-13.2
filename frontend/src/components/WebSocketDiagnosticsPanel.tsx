/**
 * WebSocket Diagnostics Panel
 * 
 * Manual reconnect control and WebSocket debugging interface.
 * Visible in development or when ?wsDebug=1 query parameter is present.
 */

import React from 'react';
import { useWebSocketConnection } from '../websocket/useWebSocketConnection';
import { useMetrics } from '../store/metricsStore';

interface WebSocketDiagnosticsPanelProps {
  /** Override visibility (for testing) */
  forceVisible?: boolean;
}

export function WebSocketDiagnosticsPanel({ forceVisible = false }: WebSocketDiagnosticsPanelProps) {
  const {
    state,
    isConnected,
    isConnecting,
    isFallback,
    attemptCount,
    lastError,
    nextRetryEta,
    fallbackReason,
    connectionUptime,
    forceReconnect,
    connect,
    disconnect
  } = useWebSocketConnection();
  
  const { connected: metricsConnected, isRealTime } = useMetrics();

  // Show panel only in development or with debug flag
  const shouldShow = forceVisible || 
    import.meta.env.DEV || 
    new URLSearchParams(window.location.search).get('wsDebug') === '1';

  if (!shouldShow) {
    return null;
  }

  const getStatusColor = () => {
    if (isConnected) return 'text-green-400';
    if (isConnecting) return 'text-yellow-400';
    if (isFallback) return 'text-red-400';
    return 'text-gray-400';
  };

  const getStatusText = () => {
    if (isConnected) return 'Connected';
    if (isConnecting) return 'Connecting...';
    if (isFallback) return 'Fallback Mode';
    return state.phase || 'Idle';
  };

  const formatUptime = (uptimeMs: number) => {
    if (uptimeMs < 1000) return `${uptimeMs}ms`;
    const seconds = Math.floor(uptimeMs / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ${seconds % 60}s`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ${minutes % 60}m`;
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-gray-800 border border-gray-600 rounded-lg p-4 text-sm font-mono text-white shadow-xl max-w-sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-semibold text-gray-300">WebSocket Debug</h3>
        <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-400 animate-pulse' : 'bg-gray-600'}`}></div>
      </div>
      
      {/* Connection Status */}
      <div className="space-y-2 mb-4">
        <div className="flex justify-between">
          <span className="text-gray-400">Status:</span>
          <span className={getStatusColor()}>{getStatusText()}</span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-gray-400">Phase:</span>
          <span className="text-white">{state.phase}</span>
        </div>
        
        {isConnected && (
          <div className="flex justify-between">
            <span className="text-gray-400">Uptime:</span>
            <span className="text-white">{formatUptime(connectionUptime)}</span>
          </div>
        )}
        
        <div className="flex justify-between">
          <span className="text-gray-400">Attempts:</span>
          <span className="text-white">{attemptCount}</span>
        </div>
        
        {lastError && (
          <div className="flex justify-between">
            <span className="text-gray-400">Last Error:</span>
            <span className="text-red-400 truncate ml-2" title={lastError.message}>
              {lastError.message.substring(0, 20)}...
            </span>
          </div>
        )}
        
        {nextRetryEta && (
          <div className="flex justify-between">
            <span className="text-gray-400">Next Retry:</span>
            <span className="text-yellow-400">
              {Math.max(0, Math.ceil((nextRetryEta.getTime() - Date.now()) / 1000))}s
            </span>
          </div>
        )}
        
        {isFallback && fallbackReason && (
          <div className="mt-2 p-2 bg-red-900/20 border border-red-600/30 rounded">
            <div className="text-xs text-red-300">Fallback Reason:</div>
            <div className="text-xs text-red-400 mt-1">{fallbackReason}</div>
          </div>
        )}
      </div>
      
      {/* Metrics Status */}
      <div className="border-t border-gray-600 pt-3 mb-4">
        <div className="text-xs font-semibold text-gray-300 mb-2">Metrics Status</div>
        <div className="flex justify-between">
          <span className="text-gray-400">Connected:</span>
          <span className={metricsConnected ? 'text-green-400' : 'text-red-400'}>
            {metricsConnected ? 'Yes' : 'No'}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Real-time:</span>
          <span className={isRealTime ? 'text-green-400' : 'text-yellow-400'}>
            {isRealTime ? 'Yes' : 'No'}
          </span>
        </div>
      </div>
      
      {/* Control Buttons */}
      <div className="space-y-2">
        {!isConnected && !isConnecting && (
          <button
            onClick={connect}
            className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-3 rounded text-xs font-medium transition-colors"
          >
            Connect
          </button>
        )}
        
        {isConnected && (
          <button
            onClick={disconnect}
            className="w-full bg-red-600 hover:bg-red-700 text-white py-2 px-3 rounded text-xs font-medium transition-colors"
          >
            Disconnect
          </button>
        )}
        
        <button
          onClick={forceReconnect}
          disabled={isConnecting}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white py-2 px-3 rounded text-xs font-medium transition-colors"
        >
          {isConnecting ? 'Connecting...' : 'Force Reconnect'}
        </button>
        
        {isFallback && (
          <button
            onClick={() => {
              // Try to exit fallback mode by forcing reconnect
              forceReconnect();
            }}
            className="w-full bg-yellow-600 hover:bg-yellow-700 text-white py-2 px-3 rounded text-xs font-medium transition-colors"
          >
            Exit Fallback
          </button>
        )}
      </div>
      
      {/* URL Display */}
      <div className="border-t border-gray-600 pt-3 mt-4">
        <div className="text-xs text-gray-400 mb-1">URL:</div>
        <div className="text-xs text-gray-300 break-all bg-gray-700 p-2 rounded">
          {state.url}
        </div>
      </div>
    </div>
  );
}

/**
 * Hook to conditionally show the diagnostics panel
 */
export function useWebSocketDebug() {
  const isDev = import.meta.env.DEV;
  const hasDebugFlag = new URLSearchParams(window.location.search).get('wsDebug') === '1';
  
  return {
    shouldShowDebug: isDev || hasDebugFlag,
    debugUrl: hasDebugFlag ? window.location.href : `${window.location.href}${window.location.search ? '&' : '?'}wsDebug=1`
  };
}