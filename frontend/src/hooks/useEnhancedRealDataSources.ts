import { useState, useEffect, useCallback, useRef } from 'react';
import { masterServiceRegistry } from '../services/MasterServiceRegistry';

interface DataSource {
  id: string;
  name: string;
  type: 'odds' | 'stats' | 'news' | 'weather' | 'injuries' | 'lineups';
  status: 'connected' | 'disconnected' | 'error' | 'maintenance';
  lastUpdate: Date;
  updateFrequency: number; // seconds
  reliability: number; // 0-1
  latency: number; // milliseconds
  errorCount: number;
  priority: 'high' | 'medium' | 'low';
}

interface DataQuality {
  overall: number;
  accuracy: number;
  completeness: number;
  timeliness: number;
  consistency: number;
}

interface RealTimeData {
  odds: any[];
  games: any[];
  players: any[];
  injuries: any[];
  weather: any[];
  news: any[];
  lastSync: Date;
}

export const useEnhancedRealDataSources = () => {
  const [dataSources, setDataSources] = useState<DataSource[]>([]);
  const [dataQuality, setDataQuality] = useState<DataQuality>({
    overall: 0,
    accuracy: 0,
    completeness: 0,
    timeliness: 0,
    consistency: 0,
  });
  const [realTimeData, setRealTimeData] = useState<RealTimeData>({
    odds: [],
    games: [],
    players: [],
    injuries: [],
    weather: [],
    news: [],
    lastSync: new Date(),
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const monitoringInterval = useRef<NodeJS.Timeout | null>(null);

  const initializeDataSources = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const dataService = masterServiceRegistry.getService('data');
      if (!dataService) {
        throw new Error('Data service not available');
      }

      // Get data source status
      const sources = (await dataService.getDataSources?.()) || [];
      setDataSources(sources);

      // Get data quality metrics
      const quality = (await dataService.getDataQuality?.()) || dataQuality;
      setDataQuality(quality);

      // Get initial real-time data
      const initialData = (await dataService.getRealTimeData?.()) || realTimeData;
      setRealTimeData(initialData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to initialize data sources';
      setError(errorMessage);
      console.error('Data sources initialization error:', err);
    } finally {
      setLoading(false);
    }
  }, [dataQuality, realTimeData]);

  const connectToDataSource = useCallback(async (sourceId: string) => {
    try {
      const dataService = masterServiceRegistry.getService('data');
      if (!dataService?.connectDataSource) {
        return false;
      }

      const success = await dataService.connectDataSource(sourceId);

      if (success) {
        setDataSources(prev =>
          prev.map(source =>
            source.id === sourceId
              ? { ...source, status: 'connected' as const, lastUpdate: new Date() }
              : source
          )
        );
      }

      return success;
    } catch (err) {
      console.error('Failed to connect to data source:', err);
      return false;
    }
  }, []);

  const disconnectFromDataSource = useCallback(async (sourceId: string) => {
    try {
      const dataService = masterServiceRegistry.getService('data');
      if (!dataService?.disconnectDataSource) {
        return false;
      }

      const success = await dataService.disconnectDataSource(sourceId);

      if (success) {
        setDataSources(prev =>
          prev.map(source =>
            source.id === sourceId ? { ...source, status: 'disconnected' as const } : source
          )
        );
      }

      return success;
    } catch (err) {
      console.error('Failed to disconnect from data source:', err);
      return false;
    }
  }, []);

  const refreshDataSource = useCallback(async (sourceId: string) => {
    try {
      const dataService = masterServiceRegistry.getService('data');
      if (!dataService?.refreshDataSource) {
        return false;
      }

      const success = await dataService.refreshDataSource(sourceId);

      if (success) {
        setDataSources(prev =>
          prev.map(source =>
            source.id === sourceId ? { ...source, lastUpdate: new Date() } : source
          )
        );
      }

      return success;
    } catch (err) {
      console.error('Failed to refresh data source:', err);
      return false;
    }
  }, []);

  const refreshAllDataSources = useCallback(async () => {
    try {
      const dataService = masterServiceRegistry.getService('data');
      if (!dataService?.refreshAllDataSources) {
        // Fallback to refreshing each source individually
        const promises = dataSources.map(source => refreshDataSource(source.id));
        await Promise.all(promises);
        return true;
      }

      const success = await dataService.refreshAllDataSources();

      if (success) {
        setDataSources(prev =>
          prev.map(source => ({
            ...source,
            lastUpdate: new Date(),
          }))
        );
      }

      return success;
    } catch (err) {
      console.error('Failed to refresh all data sources:', err);
      return false;
    }
  }, [dataSources, refreshDataSource]);

  const getDataByType = useCallback(
    (type: DataSource['type']) => {
      switch (type) {
        case 'odds':
          return realTimeData.odds;
        case 'stats':
          return realTimeData.games;
        case 'injuries':
          return realTimeData.injuries;
        case 'weather':
          return realTimeData.weather;
        case 'news':
          return realTimeData.news;
        default:
          return [];
      }
    },
    [realTimeData]
  );

  const getDataSourcesByStatus = useCallback(
    (status: DataSource['status']) => {
      return dataSources.filter(source => source.status === status);
    },
    [dataSources]
  );

  const getDataSourcesByType = useCallback(
    (type: DataSource['type']) => {
      return dataSources.filter(source => source.type === type);
    },
    [dataSources]
  );

  const getHighPriorityDataSources = useCallback(() => {
    return dataSources.filter(source => source.priority === 'high');
  }, [dataSources]);

  const getDataSourceHealth = useCallback(() => {
    const total = dataSources.length;
    if (total === 0) return 0;

    const healthy = dataSources.filter(
      source => source.status === 'connected' && source.reliability > 0.8
    ).length;

    return healthy / total;
  }, [dataSources]);

  const getUnreliableDataSources = useCallback(
    (threshold = 0.7) => {
      return dataSources.filter(source => source.reliability < threshold);
    },
    [dataSources]
  );

  const startMonitoring = useCallback(() => {
    if (monitoringInterval.current) {
      clearInterval(monitoringInterval.current);
    }

    setIsMonitoring(true);

    monitoringInterval.current = setInterval(async () => {
      try {
        const dataService = masterServiceRegistry.getService('data');
        if (!dataService) return;

        // Update data source status
        const sources = (await dataService.getDataSources?.()) || [];
        setDataSources(sources);

        // Update data quality
        const quality = (await dataService.getDataQuality?.()) || dataQuality;
        setDataQuality(quality);

        // Update real-time data
        const newData = (await dataService.getRealTimeData?.()) || realTimeData;
        setRealTimeData(newData);
      } catch (err) {
        console.error('Monitoring error:', err);
      }
    }, 30000); // Monitor every 30 seconds
  }, [dataQuality, realTimeData]);

  const stopMonitoring = useCallback(() => {
    if (monitoringInterval.current) {
      clearInterval(monitoringInterval.current);
      monitoringInterval.current = null;
    }
    setIsMonitoring(false);
  }, []);

  const testDataSource = useCallback(async (sourceId: string) => {
    try {
      const dataService = masterServiceRegistry.getService('data');
      if (!dataService?.testDataSource) {
        return { success: false, message: 'Testing not available' };
      }

      return await dataService.testDataSource(sourceId);
    } catch (err) {
      console.error('Failed to test data source:', err);
      return { success: false, message: err instanceof Error ? err.message : 'Test failed' };
    }
  }, []);

  const optimizeDataSources = useCallback(async () => {
    try {
      const dataService = masterServiceRegistry.getService('data');
      if (!dataService?.optimizeDataSources) {
        return false;
      }

      return await dataService.optimizeDataSources();
    } catch (err) {
      console.error('Failed to optimize data sources:', err);
      return false;
    }
  }, []);

  const getDataLatency = useCallback(() => {
    if (dataSources.length === 0) return 0;

    const totalLatency = dataSources.reduce((sum, source) => sum + source.latency, 0);
    return totalLatency / dataSources.length;
  }, [dataSources]);

  const getUpdateFrequencyStats = useCallback(() => {
    if (dataSources.length === 0) return { min: 0, max: 0, avg: 0 };

    const frequencies = dataSources.map(source => source.updateFrequency);
    return {
      min: Math.min(...frequencies),
      max: Math.max(...frequencies),
      avg: frequencies.reduce((sum, freq) => sum + freq, 0) / frequencies.length,
    };
  }, [dataSources]);

  const subscribeToDataUpdates = useCallback(() => {
    try {
      const wsService = masterServiceRegistry.getService('websocket');
      if (!wsService) return;

      // Subscribe to data source updates
      wsService.subscribe('data_source_update', (data: any) => {
        setDataSources(prev =>
          prev.map(source =>
            source.id === data.sourceId ? { ...source, ...data.updates } : source
          )
        );
      });

      // Subscribe to real-time data updates
      wsService.subscribe('real_time_data', (data: Partial<RealTimeData>) => {
        setRealTimeData(prev => ({ ...prev, ...data, lastSync: new Date() }));
      });

      // Subscribe to data quality updates
      wsService.subscribe('data_quality_update', (data: Partial<DataQuality>) => {
        setDataQuality(prev => ({ ...prev, ...data }));
      });
    } catch (err) {
      console.error('Failed to subscribe to data updates:', err);
    }
  }, []);

  useEffect(() => {
    initializeDataSources();
    subscribeToDataUpdates();
    startMonitoring();

    return () => {
      stopMonitoring();
    };
  }, [initializeDataSources, subscribeToDataUpdates, startMonitoring, stopMonitoring]);

  return {
    dataSources,
    dataQuality,
    realTimeData,
    loading,
    error,
    isMonitoring,
    connectToDataSource,
    disconnectFromDataSource,
    refreshDataSource,
    refreshAllDataSources,
    getDataByType,
    getDataSourcesByStatus,
    getDataSourcesByType,
    getHighPriorityDataSources,
    getDataSourceHealth,
    getUnreliableDataSources,
    startMonitoring,
    stopMonitoring,
    testDataSource,
    optimizeDataSources,
    getDataLatency,
    getUpdateFrequencyStats,
    initializeDataSources,
  };
};

export default useEnhancedRealDataSources;
