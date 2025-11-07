/**
 * Models Performance Grid Component
 * Displays individual model performance in a responsive grid layout
 */

import React, { useMemo, useState } from 'react';
import { ModelPerformanceSnapshot } from '../../types/analytics';

interface ModelsPerformanceGridProps {
  models: ModelPerformanceSnapshot[];
  isLoading: boolean;
  error: string | null;
}

interface ModelCardProps {
  model: ModelPerformanceSnapshot;
  onClick: () => void;
}

const ModelCard: React.FC<ModelCardProps> = ({ model, onClick }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'degraded':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'offline':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400';
    }
  };

  const getROIColor = (roi: number) => {
    if (roi >= 10) return 'text-green-600 dark:text-green-400';
    if (roi >= 0) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getWinRateColor = (winRate: number) => {
    if (winRate >= 0.7) return 'text-green-600 dark:text-green-400';
    if (winRate >= 0.5) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  return (
    <div
      onClick={onClick}
      className='bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow cursor-pointer'
    >
      {/* Header */}
      <div className='flex items-center justify-between mb-4'>
        <div>
          <h3 className='text-lg font-semibold text-gray-900 dark:text-white truncate'>
            {model.model_name}
          </h3>
          <p className='text-sm text-gray-600 dark:text-gray-400'>{model.sport}</p>
        </div>
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(model.status)}`}
        >
          {model.status}
        </span>
      </div>

      {/* Key metrics */}
      <div className='grid grid-cols-2 gap-4 mb-4'>
        <div>
          <p className='text-xs text-gray-600 dark:text-gray-400'>Win Rate</p>
          <p className={`text-lg font-bold ${getWinRateColor(model.win_rate)}`}>
            {(model.win_rate * 100).toFixed(1)}%
          </p>
        </div>
        <div>
          <p className='text-xs text-gray-600 dark:text-gray-400'>ROI</p>
          <p className={`text-lg font-bold ${getROIColor(model.total_roi)}`}>
            {model.total_roi.toFixed(2)}%
          </p>
        </div>
        <div>
          <p className='text-xs text-gray-600 dark:text-gray-400'>Predictions</p>
          <p className='text-lg font-bold text-gray-900 dark:text-white'>
            {model.predictions_count}
          </p>
        </div>
        <div>
          <p className='text-xs text-gray-600 dark:text-gray-400'>Confidence</p>
          <p className='text-lg font-bold text-gray-900 dark:text-white'>
            {(model.avg_confidence * 100).toFixed(1)}%
          </p>
        </div>
      </div>

      {/* Progress bars */}
      <div className='space-y-2'>
        <div>
          <div className='flex justify-between text-xs text-gray-600 dark:text-gray-400 mb-1'>
            <span>Error Rate</span>
            <span>{(model.error_rate * 100).toFixed(1)}%</span>
          </div>
          <div className='w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2'>
            <div
              className={`h-2 rounded-full ${
                model.error_rate < 0.05
                  ? 'bg-green-500'
                  : model.error_rate < 0.15
                  ? 'bg-yellow-500'
                  : 'bg-red-500'
              }`}
              style={{ width: `${Math.min(model.error_rate * 100, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Last prediction */}
      {model.last_prediction && (
        <div className='mt-4 pt-4 border-t border-gray-200 dark:border-gray-700'>
          <p className='text-xs text-gray-600 dark:text-gray-400'>Last Prediction</p>
          <p className='text-sm text-gray-900 dark:text-white'>
            {new Date(model.last_prediction).toLocaleDateString()}
          </p>
        </div>
      )}
    </div>
  );
};

const ModelsPerformanceGrid: React.FC<ModelsPerformanceGridProps> = ({
  models,
  isLoading,
  error,
}) => {
  const [sortBy, setSortBy] = useState<'name' | 'roi' | 'winRate' | 'predictions'>('roi');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedModel, setSelectedModel] = useState<ModelPerformanceSnapshot | null>(null);

  // Sort models based on current criteria
  const sortedModels = useMemo(() => {
    return [...models].sort((a, b) => {
      let aValue: number | string;
      let bValue: number | string;

      switch (sortBy) {
        case 'name':
          aValue = a.model_name;
          bValue = b.model_name;
          break;
        case 'roi':
          aValue = a.total_roi;
          bValue = b.total_roi;
          break;
        case 'winRate':
          aValue = a.win_rate;
          bValue = b.win_rate;
          break;
        case 'predictions':
          aValue = a.predictions_count;
          bValue = b.predictions_count;
          break;
        default:
          return 0;
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortOrder === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
      }

      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
      }

      return 0;
    });
  }, [models, sortBy, sortOrder]);

  const handleSort = (newSortBy: typeof sortBy) => {
    if (sortBy === newSortBy) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(newSortBy);
      setSortOrder('desc');
    }
  };

  if (error && models.length === 0) {
    return (
      <div className='bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6'>
        <div className='text-center'>
          <div className='text-red-500 mb-2'>
            <svg
              className='w-12 h-12 mx-auto'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
              />
            </svg>
          </div>
          <h3 className='text-lg font-semibold text-gray-900 dark:text-white mb-2'>
            Failed to Load Models
          </h3>
          <p className='text-gray-600 dark:text-gray-400'>{error}</p>
        </div>
      </div>
    );
  }

  if (isLoading && models.length === 0) {
    return (
      <div className='bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6'>
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
          {[...Array(6)].map((_, i) => (
            <div key={i} className='animate-pulse'>
              <div className='h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2'></div>
              <div className='h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-4'></div>
              <div className='grid grid-cols-2 gap-4 mb-4'>
                <div className='h-8 bg-gray-200 dark:bg-gray-700 rounded'></div>
                <div className='h-8 bg-gray-200 dark:bg-gray-700 rounded'></div>
                <div className='h-8 bg-gray-200 dark:bg-gray-700 rounded'></div>
                <div className='h-8 bg-gray-200 dark:bg-gray-700 rounded'></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className='bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700'>
      {/* Header with sorting controls */}
      <div className='p-6 border-b border-gray-200 dark:border-gray-700'>
        <div className='flex items-center justify-between mb-4'>
          <h2 className='text-xl font-semibold text-gray-900 dark:text-white'>
            Model Performance ({models.length})
          </h2>
        </div>

        <div className='flex flex-wrap gap-2'>
          <button
            onClick={() => handleSort('name')}
            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
              sortBy === 'name'
                ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            Name {sortBy === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
          </button>
          <button
            onClick={() => handleSort('roi')}
            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
              sortBy === 'roi'
                ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            ROI {sortBy === 'roi' && (sortOrder === 'asc' ? '↑' : '↓')}
          </button>
          <button
            onClick={() => handleSort('winRate')}
            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
              sortBy === 'winRate'
                ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            Win Rate {sortBy === 'winRate' && (sortOrder === 'asc' ? '↑' : '↓')}
          </button>
          <button
            onClick={() => handleSort('predictions')}
            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
              sortBy === 'predictions'
                ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            Predictions {sortBy === 'predictions' && (sortOrder === 'asc' ? '↑' : '↓')}
          </button>
        </div>
      </div>

      {/* Models grid */}
      <div className='p-6'>
        {sortedModels.length === 0 ? (
          <div className='text-center py-12'>
            <div className='text-gray-400 mb-4'>
              <svg
                className='w-16 h-16 mx-auto'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z'
                />
              </svg>
            </div>
            <h3 className='text-lg font-semibold text-gray-900 dark:text-white mb-2'>
              No Models Found
            </h3>
            <p className='text-gray-600 dark:text-gray-400'>
              There are no models matching your current filters.
            </p>
          </div>
        ) : (
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
            {sortedModels.map(model => (
              <ModelCard
                key={`${model.model_name}-${model.sport}`}
                model={model}
                onClick={() => setSelectedModel(model)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default React.memo(ModelsPerformanceGrid);
