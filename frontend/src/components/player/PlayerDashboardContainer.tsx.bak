/**
 * PlayerDashboardContainer - Main orchestration component for Player Dashboard
 * Follows PropFinder modular architecture with comprehensive state management
 */

import { Activity, Brain, Clock, History, TrendingUp, User, Zap } from 'lucide-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  useOptimizedPlayerData,
  useOptimizedPlayerSearch,
} from '../../hooks/useOptimizedPlayerData';
import { usePlayerDashboardState } from '../../hooks/usePlayerDashboardState';
import AIExplanationPanel from '../ai/AIExplanationPanel';
import PlayerOverview from './PlayerOverview';
import PlayerPropHistory from './PlayerPropHistory';
import PlayerStatTrends from './PlayerStatTrends';
import type { PlayerDataService } from '@/services/player/PlayerDataService';

export interface Player {
  id: string;
  name: string;
  team: string;
  position: string;
  sport: string;
  season_stats?: {
    games_played?: number;
    batting_average?: number;
    home_runs?: number;
    rbis?: number;
    hits?: number;
    [key: string]: unknown;
  };
  _sources?: string[];
  _fetched_at?: string | number;
  active?: boolean;
  injury_status?: string;
  last_30_games?: Array<{
    date?: string;
    opponent?: string;
    home?: boolean;
    result?: string;
    stats?: Record<string, unknown>;
    game_score?: number;
    weather?: unknown;
  }>;
  performance_trends?: Record<string, unknown>;
  advanced_metrics?: {
    consistency_score?: number;
    clutch_performance?: number;
    injury_risk?: number;
    hot_streak?: boolean;
    cold_streak?: boolean;
    breakout_candidate?: boolean;
    [key: string]: unknown;
  };
  projections?: Record<string, unknown>;
}

// ...existing code...

// Inside the main PlayerDashboardContainer function/component:
// Add this block inside the function, not inside the interface
// Example:
// if (loading) {
//   return (
//     <section aria-busy="true" className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" role="region">
//       ...
//     </section>
//   );
// }

interface PlayerDashboardContainerProps {
  playerId?: string;
  sport?: string;
  onPlayerChange?: (playerId: string) => void;
  onClose?: () => void;
  useOptimizedData?: boolean; // NEW: Toggle between optimized and standard data loading
  enableRealTimeUpdates?: boolean; // NEW: Enable real-time WebSocket updates (only for optimized mode)
}

