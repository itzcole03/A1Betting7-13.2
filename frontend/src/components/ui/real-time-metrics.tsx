import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export interface MetricDataPoint {
  timestamp: Date;
  value: number;
  label?: string;
}

export interface RealTimeMetric {
  id: string;
  name: string;
  value: number;
  unit: string;
  change: number;
  changeType: 'increase' | 'decrease' | 'stable';
  history: MetricDataPoint[];
  threshold?: {
    warning: number;
    critical: number;
  };
  color?: string;
  icon?: React.ReactNode;
}

export interface RealTimeMetricsProps {
  metrics?: RealTimeMetric[];
  variant?: 'default' | 'cyber' | 'minimal' | 'dashboard';
  className?: string;
  updateInterval?: number;
  showHistory?: boolean;
  showSparklines?: boolean;
  showAlerts?: boolean;
  maxDataPoints?: number;
  onMetricClick?: (metric: RealTimeMetric) => void;
  onAlert?: (metric: RealTimeMetric, level: 'warning' | 'critical') => void;
  isLive?: boolean;
}

const RealTimeMetrics: React.FC<RealTimeMetricsProps> = ({
  metrics = [],
  variant = 'default',
  className = '',
  updateInterval = 5000,
  showHistory = true,
  showSparklines = true,
  showAlerts = true,
  maxDataPoints = 50,
  onMetricClick,
  onAlert,
  isLive = true,
}) => {
  const [currentMetrics, setCurrentMetrics] = useState<RealTimeMetric[]>([]);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const defaultMetrics: RealTimeMetric[] =
    metrics.length > 0
      ? metrics
      : [
          {
            id: 'active-bets',
            name: 'Active Bets',
            value: 1247,
            unit: '',
            change: 12.3,
            changeType: 'increase',
            history: [],
            threshold: { warning: 1500, critical: 2000 },
            color: '#10b981',
            icon: (
              <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1'
                />
              </svg>
            ),
          },
          {
            id: 'revenue-rate',
            name: 'Revenue Rate',
            value: 847.5,
            unit: '$/min',
            change: -2.1,
            changeType: 'decrease',
            history: [],
            threshold: { warning: 500, critical: 300 },
            color: '#3b82f6',
            icon: (
              <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M13 7h8m0 0v8m0-8l-8 8-4-4-6 6'
                />
              </svg>
            ),
          },
          {
            id: 'api-requests',
            name: 'API Requests',
            value: 34567,
            unit: '/min',
            change: 8.7,
            changeType: 'increase',
            history: [],
            threshold: { warning: 40000, critical: 50000 },
            color: '#8b5cf6',
            icon: (
              <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z'
                />
              </svg>
            ),
          },
          {
            id: 'user-sessions',
            name: 'Active Sessions',
            value: 5432,
            unit: '',
            change: 15.2,
            changeType: 'increase',
            history: [],
            threshold: { warning: 7000, critical: 10000 },
            color: '#f59e0b',
            icon: (
              <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z'
                />
              </svg>
            ),
          },
          {
            id: 'system-load',
            name: 'System Load',
            value: 67.8,
            unit: '%',
            change: 5.4,
            changeType: 'increase',
            history: [],
            threshold: { warning: 75, critical: 90 },
            color: '#ef4444',
            icon: (
              <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z'
                />
              </svg>
            ),
          },
          {
            id: 'error-rate',
            name: 'Error Rate',
            value: 0.34,
            unit: '%',
            change: -0.12,
            changeType: 'decrease',
            history: [],
            threshold: { warning: 1.0, critical: 2.5 },
            color: '#14b8a6',
            icon: (
              <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z'
                />
              </svg>
            ),
          },
        ];

  // Initialize metrics with history
  useEffect(() => {
    const initialMetrics = defaultMetrics.map(metric => ({
      ...metric,
      history: Array.from({ length: 10 }, (_, i) => ({
        timestamp: new Date(Date.now() - (9 - i) * 60000),
        value: metric.value + (Math.random() - 0.5) * metric.value * 0.2,
      })),
    }));
    setCurrentMetrics(initialMetrics);
  }, []);

  // Simulate real-time updates
  useEffect(() => {
    if (!isLive) return;

    intervalRef.current = setInterval(() => {
      setCurrentMetrics(prevMetrics =>
        prevMetrics.map(metric => {
          const variation = (Math.random() - 0.5) * 0.1;
          const newValue = Math.max(0, metric.value * (1 + variation));
          const change = ((newValue - metric.value) / metric.value) * 100;

          const newDataPoint: MetricDataPoint = {
            timestamp: new Date(),
            value: newValue,
          };

          const updatedHistory = [...metric.history, newDataPoint].slice(-maxDataPoints);

          const updatedMetric = {
            ...metric,
            value: newValue,
            change: change,
            changeType:
              change > 0.1
                ? ('increase' as const)
                : change < -0.1
                  ? ('decrease' as const)
                  : ('stable' as const),
            history: updatedHistory,
          };

          // Check thresholds and trigger alerts
          if (showAlerts && metric.threshold && onAlert) {
            if (newValue >= metric.threshold.critical) {
              onAlert(updatedMetric, 'critical');
            } else if (newValue >= metric.threshold.warning) {
              onAlert(updatedMetric, 'warning');
            }
          }

          return updatedMetric;
        })
      );
      setLastUpdate(new Date());
    }, updateInterval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isLive, updateInterval, maxDataPoints, showAlerts, onAlert]);

  const getStatusColor = (metric: RealTimeMetric) => {
    if (!metric.threshold) return metric.color || '#6b7280';

    if (metric.value >= metric.threshold.critical) {
      return variant === 'cyber' ? '#ff0044' : '#ef4444';
    }
    if (metric.value >= metric.threshold.warning) {
      return variant === 'cyber' ? '#ffaa00' : '#f59e0b';
    }
    return metric.color || (variant === 'cyber' ? '#00ff88' : '#10b981');
  };

  const formatValue = (value: number, unit: string) => {
    let formattedValue = value;
    let suffix = '';

    if (value >= 1000000) {
      formattedValue = value / 1000000;
      suffix = 'M';
    } else if (value >= 1000) {
      formattedValue = value / 1000;
      suffix = 'K';
    }

    const precision = unit === '%' || value < 10 ? 1 : 0;
    return `${formattedValue.toFixed(precision)}${suffix}${unit}`;
  };

  const renderSparkline = (history: MetricDataPoint[], color: string) => {
    if (!showSparklines || history.length < 2) return null;

    const width = 60;
    const height = 20;
    const values = history.map(point => point.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;

    const points = values
      .map((value, index) => {
        const x = (index / (values.length - 1)) * width;
        const y = height - ((value - min) / range) * height;
        return `${x},${y}`;
      })
      .join(' ');

    return (
      <svg width={width} height={height} className='opacity-70'>
        <polyline
          points={points}
          fill='none'
          stroke={color}
          strokeWidth='1.5'
          className='transition-all duration-300'
        />
      </svg>
    );
  };

  const baseClasses = `
    ${variant === 'dashboard' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-4'}
    ${className}
  `;

  return (
    <div className={baseClasses}>
      {/* Header */}
      <div
        className={`flex items-center justify-between mb-6 ${
          variant === 'dashboard' ? 'col-span-full' : ''
        }`}
      >
        <h2
          className={`text-xl font-bold ${
            variant === 'cyber' ? 'text-cyan-400' : 'text-gray-900 dark:text-white'
          }`}
        >
          {variant === 'cyber' ? 'REAL-TIME METRICS' : 'Live Metrics'}
        </h2>

        <div className='flex items-center space-x-4'>
          {isLive && (
            <div
              className={`flex items-center space-x-2 px-3 py-1 rounded-full ${
                variant === 'cyber'
                  ? 'bg-cyan-400/10 border border-cyan-400/30'
                  : 'bg-green-100 dark:bg-green-900/30'
              }`}
            >
              <div
                className={`w-2 h-2 rounded-full animate-pulse ${
                  variant === 'cyber' ? 'bg-cyan-400' : 'bg-green-500'
                }`}
              />
              <span
                className={`text-xs font-medium ${
                  variant === 'cyber' ? 'text-cyan-400' : 'text-green-700 dark:text-green-400'
                }`}
              >
                Live
              </span>
            </div>
          )}

          <span className={`text-xs ${variant === 'cyber' ? 'text-cyan-300/70' : 'text-gray-500'}`}>
            Updated: {lastUpdate.toLocaleTimeString()}
          </span>
        </div>
      </div>

      {/* Metric Cards */}
      <AnimatePresence>
        {currentMetrics.map((metric, index) => (
          <motion.div
            key={metric.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ delay: index * 0.05 }}
            className={`p-4 rounded-lg border cursor-pointer transition-all duration-200 ${
              variant === 'cyber'
                ? 'bg-black border-cyan-400/30 hover:border-cyan-400/50 hover:shadow-lg hover:shadow-cyan-400/20'
                : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:shadow-lg hover:border-gray-300 dark:hover:border-gray-600'
            }`}
            onClick={() => onMetricClick?.(metric)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {/* Cyber grid overlay */}
            {variant === 'cyber' && (
              <div className='absolute inset-0 opacity-10 pointer-events-none'>
                <div className='grid grid-cols-6 grid-rows-4 h-full w-full'>
                  {Array.from({ length: 24 }).map((_, i) => (
                    <div key={i} className='border border-cyan-400/20' />
                  ))}
                </div>
              </div>
            )}

            <div className='relative z-10'>
              {/* Header */}
              <div className='flex items-center justify-between mb-2'>
                <div className='flex items-center space-x-2'>
                  {metric.icon && (
                    <div
                      className='p-1 rounded'
                      style={{ backgroundColor: `${getStatusColor(metric)}20` }}
                    >
                      <div style={{ color: getStatusColor(metric) }}>{metric.icon}</div>
                    </div>
                  )}
                  <h3
                    className={`font-medium text-sm ${
                      variant === 'cyber' ? 'text-cyan-300' : 'text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    {metric.name}
                  </h3>
                </div>

                {renderSparkline(metric.history, getStatusColor(metric))}
              </div>

              {/* Value */}
              <div className='mb-2'>
                <motion.span
                  className={`text-2xl font-bold ${
                    variant === 'cyber' ? 'text-cyan-400' : 'text-gray-900 dark:text-white'
                  }`}
                  key={metric.value}
                  initial={{ scale: 1.1 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.2 }}
                >
                  {formatValue(metric.value, metric.unit)}
                </motion.span>
              </div>

              {/* Change */}
              <div className='flex items-center space-x-2'>
                <div
                  className={`flex items-center space-x-1 ${
                    metric.changeType === 'increase'
                      ? 'text-green-500'
                      : metric.changeType === 'decrease'
                        ? 'text-red-500'
                        : variant === 'cyber'
                          ? 'text-cyan-400/70'
                          : 'text-gray-500'
                  }`}
                >
                  {metric.changeType === 'increase' && (
                    <svg className='w-3 h-3' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M7 17l9.2-9.2M17 17V7H7'
                      />
                    </svg>
                  )}
                  {metric.changeType === 'decrease' && (
                    <svg className='w-3 h-3' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M17 7l-9.2 9.2M7 7v10h10'
                      />
                    </svg>
                  )}
                  {metric.changeType === 'stable' && (
                    <svg className='w-3 h-3' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M20 12H4'
                      />
                    </svg>
                  )}
                  <span className='text-xs font-medium'>
                    {metric.change > 0 ? '+' : ''}
                    {metric.change.toFixed(1)}%
                  </span>
                </div>

                {/* Threshold indicator */}
                {metric.threshold && (
                  <div
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      metric.value >= metric.threshold.critical
                        ? variant === 'cyber'
                          ? 'bg-red-500/20 text-red-400'
                          : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                        : metric.value >= metric.threshold.warning
                          ? variant === 'cyber'
                            ? 'bg-yellow-500/20 text-yellow-400'
                            : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                          : variant === 'cyber'
                            ? 'bg-green-500/20 text-green-400'
                            : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                    }`}
                  >
                    {metric.value >= metric.threshold.critical
                      ? 'Critical'
                      : metric.value >= metric.threshold.warning
                        ? 'Warning'
                        : 'Normal'}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default RealTimeMetrics;
