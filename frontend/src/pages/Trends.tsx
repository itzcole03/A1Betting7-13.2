import { Info, RefreshCw, Search } from 'lucide-react';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend as RechartsLegend,
  Tooltip as RechartsTooltip,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  XAxis,
  YAxis,
  ZAxis,
} from 'recharts';
import trendsService from '../services/trendsService';
import {
  FilterState,
  MarketTypeFilter,
  SortConfig,
  SportFilter,
  TrendLeaderboardEntry,
  TrendLeaderboardFilters,
  TrendMetric,
  TrendsTableColumn,
  TrendStatsSummary,
} from '../types/trends';

interface BackendTrendEntry {
  player_id: string;
  player_name: string;
  team?: string;
  sport: string;
  market_type: string;
  over_hit_rate: number;
  avg_ev: number;
  arbitrage_count: number;
  high_confidence_rate: number;
  total_props: number;
  sample_period_days: number;
  last_updated: string;
  rank?: number;
}

const METRIC_LABELS: Record<TrendMetric, string> = {
  over_hit_rate: 'Over Hit Rate',
  avg_ev: 'Avg Expected Value',
  arbitrage_count: 'Arbitrage Count',
  high_confidence_rate: 'High Confidence Rate',
};

const METRIC_DESCRIPTIONS: Record<TrendMetric, string> = {
  over_hit_rate: 'Percentage of over bets that hit',
  avg_ev: 'Average expected value percentage across all props',
  arbitrage_count: 'Number of arbitrage opportunities identified',
  high_confidence_rate: 'Rate of predictions with >70% confidence',
};

const METRIC_FIELD_MAP: Record<TrendMetric, keyof TrendLeaderboardEntry> = {
  over_hit_rate: 'overHitRate',
  avg_ev: 'avgEv',
  arbitrage_count: 'arbitrageCount',
  high_confidence_rate: 'highConfidenceRate',
};

const TABLE_COLUMNS: TrendsTableColumn[] = [
  { key: 'rank', label: '#', sortable: false, className: 'w-12 text-center' },
  { key: 'playerName', label: 'Player', sortable: true, className: 'min-w-[150px]' },
  { key: 'team', label: 'Team', sortable: true, className: 'w-16 text-center' },
  { key: 'sport', label: 'Sport', sortable: true, className: 'w-16 text-center' },
  {
    key: 'overHitRate',
    label: 'Hit Rate',
    sortable: true,
    format: value => `${((value as number) * 100).toFixed(1)}%`,
    className: 'w-20 text-right',
  },
  {
    key: 'avgEv',
    label: 'Avg EV',
    sortable: true,
    format: value => `${(value as number) > 0 ? '+' : ''}${(value as number).toFixed(1)}%`,
    className: 'w-20 text-right',
  },
  {
    key: 'arbitrageCount',
    label: 'Arb Count',
    sortable: true,
    format: value => (value as number).toString(),
    className: 'w-20 text-center',
  },
  {
    key: 'highConfidenceRate',
    label: 'High Conf',
    sortable: true,
    format: value => `${((value as number) * 100).toFixed(1)}%`,
    className: 'w-20 text-right',
  },
  {
    key: 'totalProps',
    label: 'Props',
    sortable: true,
    format: value => (value as number).toString(),
    className: 'w-16 text-center',
  },
];

const SPORT_COLOR_MAP: Record<string, string> = {
  MLB: '#38bdf8',
  NBA: '#a855f7',
  NFL: '#22c55e',
  NHL: '#f97316',
  default: '#94a3b8',
};

interface ScatterTooltipProps {
  active?: boolean;
  payload?: Array<{
    payload: {
      playerName: string;
      avgEv: number;
      hitRate: number;
      confidenceRate: number;
      arbitrageCount: number;
      sport: string;
    };
  }>;
}

const calculatePercentileValue = (sortedValues: number[], percentile: number): number => {
  if (sortedValues.length === 0) {
    return 0;
  }

  if (sortedValues.length === 1) {
    return sortedValues[0];
  }

  const clampedPercentile = Math.min(Math.max(percentile, 0), 100);
  const rank = (clampedPercentile / 100) * (sortedValues.length - 1);
  const lowerIndex = Math.floor(rank);
  const upperIndex = Math.ceil(rank);
  const weight = rank - lowerIndex;

  const lowerValue = sortedValues[lowerIndex];
  const upperValue = sortedValues[Math.min(upperIndex, sortedValues.length - 1)];

  if (lowerIndex === upperIndex) {
    return lowerValue;
  }

  return lowerValue + weight * (upperValue - lowerValue);
};

