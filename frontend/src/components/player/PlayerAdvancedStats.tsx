/**
 * Player Advanced Stats - Advanced metrics and analytics
 * PropFinder style advanced sabermetrics and modern baseball analytics
 */

import React, { useMemo } from 'react';
import {
  Bar,
  BarChart,
  Cell,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
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

interface PlayerAdvancedStatsProps {
  player: PlayerData;
}

export const PlayerAdvancedStats: React.FC<PlayerAdvancedStatsProps> = ({ player }) => {
  // Calculate advanced metrics from game stats
  const advancedMetrics = useMemo(() => {
    let totalGames = 0;
    let totalHits = 0;
    let totalAtBats = 0;
    let totalHRs = 0;
    let totalRBIs = 0;
    let totalDoubles = 0;
    let totalTriples = 0;
    let totalWalks = 0;
    let totalStrikeouts = 0;

    player.recent_games.forEach(game => {
      totalGames++;
      totalHits += game.stats.hits || 0;
      totalAtBats += game.stats.at_bats || 4; // Mock 4 AB per game
      totalHRs += game.stats.home_runs || 0;
      totalRBIs += game.stats.rbis || 0;
      totalDoubles += game.stats.doubles || 0;
      totalTriples += game.stats.triples || 0;
      totalWalks += game.stats.walks || Math.floor(Math.random() * 2); // Mock walks
      totalStrikeouts += game.stats.strikeouts || Math.floor(Math.random() * 3); // Mock Ks
    });

    // Advanced calculations
    const battingAverage = totalAtBats > 0 ? totalHits / totalAtBats : 0;
    const onBasePercentage =
      totalAtBats > 0 ? (totalHits + totalWalks) / (totalAtBats + totalWalks) : 0;
    const sluggingPercentage =
      totalAtBats > 0
        ? (totalHits -
            totalDoubles -
            totalTriples -
            totalHRs +
            totalDoubles * 2 +
            totalTriples * 3 +
            totalHRs * 4) /
          totalAtBats
        : 0;
    const ops = onBasePercentage + sluggingPercentage;
    const iso = sluggingPercentage - battingAverage;
    const babip =
      totalAtBats > totalHRs + totalStrikeouts
        ? (totalHits - totalHRs) / (totalAtBats - totalStrikeouts - totalHRs)
        : 0;

    return {
      battingAverage: Number(battingAverage.toFixed(3)),
      onBasePercentage: Number(onBasePercentage.toFixed(3)),
      sluggingPercentage: Number(sluggingPercentage.toFixed(3)),
      ops: Number(ops.toFixed(3)),
      iso: Number(iso.toFixed(3)),
      babip: Number(babip.toFixed(3)),
      homeRunRate: totalAtBats > 0 ? Number(((totalHRs / totalAtBats) * 100).toFixed(1)) : 0,
      strikeoutRate:
        totalAtBats > 0 ? Number(((totalStrikeouts / totalAtBats) * 100).toFixed(1)) : 0,
      walkRate: totalAtBats > 0 ? Number(((totalWalks / totalAtBats) * 100).toFixed(1)) : 0,
      contactRate:
        totalAtBats > 0
          ? Number((((totalAtBats - totalStrikeouts) / totalAtBats) * 100).toFixed(1))
          : 0,
    };
  }, [player.recent_games]);

  // Radar chart data for skill assessment
  const radarData = [
    { skill: 'Contact', value: advancedMetrics.contactRate, max: 100 },
    { skill: 'Power', value: advancedMetrics.iso * 1000, max: 300 }, // Scale ISO for display
    { skill: 'Patience', value: advancedMetrics.walkRate * 5, max: 50 }, // Scale walk rate
    { skill: 'Speed', value: 75, max: 100 }, // Mock speed metric
    { skill: 'Clutch', value: 80, max: 100 }, // Mock clutch metric
    { skill: 'Discipline', value: (100 - advancedMetrics.strikeoutRate) * 1.2, max: 100 },
  ];

  // Sabermetric comparison data
  const sabermetrics = [
    { name: 'BA', value: advancedMetrics.battingAverage, league: 0.25, color: '#3B82F6' },
    { name: 'OBP', value: advancedMetrics.onBasePercentage, league: 0.32, color: '#10B981' },
    { name: 'SLG', value: advancedMetrics.sluggingPercentage, league: 0.42, color: '#F59E0B' },
    { name: 'OPS', value: advancedMetrics.ops, league: 0.74, color: '#EF4444' },
    { name: 'ISO', value: advancedMetrics.iso, league: 0.17, color: '#8B5CF6' },
    { name: 'BABIP', value: advancedMetrics.babip, league: 0.3, color: '#F97316' },
  ];

  // Performance distribution
  const performanceData = useMemo(() => {
    const gamePerformance = player.recent_games.map((game, index) => {
      const hits = game.stats.hits || 0;
      const hrs = game.stats.home_runs || 0;
      const rbis = game.stats.rbis || 0;

      let performance = 'Poor';
      if (hits >= 2 || hrs > 0 || rbis > 1) performance = 'Good';
      if (hits >= 3 || hrs >= 2 || rbis >= 3) performance = 'Great';
      if (hits >= 4 || hrs >= 3 || rbis >= 4) performance = 'Elite';

      return { game: index + 1, performance, hits, hrs, rbis };
    });

    const distribution = {
      Elite: gamePerformance.filter(g => g.performance === 'Elite').length,
      Great: gamePerformance.filter(g => g.performance === 'Great').length,
      Good: gamePerformance.filter(g => g.performance === 'Good').length,
      Poor: gamePerformance.filter(g => g.performance === 'Poor').length,
    };

    return Object.entries(distribution).map(([level, count]) => ({
      level,
      count,
      percentage: Number(((count / gamePerformance.length) * 100).toFixed(1)),
    }));
  }, [player.recent_games]);

  const COLORS = ['#8B5CF6', '#10B981', '#F59E0B', '#EF4444'];

  return (
    <div className='space-y-6'>
      {/* Core Advanced Stats */}
      <div className='bg-slate-800/60 backdrop-blur-sm border border-slate-700 rounded-lg p-6'>
        <h3 className='text-xl font-bold text-white mb-6'>Advanced Sabermetrics</h3>

        <div className='grid grid-cols-2 md:grid-cols-4 gap-4 mb-6'>
          <div className='text-center p-4 bg-slate-700/50 rounded-lg'>
            <p className='text-slate-300 text-sm'>Batting Average</p>
            <p className='text-2xl font-bold text-blue-400'>{advancedMetrics.battingAverage}</p>
          </div>
          <div className='text-center p-4 bg-slate-700/50 rounded-lg'>
            <p className='text-slate-300 text-sm'>On-Base %</p>
            <p className='text-2xl font-bold text-green-400'>{advancedMetrics.onBasePercentage}</p>
          </div>
          <div className='text-center p-4 bg-slate-700/50 rounded-lg'>
            <p className='text-slate-300 text-sm'>Slugging %</p>
            <p className='text-2xl font-bold text-yellow-400'>
              {advancedMetrics.sluggingPercentage}
            </p>
          </div>
          <div className='text-center p-4 bg-slate-700/50 rounded-lg'>
            <p className='text-slate-300 text-sm'>OPS</p>
            <p className='text-2xl font-bold text-red-400'>{advancedMetrics.ops}</p>
          </div>
        </div>

        {/* Sabermetric Comparison Chart */}
        <div className='h-64'>
          <ResponsiveContainer width='100%' height='100%'>
            <BarChart data={sabermetrics}>
              <XAxis dataKey='name' stroke='#9CA3AF' tick={{ fill: '#9CA3AF' }} />
              <YAxis stroke='#9CA3AF' tick={{ fill: '#9CA3AF' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1E293B',
                  border: '1px solid #475569',
                  borderRadius: '8px',
                }}
                formatter={(value: number, name: string) => [
                  name === 'value' ? `Player: ${value}` : `League: ${value}`,
                  name === 'value' ? 'Player' : 'League Avg',
                ]}
              />
              <Bar dataKey='value' name='Player' opacity={0.8}>
                {sabermetrics.map((entry, index) => (
                  <Cell key={`player-${index}`} fill={entry.color} />
                ))}
              </Bar>
              <Bar dataKey='league' name='League Average' opacity={0.4}>
                {sabermetrics.map((entry, index) => (
                  <Cell key={`league-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Skills Radar Chart */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        <div className='bg-slate-800/60 backdrop-blur-sm border border-slate-700 rounded-lg p-6'>
          <h3 className='text-xl font-bold text-white mb-4'>Skill Profile</h3>

          <div className='h-80'>
            <ResponsiveContainer width='100%' height='100%'>
              <RadarChart data={radarData}>
                <PolarGrid stroke='#374151' />
                <PolarAngleAxis dataKey='skill' tick={{ fill: '#9CA3AF', fontSize: 12 }} />
                <PolarRadiusAxis
                  angle={90}
                  domain={[0, 100]}
                  tick={{ fill: '#9CA3AF', fontSize: 10 }}
                />
                <Radar
                  name='Skills'
                  dataKey='value'
                  stroke='#3B82F6'
                  fill='#3B82F6'
                  fillOpacity={0.3}
                  strokeWidth={2}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          <div className='mt-4 grid grid-cols-2 gap-2 text-sm'>
            {radarData.map(skill => (
              <div key={skill.skill} className='flex justify-between text-slate-300'>
                <span>{skill.skill}:</span>
                <span className='font-semibold'>{skill.value.toFixed(0)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Performance Distribution */}
        <div className='bg-slate-800/60 backdrop-blur-sm border border-slate-700 rounded-lg p-6'>
          <h3 className='text-xl font-bold text-white mb-4'>Game Performance Distribution</h3>

          <div className='space-y-4'>
            {performanceData.map((perf, index) => (
              <div key={perf.level} className='flex items-center justify-between'>
                <div className='flex items-center'>
                  <div
                    className='w-4 h-4 rounded mr-3'
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  ></div>
                  <span className='text-slate-300 font-medium'>{perf.level}</span>
                </div>

                <div className='flex items-center space-x-4'>
                  <span className='text-slate-400 text-sm'>{perf.count} games</span>
                  <div className='w-24 bg-slate-600 rounded-full h-2'>
                    <div
                      className='h-2 rounded-full transition-all duration-300'
                      style={{
                        width: `${perf.percentage}%`,
                        backgroundColor: COLORS[index % COLORS.length],
                      }}
                    ></div>
                  </div>
                  <span className='text-slate-300 font-semibold w-12'>{perf.percentage}%</span>
                </div>
              </div>
            ))}
          </div>

          <div className='mt-6 p-4 bg-slate-700/50 rounded-lg'>
            <h4 className='font-semibold text-white mb-2'>Performance Criteria</h4>
            <div className='text-sm text-slate-300 space-y-1'>
              <div>
                <span className='text-purple-400'>Elite:</span> 4+ hits, 3+ HRs, or 4+ RBIs
              </div>
              <div>
                <span className='text-green-400'>Great:</span> 3+ hits, 2+ HRs, or 3+ RBIs
              </div>
              <div>
                <span className='text-yellow-400'>Good:</span> 2+ hits, 1+ HR, or 2+ RBIs
              </div>
              <div>
                <span className='text-red-400'>Poor:</span> Below good criteria
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Situational Performance */}
      <div className='bg-slate-800/60 backdrop-blur-sm border border-slate-700 rounded-lg p-6'>
        <h3 className='text-xl font-bold text-white mb-4'>Situational Analysis</h3>

        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
          <div className='text-center p-4 bg-slate-700/50 rounded-lg'>
            <p className='text-slate-300 text-sm'>ISO Power</p>
            <p className='text-2xl font-bold text-purple-400'>{advancedMetrics.iso}</p>
            <p className='text-xs text-slate-400 mt-1'>
              {advancedMetrics.iso > 0.2
                ? 'Elite'
                : advancedMetrics.iso > 0.15
                ? 'Above Avg'
                : advancedMetrics.iso > 0.12
                ? 'Average'
                : 'Below Avg'}
            </p>
          </div>

          <div className='text-center p-4 bg-slate-700/50 rounded-lg'>
            <p className='text-slate-300 text-sm'>BABIP</p>
            <p className='text-2xl font-bold text-orange-400'>{advancedMetrics.babip}</p>
            <p className='text-xs text-slate-400 mt-1'>
              {advancedMetrics.babip > 0.32
                ? 'Lucky'
                : advancedMetrics.babip < 0.28
                ? 'Unlucky'
                : 'Normal'}
            </p>
          </div>

          <div className='text-center p-4 bg-slate-700/50 rounded-lg'>
            <p className='text-slate-300 text-sm'>K Rate</p>
            <p className='text-2xl font-bold text-red-400'>{advancedMetrics.strikeoutRate}%</p>
            <p className='text-xs text-slate-400 mt-1'>
              {advancedMetrics.strikeoutRate < 15
                ? 'Elite Contact'
                : advancedMetrics.strikeoutRate < 20
                ? 'Good Contact'
                : advancedMetrics.strikeoutRate < 25
                ? 'Average'
                : 'High K'}
            </p>
          </div>

          <div className='text-center p-4 bg-slate-700/50 rounded-lg'>
            <p className='text-slate-300 text-sm'>BB Rate</p>
            <p className='text-2xl font-bold text-green-400'>{advancedMetrics.walkRate}%</p>
            <p className='text-xs text-slate-400 mt-1'>
              {advancedMetrics.walkRate > 12
                ? 'Elite Eye'
                : advancedMetrics.walkRate > 9
                ? 'Good Eye'
                : advancedMetrics.walkRate > 6
                ? 'Average'
                : 'Aggressive'}
            </p>
          </div>
        </div>

        {/* Performance Summary */}
        <div className='mt-6 p-4 bg-gradient-to-r from-slate-700/50 to-slate-600/50 rounded-lg'>
          <h4 className='font-semibold text-white mb-3'>Advanced Analytics Summary</h4>
          <div className='text-sm text-slate-300 space-y-2'>
            <p>
              • <strong>Offensive Profile:</strong>{' '}
              {advancedMetrics.ops > 0.9
                ? 'Elite hitter with excellent plate discipline'
                : advancedMetrics.ops > 0.8
                ? 'Above-average offensive contributor'
                : advancedMetrics.ops > 0.7
                ? 'Solid offensive player'
                : 'Developing offensive skills'}
            </p>
            <p>
              • <strong>Power Assessment:</strong>{' '}
              {advancedMetrics.iso > 0.2
                ? 'Elite power threat'
                : advancedMetrics.iso > 0.15
                ? 'Good power potential'
                : 'Contact-focused approach'}
            </p>
            <p>
              • <strong>Plate Discipline:</strong>{' '}
              {advancedMetrics.walkRate > 10 && advancedMetrics.strikeoutRate < 20
                ? 'Excellent plate approach'
                : advancedMetrics.walkRate > 8
                ? 'Good patience at the plate'
                : 'Aggressive hitter'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
