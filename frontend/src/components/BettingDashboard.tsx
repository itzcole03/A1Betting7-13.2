import React from 'react';
// @ts-expect-error TS(6142): Module './Button' was resolved to 'C:/Users/bcmad/... Remove this comment to see the full error message
import { Button } from './Button';
// @ts-expect-error TS(6142): Module './Card' was resolved to 'C:/Users/bcmad/Do... Remove this comment to see the full error message
import { Card, CardContent, CardHeader } from './Card';

interface BettingDashboardProps {
  className?: string;
}

/**
 * BettingDashboard Component
 *
 * Modern, accessible dashboard for betting summary and quick actions.
 * Displays key stats and provides access to core betting features.
 *
 * @param className - Additional CSS classes
 */
export const _BettingDashboard: React.FC<BettingDashboardProps> = ({ className = '' }) => {
  // Mock stats for demonstration
  const _stats = [
    { label: 'Total Bets', value: 128 },
    { label: 'Win Rate', value: '73.8%' },
    { label: 'ROI', value: '18.5%' },
    { label: 'Sharpe Ratio', value: '1.42' },
  ];

  return (
    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <Card className={`max-w-3xl mx-auto ${className}`}>
      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <CardHeader>
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <h2 className='text-lg font-bold text-white'>Betting Dashboard</h2>
      </CardHeader>
      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <CardContent>
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <div className='grid grid-cols-2 md:grid-cols-4 gap-6 mb-8'>
          {stats.map(stat => (
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div key={stat.label} className='flex flex-col items-center'>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <span className='text-2xl font-bold text-cyan-400'>{stat.value}</span>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <span className='text-gray-400 text-sm mt-1'>{stat.label}</span>
            </div>
          ))}
        </div>
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <div className='flex gap-4 justify-center'>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <Button variant='primary'>New Bet</Button>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <Button variant='outline'>View History</Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default BettingDashboard;
