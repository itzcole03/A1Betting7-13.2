import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Search, RefreshCw, Info } from 'lucide-react';
import trendsService from '../services/trendsService';
import {
  TrendLeaderboardEntry,
  TrendLeaderboardFilters,
  TrendMetric,
  SportFilter,
  MarketTypeFilter,
  SortConfig,
  FilterState,
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

const TABLE_COLUMNS: TrendsTableColumn[] = [
  { key: 'rank', label: '#', sortable: false, className: 'w-12 text-center' },
  { key: 'playerName', label: 'Player', sortable: true, className: 'min-w-[150px]' },
  { key: 'team', label: 'Team', sortable: true, className: 'w-16 text-center' },
  { key: 'sport', label: 'Sport', sortable: true, className: 'w-16 text-center' },
  { 
    key: 'overHitRate', 
    label: 'Hit Rate', 
    sortable: true, 
    format: (value) => `${((value as number) * 100).toFixed(1)}%`,
    className: 'w-20 text-right'
  },
  { 
    key: 'avgEv', 
    label: 'Avg EV', 
    sortable: true, 
    format: (value) => `${(value as number) > 0 ? '+' : ''}${(value as number).toFixed(1)}%`,
    className: 'w-20 text-right'
  },
  { 
    key: 'arbitrageCount', 
    label: 'Arb Count', 
    sortable: true, 
    format: (value) => (value as number).toString(),
    className: 'w-20 text-center'
  },
  { 
    key: 'highConfidenceRate', 
    label: 'High Conf', 
    sortable: true, 
    format: (value) => `${((value as number) * 100).toFixed(1)}%`,
    className: 'w-20 text-right'
  },
  { 
    key: 'totalProps', 
    label: 'Props', 
    sortable: true, 
    format: (value) => (value as number).toString(),
    className: 'w-16 text-center'
  },
];

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
  });

  // Sort state
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    field: 'overHitRate',
    direction: 'desc',
  });

  // Load data from API
  const loadData = useCallback(async (showRefreshIndicator = false) => {
    if (showRefreshIndicator) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const apiFilters: TrendLeaderboardFilters = {
        metric: filters.metric,
        sport: filters.sport,
        marketType: filters.marketType,
        minSamples: filters.minSamples,
        periodDays: filters.periodDays,
        limit: 100, // Load more data for client-side filtering
      };

      const [response, summaryData] = await Promise.all([
        trendsService.getTrendsLeaderboard(apiFilters),
        trendsService.getTrendsSummary(),
      ]);

      if (response.success) {
        // Transform backend data to frontend format
        const transformedData = response.data.map((entry: BackendTrendEntry) => ({
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
  }, [filters]);

  // Load data on component mount and filter changes
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Filtered and sorted data
  const processedData = useMemo(() => {
    let filtered = data;

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
  }, [data, filters.searchTerm, sortConfig]);

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
    const value = entry[metric === 'over_hit_rate' ? 'overHitRate' : 
                       metric === 'avg_ev' ? 'avgEv' :
                       metric === 'arbitrage_count' ? 'arbitrageCount' : 'highConfidenceRate'];
    
    let colorClass = '';
    if (metric === 'over_hit_rate' || metric === 'high_confidence_rate') {
      const percentage = value as number;
      colorClass = percentage >= 0.7 ? 'text-green-400' : 
                   percentage >= 0.5 ? 'text-yellow-400' : 'text-red-400';
    } else if (metric === 'avg_ev') {
      const ev = value as number;
      colorClass = ev > 5 ? 'text-green-400' : 
                   ev > 0 ? 'text-yellow-400' : 'text-red-400';
    } else {
      const count = value as number;
      colorClass = count >= 3 ? 'text-green-400' : 
                   count >= 1 ? 'text-yellow-400' : 'text-gray-400';
    }

    const column = TABLE_COLUMNS.find(col => col.key === (metric === 'over_hit_rate' ? 'overHitRate' : 
                                                          metric === 'avg_ev' ? 'avgEv' :
                                                          metric === 'arbitrage_count' ? 'arbitrageCount' : 'highConfidenceRate'));
    const formatted = column?.format ? column.format(value) : String(value);

    return <span className={colorClass}>{formatted}</span>;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400"></div>
            <span className="ml-3 text-white">Loading trends data...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Trends Leaderboard</h1>
            <p className="text-gray-300">Performance metrics and rankings across all players</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button
              onClick={handleClearCache}
              className="flex items-center gap-2 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Clear Cache
            </button>
          </div>
        </div>

        {/* Summary Stats */}
        {summary && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-lg p-4">
              <div className="text-2xl font-bold text-white">{summary.totalPlayers.toLocaleString()}</div>
              <div className="text-gray-400">Total Players</div>
            </div>
            <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-lg p-4">
              <div className="text-2xl font-bold text-white">{summary.totalPropsAnalyzed.toLocaleString()}</div>
              <div className="text-gray-400">Props Analyzed</div>
            </div>
            <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-lg p-4">
              <div className="text-2xl font-bold text-white">{summary.sportsCovered.length}</div>
              <div className="text-gray-400">Sports Covered</div>
            </div>
            <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-lg p-4">
              <div className="text-2xl font-bold text-white">{filters.periodDays}d</div>
              <div className="text-gray-400">Analysis Period</div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-lg p-6">
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            {/* Metric Selector */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Primary Metric
              </label>
              <select
                value={filters.metric}
                onChange={(e) => updateFilter('metric', e.target.value as TrendMetric)}
                className="w-full bg-slate-700 border border-slate-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {Object.entries(METRIC_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>

            {/* Sport Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Sport
              </label>
              <select
                value={filters.sport}
                onChange={(e) => updateFilter('sport', e.target.value as SportFilter)}
                className="w-full bg-slate-700 border border-slate-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="ALL">All Sports</option>
                <option value="MLB">MLB</option>
                <option value="NBA">NBA</option>
                <option value="NFL">NFL</option>
                <option value="NHL">NHL</option>
              </select>
            </div>

            {/* Market Type Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Market Type
              </label>
              <select
                value={filters.marketType}
                onChange={(e) => updateFilter('marketType', e.target.value as MarketTypeFilter)}
                className="w-full bg-slate-700 border border-slate-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Markets</option>
                <option value="player_props">Player Props</option>
                <option value="team_totals">Team Totals</option>
                <option value="spreads">Spreads</option>
                <option value="moneylines">Moneylines</option>
              </select>
            </div>

            {/* Min Samples */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Min Samples
              </label>
              <input
                type="number"
                min="1"
                max="100"
                value={filters.minSamples}
                onChange={(e) => updateFilter('minSamples', parseInt(e.target.value) || 5)}
                className="w-full bg-slate-700 border border-slate-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Period Days */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Period (Days)
              </label>
              <select
                value={filters.periodDays}
                onChange={(e) => updateFilter('periodDays', parseInt(e.target.value))}
                className="w-full bg-slate-700 border border-slate-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Search
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Player, team, sport..."
                  value={filters.searchTerm}
                  onChange={(e) => updateFilter('searchTerm', e.target.value)}
                  className="w-full bg-slate-700 border border-slate-600 rounded-md pl-10 pr-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Selected Metric Info */}
          <div className="mt-4 p-3 bg-slate-700/50 rounded-md">
            <div className="flex items-center gap-2 text-sm">
              <Info className="h-4 w-4 text-blue-400" />
              <span className="text-gray-300">
                <strong>{METRIC_LABELS[filters.metric]}:</strong> {METRIC_DESCRIPTIONS[filters.metric]}
              </span>
            </div>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-900/50 border border-red-700 rounded-lg p-4">
            <div className="text-red-200">Error: {error}</div>
          </div>
        )}

        {/* Leaderboard Table */}
        <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-700/50">
                <tr>
                  {TABLE_COLUMNS.map((column) => (
                    <th
                      key={column.key}
                      className={`px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider ${column.className} ${
                        column.sortable ? 'cursor-pointer hover:bg-slate-600/50' : ''
                      }`}
                      onClick={column.sortable ? () => handleSort(column.key) : undefined}
                    >
                      <div className="flex items-center gap-1">
                        {column.label}
                        {column.sortable && sortConfig.field === column.key && (
                          <span className="text-blue-400">
                            {sortConfig.direction === 'desc' ? '↓' : '↑'}
                          </span>
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {processedData.length === 0 ? (
                  <tr>
                    <td colSpan={TABLE_COLUMNS.length} className="px-4 py-8 text-center text-gray-400">
                      No data available with current filters
                    </td>
                  </tr>
                ) : (
                  processedData.map((entry, index) => (
                    <tr key={entry.playerId} className="hover:bg-slate-700/30">
                      <td className="px-4 py-3 text-center text-white">{index + 1}</td>
                      <td className="px-4 py-3">
                        <div className="text-white font-medium">{entry.playerName}</div>
                      </td>
                      <td className="px-4 py-3 text-center text-gray-300">{entry.team || '-'}</td>
                      <td className="px-4 py-3 text-center">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-900/50 text-blue-200">
                          {entry.sport}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">{renderMetricValue(entry, 'over_hit_rate')}</td>
                      <td className="px-4 py-3 text-right">{renderMetricValue(entry, 'avg_ev')}</td>
                      <td className="px-4 py-3 text-center">{renderMetricValue(entry, 'arbitrage_count')}</td>
                      <td className="px-4 py-3 text-right">{renderMetricValue(entry, 'high_confidence_rate')}</td>
                      <td className="px-4 py-3 text-center text-gray-300">{entry.totalProps}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Results Summary */}
        <div className="text-center text-gray-400 text-sm">
          Showing {processedData.length} of {data.length} entries
          {filters.searchTerm && ` matching "${filters.searchTerm}"`}
        </div>
      </div>
    </div>
  );
};

export default Trends;
