/**
 * Player Dashboard - PropFinder Style Comprehensive Player View
 *
 * This component provides detailed player performance trends, matchup analysis,
 * advanced statistics, and opponent-specific game logs - the core of PropFinder functionality.
 */

import { BarChart3, Calendar, Target, TrendingUp, User } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { EnhancedApiClient } from '../../utils/enhancedApiClient';
import { PlayerAdvancedStats } from './PlayerAdvancedStats';
import { PlayerMatchupAnalysis } from './PlayerMatchupAnalysis';
import { PlayerPerformanceTrends } from './PlayerPerformanceTrends';
import { PlayerQuickStats } from './PlayerQuickStats';

interface PlayerData {
  id: string;
  name: string;
  team: string;
  position: string;
  sport: string;
  season_stats: Record<string, number>;
  recent_games: Array<{
    date: string;
    opponent: string;
    stats: Record<string, number>;
  }>;
  advanced_metrics: Record<string, number>;
  injury_status?: string;
  next_game?: {
    date: string;
    opponent: string;
    matchup_difficulty: 'easy' | 'medium' | 'hard';
  };
}

interface PlayerDashboardProps {
  playerId?: string;
}

const PlayerDashboard: React.FC<PlayerDashboardProps> = ({ playerId: propPlayerId }) => {
  const { playerId: routePlayerId } = useParams<{ playerId: string }>();
  const playerId = propPlayerId || routePlayerId;

  const [player, setPlayer] = useState<PlayerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'trends' | 'matchups' | 'advanced'>(
    'overview'
  );

  const apiClient = new EnhancedApiClient();

  useEffect(() => {
    if (!playerId) {
      setError('No player ID provided');
      setLoading(false);
      return;
    }

    const fetchPlayerData = async () => {
      try {
        console.log(`[PlayerDashboard] Fetching data for player: ${playerId}`);
        setLoading(true);
        setError(null);

        // For now, we'll use mock data until backend endpoints are available
        // TODO: Replace with actual API call
        const mockPlayerData: PlayerData = {
          id: playerId,
          name: 'Aaron Judge',
          team: 'NYY',
          position: 'RF',
          sport: 'MLB',
          season_stats: {
            hits: 162,
            home_runs: 58,
            rbis: 144,
            batting_average: 0.311,
            ops: 1.111,
          },
          recent_games: [
            { date: '2025-08-04', opponent: 'BOS', stats: { hits: 2, home_runs: 1, rbis: 3 } },
            { date: '2025-08-03', opponent: 'BOS', stats: { hits: 1, home_runs: 0, rbis: 1 } },
            { date: '2025-08-02', opponent: 'TOR', stats: { hits: 3, home_runs: 2, rbis: 4 } },
          ],
          advanced_metrics: {
            xba: 0.285,
            xslg: 0.612,
            barrel_rate: 18.5,
            hard_hit_rate: 52.3,
          },
          next_game: {
            date: '2025-08-06',
            opponent: 'TEX',
            matchup_difficulty: 'medium',
          },
        };

        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        setPlayer(mockPlayerData);

        console.log(`[PlayerDashboard] Player data loaded:`, mockPlayerData);
      } catch (err) {
        console.error('[PlayerDashboard] Error fetching player data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load player data');
      } finally {
        setLoading(false);
      }
    };

    fetchPlayerData();
  }, [playerId]);

  if (loading) {
    return (
      <div className='min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6'>
        <div className='max-w-7xl mx-auto'>
          <div className='flex items-center justify-center h-64'>
            <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400'></div>
            <span className='ml-4 text-white'>Loading player data...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error || !player) {
    return (
      <div className='min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6'>
        <div className='max-w-7xl mx-auto'>
          <div className='bg-red-900/50 border border-red-700 rounded-lg p-6'>
            <h3 className='text-red-400 font-semibold'>Error Loading Player</h3>
            <p className='text-red-300 mt-2'>{error || 'Player data not available'}</p>
          </div>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', name: 'Overview', icon: User },
    { id: 'trends', name: 'Performance Trends', icon: TrendingUp },
    { id: 'matchups', name: 'Matchup Analysis', icon: Target },
    { id: 'advanced', name: 'Advanced Stats', icon: BarChart3 },
  ] as const;

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6'>
      <div className='max-w-7xl mx-auto'>
        {/* Player Header */}
        <div className='bg-gradient-to-r from-slate-800/80 to-purple-800/80 backdrop-blur-sm border border-slate-700 rounded-lg p-6 mb-6'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center space-x-4'>
              <div className='bg-gradient-to-br from-yellow-400 to-orange-500 w-16 h-16 rounded-full flex items-center justify-center'>
                <User className='h-8 w-8 text-slate-900' />
              </div>
              <div>
                <h1 className='text-3xl font-bold text-white'>{player.name}</h1>
                <div className='flex items-center space-x-3 mt-2'>
                  <span className='bg-blue-600 px-3 py-1 rounded-full text-sm text-white'>
                    {player.team}
                  </span>
                  <span className='bg-green-600 px-3 py-1 rounded-full text-sm text-white'>
                    {player.position}
                  </span>
                  <span className='bg-purple-600 px-3 py-1 rounded-full text-sm text-white'>
                    {player.sport}
                  </span>
                </div>
              </div>
            </div>

            {player.next_game && (
              <div className='bg-slate-800/60 rounded-lg p-4 border border-slate-600'>
                <div className='flex items-center space-x-2 text-yellow-400 mb-2'>
                  <Calendar className='h-4 w-4' />
                  <span className='text-sm font-medium'>Next Game</span>
                </div>
                <p className='text-white font-semibold'>vs {player.next_game.opponent}</p>
                <p className='text-slate-300 text-sm'>{player.next_game.date}</p>
                <div
                  className={`mt-2 inline-flex px-2 py-1 rounded text-xs font-medium ${
                    player.next_game.matchup_difficulty === 'easy'
                      ? 'bg-green-900 text-green-300'
                      : player.next_game.matchup_difficulty === 'medium'
                      ? 'bg-yellow-900 text-yellow-300'
                      : 'bg-red-900 text-red-300'
                  }`}
                >
                  {player.next_game.matchup_difficulty} matchup
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className='bg-slate-800/60 backdrop-blur-sm border border-slate-700 rounded-lg mb-6'>
          <nav className='flex space-x-8 px-6'>
            {tabs.map(tab => {
              const isActive = activeTab === tab.id;
              const Icon = tab.icon;

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                    isActive
                      ? 'border-yellow-400 text-yellow-400'
                      : 'border-transparent text-slate-400 hover:text-slate-300 hover:border-slate-300'
                  }`}
                >
                  <Icon className='h-4 w-4' />
                  <span>{tab.name}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className='space-y-6'>
          {activeTab === 'overview' && <PlayerQuickStats player={player} />}
          {activeTab === 'trends' && <PlayerPerformanceTrends player={player} />}
          {activeTab === 'matchups' && <PlayerMatchupAnalysis player={player} />}
          {activeTab === 'advanced' && <PlayerAdvancedStats player={player} />}
        </div>
      </div>
    </div>
  );
};

export default PlayerDashboard;
