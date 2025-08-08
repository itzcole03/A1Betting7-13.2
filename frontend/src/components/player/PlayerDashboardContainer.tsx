/**
 * PlayerDashboardContainer - Main orchestration component for Player Dashboard
 * Follows PropFinder modular architecture with comprehensive state management
 */

import React, { useCallback, useState } from 'react';
import { usePlayerDashboardState } from '../../hooks/usePlayerDashboardState';
import PlayerOverview from './PlayerOverview';
import PlayerPropHistory from './PlayerPropHistory';
import PlayerStatTrends from './PlayerStatTrends';

export interface Player {
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

  // Backward compatibility
  next_game?: {
    date: string;
    opponent: string;
    matchup_difficulty: 'easy' | 'medium' | 'hard';
  };
}

interface PlayerDashboardContainerProps {
  playerId?: string;
  sport?: string;
  onPlayerChange?: (playerId: string) => void;
  onClose?: () => void;
}

export const PlayerDashboardContainer: React.FC<PlayerDashboardContainerProps> = ({
  playerId: initialPlayerId,
  sport = 'MLB',
  onPlayerChange,
  onClose,
}) => {
  const [playerId, setPlayerId] = useState<string>(initialPlayerId || '');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Player[]>([]);
  const [showSearch, setShowSearch] = useState(false);

  // Use unified dashboard state hook
  const { player, loading, error, reload } = usePlayerDashboardState({ playerId, sport });

  // Search players (keep as before, but use registry)
  const handlePlayerSelect = useCallback(
    (selectedPlayerId: string) => {
      setPlayerId(selectedPlayerId);
      setShowSearch(false);
      setSearchQuery('');
      setSearchResults([]);
      onPlayerChange?.(selectedPlayerId);
    },
    [onPlayerChange]
  );

  // Search players using PlayerDataService from registry
  React.useEffect(() => {
    let active = true;
    const doSearch = async () => {
      if (searchQuery.length < 2) {
        setSearchResults([]);
        return;
      }
      // Get PlayerDataService from registry
      const { default: registry } = await import('../../services/MasterServiceRegistry');
      const playerDataService = registry.getService ? registry.getService('playerData') : undefined;
      if (playerDataService && typeof playerDataService.searchPlayers === 'function') {
        try {
          const results = await playerDataService.searchPlayers(searchQuery, sport, 10);
          if (active) setSearchResults(results);
        } catch {
          if (active) setSearchResults([]);
        }
      } else {
        setSearchResults([]);
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
    }
  }, [searchQuery, sport]);

  // Show search interface when no playerId is provided
  if (!playerId || playerId.trim() === '') {
    return (
      <div className='min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900'>
        <div className='max-w-4xl mx-auto px-4 py-8'>
          <div className='text-center mb-8'>
            <h1 className='text-3xl font-bold text-white mb-4'>Player Research</h1>
            <p className='text-slate-300'>Search for a player to view their dashboard and analytics</p>
          </div>

          {/* Search Interface */}
          <div className='bg-slate-800/50 backdrop-blur rounded-lg p-6 mb-8'>
            <div className='relative'>
              <input
                type='text'
                placeholder='Search for players...'
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className='w-full bg-slate-700 text-white border border-slate-600 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500'
              />

              {/* Search Results */}
              {searchResults.length > 0 && (
                <div className='absolute top-full left-0 right-0 bg-slate-700 border border-slate-600 rounded-lg mt-1 max-h-60 overflow-y-auto z-10'>
                  {searchResults.map((result) => (
                    <button
                      key={result.id}
                      onClick={() => handlePlayerSelect(result.id)}
                      className='w-full text-left px-4 py-2 hover:bg-slate-600 transition-colors text-white'
                    >
                      <div className='font-medium'>{result.name}</div>
                      <div className='text-sm text-slate-300'>{result.team} • {result.position}</div>
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
    <div className='min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900'>
      {/* Header (unchanged) */}
      <div className='bg-slate-800 border-b border-slate-700 px-6 py-4'>
        {/* ...existing code... */}
        {/* (Header code omitted for brevity) */}
      </div>

      {/* Main Content: always render dashboard sections, use loading prop for skeletons */}
      <div className='max-w-5xl mx-auto px-4 py-8' aria-busy={loading} aria-live='polite'>
        <PlayerOverview player={player || undefined} loading={loading} />
        <PlayerStatTrends player={player || undefined} loading={loading} />
        <PlayerPropHistory player={player || undefined} loading={loading} />
      </div>
    </div>
  );
};

export default PlayerDashboardContainer;
