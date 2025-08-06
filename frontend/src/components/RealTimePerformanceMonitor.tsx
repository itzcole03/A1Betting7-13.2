/**
 * Performance Monitor - Real-time Performance and Health Monitoring
 * Implements comprehensive performance tracking, health monitoring, and optimization suggestions
 */

import React, { useCallback, useEffect, useState } from 'react';
import { connectionResilience } from '../utils/connectionResilience';
import { apiClient } from '../utils/enhancedApiClient';

interface PerformanceMetrics {
  // Core Web Vitals
  fcp?: number; // First Contentful Paint
  lcp?: number; // Largest Contentful Paint
  cls?: number; // Cumulative Layout Shift
  fid?: number; // First Input Delay

  // Custom metrics
  apiResponseTime: number;
  cacheHitRate: number;
  errorRate: number;
  memoryUsage: number;
  connectionLatency: number;

  // Health status
  healthStatus: 'healthy' | 'degraded' | 'unhealthy';
  lastUpdated: number;
}

interface PerformanceAlert {
  id: string;
  type: 'warning' | 'error' | 'info';
  message: string;
  metric: string;
  value: number;
  threshold: number;
  timestamp: number;
  resolved: boolean;
}

interface PerformanceConfig {
  updateInterval: number;
  alertThresholds: {
    apiResponseTime: number;
    errorRate: number;
    memoryUsage: number;
    connectionLatency: number;
  };
  enableRealTimeMonitoring: boolean;
  enableAlerts: boolean;
}

const defaultConfig: PerformanceConfig = {
  updateInterval: 5000, // 5 seconds
  alertThresholds: {
    apiResponseTime: 2000, // 2 seconds
    errorRate: 0.05, // 5%
    memoryUsage: 100 * 1024 * 1024, // 100MB
    connectionLatency: 1000, // 1 second
  },
  enableRealTimeMonitoring: true,
  enableAlerts: true,
};