export const PlayerDashboardContainer: React.FC<PlayerDashboardContainerProps> = ({
  playerId: initialPlayerId,
  sport = 'MLB',
  onPlayerChange,
  onClose,
  useOptimizedData = false,
  enableRealTimeUpdates = true,
}) => {
  const [playerId, setPlayerId] = useState<string>(initialPlayerId || '');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Player[]>([]);

  // Use search results from appropriate source
  // Declare optimizedSearch only once at the top-level scope
  const optimizedSearch = useOptimizedPlayerSearch();
  const displaySearchResults = useOptimizedData ? optimizedSearch.searchResults : searchResults;
  const [showSearch, setShowSearch] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'trends' | 'history' | 'ai'>('overview');

  // Choose between optimized and standard data loading
  const standardData = usePlayerDashboardState({ playerId, sport });
  const optimizedData = useOptimizedPlayerData({
    playerId,
    sport,
    enableRealTimeUpdates: useOptimizedData && enableRealTimeUpdates,
    fallbackToCache: true,
  });
  // Removed duplicate declaration of optimizedSearch

  // Create stable reference for optimized search to prevent infinite loops
  const optimizedSearchRef = useRef(optimizedSearch);
  optimizedSearchRef.current = optimizedSearch;

  // Select the appropriate data source
  const { player, loading, error, reload } = useOptimizedData
    ? {
        player: optimizedData.player,
        loading: optimizedData.loading,
        error: optimizedData.error,
        reload: optimizedData.refresh,
      }
    : standardData;

  // Search players (keep as before, but use registry)
  const handlePlayerSelect = useCallback(
    (selectedPlayerId: string) => {
      setPlayerId(selectedPlayerId);
      setShowSearch(false);
      setSearchQuery('');
      setSearchResults([]);
      if (optimizedSearchRef.current && optimizedSearchRef.current.clearSearch) {
        optimizedSearchRef.current.clearSearch();
      }
      onPlayerChange?.(selectedPlayerId);
    },
    [onPlayerChange]
  );

  // Search players using optimized or standard service
  React.useEffect(() => {
    let active = true;
    const doSearch = async () => {
      if (searchQuery.length < 2) {
        setSearchResults([]);
        return;
      }

      if (useOptimizedData) {
        // Use optimized search
        try {
          await optimizedSearchRef.current.searchPlayers(searchQuery, sport, 10);
          // Don't set search results here, let the hook manage it
        } catch {
          if (active) setSearchResults([]);
        }
      } else {
        // Use standard search (existing implementation)
        const { default: registry } = await import('../../services/MasterServiceRegistry');
        // Narrow the runtime service to the expected interface so TypeScript
        // recognizes `searchPlayers` and related methods.
        const playerDataService = (
          registry.getService ? registry.getService('playerData') : undefined
        ) as PlayerDataService | undefined;
        // Update type for playerDataService to include searchPlayers
        if (playerDataService && typeof (playerDataService as any).searchPlayers === 'function') {
          const results = await (playerDataService as any).searchPlayers(searchQuery, sport, 10);
          try {
            const results = await playerDataService.searchPlayers(searchQuery, sport, 10);
            if (active) setSearchResults(results as unknown as Player[]);
          } catch {
            if (active) setSearchResults([]);
          }
        } else {
          setSearchResults([]);
        }
      }
    };

    if (searchQuery) {
      const debounceTimeout = setTimeout(doSearch, 300);
      return () => {
        active = false;
        clearTimeout(debounceTimeout);
      };
    } else {
      setSearchResults([]);
      if (optimizedSearchRef.current && optimizedSearchRef.current.clearSearch) {
        optimizedSearchRef.current.clearSearch();
      }
    }
  }, [searchQuery, sport, useOptimizedData]);

  // Effect to handle mode switching
  useEffect(() => {
    // Clear search when switching between optimized and standard modes
    setSearchResults([]);
    if (optimizedSearchRef.current && optimizedSearchRef.current.clearSearch) {
      optimizedSearchRef.current.clearSearch();
    }
    setSearchQuery('');
  }, [useOptimizedData]);

  // Show search interface when no playerId is provided
  if (!playerId || playerId.trim() === '') {
    return (
      <div className='min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900'>
        <div className='max-w-4xl mx-auto px-4 py-8'>
          <div className='text-center mb-8'>
            <div className='flex items-center justify-center gap-3 mb-4'>
              <h1 className='text-3xl font-bold text-white'>Player Research</h1>
              {useOptimizedData && (
                <div className='flex items-center gap-1 px-3 py-1 bg-blue-900/50 text-blue-300 rounded-lg text-sm'>
                  <Zap className='w-4 h-4' />
                  Optimized
                </div>
              )}
            </div>
            <p className='text-slate-300'>
              {useOptimizedData
                ? 'Enhanced with real-time data optimization and intelligent caching'
                : 'Search for a player to view their dashboard and analytics'}
            </p>
          </div>

          {/* Search Interface */}
          <div className='bg-slate-800/50 backdrop-blur rounded-lg p-6 mb-8'>
            <div className='relative'>
              <input
                type='text'
                placeholder='Search for players...'
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className='w-full bg-slate-700 text-white border border-slate-600 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500'
              />

              {/* Search Results */}
              {displaySearchResults.length > 0 && (
                <div className='absolute top-full left-0 right-0 bg-slate-700 border border-slate-600 rounded-lg mt-1 max-h-60 overflow-y-auto z-10'>
                  {displaySearchResults.map(result => (
                    <button
                      key={result.id}
                      onClick={() => handlePlayerSelect(result.id)}
                      className='w-full text-left px-4 py-2 hover:bg-slate-600 transition-colors text-white'
                    >
                      <div className='font-medium'>{result.name}</div>
                      <div className='text-sm text-slate-300'>
                        {result.team} • {result.position}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Popular Players or Recent Searches could go here */}
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
            <div className='bg-slate-800/30 rounded-lg p-4 text-center'>
              <div className='text-slate-400 text-sm mb-2'>Quick Access</div>
              <div className='text-white'>Search above to get started</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Always render dashboard sections, passing loading prop for skeletons

  if (error) {
    return (
      <div className='flex items-center justify-center min-h-96 bg-slate-900'>
        <div className='text-center max-w-md'>
          <div className='text-red-400 text-2xl mb-4'>⚠️</div>
          <h3 className='text-xl font-semibold text-white mb-2'>Dashboard Error</h3>
          <p className='text-slate-300 mb-6'>{error}</p>
          <button
            onClick={reload}
            className='bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors'
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <section
      role='region'
      aria-busy={loading ? 'true' : 'false'}
      className='min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900'
    >
      {/* Enhanced Header with optimization indicators */}
      <div className='bg-slate-800 border-b border-slate-700 px-6 py-4'>
        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-4'>
            <h1 className='text-xl font-bold text-white'>Player Dashboard</h1>
            {player && (
              <div className='text-slate-300'>
                <span className='font-medium'>{player.name}</span>
                <span className='mx-2'>•</span>
                <span>
                  {player.team} {player.position}
                </span>
              </div>
            )}
          </div>

          <div className='flex items-center gap-3'>
            {useOptimizedData && (
              <>
                {/* Real-time status indicator */}
                <div
                  className={`flex items-center gap-1 px-2 py-1 rounded text-xs ${
                    optimizedData.isRealTime
                      ? 'bg-green-900/50 text-green-300'
                      : 'bg-slate-700 text-slate-400'
                  }`}
                >
                  {optimizedData.isRealTime ? (
                    <Activity className='w-3 h-3' />
                  ) : (
                    <Clock className='w-3 h-3' />
                  )}
                  {optimizedData.isRealTime ? 'Live' : 'Cached'}
                </div>

                {/* Data quality indicator */}
                <div
                  className={`px-2 py-1 rounded text-xs ${
                    optimizedData.dataQuality === 'high'
                      ? 'bg-green-900/50 text-green-300'
                      : optimizedData.dataQuality === 'medium'
                      ? 'bg-yellow-900/50 text-yellow-300'
                      : 'bg-orange-900/50 text-orange-300'
                  }`}
                >
                  {optimizedData.dataQuality} quality
                </div>

                {/* Performance indicator */}
                {optimizedData.responseTime && (
                  <div className='px-2 py-1 bg-slate-700 text-slate-300 rounded text-xs'>
                    {optimizedData.responseTime}ms
                  </div>
                )}
              </>
            )}

            {/* Refresh button */}
            <button
              onClick={reload}
              disabled={loading}
              className='text-slate-400 hover:text-white transition-colors disabled:opacity-50'
              title='Refresh data'
            >
              <svg
                className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`}
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15'
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content with tabbed interface */}
      <div className='max-w-5xl mx-auto px-4 py-8' aria-live='polite'>
        {/* Player Overview - always shown */}
        <PlayerOverview player={player || undefined} loading={loading} />

        {/* Tab Navigation */}
        <div className='bg-slate-800/50 backdrop-blur rounded-lg border border-slate-700 mb-6'>
          <div className='border-b border-slate-700'>
            <nav className='flex space-x-8 px-6'>
              {[
                { id: 'overview', label: 'Stats & Performance', icon: User },
                { id: 'trends', label: 'Trends & Analysis', icon: TrendingUp },
                { id: 'history', label: 'Prop History', icon: History },
                { id: 'ai', label: 'AI Insights', icon: Brain },
              ].map(tab => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center gap-2 py-4 border-b-2 font-medium text-sm transition-colors ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-400'
                        : 'border-transparent text-slate-400 hover:text-slate-300 hover:border-slate-600'
                    }`}
                  >
                    <Icon className='w-4 h-4' />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Tab Content */}
          <div className='p-6'>
            {activeTab === 'overview' && (
              <div className='space-y-6'>
                <div
                  className='text-slate-300'
                  aria-label='Player Overview'
                  aria-busy={loading ? 'true' : 'false'}
                >
                  <h3 className='text-lg font-semibold mb-4 text-white'>
                    Season Statistics & Recent Performance
                  </h3>
                  {player ? (
                    <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
                      <div className='bg-slate-700/50 rounded-lg p-4'>
                        <div className='text-slate-400 text-sm'>Games Played</div>
                        <div className='text-xl font-bold text-white'>
                          {player.season_stats?.games_played || 0}
                        </div>
                      </div>
                      <div className='bg-slate-700/50 rounded-lg p-4'>
                        <div className='text-slate-400 text-sm'>Batting Avg</div>
                        <div className='text-xl font-bold text-white'>
                          {player.season_stats?.batting_average?.toFixed(3) || '.000'}
                        </div>
                      </div>
                      <div className='bg-slate-700/50 rounded-lg p-4'>
                        <div className='text-slate-400 text-sm'>Home Runs</div>
                        <div className='text-xl font-bold text-white'>
                          {player.season_stats?.home_runs || 0}
                        </div>
                      </div>
                      <div className='bg-slate-700/50 rounded-lg p-4'>
                        <div className='text-slate-400 text-sm'>RBIs</div>
                        <div className='text-xl font-bold text-white'>
                          {player.season_stats?.rbis || 0}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className='text-slate-400'>No player data available</div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'trends' && (
              <div aria-label='Performance Trends' aria-busy={loading ? 'true' : 'false'}>
                <h3 className='text-lg font-semibold mb-4 text-white'>Performance Trends</h3>
                {/* Always render label for accessibility, even if loading */}
                {loading && <div className='text-slate-400 mb-2'>Performance Trends</div>}
                <PlayerStatTrends
                  player={loading ? undefined : player ?? undefined}
                  loading={loading}
                />
              </div>
            )}

            {activeTab === 'history' && (
              <div aria-label='Prop History' aria-busy={loading ? 'true' : 'false'}>
                <h3 className='text-lg font-semibold mb-4 text-white'>Prop History</h3>
                {/* Always render label for accessibility, even if loading */}
                {loading && <div className='text-slate-400 mb-2'>Prop History</div>}
                <PlayerPropHistory
                  player={loading ? undefined : player ?? undefined}
                  loading={loading}
                />
              </div>
            )}

            {activeTab === 'ai' && (
              <AIExplanationPanel
                context={
                  player
                    ? `Player: ${player.name} (${player.position}, ${player.team})
Season Stats: ${JSON.stringify(player.season_stats, null, 2)}
Sport: ${player.sport}
Active: ${player.active}
${
  useOptimizedData
    ? `
Data Optimization: Real-time optimized data enabled
Real-time Status: ${optimizedData.isRealTime ? 'Live updates active' : 'Using cached data'}
Data Quality: ${optimizedData.dataQuality}
Data Sources: ${optimizedData.dataSources.join(', ')}
Response Time: ${optimizedData.responseTime || 'N/A'}ms
Cache Hit: ${optimizedData.cacheHit ? 'Yes' : 'No'}
Last Updated: ${optimizedData.lastUpdated ? optimizedData.lastUpdated.toLocaleString() : 'N/A'}`
    : ''
}
${player.injury_status ? `Injury Status: ${player.injury_status}` : ''}`
                    : 'No player data available'
                }
                question={`Please analyze this player's performance, trends, and potential prop opportunities. Include insights about recent form, matchup considerations, and any notable patterns.${
                  useOptimizedData
                    ? ' Note: This analysis uses real-time optimized data with enhanced performance monitoring.'
                    : ''
                }`}
                playerIds={player ? [player.id] : undefined}
                sport={sport}
                className='min-h-[500px]'
              />
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default PlayerDashboardContainer;
