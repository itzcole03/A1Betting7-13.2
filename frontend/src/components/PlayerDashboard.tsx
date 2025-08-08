import { Spinner } from '@/components/shared/Spinner';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import React, { useEffect, useState } from 'react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import 'tailwindcss/tailwind.css';

// Type definitions
export interface GameLog {
  date: string;
  opponent: string;
  points: number;
  rebounds: number;
  assists: number;
  [key: string]: number | string;
}

export interface PlayerPerformanceData {
  playerId: string;
  name: string;
  team: string;
  position: string;
  gameLogs: GameLog[];
}

interface PlayerDashboardProps {
  playerId: string;
}

const STAT_OPTIONS = ['points', 'rebounds', 'assists'];

export const PlayerDashboard: React.FC<PlayerDashboardProps> = ({ playerId }) => {
  const [data, setData] = useState<PlayerPerformanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStat, setSelectedStat] = useState<string>(STAT_OPTIONS[0]);
  const isMobile = useMediaQuery('(max-width: 640px)');

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch(`/api/player/${playerId}/performance`)
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch player data');
        return res.json();
      })
      .then(json => {
        setData(json);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, [playerId]);

  if (loading) return <Spinner />;
  if (error) return <div className='text-red-500'>{error}</div>;
  if (!data) return null;

  const recentLogs = data.gameLogs.slice(-10).reverse();

  return (
    <div className='bg-gray-900 rounded-lg shadow-lg p-6 w-full max-w-2xl mx-auto'>
      <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4'>
        <div>
          <h2 className='text-2xl font-bold text-white mb-1'>{data.name}</h2>
          <div className='text-gray-300 text-sm'>
            {data.team} &middot; {data.position}
          </div>
        </div>
        <div className='mt-2 sm:mt-0'>
          <label htmlFor='stat-select' className='text-gray-400 mr-2'>
            Stat:
          </label>
          <select
            id='stat-select'
            value={selectedStat}
            onChange={e => setSelectedStat(e.target.value)}
            className='bg-gray-800 text-white rounded px-2 py-1 border border-gray-700'
          >
            {STAT_OPTIONS.map(stat => (
              <option key={stat} value={stat}>
                {stat.charAt(0).toUpperCase() + stat.slice(1)}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className='mb-6'>
        <ResponsiveContainer width='100%' height={isMobile ? 180 : 240}>
          <LineChart data={recentLogs} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray='3 3' stroke='#444' />
            <XAxis dataKey='date' tick={{ fill: '#ccc', fontSize: 12 }} />
            <YAxis tick={{ fill: '#ccc', fontSize: 12 }} />
            <Tooltip contentStyle={{ background: '#222', color: '#fff' }} />
            <Line
              type='monotone'
              dataKey={selectedStat}
              stroke='#38bdf8'
              strokeWidth={2}
              dot={{ r: 3 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className='overflow-x-auto'>
        <table className='min-w-full text-sm text-left text-gray-300'>
          <thead>
            <tr className='bg-gray-800'>
              <th className='px-2 py-2'>Date</th>
              <th className='px-2 py-2'>Opponent</th>
              <th className='px-2 py-2'>Points</th>
              <th className='px-2 py-2'>Rebounds</th>
              <th className='px-2 py-2'>Assists</th>
            </tr>
          </thead>
          <tbody>
            {recentLogs.map((log, idx) => (
              <tr key={idx} className='border-b border-gray-700 hover:bg-gray-800'>
                <td className='px-2 py-2'>{log.date}</td>
                <td className='px-2 py-2'>{log.opponent}</td>
                <td className='px-2 py-2 font-semibold'>{log.points}</td>
                <td className='px-2 py-2'>{log.rebounds}</td>
                <td className='px-2 py-2'>{log.assists}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PlayerDashboard;