const Trends: React.FC = () => {
  const [data, setData] = useState<TrendLeaderboardEntry[]>([]);
  const [summary, setSummary] = useState<TrendStatsSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Filter state
  const [filters, setFilters] = useState<FilterState>({
    metric: 'over_hit_rate',
    sport: 'ALL',
    marketType: 'all',
    minSamples: 5,
    periodDays: 30,
    searchTerm: '',
    minHitRate: 50,
    minAvgEv: -2,
    arbitrageOnly: false,
    highConfidenceOnly: false,
  });

  // Sort state
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    field: 'overHitRate',
    direction: 'desc',
  });

  const { metric, sport, marketType, minSamples, periodDays } = filters;

  // Load data from API
  const loadData = useCallback(
    async (showRefreshIndicator = false) => {
      if (showRefreshIndicator) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      try {
        const apiFilters: TrendLeaderboardFilters = {
          metric,
          sport,
          marketType,
          minSamples,
          periodDays,
          limit: 100, // Load more data for client-side filtering
        };

        const [response, summaryData] = await Promise.all([
          trendsService.getTrendsLeaderboard(apiFilters),
          trendsService.getTrendsSummary(),
        ]);

        if (response.success) {
          // Transform backend data to frontend format
          const backendEntries = response.data as unknown as BackendTrendEntry[];
          const transformedData = backendEntries.map(entry => ({
            playerId: entry.player_id,
            playerName: entry.player_name,
            team: entry.team,
            sport: entry.sport,
            marketType: entry.market_type,
            overHitRate: entry.over_hit_rate,
            avgEv: entry.avg_ev,
            arbitrageCount: entry.arbitrage_count,
            highConfidenceRate: entry.high_confidence_rate,
            totalProps: entry.total_props,
            samplePeriodDays: entry.sample_period_days,
            lastUpdated: entry.last_updated,
            rank: entry.rank,
          }));

          setData(transformedData);
          setSummary(summaryData);
        } else {
          setError(response.error || 'Failed to load data');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [metric, sport, marketType, minSamples, periodDays]
  );

  // Load data on component mount and filter changes
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Filtered and sorted data
  const activeMetricField = METRIC_FIELD_MAP[filters.metric];

  const processedData = useMemo(() => {
    let filtered = [...data];

    const minHitRateDecimal = filters.minHitRate / 100;
    const minAvgEv = filters.minAvgEv;

    if (filters.arbitrageOnly) {
      filtered = filtered.filter(entry => entry.arbitrageCount > 0);
    }

    if (filters.highConfidenceOnly) {
      filtered = filtered.filter(entry => entry.highConfidenceRate >= 0.7);
    }

    if (filters.minHitRate > 0) {
      filtered = filtered.filter(entry => entry.overHitRate >= minHitRateDecimal);
    }

    if (!Number.isNaN(minAvgEv)) {
      filtered = filtered.filter(entry => entry.avgEv >= minAvgEv);
    }

    // Apply search filter
    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(
        entry =>
          entry.playerName.toLowerCase().includes(searchLower) ||
          entry.team?.toLowerCase().includes(searchLower) ||
          entry.sport.toLowerCase().includes(searchLower)
      );
    }

    // Sort data
    filtered.sort((a, b) => {
      const aValue = a[sortConfig.field];
      const bValue = b[sortConfig.field];

      if (aValue === bValue) return 0;
      if (aValue == null) return 1;
      if (bValue == null) return -1;

      const comparison = aValue > bValue ? 1 : -1;
      return sortConfig.direction === 'desc' ? -comparison : comparison;
    });

    return filtered;
  }, [
    data,
    filters.arbitrageOnly,
    filters.highConfidenceOnly,
    filters.minAvgEv,
    filters.minHitRate,
    filters.searchTerm,
    sortConfig,
  ]);

  const topPerformers = useMemo(() => {
    return processedData.slice(0, 5).map(entry => ({
      name: entry.playerName,
      team: entry.team,
      sport: entry.sport,
      value: entry[activeMetricField] as number,
    }));
  }, [processedData, activeMetricField]);

  const bottomPerformers = useMemo(() => {
    return processedData
      .slice(-5)
      .reverse()
      .map(entry => ({
        name: entry.playerName,
        team: entry.team,
        sport: entry.sport,
        value: entry[activeMetricField] as number,
      }));
  }, [processedData, activeMetricField]);

  const sportBreakdown = useMemo(() => {
    const aggregates = processedData.reduce<Record<string, { total: number; count: number }>>(
      (acc, entry) => {
        const sportKey = entry.sport || 'Unknown';
        const value = (entry[activeMetricField] as number) ?? 0;
        if (!acc[sportKey]) {
          acc[sportKey] = { total: 0, count: 0 };
        }
        acc[sportKey].total += value;
        acc[sportKey].count += 1;
        return acc;
      },
      {}
    );

    return Object.entries(aggregates)
      .map(([sport, { total, count }]) => ({
        sport,
        value: count > 0 ? total / count : 0,
      }))
      .sort((a, b) => b.value - a.value);
  }, [processedData, activeMetricField]);

  const metricColumn = useMemo(() => {
    return TABLE_COLUMNS.find(col => col.key === METRIC_FIELD_MAP[filters.metric]);
  }, [filters.metric]);

  const formatMetricValue = useCallback(
    (value: number) => {
      if (!metricColumn?.format) {
        return value.toFixed(2);
      }
      const formatted = metricColumn.format(value);
      return typeof formatted === 'string' ? formatted : String(formatted);
    },
    [metricColumn]
  );

  const metricStats = useMemo(() => {
    const values = processedData
      .map(entry => entry[activeMetricField] as number)
      .filter(value => typeof value === 'number' && !Number.isNaN(value));

    if (values.length === 0) {
      return null;
    }

    const sorted = [...values].sort((a, b) => a - b);
    const average = sorted.reduce((acc, value) => acc + value, 0) / sorted.length;
    const variance = sorted.reduce((acc, value) => acc + (value - average) ** 2, 0) / sorted.length;

    return {
      min: sorted[0],
      max: sorted[sorted.length - 1],
      median: calculatePercentileValue(sorted, 50),
      p25: calculatePercentileValue(sorted, 25),
      p75: calculatePercentileValue(sorted, 75),
      average,
      stdDev: Math.sqrt(variance),
    };
  }, [processedData, activeMetricField]);

  const evConfidenceScatter = useMemo(() => {
    return processedData.slice(0, 120).map(entry => ({
      playerName: entry.playerName,
      avgEv: Number(entry.avgEv.toFixed(2)),
      hitRate: Number((entry.overHitRate * 100).toFixed(1)),
      confidenceRate: Number((entry.highConfidenceRate * 100).toFixed(1)),
      arbitrageCount: entry.arbitrageCount,
      sport: entry.sport,
      color: SPORT_COLOR_MAP[entry.sport] ?? SPORT_COLOR_MAP.default,
    }));
  }, [processedData]);

  const activeScatterSports = useMemo(() => {
    const unique = new Set(evConfidenceScatter.map(point => point.sport));
    return Array.from(unique.values()).filter(Boolean);
  }, [evConfidenceScatter]);

  const renderScatterTooltip = useCallback((props: ScatterTooltipProps) => {
    const { active, payload } = props;
    if (!active || !payload || payload.length === 0) {
      return null;
    }

    const point = payload[0]?.payload as {
      playerName: string;
      avgEv: number;
      hitRate: number;
      confidenceRate: number;
      arbitrageCount: number;
      sport: string;
    } | null;

    if (!point) {
      return null;
    }

    return (
      <div className='rounded-lg border border-slate-700 bg-slate-900/90 px-3 py-2 text-xs text-slate-200 shadow-lg shadow-slate-900/40'>
        <p className='text-sm font-semibold text-white'>{point.playerName}</p>
        <p className='text-[11px] text-slate-400'>{point.sport}</p>
        <div className='mt-2 space-y-1'>
          <div className='flex justify-between gap-8'>
            <span>Avg EV</span>
            <span className='font-semibold text-cyan-300'>{point.avgEv}%</span>
          </div>
          <div className='flex justify-between gap-8'>
            <span>Hit Rate</span>
            <span className='font-semibold text-emerald-300'>{point.hitRate}%</span>
          </div>
          <div className='flex justify-between gap-8'>
            <span>High-Confidence</span>
            <span className='font-semibold text-amber-300'>{point.confidenceRate}%</span>
          </div>
          <div className='flex justify-between gap-8'>
            <span>Arb Count</span>
            <span className='font-semibold text-white'>{point.arbitrageCount}</span>
          </div>
        </div>
      </div>
    );
  }, []);

  // Handle sort change
  const handleSort = (field: keyof TrendLeaderboardEntry) => {
    setSortConfig(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'desc' ? 'asc' : 'desc',
    }));
  };

  // Handle filter changes
  const updateFilter = <K extends keyof FilterState>(key: K, value: FilterState[K]) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  // Handle refresh
  const handleRefresh = () => {
    void loadData(true);
  };

  // Clear cache and refresh
  const handleClearCache = async () => {
    try {
      await trendsService.clearCache();
      void loadData(true);
    } catch {
      setError('Failed to clear cache');
    }
  };

  // Render metric value with color coding
  const renderMetricValue = (entry: TrendLeaderboardEntry, metric: TrendMetric) => {
    const value =
      entry[
        metric === 'over_hit_rate'
          ? 'overHitRate'
          : metric === 'avg_ev'
          ? 'avgEv'
          : metric === 'arbitrage_count'
          ? 'arbitrageCount'
          : 'highConfidenceRate'
      ];

    let colorClass = '';
    if (metric === 'over_hit_rate' || metric === 'high_confidence_rate') {
      const percentage = value as number;
      colorClass =
        percentage >= 0.7
          ? 'text-green-400'
          : percentage >= 0.5
          ? 'text-yellow-400'
          : 'text-red-400';
    } else if (metric === 'avg_ev') {
      const ev = value as number;
      colorClass = ev > 5 ? 'text-green-400' : ev > 0 ? 'text-yellow-400' : 'text-red-400';
    } else {
      const count = value as number;
      colorClass = count >= 3 ? 'text-green-400' : count >= 1 ? 'text-yellow-400' : 'text-gray-400';
    }

    const column = TABLE_COLUMNS.find(
      col =>
        col.key ===
        (metric === 'over_hit_rate'
          ? 'overHitRate'
          : metric === 'avg_ev'
          ? 'avgEv'
          : metric === 'arbitrage_count'
          ? 'arbitrageCount'
          : 'highConfidenceRate')
    );
    const formatted = column?.format ? column.format(value) : String(value);

    return <span className={colorClass}>{formatted}</span>;
  };

  if (loading) {
    return (
      <div className='min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-6'>
        <div className='max-w-7xl mx-auto'>
          <div className='flex items-center justify-center h-64'>
            <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400'></div>
            <span className='ml-3 text-white'>Loading trends data...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-6'>
      <div className='max-w-7xl mx-auto space-y-6'>
        {/* Header */}
        <div className='flex items-center justify-between'>
          <div>
            <h1 className='text-3xl font-bold text-white mb-2'>Trends Leaderboard</h1>
            <p className='text-gray-300 flex items-center gap-2'>
              Performance metrics and rankings across all players
              <span className='inline-flex items-center gap-2 text-xs text-gray-400 bg-slate-800/70 border border-slate-700 rounded-full px-3 py-1'>
                <Info className='w-4 h-4' />
                {METRIC_DESCRIPTIONS[filters.metric]}
              </span>
            </p>
          </div>
          <div className='flex items-center gap-3'>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className='flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg transition-colors'
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button
              onClick={handleClearCache}
              className='flex items-center gap-2 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors'
            >
              Clear Cache
            </button>
          </div>
        </div>

        {/* Summary Stats */}
        {summary && (
          <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
            <div className='bg-slate-800/50 backdrop-blur border border-slate-700 rounded-lg p-4'>
              <div className='text-2xl font-bold text-white'>
                {summary.totalPlayers.toLocaleString()}
              </div>
              <div className='text-gray-400'>Total Players</div>
            </div>
            <div className='bg-slate-800/50 backdrop-blur border border-slate-700 rounded-lg p-4'>
              <div className='text-2xl font-bold text-white'>
                {summary.totalPropsAnalyzed.toLocaleString()}
              </div>
              <div className='text-gray-400'>Props Analyzed</div>
            </div>
            <div className='bg-slate-800/50 backdrop-blur border border-slate-700 rounded-lg p-4'>
              <div className='text-2xl font-bold text-white'>{summary.sportsCovered.length}</div>
              <div className='text-gray-400'>Sports Covered</div>
            </div>
            <div className='bg-slate-800/50 backdrop-blur border border-slate-700 rounded-lg p-4'>
              <div className='text-2xl font-bold text-white'>{filters.periodDays}d</div>
              <div className='text-gray-400'>Analysis Period</div>
            </div>
          </div>
        )}

        {metricStats && (
          <div className='grid grid-cols-1 gap-6 lg:grid-cols-5'>
            <div className='lg:col-span-2 rounded-2xl border border-slate-700 bg-slate-800/60 p-6 backdrop-blur'>
              <h2 className='text-xl font-semibold text-white'>Metric Distribution</h2>
              <p className='mt-1 text-sm text-gray-400'>
                Understand how {METRIC_LABELS[filters.metric].toLowerCase()} behaves across the
                current leaderboard slice.
              </p>
              <div className='mt-4 grid grid-cols-2 gap-3 text-sm text-gray-300'>
                <div>
                  <p className='text-xs uppercase tracking-widest text-gray-500'>Median</p>
                  <p className='text-lg font-semibold text-white'>
                    {formatMetricValue(metricStats.median)}
                  </p>
                </div>
                <div>
                  <p className='text-xs uppercase tracking-widest text-gray-500'>Average</p>
                  <p className='text-lg font-semibold text-white'>
                    {formatMetricValue(metricStats.average)}
                  </p>
                </div>
                <div>
                  <p className='text-xs uppercase tracking-widest text-gray-500'>25th Percentile</p>
                  <p className='text-lg font-semibold text-white'>
                    {formatMetricValue(metricStats.p25)}
                  </p>
                </div>
                <div>
                  <p className='text-xs uppercase tracking-widest text-gray-500'>75th Percentile</p>
                  <p className='text-lg font-semibold text-white'>
                    {formatMetricValue(metricStats.p75)}
                  </p>
                </div>
                <div>
                  <p className='text-xs uppercase tracking-widest text-gray-500'>Range</p>
                  <p className='text-lg font-semibold text-white'>
                    {formatMetricValue(metricStats.min)} – {formatMetricValue(metricStats.max)}
                  </p>
                </div>
                <div>
                  <p className='text-xs uppercase tracking-widest text-gray-500'>Volatility (σ)</p>
                  <p className='text-lg font-semibold text-white'>
                    {formatMetricValue(metricStats.stdDev)}
                  </p>
                </div>
              </div>
            </div>

            <div className='lg:col-span-3 rounded-2xl border border-slate-700 bg-slate-800/60 p-6 backdrop-blur'>
              <div className='flex items-center justify-between'>
                <div>
                  <h2 className='text-xl font-semibold text-white'>EV vs Hit Rate Explorer</h2>
                  <p className='text-sm text-gray-400'>
                    Size indicates arbitrage count · color-coded by sport for quick pattern
                    scanning.
                  </p>
                </div>
                <span className='text-xs uppercase tracking-widest text-gray-500'>
                  Top 120 rows
                </span>
              </div>
              {activeScatterSports.length > 0 && (
                <div className='mt-3 flex flex-wrap gap-2 text-xs text-gray-400'>
                  {activeScatterSports.map(sportKey => (
                    <span
                      key={sportKey}
                      className='inline-flex items-center gap-2 rounded-full border border-slate-700/80 px-3 py-1'
                    >
                      <span
                        className='h-2 w-2 rounded-full'
                        style={{
                          backgroundColor: SPORT_COLOR_MAP[sportKey] ?? SPORT_COLOR_MAP.default,
                        }}
                      />
                      {sportKey}
                    </span>
                  ))}
                </div>
              )}
              <div className='mt-4 h-80 w-full'>
                {evConfidenceScatter.length === 0 ? (
                  <div className='flex h-full items-center justify-center text-sm text-gray-400'>
                    Not enough data to render scatter plot.
                  </div>
                ) : (
                  <ResponsiveContainer>
                    <ScatterChart margin={{ top: 10, right: 20, bottom: 20, left: 10 }}>
                      <CartesianGrid strokeDasharray='3 3' stroke='rgba(148, 163, 184, 0.2)' />
                      <XAxis
                        type='number'
                        dataKey='avgEv'
                        name='Avg EV'
                        unit='%'
                        stroke='#CBD5F5'
                      />
                      <YAxis
                        type='number'
                        dataKey='hitRate'
                        name='Hit Rate'
                        unit='%'
                        stroke='#CBD5F5'
                        domain={[0, 100]}
                      />
                      <ZAxis dataKey='arbitrageCount' range={[60, 200]} name='Arb Count' />
                      <RechartsTooltip
                        cursor={{ strokeDasharray: '3 3', stroke: 'rgba(59, 130, 246, 0.5)' }}
                        content={renderScatterTooltip}
                      />
                      <ReferenceLine x={0} stroke='#f97316' strokeDasharray='4 4' />
                      <ReferenceLine y={70} stroke='#22c55e' strokeDasharray='4 4' />
                      <Scatter name='Players' data={evConfidenceScatter} shape='circle'>
                        {evConfidenceScatter.map(point => (
                          <Cell key={`${point.playerName}-${point.avgEv}`} fill={point.color} />
                        ))}
                      </Scatter>
                    </ScatterChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Metric Insights */}
        <div className='grid grid-cols-1 xl:grid-cols-3 gap-6'>
          <div className='xl:col-span-2 bg-slate-800/50 backdrop-blur border border-slate-700 rounded-lg p-6'>
            <div className='flex items-center justify-between mb-4'>
              <h2 className='text-xl font-semibold text-white'>Top Performers</h2>
              <span className='text-sm text-gray-400'>{METRIC_LABELS[filters.metric]}</span>
            </div>
            {topPerformers.length === 0 ? (
              <p className='text-gray-400 text-sm'>Not enough data to display chart.</p>
            ) : (
              <div className='h-64' data-testid='top-performers-chart'>
                <ResponsiveContainer width='100%' height='100%'>
                  <BarChart
                    data={[...topPerformers].reverse()}
                    margin={{ top: 10, right: 20, left: 0, bottom: 30 }}
                  >
                    <CartesianGrid strokeDasharray='3 3' stroke='rgba(148, 163, 184, 0.2)' />
                    <XAxis
                      dataKey='name'
                      tick={{ fill: '#CBD5F5', fontSize: 12 }}
                      angle={-20}
                      textAnchor='end'
                      interval={0}
                      height={50}
                    />
                    <YAxis
                      tick={{ fill: '#CBD5F5', fontSize: 12 }}
                      tickFormatter={val => formatMetricValue(val as number)}
                      width={70}
                    />
                    <RechartsTooltip
                      cursor={{ fill: 'rgba(148, 163, 184, 0.1)' }}
                      formatter={(value: number) => [
                        formatMetricValue(value),
                        METRIC_LABELS[filters.metric],
                      ]}
                    />
                    <RechartsLegend wrapperStyle={{ color: '#CBD5F5' }} />
                    <Bar dataKey='value' name='Top performers' radius={[4, 4, 0, 0]}>
                      {topPerformers.map(entry => (
                        <Cell key={entry.name} fill='#38bdf8' />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          <div className='bg-slate-800/50 backdrop-blur border border-slate-700 rounded-lg p-6 space-y-4'>
            <h2 className='text-xl font-semibold text-white'>Leaderboard Highlights</h2>
            <div>
              <span className='text-gray-400 text-sm'>Best performer</span>
              {topPerformers[0] ? (
                <div className='mt-2'>
                  <p className='text-white font-semibold'>{topPerformers[0]?.name}</p>
                  <p className='text-sm text-gray-400'>
                    {formatMetricValue(topPerformers[0]?.value ?? 0)}
                  </p>
                </div>
              ) : (
                <p className='text-sm text-gray-500'>No data available</p>
              )}
            </div>
            <div>
              <span className='text-gray-400 text-sm'>Needs attention</span>
              {bottomPerformers[0] ? (
                <div className='mt-2'>
                  <p className='text-white font-semibold'>{bottomPerformers[0]?.name}</p>
                  <p className='text-sm text-gray-400'>
                    {formatMetricValue(bottomPerformers[0]?.value ?? 0)}
                  </p>
                </div>
              ) : (
                <p className='text-sm text-gray-500'>No data available</p>
              )}
            </div>
            <div>
              <span className='text-gray-400 text-sm'>Sports coverage</span>
              <ul className='mt-2 space-y-1 text-sm text-gray-300'>
                {sportBreakdown.slice(0, 5).map(item => (
                  <li key={item.sport} className='flex justify-between'>
                    <span>{item.sport}</span>
                    <span>{formatMetricValue(item.value)}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Sport Breakdown Chart */}
        <div className='bg-slate-800/50 backdrop-blur border border-slate-700 rounded-lg p-6'>
          <div className='flex items-center justify-between mb-4'>
            <div>
              <h2 className='text-xl font-semibold text-white'>Metric by Sport</h2>
              <p className='text-sm text-gray-400'>
                Average {METRIC_LABELS[filters.metric]} for each sport
              </p>
            </div>
          </div>
          {sportBreakdown.length === 0 ? (
            <p className='text-gray-400 text-sm'>Not enough data to display sport breakdown.</p>
          ) : (
            <div className='h-80' data-testid='sport-breakdown-chart'>
              <ResponsiveContainer width='100%' height='100%'>
                <BarChart
                  data={sportBreakdown}
                  margin={{ top: 10, right: 20, left: 0, bottom: 10 }}
                >
                  <CartesianGrid strokeDasharray='3 3' stroke='rgba(148, 163, 184, 0.2)' />
                  <XAxis dataKey='sport' tick={{ fill: '#CBD5F5' }} />
                  <YAxis
                    tick={{ fill: '#CBD5F5' }}
                    tickFormatter={val => formatMetricValue(val as number)}
                    width={70}
                  />
                  <RechartsTooltip
                    cursor={{ fill: 'rgba(148, 163, 184, 0.1)' }}
                    formatter={(value: number) => [
                      formatMetricValue(value),
                      METRIC_LABELS[filters.metric],
                    ]}
                  />
                  <Bar dataKey='value' radius={[4, 4, 0, 0]} fill='#a855f7' />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Filters */}
        <div className='bg-slate-800/50 backdrop-blur border border-slate-700 rounded-lg p-6'>
          <div className='grid grid-cols-1 gap-4 md:grid-cols-8'>
            {/* Metric Selector */}
            <div>
              <label className='block text-sm font-medium text-gray-300 mb-2'>Primary Metric</label>
              <select
                value={filters.metric}
                onChange={e => updateFilter('metric', e.target.value as TrendMetric)}
                className='w-full bg-slate-700 border border-slate-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500'
              >
                {Object.entries(METRIC_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            {/* Sport Filter */}
            <div>
              <label className='block text-sm font-medium text-gray-300 mb-2'>Sport</label>
              <select
                value={filters.sport}
                onChange={e => updateFilter('sport', e.target.value as SportFilter)}
                className='w-full bg-slate-700 border border-slate-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500'
              >
                <option value='ALL'>All Sports</option>
                <option value='MLB'>MLB</option>
                <option value='NBA'>NBA</option>
                <option value='NFL'>NFL</option>
                <option value='NHL'>NHL</option>
              </select>
            </div>

            {/* Market Type Filter */}
            <div>
              <label className='block text-sm font-medium text-gray-300 mb-2'>Market Type</label>
              <select
                value={filters.marketType}
                onChange={e => updateFilter('marketType', e.target.value as MarketTypeFilter)}
                className='w-full bg-slate-700 border border-slate-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500'
              >
                <option value='all'>All Markets</option>
                <option value='player_props'>Player Props</option>
                <option value='team_totals'>Team Totals</option>
                <option value='spreads'>Spreads</option>
                <option value='moneylines'>Moneylines</option>
              </select>
            </div>

            {/* Min Samples */}
            <div>
              <label className='block text-sm font-medium text-gray-300 mb-2'>Min Samples</label>
              <input
                type='number'
                min='1'
                max='100'
                value={filters.minSamples}
                onChange={e => updateFilter('minSamples', parseInt(e.target.value) || 5)}
                className='w-full bg-slate-700 border border-slate-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500'
              />
            </div>

            {/* Period Days */}
            <div>
              <label className='block text-sm font-medium text-gray-300 mb-2'>Period (Days)</label>
              <select
                value={filters.periodDays}
                onChange={e => updateFilter('periodDays', parseInt(e.target.value))}
                className='w-full bg-slate-700 border border-slate-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500'
              >
                <option value={7}>7 Days</option>
                <option value={14}>14 Days</option>
                <option value={30}>30 Days</option>
                <option value={60}>60 Days</option>
                <option value={90}>90 Days</option>
              </select>
            </div>

            {/* Search */}
            <div>
              <label className='block text-sm font-medium text-gray-300 mb-2'>Search</label>
              <div className='relative'>
                <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400' />
                <input
                  type='text'
                  placeholder='Player, team, sport...'
                  value={filters.searchTerm}
                  onChange={e => updateFilter('searchTerm', e.target.value)}
                  className='w-full bg-slate-700 border border-slate-600 rounded-md pl-10 pr-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500'
                />
              </div>
            </div>

            {/* Min Hit Rate */}
            <div>
              <label className='block text-sm font-medium text-gray-300 mb-2'>Min Hit Rate</label>
              <div className='space-y-2'>
                <input
                  type='range'
                  min={0}
                  max={90}
                  step={5}
                  value={filters.minHitRate}
                  onChange={e => updateFilter('minHitRate', parseInt(e.target.value, 10))}
                  className='w-full accent-sky-400'
                />
                <div className='flex items-center justify-between text-xs text-gray-400'>
                  <span>0%</span>
                  <span className='font-semibold text-white'>{filters.minHitRate}%+</span>
                </div>
              </div>
            </div>

            {/* Min Avg EV */}
            <div>
              <label className='block text-sm font-medium text-gray-300 mb-2'>Min Avg EV</label>
              <div className='space-y-2'>
                <input
                  type='range'
                  min={-20}
                  max={20}
                  step={1}
                  value={filters.minAvgEv}
                  onChange={e => updateFilter('minAvgEv', parseInt(e.target.value, 10))}
                  className='w-full accent-emerald-400'
                />
                <div className='flex items-center justify-between text-xs text-gray-400'>
                  <span>-20%</span>
                  <span className='font-semibold text-white'>{filters.minAvgEv}%+</span>
                </div>
              </div>
            </div>

            {/* Arbitrage Toggle */}
            <div className='flex flex-col justify-end gap-2'>
              <label className='text-sm font-medium text-gray-300'>Arbitrage Focus</label>
              <label className='inline-flex items-center gap-2 text-sm text-gray-300'>
                <input
                  type='checkbox'
                  checked={filters.arbitrageOnly}
                  onChange={e => updateFilter('arbitrageOnly', e.target.checked)}
                  className='h-4 w-4 rounded border-slate-600 text-sky-400 focus:ring-sky-500'
                />
                Require arb count &gt; 0
              </label>
            </div>

            {/* High Confidence Toggle */}
            <div className='flex flex-col justify-end gap-2'>
              <label className='text-sm font-medium text-gray-300'>High Confidence</label>
              <label className='inline-flex items-center gap-2 text-sm text-gray-300'>
                <input
                  type='checkbox'
                  checked={filters.highConfidenceOnly}
                  onChange={e => updateFilter('highConfidenceOnly', e.target.checked)}
                  className='h-4 w-4 rounded border-slate-600 text-emerald-400 focus:ring-emerald-500'
                />
                Only show &gt;= 70%
              </label>
            </div>
          </div>

          {/* Selected Metric Info */}
          <div className='mt-4 p-3 bg-slate-700/50 rounded-md'>
            <div className='flex items-center gap-2 text-sm'>
              <Info className='h-4 w-4 text-blue-400' />
              <span className='text-gray-300'>
                <strong>{METRIC_LABELS[filters.metric]}:</strong>{' '}
                {METRIC_DESCRIPTIONS[filters.metric]}
              </span>
            </div>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className='bg-red-900/50 border border-red-700 rounded-lg p-4'>
            <div className='text-red-200'>Error: {error}</div>
          </div>
        )}

        {/* Leaderboard Table */}
        <div className='bg-slate-800/50 backdrop-blur border border-slate-700 rounded-lg overflow-hidden'>
          <div className='overflow-x-auto'>
            <table className='w-full'>
              <thead className='bg-slate-700/50'>
                <tr>
                  {TABLE_COLUMNS.map(column => (
                    <th
                      key={column.key}
                      className={`px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider ${
                        column.className
                      } ${column.sortable ? 'cursor-pointer hover:bg-slate-600/50' : ''}`}
                      onClick={column.sortable ? () => handleSort(column.key) : undefined}
                    >
                      <div className='flex items-center gap-1'>
                        {column.label}
                        {column.sortable && sortConfig.field === column.key && (
                          <span className='text-blue-400'>
                            {sortConfig.direction === 'desc' ? '↓' : '↑'}
                          </span>
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className='divide-y divide-slate-700'>
                {processedData.length === 0 ? (
                  <tr>
                    <td
                      colSpan={TABLE_COLUMNS.length}
                      className='px-4 py-8 text-center text-gray-400'
                    >
                      No data available with current filters
                    </td>
                  </tr>
                ) : (
                  processedData.map((entry, index) => (
                    <tr key={entry.playerId} className='hover:bg-slate-700/30'>
                      <td className='px-4 py-3 text-center text-white'>{index + 1}</td>
                      <td className='px-4 py-3'>
                        <div className='text-white font-medium'>{entry.playerName}</div>
                      </td>
                      <td className='px-4 py-3 text-center text-gray-300'>{entry.team || '-'}</td>
                      <td className='px-4 py-3 text-center'>
                        <span className='inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-900/50 text-blue-200'>
                          {entry.sport}
                        </span>
                      </td>
                      <td className='px-4 py-3 text-right'>
                        {renderMetricValue(entry, 'over_hit_rate')}
                      </td>
                      <td className='px-4 py-3 text-right'>{renderMetricValue(entry, 'avg_ev')}</td>
                      <td className='px-4 py-3 text-center'>
                        {renderMetricValue(entry, 'arbitrage_count')}
                      </td>
                      <td className='px-4 py-3 text-right'>
                        {renderMetricValue(entry, 'high_confidence_rate')}
                      </td>
                      <td className='px-4 py-3 text-center text-gray-300'>{entry.totalProps}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Results Summary */}
        <div className='text-center text-gray-400 text-sm'>
          Showing {processedData.length} of {data.length} entries
          {filters.searchTerm && ` matching "${filters.searchTerm}"`}
        </div>
      </div>
    </div>
  );
};

export default Trends;
