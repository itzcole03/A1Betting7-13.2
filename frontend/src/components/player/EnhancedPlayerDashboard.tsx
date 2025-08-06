/**
 * Enhanced Player Dashboard - Comprehensive player analytics with backend integration
 * Integrates PlayerDataService, advanced visualizations, and real-time data
 */

import {
  Activity,
  BarChart3,
  Calendar,
  Loader2,
  RefreshCw,
  Target,
  TrendingUp,
  User,
} from 'lucide-react';
import React, { Suspense, useState } from 'react';
import { PlayerAdvancedStats } from './PlayerAdvancedStats';
import { PlayerMatchupAnalysis } from './PlayerMatchupAnalysis';
import { PlayerPerformanceTrends } from './PlayerPerformanceTrends';
import { PlayerQuickStats } from './PlayerQuickStats';

// Lazy load heavy visualization component
const PlayerVisualizationCharts = React.lazy(() => import('./PlayerVisualizationCharts'));

interface PlayerData {
  id: string;
  name: string;
  team: string;
  position: string;
  sport: string;
  active: boolean;
  injury_status?: string;

  // Current Season
  season_stats: {
    hits: number;
    home_runs: number;
    rbis: number;
    batting_average: number;
    on_base_percentage: number;
    slugging_percentage: number;
    ops: number;
    strikeouts: number;
    walks: number;
    games_played: number;
    plate_appearances: number;
    at_bats: number;
    runs: number;
    doubles: number;
    triples: number;
    stolen_bases: number;
    // Advanced Stats
    war?: number;
    babip?: number;
    wrc_plus?: number;
    barrel_rate?: number;
    hard_hit_rate?: number;
    exit_velocity?: number;
    launch_angle?: number;
  };

  // Performance Data
  recent_games: Array<{
    date: string;
    opponent: string;
    home: boolean;
    result: string;
    stats: {
      hits?: number;
      home_runs?: number;
      rbis?: number;
      batting_average?: number;
      ops?: number;
    };
    game_score?: number;
    weather?: any;
  }>;

  last_30_games: Array<{
    date: string;
    opponent: string;
    home: boolean;
    result: string;
    stats: {
      hits?: number;
      home_runs?: number;
      rbis?: number;
      batting_average?: number;
      ops?: number;
    };
    game_score?: number;
    weather?: any;
  }>;

  // Trends and Analysis
  performance_trends: {
    last_7_days: any;
    last_30_days: any;
    home_vs_away: {
      home: any;
      away: any;
    };
    vs_lefties: any;
    vs_righties: any;
  };

  // Advanced Metrics
  advanced_metrics: {
    consistency_score: number;
    clutch_performance: number;
    injury_risk: number;
    hot_streak: boolean;
    cold_streak: boolean;
    breakout_candidate: boolean;
  };

  // Predictive Analytics
  projections: {
    next_game: any;
    rest_of_season: any;
    confidence_intervals: {
      low: any;
      high: any;
    };
  };

  // Backward compatibility with original interface
  next_game?: {
    date: string;
    opponent: string;
    matchup_difficulty: 'easy' | 'medium' | 'hard';
  };
}

interface PlayerDashboardProps {
  player: PlayerData;
  onRefresh?: () => void;
}

