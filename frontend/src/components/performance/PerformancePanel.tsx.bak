import React from 'react';

export interface PerformancePanelProps {
  connectionHealth: {
    status: 'healthy' | 'degraded' | 'error';
    latency: number;
    lastCheck: Date;
  };
  performanceMetrics?: {
    [key: string]: number;
  };
}

/**
 * PerformancePanel Component - Displays system performance and connection health
 */
export const PerformancePanel: React.FC<PerformancePanelProps> = ({
  connectionHealth,
  performanceMetrics = {},
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'text-green-600 bg-green-100';
      case 'degraded':
        return 'text-yellow-600 bg-yellow-100';
      case 'error':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const formatLatency = (latency: number) => {
    return latency > 0 ? `${latency.toFixed(0)}ms` : 'N/A';
  };

  return (
    <div className='performance-panel bg-white rounded-lg shadow-sm border p-4 mb-6'>
      <div className='flex items-center justify-between'>
        {/* Connection Status */}
        <div className='flex items-center space-x-4'>
          <div className='flex items-center space-x-2'>
            <span className='text-sm font-medium text-gray-700'>Status:</span>
            <span
              className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                connectionHealth.status
              )}`}
            >
              {connectionHealth.status.toUpperCase()}
            </span>
          </div>

          <div className='flex items-center space-x-2'>
            <span className='text-sm font-medium text-gray-700'>Latency:</span>
            <span className='text-sm text-gray-600'>{formatLatency(connectionHealth.latency)}</span>
          </div>
        </div>

        {/* Performance Metrics */}
        {Object.keys(performanceMetrics).length > 0 && (
          <div className='flex items-center space-x-4'>
            {Object.entries(performanceMetrics).map(([key, value]) => (
              <div key={key} className='flex items-center space-x-1'>
                <span className='text-xs text-gray-500'>{key}:</span>
                <span className='text-xs font-medium text-gray-700'>
                  {typeof value === 'number' ? value.toFixed(1) : value}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Last Check Time */}
        <div className='text-xs text-gray-500'>
          Last check: {connectionHealth.lastCheck.toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
};
