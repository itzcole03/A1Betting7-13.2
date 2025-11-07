/**
 * Dashboard Filters Panel Component
 * Provides filtering and customization controls for the analytics dashboard
 */

import React, { useState } from 'react';

export interface DashboardFilters {
  sports: string[];
  timeRange: string;
  modelTypes: string[];
  performanceThreshold: number;
  showOnlyAlerts: boolean;
  confidenceMin: number;
}

interface DashboardFiltersPanelProps {
  filters: DashboardFilters;
  onFiltersChange: (filters: DashboardFilters) => void;
  availableSports: string[];
  availableModelTypes: string[];
  onResetFilters: () => void;
  onExportData: () => void;
  isExpanded: boolean;
  onToggleExpand: () => void;
}

const DashboardFiltersPanel: React.FC<DashboardFiltersPanelProps> = ({
  filters,
  onFiltersChange,
  availableSports,
  availableModelTypes,
  onResetFilters,
  onExportData,
  isExpanded,
  onToggleExpand,
}) => {
  const [tempFilters, setTempFilters] = useState<DashboardFilters>(filters);

  const applyFilters = () => {
    onFiltersChange(tempFilters);
  };

  const resetFilters = () => {
    onResetFilters();
    setTempFilters({
      sports: [],
      timeRange: '7d',
      modelTypes: [],
      performanceThreshold: 0,
      showOnlyAlerts: false,
      confidenceMin: 0,
    });
  };

  const updateTempFilter = <K extends keyof DashboardFilters>(
    key: K,
    value: DashboardFilters[K]
  ) => {
    setTempFilters(prev => ({ ...prev, [key]: value }));
  };

  const toggleSport = (sport: string) => {
    const newSports = tempFilters.sports.includes(sport)
      ? tempFilters.sports.filter(s => s !== sport)
      : [...tempFilters.sports, sport];
    updateTempFilter('sports', newSports);
  };

  const toggleModelType = (modelType: string) => {
    const newModelTypes = tempFilters.modelTypes.includes(modelType)
      ? tempFilters.modelTypes.filter(m => m !== modelType)
      : [...tempFilters.modelTypes, modelType];
    updateTempFilter('modelTypes', newModelTypes);
  };

  const hasActiveFilters = () => {
    return (
      tempFilters.sports.length > 0 ||
      tempFilters.modelTypes.length > 0 ||
      tempFilters.timeRange !== '7d' ||
      tempFilters.performanceThreshold > 0 ||
      tempFilters.showOnlyAlerts ||
      tempFilters.confidenceMin > 0
    );
  };

  return (
    <div className='bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700'>
      {/* Header */}
      <div className='flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700'>
        <div className='flex items-center space-x-2'>
          <h3 className='text-lg font-semibold text-gray-900 dark:text-white'>Dashboard Filters</h3>
          {hasActiveFilters() && (
            <span className='bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 px-2 py-1 rounded-full text-xs font-medium'>
              {[
                tempFilters.sports.length,
                tempFilters.modelTypes.length,
                tempFilters.timeRange !== '7d' ? 1 : 0,
                tempFilters.performanceThreshold > 0 ? 1 : 0,
                tempFilters.showOnlyAlerts ? 1 : 0,
                tempFilters.confidenceMin > 0 ? 1 : 0,
              ].reduce((a, b) => a + b, 0)}{' '}
              active
            </span>
          )}
        </div>
        <div className='flex items-center space-x-2'>
          <button
            onClick={onExportData}
            className='text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            title='Export dashboard data'
          >
            <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
              />
            </svg>
          </button>
          <button
            onClick={onToggleExpand}
            className='text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            title={isExpanded ? 'Collapse filters' : 'Expand filters'}
          >
            <svg
              className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
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
          </button>
        </div>
      </div>

      {/* Filter Content */}
      {isExpanded && (
        <div className='p-4 space-y-6'>
          {/* Time Range */}
          <div>
            <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
              Time Range
            </label>
            <div className='grid grid-cols-2 md:grid-cols-4 gap-2'>
              {[
                { value: '1d', label: '24 Hours' },
                { value: '7d', label: '7 Days' },
                { value: '30d', label: '30 Days' },
                { value: '90d', label: '90 Days' },
              ].map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => updateTempFilter('timeRange', value)}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    tempFilters.timeRange === value
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Sports Filter */}
          <div>
            <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
              Sports ({tempFilters.sports.length} selected)
            </label>
            <div className='grid grid-cols-2 md:grid-cols-4 gap-2'>
              {availableSports.map(sport => (
                <label key={sport} className='flex items-center space-x-2 cursor-pointer'>
                  <input
                    type='checkbox'
                    checked={tempFilters.sports.includes(sport)}
                    onChange={() => toggleSport(sport)}
                    className='rounded border-gray-300 text-blue-600 focus:ring-blue-500'
                  />
                  <span className='text-sm text-gray-700 dark:text-gray-300'>{sport}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Model Types Filter */}
          <div>
            <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
              Model Types ({tempFilters.modelTypes.length} selected)
            </label>
            <div className='grid grid-cols-1 md:grid-cols-3 gap-2'>
              {availableModelTypes.map(modelType => (
                <label key={modelType} className='flex items-center space-x-2 cursor-pointer'>
                  <input
                    type='checkbox'
                    checked={tempFilters.modelTypes.includes(modelType)}
                    onChange={() => toggleModelType(modelType)}
                    className='rounded border-gray-300 text-blue-600 focus:ring-blue-500'
                  />
                  <span className='text-sm text-gray-700 dark:text-gray-300'>{modelType}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Performance Threshold */}
          <div>
            <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
              Minimum Performance Threshold: {tempFilters.performanceThreshold}%
            </label>
            <input
              type='range'
              min='0'
              max='100'
              value={tempFilters.performanceThreshold}
              onChange={e => updateTempFilter('performanceThreshold', parseInt(e.target.value))}
              className='w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700'
            />
            <div className='flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1'>
              <span>0%</span>
              <span>50%</span>
              <span>100%</span>
            </div>
          </div>

          {/* Confidence Threshold */}
          <div>
            <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
              Minimum Confidence: {tempFilters.confidenceMin}%
            </label>
            <input
              type='range'
              min='0'
              max='100'
              value={tempFilters.confidenceMin}
              onChange={e => updateTempFilter('confidenceMin', parseInt(e.target.value))}
              className='w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700'
            />
            <div className='flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1'>
              <span>0%</span>
              <span>50%</span>
              <span>100%</span>
            </div>
          </div>

          {/* Toggle Filters */}
          <div className='space-y-3'>
            <label className='flex items-center space-x-2 cursor-pointer'>
              <input
                type='checkbox'
                checked={tempFilters.showOnlyAlerts}
                onChange={e => updateTempFilter('showOnlyAlerts', e.target.checked)}
                className='rounded border-gray-300 text-blue-600 focus:ring-blue-500'
              />
              <span className='text-sm text-gray-700 dark:text-gray-300'>
                Show only models with alerts
              </span>
            </label>
          </div>

          {/* Action Buttons */}
          <div className='flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700'>
            <button
              onClick={resetFilters}
              className='px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md transition-colors'
              disabled={!hasActiveFilters()}
            >
              Reset Filters
            </button>
            <div className='space-x-3'>
              <button
                onClick={() => setTempFilters(filters)}
                className='px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md transition-colors'
              >
                Cancel
              </button>
              <button
                onClick={applyFilters}
                className='px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors'
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default React.memo(DashboardFiltersPanel);
