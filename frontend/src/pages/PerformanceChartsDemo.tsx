/**
 * Performance Charts Demo Page
 * Phase 3: Advanced UI Features - Performance comparison charts showcase
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { BarChart3, TrendingUp, Target, Activity, Award, Zap, Filter, RefreshCw, Download, Calendar, Users, DollarSign } from 'lucide-react';
import AdvancedPerformanceCharts, { PerformanceMetric, ChartDataPoint, ChartConfig } from '../components/charts/AdvancedPerformanceCharts';
import { PlayerPerformanceChart, PerformancePoint } from '../components/charts/PlayerPerformanceChart';
import { applySmoothing, SmoothingMethod } from '../utils/smoothing';
import useRealtimeMock from '../hooks/useRealtimeMock';
import usePropFinderData from '../hooks/usePropFinderData';
import TimeframeSelect from '../components/filters/TimeframeSelect';
import HeadToHeadToggle from '../components/filters/HeadToHeadToggle';

// Props.Cash Integration: Real-time odds and performance data
interface OddsData {
  eventId: string;
  bookmaker: string;
  odds: number;
  line: number;
  timestamp: string;
}

interface PlayerPerformance {
  playerId: string;
  playerName: string;
  team: string;
  opponent: string;
  sport: string;
  stat: string;
  actual: number;
  line: number;
  odds: number;
  confidence: number;
  timestamp: string;
}

const PerformanceChartsDemo: React.FC = () => {
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [oddsData, setOddsData] = useState<OddsData[]>([]);
  const [playerPerformance, setPlayerPerformance] = useState<PlayerPerformance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSport, setSelectedSport] = useState<string>('NBA');
  const [selectedBookmaker, setSelectedBookmaker] = useState<string>('all');
  const [minConfidence, setMinConfidence] = useState<number>(60);

  // Props.Cash Integration: Fetch real-time odds data
  const fetchRealtimeOdds = useCallback(async () => {
    try {
      const response = await fetch(`/api/v1/odds/events?sport=${selectedSport}`);
      if (response.ok) {
        const data = await response.json();
        setOddsData(data.data || []);
      }
    } catch (error) {
      console.warn('Failed to fetch real-time odds:', error);
    }
  }, [selectedSport]);

  // Props.Cash Integration: Fetch player performance data
  const fetchPlayerPerformance = useCallback(async () => {
    try {
      const response = await fetch(`/api/props/performance?sport=${selectedSport}&min_confidence=${minConfidence}`);
      if (response.ok) {
        const data = await response.json();
        setPlayerPerformance(data.data || []);
      }
    } catch (error) {
      console.warn('Failed to fetch player performance:', error);
    }
  }, [selectedSport, minConfidence]);

  // Enhanced performance metrics with Props.Cash data
  const performanceMetrics: PerformanceMetric[] = [
    { id: 'roi', name: 'Return on Investment', value: 15.7, change: 2.3, changePercent: 17.2, color: '#10B981', unit: '%', format: 'percentage', benchmark: 12.0, target: 15.0 },
    { id: 'total_profit', name: 'Total Profit', value: 2547.83, change: 347.21, changePercent: 15.8, color: '#3B82F6', unit: '', format: 'currency', benchmark: 2000.00, target: 3000.00 },
    { id: 'win_rate', name: 'Win Rate', value: 67.5, change: -1.2, changePercent: -1.7, color: '#8B5CF6', unit: '%', format: 'percentage', benchmark: 65.0, target: 70.0 },
    { id: 'avg_odds', name: 'Average Odds', value: 1.85, change: 0.05, changePercent: 2.8, color: '#F59E0B', unit: '', format: 'decimal', benchmark: 1.80, target: 1.90 },
    { id: 'sharpe_ratio', name: 'Sharpe Ratio', value: 1.42, change: 0.18, changePercent: 14.5, color: '#EF4444', unit: '', format: 'decimal', benchmark: 1.20, target: 1.50 },
    { id: 'max_drawdown', name: 'Max Drawdown', value: -8.3, change: 2.1, changePercent: -20.2, color: '#6B7280', unit: '%', format: 'percentage', benchmark: -10.0, target: -5.0 },
    // Props.Cash Integration: Add real-time metrics
    { id: 'live_edge', name: 'Live Edge Detection', value: 23.4, change: 5.2, changePercent: 28.6, color: '#06D6A0', unit: '%', format: 'percentage', benchmark: 15.0, target: 25.0 },
    { id: 'odds_movement', name: 'Odds Movement', value: 12.8, change: -2.1, changePercent: -14.1, color: '#F72585', unit: '%', format: 'percentage', benchmark: 10.0, target: 15.0 }
  ];

  // Generate enhanced chart data with Props.Cash integration
  useEffect(() => {
    const generateEnhancedData = async () => {
      setIsLoading(true);

      // Fetch real-time data
      await Promise.all([
        fetchRealtimeOdds(),
        fetchPlayerPerformance()
      ]);

      const now = Date.now();
      const days = 90;
      const data: ChartDataPoint[] = [];

      for (let i = days; i >= 0; i--) {
        const date = new Date(now - (i * 24 * 60 * 60 * 1000));
        const timestamp = date.getTime();

        // Enhanced data generation with Props.Cash insights
        const baseROI = 12 + Math.sin(i / 10) * 3 + (Math.random() - 0.5) * 2;
        const liveEdge = 15 + Math.cos(i / 8) * 5 + (Math.random() - 0.5) * 3;
        const oddsMovement = 10 + Math.sin(i / 12) * 4 + (Math.random() - 0.5) * 2;

        data.push({
          date: date.toISOString().split('T')[0],
          timestamp,
          metrics: {
            roi: Math.max(0, baseROI),
            total_profit: Math.max(0, 1500 + (days - i) * 15 + Math.sin(i / 15) * 200 + (Math.random() - 0.5) * 100),
            win_rate: Math.min(100, Math.max(0, 65 + Math.cos(i / 8) * 5 + (Math.random() - 0.5) * 3)),
            avg_odds: Math.max(1.1, 1.80 + Math.sin(i / 12) * 0.1 + (Math.random() - 0.5) * 0.05),
            sharpe_ratio: Math.max(0, 1.20 + (days - i) * 0.003 + (Math.random() - 0.5) * 0.1),
            max_drawdown: Math.min(0, -15 + Math.cos(i / 20) * 5 + (Math.random() - 0.5) * 2),
            // Props.Cash Integration: Add real-time metrics
            live_edge: Math.max(0, liveEdge),
            odds_movement: Math.max(0, oddsMovement)
          },
          metadata: {
            trades_count: Math.floor(Math.random() * 20) + 5,
            volume: Math.floor(Math.random() * 10000) + 1000,
            // Props.Cash Integration: Add real-time metadata
            arbitrage_opportunities: Math.floor(Math.random() * 5),
            line_movements: Math.floor(Math.random() * 15) + 5
          }
        });
      }

      setChartData(data);
      setIsLoading(false);
    };

    generateEnhancedData();
  }, [selectedSport, selectedBookmaker, minConfidence]);

  // Props.Cash Integration: Auto-refresh data
  useEffect(() => {
    const interval = setInterval(() => {
      fetchRealtimeOdds();
      fetchPlayerPerformance();
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [selectedSport, minConfidence]);

  // Props.Cash Integration: Filter data by bookmaker
  const filteredOddsData = useMemo(() => {
    if (selectedBookmaker === 'all') return oddsData;
    return oddsData.filter(odds => odds.bookmaker === selectedBookmaker);
  }, [oddsData, selectedBookmaker]);

  // Props.Cash Integration: Filter performance data by confidence
  const filteredPerformanceData = useMemo(() => {
    return playerPerformance.filter(player => player.confidence >= minConfidence);
  }, [playerPerformance, minConfidence]);

  const handleConfigChange = (_config: ChartConfig) => {
    // Handle chart configuration changes for Props.Cash integration
    // This could trigger data refresh or filter updates
  };

  // --- Props.Cash style interactive demo below ---
  const seedData: PerformancePoint[] = [
    { date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 12).toISOString(), actual: 22, line: 20, opponent: 'NYK' },
    { date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString(), actual: 18, line: 19, opponent: 'BOS' },
    { date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 8).toISOString(), actual: 30, line: 25, opponent: 'LAL' },
    { date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 6).toISOString(), actual: 26, line: 24, opponent: 'MIA' },
    { date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4).toISOString(), actual: 15, line: 17, opponent: 'CHI' },
    { date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(), actual: 28, line: 26, opponent: 'DAL' },
  ];

  const [lastN, setLastN] = useState<number | undefined>(10);
  const [opponentFilter, setOpponentFilter] = useState<string>('all');
  const [headToHeadOnly, setHeadToHeadOnly] = useState<boolean>(false);
  const [autoRefresh, setAutoRefresh] = useState<boolean>(true);
  const [refreshIntervalMs, setRefreshIntervalMs] = useState<number>(30_000);
  const [smoothing, setSmoothing] = useState<boolean>(false);
  const [smoothingWindow, setSmoothingWindow] = useState<number>(3);
  const [smoothingMethod, setSmoothingMethod] = useState<SmoothingMethod>('sma');

  // Call both hooks unconditionally to preserve hook rules
  const apiData = usePropFinderData({ autoRefresh, refreshIntervalMs: refreshIntervalMs });
  const mockLive = useRealtimeMock<PerformancePoint[]>(seedData, (prev) => {
    const next = prev.slice();
    const newPoint = {
      date: new Date().toISOString(),
      actual: Math.max(5, Math.round(20 + (Math.random() - 0.5) * 12)),
      line: Math.max(5, Math.round(18 + (Math.random() - 0.5) * 8)),
      opponent: ['NYK', 'BOS', 'LAL', 'MIA', 'CHI', 'DAL'][Math.floor(Math.random() * 6)],
    };
    next.push(newPoint);
    if (next.length > 30) next.shift();
    return next;
  }, 4000);

  // Prefer API performance data when available, otherwise use the mock feed
  const liveData = apiData.performance && apiData.performance.length > 0
    ? apiData.performance.slice().map((p) => ({ date: p.date, actual: p.actual, line: p.line, opponent: p.opponent }))
    : mockLive;

  const opponents = useMemo(() => Array.from(new Set(liveData.map((d) => d.opponent || ''))).filter(Boolean), [liveData]);

  const filtered = useMemo(() => {
    let list = liveData.slice();

    // Apply opponent filter
    if (opponentFilter !== 'all') {
      list = list.filter((d) => d.opponent === opponentFilter);
    }

    // If head-to-head only is enabled and an opponent is selected, keep only that opponent
    if (headToHeadOnly && opponentFilter !== 'all') {
      list = list.filter((d) => d.opponent === opponentFilter);
    }

    // Apply lastN (take most recent N entries). Ensure sorting by timestamp/date.
    if (typeof lastN === 'number' && lastN > 0) {
      list = list
        .slice()
        .sort((a, b) => (new Date(a.date).getTime() - new Date(b.date).getTime()))
        .slice(Math.max(0, list.length - lastN));
    }

    return list;
  }, [liveData, opponentFilter, headToHeadOnly, lastN]);

  const displayData = useMemo(() => {
    const base = filtered.slice();
    return smoothing ? applySmoothing(base, smoothingMethod, smoothingWindow) : base;
  }, [filtered, smoothing, smoothingMethod, smoothingWindow]);

  const exportCsv = (rows: PerformancePoint[]) => {
    if (!rows || rows.length === 0) return;
    const header = ['date','actual','line','opponent'];
    const csv = [header.join(',')]
      .concat(rows.map(r => `${r.date},${r.actual},${r.line},${r.opponent ?? ''}`))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `performance_export_${new Date().toISOString().slice(0,10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading performance data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 flex items-center space-x-3">
                  <div className="p-2 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg">
                    <BarChart3 className="w-8 h-8 text-white" />
                  </div>
                  <span>Performance Comparison Charts</span>
                </h1>
                <p className="mt-2 text-lg text-gray-600">Phase 3: Interactive performance visualization with Props.Cash real-time data integration</p>
              </div>

              <div className="flex items-center space-x-4">
                {/* Props.Cash Integration: Real-time data filters */}
                <div className="flex items-center space-x-3 bg-gray-50 rounded-lg p-3">
                  <Filter className="w-4 h-4 text-gray-600" />
                  <div className="flex items-center space-x-2">
                    <label className="text-sm font-medium text-gray-700">Sport:</label>
                    <select
                      value={selectedSport}
                      onChange={(e) => setSelectedSport(e.target.value)}
                      className="text-sm border rounded px-2 py-1"
                    >
                      <option value="NBA">NBA</option>
                      <option value="MLB">MLB</option>
                      <option value="NFL">NFL</option>
                      <option value="NHL">NHL</option>
                    </select>
                  </div>
                  <div className="flex items-center space-x-2">
                    <label className="text-sm font-medium text-gray-700">Bookmaker:</label>
                    <select
                      value={selectedBookmaker}
                      onChange={(e) => setSelectedBookmaker(e.target.value)}
                      className="text-sm border rounded px-2 py-1"
                    >
                      <option value="all">All</option>
                      <option value="FanDuel">FanDuel</option>
                      <option value="DraftKings">DraftKings</option>
                      <option value="BetMGM">BetMGM</option>
                    </select>
                  </div>
                  <div className="flex items-center space-x-2">
                    <label className="text-sm font-medium text-gray-700">Min Confidence:</label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={minConfidence}
                      onChange={(e) => setMinConfidence(Number(e.target.value))}
                      className="w-20"
                    />
                    <span className="text-sm text-gray-600 w-8">{minConfidence}%</span>
                  </div>
                  <div className="text-xs text-gray-500">
                    {filteredOddsData.length} odds • {filteredPerformanceData.length} players
                  </div>
                </div>

                <div className="text-right">
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <TimeframeSelect value={lastN} onChange={setLastN} />

                    <label>
                      Opponent:
                      <select value={opponentFilter} onChange={(e) => setOpponentFilter(e.target.value)} className="ml-2">
                        <option value={'all'}>All</option>
                        {opponents.map((o) => (
                          <option key={o} value={o}>{o}</option>
                        ))}
                      </select>
                    </label>

                    <HeadToHeadToggle value={headToHeadOnly} onChange={setHeadToHeadOnly} label="Head-to-head only" />

                    <label className="ml-4 inline-flex items-center">
                      <input type="checkbox" checked={autoRefresh} onChange={(e) => setAutoRefresh(e.target.checked)} />
                      <span className="ml-2 text-sm">Auto-refresh</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Demo Player Performance Chart */}
        <div className="mb-8 bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <label className="inline-flex items-center">
                <input type="checkbox" checked={smoothing} onChange={(e) => setSmoothing(e.target.checked)} />
                <span className="ml-2 text-sm">Smoothing (moving avg)</span>
              </label>

              <label className="inline-flex items-center">
                Window:
                <input type="number" min={1} value={smoothingWindow} onChange={(e) => setSmoothingWindow(Number(e.target.value))} className="ml-2 w-16" />
              </label>
              <label className="inline-flex items-center ml-4">
                Method:
                <select value={smoothingMethod} onChange={(e) => setSmoothingMethod(e.target.value as SmoothingMethod)} className="ml-2 border rounded p-1">
                  <option value={'sma'}>SMA</option>
                  <option value={'ema'}>EMA</option>
                  <option value={'none'}>None</option>
                </select>
              </label>
            </div>

            <div className="flex items-center gap-3">
              <button onClick={() => exportCsv(displayData)} className="px-3 py-1 bg-blue-600 text-white rounded">Export CSV</button>
              <label className="inline-flex items-center">
                Refresh interval (ms):
                <input type="number" min={1000} value={refreshIntervalMs} onChange={(e) => setRefreshIntervalMs(Number(e.target.value))} className="ml-2 w-28" />
              </label>
            </div>
          </div>

          <PlayerPerformanceChart data={displayData} lastN={lastN} />
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          {performanceMetrics.map((metric) => (
            <div key={metric.id} className="bg-white rounded-lg shadow-md p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-600 truncate">{metric.name}</h3>
                {metric.change > 0 ? (
                  <TrendingUp className="w-4 h-4 text-green-500" />
                ) : (
                  <Activity className="w-4 h-4 text-red-500" />
                )}
              </div>
              <div className="flex items-baseline space-x-2">
                <span className="text-xl font-bold" style={{ color: metric.color }}>
                  {metric.format === 'currency' ? `$${metric.value.toFixed(0)}` :
                   metric.format === 'percentage' ? `${metric.value.toFixed(1)}%` :
                   metric.value.toFixed(2)}
                </span>
                <span className={`text-xs ${metric.change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {metric.change > 0 ? '+' : ''}{metric.changePercent.toFixed(1)}%
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Main Chart Component */}
        <div className="mb-8">
          <AdvancedPerformanceCharts
            data={chartData}
            metrics={performanceMetrics}
            onConfigChange={handleConfigChange}
            enableExport={true}
            enableFullscreen={true}
            className="h-auto"
          />
        </div>

        {/* Props.Cash Integration: Real-time Data Display */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Live Odds Data */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                <DollarSign className="w-5 h-5 text-green-600 mr-2" />
                Live Odds Data ({filteredOddsData.length})
              </h3>
              <button
                onClick={fetchRealtimeOdds}
                className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
              >
                <RefreshCw className="w-3 h-3 inline mr-1" />
                Refresh
              </button>
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {filteredOddsData.length > 0 ? (
                filteredOddsData.slice(0, 10).map((odds, index) => (
                  <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                    <div>
                      <span className="font-medium">{odds.eventId}</span>
                      <span className="text-sm text-gray-600 ml-2">({odds.bookmaker})</span>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-green-600">{odds.odds.toFixed(2)}</div>
                      <div className="text-xs text-gray-500">Line: {odds.line}</div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-4">No odds data available</p>
              )}
            </div>
          </div>

          {/* Player Performance Data */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                <Users className="w-5 h-5 text-blue-600 mr-2" />
                Player Performance ({filteredPerformanceData.length})
              </h3>
              <button
                onClick={fetchPlayerPerformance}
                className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
              >
                <RefreshCw className="w-3 h-3 inline mr-1" />
                Refresh
              </button>
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {filteredPerformanceData.length > 0 ? (
                filteredPerformanceData.slice(0, 10).map((player, index) => (
                  <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                    <div>
                      <span className="font-medium">{player.playerName}</span>
                      <span className="text-sm text-gray-600 ml-2">vs {player.opponent}</span>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-blue-600">{player.actual} pts</div>
                      <div className="text-xs text-gray-500">Line: {player.line} | {player.confidence}%</div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-4">No performance data available</p>
              )}
            </div>
          </div>
        </div>

        {/* Feature Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <FeatureCard
            icon={BarChart3}
            title="Multiple Chart Types"
            description="Line, bar, area, and comparison charts with real-time data"
            color="bg-blue-500"
          />
          <FeatureCard
            icon={Target}
            title="Benchmark Comparison"
            description="Compare performance against market benchmarks and targets"
            color="bg-green-500"
          />
          <FeatureCard
            icon={Activity}
            title="Interactive Controls"
            description="Customize timeframes, metrics, and visualization options"
            color="bg-purple-500"
          />
          <FeatureCard
            icon={Award}
            title="Performance Insights"
            description="AI-powered insights and recommendations based on trends"
            color="bg-orange-500"
          />
          <FeatureCard
            icon={RefreshCw}
            title="Props.Cash Integration"
            description="Real-time odds data, player performance, and live edge detection"
            color="bg-red-500"
          />
        </div>

        {/* Technical Features */}
        <div className="mt-12 bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
            <Zap className="w-5 h-5 text-yellow-500 mr-2" />
            Advanced Features Implemented
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium text-gray-800 mb-2">Chart Capabilities</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Multi-metric overlay comparisons</li>
                <li>• Interactive timeline controls</li>
                <li>• Benchmark and target line overlays</li>
                <li>• Real-time data updates</li>
                <li>• Customizable aggregation methods</li>
                <li>• Fullscreen visualization mode</li>
              </ul>
            </div>

            <div>
              <h3 className="font-medium text-gray-800 mb-2">Props.Cash Integration</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Real-time odds data from multiple sportsbooks</li>
                <li>• Live player performance metrics</li>
                <li>• Confidence-based filtering (0-100%)</li>
                <li>• Sport-specific data aggregation</li>
                <li>• Auto-refresh every 30 seconds</li>
                <li>• Advanced bookmaker filtering</li>
              </ul>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <h3 className="font-medium text-gray-800 mb-2">Technical Implementation</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Responsive design with mobile support</li>
              <li>• Export-ready visualizations</li>
              <li>• Performance-optimized rendering</li>
              <li>• Configurable chart dimensions</li>
              <li>• Smart data aggregation</li>
              <li>• Advanced filtering options</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

// Feature Card Component
const FeatureCard: React.FC<{
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  title: string;
  description: string;
  color: string;
}> = ({ icon: Icon, title, description, color }) => (
  <div className="bg-white rounded-lg shadow-md p-6">
    <div className="flex items-center space-x-3 mb-3">
      <div className={`p-2 rounded-lg ${color}`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
    </div>
    <p className="text-gray-600">{description}</p>
  </div>
);

export default PerformanceChartsDemo;
