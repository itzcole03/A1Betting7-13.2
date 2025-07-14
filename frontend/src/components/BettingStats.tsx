import React from 'react';
import { Card, CardContent, CardHeader } from './Card';

const mockStats = [
  { label: 'Total Bets', value: 128 },
  { label: 'Total Wagered', value: '$12,400' },
  { label: 'Total Won', value: '$18,420' },
  { label: 'Biggest Win', value: '$2,500' },
  { label: 'Longest Streak', value: '7 Wins' },
];

/**
 * BettingStats Component
 *
 * Modern, accessible display of key betting statistics for the A1Betting platform.
 * Shows total bets, wagered, won, and more.
 */
export const BettingStats: React.FC = () => {
  return (
    <Card className='max-w-2xl mx-auto'>
      <CardHeader>
        <h2 className='text-lg font-bold text-white'>Betting Stats</h2>
      </CardHeader>
      <CardContent>
        <div className='grid grid-cols-2 md:grid-cols-3 gap-6'>
          {mockStats.map(stat => (
            <div key={stat.label} className='flex flex-col items-center'>
              <span className='text-2xl font-bold text-cyan-400'>{stat.value}</span>
              <span className='text-gray-400 text-sm mt-1'>{stat.label}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default BettingStats;
