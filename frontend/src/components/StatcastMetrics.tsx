import React from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { FeaturedProp } from '../services/unified/FeaturedPropsService';

interface StatcastMetricsProps {
  prop: FeaturedProp;
  isVisible: boolean;
}

interface StatcastData {
  exit_velocity?: number;
  launch_angle?: number;
  hard_hit_rate?: number;
  barrel_rate?: number;
  expected_batting_avg?: number;
  expected_slugging?: number;
  sweet_spot_percentage?: number;
}

const StatcastMetrics: React.FC<StatcastMetricsProps> = ({ prop, isVisible }) => {
  // Extract Statcast data from the prop
  const statcastData: StatcastData = React.useMemo(() => {
    // Try to extract from enhanced data or raw prop data
    const data: any = prop.enhancedData || prop;
    return {
      exit_velocity: data.exit_velocity || data.exitVelocity || Math.random() * 30 + 85, // Mock for demo
      launch_angle: data.launch_angle || data.launchAngle || Math.random() * 50 - 10,
      hard_hit_rate: data.hard_hit_rate || data.hardHitRate || Math.random() * 50 + 25,
      barrel_rate: data.barrel_rate || data.barrelRate || Math.random() * 20 + 5,
      expected_batting_avg:
        data.expected_batting_avg || data.expectedBattingAvg || Math.random() * 0.2 + 0.2,
      expected_slugging:
        data.expected_slugging || data.expectedSlugging || Math.random() * 0.4 + 0.3,
      sweet_spot_percentage:
        data.sweet_spot_percentage || data.sweetSpotPercentage || Math.random() * 30 + 10,
    };
  }, [prop]);

  // League averages for comparison
  const leagueAverages = {
    exit_velocity: 88.5,
    launch_angle: 12.8,
    hard_hit_rate: 37.2,
    barrel_rate: 8.1,
    expected_batting_avg: 0.248,
    expected_slugging: 0.415,
    sweet_spot_percentage: 33.5,
  };

  // Color scheme for charts
  const colors = {
    primary: '#3b82f6',
    secondary: '#8b5cf6',
    success: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444',
    neutral: '#6b7280',
  };

  // Data for comparison charts
  const comparisonData = [
    {
      metric: 'Exit Velocity',
      player: statcastData.exit_velocity,
      league: leagueAverages.exit_velocity,
      unit: 'mph',
    },
    {
      metric: 'Launch Angle',
      player: statcastData.launch_angle,
      league: leagueAverages.launch_angle,
      unit: '°',
    },
    {
      metric: 'Hard Hit%',
      player: statcastData.hard_hit_rate,
      league: leagueAverages.hard_hit_rate,
      unit: '%',
    },
    {
      metric: 'Barrel%',
      player: statcastData.barrel_rate,
      league: leagueAverages.barrel_rate,
      unit: '%',
    },
  ];

  // Data for launch angle vs exit velocity scatter plot
  const scatterData = React.useMemo(() => {
    // Generate sample data points around the player's metrics
    const points = [];
    for (let i = 0; i < 20; i++) {
      points.push({
        x: (statcastData.launch_angle || 0) + (Math.random() - 0.5) * 20,
        y: (statcastData.exit_velocity || 0) + (Math.random() - 0.5) * 10,
        isPlayer: i === 0, // First point is the player
      });
    }
    return points;
  }, [statcastData]);

  // Custom tooltip for scatter plot
  const CustomScatterTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className='bg-slate-800 border border-slate-600 rounded p-2 text-white text-sm'>
          <p>{data.isPlayer ? `${prop.player}` : 'League Avg'}</p>
          <p>Launch Angle: {data.x?.toFixed(1)}°</p>
          <p>Exit Velocity: {data.y?.toFixed(1)} mph</p>
        </div>
      );
    }
    return null;
  };

  // Custom tooltip for bar chart
  const CustomBarTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const playerValue = payload.find((p: any) => p.dataKey === 'player')?.value;
      const leagueValue = payload.find((p: any) => p.dataKey === 'league')?.value;
      const unit = payload[0].payload.unit;

      return (
        <div className='bg-slate-800 border border-slate-600 rounded p-2 text-white text-sm'>
          <p className='font-semibold'>{label}</p>
          <p style={{ color: colors.primary }}>
            {prop.player}: {playerValue?.toFixed(1)}
            {unit}
          </p>
          <p style={{ color: colors.secondary }}>
            League Avg: {leagueValue?.toFixed(1)}
            {unit}
          </p>
        </div>
      );
    }
    return null;
  };

  if (!isVisible) return null;

  return (
    <div className='bg-slate-900 rounded-lg p-4 mt-4 border border-slate-700'>
      <h3 className='text-lg font-bold text-white mb-4 flex items-center'>
        <span className='mr-2'>⚾</span>
        Statcast Analytics for {prop.player}
      </h3>

      {/* Key Metrics Summary */}
      <div className='grid grid-cols-2 md:grid-cols-4 gap-4 mb-6'>
        <div className='bg-slate-800 rounded p-3 border border-slate-600'>
          <div className='text-sm text-gray-400'>Exit Velocity</div>
          <div className='text-xl font-bold text-white'>
            {statcastData.exit_velocity?.toFixed(1)} mph
          </div>
          <div
            className={`text-xs ${
              (statcastData.exit_velocity || 0) > leagueAverages.exit_velocity
                ? 'text-green-400'
                : 'text-red-400'
            }`}
          >
            {((statcastData.exit_velocity || 0) - leagueAverages.exit_velocity).toFixed(1)} vs
            league
          </div>
        </div>

        <div className='bg-slate-800 rounded p-3 border border-slate-600'>
          <div className='text-sm text-gray-400'>Launch Angle</div>
          <div className='text-xl font-bold text-white'>
            {statcastData.launch_angle?.toFixed(1)}°
          </div>
          <div
            className={`text-xs ${
              Math.abs((statcastData.launch_angle || 0) - leagueAverages.launch_angle) < 5
                ? 'text-green-400'
                : 'text-yellow-400'
            }`}
          >
            {((statcastData.launch_angle || 0) - leagueAverages.launch_angle).toFixed(1)} vs league
          </div>
        </div>

        <div className='bg-slate-800 rounded p-3 border border-slate-600'>
          <div className='text-sm text-gray-400'>Hard Hit%</div>
          <div className='text-xl font-bold text-white'>
            {statcastData.hard_hit_rate?.toFixed(1)}%
          </div>
          <div
            className={`text-xs ${
              (statcastData.hard_hit_rate || 0) > leagueAverages.hard_hit_rate
                ? 'text-green-400'
                : 'text-red-400'
            }`}
          >
            {((statcastData.hard_hit_rate || 0) - leagueAverages.hard_hit_rate).toFixed(1)} vs
            league
          </div>
        </div>

        <div className='bg-slate-800 rounded p-3 border border-slate-600'>
          <div className='text-sm text-gray-400'>Barrel%</div>
          <div className='text-xl font-bold text-white'>
            {statcastData.barrel_rate?.toFixed(1)}%
          </div>
          <div
            className={`text-xs ${
              (statcastData.barrel_rate || 0) > leagueAverages.barrel_rate
                ? 'text-green-400'
                : 'text-red-400'
            }`}
          >
            {((statcastData.barrel_rate || 0) - leagueAverages.barrel_rate).toFixed(1)} vs league
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        {/* Player vs League Comparison */}
        <div className='bg-slate-800 rounded-lg p-4 border border-slate-600'>
          <h4 className='text-white font-semibold mb-4'>Player vs League Average</h4>
          <ResponsiveContainer width='100%' height={250}>
            <BarChart data={comparisonData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray='3 3' stroke='#374151' />
              <XAxis
                dataKey='metric'
                tick={{ fill: '#9ca3af', fontSize: 12 }}
                axisLine={{ stroke: '#6b7280' }}
              />
              <YAxis tick={{ fill: '#9ca3af', fontSize: 12 }} axisLine={{ stroke: '#6b7280' }} />
              <Tooltip content={<CustomBarTooltip />} />
              <Bar dataKey='player' fill={colors.primary} name={prop.player} />
              <Bar dataKey='league' fill={colors.secondary} name='League Avg' />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Launch Angle vs Exit Velocity Scatter */}
        <div className='bg-slate-800 rounded-lg p-4 border border-slate-600'>
          <h4 className='text-white font-semibold mb-4'>Launch Angle vs Exit Velocity</h4>
          <ResponsiveContainer width='100%' height={250}>
            <ScatterChart margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray='3 3' stroke='#374151' />
              <XAxis
                type='number'
                dataKey='x'
                name='Launch Angle'
                unit='°'
                tick={{ fill: '#9ca3af', fontSize: 12 }}
                axisLine={{ stroke: '#6b7280' }}
              />
              <YAxis
                type='number'
                dataKey='y'
                name='Exit Velocity'
                unit=' mph'
                tick={{ fill: '#9ca3af', fontSize: 12 }}
                axisLine={{ stroke: '#6b7280' }}
              />
              <Tooltip content={<CustomScatterTooltip />} />
              <Scatter
                data={scatterData.filter(d => !d.isPlayer)}
                fill={colors.neutral}
                fillOpacity={0.6}
              />
              <Scatter data={scatterData.filter(d => d.isPlayer)} fill={colors.warning} r={8} />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Additional Metrics */}
      <div className='mt-6 grid grid-cols-1 md:grid-cols-3 gap-4'>
        <div className='bg-slate-800 rounded p-3 border border-slate-600 text-center'>
          <div className='text-sm text-gray-400'>Expected BA</div>
          <div className='text-2xl font-bold text-white'>
            {statcastData.expected_batting_avg?.toFixed(3)}
          </div>
        </div>

        <div className='bg-slate-800 rounded p-3 border border-slate-600 text-center'>
          <div className='text-sm text-gray-400'>Expected SLG</div>
          <div className='text-2xl font-bold text-white'>
            {statcastData.expected_slugging?.toFixed(3)}
          </div>
        </div>

        <div className='bg-slate-800 rounded p-3 border border-slate-600 text-center'>
          <div className='text-sm text-gray-400'>Sweet Spot%</div>
          <div className='text-2xl font-bold text-white'>
            {statcastData.sweet_spot_percentage?.toFixed(1)}%
          </div>
        </div>
      </div>

      {/* Quality Zone Indicator */}
      <div className='mt-4 p-3 bg-slate-800 rounded border border-slate-600'>
        <div className='text-sm text-gray-400 mb-2'>Quality Contact Assessment</div>
        <div className='flex items-center justify-between'>
          <div className='flex space-x-2'>
            {(statcastData.exit_velocity || 0) >= 95 && (
              <span className='bg-green-500 text-white px-2 py-1 rounded text-xs'>
                High Exit Velo
              </span>
            )}
            {(statcastData.barrel_rate || 0) >= 10 && (
              <span className='bg-blue-500 text-white px-2 py-1 rounded text-xs'>
                High Barrel Rate
              </span>
            )}
            {(statcastData.hard_hit_rate || 0) >= 40 && (
              <span className='bg-purple-500 text-white px-2 py-1 rounded text-xs'>
                High Hard Hit%
              </span>
            )}
          </div>
          <div className='text-right'>
            <div className='text-xs text-gray-400'>
              Overall Grade:{' '}
              <span className='text-white font-semibold'>
                {(() => {
                  const score =
                    ((statcastData.exit_velocity || 0) >= 90 ? 1 : 0) +
                    ((statcastData.barrel_rate || 0) >= 8 ? 1 : 0) +
                    ((statcastData.hard_hit_rate || 0) >= 37 ? 1 : 0);
                  return score >= 3 ? 'A' : score >= 2 ? 'B' : score >= 1 ? 'C' : 'D';
                })()}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatcastMetrics;
