/**
 * PlayerLineTrendChart - Enhanced chart component for player performance vs betting lines
 * Uses Recharts for consistent styling with the rest of the app
 * Integrates with the new /api/players/performance endpoint
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  Dot
} from 'recharts';

export interface PlayerPerformanceGame {
  date: string;
  stat_value: number;
  line_at_time: number;
  result_over: boolean;
  opponent?: string;
  home?: boolean;
  confidence?: number;
}

export interface PlayerPerformanceStats {
  rolling_avg: number;
  hit_rate: number;
  std_dev: number;
  total_games: number;
  over_count: number;
  under_count: number;
  avg_line: number;
  avg_actual: number;
}

export interface PlayerPerformanceData {
  player: string;
  sport: string;
  market: string;
  window: number;
  recent_games: PlayerPerformanceGame[];
  stats: PlayerPerformanceStats;
  timestamp: string;
}

interface PlayerLineTrendChartProps {
  /** Player name */
  player: string;
  /** Sport (MLB, NBA, NFL, NHL) */
  sport: string;
  /** Market type (HR, Hits, Points, etc.) */
  market: string;
  /** Number of recent games to display */
  window?: number;
  /** Chart height in pixels */
  height?: number;
  /** Show statistics summary */
  showStats?: boolean;
  /** Chart title override */
  title?: string;
  /** Loading state override */
  loading?: boolean;
  /** Error state override */
  error?: string;
  /** Data override for testing */
  data?: PlayerPerformanceData;
}

interface ChartDataPoint {
  index: number;
  date: string;
  fullDate: string;
  actual: number;
  line: number;
  result_over: boolean;
  opponent?: string;
  home?: boolean;
  confidence?: number;
}

interface CustomDotProps {
  cx?: number;
  cy?: number;
  payload?: ChartDataPoint;
}

interface TooltipProps {
  active?: boolean;
  payload?: Array<{ payload: ChartDataPoint }>;
  label?: string;
}

// Simple loading component
const LoadingSpinner: React.FC = () => (
  <div className="flex items-center justify-center">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
  </div>
);

// Simple card component
const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ 
  children, 
  className = '' 
}) => (
  <div className={`bg-white rounded-lg shadow-md border border-gray-200 ${className}`}>
    {children}
  </div>
);

