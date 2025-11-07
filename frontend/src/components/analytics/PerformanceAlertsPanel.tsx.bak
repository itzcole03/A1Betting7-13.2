/**
 * Performance Alerts Panel Component
 * Displays real-time performance degradation alerts
 */

import React from 'react';
import { PerformanceAlert } from '../../types/analytics';

interface PerformanceAlertsPanelProps {
  alerts: PerformanceAlert[];
  isLoading: boolean;
  error: string | null;
  onDismissAlert: (alertId: string) => void;
  onRefresh: () => void;
}

interface AlertItemProps {
  alert: PerformanceAlert;
  onDismiss: () => void;
}

const AlertItem: React.FC<AlertItemProps> = ({ alert, onDismiss }) => {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800';
      case 'medium':
        return 'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800';
      case 'low':
        return 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800';
      default:
        return 'bg-gray-50 border-gray-200 dark:bg-gray-800 dark:border-gray-700';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'high':
        return (
          <svg
            className='w-5 h-5 text-red-600 dark:text-red-400'
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
        );
      case 'medium':
        return (
          <svg
            className='w-5 h-5 text-yellow-600 dark:text-yellow-400'
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z'
            />
          </svg>
        );
      default:
        return (
          <svg
            className='w-5 h-5 text-blue-600 dark:text-blue-400'
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
            />
          </svg>
        );
    }
  };

  const getSeverityText = (severity: string) => {
    return severity.charAt(0).toUpperCase() + severity.slice(1);
  };

  return (
    <div className={`border rounded-lg p-4 ${getSeverityColor(alert.severity)}`}>
      <div className='flex items-start justify-between'>
        <div className='flex items-start space-x-3'>
          <div className='flex-shrink-0 mt-0.5'>{getSeverityIcon(alert.severity)}</div>
          <div className='flex-1 min-w-0'>
            <div className='flex items-center space-x-2 mb-1'>
              <p className='text-sm font-medium text-gray-900 dark:text-white'>
                {alert.model_name} ({alert.sport})
              </p>
              <span
                className={`px-2 py-1 rounded-full text-xs font-medium ${
                  alert.severity === 'high'
                    ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                    : alert.severity === 'medium'
                    ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                    : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                }`}
              >
                {getSeverityText(alert.severity)}
              </span>
            </div>
            <p className='text-sm text-gray-700 dark:text-gray-300 mb-2'>{alert.description}</p>
            <div className='text-xs text-gray-600 dark:text-gray-400 space-y-1'>
              <div>
                <span className='font-medium'>Alert Type:</span> {alert.alert_type}
              </div>
              <div>
                <span className='font-medium'>Current Value:</span> {alert.current_value.toFixed(3)}
              </div>
              <div>
                <span className='font-medium'>Threshold:</span>{' '}
                {alert.threshold_exceeded.toFixed(3)}
              </div>
              <div>
                <span className='font-medium'>Time:</span>{' '}
                {new Date(alert.timestamp).toLocaleString()}
              </div>
            </div>
            {alert.recommendation && (
              <div className='mt-2 p-2 bg-gray-50 dark:bg-gray-700 rounded text-xs'>
                <span className='font-medium text-gray-900 dark:text-white'>Recommendation:</span>
                <p className='text-gray-700 dark:text-gray-300 mt-1'>{alert.recommendation}</p>
              </div>
            )}
          </div>
        </div>
        <button
          onClick={onDismiss}
          className='flex-shrink-0 ml-4 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300'
          title='Dismiss alert'
        >
          <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M6 18L18 6M6 6l12 12'
            />
          </svg>
        </button>
      </div>
    </div>
  );
};

const PerformanceAlertsPanel: React.FC<PerformanceAlertsPanelProps> = ({
  alerts,
  isLoading,
  error,
  onDismissAlert,
  onRefresh,
}) => {
  if (error) {
    return (
      <div className='bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6'>
        <div className='flex items-center justify-between mb-4'>
          <h2 className='text-xl font-semibold text-gray-900 dark:text-white'>
            Performance Alerts
          </h2>
        </div>
        <div className='text-center py-8'>
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
            Failed to Load Alerts
          </h3>
          <p className='text-gray-600 dark:text-gray-400 mb-4'>{error}</p>
          <button
            onClick={onRefresh}
            className='bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors'
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className='bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6'>
        <div className='flex items-center justify-between mb-4'>
          <h2 className='text-xl font-semibold text-gray-900 dark:text-white'>
            Performance Alerts
          </h2>
        </div>
        <div className='space-y-4'>
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className='animate-pulse border border-gray-200 dark:border-gray-700 rounded-lg p-4'
            >
              <div className='flex items-start space-x-3'>
                <div className='w-5 h-5 bg-gray-200 dark:bg-gray-700 rounded'></div>
                <div className='flex-1 space-y-2'>
                  <div className='h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4'></div>
                  <div className='h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2'></div>
                  <div className='h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3'></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (alerts.length === 0) {
    return (
      <div className='bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6'>
        <div className='flex items-center justify-between mb-4'>
          <h2 className='text-xl font-semibold text-gray-900 dark:text-white'>
            Performance Alerts
          </h2>
          <button
            onClick={onRefresh}
            className='text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            title='Refresh alerts'
          >
            <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15'
              />
            </svg>
          </button>
        </div>
        <div className='text-center py-8'>
          <div className='text-green-500 mb-4'>
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
                d='M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'
              />
            </svg>
          </div>
          <h3 className='text-lg font-semibold text-gray-900 dark:text-white mb-2'>All Clear!</h3>
          <p className='text-gray-600 dark:text-gray-400'>
            No performance alerts at this time. Your models are performing well.
          </p>
        </div>
      </div>
    );
  }

  // Group alerts by severity
  const alertsBySeverity = alerts.reduce((acc, alert) => {
    if (!acc[alert.severity]) {
      acc[alert.severity] = [];
    }
    acc[alert.severity].push(alert);
    return acc;
  }, {} as Record<string, PerformanceAlert[]>);

  const severityOrder = ['high', 'medium', 'low'];

  return (
    <div className='bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6'>
      <div className='flex items-center justify-between mb-4'>
        <h2 className='text-xl font-semibold text-gray-900 dark:text-white'>
          Performance Alerts ({alerts.length})
        </h2>
        <div className='flex items-center space-x-2'>
          <div className='flex items-center space-x-4 text-sm'>
            {Object.entries(alertsBySeverity).map(([severity, severityAlerts]) => (
              <div key={severity} className='flex items-center space-x-1'>
                <div
                  className={`w-3 h-3 rounded-full ${
                    severity === 'high'
                      ? 'bg-red-500'
                      : severity === 'medium'
                      ? 'bg-yellow-500'
                      : 'bg-blue-500'
                  }`}
                ></div>
                <span className='text-gray-600 dark:text-gray-400'>
                  {severity}: {severityAlerts.length}
                </span>
              </div>
            ))}
          </div>
          <button
            onClick={onRefresh}
            className='text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            title='Refresh alerts'
          >
            <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15'
              />
            </svg>
          </button>
        </div>
      </div>

      <div className='space-y-4'>
        {severityOrder.map(severity =>
          alertsBySeverity[severity]?.map(alert => (
            <AlertItem
              key={`${alert.model_name}-${alert.sport}-${alert.timestamp}`}
              alert={alert}
              onDismiss={() =>
                onDismissAlert(`${alert.model_name}-${alert.sport}-${alert.timestamp}`)
              }
            />
          ))
        )}
      </div>
    </div>
  );
};

export default React.memo(PerformanceAlertsPanel);
