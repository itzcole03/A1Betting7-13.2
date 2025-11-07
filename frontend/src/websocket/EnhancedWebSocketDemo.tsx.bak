/**
 * Enhanced WebSocket Demo Component
 * 
 * Demonstrates the usage of the enhanced WebSocket protocol with
 * message envelopes, backoff strategies, local simulation, and
 * state reconciliation features.
 */

import React, { useState, useCallback } from 'react';
import { 
  useEnhancedWebSocket, 
  useWebSocketMessage, 
  useWebSocketRequest,
  useWebSocketHealth 
} from './useEnhancedWebSocket';
import { 
  WSMessageEnvelope, 
  WSConnectionState,
  WS_MESSAGE_TYPES 
} from './protocol-types';

export const EnhancedWebSocketDemo: React.FC = () => {
  const [messages, setMessages] = useState<WSMessageEnvelope[]>([]);
  const [subscriptions, setSubscriptions] = useState<string[]>([]);

  // Initialize enhanced WebSocket
  const ws = useEnhancedWebSocket({
    url: 'ws://localhost:8000',
    autoConnect: true,
    autoReconnect: true,
    debug: true,
    simulation: {
      enabled: false,
      updateIntervalMs: 3000,
      channels: ['props', 'odds', 'games', 'notifications'],
      generators: {},
      showIndicators: true
    }
  });

  // Health monitoring
  const health = useWebSocketHealth(ws);

  // Request functionality
  const { sendRequest, isLoading: requestLoading, error: requestError } = useWebSocketRequest(ws);

  // Subscribe to all messages for logging
  useWebSocketMessage(ws, '*', useCallback((message: WSMessageEnvelope) => {
    setMessages(prev => [message, ...prev.slice(0, 49)]); // Keep last 50 messages
  }, []));

  // Subscribe to specific message types
  useWebSocketMessage(ws, 'prop_update', useCallback((_payload: unknown) => {
    // Handle prop update
  }, []));

  useWebSocketMessage(ws, 'odds_change', useCallback((_payload: unknown) => {
    // Handle odds change
  }, []));

  useWebSocketMessage(ws, 'game_update', useCallback((_payload: unknown) => {
    // Handle game update
  }, []));

  // Handle subscription to channels
  const handleSubscribe = useCallback(async (channel: string) => {
    try {
      await ws.sendMessage({
        type: WS_MESSAGE_TYPES.SUBSCRIBE,
        payload: {
          action: 'subscribe',
          channel,
          filters: { sport: 'MLB' },
          options: { batchSize: 10, throttleMs: 1000 }
        }
      });
      setSubscriptions(prev => [...prev, channel]);
    } catch {
      // Handle subscription error
    }
  }, [ws]);

  // Handle unsubscription from channels
  const handleUnsubscribe = useCallback(async (channel: string) => {
    try {
      await ws.sendMessage({
        type: WS_MESSAGE_TYPES.UNSUBSCRIBE,
        payload: {
          action: 'unsubscribe',
          channel
        }
      });
      setSubscriptions(prev => prev.filter(sub => sub !== channel));
    } catch {
      // Handle unsubscription error
    }
  }, [ws]);

  // Handle snapshot request
  const handleSnapshot = useCallback(async () => {
    try {
      const _response = await sendRequest('snapshot_request', {
        categories: ['props', 'odds', 'games'],
        lastSyncTimestamp: Date.now() - 3600000, // Last hour
        checksum: null
      });
      // Handle snapshot response
    } catch {
      // Handle snapshot request error
    }
  }, [sendRequest]);

  // Render connection state indicator
  const getStateColor = (state: WSConnectionState) => {
    switch (state) {
      case WSConnectionState.READY: return 'text-green-500';
      case WSConnectionState.CONNECTING: return 'text-yellow-500';
      case WSConnectionState.RECONNECTING: return 'text-orange-500';
      case WSConnectionState.SIMULATION_MODE: return 'text-blue-500';
      case WSConnectionState.FAILED: return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Enhanced WebSocket Demo</h1>
      
      {/* Connection Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="font-semibold mb-2">Connection Status</h3>
          <div className={`font-mono ${getStateColor(ws.state)}`}>
            {ws.state.replace('_', ' ').toUpperCase()}
          </div>
          {ws.isSimulating && (
            <div className="text-blue-600 text-sm mt-1">
              🔄 Simulation Mode Active
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="font-semibold mb-2">Health Score</h3>
          <div className={`text-2xl font-bold ${health.isHealthy ? 'text-green-500' : 'text-red-500'}`}>
            {Math.round(health.healthScore * 100)}%
          </div>
          <div className="text-sm text-gray-600">
            Latency: {ws.health.latencyMs}ms
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="font-semibold mb-2">Statistics</h3>
          <div className="text-sm space-y-1">
            <div>Reconnects: {ws.health.reconnectAttempts}</div>
            <div>Success Rate: {Math.round(ws.health.successRate * 100)}%</div>
            <div>Simulation: {ws.stats.simulation.messagesSent} msgs</div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="font-semibold mb-2">Reconciliation</h3>
          <div className="text-sm space-y-1">
            <div>Categories: {ws.stats.reconciliation.categoriesRegistered}</div>
            <div>Total Items: {ws.stats.reconciliation.totalItems}</div>
            <div>Pending: {ws.stats.reconciliation.pendingSnapshots}</div>
          </div>
        </div>
      </div>

      {/* Health Issues */}
      {health.issues.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-yellow-800 mb-2">Health Issues</h3>
          <ul className="text-sm text-yellow-700 space-y-1">
            {health.issues.map((issue, idx) => (
              <li key={idx}>• {issue}</li>
            ))}
          </ul>
          {health.recommendations.length > 0 && (
            <div className="mt-3">
              <h4 className="font-medium text-yellow-800">Recommendations:</h4>
              <ul className="text-sm text-yellow-700 space-y-1">
                {health.recommendations.map((rec, idx) => (
                  <li key={idx}>• {rec}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="font-semibold mb-4">Connection Controls</h3>
          <div className="space-x-2 mb-4">
            <button
              onClick={ws.connect}
              disabled={ws.isConnected || ws.isConnecting}
              className="px-4 py-2 bg-green-500 text-white rounded disabled:opacity-50"
            >
              Connect
            </button>
            <button
              onClick={ws.disconnect}
              disabled={!ws.isConnected}
              className="px-4 py-2 bg-red-500 text-white rounded disabled:opacity-50"
            >
              Disconnect
            </button>
            <button
              onClick={() => ws.setSimulationMode(!ws.isSimulating)}
              className="px-4 py-2 bg-blue-500 text-white rounded"
            >
              {ws.isSimulating ? 'Stop' : 'Start'} Simulation
            </button>
          </div>
          <div className="space-x-2">
            <button
              onClick={ws.forceReconciliation}
              disabled={!ws.isConnected || requestLoading}
              className="px-4 py-2 bg-purple-500 text-white rounded disabled:opacity-50"
            >
              Force Reconciliation
            </button>
            <button
              onClick={handleSnapshot}
              disabled={!ws.isConnected || requestLoading}
              className="px-4 py-2 bg-indigo-500 text-white rounded disabled:opacity-50"
            >
              Request Snapshot
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="font-semibold mb-4">Subscriptions</h3>
          <div className="space-x-2 mb-4">
            {['props', 'odds', 'games', 'notifications'].map(channel => (
              <button
                key={channel}
                onClick={() => subscriptions.includes(channel) 
                  ? handleUnsubscribe(channel) 
                  : handleSubscribe(channel)
                }
                disabled={!ws.isConnected}
                className={`px-3 py-1 rounded text-sm disabled:opacity-50 ${
                  subscriptions.includes(channel)
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-200 text-gray-700'
                }`}
              >
                {channel}
              </button>
            ))}
          </div>
          <div className="text-sm text-gray-600">
            Active subscriptions: {subscriptions.length}
          </div>
        </div>
      </div>

      {/* Error Display */}
      {(ws.lastError || requestError) && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-red-800 mb-2">Latest Error</h3>
          <div className="text-sm text-red-700 font-mono">
            {ws.lastError?.message || requestError?.message}
          </div>
        </div>
      )}

      {/* Backoff Status */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <h3 className="font-semibold mb-2">Backoff Strategy Status</h3>
        <div className="text-sm text-gray-700">
          {ws.stats.backoff}
        </div>
      </div>

      {/* Recent Messages */}
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="font-semibold mb-4">Recent Messages ({messages.length})</h3>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {messages.map((message, idx) => (
            <div key={idx} className="border rounded p-3 text-sm">
              <div className="flex justify-between items-start mb-2">
                <span className="font-medium text-blue-600">{message.type}</span>
                <div className="text-xs text-gray-500 space-x-2">
                  <span>v{message.version}</span>
                  <span>{new Date(message.ts).toLocaleTimeString()}</span>
                  {message.meta?.source === 'simulation' && (
                    <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded">SIM</span>
                  )}
                </div>
              </div>
              <div className="text-xs text-gray-600 mb-2">
                Correlation: {message.correlationId}
              </div>
              <pre className="text-xs bg-gray-50 p-2 rounded overflow-x-auto">
                {JSON.stringify(message.payload, null, 2)}
              </pre>
            </div>
          ))}
          {messages.length === 0 && (
            <div className="text-center text-gray-500 py-8">
              No messages received yet. Try connecting or enabling simulation mode.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EnhancedWebSocketDemo;