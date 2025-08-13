import React from 'react';

interface PerformanceMetrics {
  avgResponseTime?: number;
  cacheSize?: number;
  hitRate?: number;
  subscriptions?: number;
  pendingRequests?: number;
  [key: string]: any;
}

interface Props {
  metrics?: PerformanceMetrics;
}

const PerformanceMonitoringDashboard: React.FC<Props> = ({ metrics }) => {
  // Defensive checks for all metrics
  const safeNumber = (val: any, decimals = 2) =>
    typeof val === 'number' && isFinite(val) ? val.toFixed(decimals) : 'N/A';

  return (
    <div className='bg-gray-900 text-white p-6 rounded shadow-lg'>
      <h2 className='text-xl font-bold mb-4'>Performance Monitoring Dashboard</h2>
      <ul className='space-y-2'>
        <li>
          <span className='font-semibold'>Avg Response Time:</span>{' '}
          {safeNumber(metrics?.avgResponseTime)} ms
        </li>
        <li>
          <span className='font-semibold'>Cache Size:</span> {safeNumber(metrics?.cacheSize, 0)}
        </li>
        <li>
          <span className='font-semibold'>Hit Rate:</span> {safeNumber(metrics?.hitRate)}%
        </li>
        <li>
          <span className='font-semibold'>Subscriptions:</span>{' '}
          {safeNumber(metrics?.subscriptions, 0)}
        </li>
        <li>
          <span className='font-semibold'>Pending Requests:</span>{' '}
          {safeNumber(metrics?.pendingRequests, 0)}
        </li>
      </ul>
      {/* Fallback for missing metrics */}
      {!metrics && (
        <div className='mt-4 text-yellow-400'>
          Metrics data unavailable. Please check backend connection.
        </div>
      )}
    </div>
  );
};

export default PerformanceMonitoringDashboard;
