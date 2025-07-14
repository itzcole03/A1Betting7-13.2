import React from 'react';
import { Button } from './Button';
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
export const BettingDashboard: React.FC<BettingDashboardProps> = ({ className = '' }) => {
  // Mock stats for demonstration
  const stats = [
    { label: 'Total Bets', value: 128 },
    { label: 'Win Rate', value: '73.8%' },
    { label: 'ROI', value: '18.5%' },
    { label: 'Sharpe Ratio', value: '1.42' },
  ];

  return (
    <Card className={`max-w-3xl mx-auto ${className}`}>
      <CardHeader>
        <h2 className='text-lg font-bold text-white'>Betting Dashboard</h2>
      </CardHeader>
      <CardContent>
        <div className='grid grid-cols-2 md:grid-cols-4 gap-6 mb-8'>
          {stats.map(stat => (
            <div key={stat.label} className='flex flex-col items-center'>
              <span className='text-2xl font-bold text-cyan-400'>{stat.value}</span>
              <span className='text-gray-400 text-sm mt-1'>{stat.label}</span>
            </div>
          ))}
        </div>
        <div className='flex gap-4 justify-center'>
          <Button variant='primary'>New Bet</Button>
          <Button variant='outline'>View History</Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default BettingDashboard;
