import React from 'react';
// @ts-expect-error TS(6142): Module './Card' was resolved to 'C:/Users/bcmad/Do... Remove this comment to see the full error message
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
    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <Card className='max-w-2xl mx-auto'>
      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <CardHeader>
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <h2 className='text-lg font-bold text-white'>Performance Monitor</h2>
      </CardHeader>
      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <CardContent>
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <div className='grid grid-cols-2 md:grid-cols-4 gap-6'>
          {mockMetrics.map(metric => (
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div key={metric.label} className='flex flex-col items-center'>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <span className={`text-2xl font-bold ${metric.color}`}>{metric.value}</span>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <span className='text-gray-400 text-sm mt-1'>{metric.label}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default PerformanceMonitor;
