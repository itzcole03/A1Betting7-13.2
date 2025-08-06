import React, { useEffect, useState } from 'react';
import Card from './Card';
import PastMatchupTracker from './PastMatchupTracker';
import { _Badge as Badge } from './ui/badge';

interface TeamStats {
  name: string;
  abbreviation: string;
  score: number;
  hits: number;
  errors: number;
}

interface GameState {
  status: string;
  inning: number;
  inning_state: string;
  inning_half: string;
}

interface LiveGameData {
  status: string;
  game_id: number;
  teams: {
    away: TeamStats;
    home: TeamStats;
  };
  game_state: GameState;
  venue: string;
  datetime: string;
  last_updated: string;
}

interface PlayByPlayEvent {
  inning: number;
  inning_half: string;
  description: string;
  timestamp: string;
  away_score: number;
  home_score: number;
}

interface PlayByPlayData {
  status: string;
  game_id: number;
  events: PlayByPlayEvent[];
  last_updated: string;
}

type TabType = 'livestats' | 'playbyplay' | 'pastmatchups';

interface LiveGameStatsProps {
  gameId: number;
  refreshInterval?: number; // in milliseconds, default 5 minutes
  awayTeam?: string;
  homeTeam?: string;
}

export const LiveGameStats: React.FC<LiveGameStatsProps> = ({
  gameId,
  refreshInterval = 300000, // 5 minutes
  awayTeam,
  homeTeam,
}) => {
  const [gameData, setGameData] = useState<LiveGameData | null>(null);
  const [playByPlayData, setPlayByPlayData] = useState<PlayByPlayData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('livestats');

  const fetchGameStats = async (isManualRefresh = false) => {
    try {
      if (isManualRefresh) {
        setIsRefreshing(true);
      }
      const response = await fetch(`/mlb/live-game-stats/${gameId}`);
      const data = await response.json();

      if (data.status === 'ok') {
        setGameData(data);
        setError(null);
        setLastUpdate(new Date());
      } else {
        setError(data.message || 'Failed to fetch game stats');
      }
    } catch (err) {
      setError('Error fetching live game stats');
      console.error('Error fetching game stats:', err);
    } finally {
      setLoading(false);
      if (isManualRefresh) {
        setIsRefreshing(false);
      }
    }
  };

  const fetchPlayByPlay = async (isManualRefresh = false) => {
    try {
      if (isManualRefresh) {
        setIsRefreshing(true);
      }
      const response = await fetch(`/mlb/play-by-play/${gameId}`);
      const data = await response.json();

      if (data.status === 'ok') {
        setPlayByPlayData(data);
        setError(null);
        setLastUpdate(new Date());
      } else {
        setError(data.message || 'Failed to fetch play-by-play data');
      }
    } catch (err) {
      setError('Error fetching play-by-play data');
      console.error('Error fetching play-by-play:', err);
    } finally {
      if (isManualRefresh) {
        setIsRefreshing(false);
      }
    }
  };

  const fetchCurrentTabData = (isManualRefresh = false) => {
    if (activeTab === 'livestats') {
      fetchGameStats(isManualRefresh);
    } else {
      fetchPlayByPlay(isManualRefresh);
    }
  };

  useEffect(() => {
    fetchCurrentTabData();

    // Set up auto-refresh for live games
    const interval = setInterval(() => fetchCurrentTabData(), refreshInterval);

    return () => clearInterval(interval);
  }, [gameId, refreshInterval, activeTab]);

  // Fetch data when tab changes
  useEffect(() => {
    if (activeTab === 'playbyplay' && !playByPlayData) {
      fetchPlayByPlay();
    }
  }, [activeTab]);

  if (loading) {
    return (
      <Card className='p-6'>
        <div className='animate-pulse'>
          <div className='h-4 bg-gray-200 rounded mb-4'></div>
          <div className='h-8 bg-gray-200 rounded mb-4'></div>
          <div className='h-4 bg-gray-200 rounded'></div>
        </div>
      </Card>
    );
  }

  if (error || !gameData) {
    return (
      <Card className='p-6'>
        <div className='text-center text-red-600'>
          <p>Unable to load live game stats</p>
          {error && <p className='text-sm text-gray-500 mt-2'>{error}</p>}
        </div>
      </Card>
    );
  }

  const { teams, game_state, venue } = gameData;
  const isLive = game_state.status === 'In Progress';

  return (
    <Card className='p-6 bg-gradient-to-br from-blue-50 to-green-50 border-2 border-blue-200'>
      <div className='space-y-4'>
        {/* Tab Navigation */}
        <div className='flex items-center justify-between'>
          <div className='flex space-x-1'>
            <button
              onClick={() => setActiveTab('livestats')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                activeTab === 'livestats'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Live Stats
            </button>
            <button
              onClick={() => setActiveTab('playbyplay')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                activeTab === 'playbyplay'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Play by Play
            </button>
            <button
              onClick={() => setActiveTab('pastmatchups')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                activeTab === 'pastmatchups'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Past Matchups
            </button>
          </div>
          <div className='flex items-center gap-2'>
            <Badge
              variant={isLive ? 'destructive' : 'secondary'}
              className={isLive ? 'bg-red-500 animate-pulse' : ''}
            >
              {isLive ? '🔴 LIVE' : game_state.status}
            </Badge>
            {isLive && (
              <span className='text-sm text-gray-600'>
                {game_state.inning_half} {game_state.inning}
              </span>
            )}
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'livestats' ? (
          <div className='space-y-4'>
            {/* Team scores */}
            <div className='grid grid-cols-2 gap-4'>
              {/* Away team */}
              <div className='text-center p-4 bg-white rounded-lg border border-gray-200'>
                <div className='text-sm text-gray-600 mb-1'>Away</div>
                <div className='font-bold text-lg text-gray-800'>{teams.away.abbreviation}</div>
                <div className='text-xs text-gray-500 mb-2'>{teams.away.name}</div>
                <div className='text-3xl font-bold text-blue-600'>{teams.away.score}</div>
                <div className='text-xs text-gray-500 mt-2'>
                  H: {teams.away.hits} | E: {teams.away.errors}
                </div>
              </div>

              {/* Home team */}
              <div className='text-center p-4 bg-white rounded-lg border border-gray-200'>
                <div className='text-sm text-gray-600 mb-1'>Home</div>
                <div className='font-bold text-lg text-gray-800'>{teams.home.abbreviation}</div>
                <div className='text-xs text-gray-500 mb-2'>{teams.home.name}</div>
                <div className='text-3xl font-bold text-green-600'>{teams.home.score}</div>
                <div className='text-xs text-gray-500 mt-2'>
                  H: {teams.home.hits} | E: {teams.home.errors}
                </div>
              </div>
            </div>

            {/* Game details */}
            <div className='bg-white p-3 rounded-lg border border-gray-200'>
              <div className='grid grid-cols-2 gap-4 text-sm'>
                <div>
                  <span className='text-gray-600'>Venue:</span>
                  <span className='ml-2 font-medium text-gray-800'>{venue}</span>
                </div>
                <div>
                  <span className='text-gray-600'>Status:</span>
                  <span className='ml-2 font-medium text-gray-800'>{game_state.status}</span>
                </div>
              </div>

              {lastUpdate && (
                <div className='flex items-center justify-between mt-2'>
                  <div className='text-xs text-gray-500'>
                    Last updated: {lastUpdate.toLocaleTimeString()}
                  </div>
                  <button
                    onClick={() => fetchCurrentTabData(true)}
                    disabled={isRefreshing}
                    className='text-xs px-2 py-1 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
                  >
                    {isRefreshing ? '🔄 Updating...' : '🔄 Refresh'}
                  </button>
                </div>
              )}
            </div>

            {/* Live game indicator */}
            {isLive && (
              <div className='text-center'>
                <div className='inline-flex items-center gap-2 text-sm text-gray-600 bg-yellow-100 px-3 py-1 rounded-full'>
                  <div className='w-2 h-2 bg-red-500 rounded-full animate-pulse'></div>
                  Updates automatically every {refreshInterval / 60000} minutes
                </div>
              </div>
            )}
          </div>
        ) : activeTab === 'playbyplay' ? (
          <div className='space-y-4'>
            {/* Play by Play Content */}
            {playByPlayData ? (
              <div className='bg-white p-4 rounded-lg border border-gray-200'>
                <h4 className='text-lg font-semibold text-gray-800 mb-4'>Game Events</h4>
                <div className='space-y-3 max-h-96 overflow-y-auto'>
                  {playByPlayData.events.map((event, index) => (
                    <div key={index} className='border-b border-gray-100 pb-3'>
                      <div className='flex items-center justify-between mb-1'>
                        <span className='text-sm font-medium text-gray-800'>
                          {event.inning_half} {event.inning}
                        </span>
                        <span className='text-xs text-gray-500'>{event.timestamp}</span>
                      </div>
                      <p className='text-sm text-gray-700'>{event.description}</p>
                      <div className='flex items-center gap-4 mt-1 text-xs text-gray-500'>
                        <span>Away: {event.away_score}</span>
                        <span>Home: {event.home_score}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className='bg-white p-4 rounded-lg border border-gray-200 text-center'>
                <p className='text-gray-600'>Loading play by play data...</p>
              </div>
            )}
          </div>
        ) : activeTab === 'pastmatchups' ? (
          <div className='space-y-4'>
            {/* Past Matchups Content */}
            <PastMatchupTracker
              gameId={gameId}
              awayTeam={awayTeam || teams.away.name}
              homeTeam={homeTeam || teams.home.name}
            />
          </div>
        ) : null}
      </div>
    </Card>
  );
};

export default LiveGameStats;
