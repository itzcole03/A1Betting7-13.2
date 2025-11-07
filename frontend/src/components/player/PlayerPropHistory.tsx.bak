import React from 'react';
import type { Player } from './PlayerDashboardContainer';

interface PlayerPropHistoryProps {
  player?: Player;
  loading?: boolean;
}

const PlayerPropHistory: React.FC<PlayerPropHistoryProps> = ({ player, loading }) => {
  if (loading || !player) {
    return (
      <section
        className='bg-slate-800 rounded-lg p-6 shadow-md mb-6 animate-pulse'
        aria-busy='true'
        aria-label='Prop History'
      >
        <h3 className='text-lg font-semibold text-white mb-4'>Prop History</h3>
        <div className='h-32 flex flex-col items-center justify-center w-full'>
          <div className='w-2/3 h-6 bg-slate-700 rounded mb-2'></div>
          <div className='w-1/2 h-6 bg-slate-700 rounded mb-2'></div>
          <div className='w-1/3 h-6 bg-slate-700 rounded'></div>
        </div>
      </section>
    );
  }
  return (
    <section className='bg-slate-800 rounded-lg p-6 shadow-md mb-6' aria-label='Prop History'>
      <h3 className='text-lg font-semibold text-white mb-4'>Prop History</h3>
      <div className='h-32 flex items-center justify-center text-slate-400'>
        {/* Virtualized prop history list will go here */}
        <span>Prop history coming soon...</span>
      </div>
    </section>
  );
};

export default PlayerPropHistory;