const PlayerDashboard: React.FC<PlayerDashboardProps> = ({ player, onRefresh }) => {
  const [activeTab, setActiveTab] = useState<
    'overview' | 'trends' | 'matchups' | 'advanced' | 'charts'
  >('overview');
  const [refreshing, setRefreshing] = useState(false);

  // Enhanced refresh functionality
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await onRefresh?.();
    } finally {
      setRefreshing(false);
    }
  };

  const tabs = [
    { id: 'overview', name: 'Overview', icon: User },
    { id: 'trends', name: 'Performance Trends', icon: TrendingUp },
    { id: 'charts', name: 'Advanced Charts', icon: Activity },
    { id: 'matchups', name: 'Matchup Analysis', icon: Target },
    { id: 'advanced', name: 'Advanced Stats', icon: BarChart3 },
  ] as const;

  // Prepare data for charts
  const chartData = React.useMemo(() => {
    return (
      player.recent_games?.map(game => ({
        date: game.date,
        opponent: game.opponent,
        stats: game.stats,
      })) || []
    );
  }, [player.recent_games]);

  // Injury status indicator
  const injuryStatusColor = player.injury_status
    ? 'bg-red-900 text-red-300 border-red-700'
    : player.active
    ? 'bg-green-900 text-green-300 border-green-700'
    : 'bg-gray-900 text-gray-300 border-gray-700';

  // Player status indicators
  const statusIndicators = React.useMemo(() => {
    const indicators = [];

    if (player.advanced_metrics?.hot_streak) {
      indicators.push({ label: '🔥 Hot Streak', color: 'bg-red-500' });
    }
    if (player.advanced_metrics?.cold_streak) {
      indicators.push({ label: '❄️ Cold Streak', color: 'bg-blue-500' });
    }
    if (player.advanced_metrics?.breakout_candidate) {
      indicators.push({ label: '⭐ Breakout Candidate', color: 'bg-yellow-500' });
    }

    return indicators;
  }, [player.advanced_metrics]);

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6'>
      <div className='max-w-7xl mx-auto'>
        {/* Enhanced Player Header */}
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
                  {/* Injury/Active Status */}
                  <span className={`px-3 py-1 rounded-full text-sm border ${injuryStatusColor}`}>
                    {player.injury_status || (player.active ? 'Active' : 'Inactive')}
                  </span>
                </div>

                {/* Status Indicators */}
                {statusIndicators.length > 0 && (
                  <div className='flex items-center space-x-2 mt-3'>
                    {statusIndicators.map((indicator, index) => (
                      <span
                        key={index}
                        className={`px-2 py-1 rounded-full text-xs text-white ${indicator.color}`}
                      >
                        {indicator.label}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className='flex items-center space-x-4'>
              {/* Refresh Button */}
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className='bg-slate-700 hover:bg-slate-600 disabled:opacity-50 px-4 py-2 rounded-lg text-white transition-colors flex items-center space-x-2'
                title='Refresh player data'
              >
                {refreshing ? (
                  <Loader2 className='h-4 w-4 animate-spin' />
                ) : (
                  <RefreshCw className='h-4 w-4' />
                )}
                <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
              </button>

              {/* Next Game Info */}
              {(player.next_game || player.projections?.next_game) && (
                <div className='bg-slate-800/60 rounded-lg p-4 border border-slate-600'>
                  <div className='flex items-center space-x-2 text-yellow-400 mb-2'>
                    <Calendar className='h-4 w-4' />
                    <span className='text-sm font-medium'>Next Game</span>
                  </div>
                  <p className='text-white font-semibold'>
                    vs {player.next_game?.opponent || 'TBD'}
                  </p>
                  <p className='text-slate-300 text-sm'>{player.next_game?.date || 'TBD'}</p>
                  {player.next_game?.matchup_difficulty && (
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
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Enhanced Navigation Tabs */}
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

        {/* Enhanced Tab Content */}
        <div className='space-y-6'>
          {activeTab === 'overview' && (
            <div>
              <PlayerQuickStats player={player} />
              {/* Quick Stats Summary */}
              <div className='mt-6 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4'>
                <div className='bg-slate-800/60 rounded-lg p-4 border border-slate-600'>
                  <div className='text-slate-400 text-sm'>Season AVG</div>
                  <div className='text-white text-2xl font-bold'>
                    {player.season_stats?.batting_average?.toFixed(3) || 'N/A'}
                  </div>
                </div>
                <div className='bg-slate-800/60 rounded-lg p-4 border border-slate-600'>
                  <div className='text-slate-400 text-sm'>Home Runs</div>
                  <div className='text-white text-2xl font-bold'>
                    {player.season_stats?.home_runs || 'N/A'}
                  </div>
                </div>
                <div className='bg-slate-800/60 rounded-lg p-4 border border-slate-600'>
                  <div className='text-slate-400 text-sm'>RBIs</div>
                  <div className='text-white text-2xl font-bold'>
                    {player.season_stats?.rbis || 'N/A'}
                  </div>
                </div>
                <div className='bg-slate-800/60 rounded-lg p-4 border border-slate-600'>
                  <div className='text-slate-400 text-sm'>OPS</div>
                  <div className='text-white text-2xl font-bold'>
                    {player.season_stats?.ops?.toFixed(3) || 'N/A'}
                  </div>
                </div>
                <div className='bg-slate-800/60 rounded-lg p-4 border border-slate-600'>
                  <div className='text-slate-400 text-sm'>Games</div>
                  <div className='text-white text-2xl font-bold'>
                    {player.season_stats?.games_played || 'N/A'}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'trends' && <PlayerPerformanceTrends player={player} />}

          {activeTab === 'charts' && (
            <Suspense
              fallback={
                <div className='flex items-center justify-center h-96'>
                  <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400'></div>
                  <span className='ml-4 text-white'>Loading advanced charts...</span>
                </div>
              }
            >
              <PlayerVisualizationCharts
                gameData={chartData}
                playerName={player.name}
                darkTheme={true}
              />
            </Suspense>
          )}

          {activeTab === 'matchups' && <PlayerMatchupAnalysis player={player} />}

          {activeTab === 'advanced' && <PlayerAdvancedStats player={player} />}
        </div>
      </div>
    </div>
  );
};

export default PlayerDashboard;
