import { useCallback, useEffect, useState } from 'react';
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
  config: unknown;
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

export const _useEnhancedBettingEngine = () => {
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

  const _initializeEngine = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const _bettingService = masterServiceRegistry.getService('betting');
      const bettingService = _bettingService as any;
      if (!bettingService) {
        throw new Error('Betting service not available');
      }

      // Get engine configuration
      const _engineConfig = (await bettingService.getEngineConfig?.()) || config;
      const engineConfig = _engineConfig as BettingEngineConfig;
      setConfig(engineConfig);

      // Get available strategies
      const _availableStrategies = (await bettingService.getStrategies?.()) || [];
      const availableStrategies = _availableStrategies as BettingStrategy[];
      setStrategies(availableStrategies);

      // Get engine metrics
      const _engineMetrics = (await bettingService.getEngineMetrics?.()) || metrics;
      const engineMetrics = _engineMetrics as EngineMetrics;
      setMetrics(engineMetrics);

      // Check if engine is running
      const _status = (await bettingService.getEngineStatus?.()) || false;
      const status = _status as boolean;
      setIsRunning(status);
    } catch (err) {
      const _errorMessage =
        err instanceof Error ? err.message : 'Failed to initialize betting engine';
      const errorMessage = _errorMessage;
      setError(errorMessage);
      console.error('Betting engine initialization error:', err);
    } finally {
      setLoading(false);
    }
  }, [config, metrics]);

  const _startEngine = useCallback(async () => {
    try {
      const _bettingService = masterServiceRegistry.getService('betting');
      const bettingService = _bettingService as any;
      if (!bettingService?.startEngine) {
        throw new Error('Engine start not available');
      }

      const _success = await bettingService.startEngine(config);
      const success = _success as boolean;
      if (success) {
        setIsRunning(true);
        setError(null);
      }

      return success;
    } catch (err) {
      const _errorMessage = err instanceof Error ? err.message : 'Failed to start betting engine';
      const errorMessage = _errorMessage;
      setError(errorMessage);
      console.error('Failed to start betting engine:', err);
      return false;
    }
  }, [config]);

  const _stopEngine = useCallback(async () => {
    try {
      const _bettingService = masterServiceRegistry.getService('betting');
      const bettingService = _bettingService as any;
      if (!bettingService?.stopEngine) {
        throw new Error('Engine stop not available');
      }

      const _success = await bettingService.stopEngine();
      const success = _success as boolean;
      if (success) {
        setIsRunning(false);
        setError(null);
      }

      return success;
    } catch (err) {
      const _errorMessage = err instanceof Error ? err.message : 'Failed to stop betting engine';
      const errorMessage = _errorMessage;
      setError(errorMessage);
      console.error('Failed to stop betting engine:', err);
      return false;
    }
  }, []);

  const _updateConfig = useCallback(
    async (newConfig: Partial<BettingEngineConfig>) => {
      try {
        const _updatedConfig = { ...config, ...newConfig };
        const updatedConfig = _updatedConfig as BettingEngineConfig;

        const _bettingService = masterServiceRegistry.getService('betting');
        const bettingService = _bettingService as any;
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

  const _enableStrategy = useCallback(async (strategyId: string) => {
    try {
      const _bettingService = masterServiceRegistry.getService('betting');
      const bettingService = _bettingService as any;
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

  const _disableStrategy = useCallback(async (strategyId: string) => {
    try {
      const _bettingService = masterServiceRegistry.getService('betting');
      const bettingService = _bettingService as any;
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

  const _updateStrategyConfig = useCallback(async (strategyId: string, newConfig: unknown) => {
    try {
      const _bettingService = masterServiceRegistry.getService('betting');
      const bettingService = _bettingService as any;
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

  const _getEnginePerformance = useCallback(async (timeRange: '24h' | '7d' | '30d' = '24h') => {
    try {
      const _bettingService = masterServiceRegistry.getService('betting');
      const bettingService = _bettingService as any;
      if (!bettingService?.getEnginePerformance) {
        return null;
      }

      return await bettingService.getEnginePerformance(timeRange);
    } catch (err) {
      console.error('Failed to get engine performance:', err);
      return null;
    }
  }, []);

  const _getStrategyPerformance = useCallback(
    (strategyId: string) => {
      const _strategy = strategies.find(s => s.id === strategyId);
      const strategy = _strategy;
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

  const _simulateStrategy = useCallback(async (strategyId: string, params: unknown) => {
    try {
      const _bettingService = masterServiceRegistry.getService('betting');
      const bettingService = _bettingService as any;
      if (!bettingService?.simulateStrategy) {
        return null;
      }

      return await bettingService.simulateStrategy(strategyId, params);
    } catch (err) {
      console.error('Failed to simulate strategy:', err);
      return null;
    }
  }, []);

  const _optimizeStrategy = useCallback(
    async (strategyId: string) => {
      try {
        const _bettingService = masterServiceRegistry.getService('betting');
        const bettingService = _bettingService as any;
        if (!bettingService?.optimizeStrategy) {
          return null;
        }

        const _optimizedConfig = await bettingService.optimizeStrategy(strategyId);

        const optimizedConfig = _optimizedConfig;

        if (optimizedConfig) {
          await _updateStrategyConfig(strategyId, optimizedConfig);
        }

        return optimizedConfig;
      } catch (err) {
        console.error('Failed to optimize strategy:', err);
        return null;
      }
    },
    [updateStrategyConfig]
  );

  const _refreshMetrics = useCallback(async () => {
    try {
      const _bettingService = masterServiceRegistry.getService('betting');
      const bettingService = _bettingService as any;
      if (!bettingService?.getEngineMetrics) {
        return;
      }

      const _newMetrics = await bettingService.getEngineMetrics();
      const newMetrics = _newMetrics as EngineMetrics;
      setMetrics(newMetrics);
    } catch (err) {
      console.error('Failed to refresh engine metrics:', err);
    }
  }, []);

  const _getActiveStrategies = useCallback(() => {
    return strategies.filter(strategy => strategy.enabled);
  }, [strategies]);

  const _getStrategyByType = useCallback(
    (type: BettingStrategy['type']) => {
      return strategies.filter(strategy => strategy.type === type);
    },
    [strategies]
  );

  useEffect(() => {
    // Call the aliased initializer so the hook works with both underscored and non-underscored callers
    const initializeEngine = _initializeEngine;
    const refreshMetrics = _refreshMetrics;
    initializeEngine();

    // Refresh metrics every 30 seconds when engine is running
    const _interval = setInterval(() => {
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
    // Provide non-underscored aliases for consumers
    startEngine: _startEngine,
    stopEngine: _stopEngine,
    updateConfig: _updateConfig,
    enableStrategy: _enableStrategy,
    disableStrategy: _disableStrategy,
    updateStrategyConfig: _updateStrategyConfig,
    getEnginePerformance: _getEnginePerformance,
    getStrategyPerformance: _getStrategyPerformance,
    simulateStrategy: _simulateStrategy,
    optimizeStrategy: _optimizeStrategy,
    refreshMetrics: _refreshMetrics,
    getActiveStrategies: _getActiveStrategies,
    getStrategyByType: _getStrategyByType,
    initializeEngine: _initializeEngine,
  };
};

// Backwards-compatible named export expected by many consumers
export const useEnhancedBettingEngine = _useEnhancedBettingEngine;

// Keep default export compatible with existing import patterns
export default _useEnhancedBettingEngine;
