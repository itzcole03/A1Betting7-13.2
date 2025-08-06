/**
 * Player Performance Trends - Interactive charts showing performance over time
 * PropFinder style visualization using Chart.js/Recharts
 */

import React, { useMemo } from 'react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

interface PlayerData {
  name: string;
  recent_games: Array<{
    date: string;
    opponent: string;
    stats: Record<string, number>;
  }>;
}

interface PlayerPerformanceTrendsProps {
  player: PlayerData;
}

export const PlayerPerformanceTrends: React.FC<PlayerPerformanceTrendsProps> = ({ player }) => {
  // Transform game data for charts
  const chartData = useMemo(() => {
    return player.recent_games
      .slice(0, 10) // Last 10 games
      .reverse() // Show chronologically
      .map((game, index) => ({
        game: index + 1,
        date: game.date,
        opponent: game.opponent,
        hits: game.stats.hits || 0,
        home_runs: game.stats.home_runs || 0,
        rbis: game.stats.rbis || 0,
      }));
  }, [player.recent_games]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className='bg-slate-800 border border-slate-600 rounded-lg p-3 shadow-lg'>
          <p className='text-white font-semibold'>Game {label}</p>
          <p className='text-slate-300 text-sm'>vs {data.opponent}</p>
          <p className='text-slate-300 text-sm'>{new Date(data.date).toLocaleDateString()}</p>
          <div className='mt-2 space-y-1'>
            {payload.map((entry: any, index: number) => (
              <p key={index} className='text-sm' style={{ color: entry.color }}>
                {entry.name}: {entry.value}
              </p>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className='space-y-6'>
      {/* Hits Trend */}
      <div className='bg-slate-800/60 backdrop-blur-sm border border-slate-700 rounded-lg p-6'>
        <h3 className='text-xl font-bold text-white mb-4'>Hits Per Game (Last 10)</h3>
        <div className='h-64'>
          <ResponsiveContainer width='100%' height='100%'>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray='3 3' stroke='#374151' />
              <XAxis dataKey='game' stroke='#9CA3AF' tick={{ fill: '#9CA3AF' }} />
              <YAxis stroke='#9CA3AF' tick={{ fill: '#9CA3AF' }} />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type='monotone'
                dataKey='hits'
                stroke='#3B82F6'
                strokeWidth={2}
                dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, fill: '#60A5FA' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Home Runs Trend */}
      <div className='bg-slate-800/60 backdrop-blur-sm border border-slate-700 rounded-lg p-6'>
        <h3 className='text-xl font-bold text-white mb-4'>Home Runs Per Game (Last 10)</h3>
        <div className='h-64'>
          <ResponsiveContainer width='100%' height='100%'>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray='3 3' stroke='#374151' />
              <XAxis dataKey='game' stroke='#9CA3AF' tick={{ fill: '#9CA3AF' }} />
              <YAxis stroke='#9CA3AF' tick={{ fill: '#9CA3AF' }} />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type='monotone'
                dataKey='home_runs'
                stroke='#F59E0B'
                strokeWidth={2}
                dot={{ fill: '#F59E0B', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, fill: '#FCD34D' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Multi-stat comparison */}
      <div className='bg-slate-800/60 backdrop-blur-sm border border-slate-700 rounded-lg p-6'>
        <h3 className='text-xl font-bold text-white mb-4'>Performance Overview (Last 10)</h3>
        <div className='h-80'>
          <ResponsiveContainer width='100%' height='100%'>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray='3 3' stroke='#374151' />
              <XAxis dataKey='game' stroke='#9CA3AF' tick={{ fill: '#9CA3AF' }} />
              <YAxis stroke='#9CA3AF' tick={{ fill: '#9CA3AF' }} />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type='monotone'
                dataKey='hits'
                stroke='#3B82F6'
                strokeWidth={2}
                name='Hits'
                dot={{ fill: '#3B82F6', strokeWidth: 2, r: 3 }}
              />
              <Line
                type='monotone'
                dataKey='home_runs'
                stroke='#F59E0B'
                strokeWidth={2}
                name='Home Runs'
                dot={{ fill: '#F59E0B', strokeWidth: 2, r: 3 }}
              />
              <Line
                type='monotone'
                dataKey='rbis'
                stroke='#10B981'
                strokeWidth={2}
                name='RBIs'
                dot={{ fill: '#10B981', strokeWidth: 2, r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        <div className='flex justify-center space-x-6 mt-4'>
          <div className='flex items-center'>
            <div className='w-4 h-4 bg-blue-500 rounded mr-2'></div>
            <span className='text-slate-300 text-sm'>Hits</span>
          </div>
          <div className='flex items-center'>
            <div className='w-4 h-4 bg-yellow-500 rounded mr-2'></div>
            <span className='text-slate-300 text-sm'>Home Runs</span>
          </div>
          <div className='flex items-center'>
            <div className='w-4 h-4 bg-green-500 rounded mr-2'></div>
            <span className='text-slate-300 text-sm'>RBIs</span>
          </div>
        </div>
      </div>

      {/* Performance Summary */}
      <div className='bg-slate-800/60 backdrop-blur-sm border border-slate-700 rounded-lg p-6'>
        <h3 className='text-xl font-bold text-white mb-4'>Trend Analysis</h3>
        <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
          <div className='text-center p-4 bg-slate-700/50 rounded-lg'>
            <p className='text-slate-300 text-sm'>Best Game (Hits)</p>
            <p className='text-2xl font-bold text-blue-400'>
              {Math.max(...chartData.map(d => d.hits))}
            </p>
          </div>
          <div className='text-center p-4 bg-slate-700/50 rounded-lg'>
            <p className='text-slate-300 text-sm'>HR Games</p>
            <p className='text-2xl font-bold text-yellow-400'>
              {chartData.filter(d => d.home_runs > 0).length}
            </p>
          </div>
          <div className='text-center p-4 bg-slate-700/50 rounded-lg'>
            <p className='text-slate-300 text-sm'>Multi-RBI Games</p>
            <p className='text-2xl font-bold text-green-400'>
              {chartData.filter(d => d.rbis > 1).length}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