const PlayerLineTrendChart: React.FC<PlayerLineTrendChartProps> = ({
  player,
  sport,
  market,
  window = 10,
  height = 300,
  showStats = true,
  title,
  loading: loadingOverride,
  error: errorOverride,
  data: dataOverride
}) => {
  const [data, setData] = useState<PlayerPerformanceData | null>(dataOverride || null);
  const [loading, setLoading] = useState(loadingOverride ?? false);
  const [error, setError] = useState<string | null>(errorOverride || null);

  // Fetch performance data from API
  useEffect(() => {
    if (dataOverride) {
      setData(dataOverride);
      return;
    }

    const fetchPerformanceData = async () => {
      if (!player || !sport || !market) return;

      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({
          sport,
          player: encodeURIComponent(player),
          market,
          window: window.toString()
        });

        const response = await fetch(`/api/players/performance?${params}`);
        const result = await response.json();

        if (result.success) {
          setData(result.data);
        } else {
          setError(result.error?.message || 'Failed to fetch performance data');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Network error');
      } finally {
        setLoading(false);
      }
    };

    fetchPerformanceData();
  }, [player, sport, market, window, dataOverride]);

  // Transform data for Recharts
  const chartData = useMemo(() => {
    if (!data?.recent_games) return [];

    return data.recent_games
      .slice()
      .reverse() // Show chronological order (oldest to newest)
      .map((game, index) => ({
        index,
        date: new Date(game.date).toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric' 
        }),
        fullDate: game.date,
        actual: game.stat_value,
        line: game.line_at_time,
        result_over: game.result_over,
        opponent: game.opponent,
        home: game.home,
        confidence: game.confidence
      }));
  }, [data]);

  // Custom dot component to show over/under results
  const CustomDot: React.FC<CustomDotProps> = ({ cx, cy, payload }) => {
    if (!payload || payload.result_over === undefined) return null;

    return (
      <Dot
        cx={cx}
        cy={cy}
        r={4}
        fill={payload.result_over ? '#10b981' : '#ef4444'}
        stroke={payload.result_over ? '#059669' : '#dc2626'}
        strokeWidth={2}
      />
    );
  };

  // Custom tooltip
  const CustomTooltip: React.FC<TooltipProps> = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const gameData = payload[0].payload;
      return (
        <div className="bg-white p-3 border rounded-lg shadow-lg">
          <p className="font-semibold">{`${label} ${gameData.opponent || ''}`}</p>
          <p className="text-blue-600">{`Actual: ${gameData.actual}`}</p>
          <p className="text-red-600">{`Line: ${gameData.line}`}</p>
          <p className={`font-medium ${gameData.result_over ? 'text-green-600' : 'text-red-600'}`}>
            {gameData.result_over ? 'Over ✓' : 'Under ✗'}
          </p>
          {gameData.confidence && (
            <p className="text-gray-600">{`Confidence: ${(gameData.confidence * 100).toFixed(1)}%`}</p>
          )}
          <p className="text-sm text-gray-500">{gameData.home ? 'Home' : 'Away'}</p>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner />
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-6">
        <div className="text-center text-red-600">
          <p className="font-semibold">Error loading performance data</p>
          <p className="text-sm">{error}</p>
        </div>
      </Card>
    );
  }

  if (!data || chartData.length === 0) {
    return (
      <Card className="p-6">
        <div className="text-center text-gray-500">
          <p>No performance data available</p>
        </div>
      </Card>
    );
  }

  const chartTitle = title || `${data.player} - ${data.market} (Last ${data.window} Games)`;

  return (
    <Card className="p-6">
      <div className="space-y-4">
        {/* Chart Header */}
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900">{chartTitle}</h3>
          <div className="text-sm text-gray-500">
            Updated: {new Date(data.timestamp).toLocaleTimeString()}
          </div>
        </div>

        {/* Performance Stats */}
        {showStats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{data.stats.rolling_avg}</div>
              <div className="text-sm text-gray-600">Avg Performance</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{data.stats.hit_rate}%</div>
              <div className="text-sm text-gray-600">Hit Rate</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{data.stats.std_dev}</div>
              <div className="text-sm text-gray-600">Std Dev</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-600">
                {data.stats.over_count}/{data.stats.total_games}
              </div>
              <div className="text-sm text-gray-600">Over/Total</div>
            </div>
          </div>
        )}

        {/* Chart */}
        <div style={{ height: height }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12 }}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              
              {/* Average line reference */}
              <ReferenceLine 
                y={data.stats.rolling_avg} 
                stroke="#8b5cf6" 
                strokeDasharray="5 5"
                label={{ value: "Avg", position: "insideTopRight" }}
              />
              
              {/* Betting Line */}
              <Line 
                type="monotone" 
                dataKey="line" 
                stroke="#ef4444" 
                strokeWidth={2}
                strokeDasharray="5 5"
                name="Betting Line"
                dot={false}
              />
              
              {/* Actual Performance */}
              <Line 
                type="monotone" 
                dataKey="actual" 
                stroke="#2563eb" 
                strokeWidth={2}
                name="Actual Performance"
                dot={<CustomDot />}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        <div className="flex justify-center space-x-6 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
            <span>Actual Performance</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-0.5 bg-red-500" style={{ borderTop: '2px dashed' }}></div>
            <span>Betting Line</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-0.5 bg-purple-500" style={{ borderTop: '2px dashed' }}></div>
            <span>Average</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span>Over</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span>Under</span>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default PlayerLineTrendChart;