/**
 * Performance Charts Demo Page
 * Phase 3: Advanced UI Features - Performance comparison charts showcase
 */

import {
  Activity,
  Award,
  BarChart3,
  ClipboardList,
  DollarSign,
  Filter,
  PieChart,
  RefreshCw,
  Sparkles,
  Target,
  TrendingUp,
  Users,
  Zap,
} from 'lucide-react';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import AdvancedPerformanceCharts, {
  ChartConfig,
  ChartDataPoint,
  PerformanceMetric,
} from '../components/charts/AdvancedPerformanceCharts';
import MultiBookOddsChart, { BookmakerOddsPoint } from '../components/charts/MultiBookOddsChart';
import PerformanceLineComparison, {
  PerformanceSeriesPoint as ComparisonSeriesPoint,
  TimeframeValue as ComparisonTimeframeValue,
} from '../components/charts/PerformanceLineComparison';
import { PerformancePoint } from '../components/charts/PlayerPerformanceChart';
import usePropFinderData, { PropOpportunity } from '../hooks/usePropFinderData';
import useRealtimeMock from '../hooks/useRealtimeMock';
import { applySmoothing, SmoothingMethod } from '../utils/smoothing';

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

type BookmakerSummary = {
  bookmaker: string;
  events: number;
  avgOdds: number;
  avgLine: number;
  bestOdds: number;
  bestLine: number;
};

type ConfidenceBucket = {
  label: string;
  range: [number, number];
  count: number;
};

type LineShoppingOpportunity = {
  eventId: string;
  bestBookmaker: string;
  bestOdds: number;
  competitorBookmaker: string;
  competitorOdds: number;
  oddsImprovementPct: number;
  lineLeader?: string;
  bestLine?: number;
  competitorLine?: number;
  lineCompetitor?: string;
  lineEdge?: number;
};

type EVOpportunity = {
  id: string;
  sport?: string;
  league?: string;
  market?: string;
  playerName?: string;
  team?: string;
  opponent?: string;
  bookmaker?: string;
  odds?: number;
  line?: number;
  evPercent: number;
  edge?: number;
  kellyStake?: number;
  lastUpdated?: string;
};

type EVHistoricalSnapshot = {
  timestamp: number;
  count: number;
  averageEv: number;
  topEv: number;
};

