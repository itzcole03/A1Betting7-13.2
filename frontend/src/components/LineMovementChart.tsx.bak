import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  ReferenceLine 
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  AlertCircle, 
  Activity,
  BarChart3,
  Zap
} from 'lucide-react';

interface LineMovementData {
  timestamp: string;
  line: number | null;
  over_odds: number | null;
  under_odds: number | null;
  over_price: number | null;
  under_price: number | null;
}

interface MovementAnalysis {
  prop_id: string;
  sportsbook: string;
  movement_1h: number | null;
  movement_6h: number | null;
  movement_24h: number | null;
  movement_total: number | null;
  velocity_1h: number | null;
  velocity_recent: number | null;
  volatility_score: number | null;
  direction_changes: number;
  is_steam: boolean;
  steam_detected_at: string | null;
  opening_line: number | null;
  current_line: number | null;
  opening_odds: number | null;
  current_odds: number | null;
  computed_at: string;
}

interface SteamAlert {
  prop_id: string;
  detected_at: string;
  books_moving: string[];
  movement_size: number;
  synchronized_window_minutes: number;
  confidence_score: number;
}

interface LineMovementChartProps {
  propId: string;
  sportsbook?: string;
  onSteamDetected?: (alert: SteamAlert) => void;
  className?: string;
}

