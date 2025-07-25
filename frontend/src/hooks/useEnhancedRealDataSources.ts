import { useCallback, useEffect, useRef, useState } from 'react';

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
  odds: unknown[];
  games: unknown[];
  players: unknown[];
  injuries: unknown[];
  weather: unknown[];
  news: unknown[];
  lastSync: Date;
}

export const _useEnhancedRealDataSources = () => {
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
  const _monitoringInterval = useRef<NodeJS.Timeout | null>(null);

  const _initializeDataSources = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const _dataService = masterServiceRegistry.getService('data');
      if (!dataService) {
        throw new Error('Data service not available');
      }

      // Get data source status
      const _sources = (await dataService.getDataSources?.()) || [];
      setDataSources(sources);

      // Get data quality metrics
      const _quality = (await dataService.getDataQuality?.()) || dataQuality;
      setDataQuality(quality);

      // Get initial real-time data
      const _initialData = (await dataService.getRealTimeData?.()) || realTimeData;
      setRealTimeData(initialData);
    } catch (err) {
      const _errorMessage =
        err instanceof Error ? err.message : 'Failed to initialize data sources';
      setError(errorMessage);
      console.error('Data sources initialization error:', err);
    } finally {
      setLoading(false);
    }
  }, [dataQuality, realTimeData]);

  const _connectToDataSource = useCallback(async (sourceId: string) => {
    try {
      const _dataService = masterServiceRegistry.getService('data');
      if (!dataService?.connectDataSource) {
        return false;
      }

      const _success = await dataService.connectDataSource(sourceId);

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

  const _disconnectFromDataSource = useCallback(async (sourceId: string) => {
    try {
      const _dataService = masterServiceRegistry.getService('data');
      if (!dataService?.disconnectDataSource) {
        return false;
      }

      const _success = await dataService.disconnectDataSource(sourceId);

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

  const _refreshDataSource = useCallback(async (sourceId: string) => {
    try {
      const _dataService = masterServiceRegistry.getService('data');
      if (!dataService?.refreshDataSource) {
        return false;
      }

      const _success = await dataService.refreshDataSource(sourceId);

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

  const _refreshAllDataSources = useCallback(async () => {
    try {
      const _dataService = masterServiceRegistry.getService('data');
      if (!dataService?.refreshAllDataSources) {
        // Fallback to refreshing each source individually
        const _promises = dataSources.map(source => refreshDataSource(source.id));
        await Promise.all(promises);
        return true;
      }

      const _success = await dataService.refreshAllDataSources();

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

  const _getDataByType = useCallback(
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

  const _getDataSourcesByStatus = useCallback(
    (status: DataSource['status']) => {
      return dataSources.filter(source => source.status === status);
    },
    [dataSources]
  );

  const _getDataSourcesByType = useCallback(
    (type: DataSource['type']) => {
      return dataSources.filter(source => source.type === type);
    },
    [dataSources]
  );

  const _getHighPriorityDataSources = useCallback(() => {
    return dataSources.filter(source => source.priority === 'high');
  }, [dataSources]);

  const _getDataSourceHealth = useCallback(() => {
    const _total = dataSources.length;
    if (total === 0) return 0;

    const _healthy = dataSources.filter(
      source => source.status === 'connected' && source.reliability > 0.8
    ).length;

    return healthy / total;
  }, [dataSources]);

  const _getUnreliableDataSources = useCallback(
    (threshold = 0.7) => {
      return dataSources.filter(source => source.reliability < threshold);
    },
    [dataSources]
  );

  const _startMonitoring = useCallback(() => {
    if (monitoringInterval.current) {
      clearInterval(monitoringInterval.current);
    }

    setIsMonitoring(true);

    monitoringInterval.current = setInterval(async () => {
      try {
        const _dataService = masterServiceRegistry.getService('data');
        if (!dataService) return;

        // Update data source status
        const _sources = (await dataService.getDataSources?.()) || [];
        setDataSources(sources);

        // Update data quality
        const _quality = (await dataService.getDataQuality?.()) || dataQuality;
        setDataQuality(quality);

        // Update real-time data
        const _newData = (await dataService.getRealTimeData?.()) || realTimeData;
        setRealTimeData(newData);
      } catch (err) {
        console.error('Monitoring error:', err);
      }
    }, 30000); // Monitor every 30 seconds
  }, [dataQuality, realTimeData]);

  const _stopMonitoring = useCallback(() => {
    if (monitoringInterval.current) {
      clearInterval(monitoringInterval.current);
      monitoringInterval.current = null;
    }
    setIsMonitoring(false);
  }, []);

  const _testDataSource = useCallback(async (sourceId: string) => {
    try {
      const _dataService = masterServiceRegistry.getService('data');
      if (!dataService?.testDataSource) {
        return { success: false, message: 'Testing not available' };
      }

      return await dataService.testDataSource(sourceId);
    } catch (err) {
      console.error('Failed to test data source:', err);
      return { success: false, message: err instanceof Error ? err.message : 'Test failed' };
    }
  }, []);

  const _optimizeDataSources = useCallback(async () => {
    try {
      const _dataService = masterServiceRegistry.getService('data');
      if (!dataService?.optimizeDataSources) {
        return false;
      }

      return await dataService.optimizeDataSources();
    } catch (err) {
      console.error('Failed to optimize data sources:', err);
      return false;
    }
  }, []);

  const _getDataLatency = useCallback(() => {
    if (dataSources.length === 0) return 0;

    const _totalLatency = dataSources.reduce((sum, source) => sum + source.latency, 0);
    return totalLatency / dataSources.length;
  }, [dataSources]);

  const _getUpdateFrequencyStats = useCallback(() => {
    if (dataSources.length === 0) return { min: 0, max: 0, avg: 0 };

    const _frequencies = dataSources.map(source => source.updateFrequency);
    return {
      min: Math.min(...frequencies),
      max: Math.max(...frequencies),
      avg: frequencies.reduce((sum, freq) => sum + freq, 0) / frequencies.length,
    };
  }, [dataSources]);

  const _subscribeToDataUpdates = useCallback(() => {
    try {
      const _wsService = masterServiceRegistry.getService('websocket');
      if (!wsService) return;

      // Subscribe to data source updates
      wsService.subscribe('data_source_update', (data: unknown) => {
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
