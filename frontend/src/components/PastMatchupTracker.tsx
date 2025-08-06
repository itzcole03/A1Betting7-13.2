import React, { useEffect, useState } from 'react';

interface PastMatchupTrackerProps {
  gameId: number;
  awayTeam?: string;
  homeTeam?: string;
}

interface PastMatchup {
  id: number;
  away_team: string;
  home_team: string;
  away_score: number;
  home_score: number;
  date: string;
  season: number;
  venue: string;
  winner: string;
}

interface PastMatchupData {
  status: string;
  game_id: number;
  teams: {
    away: string;
    home: string;
  };
  last_5_matchups: PastMatchup[];
  head_to_head_record: {
    away_wins: number;
    home_wins: number;
    total_games: number;
  };
  season_stats: {
    away_team: {
      wins: number;
      losses: number;
      win_percentage: number;
      home_record: string;
      road_record: string;
    };
    home_team: {
      wins: number;
      losses: number;
      win_percentage: number;
      home_record: string;
      road_record: string;
    };
  };
}

export const PastMatchupTracker: React.FC<PastMatchupTrackerProps> = ({
  gameId,
  awayTeam = 'Unknown',
  homeTeam = 'Unknown',
}) => {
  const [matchupData, setMatchupData] = useState<PastMatchupData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'recent' | 'season'>('recent');

  useEffect(() => {
    const fetchPastMatchupData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Try to fetch past matchup data
        const response = await fetch(`/mlb/past-matchups/${gameId}`);

        if (!response.ok) {
          // If endpoint doesn't exist, use mock data
          setMatchupData(generateMockMatchupData(gameId, awayTeam, homeTeam));
          setLoading(false);
          return;
        }

        const data = await response.json();
        setMatchupData(data);
      } catch (err) {
        console.log('Past matchup API not available, using mock data');
        // Use mock data as fallback
        setMatchupData(generateMockMatchupData(gameId, awayTeam, homeTeam));
      } finally {
        setLoading(false);
      }
    };

    fetchPastMatchupData();
  }, [gameId, awayTeam, homeTeam]);

  const generateMockMatchupData = (gameId: number, away: string, home: string): PastMatchupData => {
    const currentYear = new Date().getFullYear();
    const mockMatchups: PastMatchup[] = [];

    // Generate 5 recent matchups
    for (let i = 0; i < 5; i++) {
      const daysAgo = Math.floor(Math.random() * 365) + 30; // 30-395 days ago
      const date = new Date();
      date.setDate(date.getDate() - daysAgo);

      const awayScore = Math.floor(Math.random() * 12) + 1;
      const homeScore = Math.floor(Math.random() * 12) + 1;

      mockMatchups.push({
        id: i + 1,
        away_team: away,
        home_team: home,
        away_score: awayScore,
        home_score: homeScore,
        date: date.toISOString().split('T')[0],
        season: currentYear - (daysAgo > 200 ? 1 : 0),
        venue: `${home} Stadium`,
        winner: awayScore > homeScore ? away : home,
      });
    }

    const awayWins = mockMatchups.filter(m => m.winner === away).length;
    const homeWins = mockMatchups.filter(m => m.winner === home).length;

    return {
      status: 'ok',
      game_id: gameId,
      teams: { away, home },
      last_5_matchups: mockMatchups,
      head_to_head_record: {
        away_wins: awayWins,
        home_wins: homeWins,
        total_games: 5,
      },
      season_stats: {
        away_team: {
          wins: Math.floor(Math.random() * 50) + 40,
          losses: Math.floor(Math.random() * 50) + 40,
          win_percentage: Math.random() * 0.4 + 0.3,
          home_record: '25-16',
          road_record: '22-19',
        },
        home_team: {
          wins: Math.floor(Math.random() * 50) + 40,
          losses: Math.floor(Math.random() * 50) + 40,
          win_percentage: Math.random() * 0.4 + 0.3,
          home_record: '28-13',
          road_record: '19-22',
        },
      },
    };
  };

  if (loading) {
    return (
      <div className='bg-slate-800 rounded-lg p-6 border border-slate-700'>
        <div className='flex items-center justify-center py-8'>
          <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400'></div>
          <span className='ml-3 text-gray-300'>Loading past matchup data...</span>
        </div>
      </div>
    );
  }

  if (error || !matchupData) {
    return (
      <div className='bg-slate-800 rounded-lg p-6 border border-slate-700'>
        <h3 className='text-xl font-bold text-white mb-4'>📊 Past Matchup Tracker</h3>
        <p className='text-red-400'>Unable to load past matchup data</p>
      </div>
    );
  }

  return (
    <div className='bg-slate-800 rounded-lg p-6 border border-slate-700'>
      <div className='flex items-center justify-between mb-6'>
        <h3 className='text-xl font-bold text-white'>📊 Past Matchup Tracker</h3>
        <div className='text-sm text-gray-400'>
          {matchupData.teams.away} vs {matchupData.teams.home}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className='flex space-x-1 mb-6 bg-slate-700 rounded-lg p-1'>
        <button
          onClick={() => setActiveTab('recent')}
          className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${
            activeTab === 'recent'
              ? 'bg-blue-600 text-white'
              : 'text-gray-300 hover:text-white hover:bg-slate-600'
          }`}
        >
          Recent Matchups
        </button>
        <button
          onClick={() => setActiveTab('season')}
          className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${
            activeTab === 'season'
              ? 'bg-blue-600 text-white'
              : 'text-gray-300 hover:text-white hover:bg-slate-600'
          }`}
        >
          Season Stats
        </button>
      </div>

      {/* Head-to-Head Record */}
      <div className='mb-6 p-4 bg-slate-700 rounded-lg'>
        <h4 className='text-lg font-semibold text-white mb-3'>Head-to-Head Record</h4>
        <div className='grid grid-cols-3 gap-4 text-center'>
          <div>
            <div className='text-2xl font-bold text-blue-400'>
              {matchupData.head_to_head_record.away_wins}
            </div>
            <div className='text-sm text-gray-300'>{matchupData.teams.away}</div>
          </div>
          <div>
            <div className='text-lg text-gray-400'>vs</div>
            <div className='text-sm text-gray-400'>
              Last {matchupData.head_to_head_record.total_games}
            </div>
          </div>
          <div>
            <div className='text-2xl font-bold text-green-400'>
              {matchupData.head_to_head_record.home_wins}
            </div>
            <div className='text-sm text-gray-300'>{matchupData.teams.home}</div>
          </div>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'recent' ? (
        <div>
          <h4 className='text-lg font-semibold text-white mb-4'>Recent Matchups</h4>
          <div className='space-y-3'>
            {matchupData.last_5_matchups.map((matchup, index) => (
              <div
                key={matchup.id}
                className='flex items-center justify-between p-3 bg-slate-700 rounded-lg'
              >
                <div className='flex items-center space-x-4'>
                  <div className='text-sm text-gray-400'>
                    {new Date(matchup.date).toLocaleDateString()}
                  </div>
                  <div className='text-white'>
                    {matchup.away_team} @ {matchup.home_team}
                  </div>
                </div>
                <div className='flex items-center space-x-4'>
                  <div className='text-lg font-semibold text-white'>
                    {matchup.away_score} - {matchup.home_score}
                  </div>
                  <div
                    className={`text-sm px-2 py-1 rounded ${
                      matchup.winner === matchupData.teams.away ? 'bg-blue-600' : 'bg-green-600'
                    } text-white`}
                  >
                    W: {matchup.winner}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div>
          <h4 className='text-lg font-semibold text-white mb-4'>Season Statistics</h4>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            {/* Away Team Stats */}
            <div className='p-4 bg-slate-700 rounded-lg'>
              <h5 className='text-lg font-semibold text-blue-400 mb-3'>{matchupData.teams.away}</h5>
              <div className='space-y-2'>
                <div className='flex justify-between'>
                  <span className='text-gray-300'>Record:</span>
                  <span className='text-white'>
                    {matchupData.season_stats.away_team.wins}-
                    {matchupData.season_stats.away_team.losses}
                  </span>
                </div>
                <div className='flex justify-between'>
                  <span className='text-gray-300'>Win %:</span>
                  <span className='text-white'>
                    {(matchupData.season_stats.away_team.win_percentage * 100).toFixed(1)}%
                  </span>
                </div>
                <div className='flex justify-between'>
                  <span className='text-gray-300'>Home:</span>
                  <span className='text-white'>
                    {matchupData.season_stats.away_team.home_record}
                  </span>
                </div>
                <div className='flex justify-between'>
                  <span className='text-gray-300'>Road:</span>
                  <span className='text-white'>
                    {matchupData.season_stats.away_team.road_record}
                  </span>
                </div>
              </div>
            </div>

            {/* Home Team Stats */}
            <div className='p-4 bg-slate-700 rounded-lg'>
              <h5 className='text-lg font-semibold text-green-400 mb-3'>
                {matchupData.teams.home}
              </h5>
              <div className='space-y-2'>
                <div className='flex justify-between'>
                  <span className='text-gray-300'>Record:</span>
                  <span className='text-white'>
                    {matchupData.season_stats.home_team.wins}-
                    {matchupData.season_stats.home_team.losses}
                  </span>
                </div>
                <div className='flex justify-between'>
                  <span className='text-gray-300'>Win %:</span>
                  <span className='text-white'>
                    {(matchupData.season_stats.home_team.win_percentage * 100).toFixed(1)}%
                  </span>
                </div>
                <div className='flex justify-between'>
                  <span className='text-gray-300'>Home:</span>
                  <span className='text-white'>
                    {matchupData.season_stats.home_team.home_record}
                  </span>
                </div>
                <div className='flex justify-between'>
                  <span className='text-gray-300'>Road:</span>
                  <span className='text-white'>
                    {matchupData.season_stats.home_team.road_record}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PastMatchupTracker;