const LineMovementChart: React.FC<LineMovementChartProps> = ({
  propId,
  sportsbook = 'fanduel',
  onSteamDetected,
  className = ''
}) => {
  const [lineHistory, setLineHistory] = useState<LineMovementData[]>([]);
  const [movementAnalysis, setMovementAnalysis] = useState<MovementAnalysis | null>(null);
  const [steamAlert, setSteamAlert] = useState<SteamAlert | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<'1h' | '6h' | '24h' | '7d' | '30d'>('24h');
  const [autoRefresh, setAutoRefresh] = useState(false);

  // Fetch line history data
  const fetchLineHistory = useCallback(async () => {
    if (!propId || !sportsbook) return;

    setLoading(true);
    setError(null);

    try {
      const hours = timeRange === '1h' ? 1 : timeRange === '6h' ? 6 : timeRange === '24h' ? 24 : 168;
      
      const response = await fetch(
        `/v1/odds/history/${propId}/${sportsbook}?hours_back=${hours}&limit=200`
      );
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      if (result.success && result.data?.snapshots) {
        setLineHistory(result.data.snapshots);
      } else {
        throw new Error(result.error?.message || 'Failed to fetch line history');
      }
    } catch (err) {
      // Error fetching line history - handled silently
      setError(err instanceof Error ? err.message : 'Failed to fetch line history');
      setLineHistory([]);
    } finally {
      setLoading(false);
    }
  }, [propId, sportsbook, timeRange]);

  // Fetch movement analysis
  const fetchMovementAnalysis = useCallback(async () => {
    if (!propId || !sportsbook) return;

    try {
      const hours = timeRange === '1h' ? 1 : timeRange === '6h' ? 6 : timeRange === '24h' ? 24 : 168;
      
      const response = await fetch(
        `/v1/odds/line-movement/${propId}/${sportsbook}?hours_back=${hours}`
      );
      
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          setMovementAnalysis(result.data);
        }
      }
    } catch {
      // Error fetching movement analysis - handled silently
    }
  }, [propId, sportsbook, timeRange]);

  // Check for steam detection
  const checkSteamDetection = useCallback(async () => {
    if (!propId) return;

    try {
      const response = await fetch(
        `/v1/odds/steam-detection/${propId}`
      );
      
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          const alert = result.data as SteamAlert;
          setSteamAlert(alert);
          if (onSteamDetected) {
            onSteamDetected(alert);
          }
        } else {
          setSteamAlert(null);
        }
      }
    } catch {
      // Error checking steam detection - handled silently
    }
  }, [propId, onSteamDetected]);

  // Load data on mount and prop changes
  useEffect(() => {
    fetchLineHistory();
    fetchMovementAnalysis();
    checkSteamDetection();
  }, [fetchLineHistory, fetchMovementAnalysis, checkSteamDetection]);

  // Auto refresh setup
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchLineHistory();
      fetchMovementAnalysis();
      checkSteamDetection();
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, [autoRefresh, fetchLineHistory, fetchMovementAnalysis, checkSteamDetection]);

  // Format chart data
  const chartData = useMemo(() => {
    return lineHistory
      .filter(point => point.line !== null)
      .map(point => ({
        ...point,
        timestamp_formatted: new Date(point.timestamp).toLocaleTimeString(),
        line: Number(point.line)
      }))
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }, [lineHistory]);

  // Calculate movement indicators
  const movementIndicators = useMemo(() => {
    if (!movementAnalysis) return null;

    const getMovementForTimeRange = () => {
      switch (timeRange) {
        case '1h': return movementAnalysis.movement_1h;
        case '6h': return movementAnalysis.movement_6h;
        case '24h': return movementAnalysis.movement_24h;
        default: return movementAnalysis.movement_total;
      }
    };

    const movement = getMovementForTimeRange();
    const isPositive = movement ? movement > 0 : false;
    const isSignificant = movement ? Math.abs(movement) >= 0.5 : false;

    return {
      movement,
      isPositive,
      isSignificant,
      velocity: movementAnalysis.velocity_recent,
      volatility: movementAnalysis.volatility_score,
      directionChanges: movementAnalysis.direction_changes
    };
  }, [movementAnalysis, timeRange]);

  if (loading && chartData.length === 0) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border p-6 ${className}`}>
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center space-x-2 text-gray-500">
            <Activity className="w-5 h-5 animate-spin" />
            <span>Loading line movement data...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border p-6 ${className}`}>
        <div className="flex items-center space-x-2 text-red-600 mb-4">
          <AlertCircle className="w-5 h-5" />
          <span className="font-medium">Error Loading Line Movement</span>
        </div>
        <p className="text-gray-600 mb-4">{error}</p>
        <button
          onClick={fetchLineHistory}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  if (chartData.length === 0) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border p-6 ${className}`}>
        <div className="text-center text-gray-500">
          <BarChart3 className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p>No line movement data available for this prop</p>
          <p className="text-sm mt-1">Data will appear once betting lines are tracked</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm border ${className}`}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Line Movement</h3>
            <p className="text-sm text-gray-500">
              {sportsbook} • {chartData.length} data points
            </p>
          </div>
          
          <div className="flex items-center space-x-3">
            {/* Steam Alert */}
            {steamAlert && (
              <div className="flex items-center space-x-2 px-3 py-1 bg-red-50 text-red-700 rounded-full border border-red-200">
                <Zap className="w-4 h-4" />
                <span className="text-sm font-medium">Steam Detected</span>
              </div>
            )}
            
            {/* Time Range Selector */}
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as '1h' | '6h' | '24h' | '7d' | '30d')}
              className="text-sm border border-gray-300 rounded-md px-3 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="1h">1 Hour</option>
              <option value="6h">6 Hours</option>
              <option value="24h">24 Hours</option>
              <option value="7d">7 Days</option>
            </select>
            
            {/* Auto Refresh Toggle */}
            <label className="flex items-center space-x-2 text-sm">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-gray-600">Auto refresh</span>
            </label>
          </div>
        </div>
      </div>

      {/* Movement Indicators */}
      {movementIndicators && (
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <div className="grid grid-cols-4 gap-4">
            {/* Total Movement */}
            <div className="text-center">
              <div className="flex items-center justify-center space-x-1">
                {movementIndicators.isPositive ? (
                  <TrendingUp className="w-4 h-4 text-green-600" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-red-600" />
                )}
                <span className={`text-sm font-medium ${
                  movementIndicators.isSignificant
                    ? movementIndicators.isPositive ? 'text-green-600' : 'text-red-600'
                    : 'text-gray-600'
                }`}>
                  {movementIndicators.movement?.toFixed(2) || 'N/A'}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">Movement</p>
            </div>
            
            {/* Velocity */}
            <div className="text-center">
              <div className="text-sm font-medium text-gray-900">
                {movementIndicators.velocity?.toFixed(3) || 'N/A'}
              </div>
              <p className="text-xs text-gray-500 mt-1">Velocity/hr</p>
            </div>
            
            {/* Volatility */}
            <div className="text-center">
              <div className="text-sm font-medium text-gray-900">
                {movementIndicators.volatility?.toFixed(3) || 'N/A'}
              </div>
              <p className="text-xs text-gray-500 mt-1">Volatility</p>
            </div>
            
            {/* Direction Changes */}
            <div className="text-center">
              <div className="text-sm font-medium text-gray-900">
                {movementIndicators.directionChanges}
              </div>
              <p className="text-xs text-gray-500 mt-1">Direction Changes</p>
            </div>
          </div>
        </div>
      )}

      {/* Chart */}
      <div className="p-6">
        <div style={{ height: '300px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis 
                dataKey="timestamp_formatted" 
                tick={{ fontSize: 12 }}
                stroke="#64748b"
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                stroke="#64748b"
                domain={['dataMin - 0.5', 'dataMax + 0.5']}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e2e8f0',
                  borderRadius: '6px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
                formatter={(value: number | string, name: string) => [
                  `${Number(value).toFixed(2)}`,
                  name === 'line' ? 'Line' : name
                ]}
                labelFormatter={(label) => `Time: ${label}`}
              />
              
              {/* Opening line reference */}
              {movementAnalysis?.opening_line && (
                <ReferenceLine
                  y={movementAnalysis.opening_line}
                  stroke="#6b7280"
                  strokeDasharray="5 5"
                  label={{ value: "Opening", position: "left" }}
                />
              )}
              
              {/* Main line */}
              <Line
                type="monotone"
                dataKey="line"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ fill: '#3b82f6', strokeWidth: 0, r: 3 }}
                activeDot={{ r: 5, stroke: '#3b82f6', strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Steam Alert Details */}
      {steamAlert && (
        <div className="px-6 py-4 bg-red-50 border-t border-red-200">
          <div className="flex items-start space-x-3">
            <Zap className="w-5 h-5 text-red-600 mt-0.5" />
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-red-900">Steam Alert</h4>
                <span className="text-sm text-red-600">
                  {new Date(steamAlert.detected_at).toLocaleTimeString()}
                </span>
              </div>
              
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-red-700 font-medium">Movement:</span>
                  <span className="ml-1 text-red-900">{steamAlert.movement_size.toFixed(2)}</span>
                </div>
                <div>
                  <span className="text-red-700 font-medium">Books:</span>
                  <span className="ml-1 text-red-900">{steamAlert.books_moving.length}</span>
                </div>
                <div>
                  <span className="text-red-700 font-medium">Confidence:</span>
                  <span className="ml-1 text-red-900">{(steamAlert.confidence_score * 100).toFixed(1)}%</span>
                </div>
              </div>
              
              <p className="text-xs text-red-600 mt-2">
                {steamAlert.books_moving.join(', ')} moved simultaneously within {steamAlert.synchronized_window_minutes} minutes
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LineMovementChart;