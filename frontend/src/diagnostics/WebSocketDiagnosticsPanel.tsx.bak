/**
 * WebSocket Diagnostics Panel
 * 
 * Development-only component for real-time WebSocket connection introspection.
 * Shows connection state, statistics, recent attempts, and allows manual control.
 * 
 * Activation:
 * - URL param: ?wsDebug=1
 * - Global flag: window.__A1_WS_DEBUG = true
 * - Keyboard shortcut: Ctrl+Shift+W (in development)
 */

import React, { useState, useEffect } from 'react';
import { useWebSocketConnection } from '../websocket/useWebSocketConnection';
import { WSConnectionPhase } from '../websocket/ConnectionState';

interface DiagnosticsPanelProps {
  className?: string;
}

export const WebSocketDiagnosticsPanel: React.FC<DiagnosticsPanelProps> = ({ 
  className = '' 
}) => {
  const {
    state,
    isConnected,
    isConnecting,
    isFallback,
    connect,
    disconnect,
    reconnect,
    ping,
    messageStats,
    connectionUptime,
    fallbackReason,
    nextRetryEta
  } = useWebSocketConnection();
  
  const [isExpanded, setIsExpanded] = useState(true);
  const [updateCount, setUpdateCount] = useState(0);
  
  // Auto-refresh every 1 second for live data
  useEffect(() => {
    const interval = setInterval(() => {
      setUpdateCount(prev => prev + 1);
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);
  
  // Format uptime as human readable
  const formatUptime = (ms: number): string => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${Math.floor(ms / 1000)}s`;
    if (ms < 3600000) return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`;
    return `${Math.floor(ms / 3600000)}h ${Math.floor((ms % 3600000) / 60000)}m`;
  };
  
  // Format next retry ETA
  const formatRetryEta = (eta: Date | null): string => {
    if (!eta) return 'N/A';
    const now = new Date();
    const diff = eta.getTime() - now.getTime();
    if (diff <= 0) return 'Now';
    return `${Math.ceil(diff / 1000)}s`;
  };
  
  // Get phase badge color
  const getPhaseColor = (phase: WSConnectionPhase): string => {
    switch (phase) {
      case 'idle': return 'bg-gray-100 text-gray-800';
      case 'connecting': return 'bg-blue-100 text-blue-800';
      case 'open': return 'bg-green-100 text-green-800';
      case 'degraded': return 'bg-yellow-100 text-yellow-800';
      case 'reconnecting': return 'bg-orange-100 text-orange-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'fallback': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  
  // Get classification badge color  
  const getClassificationColor = (classification: string): string => {
    switch (classification) {
      case 'network': return 'bg-blue-100 text-blue-700';
      case 'handshake': return 'bg-yellow-100 text-yellow-700';
      case 'server_error': return 'bg-red-100 text-red-700';
      case 'abnormal': return 'bg-purple-100 text-purple-700';
      case 'timeout': return 'bg-orange-100 text-orange-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };
  
  if (!isExpanded) {
    return (
      <div className={`fixed top-4 right-4 z-50 ${className}`}>
        <button
          onClick={() => setIsExpanded(true)}
          className="bg-gray-900 text-white px-3 py-2 rounded-md text-sm hover:bg-gray-800"
          title="Show WebSocket Diagnostics"
        >
          WS Debug
        </button>
      </div>
    );
  }
  
  return (
    <div className={`fixed top-4 right-4 z-50 bg-white shadow-lg rounded-lg border p-4 max-w-md w-full ${className}`}>
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900">WebSocket Diagnostics</h3>
        <button
          onClick={() => setIsExpanded(false)}
          className="text-gray-400 hover:text-gray-600 text-xl"
          title="Minimize"
        >
          ×
        </button>
      </div>
      
      {/* Connection Status */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Status:</span>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPhaseColor(state.phase)}`}>
            {state.phase}
          </span>
        </div>
        
        <div className="text-sm text-gray-600 space-y-1">
          <div>URL: <code className="text-xs bg-gray-100 px-1 rounded">{state.url}</code></div>
          <div>Client ID: <code className="text-xs bg-gray-100 px-1 rounded">{state.client_id}</code></div>
          {isConnected && (
            <div>Uptime: <span className="font-mono">{formatUptime(connectionUptime)}</span></div>
          )}
          {nextRetryEta && (
            <div>Next retry: <span className="font-mono">{formatRetryEta(nextRetryEta)}</span></div>
          )}
        </div>
      </div>
      
      {/* Connection Controls */}
      <div className="mb-4">
        <div className="text-sm font-medium text-gray-700 mb-2">Controls:</div>
        <div className="flex gap-2">
          <button
            onClick={connect}
            disabled={isConnected || isConnecting}
            className="px-3 py-1 bg-blue-500 text-white rounded text-sm disabled:opacity-50"
          >
            Connect
          </button>
          <button
            onClick={disconnect}
            disabled={!isConnected && !isConnecting}
            className="px-3 py-1 bg-red-500 text-white rounded text-sm disabled:opacity-50"
          >
            Disconnect
          </button>
          <button
            onClick={reconnect}
            className="px-3 py-1 bg-orange-500 text-white rounded text-sm"
          >
            Force Reconnect
          </button>
          <button
            onClick={ping}
            disabled={!isConnected}
            className="px-3 py-1 bg-green-500 text-white rounded text-sm disabled:opacity-50"
          >
            Ping
          </button>
        </div>
      </div>
      
      {/* Statistics */}
      <div className="mb-4">
        <div className="text-sm font-medium text-gray-700 mb-2">Statistics:</div>
        <div className="text-sm text-gray-600 space-y-1">
          <div className="flex justify-between">
            <span>Total attempts:</span>
            <span className="font-mono">{state.stats.total_attempts}</span>
          </div>
          <div className="flex justify-between">
            <span>Successful:</span>
            <span className="font-mono">{state.stats.successful_connections}</span>
          </div>
          <div className="flex justify-between">
            <span>Messages sent:</span>
            <span className="font-mono">{state.stats.messages_sent}</span>
          </div>
          <div className="flex justify-between">
            <span>Messages received:</span>
            <span className="font-mono">{state.stats.messages_received}</span>
          </div>
          <div className="flex justify-between">
            <span>Heartbeats:</span>
            <span className="font-mono">{state.stats.heartbeats_sent}/{state.stats.heartbeats_received}</span>
          </div>
        </div>
      </div>
      
      {/* Message Types */}
      {Object.keys(messageStats).length > 0 && (
        <div className="mb-4">
          <div className="text-sm font-medium text-gray-700 mb-2">Message Types:</div>
          <div className="text-sm text-gray-600 space-y-1">
            {Object.entries(messageStats).map(([type, count]) => (
              <div key={type} className="flex justify-between">
                <span>{type}:</span>
                <span className="font-mono">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Recent Attempts */}
      {state.recent_attempts.length > 0 && (
        <div className="mb-4">
          <div className="text-sm font-medium text-gray-700 mb-2">Recent Attempts:</div>
          <div className="max-h-32 overflow-y-auto space-y-2">
            {state.recent_attempts.slice(0, 5).map((attempt, index) => (
              <div key={index} className="text-xs bg-gray-50 p-2 rounded">
                <div className="flex justify-between items-center">
                  <span className="font-mono">#{attempt.attempt}</span>
                  <span className={`px-1 py-0.5 rounded text-xs ${getClassificationColor(attempt.classification)}`}>
                    {attempt.classification}
                  </span>
                </div>
                <div className="text-gray-600 mt-1">
                  {attempt.timestamp.toLocaleTimeString()}
                </div>
                {attempt.close_code && (
                  <div className="text-gray-600">
                    Code: {attempt.close_code}
                    {attempt.close_reason && ` (${attempt.close_reason})`}
                  </div>
                )}
                {attempt.duration_ms && (
                  <div className="text-gray-600">
                    Duration: {attempt.duration_ms}ms
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Fallback Reason */}
      {isFallback && fallbackReason && (
        <div className="mb-4">
          <div className="text-sm font-medium text-gray-700 mb-2">Fallback Reason:</div>
          <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
            {fallbackReason}
          </div>
        </div>
      )}
      
      {/* Connection Features */}
      {state.connection_features.length > 0 && (
        <div className="mb-4">
          <div className="text-sm font-medium text-gray-700 mb-2">Server Features:</div>
          <div className="flex flex-wrap gap-1">
            {state.connection_features.map((feature) => (
              <span key={feature} className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                {feature}
              </span>
            ))}
          </div>
        </div>
      )}
      
      {/* Auto-refresh indicator */}
      <div className="text-xs text-gray-400 text-center">
        Auto-refresh: {updateCount} (every 1s)
      </div>
    </div>
  );
};

/**
 * Hook to determine if diagnostics panel should be shown
 */
export function useWebSocketDiagnostics(): boolean {
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  
  useEffect(() => {
    // Check URL parameter
    const urlParams = new URLSearchParams(window.location.search);
    const wsDebug = urlParams.get('wsDebug') === '1';
    
    // Check global flag
    const globalFlag = (window as never)['__A1_WS_DEBUG'] === true;
    
    // Only show in development or if explicitly enabled
    const shouldShow = (import.meta.env.DEV || wsDebug || globalFlag);
    setShowDiagnostics(shouldShow);
    
    // Add keyboard shortcut in development
    if (import.meta.env.DEV) {
      const handleKeyDown = (event: KeyboardEvent) => {
        if (event.ctrlKey && event.shiftKey && event.key === 'W') {
          event.preventDefault();
          setShowDiagnostics(prev => !prev);
        }
      };
      
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, []);
  
  return showDiagnostics;
}

/**
 * Convenience component that conditionally renders the diagnostics panel
 */
export const WebSocketDiagnosticsWrapper: React.FC = () => {
  const showDiagnostics = useWebSocketDiagnostics();
  
  if (!showDiagnostics) {
    return null;
  }
  
  return <WebSocketDiagnosticsPanel />;
};