import React from 'react';
import type { Player } from './PlayerDashboardContainer';
// TODO: Replace with Recharts/Chart.js for real data

interface PlayerStatTrendsProps {
  player?: Player;
  loading?: boolean;
}

const PlayerStatTrends: React.FC<PlayerStatTrendsProps> = ({ player, loading }) => {
  if (loading || !player) {
    return (
      <section
        className='bg-slate-800 rounded-lg p-6 shadow-md mb-6 animate-pulse'
        aria-busy='true'
        aria-label='Performance Trends'
      >
        <h3 className='text-lg font-semibold text-white mb-4'>Performance Trends</h3>
        <div className='h-48 flex items-center justify-center'>
          <div className='w-full h-8 bg-slate-700 rounded mb-4'></div>
          <div className='w-2/3 h-32 bg-slate-700 rounded'></div>
        </div>
      </section>
    );
  }
  return (
    <section className='bg-slate-800 rounded-lg p-6 shadow-md mb-6' aria-label='Performance Trends'>
      <h3 className='text-lg font-semibold text-white mb-4'>Performance Trends</h3>
      <div className='h-48 flex items-center justify-center text-slate-400'>
        {/* Chart will go here */}
        <span>Trend chart coming soon...</span>
      </div>
    </section>
  );
};

export default PlayerStatTrends;
