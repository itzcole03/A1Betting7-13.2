/**
 * Player Quick Stats - Overview tab showing key statistics at a glance
 * PropFinder style quick reference for essential player metrics
 */

import { Activity, Target, TrendingUp, Zap } from 'lucide-react';
import React from 'react';

interface PlayerData {
  name: string;
  season_stats: Record<string, number>;
  recent_games: Array<{
    date: string;
    opponent: string;
    stats: Record<string, number>;
  }>;
  injury_status?: string;
}

interface PlayerQuickStatsProps {
  player: PlayerData;
}

export const PlayerQuickStats: React.FC<PlayerQuickStatsProps> = ({ player }) => {
  // Calculate recent performance (last 5 games)
  const recentGames = player.recent_games.slice(0, 5);
  const recentAvg = recentGames.reduce((acc, game) => {
    Object.entries(game.stats).forEach(([key, value]) => {
      acc[key] = (acc[key] || 0) + value;
    });
    return acc;
  }, {} as Record<string, number>);

  Object.keys(recentAvg).forEach(key => {
    recentAvg[key] = recentAvg[key] / recentGames.length;
  });

  const statCards = [
    {
      title: 'Season Hits',
      value: player.season_stats.hits?.toString() || 'N/A',
      change: recentAvg.hits ? `${recentAvg.hits.toFixed(1)} avg last 5` : null,
      icon: Target,
      color: 'blue',
    },
    {
      title: 'Home Runs',
      value: player.season_stats.home_runs?.toString() || 'N/A',
      change: recentAvg.home_runs ? `${recentAvg.home_runs.toFixed(1)} avg last 5` : null,
      icon: Zap,
      color: 'yellow',
    },
    {
      title: 'RBIs',
      value: player.season_stats.rbis?.toString() || 'N/A',
      change: recentAvg.rbis ? `${recentAvg.rbis.toFixed(1)} avg last 5` : null,
      icon: TrendingUp,
      color: 'green',
    },
    {
      title: 'Batting Average',
      value: player.season_stats.batting_average?.toFixed(3) || 'N/A',
      change: 'Season performance',
      icon: Activity,
      color: 'purple',
    },
  ];

  return (
    <div className='space-y-6'>
      {/* Key Stats Grid */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
        {statCards.map(stat => {
          const Icon = stat.icon;
          const colorClasses = {
            blue: 'from-blue-600 to-blue-800 border-blue-500',
            yellow: 'from-yellow-600 to-yellow-800 border-yellow-500',
            green: 'from-green-600 to-green-800 border-green-500',
            purple: 'from-purple-600 to-purple-800 border-purple-500',
          };

          return (
            <div
              key={stat.title}
              className={`bg-gradient-to-br ${
                colorClasses[stat.color as keyof typeof colorClasses]
              } backdrop-blur-sm border rounded-lg p-6`}
            >
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-white/80 text-sm font-medium'>{stat.title}</p>
                  <p className='text-2xl font-bold text-white mt-1'>{stat.value}</p>
                  {stat.change && <p className='text-white/60 text-xs mt-1'>{stat.change}</p>}
                </div>
                <Icon className='h-8 w-8 text-white/70' />
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Games Performance */}
      <div className='bg-slate-800/60 backdrop-blur-sm border border-slate-700 rounded-lg p-6'>
        <h3 className='text-xl font-bold text-white mb-4 flex items-center'>
          <Activity className='h-5 w-5 mr-2 text-yellow-400' />
          Recent Games
        </h3>

        <div className='overflow-x-auto'>
          <table className='w-full'>
            <thead>
              <tr className='border-b border-slate-600'>
                <th className='text-left py-3 px-4 text-slate-300 font-medium'>Date</th>
                <th className='text-left py-3 px-4 text-slate-300 font-medium'>Opponent</th>
                <th className='text-center py-3 px-4 text-slate-300 font-medium'>Hits</th>
                <th className='text-center py-3 px-4 text-slate-300 font-medium'>HR</th>
                <th className='text-center py-3 px-4 text-slate-300 font-medium'>RBI</th>
              </tr>
            </thead>
            <tbody>
              {recentGames.map((game, index) => (
                <tr key={index} className='border-b border-slate-700/50 hover:bg-slate-700/30'>
                  <td className='py-3 px-4 text-slate-200'>
                    {new Date(game.date).toLocaleDateString()}
                  </td>
                  <td className='py-3 px-4 text-slate-200 font-medium'>vs {game.opponent}</td>
                  <td className='py-3 px-4 text-center text-white font-semibold'>
                    {game.stats.hits || 0}
                  </td>
                  <td className='py-3 px-4 text-center text-white font-semibold'>
                    {game.stats.home_runs || 0}
                  </td>
                  <td className='py-3 px-4 text-center text-white font-semibold'>
                    {game.stats.rbis || 0}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Injury Status (if applicable) */}
      {player.injury_status && (
        <div className='bg-red-900/50 border border-red-700 rounded-lg p-4'>
          <div className='flex items-center'>
            <div className='w-3 h-3 bg-red-500 rounded-full mr-3'></div>
            <div>
              <h4 className='text-red-300 font-semibold'>Injury Status</h4>
              <p className='text-red-200 text-sm'>{player.injury_status}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
