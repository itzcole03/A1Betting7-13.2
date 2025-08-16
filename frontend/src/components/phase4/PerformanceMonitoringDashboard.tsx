import { motion } from 'framer-motion';
import {
  Activity,
  AlertTriangle,
  BarChart3,
  CheckCircle,
  Clock,
  Cloud,
  Cpu,
  Database,
  Gauge,
  Wifi,
  WifiOff,
  XCircle,
} from 'lucide-react';
import * as React from 'react';
import { useEffect, useState, useCallback } from 'react';
import { fetchHealthData, fetchPerformanceStats } from '../../utils/robustApi';
import { useMetricsActions, useCacheHitRate } from '../../metrics/metricsStore';
import StatusIndicator from './StatusIndicator';

interface PerformanceMetrics {
  api_performance: {
    [endpoint: string]: {
      avg_time_ms: number;
      min_time_ms: number;
      max_time_ms: number;
      total_calls: number;
      cache_hits: number;
      errors: number;
    };
  };
  cache_performance: {
    cache_type: string;
    hits: number;
    misses: number;
    errors: number;
    hit_rate: number;
    total_requests: number;
  };
  system_info: {
    optimization_level: string;
    caching_strategy: string;
    monitoring: string;
  };
}

interface SystemHealth {
  status: string;
  services: {
    api: string;
    cache: string;
    database: string;
  };
  performance: {
    cache_hit_rate: number;
    cache_type: string;
  };
  uptime_seconds: number;
}

// Mock data functions for fallback
const getMockMetrics = (): PerformanceMetrics => ({
  api_performance: {
    '/health': {
      avg_time_ms: 45.2,
      min_time_ms: 23.1,
      max_time_ms: 156.8,
      total_calls: 247,
      cache_hits: 89,
      errors: 2,
    },
    '/mlb/games': {
      avg_time_ms: 127.3,
      min_time_ms: 45.2,
      max_time_ms: 342.1,
      total_calls: 156,
      cache_hits: 134,
      errors: 1,
    },
    '/ml/predict': {
      avg_time_ms: 234.7,
      min_time_ms: 156.3,
      max_time_ms: 567.2,
      total_calls: 89,
      cache_hits: 76,
      errors: 0,
    },
  },
  cache_performance: {
    cache_type: 'memory',
    hits: 312,
    misses: 67,
    errors: 3,
    hit_rate: 82.3,
    total_requests: 379,
  },
  system_info: {
    optimization_level: 'Phase 4 Enhanced',
    caching_strategy: 'Memory Fallback (Demo Mode)',
    monitoring: 'Real-time Performance Tracking',
  },
});

const getMockHealth = (): SystemHealth => ({
  status: 'healthy',
  services: {
    api: 'operational',
    cache: 'operational',
    database: 'operational',
  },
  performance: {
    cache_hit_rate: 82.3,
    cache_type: 'memory',
  },
  uptime_seconds: 3657, // ~1 hour
});

const PerformanceMonitoringDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUsingMockData, setIsUsingMockData] = useState(false);
  const [isCloudEnvironment, setIsCloudEnvironment] = useState(false);

  // Use normalized metrics store for safe access
  const { updateFromRaw } = useMetricsActions();
  const cacheMetrics = useCacheHitRate();

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Check if we're in a cloud environment
      const hostname = window.location.hostname;
      const isCloud =
        hostname.includes('.fly.dev') ||
        hostname.includes('.vercel.app') ||
        hostname.includes('.netlify.app') ||
        hostname.includes('.herokuapp.com') ||
        !hostname.includes('localhost');

      setIsCloudEnvironment(isCloud);

      // Use robust API client with automatic fallbacks
      const [healthData, perfDataRaw] = await Promise.all([
        fetchHealthData(),
        fetchPerformanceStats(),
      ]);

      // Type guard for perfData
      let perfData: PerformanceMetrics;
      if (
        perfDataRaw &&
        typeof perfDataRaw === 'object' &&
        'data' in perfDataRaw &&
        perfDataRaw.data
      ) {
        perfData = perfDataRaw.data as PerformanceMetrics;
      } else {
        perfData = perfDataRaw as PerformanceMetrics;
      }

      setHealth(healthData);
      setMetrics(perfData);

      // Update metrics store with health and performance data
      updateFromRaw({
        ...healthData,
        ...perfData,
      }, 'performance-dashboard');

      // Check if we're using mock data
      setIsUsingMockData(
        isCloud ||
          (healthData.status === 'healthy' &&
            healthData.services?.cache === 'operational' &&
            (perfData.system_info?.caching_strategy?.includes('Demo Mode') ||
              perfData.system_info?.caching_strategy?.includes('Cloud Demo')))
      );
    } catch (err) {
      /* eslint-disable-next-line no-console */
      console.error('Failed to fetch performance data:', err);
      setError('Using demo data - API may be unavailable');
      // Provide fallback data
      setMetrics(getMockMetrics());
      setHealth(getMockHealth());
      setIsUsingMockData(true);
    } finally {
      setLoading(false);
    }
  }, [updateFromRaw]); // Add dependencies for useCallback

  useEffect(() => {
    fetchData();

    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [updateFromRaw, fetchData]); // Add fetchData to dependencies

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'operational':
      case 'healthy':
        return 'text-green-400';
      case 'degraded':
        return 'text-yellow-400';
      case 'unhealthy':
      case 'error':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'operational':
      case 'healthy':
        return <CheckCircle className='w-4 h-4' />;
      case 'degraded':
        return <AlertTriangle className='w-4 h-4' />;
      case 'unhealthy':
      case 'error':
        return <XCircle className='w-4 h-4' />;
      default:
        return <Activity className='w-4 h-4' />;
    }
  };

  const formatUptime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  if (loading) {
    return (
      <div className='bg-gray-900 p-6 rounded-lg border border-gray-700'>
        <div className='flex items-center space-x-2 mb-4'>
          <Gauge className='w-6 h-6 text-blue-400' />
          <h3 className='text-xl font-bold text-white'>Performance Monitoring</h3>
        </div>
        <div className='flex justify-center items-center h-64'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400'></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className='bg-gray-900 p-6 rounded-lg border border-gray-700'>
        <div className='flex items-center space-x-2 mb-4'>
          <Gauge className='w-6 h-6 text-blue-400' />
          <h3 className='text-xl font-bold text-white'>Performance Monitoring</h3>
        </div>
        <div className='bg-red-900/20 border border-red-700 rounded-lg p-4'>
          <p className='text-red-400'>{error}</p>
          <button
            onClick={fetchData}
            className='mt-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm transition-colors'
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className='bg-gray-900 p-6 rounded-lg border border-gray-700'
    >
      {/* Header */}
      <div className='flex items-center justify-between mb-6'>
        <div className='flex items-center space-x-3'>
          <Gauge className='w-6 h-6 text-blue-400' />
          <h3 className='text-xl font-bold text-white'>Performance Monitoring</h3>
          {isCloudEnvironment ? (
            <StatusIndicator status='warning' message='Cloud Demo Mode' size='sm' />
          ) : isUsingMockData ? (
            <StatusIndicator status='warning' message='Demo Mode - Mock Data' size='sm' />
          ) : (
            <StatusIndicator status='healthy' message='Live Data' size='sm' />
          )}
        </div>
        <div className='flex items-center space-x-2'>
          {isCloudEnvironment ? (
            <Cloud className='w-4 h-4 text-blue-400' />
          ) : isUsingMockData ? (
            <WifiOff className='w-4 h-4 text-yellow-400' />
          ) : (
            <Wifi className='w-4 h-4 text-green-400' />
          )}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={fetchData}
            className='px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors'
          >
            Refresh
          </motion.button>
        </div>
      </div>

      {/* System Health */}
      {health && (
        <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mb-6'>
          <div className='bg-gray-800 p-4 rounded-lg border border-gray-600'>
            <div className='flex items-center space-x-2 mb-2'>
              <Activity className='w-5 h-5 text-green-400' />
              <h4 className='font-semibold text-white'>System Status</h4>
            </div>
            <p className={`text-lg font-bold ${getStatusColor(health.status)}`}>
              {health.status.toUpperCase()}
            </p>
            <p className='text-gray-400 text-sm'>Uptime: {formatUptime(health.uptime_seconds)}</p>
          </div>

          <div className='bg-gray-800 p-4 rounded-lg border border-gray-600'>
            <div className='flex items-center space-x-2 mb-2'>
              <Database className='w-5 h-5 text-blue-400' />
              <h4 className='font-semibold text-white'>Cache Performance</h4>
            </div>
            <p className='text-lg font-bold text-blue-400'>
              {cacheMetrics.formatted}
            </p>
            <p className='text-gray-400 text-sm'>
              Type: {health?.performance?.cache_type || 'memory'}
            </p>
          </div>

          <div className='bg-gray-800 p-4 rounded-lg border border-gray-600'>
            <div className='flex items-center space-x-2 mb-2'>
              <Cpu className='w-5 h-5 text-purple-400' />
              <h4 className='font-semibold text-white'>Services</h4>
            </div>
            <div className='space-y-1'>
              {Object.entries(health.services).map(([service, status]) => (
                <div key={service} className='flex items-center space-x-2'>
                  <span className={getStatusColor(status)}>{getStatusIcon(status)}</span>
                  <span className='text-gray-300 text-sm capitalize'>{service}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Performance Metrics */}
      {metrics && (
        <div className='space-y-6'>
          {/* API Performance */}
          <div>
            <h4 className='text-lg font-semibold text-white mb-3 flex items-center space-x-2'>
              <BarChart3 className='w-5 h-5 text-green-400' />
              <span>API Performance</span>
            </h4>
            <div className='bg-gray-800 rounded-lg border border-gray-600 overflow-hidden'>
              <div className='overflow-x-auto'>
                <table className='w-full text-sm'>
                  <thead className='bg-gray-700'>
                    <tr>
                      <th className='px-4 py-3 text-left text-gray-300'>Endpoint</th>
                      <th className='px-4 py-3 text-right text-gray-300'>Avg Time</th>
                      <th className='px-4 py-3 text-right text-gray-300'>Calls</th>
                      <th className='px-4 py-3 text-right text-gray-300'>Cache Hits</th>
                      <th className='px-4 py-3 text-right text-gray-300'>Errors</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(metrics.api_performance).map(([endpoint, stats]) => (
                      <tr key={endpoint} className='border-t border-gray-600'>
                        <td className='px-4 py-3 text-gray-300 font-mono'>{endpoint}</td>
                        <td className='px-4 py-3 text-right text-gray-300'>
                          {typeof stats.avg_time_ms === 'number'
                            ? stats.avg_time_ms.toFixed(1)
                            : 'N/A'}
                          ms
                        </td>
                        <td className='px-4 py-3 text-right text-gray-300'>{stats.total_calls}</td>
                        <td className='px-4 py-3 text-right text-green-400'>{stats.cache_hits}</td>
                        <td className='px-4 py-3 text-right text-red-400'>{stats.errors}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Cache Statistics */}
          <div>
            <h4 className='text-lg font-semibold text-white mb-3 flex items-center space-x-2'>
              <Database className='w-5 h-5 text-blue-400' />
              <span>Cache Statistics</span>
            </h4>
            <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
              <div className='bg-gray-800 p-4 rounded-lg border border-gray-600'>
                <p className='text-gray-400 text-sm'>Hit Rate</p>
                <p className='text-xl font-bold text-green-400'>
                  {typeof metrics.cache_performance.hit_rate === 'number'
                    ? metrics.cache_performance.hit_rate.toFixed(1)
                    : 'N/A'}
                  %
                </p>
              </div>
              <div className='bg-gray-800 p-4 rounded-lg border border-gray-600'>
                <p className='text-gray-400 text-sm'>Total Requests</p>
                <p className='text-xl font-bold text-blue-400'>
                  {metrics.cache_performance.total_requests}
                </p>
              </div>
              <div className='bg-gray-800 p-4 rounded-lg border border-gray-600'>
                <p className='text-gray-400 text-sm'>Cache Hits</p>
                <p className='text-xl font-bold text-green-400'>{metrics.cache_performance.hits}</p>
              </div>
              <div className='bg-gray-800 p-4 rounded-lg border border-gray-600'>
                <p className='text-gray-400 text-sm'>Cache Misses</p>
                <p className='text-xl font-bold text-yellow-400'>
                  {metrics.cache_performance.misses}
                </p>
              </div>
            </div>
          </div>

          {/* System Info */}
          <div>
            <h4 className='text-lg font-semibold text-white mb-3 flex items-center space-x-2'>
              <Clock className='w-5 h-5 text-purple-400' />
              <span>System Information</span>
            </h4>
            <div className='bg-gray-800 p-4 rounded-lg border border-gray-600'>
              <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                <div>
                  <p className='text-gray-400 text-sm'>Optimization Level</p>
                  <p className='text-white font-semibold'>
                    {metrics.system_info.optimization_level}
                  </p>
                </div>
                <div>
                  <p className='text-gray-400 text-sm'>Caching Strategy</p>
                  <p className='text-white font-semibold'>{metrics.system_info.caching_strategy}</p>
                </div>
                <div>
                  <p className='text-gray-400 text-sm'>Monitoring</p>
                  <p className='text-white font-semibold'>{metrics.system_info.monitoring}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Phase 4 Badge and Demo Notice */}
      <div className='mt-6 flex justify-between items-center'>
        {(isUsingMockData || isCloudEnvironment) && (
          <div className='bg-blue-600/20 border border-blue-500 rounded-lg px-3 py-2'>
            <div className='flex items-center space-x-2'>
              {isCloudEnvironment ? (
                <Cloud className='w-4 h-4 text-blue-400' />
              ) : (
                <WifiOff className='w-4 h-4 text-yellow-400' />
              )}
              <span className='text-blue-400 text-sm'>
                {isCloudEnvironment
                  ? 'Cloud Demo Mode: Running in production with realistic mock data'
                  : 'Demo Mode: Backend API not available, showing realistic mock data'}
              </span>
            </div>
          </div>
        )}
        <div className='bg-blue-600/20 border border-blue-500 rounded-lg px-3 py-1'>
          <span className='text-blue-400 text-sm font-semibold'>Phase 4 Enhanced</span>
        </div>
      </div>
    </motion.div>
  );
};

export default PerformanceMonitoringDashboard;