export const PerformanceMonitor: React.FC<{
  config?: Partial<PerformanceConfig>;
  onAlert?: (alert: PerformanceAlert) => void;
  visible?: boolean;
  connectionHealth?: {
    status: 'healthy' | 'degraded' | 'error';
    latency: number;
    lastCheck: Date;
  };
}> = ({ config = {}, onAlert, visible = false, connectionHealth }) => {
  const finalConfig = { ...defaultConfig, ...config };
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    apiResponseTime: 0,
    cacheHitRate: 0,
    errorRate: 0,
    memoryUsage: 0,
    connectionLatency: 0,
    healthStatus: 'healthy',
    lastUpdated: Date.now(),
  });
  const [alerts, setAlerts] = useState<PerformanceAlert[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(true); // Collapsed by default

  // Collect Core Web Vitals
  const collectCoreWebVitals = useCallback((): Partial<PerformanceMetrics> => {
    if (!('PerformanceObserver' in window)) {
      return {};
    }

    const webVitals: Partial<PerformanceMetrics> = {};

    // Get navigation timing for FCP
    const navigationEntries = performance.getEntriesByType(
      'navigation'
    ) as PerformanceNavigationTiming[];
    if (navigationEntries.length > 0) {
      const nav = navigationEntries[0];
      webVitals.fcp = nav.loadEventEnd - nav.fetchStart;
    }

    // Get paint timing entries
    const paintEntries = performance.getEntriesByType('paint');
    paintEntries.forEach(entry => {
      if (entry.name === 'first-contentful-paint') {
        webVitals.fcp = entry.startTime;
      }
    });

    return webVitals;
  }, []);

  // Measure memory usage
  const getMemoryUsage = useCallback((): number => {
    if ('memory' in performance && (performance as any).memory) {
      return (performance as any).memory.usedJSHeapSize;
    }
    return 0;
  }, []);

  // Measure connection latency
  const measureConnectionLatency = useCallback(async (): Promise<number> => {
    const start = performance.now();
    try {
      // Hit the backend health endpoint, not frontend
      await fetch('http://localhost:8000/health', {
        method: 'GET', // Use GET instead of HEAD for better compatibility
        cache: 'no-cache',
        signal: AbortSignal.timeout(5000),
      });
      return performance.now() - start;
    } catch {
      return -1; // Connection failed
    }
  }, []);

  // Update performance metrics
  const updateMetrics = useCallback(async () => {
    try {
      const webVitals = collectCoreWebVitals();
      const apiMetrics = apiClient.getPerformanceMetrics();
      const connectionStatus = connectionResilience.getStatus();
      const memoryUsage = getMemoryUsage();
      const connectionLatency = await measureConnectionLatency();

      const newMetrics: PerformanceMetrics = {
        ...webVitals,
        apiResponseTime: apiMetrics.averageResponseTime,
        cacheHitRate: apiMetrics.cacheHitRate,
        errorRate: apiMetrics.errorRate,
        memoryUsage,
        connectionLatency,
        healthStatus: connectionStatus.health,
        lastUpdated: Date.now(),
      };

      setMetrics(newMetrics);

      // Check for performance alerts
      if (finalConfig.enableAlerts) {
        checkForAlerts(newMetrics);
      }
    } catch (error) {
      console.warn('[PerformanceMonitor] Failed to update metrics:', error);
    }
  }, [finalConfig.enableAlerts, collectCoreWebVitals, getMemoryUsage, measureConnectionLatency]);

  // Check for performance alerts
  const checkForAlerts = useCallback(
    (currentMetrics: PerformanceMetrics) => {
      const newAlerts: PerformanceAlert[] = [];

      // API Response Time Alert
      if (currentMetrics.apiResponseTime > finalConfig.alertThresholds.apiResponseTime) {
        newAlerts.push({
          id: `api-response-${Date.now()}`,
          type: 'warning',
          message: 'API response time is higher than expected',
          metric: 'apiResponseTime',
          value: currentMetrics.apiResponseTime,
          threshold: finalConfig.alertThresholds.apiResponseTime,
          timestamp: Date.now(),
          resolved: false,
        });
      }

      // Error Rate Alert
      if (currentMetrics.errorRate > finalConfig.alertThresholds.errorRate) {
        newAlerts.push({
          id: `error-rate-${Date.now()}`,
          type: 'error',
          message: 'Error rate is above acceptable threshold',
          metric: 'errorRate',
          value: currentMetrics.errorRate,
          threshold: finalConfig.alertThresholds.errorRate,
          timestamp: Date.now(),
          resolved: false,
        });
      }

      // Memory Usage Alert
      if (currentMetrics.memoryUsage > finalConfig.alertThresholds.memoryUsage) {
        newAlerts.push({
          id: `memory-${Date.now()}`,
          type: 'warning',
          message: 'Memory usage is high',
          metric: 'memoryUsage',
          value: currentMetrics.memoryUsage,
          threshold: finalConfig.alertThresholds.memoryUsage,
          timestamp: Date.now(),
          resolved: false,
        });
      }

      // Connection Latency Alert
      if (currentMetrics.connectionLatency > finalConfig.alertThresholds.connectionLatency) {
        newAlerts.push({
          id: `latency-${Date.now()}`,
          type: 'warning',
          message: 'Connection latency is high',
          metric: 'connectionLatency',
          value: currentMetrics.connectionLatency,
          threshold: finalConfig.alertThresholds.connectionLatency,
          timestamp: Date.now(),
          resolved: false,
        });
      }

      if (newAlerts.length > 0) {
        setAlerts(prev => [...prev, ...newAlerts]);
        newAlerts.forEach(alert => onAlert?.(alert));
      }
    },
    [finalConfig.alertThresholds, onAlert]
  );

  // Start/stop monitoring
  useEffect(() => {
    if (!finalConfig.enableRealTimeMonitoring) return;

    setIsMonitoring(true);
    const interval = setInterval(updateMetrics, finalConfig.updateInterval);

    // Initial metrics collection
    updateMetrics();

    return () => {
      clearInterval(interval);
      setIsMonitoring(false);
    };
  }, [finalConfig.enableRealTimeMonitoring, finalConfig.updateInterval, updateMetrics]);

  // Format values for display
  const formatValue = (value: number, type: string): string => {
    switch (type) {
      case 'time':
        return `${Math.round(value)}ms`;
      case 'percentage':
        return `${(value * 100).toFixed(1)}%`;
      case 'memory':
        return `${(value / 1024 / 1024).toFixed(1)}MB`;
      default:
        return value.toString();
    }
  };

  // Get status color
  const getStatusColor = (value: number, threshold: number, invert = false): string => {
    const isGood = invert ? value < threshold : value > threshold;
    if (isGood) return 'text-green-400';
    if (value > threshold * 0.8) return 'text-yellow-400';
    return 'text-red-400';
  };

  if (!visible) return null;

  return (
    <div className='fixed bottom-4 right-4 w-48 bg-slate-800 border border-slate-600 rounded shadow-lg z-50'>
      <div className='p-2'>
        <div
          className='flex items-center justify-between cursor-pointer hover:bg-slate-700 -mx-1 -mt-1 mb-1 px-1 py-1 rounded'
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          <div className='flex items-center gap-1'>
            <h3 className='text-white font-medium text-xs'>Performance Monitor</h3>
            <svg
              className={`w-2.5 h-2.5 text-slate-400 transition-transform ${
                isCollapsed ? 'rotate-0' : 'rotate-180'
              }`}
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M19 9l-7 7-7-7'
              />
            </svg>
          </div>
          <div className='flex items-center gap-1'>
            {/* Connection Health and Latency */}
            {connectionHealth && (
              <div
                className={`px-1.5 py-0.5 rounded text-xs font-medium flex items-center ${
                  connectionHealth.status === 'healthy'
                    ? 'bg-green-100 text-green-800'
                    : connectionHealth.status === 'degraded'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {connectionHealth.status === 'healthy' && '🟢'}
                {connectionHealth.status === 'degraded' && '🟡'}
                {connectionHealth.status === 'error' && '🔴'}
                <span className='ml-1'>{connectionHealth.latency}ms</span>
              </div>
            )}
            <div
              className={`w-1.5 h-1.5 rounded-full ml-1 ${
                isMonitoring ? 'bg-green-400 animate-pulse' : 'bg-gray-400'
              }`}
            />
          </div>
        </div>

        {!isCollapsed && (
          <>
            <div className='space-y-1.5'>
              {/* Health Status */}
              <div className='flex items-center justify-between text-xs'>
                <span className='text-slate-400 truncate'>Health Status</span>
                <span
                  className={`font-medium ml-2 ${
                    metrics.healthStatus === 'healthy'
                      ? 'text-green-400'
                      : metrics.healthStatus === 'degraded'
                      ? 'text-yellow-400'
                      : 'text-red-400'
                  }`}
                >
                  {metrics.healthStatus}
                </span>
              </div>

              {/* API Response Time */}
              <div className='flex items-center justify-between text-xs'>
                <span className='text-slate-400 truncate'>API Response</span>
                <span
                  className={`font-medium ml-2 ${getStatusColor(
                    metrics.apiResponseTime,
                    finalConfig.alertThresholds.apiResponseTime
                  )}`}
                >
                  {formatValue(metrics.apiResponseTime, 'time')}
                </span>
              </div>

              {/* Cache Hit Rate */}
              <div className='flex items-center justify-between text-xs'>
                <span className='text-slate-400 truncate'>Cache Hit</span>
                <span
                  className={`font-medium ml-2 ${getStatusColor(metrics.cacheHitRate, 0.5, true)}`}
                >
                  {formatValue(metrics.cacheHitRate, 'percentage')}
                </span>
              </div>

              {/* Error Rate */}
              <div className='flex items-center justify-between text-xs'>
                <span className='text-slate-400 truncate'>Error Rate</span>
                <span
                  className={`font-medium ml-2 ${getStatusColor(
                    metrics.errorRate,
                    finalConfig.alertThresholds.errorRate
                  )}`}
                >
                  {formatValue(metrics.errorRate, 'percentage')}
                </span>
              </div>

              {/* Memory Usage */}
              {metrics.memoryUsage > 0 && (
                <div className='flex items-center justify-between text-xs'>
                  <span className='text-slate-400 truncate'>Memory</span>
                  <span
                    className={`font-medium ml-2 ${getStatusColor(
                      metrics.memoryUsage,
                      finalConfig.alertThresholds.memoryUsage
                    )}`}
                  >
                    {formatValue(metrics.memoryUsage, 'memory')}
                  </span>
                </div>
              )}

              {/* Connection Latency */}
              {metrics.connectionLatency >= 0 && (
                <div className='flex items-center justify-between text-xs'>
                  <span className='text-slate-400 truncate'>Latency</span>
                  <span
                    className={`font-medium ml-2 ${getStatusColor(
                      metrics.connectionLatency,
                      finalConfig.alertThresholds.connectionLatency
                    )}`}
                  >
                    {formatValue(metrics.connectionLatency, 'time')}
                  </span>
                </div>
              )}
            </div>

            {/* Active Alerts */}
            {alerts.filter(alert => !alert.resolved).length > 0 && (
              <div className='mt-2 pt-2 border-t border-slate-600'>
                <h4 className='text-red-400 font-medium mb-1 text-xs'>Active Alerts</h4>
                <div className='space-y-1 max-h-20 overflow-y-auto'>
                  {alerts
                    .filter(alert => !alert.resolved)
                    .slice(-3)
                    .map(alert => (
                      <div key={alert.id} className='text-xs text-slate-400'>
                        <span
                          className={`inline-block w-1.5 h-1.5 rounded-full mr-1.5 ${
                            alert.type === 'error' ? 'bg-red-400' : 'bg-yellow-400'
                          }`}
                        />
                        {alert.message}
                      </div>
                    ))}
                </div>
              </div>
            )}

            <div className='mt-4 text-xs text-slate-500'>
              Last updated: {new Date(metrics.lastUpdated).toLocaleTimeString()}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default PerformanceMonitor;
