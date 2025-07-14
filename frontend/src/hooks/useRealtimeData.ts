/**
 * 🚀 PHASE 5: Real-time Data Hook
 *
 * Implements real WebSocket connections to backend for live data:
 * - Real WebSocket connection to localhost:8000/ws
 * - Live performance metrics and system status
 * - Automatic reconnection and error handling
 * - Type-safe data structures
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { apiService } from '../services/ApiService';

interface WebSocketMessage<T = unknown> {
  type: string;
  data: T;
  timestamp: number;
}

interface UseRealtimeDataOptions<T> {
  url?: string;
  initialData?: T | null;
  onMessage?: (message: WebSocketMessage<T>) => void;
  onError?: (error: Error) => void;
  onConnected?: () => void;
  onDisconnected?: () => void;
  reconnectAttempts?: number;
  reconnectDelay?: number;
  heartbeatInterval?: number;
  subscriptions?: string[];
}

interface UseRealtimeDataResult<T> {
  data: T | null;
  isConnected: boolean;
  error: Error | null;
  send: (message: any) => void;
  subscribe: (channel: string) => void;
  unsubscribe: (channel: string) => void;
  reconnect: () => void;
}

interface RealtimeData {
  // System metrics
  liveGames: number;
  predictions: number;
  accuracy: number;
  profit: number;
  neuralActivity: number;
  quantumCoherence: number;
  dataPoints: number;
  processingSpeed: number;
  confidence: number;
  activeBots: number;
  winStreak: number;
  marketAnalysis: string;

  // Performance data
  systemLoad: number;
  memoryUsage: number;
  cpuUsage: number;
  responseTime: number;

  // API status
  apiStatus: {
    backend: 'online' | 'offline' | 'degraded';
    prizepicks: 'online' | 'offline' | 'degraded';
    sportsradar: 'online' | 'offline' | 'degraded';
    odds: 'online' | 'offline' | 'degraded';
  };

  // Live alerts
  alerts: Array<{
    id: string;
    type: 'info' | 'warning' | 'error' | 'success';
    message: string;
    timestamp: string;
  }>;

  // Real-time updates
  lastUpdated: string;
  updateFrequency: number;
}

export function useRealtimeData<T = RealtimeData>({
  url = 'ws://localhost:8000/ws',
  initialData = null,
  onMessage,
  onError,
  onConnected,
  onDisconnected,
  reconnectAttempts = 5,
  reconnectDelay = 1000,
  heartbeatInterval = 30000,
  subscriptions = ['system_metrics', 'performance_data', 'alerts'],
}: UseRealtimeDataOptions<T> = {}): UseRealtimeDataResult<T> {
  const [data, setData] = useState<T | null>(initialData);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectCountRef = useRef(0);
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const subscriptionsRef = useRef<Set<string>>(new Set(subscriptions));

  /**
   * Initialize default real-time data structure
   */
  const initializeDefaultData = useCallback((): T => {
    return {
      liveGames: 0,
      predictions: 0,
      accuracy: 0,
      profit: 0,
      neuralActivity: 0,
      quantumCoherence: 0,
      dataPoints: 0,
      processingSpeed: 0,
      confidence: 0,
      activeBots: 0,
      winStreak: 0,
      marketAnalysis: 'Initializing...',
      systemLoad: 0,
      memoryUsage: 0,
      cpuUsage: 0,
      responseTime: 0,
      apiStatus: {
        backend: 'offline',
        prizepicks: 'offline',
        sportsradar: 'offline',
        odds: 'offline',
      },
      alerts: [],
      lastUpdated: new Date().toISOString(),
      updateFrequency: 0,
    } as T;
  }, []);

  /**
   * Fetch initial data from REST API
   */
  const fetchInitialData = useCallback(async () => {
    try {
      //       console.log('📊 Fetching initial real-time data from API...');

      const [healthResponse, analyticsResponse, metricsResponse] = await Promise.allSettled([
        apiService.healthCheck(),
        apiService.getAnalyticsSummary(),
        apiService.getPerformanceMetrics(),
      ]);

      let combinedData = initializeDefaultData();

      // Process health check data
      if (healthResponse.status === 'fulfilled') {
        const healthData = healthResponse.value.data;
        //         console.log('✅ Health data received:', healthData);

        combinedData = {
          ...combinedData,
          apiStatus: {
            backend: 'online',
            prizepicks: healthData.api_metrics ? 'online' : 'degraded',
            sportsradar: healthData.models ? 'online' : 'degraded',
            odds: healthData.performance ? 'online' : 'degraded',
          },
          systemLoad: healthData.performance?.cpu_usage || 0,
          memoryUsage: healthData.performance?.memory_usage || 0,
          responseTime: healthData.performance?.response_time || 0,
        };
      }

      // Process analytics data
      if (analyticsResponse.status === 'fulfilled') {
        const analyticsData = analyticsResponse.value.data;
        //         console.log('✅ Analytics data received:', analyticsData);

        combinedData = {
          ...combinedData,
          accuracy: analyticsData.accuracy || 0,
          predictions: analyticsData.total_predictions || 0,
          confidence: analyticsData.confidence_score || 0,
        };
      }

      // Process metrics data
      if (metricsResponse.status === 'fulfilled') {
        const metricsData = metricsResponse.value.data;
        //         console.log('✅ Metrics data received:', metricsData);

        combinedData = {
          ...combinedData,
          activeBots: metricsData.active_models || 0,
          dataPoints: metricsData.data_points || 0,
          processingSpeed: metricsData.processing_speed || 0,
        };
      }

      setData(combinedData);
      //       console.log('🎉 Initial real-time data loaded:', combinedData);
    } catch (error) {
      //       console.error('❌ Failed to fetch initial real-time data:', error);
      setData(initializeDefaultData());
    }
  }, [initializeDefaultData]);

  /**
   * Send heartbeat to keep connection alive
   */
  const sendHeartbeat = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: 'heartbeat',
          timestamp: Date.now(),
        })
      );
    }
  }, []);

  /**
   * Setup heartbeat interval
   */
  const setupHeartbeat = useCallback(() => {
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
    }

    heartbeatIntervalRef.current = setInterval(sendHeartbeat, heartbeatInterval);
  }, [sendHeartbeat, heartbeatInterval]);

  /**
   * Handle incoming WebSocket messages
   */
  const handleMessage = useCallback(
    (event: MessageEvent) => {
      try {
        const message: WebSocketMessage<any> = JSON.parse(event.data);

        // Update data based on message type
        switch (message.type) {
          case 'system_metrics':
            setData(prevData => ({
              ...prevData,
              ...message.data,
              lastUpdated: new Date().toISOString(),
            }));
            break;

          case 'performance_update':
            setData(prevData => ({
              ...prevData,
              systemLoad: message.data.cpu_usage,
              memoryUsage: message.data.memory_usage,
              responseTime: message.data.response_time,
              lastUpdated: new Date().toISOString(),
            }));
            break;

          case 'alert':
            setData(prevData => ({
              ...prevData,
              alerts: [
                {
                  id: Date.now().toString(),
                  type: message.data.level,
                  message: message.data.message,
                  timestamp: new Date().toISOString(),
                },
                ...(prevData?.alerts || []).slice(0, 9), // Keep last 10 alerts
              ],
              lastUpdated: new Date().toISOString(),
            }));
            break;

          case 'api_status':
            setData(prevData => ({
              ...prevData,
              apiStatus: message.data,
              lastUpdated: new Date().toISOString(),
            }));
            break;

          default:
          //           console.log('📨 Received WebSocket message:', message.type, message.data);
        }

        // Call custom message handler if provided
        if (onMessage) {
          onMessage(message);
        }
      } catch (error) {
        //       console.error('❌ Failed to parse WebSocket message:', error);
      }
    },
    [onMessage]
  );

  /**
   * Connect to WebSocket
   */
  const connect = useCallback(() => {
    // Don't create new connection if one already exists and is connecting/open
    if (
      wsRef.current &&
      (wsRef.current.readyState === WebSocket.CONNECTING ||
        wsRef.current.readyState === WebSocket.OPEN)
    ) {
      return;
    }

    try {
      //       console.log('🔌 Connecting to WebSocket:', url);

      // Clean up any existing connection first
      if (wsRef.current) {
        try {
          wsRef.current.close();
        } catch (e) {
          // Ignore close errors
        }
      }

      wsRef.current = new WebSocket(url);

      wsRef.current.onopen = () => {
        //         console.log('✅ WebSocket connected');
        setIsConnected(true);
        setError(null);
        reconnectCountRef.current = 0;

        // Subscribe to channels
        subscriptionsRef.current.forEach(channel => {
          if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(
              JSON.stringify({
                type: 'subscribe',
                channel,
              })
            );
          }
        });

        setupHeartbeat();

        if (onConnected) onConnected();
      };

      wsRef.current.onmessage = handleMessage;

      wsRef.current.onclose = event => {
        //         console.log('🔌 WebSocket disconnected', { code: event.code, reason: event.reason });
        setIsConnected(false);

        if (heartbeatIntervalRef.current) {
          clearInterval(heartbeatIntervalRef.current);
        }

        if (onDisconnected) onDisconnected();

        // Only attempt reconnection for unexpected closures (not normal closure code 1000)
        if (event.code !== 1000 && reconnectCountRef.current < reconnectAttempts) {
          reconnectCountRef.current++;
          //           console.log(`🔄 Reconnecting... (${reconnectCountRef.current}/${reconnectAttempts})`);
          setTimeout(connect, reconnectDelay * reconnectCountRef.current);
        } else if (event.code !== 1000) {
          //           console.error('❌ Max reconnection attempts reached');
          setError(new Error('Failed to maintain WebSocket connection'));
        }
      };

      wsRef.current.onerror = error => {
        //         console.error('❌ WebSocket error:', error);
        const wsError = new Error('WebSocket connection error');
        setError(wsError);
        if (onError) onError(wsError);
      };
    } catch (error) {
      //       console.error('❌ Failed to create WebSocket connection:', error);
      const connectionError = error instanceof Error ? error : new Error('Failed to connect');
      setError(connectionError);
      if (onError) onError(connectionError);
    }
  }, [
    url,
    onConnected,
    onDisconnected,
    onError,
    handleMessage,
    setupHeartbeat,
    reconnectAttempts,
    reconnectDelay,
  ]);

  /**
   * Disconnect WebSocket
   */
  const disconnect = useCallback(() => {
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
    }

    if (wsRef.current) {
      // Check WebSocket state before closing
      const readyState = wsRef.current.readyState;

      if (readyState === WebSocket.OPEN || readyState === WebSocket.CONNECTING) {
        try {
          wsRef.current.close();
        } catch (error) {
          // Ignore errors when closing WebSocket - it might already be closed
          console.warn('WebSocket close warning:', error);
        }
      }

      wsRef.current = null;
    }

    setIsConnected(false);
  }, []);

  /**
   * Send message through WebSocket
   */
  const send = useCallback((message: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    } else {
      //       console.warn('⚠️ WebSocket not connected, cannot send message');
    }
  }, []);

  /**
   * Subscribe to a channel
   */
  const subscribe = useCallback(
    (channel: string) => {
      subscriptionsRef.current.add(channel);
      send({ type: 'subscribe', channel });
    },
    [send]
  );

  /**
   * Unsubscribe from a channel
   */
  const unsubscribe = useCallback(
    (channel: string) => {
      subscriptionsRef.current.delete(channel);
      send({ type: 'unsubscribe', channel });
    },
    [send]
  );

  /**
   * Manual reconnection
   */
  const reconnect = useCallback(() => {
    disconnect();
    reconnectCountRef.current = 0;
    connect();
  }, [disconnect, connect]);

  /**
   * Initialize connection and fetch initial data
   */
  useEffect(() => {
    fetchInitialData();
    connect();

    return () => {
      disconnect();
    };
  }, [fetchInitialData, connect, disconnect]);

  return {
    data,
    isConnected,
    error,
    send,
    subscribe,
    unsubscribe,
    reconnect,
  };
}

// Export default hook with RealtimeData type
export const useRealtimeData = () => useRealtimeData<RealtimeData>();

// Export types
export type { RealtimeData, UseRealtimeDataOptions, UseRealtimeDataResult, WebSocketMessage };
