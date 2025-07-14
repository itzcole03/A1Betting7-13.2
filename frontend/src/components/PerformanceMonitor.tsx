import React from 'react';
import { Card, CardContent, CardHeader } from './Card';

const mockMetrics = [
  { label: 'API Latency', value: '92ms', color: 'text-green-400' },
  { label: 'ML Model Accuracy', value: '96.4%', color: 'text-cyan-400' },
  { label: 'Uptime', value: '99.99%', color: 'text-green-400' },
  { label: 'Build Time', value: '27s', color: 'text-yellow-400' },
];

/**
 * PerformanceMonitor Component
 *
 * Modern, accessible display of key performance metrics for the A1Betting platform.
 * Shows API, ML, uptime, and build stats.
 */
export const PerformanceMonitor: React.FC = () => {
  return (
    <Card className='max-w-2xl mx-auto'>
      <CardHeader>
        <h2 className='text-lg font-bold text-white'>Performance Monitor</h2>
      </CardHeader>
      <CardContent>
        <div className='grid grid-cols-2 md:grid-cols-4 gap-6'>
          {mockMetrics.map(metric => (
            <div key={metric.label} className='flex flex-col items-center'>
              <span className={`text-2xl font-bold ${metric.color}`}>{metric.value}</span>
              <span className='text-gray-400 text-sm mt-1'>{metric.label}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default PerformanceMonitor;
