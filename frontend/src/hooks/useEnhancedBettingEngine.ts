import { useState, useEffect, useCallback } from 'react';
import { masterServiceRegistry } from '../services/MasterServiceRegistry';

interface BettingEngineConfig {
  enabled: boolean;
  riskTolerance: 'low' | 'medium' | 'high';
  maxBetsPerDay: number;
  maxStakePercentage: number;
  minEdge: number;
  minConfidence: number;
  autoExecution: boolean;
  sports: string[];
  strategies: string[];
}

interface BettingStrategy {
  id: string;
  name: string;
  description: string;
  type: 'value' | 'arbitrage' | 'hedging' | 'momentum';
  enabled: boolean;
  successRate: number;
  avgROI: number;
  totalBets: number;
  config: any;
}

interface EngineMetrics {
  totalOpportunities: number;
  executedBets: number;
  successfulBets: number;
  totalProfit: number;
  dailyProfit: number;
  engineUptime: number;
  lastProcessedAt: Date;
}

export const useEnhancedBettingEngine = () => {
  const [config, setConfig] = useState<BettingEngineConfig>({
    enabled: false,
    riskTolerance: 'medium',
    maxBetsPerDay: 10,
    maxStakePercentage: 0.05,
    minEdge: 0.03,
    minConfidence: 0.65,
    autoExecution: false,
    sports: ['nfl', 'nba', 'mlb', 'nhl'],
    strategies: ['value', 'arbitrage'],
  });

  const [strategies, setStrategies] = useState<BettingStrategy[]>([]);
  const [metrics, setMetrics] = useState<EngineMetrics>({
    totalOpportunities: 0,
    executedBets: 0,
    successfulBets: 0,
    totalProfit: 0,
    dailyProfit: 0,
    engineUptime: 0,
    lastProcessedAt: new Date(),
  });

  const [isRunning, setIsRunning] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const initializeEngine = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const bettingService = masterServiceRegistry.getService('betting');
      if (!bettingService) {
        throw new Error('Betting service not available');
      }

      // Get engine configuration
      const engineConfig = (await bettingService.getEngineConfig?.()) || config;
      setConfig(engineConfig);

      // Get available strategies
      const availableStrategies = (await bettingService.getStrategies?.()) || [];
      setStrategies(availableStrategies);

      // Get engine metrics
      const engineMetrics = (await bettingService.getEngineMetrics?.()) || metrics;
      setMetrics(engineMetrics);

      // Check if engine is running
      const status = (await bettingService.getEngineStatus?.()) || false;
      setIsRunning(status);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to initialize betting engine';
      setError(errorMessage);
      console.error('Betting engine initialization error:', err);
    } finally {
      setLoading(false);
    }
  }, [config, metrics]);

  const startEngine = useCallback(async () => {
    try {
      const bettingService = masterServiceRegistry.getService('betting');
      if (!bettingService?.startEngine) {
        throw new Error('Engine start not available');
      }

      const success = await bettingService.startEngine(config);
      if (success) {
        setIsRunning(true);
        setError(null);
      }

      return success;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to start betting engine';
      setError(errorMessage);
      console.error('Failed to start betting engine:', err);
      return false;
    }
  }, [config]);

  const stopEngine = useCallback(async () => {
    try {
      const bettingService = masterServiceRegistry.getService('betting');
      if (!bettingService?.stopEngine) {
        throw new Error('Engine stop not available');
      }

      const success = await bettingService.stopEngine();
      if (success) {
        setIsRunning(false);
        setError(null);
      }

      return success;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to stop betting engine';
      setError(errorMessage);
      console.error('Failed to stop betting engine:', err);
      return false;
    }
  }, []);

  const updateConfig = useCallback(
    async (newConfig: Partial<BettingEngineConfig>) => {
      try {
        const updatedConfig = { ...config, ...newConfig };

        const bettingService = masterServiceRegistry.getService('betting');
        if (bettingService?.updateEngineConfig) {
          await bettingService.updateEngineConfig(updatedConfig);
        }

        setConfig(updatedConfig);
        return true;
      } catch (err) {
        console.error('Failed to update engine config:', err);
        return false;
      }
    },
    [config]
  );

  const enableStrategy = useCallback(async (strategyId: string) => {
    try {
      const bettingService = masterServiceRegistry.getService('betting');
      if (bettingService?.enableStrategy) {
        await bettingService.enableStrategy(strategyId);
      }

      setStrategies(prev =>
        prev.map(strategy =>
          strategy.id === strategyId ? { ...strategy, enabled: true } : strategy
        )
      );

      return true;
    } catch (err) {
      console.error('Failed to enable strategy:', err);
      return false;
    }
  }, []);

  const disableStrategy = useCallback(async (strategyId: string) => {
    try {
      const bettingService = masterServiceRegistry.getService('betting');
      if (bettingService?.disableStrategy) {
        await bettingService.disableStrategy(strategyId);
      }

      setStrategies(prev =>
        prev.map(strategy =>
          strategy.id === strategyId ? { ...strategy, enabled: false } : strategy
        )
      );

      return true;
    } catch (err) {
      console.error('Failed to disable strategy:', err);
      return false;
    }
  }, []);

  const updateStrategyConfig = useCallback(async (strategyId: string, newConfig: any) => {
    try {
      const bettingService = masterServiceRegistry.getService('betting');
      if (bettingService?.updateStrategyConfig) {
        await bettingService.updateStrategyConfig(strategyId, newConfig);
      }

      setStrategies(prev =>
        prev.map(strategy =>
          strategy.id === strategyId ? { ...strategy, config: newConfig } : strategy
        )
      );

      return true;
    } catch (err) {
      console.error('Failed to update strategy config:', err);
      return false;
    }
  }, []);

  const getEnginePerformance = useCallback(async (timeRange: '24h' | '7d' | '30d' = '24h') => {
    try {
      const bettingService = masterServiceRegistry.getService('betting');
      if (!bettingService?.getEnginePerformance) {
        return null;
      }

      return await bettingService.getEnginePerformance(timeRange);
    } catch (err) {
      console.error('Failed to get engine performance:', err);
      return null;
    }
  }, []);

  const getStrategyPerformance = useCallback(
    (strategyId: string) => {
      const strategy = strategies.find(s => s.id === strategyId);
      return strategy
        ? {
            successRate: strategy.successRate,
            avgROI: strategy.avgROI,
            totalBets: strategy.totalBets,
            enabled: strategy.enabled,
          }
        : null;
    },
    [strategies]
  );

  const simulateStrategy = useCallback(async (strategyId: string, params: any) => {
    try {
      const bettingService = masterServiceRegistry.getService('betting');
      if (!bettingService?.simulateStrategy) {
        return null;
      }

      return await bettingService.simulateStrategy(strategyId, params);
    } catch (err) {
      console.error('Failed to simulate strategy:', err);
      return null;
    }
  }, []);

  const optimizeStrategy = useCallback(
    async (strategyId: string) => {
      try {
        const bettingService = masterServiceRegistry.getService('betting');
        if (!bettingService?.optimizeStrategy) {
          return null;
        }

        const optimizedConfig = await bettingService.optimizeStrategy(strategyId);

        if (optimizedConfig) {
          await updateStrategyConfig(strategyId, optimizedConfig);
        }

        return optimizedConfig;
      } catch (err) {
        console.error('Failed to optimize strategy:', err);
        return null;
      }
    },
    [updateStrategyConfig]
  );

  const refreshMetrics = useCallback(async () => {
    try {
      const bettingService = masterServiceRegistry.getService('betting');
      if (!bettingService?.getEngineMetrics) {
        return;
      }

      const newMetrics = await bettingService.getEngineMetrics();
      setMetrics(newMetrics);
    } catch (err) {
      console.error('Failed to refresh engine metrics:', err);
    }
  }, []);

  const getActiveStrategies = useCallback(() => {
    return strategies.filter(strategy => strategy.enabled);
  }, [strategies]);

  const getStrategyByType = useCallback(
    (type: BettingStrategy['type']) => {
      return strategies.filter(strategy => strategy.type === type);
    },
    [strategies]
  );

  useEffect(() => {
    initializeEngine();

    // Refresh metrics every 30 seconds when engine is running
    const interval = setInterval(() => {
      if (isRunning) {
        refreshMetrics();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [initializeEngine, isRunning, refreshMetrics]);

  return {
    config,
    strategies,
    metrics,
    isRunning,
    loading,
    error,
    startEngine,
    stopEngine,
    updateConfig,
    enableStrategy,
    disableStrategy,
    updateStrategyConfig,
    getEnginePerformance,
    getStrategyPerformance,
    simulateStrategy,
    optimizeStrategy,
    refreshMetrics,
    getActiveStrategies,
    getStrategyByType,
    initializeEngine,
  };
};

export default useEnhancedBettingEngine;
