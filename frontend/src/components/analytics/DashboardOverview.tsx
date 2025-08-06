/**
 * Dashboard Overview Component
 * Displays key metrics and statistics overview
 */

import React from 'react';
import { SportSummary } from '../../types/analytics';

interface DashboardOverviewProps {
  stats: {
    totalModels: number;
    healthyModels: number;
    totalPredictions: number;
    averageROI: number;
    totalAlerts: number;
  };
  sportsBreakdown: Record<string, SportSummary>;
  isLoading: boolean;
}

const MetricCard: React.FC<{
  title: string;
  value: string | number;
  change?: number;
  icon: React.ReactNode;
  color?: 'blue' | 'green' | 'red' | 'yellow';
}> = ({ title, value, change, icon, color = 'blue' }) => {
  const colorClasses = {
    blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
    green: 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400',
    red: 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400',
    yellow: 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400',
  };

  return (
    <div className='bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6'>
      <div className='flex items-center justify-between'>
        <div className='flex-1'>
          <p className='text-sm font-medium text-gray-600 dark:text-gray-400'>{title}</p>
          <p className='text-2xl font-bold text-gray-900 dark:text-white mt-1'>{value}</p>
          {change !== undefined && (
            <p className={`text-sm mt-1 ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {change >= 0 ? '+' : ''}
              {change.toFixed(1)}%
            </p>
          )}
        </div>
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>{icon}</div>
      </div>
    </div>
  );
};

const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  stats,
  sportsBreakdown,
  isLoading,
}) => {
  if (isLoading) {
    return (
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className='bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6'
          >
            <div className='animate-pulse'>
              <div className='h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2'></div>
              <div className='h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-2'></div>
              <div className='h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/4'></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  const healthPercentage =
    stats.totalModels > 0 ? (stats.healthyModels / stats.totalModels) * 100 : 0;

  return (
    <div className='space-y-6'>
      {/* Key metrics cards */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
        <MetricCard
          title='Total Models'
          value={stats.totalModels}
          icon={
            <svg className='w-6 h-6' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z'
              />
            </svg>
          }
        />

        <MetricCard
          title='Healthy Models'
          value={`${stats.healthyModels} (${healthPercentage.toFixed(1)}%)`}
          color={healthPercentage >= 80 ? 'green' : healthPercentage >= 60 ? 'yellow' : 'red'}
          icon={
            <svg className='w-6 h-6' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'
              />
            </svg>
          }
        />

        <MetricCard
          title='Total Predictions'
          value={stats.totalPredictions.toLocaleString()}
          icon={
            <svg className='w-6 h-6' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M13 7h8m0 0v8m0-8l-8 8-4-4-6 6'
              />
            </svg>
          }
        />

        <MetricCard
          title='Average ROI'
          value={`${stats.averageROI.toFixed(2)}%`}
          color={stats.averageROI >= 10 ? 'green' : stats.averageROI >= 0 ? 'yellow' : 'red'}
          icon={
            <svg className='w-6 h-6' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1'
              />
            </svg>
          }
        />
      </div>

      {/* Sports breakdown */}
      {Object.keys(sportsBreakdown).length > 0 && (
        <div className='bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6'>
          <h3 className='text-lg font-semibold text-gray-900 dark:text-white mb-4'>
            Sports Performance Breakdown
          </h3>
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
            {Object.entries(sportsBreakdown).map(([sport, data]) => (
              <div
                key={sport}
                className='border border-gray-200 dark:border-gray-700 rounded-lg p-4'
              >
                <h4 className='font-medium text-gray-900 dark:text-white mb-2'>{sport}</h4>
                <div className='space-y-1 text-sm'>
                  <div className='flex justify-between'>
                    <span className='text-gray-600 dark:text-gray-400'>Models:</span>
                    <span className='font-medium text-gray-900 dark:text-white'>
                      {data.models_count}
                    </span>
                  </div>
                  <div className='flex justify-between'>
                    <span className='text-gray-600 dark:text-gray-400'>Win Rate:</span>
                    <span
                      className={`font-medium ${
                        data.avg_win_rate >= 0.7
                          ? 'text-green-600'
                          : data.avg_win_rate >= 0.5
                          ? 'text-yellow-600'
                          : 'text-red-600'
                      }`}
                    >
                      {(data.avg_win_rate * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className='flex justify-between'>
                    <span className='text-gray-600 dark:text-gray-400'>ROI:</span>
                    <span
                      className={`font-medium ${
                        data.avg_roi >= 10
                          ? 'text-green-600'
                          : data.avg_roi >= 0
                          ? 'text-yellow-600'
                          : 'text-red-600'
                      }`}
                    >
                      {data.avg_roi.toFixed(2)}%
                    </span>
                  </div>
                  <div className='flex justify-between'>
                    <span className='text-gray-600 dark:text-gray-400'>Predictions:</span>
                    <span className='font-medium text-gray-900 dark:text-white'>
                      {data.total_predictions}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default React.memo(DashboardOverview);
