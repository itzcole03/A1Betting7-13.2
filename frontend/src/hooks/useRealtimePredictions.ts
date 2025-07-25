import { useCallback, useEffect, useRef, useState } from 'react';

interface PredictionData {
  id: string;
  sport: string;
  gameId: string;
  market: string;
  prediction: number;
  confidence: number;
  modelUsed: string;
  factors: unknown[];
  timestamp: Date;
  status: 'active' | 'settled' | 'cancelled';
}

interface RealtimeConfig {
  autoRefresh: boolean;
  refreshInterval: number;
  sports: string[];
  markets: string[];
  minConfidence: number;
}

export const _useRealtimePredictions = () => {
  const [predictions, setPredictions] = useState<PredictionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const _intervalRef = useRef<NodeJS.Timeout | null>(null);
  const _wsRef = useRef<unknown>(null);

  const [config, setConfig] = useState<RealtimeConfig>({
    autoRefresh: true,
    refreshInterval: 30000, // 30 seconds
    sports: ['nfl', 'nba', 'mlb', 'nhl'],
    markets: ['spread', 'total', 'moneyline'],
    minConfidence: 0.6,
  });

  const _fetchPredictions = useCallback(
    async (filters?: unknown) => {
      try {
        setLoading(true);
        setError(null);

        const _predictionService = masterServiceRegistry.getService('predictions');
        if (!predictionService) {
          throw new Error('Prediction service not available');
        }

        const _requestFilters = {
          sports: config.sports,
          markets: config.markets,
          minConfidence: config.minConfidence,
          ...filters,
        };

        const _data = await predictionService.getRealtimePredictions(requestFilters);
        setPredictions(data || []);
      } catch (err) {
        const _errorMessage = err instanceof Error ? err.message : 'Failed to fetch predictions';
        setError(errorMessage);
        console.error('Predictions fetch error:', err);
      } finally {
        setLoading(false);
      }
    },
    [config]
  );

  const _makePrediction = useCallback(async (request: unknown) => {
    try {
      const _predictionService = masterServiceRegistry.getService('predictions');
      if (!predictionService) {
        throw new Error('Prediction service not available');
      }

      const _result = await predictionService.makePrediction(request);

      // Add new prediction to current list
      setPredictions(prev => [result, ...prev]);

      return result;
    } catch (err) {
      console.error('Failed to make prediction:', err);
      throw err;
    }
  }, []);

  const _connectWebSocket = useCallback(() => {
    try {
      const _wsService = masterServiceRegistry.getService('websocket');
      if (!wsService) {
        console.warn('WebSocket service not available');
        return;
      }

      // Subscribe to prediction updates
      wsRef.current = wsService.subscribe('prediction_update', (data: PredictionData) => {
        setPredictions(prev => {
          const _index = prev.findIndex(p => p.id === data.id);
          if (index >= 0) {
            // Update existing prediction
            const _updated = [...prev];
            updated[index] = data;
            return updated;
          } else {
            // Add new prediction
            return [data, ...prev];
          }
        });
      });

      // Subscribe to real-time game updates
      wsService.subscribe('game_update', (data: unknown) => {
        // Trigger prediction refresh for affected games
        fetchPredictions({ gameId: data.gameId });
      });

      setConnected(true);
    } catch (err) {
      console.error('Failed to connect to WebSocket:', err);
      setConnected(false);
    }
  }, [fetchPredictions]);

  const _disconnectWebSocket = useCallback(() => {
    try {
      const _wsService = masterServiceRegistry.getService('websocket');
      if (wsService && wsRef.current) {
        wsService.unsubscribe(wsRef.current);
        wsRef.current = null;
      }
      setConnected(false);
    } catch (err) {
      console.error('Failed to disconnect WebSocket:', err);
    }
  }, []);

  const _startAutoRefresh = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    if (config.autoRefresh) {
      intervalRef.current = setInterval(() => {
        fetchPredictions();
      }, config.refreshInterval);
    }
  }, [config.autoRefresh, config.refreshInterval, fetchPredictions]);

  const _stopAutoRefresh = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const _updateConfig = useCallback((newConfig: Partial<RealtimeConfig>) => {
    setConfig(prev => ({ ...prev, ...newConfig }));
  }, []);

  const _refreshPredictions = useCallback(() => {
    fetchPredictions();
  }, [fetchPredictions]);

  const _getPredictionsByGame = useCallback(
    (gameId: string) => {
      return predictions.filter(p => p.gameId === gameId);
    },
    [predictions]
  );

  const _getPredictionsBySport = useCallback(
    (sport: string) => {
      return predictions.filter(p => p.sport === sport);
    },
    [predictions]
  );

  useEffect(() => {
    fetchPredictions();
    connectWebSocket();
    startAutoRefresh();

    return () => {
      disconnectWebSocket();
      stopAutoRefresh();
    };
  }, [fetchPredictions, connectWebSocket, startAutoRefresh, disconnectWebSocket, stopAutoRefresh]);

  useEffect(() => {
    // Restart auto-refresh when config changes
    startAutoRefresh();
  }, [config, startAutoRefresh]);

  return {
    predictions,
    loading,
    error,
    connected,
    config,
    fetchPredictions,
    makePrediction,
    updateConfig,
    refreshPredictions,
    getPredictionsByGame,
    getPredictionsBySport,
    startAutoRefresh,
    stopAutoRefresh,
  };
};

export default useRealtimePredictions;
