import { useState, useEffect, useCallback, useRef } from 'react';
import { masterServiceRegistry } from '../services/MasterServiceRegistry';

interface PredictionData {
  id: string;
  sport: string;
  gameId: string;
  market: string;
  prediction: number;
  confidence: number;
  modelUsed: string;
  factors: any[];
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

export const useRealtimePredictions = () => {
  const [predictions, setPredictions] = useState<PredictionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const wsRef = useRef<any>(null);

  const [config, setConfig] = useState<RealtimeConfig>({
    autoRefresh: true,
    refreshInterval: 30000, // 30 seconds
    sports: ['nfl', 'nba', 'mlb', 'nhl'],
    markets: ['spread', 'total', 'moneyline'],
    minConfidence: 0.6,
  });

  const fetchPredictions = useCallback(
    async (filters?: any) => {
      try {
        setLoading(true);
        setError(null);

        const predictionService = masterServiceRegistry.getService('predictions');
        if (!predictionService) {
          throw new Error('Prediction service not available');
        }

        const requestFilters = {
          sports: config.sports,
          markets: config.markets,
          minConfidence: config.minConfidence,
          ...filters,
        };

        const data = await predictionService.getRealtimePredictions(requestFilters);
        setPredictions(data || []);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch predictions';
        setError(errorMessage);
        console.error('Predictions fetch error:', err);
      } finally {
        setLoading(false);
      }
    },
    [config]
  );

  const makePrediction = useCallback(async (request: any) => {
    try {
      const predictionService = masterServiceRegistry.getService('predictions');
      if (!predictionService) {
        throw new Error('Prediction service not available');
      }

      const result = await predictionService.makePrediction(request);

      // Add new prediction to current list
      setPredictions(prev => [result, ...prev]);

      return result;
    } catch (err) {
      console.error('Failed to make prediction:', err);
      throw err;
    }
  }, []);

  const connectWebSocket = useCallback(() => {
    try {
      const wsService = masterServiceRegistry.getService('websocket');
      if (!wsService) {
        console.warn('WebSocket service not available');
        return;
      }

      // Subscribe to prediction updates
      wsRef.current = wsService.subscribe('prediction_update', (data: PredictionData) => {
        setPredictions(prev => {
          const index = prev.findIndex(p => p.id === data.id);
          if (index >= 0) {
            // Update existing prediction
            const updated = [...prev];
            updated[index] = data;
            return updated;
          } else {
            // Add new prediction
            return [data, ...prev];
          }
        });
      });

      // Subscribe to real-time game updates
      wsService.subscribe('game_update', (data: any) => {
        // Trigger prediction refresh for affected games
        fetchPredictions({ gameId: data.gameId });
      });

      setConnected(true);
    } catch (err) {
      console.error('Failed to connect to WebSocket:', err);
      setConnected(false);
    }
  }, [fetchPredictions]);

  const disconnectWebSocket = useCallback(() => {
    try {
      const wsService = masterServiceRegistry.getService('websocket');
      if (wsService && wsRef.current) {
        wsService.unsubscribe(wsRef.current);
        wsRef.current = null;
      }
      setConnected(false);
    } catch (err) {
      console.error('Failed to disconnect WebSocket:', err);
    }
  }, []);

  const startAutoRefresh = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    if (config.autoRefresh) {
      intervalRef.current = setInterval(() => {
        fetchPredictions();
      }, config.refreshInterval);
    }
  }, [config.autoRefresh, config.refreshInterval, fetchPredictions]);

  const stopAutoRefresh = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const updateConfig = useCallback((newConfig: Partial<RealtimeConfig>) => {
    setConfig(prev => ({ ...prev, ...newConfig }));
  }, []);

  const refreshPredictions = useCallback(() => {
    fetchPredictions();
  }, [fetchPredictions]);

  const getPredictionsByGame = useCallback(
    (gameId: string) => {
      return predictions.filter(p => p.gameId === gameId);
    },
    [predictions]
  );

  const getPredictionsBySport = useCallback(
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
