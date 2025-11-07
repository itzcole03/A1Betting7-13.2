/**
 * Player Matchup Analysis - Opponent-specific performance data
 * PropFinder style head-to-head analysis and matchup insights
 */

import React, { useMemo } from 'react';
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
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

interface PlayerMatchupAnalysisProps {
  player: PlayerData;
}

export const PlayerMatchupAnalysis: React.FC<PlayerMatchupAnalysisProps> = ({ player }) => {
  // Analyze performance by opponent
  const matchupData = useMemo(() => {
    const opponentStats: Record<
      string,
      {
        games: number;
        totalHits: number;
        totalHRs: number;
        totalRBIs: number;
        avgBA: number;
      }
    > = {};

    player.recent_games.forEach(game => {
      if (!opponentStats[game.opponent]) {
        opponentStats[game.opponent] = {
          games: 0,
          totalHits: 0,
          totalHRs: 0,
          totalRBIs: 0,
          avgBA: 0,
        };
      }

      const stats = opponentStats[game.opponent];
      stats.games += 1;
      stats.totalHits += game.stats.hits || 0;
      stats.totalHRs += game.stats.home_runs || 0;
      stats.totalRBIs += game.stats.rbis || 0;
    });

    return Object.entries(opponentStats)
      .map(([opponent, stats]) => ({
        opponent,
        games: stats.games,
        avgHits: Number((stats.totalHits / stats.games).toFixed(2)),
        avgHRs: Number((stats.totalHRs / stats.games).toFixed(2)),
        avgRBIs: Number((stats.totalRBIs / stats.games).toFixed(2)),
        totalHits: stats.totalHits,
        totalHRs: stats.totalHRs,
        totalRBIs: stats.totalRBIs,
      }))
      .filter(data => data.games > 0)
      .sort((a, b) => b.games - a.games);
  }, [player.recent_games]);

  // Home vs Away performance
  const homeAwayData = useMemo(() => {
    let homeGames = 0,
      awayGames = 0;
    let homeHits = 0,
      awayHits = 0;
    let homeHRs = 0,
      awayHRs = 0;

    player.recent_games.forEach(game => {
      // Simple heuristic: if opponent starts with "@", it's away game
      const isAway = game.opponent.startsWith('@');

      if (isAway) {
        awayGames++;
        awayHits += game.stats.hits || 0;
        awayHRs += game.stats.home_runs || 0;
      } else {
        homeGames++;
        homeHits += game.stats.hits || 0;
        homeHRs += game.stats.home_runs || 0;
      }
    });

    return [
      {
        location: 'Home',
        games: homeGames,
        avgHits: homeGames > 0 ? Number((homeHits / homeGames).toFixed(2)) : 0,
        avgHRs: homeGames > 0 ? Number((homeHRs / homeGames).toFixed(2)) : 0,
      },
      {
        location: 'Away',
        games: awayGames,
        avgHits: awayGames > 0 ? Number((awayHits / awayGames).toFixed(2)) : 0,
        avgHRs: awayGames > 0 ? Number((awayHRs / awayGames).toFixed(2)) : 0,
      },
    ];
  }, [player.recent_games]);

  // Division performance (mock data based on common divisions)
  const divisionData = useMemo(() => {
    const divisions = {
      'NL East': ['ATL', 'MIA', 'NYM', 'PHI', 'WSH'],
      'NL West': ['ARI', 'COL', 'LAD', 'SD', 'SF'],
      'NL Central': ['CHC', 'CIN', 'MIL', 'PIT', 'STL'],
      'AL East': ['BAL', 'BOS', 'NYY', 'TB', 'TOR'],
      'AL West': ['HOU', 'LAA', 'OAK', 'SEA', 'TEX'],
      'AL Central': ['CWS', 'CLE', 'DET', 'KC', 'MIN'],
    };

    const divisionStats: Record<string, { games: number; hits: number; hrs: number }> = {};

    player.recent_games.forEach(game => {
      const opponent = game.opponent.replace('@', '').trim();

      Object.entries(divisions).forEach(([division, teams]) => {
        if (teams.includes(opponent)) {
          if (!divisionStats[division]) {
            divisionStats[division] = { games: 0, hits: 0, hrs: 0 };
          }
          divisionStats[division].games++;
          divisionStats[division].hits += game.stats.hits || 0;
          divisionStats[division].hrs += game.stats.home_runs || 0;
        }
      });
    });

    return Object.entries(divisionStats)
      .map(([division, stats]) => ({
        division,
        games: stats.games,
        avgHits: Number((stats.hits / stats.games).toFixed(2)),
        avgHRs: Number((stats.hrs / stats.games).toFixed(2)),
      }))
      .filter(data => data.games > 0);
  }, [player.recent_games]);

  const COLORS = ['#3B82F6', '#F59E0B', '#10B981', '#EF4444', '#8B5CF6', '#F97316'];

  return (
    <div className='space-y-6'>
      {/* Opponent Performance Breakdown */}
      <div className='bg-slate-800/60 backdrop-blur-sm border border-slate-700 rounded-lg p-6'>
        <h3 className='text-xl font-bold text-white mb-4'>Performance vs Recent Opponents</h3>

        {matchupData.length > 0 ? (
          <div className='space-y-4'>
            {matchupData.map((matchup, index) => (
              <div key={matchup.opponent} className='bg-slate-700/50 rounded-lg p-4'>
                <div className='flex justify-between items-center mb-2'>
                  <h4 className='text-lg font-semibold text-white'>{matchup.opponent}</h4>
                  <span className='text-slate-300 text-sm'>{matchup.games} games</span>
                </div>

                <div className='grid grid-cols-3 gap-4'>
                  <div className='text-center'>
                    <p className='text-slate-300 text-sm'>Avg Hits</p>
                    <p className='text-2xl font-bold text-blue-400'>{matchup.avgHits}</p>
                  </div>
                  <div className='text-center'>
                    <p className='text-slate-300 text-sm'>Avg HRs</p>
                    <p className='text-2xl font-bold text-yellow-400'>{matchup.avgHRs}</p>
                  </div>
                  <div className='text-center'>
                    <p className='text-slate-300 text-sm'>Avg RBIs</p>
                    <p className='text-2xl font-bold text-green-400'>{matchup.avgRBIs}</p>
                  </div>
                </div>

                {/* Performance bar */}
                <div className='mt-3'>
                  <div className='flex items-center justify-between text-sm text-slate-300 mb-1'>
                    <span>Performance Score</span>
                    <span>
                      {(matchup.avgHits * 0.4 + matchup.avgHRs * 2 + matchup.avgRBIs * 0.8).toFixed(
                        1
                      )}
                    </span>
                  </div>
                  <div className='w-full bg-slate-600 rounded-full h-2'>
                    <div
                      className='bg-gradient-to-r from-blue-400 to-green-400 h-2 rounded-full transition-all duration-300'
                      style={{
                        width: `${Math.min(
                          100,
                          (matchup.avgHits * 0.4 + matchup.avgHRs * 2 + matchup.avgRBIs * 0.8) * 10
                        )}%`,
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className='text-slate-400 text-center py-8'>No matchup data available</p>
        )}
      </div>

      {/* Home vs Away Performance */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        <div className='bg-slate-800/60 backdrop-blur-sm border border-slate-700 rounded-lg p-6'>
          <h3 className='text-xl font-bold text-white mb-4'>Home vs Away Performance</h3>

          <div className='h-64'>
            <ResponsiveContainer width='100%' height='100%'>
              <BarChart data={homeAwayData}>
                <XAxis dataKey='location' stroke='#9CA3AF' />
                <YAxis stroke='#9CA3AF' />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1E293B',
                    border: '1px solid #475569',
                    borderRadius: '8px',
                  }}
                />
                <Bar dataKey='avgHits' name='Avg Hits'>
                  {homeAwayData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className='mt-4 space-y-2'>
            {homeAwayData.map((data, index) => (
              <div key={data.location} className='flex justify-between items-center'>
                <div className='flex items-center'>
                  <div
                    className='w-4 h-4 rounded mr-2'
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  ></div>
                  <span className='text-slate-300'>{data.location}</span>
                </div>
                <div className='text-slate-300 text-sm'>
                  {data.games} games • {data.avgHits} avg hits • {data.avgHRs} avg HRs
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Division Performance */}
        <div className='bg-slate-800/60 backdrop-blur-sm border border-slate-700 rounded-lg p-6'>
          <h3 className='text-xl font-bold text-white mb-4'>Division Performance</h3>

          {divisionData.length > 0 ? (
            <>
              <div className='h-48'>
                <ResponsiveContainer width='100%' height='100%'>
                  <PieChart>
                    <Pie
                      data={divisionData}
                      dataKey='games'
                      nameKey='division'
                      cx='50%'
                      cy='50%'
                      outerRadius={60}
                      label={({ division, games }) => `${division}: ${games}`}
                      labelLine={false}
                    >
                      {divisionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className='mt-4 space-y-2'>
                {divisionData.map((data, index) => (
                  <div key={data.division} className='flex justify-between items-center'>
                    <div className='flex items-center'>
                      <div
                        className='w-4 h-4 rounded mr-2'
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      ></div>
                      <span className='text-slate-300 text-sm'>{data.division}</span>
                    </div>
                    <div className='text-slate-300 text-sm'>
                      {data.avgHits} hits • {data.avgHRs} HRs
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className='text-slate-400 text-center py-8'>No division data available</p>
          )}
        </div>
      </div>

      {/* Matchup Insights */}
      <div className='bg-slate-800/60 backdrop-blur-sm border border-slate-700 rounded-lg p-6'>
        <h3 className='text-xl font-bold text-white mb-4'>Key Matchup Insights</h3>

        <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
          {matchupData.length > 0 && (
            <>
              <div className='text-center p-4 bg-slate-700/50 rounded-lg'>
                <p className='text-slate-300 text-sm'>Best Matchup</p>
                <p className='text-lg font-bold text-green-400'>
                  {
                    matchupData.reduce((best, current) =>
                      current.avgHits + current.avgHRs + current.avgRBIs >
                      best.avgHits + best.avgHRs + best.avgRBIs
                        ? current
                        : best
                    ).opponent
                  }
                </p>
              </div>

              <div className='text-center p-4 bg-slate-700/50 rounded-lg'>
                <p className='text-slate-300 text-sm'>Most Faced</p>
                <p className='text-lg font-bold text-blue-400'>{matchupData[0].opponent}</p>
                <p className='text-slate-400 text-xs'>{matchupData[0].games} games</p>
              </div>

              <div className='text-center p-4 bg-slate-700/50 rounded-lg'>
                <p className='text-slate-300 text-sm'>Power vs</p>
                <p className='text-lg font-bold text-yellow-400'>
                  {
                    matchupData.reduce((best, current) =>
                      current.avgHRs > best.avgHRs ? current : best
                    ).opponent
                  }
                </p>
                <p className='text-slate-400 text-xs'>
                  {
                    matchupData.reduce((best, current) =>
                      current.avgHRs > best.avgHRs ? current : best
                    ).avgHRs
                  }{' '}
                  avg HRs
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
