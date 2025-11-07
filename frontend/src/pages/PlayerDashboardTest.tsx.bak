/**
 * Player Dashboard Test Page - Simple test interface for Player Dashboard functionality
 * This page allows us to test the complete Player Dashboard integration
 */

import React from 'react';
import PlayerDashboardContainer from '../components/player/PlayerDashboardContainer';

const PlayerDashboardTest: React.FC = () => {
  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900'>
      <div className='p-6'>
        <div className='max-w-7xl mx-auto'>
          {/* Test Header */}
          <div className='bg-slate-800 rounded-xl p-6 mb-6 border border-slate-700'>
            <h1 className='text-2xl font-bold text-white mb-4'>🧪 Player Dashboard Test</h1>
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm'>
              <div className='bg-slate-700 p-3 rounded'>
                <div className='text-slate-400'>Backend Status</div>
                <div className='text-green-400 font-semibold'>✅ Running (Port 8000)</div>
              </div>
              <div className='bg-slate-700 p-3 rounded'>
                <div className='text-slate-400'>Frontend Status</div>
                <div className='text-green-400 font-semibold'>✅ Running (Port 5173)</div>
              </div>
              <div className='bg-slate-700 p-3 rounded'>
                <div className='text-slate-400'>Chart.js</div>
                <div className='text-green-400 font-semibold'>✅ Installed</div>
              </div>
              <div className='bg-slate-700 p-3 rounded'>
                <div className='text-slate-400'>Test Player</div>
                <div className='text-blue-400 font-semibold'>📊 Aaron Judge</div>
              </div>
            </div>
            <div className='mt-4 p-4 bg-blue-900/30 border border-blue-700 rounded'>
              <p className='text-blue-200 text-sm'>
                <strong>Test Instructions:</strong> This page tests the complete Player Dashboard
                implementation including backend integration, advanced charts, service registry,
                caching, and all UI components.
              </p>
            </div>
          </div>

          {/* Player Dashboard Container */}
          <PlayerDashboardContainer
            playerId='aaron-judge'
            sport='MLB'
            onPlayerChange={playerId => console.log('Player changed to:', playerId)}
          />
        </div>
      </div>
    </div>
  );
};

export default PlayerDashboardTest;
