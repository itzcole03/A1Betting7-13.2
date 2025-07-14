import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export interface MLModel {
  id: string;
  name: string;
  type: 'prediction' | 'classification' | 'regression' | 'clustering';
  status: 'training' | 'ready' | 'error' | 'updating' | 'offline';
  accuracy: number;
  lastTrained: Date;
  version: string;
  confidence: number;
  predictions: number;
  errorRate: number;
}

export interface MLStatusIndicatorsProps {
  models?: MLModel[];
  variant?: 'default' | 'cyber' | 'minimal' | 'grid';
  className?: string;
  showMetrics?: boolean;
  showDetails?: boolean;
  realTimeUpdates?: boolean;
  onModelClick?: (model: MLModel) => void;
  onRetrain?: (modelId: string) => void;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

const MLStatusIndicators: React.FC<MLStatusIndicatorsProps> = ({
  models = [],
  variant = 'default',
  className = '',
  showMetrics = true,
  showDetails = false,
  realTimeUpdates = false,
  onModelClick,
  onRetrain,
  autoRefresh = false,
  refreshInterval = 30000,
}) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);

  const defaultModels: MLModel[] =
    models.length > 0
      ? models
      : [
          {
            id: 'betting-predictor',
            name: 'Betting Outcome Predictor',
            type: 'prediction',
            status: 'ready',
            accuracy: 87.4,
            lastTrained: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
            version: '2.1.3',
            confidence: 92.1,
            predictions: 15432,
            errorRate: 0.031,
          },
          {
            id: 'risk-classifier',
            name: 'Risk Assessment Classifier',
            type: 'classification',
            status: 'ready',
            accuracy: 94.2,
            lastTrained: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
            version: '1.8.7',
            confidence: 88.5,
            predictions: 8921,
            errorRate: 0.018,
          },
          {
            id: 'market-analyzer',
            name: 'Market Trend Analyzer',
            type: 'regression',
            status: 'training',
            accuracy: 91.8,
            lastTrained: new Date(Date.now() - 12 * 60 * 60 * 1000), // 12 hours ago
            version: '3.0.1',
            confidence: 85.3,
            predictions: 23567,
            errorRate: 0.045,
          },
          {
            id: 'anomaly-detector',
            name: 'Anomaly Detection System',
            type: 'clustering',
            status: 'error',
            accuracy: 76.9,
            lastTrained: new Date(Date.now() - 24 * 60 * 60 * 1000), // 24 hours ago
            version: '1.5.2',
            confidence: 72.4,
            predictions: 5432,
            errorRate: 0.089,
          },
          {
            id: 'odds-optimizer',
            name: 'Odds Optimization Engine',
            type: 'prediction',
            status: 'updating',
            accuracy: 89.1,
            lastTrained: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
            version: '2.3.0',
            confidence: 90.7,
            predictions: 18234,
            errorRate: 0.025,
          },
        ];

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        setCurrentTime(new Date());
        setIsRefreshing(true);
        setTimeout(() => setIsRefreshing(false), 1000);
      }, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ready':
        return variant === 'cyber' ? '#00ff88' : '#10b981';
      case 'training':
        return variant === 'cyber' ? '#0088ff' : '#3b82f6';
      case 'updating':
        return variant === 'cyber' ? '#ffaa00' : '#f59e0b';
      case 'error':
        return variant === 'cyber' ? '#ff0044' : '#ef4444';
      case 'offline':
        return variant === 'cyber' ? '#666' : '#6b7280';
      default:
        return variant === 'cyber' ? '#666' : '#6b7280';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'prediction':
        return (
          <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z'
            />
          </svg>
        );
      case 'classification':
        return (
          <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10'
            />
          </svg>
        );
      case 'regression':
        return (
          <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M7 12l3-3 3 3 4-4'
            />
          </svg>
        );
      case 'clustering':
        return (
          <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z'
            />
          </svg>
        );
      default:
        return (
          <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'
            />
          </svg>
        );
    }
  };

  const getTimeAgo = (date: Date) => {
    const diff = currentTime.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0) {
      return `${hours}h ago`;
    }
    return `${minutes}m ago`;
  };

  const baseClasses = `
    ${variant === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-4'}
    ${className}
  `;

  const cardClasses = `
    p-4 rounded-lg border transition-all duration-200
    ${
      variant === 'cyber'
        ? 'bg-black border-cyan-400/30 hover:border-cyan-400/50 hover:shadow-lg hover:shadow-cyan-400/20'
        : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-lg'
    }
  `;

  return (
    <div className={baseClasses}>
      {/* Header */}
      <div
        className={`flex items-center justify-between mb-4 ${
          variant === 'grid' ? 'col-span-full' : ''
        }`}
      >
        <h2
          className={`text-xl font-bold ${
            variant === 'cyber' ? 'text-cyan-400' : 'text-gray-900 dark:text-white'
          }`}
        >
          {variant === 'cyber' ? 'ML SYSTEM STATUS' : 'ML Model Status'}
        </h2>

        {realTimeUpdates && (
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
      </div>

      {/* Model Cards */}
      <AnimatePresence>
        {defaultModels.map((model, index) => (
          <motion.div
            key={model.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ delay: index * 0.1 }}
            className={cardClasses}
            onClick={() => onModelClick?.(model)}
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
              <div className='flex items-start justify-between mb-3'>
                <div className='flex items-center space-x-3'>
                  <div
                    className={`p-2 rounded ${
                      variant === 'cyber' ? 'bg-cyan-400/20' : 'bg-gray-100 dark:bg-gray-700'
                    }`}
                  >
                    <div
                      className={
                        variant === 'cyber' ? 'text-cyan-400' : 'text-gray-600 dark:text-gray-400'
                      }
                    >
                      {getTypeIcon(model.type)}
                    </div>
                  </div>
                  <div>
                    <h3
                      className={`font-semibold ${
                        variant === 'cyber' ? 'text-cyan-300' : 'text-gray-900 dark:text-white'
                      }`}
                    >
                      {model.name}
                    </h3>
                    <p
                      className={`text-sm capitalize ${
                        variant === 'cyber'
                          ? 'text-cyan-400/70'
                          : 'text-gray-600 dark:text-gray-400'
                      }`}
                    >
                      {model.type} • v{model.version}
                    </p>
                  </div>
                </div>

                <div className='flex items-center space-x-2'>
                  <div
                    className='w-3 h-3 rounded-full'
                    style={{ backgroundColor: getStatusColor(model.status) }}
                  />
                  <span
                    className={`text-sm font-medium capitalize ${
                      variant === 'cyber' ? 'text-cyan-400' : 'text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    {model.status}
                  </span>
                </div>
              </div>

              {/* Metrics */}
              {showMetrics && (
                <div className='grid grid-cols-2 gap-3 mb-3'>
                  <div>
                    <span
                      className={`text-xs font-medium ${
                        variant === 'cyber' ? 'text-cyan-400' : 'text-gray-600 dark:text-gray-400'
                      }`}
                    >
                      Accuracy
                    </span>
                    <div
                      className={`text-lg font-bold ${
                        variant === 'cyber' ? 'text-cyan-300' : 'text-gray-900 dark:text-white'
                      }`}
                    >
                      {model.accuracy.toFixed(1)}%
                    </div>
                  </div>

                  <div>
                    <span
                      className={`text-xs font-medium ${
                        variant === 'cyber' ? 'text-cyan-400' : 'text-gray-600 dark:text-gray-400'
                      }`}
                    >
                      Confidence
                    </span>
                    <div
                      className={`text-lg font-bold ${
                        variant === 'cyber' ? 'text-cyan-300' : 'text-gray-900 dark:text-white'
                      }`}
                    >
                      {model.confidence.toFixed(1)}%
                    </div>
                  </div>

                  <div>
                    <span
                      className={`text-xs font-medium ${
                        variant === 'cyber' ? 'text-cyan-400' : 'text-gray-600 dark:text-gray-400'
                      }`}
                    >
                      Predictions
                    </span>
                    <div
                      className={`text-lg font-bold ${
                        variant === 'cyber' ? 'text-cyan-300' : 'text-gray-900 dark:text-white'
                      }`}
                    >
                      {model.predictions.toLocaleString()}
                    </div>
                  </div>

                  <div>
                    <span
                      className={`text-xs font-medium ${
                        variant === 'cyber' ? 'text-cyan-400' : 'text-gray-600 dark:text-gray-400'
                      }`}
                    >
                      Error Rate
                    </span>
                    <div
                      className={`text-lg font-bold ${
                        model.errorRate > 0.05 ? 'text-red-500' : 'text-green-500'
                      }`}
                    >
                      {(model.errorRate * 100).toFixed(2)}%
                    </div>
                  </div>
                </div>
              )}

              {/* Details */}
              {showDetails && (
                <div className='mb-3 pt-3 border-t border-gray-200 dark:border-gray-700'>
                  <div className='flex justify-between text-sm'>
                    <span className={variant === 'cyber' ? 'text-cyan-400/70' : 'text-gray-500'}>
                      Last Trained:
                    </span>
                    <span
                      className={
                        variant === 'cyber' ? 'text-cyan-300' : 'text-gray-700 dark:text-gray-300'
                      }
                    >
                      {getTimeAgo(model.lastTrained)}
                    </span>
                  </div>
                </div>
              )}

              {/* Actions */}
              {(model.status === 'error' || model.status === 'offline') && onRetrain && (
                <button
                  onClick={e => {
                    e.stopPropagation();
                    onRetrain(model.id);
                  }}
                  className={`w-full py-2 px-4 rounded font-medium text-sm transition-all ${
                    variant === 'cyber'
                      ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50 hover:bg-cyan-500/30'
                      : 'bg-blue-100 text-blue-700 border border-blue-200 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-400'
                  }`}
                >
                  {variant === 'cyber' ? 'RETRAIN MODEL' : 'Retrain Model'}
                </button>
              )}

              {/* Loading animation for training/updating */}
              {(model.status === 'training' || model.status === 'updating') && (
                <div className='mt-3'>
                  <div
                    className={`w-full rounded-full h-2 ${
                      variant === 'cyber' ? 'bg-gray-800' : 'bg-gray-200 dark:bg-gray-700'
                    }`}
                  >
                    <motion.div
                      className={`h-2 rounded-full ${
                        model.status === 'training' ? 'bg-blue-500' : 'bg-yellow-500'
                      }`}
                      initial={{ width: '0%' }}
                      animate={{ width: '100%' }}
                      transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                    />
                  </div>
                  <p
                    className={`text-xs mt-1 ${
                      variant === 'cyber' ? 'text-cyan-400/70' : 'text-gray-500'
                    }`}
                  >
                    {model.status === 'training' ? 'Training in progress...' : 'Updating model...'}
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Refresh indicator */}
      <AnimatePresence>
        {isRefreshing && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className={`fixed top-4 right-4 p-2 rounded-full ${
              variant === 'cyber'
                ? 'bg-cyan-500/20 border border-cyan-500/50'
                : 'bg-blue-100 border border-blue-200'
            }`}
          >
            <div
              className={`animate-spin rounded-full h-4 w-4 border-2 border-transparent ${
                variant === 'cyber' ? 'border-t-cyan-400' : 'border-t-blue-500'
              }`}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MLStatusIndicators;