const PerformanceChartsDemo: React.FC = () => {
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [oddsData, setOddsData] = useState<OddsData[]>([]);
  const [playerPerformance, setPlayerPerformance] = useState<PlayerPerformance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSport, setSelectedSport] = useState<string>('NBA');
  const [selectedBookmaker, setSelectedBookmaker] = useState<string>('all');
  const [minConfidence, setMinConfidence] = useState<number>(60);
  const [minOddsImprovement, setMinOddsImprovement] = useState<number>(2);
  const [minEvPercent, setMinEvPercent] = useState<number>(3);
  const [evOpportunities, setEvOpportunities] = useState<EVOpportunity[]>([]);
  const [evLoading, setEvLoading] = useState<boolean>(true);
  const [evError, setEvError] = useState<string | null>(null);
  const [selectedEvBookmaker, setSelectedEvBookmaker] = useState<string>('All');
  const [selectedEvMarket, setSelectedEvMarket] = useState<string>('All');
  const [evHistory, setEvHistory] = useState<EVHistoricalSnapshot[]>([]);
  const [chartConfigState, setChartConfigState] = useState<ChartConfig | null>(null);

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
      const response = await fetch(
        `/api/props/performance?sport=${selectedSport}&min_confidence=${minConfidence}`
      );
      if (response.ok) {
        const data = await response.json();
        setPlayerPerformance(data.data || []);
      }
    } catch (error) {
      console.warn('Failed to fetch player performance:', error);
    }
  }, [selectedSport, minConfidence]);

  const fetchEvOpportunities = useCallback(async () => {
    setEvLoading(true);
    setEvError(null);
    try {
      const params = new URLSearchParams({ limit: '50', include_inactive: '0' });
      if (selectedSport && selectedSport !== 'All') {
        params.set('sport', selectedSport.toLowerCase());
      }
      const response = await fetch(`/api/opportunities/positive-ev?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        const items = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
        const normalized: EVOpportunity[] = items.map((item: any, index: number) => {
          const rawOdds =
            typeof item.odds === 'number'
              ? item.odds
              : Number(item.odds_decimal ?? item.odds_fraction ?? item.odds);
          const rawLine =
            typeof item.line === 'number' ? item.line : Number(item.projection ?? item.line);
          const rawEv = Number(item.ev_percent ?? item.evPercent ?? item.expected_value ?? 0);
          const rawEdge = item.edge_percent ?? item.edge ?? item.edgePercent;
          const rawKelly = item.kelly ?? item.kelly_stake ?? item.kellyStake;

          return {
            id: String(item.id ?? item.opportunity_id ?? index),
            sport: item.sport ?? item.league ?? selectedSport,
            league: item.league ?? item.sport,
            market: item.market ?? item.market_type ?? item.betType,
            playerName: item.player ?? item.player_name ?? item.matchup,
            team: item.team ?? item.team_name,
            opponent: item.opponent,
            bookmaker: item.bookmaker ?? item.book ?? item.source,
            odds: Number.isFinite(rawOdds) ? Number(rawOdds.toFixed(2)) : undefined,
            line: Number.isFinite(rawLine) ? Number(rawLine.toFixed(2)) : undefined,
            evPercent: Number.isFinite(rawEv) ? Number(rawEv.toFixed(2)) : 0,
            edge:
              rawEdge != null && rawEdge !== '' ? Number(Number(rawEdge).toFixed(2)) : undefined,
            kellyStake:
              rawKelly != null && rawKelly !== '' ? Number(Number(rawKelly).toFixed(2)) : undefined,
            lastUpdated: item.updated_at ?? item.last_updated ?? item.timestamp,
          };
        });
        setEvOpportunities(normalized);
        setEvHistory(prev => {
          const next = prev.concat({
            timestamp: Date.now(),
            count: normalized.length,
            averageEv:
              normalized.length === 0
                ? 0
                : normalized.reduce((sum, item) => sum + item.evPercent, 0) / normalized.length,
            topEv:
              normalized.length === 0 ? 0 : Math.max(...normalized.map(item => item.evPercent)),
          });
          return next.slice(-20);
        });
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      console.warn('Failed to fetch EV opportunities:', error);
      setEvError('Unable to load EV feed. Using last known data.');
    } finally {
      setEvLoading(false);
    }
  }, [selectedSport]);

  const performanceMetrics: PerformanceMetric[] = useMemo(() => {
    if (chartData.length === 0) {
      return [
        {
          id: 'roi',
          name: 'Return on Investment',
          value: 0,
          change: 0,
          changePercent: 0,
          color: '#10B981',
          unit: '%',
          format: 'percentage',
          benchmark: 12.0,
          target: 15.0,
        },
        {
          id: 'total_profit',
          name: 'Total Profit',
          value: 0,
          change: 0,
          changePercent: 0,
          color: '#3B82F6',
          unit: '',
          format: 'currency',
          benchmark: 2000.0,
          target: 3000.0,
        },
        {
          id: 'win_rate',
          name: 'Win Rate',
          value: 0,
          change: 0,
          changePercent: 0,
          color: '#8B5CF6',
          unit: '%',
          format: 'percentage',
          benchmark: 65.0,
          target: 70.0,
        },
        {
          id: 'avg_odds',
          name: 'Average Odds',
          value: 0,
          change: 0,
          changePercent: 0,
          color: '#F59E0B',
          unit: '',
          format: 'decimal',
          benchmark: 1.8,
          target: 1.9,
        },
        {
          id: 'sharpe_ratio',
          name: 'Sharpe Ratio',
          value: 0,
          change: 0,
          changePercent: 0,
          color: '#EF4444',
          unit: '',
          format: 'decimal',
          benchmark: 1.2,
          target: 1.5,
        },
        {
          id: 'max_drawdown',
          name: 'Max Drawdown',
          value: 0,
          change: 0,
          changePercent: 0,
          color: '#6B7280',
          unit: '%',
          format: 'percentage',
          benchmark: -10.0,
          target: -5.0,
        },
        {
          id: 'live_edge',
          name: 'Live Edge Detection',
          value: 0,
          change: 0,
          changePercent: 0,
          color: '#06D6A0',
          unit: '%',
          format: 'percentage',
          benchmark: 15.0,
          target: 25.0,
        },
        {
          id: 'odds_movement',
          name: 'Odds Movement',
          value: 0,
          change: 0,
          changePercent: 0,
          color: '#F72585',
          unit: '%',
          format: 'percentage',
          benchmark: 10.0,
          target: 15.0,
        },
      ] as PerformanceMetric[];
    }

    const latest = chartData[chartData.length - 1].metrics;
    const prev = chartData[chartData.length - 2]?.metrics ?? latest;

    const changePercent = (curr: number, prevVal: number) => {
      if (!Number.isFinite(prevVal) || Math.abs(prevVal) < 1e-6) return 0;
      return ((curr - prevVal) / Math.abs(prevVal)) * 100;
    };

    const avgMetric = (key: keyof typeof latest) => {
      const values = chartData.map(point => Number(point.metrics[key] ?? 0));
      if (values.length === 0) return 0;
      return values.reduce((sum, val) => sum + val, 0) / values.length;
    };

    const buildMetric = (
      id: keyof typeof latest,
      name: string,
      color: string,
      unit: string,
      format: PerformanceMetric['format'],
      benchmark?: number,
      target?: number
    ): PerformanceMetric => {
      const rawValue = Number(latest[id] ?? 0);
      const value = Number(rawValue.toFixed(format === 'currency' ? 0 : 2));
      const prevValue = Number(prev[id] ?? 0);
      return {
        id: id as string,
        name,
        value,
        change: Number((value - prevValue).toFixed(2)),
        changePercent: Number(changePercent(value, prevValue).toFixed(2)),
        color,
        unit,
        format,
        benchmark,
        target,
      };
    };

    const maxDrawdown = Number(Number(latest.max_drawdown ?? 0).toFixed(2));
    const prevDrawdown = Number(prev.max_drawdown ?? 0);

    return [
      buildMetric('roi', 'Return on Investment', '#10B981', '%', 'percentage', 12.0, 15.0),
      buildMetric('total_profit', 'Total Profit', '#3B82F6', '', 'currency', 2000.0, 3000.0),
      buildMetric('win_rate', 'Win Rate', '#8B5CF6', '%', 'percentage', 65.0, 70.0),
      buildMetric('avg_odds', 'Average Odds', '#F59E0B', '', 'decimal', 1.8, 1.9),
      buildMetric('sharpe_ratio', 'Sharpe Ratio', '#EF4444', '', 'decimal', 1.2, 1.5),
      {
        id: 'max_drawdown',
        name: 'Max Drawdown',
        value: maxDrawdown,
        change: Number((maxDrawdown - prevDrawdown).toFixed(2)),
        changePercent: Number(changePercent(maxDrawdown, prevDrawdown).toFixed(2)),
        color: '#6B7280',
        unit: '%',
        format: 'percentage',
        benchmark: -10.0,
        target: -5.0,
      },
      buildMetric('live_edge', 'Live Edge Detection', '#06D6A0', '%', 'percentage', 15.0, 25.0),
      buildMetric('odds_movement', 'Odds Movement', '#F72585', '%', 'percentage', 10.0, 15.0),
    ].map(metric => {
      if (metric.id === 'total_profit') {
        const averageProfit = avgMetric('total_profit');
        return {
          ...metric,
          value: Number(averageProfit.toFixed(0)),
          change: Number(
            (Number(latest.total_profit ?? 0) - Number(prev.total_profit ?? 0)).toFixed(2)
          ),
          changePercent: Number(
            changePercent(Number(latest.total_profit ?? 0), Number(prev.total_profit ?? 0)).toFixed(
              2
            )
          ),
        };
      }
      return metric;
    }) as PerformanceMetric[];
  }, [chartData]);

  // Generate enhanced chart data with Props.Cash integration
  useEffect(() => {
    const generateEnhancedData = async () => {
      setIsLoading(true);

      // Fetch real-time data
      await Promise.all([fetchRealtimeOdds(), fetchPlayerPerformance(), fetchEvOpportunities()]);

      const now = Date.now();
      const days = 90;
      const data: ChartDataPoint[] = [];

      for (let i = days; i >= 0; i--) {
        const date = new Date(now - i * 24 * 60 * 60 * 1000);
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
            total_profit: Math.max(
              0,
              1500 + (days - i) * 15 + Math.sin(i / 15) * 200 + (Math.random() - 0.5) * 100
            ),
            win_rate: Math.min(
              100,
              Math.max(0, 65 + Math.cos(i / 8) * 5 + (Math.random() - 0.5) * 3)
            ),
            avg_odds: Math.max(1.1, 1.8 + Math.sin(i / 12) * 0.1 + (Math.random() - 0.5) * 0.05),
            sharpe_ratio: Math.max(0, 1.2 + (days - i) * 0.003 + (Math.random() - 0.5) * 0.1),
            max_drawdown: Math.min(0, -15 + Math.cos(i / 20) * 5 + (Math.random() - 0.5) * 2),
            // Props.Cash Integration: Add real-time metrics
            live_edge: Math.max(0, liveEdge),
            odds_movement: Math.max(0, oddsMovement),
          },
          metadata: {
            trades_count: Math.floor(Math.random() * 20) + 5,
            volume: Math.floor(Math.random() * 10000) + 1000,
            // Props.Cash Integration: Add real-time metadata
            arbitrage_opportunities: Math.floor(Math.random() * 5),
            line_movements: Math.floor(Math.random() * 15) + 5,
          },
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
      fetchEvOpportunities();
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [selectedSport, minConfidence, fetchEvOpportunities]);

  const handleConfigChange = useCallback((config: ChartConfig) => {
    setChartConfigState(config);
  }, []);

  useEffect(() => {
    fetchEvOpportunities();
  }, [fetchEvOpportunities]);

  // --- Props.Cash style interactive demo below ---
  const seedData: PerformancePoint[] = [
    {
      date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 12).toISOString(),
      actual: 22,
      line: 20,
      opponent: 'NYK',
    },
    {
      date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString(),
      actual: 18,
      line: 19,
      opponent: 'BOS',
    },
    {
      date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 8).toISOString(),
      actual: 30,
      line: 25,
      opponent: 'LAL',
    },
    {
      date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 6).toISOString(),
      actual: 26,
      line: 24,
      opponent: 'MIA',
    },
    {
      date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4).toISOString(),
      actual: 15,
      line: 17,
      opponent: 'CHI',
    },
    {
      date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
      actual: 28,
      line: 26,
      opponent: 'DAL',
    },
  ];

  const [lastN, setLastN] = useState<number | undefined>(10);
  const [opponentFilter, setOpponentFilter] = useState<string>('all');
  const [autoRefresh, setAutoRefresh] = useState<boolean>(true);
  const [refreshIntervalMs, setRefreshIntervalMs] = useState<number>(30_000);
  const [smoothing, setSmoothing] = useState<boolean>(false);
  const [smoothingWindow, setSmoothingWindow] = useState<number>(3);
  const [smoothingMethod, setSmoothingMethod] = useState<SmoothingMethod>('sma');

  // Call both hooks unconditionally to preserve hook rules
  const apiData = usePropFinderData({ autoRefresh, refreshIntervalMs: refreshIntervalMs });

  const compatibilityOpportunities = useMemo<PropOpportunity[] | null>(() => {
    if (!apiData.opportunities || apiData.opportunities.length === 0) {
      return null;
    }
    return apiData.opportunities;
  }, [apiData.opportunities]);

  const compatPlayerPerformance = useMemo<PlayerPerformance[] | null>(() => {
    if (!compatibilityOpportunities) {
      return null;
    }

    return compatibilityOpportunities.map(opportunity => {
      const projectedValue =
        typeof opportunity.projectedValue === 'number' &&
        Number.isFinite(opportunity.projectedValue)
          ? opportunity.projectedValue
          : undefined;
      const lineValue =
        typeof opportunity.line === 'number' && Number.isFinite(opportunity.line)
          ? opportunity.line
          : undefined;
      const oddsValue =
        typeof opportunity.odds === 'number' && Number.isFinite(opportunity.odds)
          ? opportunity.odds
          : undefined;
      const confidenceValue =
        typeof opportunity.confidence === 'number' && Number.isFinite(opportunity.confidence)
          ? opportunity.confidence
          : undefined;

      return {
        playerId: opportunity.id,
        playerName: opportunity.player,
        team: opportunity.team ?? 'Unknown',
        opponent: opportunity.opponent ?? 'Unknown',
        sport: opportunity.sport ?? selectedSport,
        stat: opportunity.market ?? 'Unknown',
        actual: projectedValue ?? lineValue ?? 0,
        line: lineValue ?? 0,
        odds: oddsValue ?? 0,
        confidence: confidenceValue ?? 0,
        timestamp: opportunity.lastUpdated ?? new Date().toISOString(),
      } as PlayerPerformance;
    });
  }, [compatibilityOpportunities, selectedSport]);

  const compatOddsData = useMemo<OddsData[] | null>(() => {
    if (!compatibilityOpportunities) {
      return null;
    }

    const rows: OddsData[] = [];
    compatibilityOpportunities.forEach(opportunity => {
      if (Array.isArray(opportunity.bookmakers) && opportunity.bookmakers.length > 0) {
        opportunity.bookmakers.forEach(bookmaker => {
          rows.push({
            eventId: opportunity.id,
            bookmaker: bookmaker.name || 'Unknown',
            odds: Number.isFinite(bookmaker.odds) ? Number(bookmaker.odds) : 0,
            line: Number.isFinite(bookmaker.line) ? Number(bookmaker.line) : 0,
            timestamp: opportunity.lastUpdated ?? new Date().toISOString(),
          });
        });
      } else {
        rows.push({
          eventId: opportunity.id,
          bookmaker: opportunity.bestBookmaker || 'Unknown',
          odds:
            typeof opportunity.odds === 'number' && Number.isFinite(opportunity.odds)
              ? opportunity.odds
              : 0,
          line:
            typeof opportunity.line === 'number' && Number.isFinite(opportunity.line)
              ? opportunity.line
              : 0,
          timestamp: opportunity.lastUpdated ?? new Date().toISOString(),
        });
      }
    });

    return rows;
  }, [compatibilityOpportunities]);

  const baseOddsData: OddsData[] = useMemo(
    () => compatOddsData ?? oddsData,
    [compatOddsData, oddsData]
  );

  const filteredOddsData = useMemo<OddsData[]>(() => {
    if (selectedBookmaker === 'all') return baseOddsData;
    return baseOddsData.filter(odds => odds.bookmaker === selectedBookmaker);
  }, [baseOddsData, selectedBookmaker]);

  const basePerformanceData: PlayerPerformance[] = useMemo(
    () => compatPlayerPerformance ?? playerPerformance,
    [compatPlayerPerformance, playerPerformance]
  );

  const filteredPerformanceData = useMemo<PlayerPerformance[]>(() => {
    return basePerformanceData.filter(player => player.confidence >= minConfidence);
  }, [basePerformanceData, minConfidence]);
  const mockLive = useRealtimeMock<PerformancePoint[]>(
    seedData,
    prev => {
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
    },
    4000
  );

  // Prefer API performance data when available, otherwise use the mock feed
  const liveData =
    apiData.performance && apiData.performance.length > 0
      ? apiData.performance
          .slice()
          .map(p => ({ date: p.date, actual: p.actual, line: p.line, opponent: p.opponent }))
      : mockLive;

  const filtered = useMemo(() => {
    let list = liveData.slice();

    // Apply opponent filter
    if (opponentFilter !== 'all') {
      list = list.filter(d => d.opponent === opponentFilter);
    }

    // Apply lastN (take most recent N entries). Ensure sorting by timestamp/date.
    if (typeof lastN === 'number' && lastN > 0) {
      list = list
        .slice()
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .slice(Math.max(0, list.length - lastN));
    }

    return list;
  }, [liveData, opponentFilter, lastN]);

  const displayData = useMemo(() => {
    const base = filtered.slice();
    return smoothing ? applySmoothing(base, smoothingMethod, smoothingWindow) : base;
  }, [filtered, smoothing, smoothingMethod, smoothingWindow]);

  const comparisonSeries = useMemo<ComparisonSeriesPoint[]>(
    () =>
      displayData.map(point => ({
        date: point.date,
        actual: Number.isFinite(point.actual) ? point.actual : 0,
        line: Number.isFinite(point.line) ? point.line : 0,
        projection: Number.isFinite((point as any).projection)
          ? Number((point as any).projection)
          : null,
        opponent: point.opponent ?? null,
      })),
    [displayData]
  );

  const comparisonTimeframeValue: ComparisonTimeframeValue = useMemo(
    () => (typeof lastN === 'number' && lastN > 0 ? lastN : 'all'),
    [lastN]
  );

  const comparisonTimeframeOptions = useMemo(
    () => [
      { label: 'Last 5', value: 5 as ComparisonTimeframeValue },
      { label: 'Last 10', value: 10 as ComparisonTimeframeValue },
      { label: 'Last 20', value: 20 as ComparisonTimeframeValue },
      { label: 'All', value: 'all' as ComparisonTimeframeValue },
    ],
    []
  );

  const handleComparisonTimeframeChange = useCallback(
    (value: ComparisonTimeframeValue) => {
      if (value === 'all') {
        setLastN(undefined);
        return;
      }
      if (typeof value === 'number') {
        setLastN(value);
      }
    },
    [setLastN]
  );

  const bookmakerSeries = useMemo<BookmakerOddsPoint[]>(
    () =>
      filteredOddsData
        .slice(-150)
        .filter(item => typeof item.odds === 'number' && Number.isFinite(item.odds))
        .map(item => ({
          timestamp: item.timestamp ?? new Date().toISOString(),
          bookmaker: item.bookmaker || 'Unknown',
          odds: Number(item.odds),
        })),
    [filteredOddsData]
  );

  const summaryMetricIds = useMemo(() => {
    if (chartConfigState?.metrics && chartConfigState.metrics.length > 0) {
      return chartConfigState.metrics;
    }
    return performanceMetrics.slice(0, 4).map(metric => metric.id);
  }, [chartConfigState, performanceMetrics]);

  const summaryMetrics = useMemo(
    () => performanceMetrics.filter(metric => summaryMetricIds.includes(metric.id)),
    [performanceMetrics, summaryMetricIds]
  );

  const bookmakerSummaries = useMemo(() => {
    if (!filteredOddsData || filteredOddsData.length === 0) return [] as BookmakerSummary[];

    const map = new Map<
      string,
      { events: number; odds: number[]; lines: number[]; bestOdds: number; bestLine: number }
    >();

    filteredOddsData.forEach(item => {
      const key = item.bookmaker || 'Unknown';
      if (!map.has(key)) {
        map.set(key, {
          events: 0,
          odds: [],
          lines: [],
          bestOdds: Number.NEGATIVE_INFINITY,
          bestLine: Number.POSITIVE_INFINITY,
        });
      }
      const entry = map.get(key)!;
      entry.events += 1;
      if (typeof item.odds === 'number' && Number.isFinite(item.odds)) {
        entry.odds.push(item.odds);
        entry.bestOdds = Math.max(entry.bestOdds, item.odds);
      }
      if (typeof item.line === 'number' && Number.isFinite(item.line)) {
        entry.lines.push(item.line);
        entry.bestLine = Math.min(entry.bestLine, item.line);
      }
    });

    const average = (values: number[]): number =>
      values.length ? values.reduce((sum, val) => sum + val, 0) / values.length : 0;

    return Array.from(map.entries())
      .map(([bookmaker, data]) => ({
        bookmaker,
        events: data.events,
        avgOdds: Number(average(data.odds).toFixed(2)),
        avgLine: Number(average(data.lines).toFixed(1)),
        bestOdds: Number(
          (data.bestOdds === Number.NEGATIVE_INFINITY ? 0 : data.bestOdds).toFixed(2)
        ),
        bestLine: Number(
          (data.bestLine === Number.POSITIVE_INFINITY ? 0 : data.bestLine).toFixed(1)
        ),
      }))
      .sort((a, b) => b.events - a.events);
  }, [filteredOddsData]);

  const confidenceBuckets = useMemo(() => {
    if (!filteredPerformanceData || filteredPerformanceData.length === 0) {
      return [] as ConfidenceBucket[];
    }

    const buckets: ConfidenceBucket[] = [
      { label: '40-54%', range: [40, 54], count: 0 },
      { label: '55-64%', range: [55, 64], count: 0 },
      { label: '65-74%', range: [65, 74], count: 0 },
      { label: '75-84%', range: [75, 84], count: 0 },
      { label: '85%+', range: [85, 100], count: 0 },
    ];

    filteredPerformanceData.forEach(player => {
      const confidence = Number(player.confidence ?? 0);
      const bucket = buckets.find(({ range }) => confidence >= range[0] && confidence <= range[1]);
      if (bucket) bucket.count += 1;
    });

    return buckets;
  }, [filteredPerformanceData]);

  const lineShoppingOpportunities = useMemo(() => {
    if (!filteredOddsData || filteredOddsData.length < 2) {
      return [] as LineShoppingOpportunity[];
    }

    const grouped = new Map<string, OddsData[]>();
    filteredOddsData.forEach(entry => {
      if (!grouped.has(entry.eventId)) {
        grouped.set(entry.eventId, []);
      }
      grouped.get(entry.eventId)!.push(entry);
    });

    const opportunities: LineShoppingOpportunity[] = [];

    grouped.forEach((entries, eventId) => {
      const oddsCandidates = entries
        .filter(e => typeof e.odds === 'number' && Number.isFinite(e.odds))
        .sort((a, b) => b.odds - a.odds);

      if (oddsCandidates.length < 2) {
        return;
      }

      const [bestOddsEntry, competitorEntry] = oddsCandidates;
      const runnerUp = competitorEntry ?? oddsCandidates[0];
      const denominator = Math.abs(runnerUp.odds) < 1e-6 ? 1 : Math.abs(runnerUp.odds);
      const oddsImprovementPct = Number(
        (((bestOddsEntry.odds - runnerUp.odds) / denominator) * 100).toFixed(2)
      );

      const lineCandidates = entries
        .filter(e => typeof e.line === 'number' && Number.isFinite(e.line))
        .sort((a, b) => a.line - b.line);

      const bestLineEntry = lineCandidates[0];
      const competitorLineEntry = lineCandidates[1];

      const lineEdge =
        bestLineEntry && competitorLineEntry
          ? Number((competitorLineEntry.line - bestLineEntry.line).toFixed(1))
          : undefined;

      opportunities.push({
        eventId,
        bestBookmaker: bestOddsEntry.bookmaker,
        bestOdds: Number(bestOddsEntry.odds.toFixed(2)),
        competitorBookmaker: runnerUp.bookmaker,
        competitorOdds: Number(runnerUp.odds.toFixed(2)),
        oddsImprovementPct,
        lineLeader: bestLineEntry?.bookmaker,
        bestLine: bestLineEntry ? Number(bestLineEntry.line.toFixed(1)) : undefined,
        competitorLine: competitorLineEntry
          ? Number(competitorLineEntry.line.toFixed(1))
          : undefined,
        lineCompetitor: competitorLineEntry?.bookmaker,
        lineEdge,
      });
    });

    return opportunities
      .filter(
        opp =>
          Number.isFinite(opp.oddsImprovementPct) &&
          opp.oddsImprovementPct > 0 &&
          opp.oddsImprovementPct >= minOddsImprovement
      )
      .sort((a, b) => b.oddsImprovementPct - a.oddsImprovementPct)
      .slice(0, 10);
  }, [filteredOddsData, minOddsImprovement]);

  const lineShoppingSummary = useMemo(() => {
    if (lineShoppingOpportunities.length === 0) {
      return {
        count: 0,
        averageImprovement: 0,
        topImprovement: 0,
        topEvent: '-',
        topBookmaker: '-',
      };
    }

    const totalImprovement = lineShoppingOpportunities.reduce(
      (sum, opp) => sum + opp.oddsImprovementPct,
      0
    );
    const topOpportunity = lineShoppingOpportunities[0];

    return {
      count: lineShoppingOpportunities.length,
      averageImprovement: Number((totalImprovement / lineShoppingOpportunities.length).toFixed(2)),
      topImprovement: topOpportunity.oddsImprovementPct,
      topEvent: topOpportunity.eventId,
      topBookmaker: topOpportunity.bestBookmaker,
    };
  }, [lineShoppingOpportunities]);

  const filteredEvOpportunities = useMemo(() => {
    const threshold = Number.isFinite(minEvPercent) ? minEvPercent : 0;
    return evOpportunities
      .filter(item => {
        const matchesSport =
          !selectedSport || selectedSport === 'All'
            ? true
            : (item.sport ?? '').toLowerCase() === selectedSport.toLowerCase();
        const matchesBookmaker =
          selectedEvBookmaker === 'All'
            ? true
            : (item.bookmaker ?? 'Unknown') === selectedEvBookmaker;
        const marketKey = item.market ?? item.playerName ?? 'Unknown';
        const matchesMarket = selectedEvMarket === 'All' ? true : marketKey === selectedEvMarket;
        return matchesSport && matchesBookmaker && matchesMarket && item.evPercent >= threshold;
      })
      .sort((a, b) => b.evPercent - a.evPercent)
      .slice(0, 12);
  }, [evOpportunities, selectedSport, minEvPercent, selectedEvBookmaker, selectedEvMarket]);

  const evSummary = useMemo(() => {
    if (filteredEvOpportunities.length === 0) {
      return {
        count: 0,
        averageEv: 0,
        topEv: 0,
        topBookmaker: '-',
        topMarket: '-',
      };
    }

    const total = filteredEvOpportunities.reduce((sum, item) => sum + item.evPercent, 0);
    const top = filteredEvOpportunities[0];

    return {
      count: filteredEvOpportunities.length,
      averageEv: Number((total / filteredEvOpportunities.length).toFixed(2)),
      topEv: top.evPercent,
      topBookmaker: top.bookmaker ?? '-',
      topMarket: top.market ?? top.playerName ?? '-',
    };
  }, [filteredEvOpportunities]);

  const evHistorySummary = useMemo(() => {
    if (evHistory.length === 0) {
      return {
        overThreshold: 0,
        underThreshold: 0,
        peakEv: 0,
        peakTimestamp: null as number | null,
        dailyAverage: 0,
      };
    }

    const threshold = minEvPercent;
    let overThreshold = 0;
    let underThreshold = 0;
    let peakEv = 0;
    let peakTimestamp: number | null = null;
    const avgAccumulator: Record<string, { total: number; count: number }> = {};

    evHistory.forEach(snapshot => {
      if (snapshot.averageEv >= threshold) {
        overThreshold += 1;
      } else {
        underThreshold += 1;
      }
      if (snapshot.topEv > peakEv) {
        peakEv = snapshot.topEv;
        peakTimestamp = snapshot.timestamp;
      }

      const dayKey = new Date(snapshot.timestamp).toISOString().slice(0, 10);
      if (!avgAccumulator[dayKey]) {
        avgAccumulator[dayKey] = { total: 0, count: 0 };
      }
      avgAccumulator[dayKey].total += snapshot.averageEv;
      avgAccumulator[dayKey].count += 1;
    });

    const dailyAverageValues = Object.values(avgAccumulator).map(
      entry => entry.total / entry.count
    );
    const dailyAverage =
      dailyAverageValues.length === 0
        ? 0
        : dailyAverageValues.reduce((sum, value) => sum + value, 0) / dailyAverageValues.length;

    return {
      overThreshold,
      underThreshold,
      peakEv,
      peakTimestamp,
      dailyAverage,
    };
  }, [evHistory, minEvPercent]);

  const evBookmakerOptions = useMemo(() => {
    const set = new Set<string>();
    evOpportunities.forEach(item => {
      if (item.bookmaker) {
        set.add(item.bookmaker);
      }
    });
    return ['All', ...Array.from(set).sort((a, b) => a.localeCompare(b))];
  }, [evOpportunities]);

  const evMarketOptions = useMemo(() => {
    const set = new Set<string>();
    evOpportunities.forEach(item => {
      const key = item.market ?? item.playerName;
      if (key) {
        set.add(key);
      }
    });
    return ['All', ...Array.from(set).sort((a, b) => a.localeCompare(b))];
  }, [evOpportunities]);

  useEffect(() => {
    if (!evBookmakerOptions.includes(selectedEvBookmaker)) {
      setSelectedEvBookmaker('All');
    }
  }, [evBookmakerOptions, selectedEvBookmaker]);

  useEffect(() => {
    if (!evMarketOptions.includes(selectedEvMarket)) {
      setSelectedEvMarket('All');
    }
  }, [evMarketOptions, selectedEvMarket]);

  const evBookmakerSummary = useMemo(() => {
    if (filteredEvOpportunities.length === 0)
      return [] as Array<{
        bookmaker: string;
        count: number;
        averageEv: number;
        topEv: number;
        kellyAverage?: number;
      }>;

    const map = new Map<
      string,
      { count: number; evTotal: number; topEv: number; kellyTotal: number; kellyCount: number }
    >();

    filteredEvOpportunities.forEach(item => {
      const key = item.bookmaker ?? 'Unknown';
      if (!map.has(key)) {
        map.set(key, { count: 0, evTotal: 0, topEv: 0, kellyTotal: 0, kellyCount: 0 });
      }
      const entry = map.get(key)!;
      entry.count += 1;
      entry.evTotal += item.evPercent;
      entry.topEv = Math.max(entry.topEv, item.evPercent);
      if (typeof item.kellyStake === 'number' && Number.isFinite(item.kellyStake)) {
        entry.kellyTotal += item.kellyStake;
        entry.kellyCount += 1;
      }
    });

    return Array.from(map.entries())
      .map(([bookmaker, data]) => ({
        bookmaker,
        count: data.count,
        averageEv: Number((data.evTotal / data.count).toFixed(2)),
        topEv: Number(data.topEv.toFixed(2)),
        kellyAverage:
          data.kellyCount > 0 ? Number((data.kellyTotal / data.kellyCount).toFixed(2)) : undefined,
      }))
      .sort((a, b) => b.averageEv - a.averageEv)
      .slice(0, 6);
  }, [filteredEvOpportunities]);

  const evBucketDistribution = useMemo(() => {
    if (filteredEvOpportunities.length === 0)
      return [] as Array<{ label: string; range: [number, number] | null; count: number }>;

    const buckets: Array<{ label: string; range: [number, number] | null; count: number }> = [
      { label: '0-2%', range: [0, 2], count: 0 },
      { label: '2-5%', range: [2, 5], count: 0 },
      { label: '5-8%', range: [5, 8], count: 0 },
      { label: '8%+ ', range: null, count: 0 },
    ];

    filteredEvOpportunities.forEach(item => {
      const ev = item.evPercent;
      const bucket = buckets.find(bucketItem => {
        if (!bucketItem.range) {
          return ev >= 8;
        }
        const [min, max] = bucketItem.range;
        return ev >= min && ev < max;
      });
      if (bucket) bucket.count += 1;
    });

    return buckets;
  }, [filteredEvOpportunities]);

  const exportEvCsv = (rows: EVOpportunity[]) => {
    if (!rows || rows.length === 0) return;
    const header = [
      'id',
      'sport',
      'market',
      'player',
      'bookmaker',
      'odds',
      'line',
      'ev_percent',
      'edge_percent',
      'kelly',
      'last_updated',
    ];
    const csv = [header.join(',')]
      .concat(
        rows.map(item =>
          [
            item.id,
            item.sport ?? '',
            item.market ?? '',
            item.playerName ?? '',
            item.bookmaker ?? '',
            item.odds ?? '',
            item.line ?? '',
            item.evPercent,
            item.edge ?? '',
            item.kellyStake ?? '',
            item.lastUpdated ?? '',
          ].join(',')
        )
      )
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `positive_ev_opportunities_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const exportCsv = (rows: PerformancePoint[]) => {
    if (!rows || rows.length === 0) return;
    const header = ['date', 'actual', 'line', 'opponent'];
    const csv = [header.join(',')]
      .concat(rows.map(r => `${r.date},${r.actual},${r.line},${r.opponent ?? ''}`))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `performance_export_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4'></div>
          <p className='text-gray-600'>Loading performance data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gray-50'>
      {/* Header */}
      <div className='bg-white shadow-sm border-b border-gray-200'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='py-6'>
            <div className='flex items-center justify-between'>
              <div>
                <h1 className='text-3xl font-bold text-gray-900 flex items-center space-x-3'>
                  <div className='p-2 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg'>
                    <BarChart3 className='w-8 h-8 text-white' />
                  </div>
                  <span>Performance Comparison Charts</span>
                </h1>
                <p className='mt-2 text-lg text-gray-600'>
                  Phase 3: Interactive performance visualization with Props.Cash real-time data
                  integration
                </p>
              </div>

              <div className='flex items-center space-x-4'>
                {/* Props.Cash Integration: Real-time data filters */}
                <div className='flex items-center space-x-3 bg-gray-50 rounded-lg p-3'>
                  <Filter className='w-4 h-4 text-gray-600' />
                  <div className='flex items-center space-x-2'>
                    <label className='text-sm font-medium text-gray-700'>Sport:</label>
                    <select
                      value={selectedSport}
                      onChange={e => setSelectedSport(e.target.value)}
                      className='text-sm border rounded px-2 py-1'
                    >
                      <option value='NBA'>NBA</option>
                      <option value='MLB'>MLB</option>
                      <option value='NFL'>NFL</option>
                      <option value='NHL'>NHL</option>
                    </select>
                  </div>
                  <div className='flex items-center space-x-2'>
                    <label className='text-sm font-medium text-gray-700'>Bookmaker:</label>
                    <select
                      value={selectedBookmaker}
                      onChange={e => setSelectedBookmaker(e.target.value)}
                      className='text-sm border rounded px-2 py-1'
                    >
                      <option value='all'>All</option>
                      <option value='FanDuel'>FanDuel</option>
                      <option value='DraftKings'>DraftKings</option>
                      <option value='BetMGM'>BetMGM</option>
                    </select>
                  </div>
                  <div className='flex items-center space-x-2'>
                    <label className='text-sm font-medium text-gray-700'>Min Confidence:</label>
                    <input
                      type='range'
                      min='0'
                      max='100'
                      value={minConfidence}
                      onChange={e => setMinConfidence(Number(e.target.value))}
                      className='w-20'
                    />
                    <span className='text-sm text-gray-600 w-8'>{minConfidence}%</span>
                  </div>
                  <div className='text-xs text-gray-500'>
                    {filteredOddsData.length} odds • {filteredPerformanceData.length} players
                  </div>
                </div>

                <div className='text-right'>
                  <div className='flex items-center gap-5 justify-end'>
                    <label className='inline-flex items-center text-sm text-gray-700'>
                      <input
                        type='checkbox'
                        checked={autoRefresh}
                        onChange={e => setAutoRefresh(e.target.checked)}
                      />
                      <span className='ml-2'>Auto-refresh data</span>
                    </label>
                    <div className='text-xs text-gray-500'>
                      Viewing {displayData.length} samples • {filteredOddsData.length} odds points
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
        {/* Demo Player Performance Chart */}
        <div className='mb-8 bg-white rounded-lg shadow p-4'>
          <div className='flex items-center justify-between mb-4'>
            <div className='flex items-center gap-4'>
              <label className='inline-flex items-center'>
                <input
                  type='checkbox'
                  checked={smoothing}
                  onChange={e => setSmoothing(e.target.checked)}
                />
                <span className='ml-2 text-sm'>Smoothing (moving avg)</span>
              </label>

              <label className='inline-flex items-center'>
                Window:
                <input
                  type='number'
                  min={1}
                  value={smoothingWindow}
                  onChange={e => setSmoothingWindow(Number(e.target.value))}
                  className='ml-2 w-16'
                />
              </label>
              <label className='inline-flex items-center ml-4'>
                Method:
                <select
                  value={smoothingMethod}
                  onChange={e => setSmoothingMethod(e.target.value as SmoothingMethod)}
                  className='ml-2 border rounded p-1'
                >
                  <option value={'sma'}>SMA</option>
                  <option value={'ema'}>EMA</option>
                  <option value={'none'}>None</option>
                </select>
              </label>
            </div>

            <div className='flex items-center gap-3'>
              <button
                onClick={() => exportCsv(displayData)}
                className='px-3 py-1 bg-blue-600 text-white rounded'
              >
                Export CSV
              </button>
              <label className='inline-flex items-center'>
                Refresh interval (ms):
                <input
                  type='number'
                  min={1000}
                  value={refreshIntervalMs}
                  onChange={e => setRefreshIntervalMs(Number(e.target.value))}
                  className='ml-2 w-28'
                />
              </label>
            </div>
          </div>

          <PerformanceLineComparison
            data={comparisonSeries}
            timeframeValue={comparisonTimeframeValue}
            timeframeOptions={comparisonTimeframeOptions}
            onTimeframeChange={handleComparisonTimeframeChange}
            showProjection={false}
            variant='embedded'
            showHeader={false}
            height={340}
            enableSeriesToggles
            persistSeriesToggles
            seriesPersistenceKey='performance-charts-demo'
            enableDeltaView
            enableOpponentFilter
            opponentFilterValue={opponentFilter}
            onOpponentFilterChange={value => setOpponentFilter(value)}
          />
        </div>

        {/* Summary Cards */}
        <div className='flex flex-wrap items-center gap-2 text-xs text-gray-500 mb-3'>
          <span className='uppercase tracking-wide font-semibold text-gray-600'>Chart Focus</span>
          <span className='inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2 py-1 text-indigo-600'>
            Type: {chartConfigState?.type ?? 'line'}
          </span>
          <span className='inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-emerald-600'>
            Timeframe: {chartConfigState?.timeframe ?? '30d'}
          </span>
          <span className='inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-1 text-amber-600'>
            Aggregation: {chartConfigState?.aggregation ?? 'last'}
          </span>
          {chartConfigState?.smoothing && (
            <span className='inline-flex items-center gap-1 rounded-full bg-sky-50 px-2 py-1 text-sky-600'>
              Smoothing enabled
            </span>
          )}
          <span className='inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-1 text-gray-600'>
            Metrics:&nbsp;
            {summaryMetrics.length > 0 ? summaryMetrics.map(m => m.name).join(', ') : 'Default'}
          </span>
        </div>

        <div className='grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8'>
          {summaryMetrics.map(metric => (
            <div key={metric.id} className='bg-white rounded-lg shadow-md p-4'>
              <div className='flex items-center justify-between mb-2'>
                <h3 className='text-sm font-medium text-gray-600 truncate'>{metric.name}</h3>
                {metric.change > 0 ? (
                  <TrendingUp className='w-4 h-4 text-green-500' />
                ) : (
                  <Activity className='w-4 h-4 text-red-500' />
                )}
              </div>
              <div className='flex items-baseline space-x-2'>
                <span className='text-xl font-bold' style={{ color: metric.color }}>
                  {metric.format === 'currency'
                    ? `$${metric.value.toFixed(0)}`
                    : metric.format === 'percentage'
                    ? `${metric.value.toFixed(1)}%`
                    : metric.value.toFixed(2)}
                </span>
                <span
                  className={`text-xs ${metric.change > 0 ? 'text-green-600' : 'text-red-600'}`}
                >
                  {metric.change > 0 ? '+' : ''}
                  {metric.changePercent.toFixed(1)}%
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Main Chart Component */}
        <div className='mb-8'>
          <AdvancedPerformanceCharts
            data={chartData}
            metrics={performanceMetrics}
            onConfigChange={handleConfigChange}
            enableExport={true}
            enableFullscreen={true}
            className='h-auto'
          />
        </div>

        {/* Props.Cash Integration: Real-time Data Display */}
        <div className='grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8'>
          {/* Live Odds Data */}
          <div className='bg-white rounded-lg shadow-md p-6'>
            <div className='flex items-center justify-between mb-4'>
              <h3 className='text-lg font-semibold text-gray-800 flex items-center'>
                <DollarSign className='w-5 h-5 text-green-600 mr-2' />
                Live Odds Data ({filteredOddsData.length})
              </h3>
              <button
                onClick={fetchRealtimeOdds}
                className='px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700'
              >
                <RefreshCw className='w-3 h-3 inline mr-1' />
                Refresh
              </button>
            </div>
            <div className='space-y-2 max-h-64 overflow-y-auto'>
              {filteredOddsData.length > 0 ? (
                filteredOddsData.slice(0, 10).map((odds, index) => (
                  <div
                    key={index}
                    className='flex justify-between items-center p-2 bg-gray-50 rounded'
                  >
                    <div>
                      <span className='font-medium'>{odds.eventId}</span>
                      <span className='text-sm text-gray-600 ml-2'>({odds.bookmaker})</span>
                    </div>
                    <div className='text-right'>
                      <div className='font-bold text-green-600'>{odds.odds.toFixed(2)}</div>
                      <div className='text-xs text-gray-500'>Line: {odds.line}</div>
                    </div>
                  </div>
                ))
              ) : (
                <p className='text-gray-500 text-center py-4'>No odds data available</p>
              )}
            </div>
          </div>

          {/* Player Performance Data */}
          <div className='bg-white rounded-lg shadow-md p-6'>
            <div className='flex items-center justify-between mb-4'>
              <h3 className='text-lg font-semibold text-gray-800 flex items-center'>
                <Users className='w-5 h-5 text-blue-600 mr-2' />
                Player Performance ({filteredPerformanceData.length})
              </h3>
              <button
                onClick={fetchPlayerPerformance}
                className='px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700'
              >
                <RefreshCw className='w-3 h-3 inline mr-1' />
                Refresh
              </button>
            </div>
            <div className='space-y-2 max-h-64 overflow-y-auto'>
              {filteredPerformanceData.length > 0 ? (
                filteredPerformanceData.slice(0, 10).map((player, index) => (
                  <div
                    key={index}
                    className='flex justify-between items-center p-2 bg-gray-50 rounded'
                  >
                    <div>
                      <span className='font-medium'>{player.playerName}</span>
                      <span className='text-sm text-gray-600 ml-2'>vs {player.opponent}</span>
                    </div>
                    <div className='text-right'>
                      <div className='font-bold text-blue-600'>{player.actual} pts</div>
                      <div className='text-xs text-gray-500'>
                        Line: {player.line} | {player.confidence}%
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className='text-gray-500 text-center py-4'>No performance data available</p>
              )}
            </div>
          </div>
        </div>

        <div className='mb-8'>
          <MultiBookOddsChart data={bookmakerSeries} title='Bookmaker Odds Movement' height={320} />
        </div>

        {/* Props.Cash Integration: Bookmaker + Confidence Insights */}
        <div className='grid grid-cols-1 xl:grid-cols-3 gap-8 mb-8'>
          <div className='xl:col-span-2 bg-white rounded-lg shadow-md p-6'>
            <div className='flex items-center justify-between mb-4'>
              <h3 className='text-lg font-semibold text-gray-800 flex items-center'>
                <Zap className='w-5 h-5 text-amber-500 mr-2' />
                Bookmaker Impact Summary
              </h3>
              <span className='text-sm text-gray-500'>
                {bookmakerSummaries.length} active bookmaker
                {bookmakerSummaries.length === 1 ? '' : 's'}
              </span>
            </div>
            {bookmakerSummaries.length > 0 ? (
              <div className='overflow-x-auto -mx-4 sm:mx-0'>
                <table className='min-w-full divide-y divide-gray-200 text-sm'>
                  <thead className='bg-gray-50'>
                    <tr>
                      <th className='px-4 py-2 text-left font-medium text-gray-600'>Bookmaker</th>
                      <th className='px-4 py-2 text-right font-medium text-gray-600'>Events</th>
                      <th className='px-4 py-2 text-right font-medium text-gray-600'>Avg Odds</th>
                      <th className='px-4 py-2 text-right font-medium text-gray-600'>Avg Line</th>
                      <th className='px-4 py-2 text-right font-medium text-gray-600'>Best Odds</th>
                      <th className='px-4 py-2 text-right font-medium text-gray-600'>Best Line</th>
                    </tr>
                  </thead>
                  <tbody className='divide-y divide-gray-100'>
                    {bookmakerSummaries.slice(0, 8).map(bookmaker => (
                      <tr key={bookmaker.bookmaker} className='hover:bg-gray-50 transition-colors'>
                        <td className='px-4 py-2 font-medium text-gray-800'>
                          {bookmaker.bookmaker}
                        </td>
                        <td className='px-4 py-2 text-right text-gray-600'>{bookmaker.events}</td>
                        <td className='px-4 py-2 text-right text-emerald-600'>
                          {bookmaker.avgOdds.toFixed(2)}
                        </td>
                        <td className='px-4 py-2 text-right text-indigo-600'>
                          {bookmaker.avgLine.toFixed(1)}
                        </td>
                        <td className='px-4 py-2 text-right text-emerald-700 font-semibold'>
                          {bookmaker.bestOdds.toFixed(2)}
                        </td>
                        <td className='px-4 py-2 text-right text-indigo-700 font-semibold'>
                          {bookmaker.bestLine.toFixed(1)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {bookmakerSummaries.length > 8 && (
                  <p className='text-xs text-gray-500 mt-2'>
                    Showing top 8 bookmakers by event coverage.
                  </p>
                )}
              </div>
            ) : (
              <p className='text-gray-500 text-center py-6'>
                No bookmaker data available for the current filters.
              </p>
            )}
          </div>

          <div className='bg-white rounded-lg shadow-md p-6'>
            <h3 className='text-lg font-semibold text-gray-800 flex items-center mb-4'>
              <Award className='w-5 h-5 text-purple-500 mr-2' />
              Confidence Distribution
            </h3>
            {confidenceBuckets.length > 0 ? (
              <div className='space-y-3'>
                {confidenceBuckets.map(bucket => (
                  <div key={bucket.label} className='flex items-center justify-between'>
                    <div>
                      <p className='text-sm font-medium text-gray-700'>{bucket.label}</p>
                      <p className='text-xs text-gray-500'>
                        Range: {bucket.range[0]}% – {bucket.range[1]}%
                      </p>
                    </div>
                    <div className='flex items-center gap-2'>
                      <span className='text-xs text-gray-500 uppercase tracking-wide'>count</span>
                      <span className='text-lg font-semibold text-slate-800 min-w-[2rem] text-right'>
                        {bucket.count}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className='text-gray-500 text-center py-6'>No confidence data available yet.</p>
            )}
          </div>
        </div>

        {/* Props.Cash Integration: Line Shopping Opportunities */}
        <div className='bg-white rounded-lg shadow-md p-6 mb-8'>
          <div className='flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-4'>
            <div className='flex items-center gap-2'>
              <TrendingUp className='w-5 h-5 text-emerald-500' />
              <div>
                <h3 className='text-lg font-semibold text-gray-800'>
                  Top Line Shopping Opportunities
                </h3>
                <p className='text-xs text-gray-500'>
                  Auto-generated from {filteredOddsData.length} live odds points
                </p>
              </div>
            </div>

            <div className='flex items-center gap-3'>
              <label className='text-xs font-medium text-gray-600 uppercase tracking-wide'>
                Min Odds Edge (%)
              </label>
              <input
                type='range'
                min='0'
                max='10'
                step='0.5'
                value={minOddsImprovement}
                onChange={e => setMinOddsImprovement(Number(e.target.value))}
                className='w-32'
              />
              <span className='text-sm font-semibold text-emerald-600 w-12 text-right'>
                {minOddsImprovement.toFixed(1)}%
              </span>
            </div>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mb-6'>
            <div className='p-4 border border-emerald-100 rounded-lg bg-emerald-50/40'>
              <p className='text-xs text-emerald-700 uppercase tracking-wide mb-1'>Opportunities</p>
              <p className='text-2xl font-semibold text-emerald-800'>{lineShoppingSummary.count}</p>
              <p className='text-xs text-emerald-600'>Passing current edge threshold</p>
            </div>
            <div className='p-4 border border-blue-100 rounded-lg bg-blue-50/40'>
              <p className='text-xs text-blue-700 uppercase tracking-wide mb-1'>Avg Edge</p>
              <p className='text-2xl font-semibold text-blue-800'>
                {lineShoppingSummary.averageImprovement.toFixed(2)}%
              </p>
              <p className='text-xs text-blue-600'>Across surfaced opportunities</p>
            </div>
            <div className='p-4 border border-purple-100 rounded-lg bg-purple-50/40'>
              <p className='text-xs text-purple-700 uppercase tracking-wide mb-1'>Top Spot</p>
              {lineShoppingSummary.topImprovement > 0 ? (
                <div>
                  <p className='text-lg font-semibold text-purple-800 flex items-baseline gap-2'>
                    {lineShoppingSummary.topImprovement.toFixed(2)}%
                    <span className='text-xs text-purple-600 font-medium'>
                      ({lineShoppingSummary.topBookmaker})
                    </span>
                  </p>
                  <p className='text-xs text-purple-500 truncate'>{lineShoppingSummary.topEvent}</p>
                </div>
              ) : (
                <p className='text-xs text-purple-500'>No qualifying events yet</p>
              )}
            </div>
          </div>

          {lineShoppingOpportunities.length > 0 ? (
            <div className='overflow-x-auto -mx-4 sm:mx-0'>
              <table className='min-w-full divide-y divide-gray-200 text-sm'>
                <thead className='bg-gray-50'>
                  <tr>
                    <th className='px-4 py-2 text-left font-medium text-gray-600'>Event</th>
                    <th className='px-4 py-2 text-left font-medium text-gray-600'>Best Book</th>
                    <th className='px-4 py-2 text-left font-medium text-gray-600'>Competitor</th>
                    <th className='px-4 py-2 text-right font-medium text-gray-600'>Odds Edge</th>
                    <th className='px-4 py-2 text-right font-medium text-gray-600'>Odds Δ%</th>
                    <th className='px-4 py-2 text-right font-medium text-gray-600'>Line Edge</th>
                  </tr>
                </thead>
                <tbody className='divide-y divide-gray-100'>
                  {lineShoppingOpportunities.map(opportunity => (
                    <tr
                      key={`${opportunity.eventId}-${opportunity.bestBookmaker}`}
                      className='hover:bg-gray-50 transition-colors'
                    >
                      <td className='px-4 py-2 font-medium text-gray-800'>{opportunity.eventId}</td>
                      <td className='px-4 py-2 text-gray-700'>
                        <div className='flex flex-col'>
                          <span className='font-semibold text-emerald-600'>
                            {opportunity.bestBookmaker}
                          </span>
                          <span className='text-xs text-gray-500'>
                            Odds {opportunity.bestOdds.toFixed(2)}
                          </span>
                        </div>
                      </td>
                      <td className='px-4 py-2 text-gray-700'>
                        <div className='flex flex-col'>
                          <span className='font-semibold text-gray-600'>
                            {opportunity.competitorBookmaker}
                          </span>
                          <span className='text-xs text-gray-500'>
                            Odds {opportunity.competitorOdds.toFixed(2)}
                          </span>
                        </div>
                      </td>
                      <td className='px-4 py-2 text-right text-emerald-600 font-semibold'>
                        +{(opportunity.bestOdds - opportunity.competitorOdds).toFixed(2)}
                      </td>
                      <td className='px-4 py-2 text-right'>
                        <span
                          className={`inline-flex items-center justify-end gap-1 px-2 py-0.5 rounded-full text-xs ${
                            opportunity.oddsImprovementPct >= 3
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-amber-100 text-amber-700'
                          }`}
                        >
                          {opportunity.oddsImprovementPct.toFixed(2)}%
                        </span>
                      </td>
                      <td className='px-4 py-2 text-right text-indigo-600'>
                        {opportunity.lineEdge && opportunity.lineEdge > 0 ? (
                          <div className='flex flex-col items-end gap-1'>
                            <span className='font-semibold text-indigo-700'>
                              +{opportunity.lineEdge.toFixed(1)}
                            </span>
                            {opportunity.bestLine !== undefined && opportunity.lineLeader && (
                              <span className='text-xs text-gray-500'>
                                Best {opportunity.bestLine.toFixed(1)} @ {opportunity.lineLeader}
                              </span>
                            )}
                            {opportunity.competitorLine !== undefined &&
                              opportunity.lineCompetitor && (
                                <span className='text-xs text-gray-400'>
                                  vs {opportunity.competitorLine.toFixed(1)} @{' '}
                                  {opportunity.lineCompetitor}
                                </span>
                              )}
                          </div>
                        ) : opportunity.bestLine !== undefined && opportunity.lineLeader ? (
                          <span className='text-xs text-gray-500'>
                            {opportunity.bestLine.toFixed(1)} @ {opportunity.lineLeader}
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className='text-xs text-gray-500 mt-2'>
                Sorted by highest odds edge differential.
              </p>
            </div>
          ) : (
            <p className='text-gray-500 text-center py-6'>
              Insufficient bookmaker coverage to surface value deltas.
            </p>
          )}
        </div>

        {/* Positive EV Feed */}
        <div className='bg-white rounded-lg shadow-md p-6 mb-10'>
          <div className='flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-5'>
            <div className='flex items-center gap-3'>
              <Sparkles className='w-6 h-6 text-amber-500' />
              <div>
                <h3 className='text-lg font-semibold text-gray-900'>Positive EV Opportunities</h3>
                <p className='text-xs text-gray-500'>
                  Live feed powered by `/api/opportunities/positive-ev`
                </p>
              </div>
            </div>
            <div className='flex flex-wrap items-center gap-3'>
              <div className='flex items-center gap-2'>
                <label className='text-xs font-medium text-gray-600 uppercase tracking-wide'>
                  Min EV %
                </label>
                <input
                  type='range'
                  min='0'
                  max='15'
                  step='0.5'
                  value={minEvPercent}
                  onChange={e => setMinEvPercent(Number(e.target.value))}
                  className='w-32'
                />
                <span className='text-sm font-semibold text-amber-600 w-12 text-right'>
                  {minEvPercent.toFixed(1)}%
                </span>
              </div>

              <div className='flex items-center gap-2'>
                <label className='text-xs font-medium text-gray-600 uppercase tracking-wide'>
                  Book
                </label>
                <select
                  value={selectedEvBookmaker}
                  onChange={e => setSelectedEvBookmaker(e.target.value)}
                  className='text-xs border border-amber-200 rounded-md px-2 py-1 bg-white focus:ring-amber-400 focus:border-amber-400'
                >
                  {evBookmakerOptions.map(option => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>

              <div className='flex items-center gap-2'>
                <label className='text-xs font-medium text-gray-600 uppercase tracking-wide'>
                  Market
                </label>
                <select
                  value={selectedEvMarket}
                  onChange={e => setSelectedEvMarket(e.target.value)}
                  className='text-xs border border-amber-200 rounded-md px-2 py-1 bg-white focus:ring-amber-400 focus:border-amber-400'
                >
                  {evMarketOptions.map(option => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={fetchEvOpportunities}
                className='inline-flex items-center gap-2 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold rounded-md'
              >
                <RefreshCw className='w-3 h-3' /> Refresh
              </button>
              <button
                onClick={() => exportEvCsv(filteredEvOpportunities)}
                className='inline-flex items-center gap-2 px-3 py-1.5 border border-amber-200 text-amber-700 text-xs font-semibold rounded-md hover:bg-amber-50'
              >
                <ClipboardList className='w-3 h-3' /> Export
              </button>
            </div>
          </div>

          {evError && (
            <div className='mb-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700'>
              {evError}
            </div>
          )}

          <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mb-6'>
            <div className='p-4 border border-amber-100 rounded-lg bg-amber-50/40'>
              <p className='text-xs text-amber-700 uppercase tracking-wide mb-1'>Opportunities</p>
              <p className='text-2xl font-semibold text-amber-800'>{evSummary.count}</p>
              <p className='text-xs text-amber-600'>Matching EV threshold</p>
            </div>
            <div className='p-4 border border-emerald-100 rounded-lg bg-emerald-50/40'>
              <p className='text-xs text-emerald-700 uppercase tracking-wide mb-1'>Average EV%</p>
              <p className='text-2xl font-semibold text-emerald-800'>
                {evSummary.averageEv.toFixed(2)}%
              </p>
              <p className='text-xs text-emerald-600'>Across filtered feed</p>
            </div>
            <div className='p-4 border border-indigo-100 rounded-lg bg-indigo-50/40'>
              <p className='text-xs text-indigo-700 uppercase tracking-wide mb-1'>
                Top Opportunity
              </p>
              {evSummary.topEv > 0 ? (
                <div>
                  <p className='text-lg font-semibold text-indigo-800 flex items-baseline gap-2'>
                    {evSummary.topEv.toFixed(2)}%
                    <span className='text-xs text-indigo-500 font-medium'>
                      ({evSummary.topBookmaker})
                    </span>
                  </p>
                  <p className='text-xs text-indigo-500 truncate'>{evSummary.topMarket}</p>
                </div>
              ) : (
                <p className='text-xs text-indigo-500'>No qualifying feed entries</p>
              )}
            </div>
          </div>

          {evLoading ? (
            <div className='flex items-center justify-center h-32 text-sm text-gray-500'>
              Loading EV feed...
            </div>
          ) : filteredEvOpportunities.length > 0 ? (
            <div className='overflow-x-auto -mx-4 sm:mx-0'>
              <table className='min-w-full divide-y divide-gray-200 text-sm'>
                <thead className='bg-gray-50'>
                  <tr>
                    <th className='px-4 py-2 text-left font-medium text-gray-600'>Market</th>
                    <th className='px-4 py-2 text-left font-medium text-gray-600'>Book</th>
                    <th className='px-4 py-2 text-left font-medium text-gray-600'>Odds / Line</th>
                    <th className='px-4 py-2 text-right font-medium text-gray-600'>EV%</th>
                    <th className='px-4 py-2 text-right font-medium text-gray-600'>Edge</th>
                    <th className='px-4 py-2 text-right font-medium text-gray-600'>Kelly</th>
                    <th className='px-4 py-2 text-right font-medium text-gray-600'>Updated</th>
                  </tr>
                </thead>
                <tbody className='divide-y divide-gray-100'>
                  {filteredEvOpportunities.map(item => (
                    <tr key={item.id} className='hover:bg-gray-50 transition-colors'>
                      <td className='px-4 py-2'>
                        <div className='flex flex-col'>
                          <span className='font-semibold text-gray-800'>
                            {item.market ?? item.playerName ?? 'Unknown Market'}
                          </span>
                          <span className='text-xs text-gray-500'>
                            {item.playerName ? `${item.playerName} • ` : ''}
                            {item.team ?? item.sport ?? 'Multi'}
                          </span>
                        </div>
                      </td>
                      <td className='px-4 py-2 text-gray-700'>
                        <div className='flex items-center gap-2'>
                          <ClipboardList className='w-4 h-4 text-gray-400' />
                          <span className='font-medium'>{item.bookmaker ?? 'Unknown'}</span>
                        </div>
                      </td>
                      <td className='px-4 py-2 text-gray-700'>
                        <div className='flex flex-col text-xs'>
                          <span className='font-semibold text-gray-800'>
                            Odds: {item.odds != null ? item.odds.toFixed(2) : '—'}
                          </span>
                          <span className='text-gray-500'>
                            Line: {item.line != null ? item.line.toFixed(2) : '—'}
                          </span>
                        </div>
                      </td>
                      <td className='px-4 py-2 text-right font-semibold text-emerald-600'>
                        +{item.evPercent.toFixed(2)}%
                      </td>
                      <td className='px-4 py-2 text-right text-gray-700'>
                        {item.edge != null ? `${item.edge.toFixed(2)}%` : '—'}
                      </td>
                      <td className='px-4 py-2 text-right text-gray-700'>
                        {item.kellyStake != null ? `${item.kellyStake.toFixed(2)}u` : '—'}
                      </td>
                      <td className='px-4 py-2 text-right text-xs text-gray-500'>
                        {item.lastUpdated
                          ? new Date(item.lastUpdated).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className='grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6 px-4'>
                <div className='border border-amber-100 rounded-lg bg-amber-50/30 p-4'>
                  <div className='flex items-center justify-between mb-3'>
                    <div className='flex items-center gap-2'>
                      <PieChart className='w-4 h-4 text-amber-600' />
                      <h4 className='text-sm font-semibold text-amber-700'>
                        EV Bookmaker Leaderboard
                      </h4>
                    </div>
                    <span className='text-xs text-amber-600'>Top {evBookmakerSummary.length}</span>
                  </div>
                  {evBookmakerSummary.length > 0 ? (
                    <ul className='space-y-3'>
                      {evBookmakerSummary.map(entry => (
                        <li key={entry.bookmaker} className='flex items-center justify-between'>
                          <div>
                            <p className='text-sm font-semibold text-gray-800'>{entry.bookmaker}</p>
                            <p className='text-xs text-gray-500'>
                              {entry.count} opps · Top {entry.topEv.toFixed(2)}%
                            </p>
                          </div>
                          <div className='text-right'>
                            <p className='text-sm font-semibold text-emerald-600'>
                              {entry.averageEv.toFixed(2)}%
                            </p>
                            <p className='text-xs text-gray-500'>
                              Kelly:{' '}
                              {entry.kellyAverage != null
                                ? `${entry.kellyAverage.toFixed(2)}u`
                                : '—'}
                            </p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className='text-xs text-amber-700'>No bookmakers meet the filter yet.</p>
                  )}
                </div>
                <div className='border border-indigo-100 rounded-lg bg-indigo-50/30 p-4'>
                  <div className='flex items-center gap-2 mb-3'>
                    <Sparkles className='w-4 h-4 text-indigo-600' />
                    <h4 className='text-sm font-semibold text-indigo-700'>EV Range Distribution</h4>
                  </div>
                  {evBucketDistribution.length > 0 ? (
                    <ul className='space-y-3'>
                      {(() => {
                        const max = Math.max(
                          ...evBucketDistribution.map(bucket => bucket.count),
                          1
                        );
                        return evBucketDistribution.map(bucket => (
                          <li key={bucket.label}>
                            <div className='flex items-center justify-between text-xs text-gray-600 mb-1'>
                              <span>{bucket.label.trim()}</span>
                              <span>{bucket.count}</span>
                            </div>
                            <div className='h-2 rounded-full bg-white/60 overflow-hidden'>
                              <div
                                className='h-full rounded-full bg-indigo-400'
                                style={{ width: `${(bucket.count / max) * 100}%` }}
                              ></div>
                            </div>
                          </li>
                        ));
                      })()}
                    </ul>
                  ) : (
                    <p className='text-xs text-indigo-700'>No EV data to visualize currently.</p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <p className='text-gray-500 text-center py-6'>
              No positive EV opportunities meet the current filters.
            </p>
          )}
        </div>

        {evHistory.length > 0 && (
          <div className='bg-white rounded-lg shadow-md p-6 mb-10'>
            <div className='flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6'>
              <div className='flex items-center gap-3'>
                <TrendingUp className='w-5 h-5 text-emerald-500' />
                <div>
                  <h3 className='text-lg font-semibold text-gray-900'>EV Feed Momentum Snapshot</h3>
                  <p className='text-xs text-gray-500'>
                    Rolling analytics across the last {evHistory.length} pulls
                  </p>
                </div>
              </div>
              <div className='text-xs text-gray-500'>
                Captured every refresh — {new Date(evHistory[0].timestamp).toLocaleString()} →{' '}
                {new Date(evHistory[evHistory.length - 1].timestamp).toLocaleString()}
              </div>
            </div>

            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6'>
              <div className='p-4 border border-emerald-100 rounded-lg bg-emerald-50/40'>
                <p className='text-xs text-emerald-700 uppercase tracking-wide mb-1'>
                  Sessions ≥ Threshold
                </p>
                <p className='text-2xl font-semibold text-emerald-800'>
                  {evHistorySummary.overThreshold}
                </p>
                <p className='text-xs text-emerald-600'>
                  Average EV cleared {minEvPercent.toFixed(1)}%
                </p>
              </div>
              <div className='p-4 border border-rose-100 rounded-lg bg-rose-50/40'>
                <p className='text-xs text-rose-700 uppercase tracking-wide mb-1'>
                  Sessions &lt; Threshold
                </p>
                <p className='text-2xl font-semibold text-rose-800'>
                  {evHistorySummary.underThreshold}
                </p>
                <p className='text-xs text-rose-600'>Weighed below the slider target</p>
              </div>
              <div className='p-4 border border-indigo-100 rounded-lg bg-indigo-50/40'>
                <p className='text-xs text-indigo-700 uppercase tracking-wide mb-1'>
                  Peak EV Spotted
                </p>
                <p className='text-2xl font-semibold text-indigo-800'>
                  {evHistorySummary.peakEv.toFixed(2)}%
                </p>
                <p className='text-xs text-indigo-600'>
                  {evHistorySummary.peakTimestamp
                    ? new Date(evHistorySummary.peakTimestamp).toLocaleTimeString()
                    : '—'}
                </p>
              </div>
              <div className='p-4 border border-amber-100 rounded-lg bg-amber-50/40'>
                <p className='text-xs text-amber-700 uppercase tracking-wide mb-1'>Daily Avg EV</p>
                <p className='text-2xl font-semibold text-amber-800'>
                  {evHistorySummary.dailyAverage.toFixed(2)}%
                </p>
                <p className='text-xs text-amber-600'>Normalized per calendar day</p>
              </div>
            </div>

            <div className='overflow-x-auto -mx-4 sm:mx-0'>
              <table className='min-w-full divide-y divide-gray-200 text-sm'>
                <thead className='bg-gray-50'>
                  <tr>
                    <th className='px-4 py-2 text-left font-medium text-gray-600'>Timestamp</th>
                    <th className='px-4 py-2 text-right font-medium text-gray-600'>
                      Opportunities
                    </th>
                    <th className='px-4 py-2 text-right font-medium text-gray-600'>Average EV%</th>
                    <th className='px-4 py-2 text-right font-medium text-gray-600'>Peak EV%</th>
                  </tr>
                </thead>
                <tbody className='divide-y divide-gray-100'>
                  {evHistory
                    .slice()
                    .reverse()
                    .map(snapshot => (
                      <tr key={snapshot.timestamp} className='hover:bg-gray-50 transition-colors'>
                        <td className='px-4 py-2 text-xs text-gray-600'>
                          {new Date(snapshot.timestamp).toLocaleString()}
                        </td>
                        <td className='px-4 py-2 text-right font-medium text-gray-700'>
                          {snapshot.count}
                        </td>
                        <td className='px-4 py-2 text-right text-emerald-600 font-semibold'>
                          {snapshot.averageEv.toFixed(2)}%
                        </td>
                        <td className='px-4 py-2 text-right text-indigo-600 font-semibold'>
                          {snapshot.topEv.toFixed(2)}%
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
              <p className='text-xs text-gray-500 mt-2'>Limited to the last 20 refresh cycles.</p>
            </div>
          </div>
        )}

        {/* Feature Highlights */}
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6'>
          <FeatureCard
            icon={BarChart3}
            title='Multiple Chart Types'
            description='Line, bar, area, and comparison charts with real-time data'
            color='bg-blue-500'
          />
          <FeatureCard
            icon={Target}
            title='Benchmark Comparison'
            description='Compare performance against market benchmarks and targets'
            color='bg-green-500'
          />
          <FeatureCard
            icon={Activity}
            title='Interactive Controls'
            description='Customize timeframes, metrics, and visualization options'
            color='bg-purple-500'
          />
          <FeatureCard
            icon={Award}
            title='Performance Insights'
            description='AI-powered insights and recommendations based on trends'
            color='bg-orange-500'
          />
          <FeatureCard
            icon={RefreshCw}
            title='Props.Cash Integration'
            description='Real-time odds data, player performance, and live edge detection'
            color='bg-red-500'
          />
        </div>

        {/* Technical Features */}
        <div className='mt-12 bg-white rounded-lg shadow-md p-6'>
          <h2 className='text-xl font-semibold text-gray-800 mb-4 flex items-center'>
            <Zap className='w-5 h-5 text-yellow-500 mr-2' />
            Advanced Features Implemented
          </h2>

          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            <div>
              <h3 className='font-medium text-gray-800 mb-2'>Chart Capabilities</h3>
              <ul className='text-sm text-gray-600 space-y-1'>
                <li>• Multi-metric overlay comparisons</li>
                <li>• Interactive timeline controls</li>
                <li>• Benchmark and target line overlays</li>
                <li>• Real-time data updates</li>
                <li>• Customizable aggregation methods</li>
                <li>• Fullscreen visualization mode</li>
              </ul>
            </div>

            <div>
              <h3 className='font-medium text-gray-800 mb-2'>Props.Cash Integration</h3>
              <ul className='text-sm text-gray-600 space-y-1'>
                <li>• Real-time odds data from multiple sportsbooks</li>
                <li>• Live player performance metrics</li>
                <li>• Confidence-based filtering (0-100%)</li>
                <li>• Sport-specific data aggregation</li>
                <li>• Auto-refresh every 30 seconds</li>
                <li>• Advanced bookmaker filtering</li>
              </ul>
            </div>
          </div>

          <div className='mt-6 pt-6 border-t border-gray-200'>
            <h3 className='font-medium text-gray-800 mb-2'>Technical Implementation</h3>
            <ul className='text-sm text-gray-600 space-y-1'>
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
  <div className='bg-white rounded-lg shadow-md p-6'>
    <div className='flex items-center space-x-3 mb-3'>
      <div className={`p-2 rounded-lg ${color}`}>
        <Icon className='w-6 h-6 text-white' />
      </div>
      <h3 className='text-lg font-semibold text-gray-800'>{title}</h3>
    </div>
    <p className='text-gray-600'>{description}</p>
  </div>
);

export default PerformanceChartsDemo;
