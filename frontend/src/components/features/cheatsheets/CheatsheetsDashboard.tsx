/**
 * CheatsheetsDashboard - PropFinder-style cheatsheet with dynamic filters
 * Provides ranked prop opportunities with edge calculation and CSV export
 */

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  Filter,
  Download,
  TrendingUp,
  Eye,
  AlertCircle,
  Settings2,
  Search,
  RefreshCw,
  BookOpen,
  Target,
  Wifi,
  WifiOff
} from 'lucide-react';
import { cheatsheetsService, type PropOpportunity, type CheatsheetFilters as ServiceFilters } from '../../../services/cheatsheetsService';

interface CheatsheetFilters {
  minEdge: number;
  minConfidence: number;
  minSampleSize: number;
  statTypes: string[];
  books: string[];
  sides: ('over' | 'under')[];
  sports: string[];
  searchQuery: string;
}

interface FilterPreset {
  id: string;
  name: string;
  description: string;
  filters: CheatsheetFilters;
}

const DEFAULT_FILTERS: CheatsheetFilters = {
  minEdge: 2.0,
  minConfidence: 70,
  minSampleSize: 10,
  statTypes: [],
  books: [],
  sides: ['over', 'under'],
  sports: ['MLB'],
  searchQuery: ''
};

const FILTER_PRESETS: FilterPreset[] = [
  {
    id: 'high-edge',
    name: 'High Edge (5%+)',
    description: 'Premium opportunities with significant edge',
    filters: { ...DEFAULT_FILTERS, minEdge: 5.0, minConfidence: 80 }
  },
  {
    id: 'conservative',
    name: 'Conservative',
    description: 'Lower edge but high confidence plays',
    filters: { ...DEFAULT_FILTERS, minEdge: 1.5, minConfidence: 85, minSampleSize: 20 }
  },
  {
    id: 'volume',
    name: 'Volume Play',
    description: 'More opportunities with moderate edge',
    filters: { ...DEFAULT_FILTERS, minEdge: 1.0, minConfidence: 65, minSampleSize: 5 }
  }
];

export const CheatsheetsDashboard: React.FC = () => {
  const [opportunities, setOpportunities] = useState<PropOpportunity[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<CheatsheetFilters>(DEFAULT_FILTERS);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<string>('');
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [apiHealth, setApiHealth] = useState<boolean | null>(null);
  const [dataSource, setDataSource] = useState<string>('api');
  const [processingTime, setProcessingTime] = useState<number>(0);

  // Fetch opportunities using optimized service
  const fetchOpportunities = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const serviceFilters: Partial<ServiceFilters> = {
        min_edge: filters.minEdge,
        min_confidence: filters.minConfidence,
        min_sample_size: filters.minSampleSize,
        sports: filters.sports,
        stat_types: filters.statTypes,
        books: filters.books,
        sides: filters.sides,
        search_query: filters.searchQuery,
        max_results: 50
      };

      console.log('[CheatsheetsDashboard] Fetching opportunities via service...');
      const response = await cheatsheetsService.getOpportunities(serviceFilters);

      setOpportunities(response.opportunities);
      setLastRefresh(new Date(response.last_updated));
      setProcessingTime(response.processing_time_ms);
      setDataSource(response.cache_hit ? 'cache' : response.data_sources?.[0] || 'api');
      setApiHealth(true);

      if (response.market_status === 'limited') {
        setError('Using fallback data - API connectivity limited');
      } else {
        setError(null);
      }

      console.log(`[CheatsheetsDashboard] Loaded ${response.opportunities.length} opportunities`, {
        processingTime: response.processing_time_ms,
        cacheHit: response.cache_hit,
        marketStatus: response.market_status
      });

    } catch (err) {
      console.error('[CheatsheetsDashboard] Service failed:', err);
      setError(`Service error: ${err.message}`);
      setApiHealth(false);
      setDataSource('fallback');

      // Service handles fallback internally, so we should still get data
      setOpportunities([]);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // Check API health periodically
  const checkApiHealth = useCallback(async () => {
    const healthy = await cheatsheetsService.healthCheck();
    setApiHealth(healthy);
    return healthy;
  }, []);

  // Filter opportunities based on current filters
  const filteredOpportunities = useMemo(() => {
    return opportunities.filter(opp => {
      if (opp.edge_percentage < filters.minEdge) return false;
      if (opp.confidence < filters.minConfidence) return false;
      if (opp.sample_size < filters.minSampleSize) return false;
      if (filters.statTypes.length && !filters.statTypes.includes(opp.stat_type)) return false;
      if (filters.books.length && !filters.books.includes(opp.best_book)) return false;
      if (filters.sides.length && !filters.sides.includes(opp.recommended_side)) return false;
      if (filters.sports.length && !filters.sports.includes(opp.sport)) return false;
      if (filters.searchQuery && !opp.player_name.toLowerCase().includes(filters.searchQuery.toLowerCase())) return false;
      
      return true;
    }).sort((a, b) => b.edge_percentage - a.edge_percentage);
  }, [opportunities, filters]);

  // Export to CSV using service
  const exportToCSV = useCallback(async () => {
    try {
      const serviceFilters: Partial<ServiceFilters> = {
        min_edge: filters.minEdge,
        min_confidence: filters.minConfidence,
        min_sample_size: filters.minSampleSize,
        sports: filters.sports,
        stat_types: filters.statTypes,
        books: filters.books,
        sides: filters.sides,
        search_query: filters.searchQuery
      };

      const blob = await cheatsheetsService.exportCSV(serviceFilters);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `a1betting-cheatsheet-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('[CheatsheetsDashboard] CSV export failed:', error);
      setError('Failed to export CSV. Please try again.');
    }
  }, [filters]);

  // Apply filter preset
  const applyPreset = useCallback((presetId: string) => {
    const preset = FILTER_PRESETS.find(p => p.id === presetId);
    if (preset) {
      setFilters(preset.filters);
      setSelectedPreset(presetId);
    }
  }, []);

  // Load initial data
  useEffect(() => {
    fetchOpportunities();
  }, []);

  // Refresh every 2 minutes
  useEffect(() => {
    const interval = setInterval(fetchOpportunities, 120000);
    return () => clearInterval(interval);
  }, [fetchOpportunities]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Prop Cheatsheets</h1>
              <p className="text-slate-300">Ranked betting opportunities with calculated edge</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={exportToCSV}
                disabled={filteredOpportunities.length === 0}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
              >
                <Download className="w-4 h-4" />
                Export CSV
              </button>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                <Filter className="w-4 h-4" />
                Filters
              </button>
            </div>
          </div>

          {/* Status Bar */}
          <div className="mt-4 flex items-center justify-between bg-slate-800/50 backdrop-blur rounded-lg p-4">
            <div className="flex items-center gap-6">
              <div className="text-sm">
                <span className="text-slate-400">Opportunities:</span>
                <span className="text-white font-semibold ml-2">{filteredOpportunities.length}</span>
              </div>
              <div className="text-sm">
                <span className="text-slate-400">Avg Edge:</span>
                <span className="text-white font-semibold ml-2">
                  {filteredOpportunities.length > 0 
                    ? (filteredOpportunities.reduce((sum, opp) => sum + opp.edge_percentage, 0) / filteredOpportunities.length).toFixed(1)
                    : '0.0'
                  }%
                </span>
              </div>
              {lastRefresh && (
                <div className="text-sm">
                  <span className="text-slate-400">Last Updated:</span>
                  <span className="text-white font-semibold ml-2">
                    {lastRefresh.toLocaleTimeString()}
                  </span>
                </div>
              )}
            </div>
            <button
              onClick={fetchOpportunities}
              disabled={loading}
              className="flex items-center gap-2 px-3 py-1 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-white rounded-md transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="bg-slate-800/50 backdrop-blur rounded-lg border border-slate-700 p-6 mb-6">
            <div className="flex items-center gap-3 mb-4">
              <Settings2 className="w-5 h-5 text-blue-400" />
              <h3 className="text-lg font-semibold text-white">Filter Options</h3>
            </div>

            {/* Presets */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-300 mb-2">Quick Presets</label>
              <div className="flex flex-wrap gap-2">
                {FILTER_PRESETS.map(preset => (
                  <button
                    key={preset.id}
                    onClick={() => applyPreset(preset.id)}
                    className={`px-3 py-2 rounded-lg border text-sm transition-colors ${
                      selectedPreset === preset.id
                        ? 'bg-blue-600 border-blue-500 text-white'
                        : 'bg-slate-700 border-slate-600 text-slate-300 hover:bg-slate-600'
                    }`}
                  >
                    <div className="font-medium">{preset.name}</div>
                    <div className="text-xs opacity-75">{preset.description}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Edge Filter */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Minimum Edge: {filters.minEdge}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="10"
                  step="0.1"
                  value={filters.minEdge}
                  onChange={(e) => setFilters(prev => ({ ...prev, minEdge: parseFloat(e.target.value) }))}
                  className="w-full"
                />
              </div>

              {/* Confidence Filter */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Minimum Confidence: {filters.minConfidence}%
                </label>
                <input
                  type="range"
                  min="50"
                  max="95"
                  step="1"
                  value={filters.minConfidence}
                  onChange={(e) => setFilters(prev => ({ ...prev, minConfidence: parseInt(e.target.value) }))}
                  className="w-full"
                />
              </div>

              {/* Sample Size Filter */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Minimum Sample Size: {filters.minSampleSize}
                </label>
                <input
                  type="range"
                  min="5"
                  max="50"
                  step="1"
                  value={filters.minSampleSize}
                  onChange={(e) => setFilters(prev => ({ ...prev, minSampleSize: parseInt(e.target.value) }))}
                  className="w-full"
                />
              </div>

              {/* Search */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Search Players</label>
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search by player name..."
                    value={filters.searchQuery}
                    onChange={(e) => setFilters(prev => ({ ...prev, searchQuery: e.target.value }))}
                    className="w-full bg-slate-700 text-white border border-slate-600 rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-900/50 border border-red-700 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2 text-red-300">
              <AlertCircle className="w-5 h-5" />
              <span>Error: {error}</span>
            </div>
          </div>
        )}

        {/* Opportunities Table */}
        <div className="bg-slate-800/50 backdrop-blur rounded-lg border border-slate-700 overflow-hidden">
          <div className="p-4 border-b border-slate-700">
            <div className="flex items-center gap-3">
              <Target className="w-5 h-5 text-green-400" />
              <h3 className="text-lg font-semibold text-white">Best Opportunities</h3>
            </div>
          </div>

          {loading ? (
            <div className="p-8 text-center">
              <div className="flex items-center justify-center gap-2 text-slate-400">
                <RefreshCw className="w-5 h-5 animate-spin" />
                Loading opportunities...
              </div>
            </div>
          ) : filteredOpportunities.length === 0 ? (
            <div className="p-8 text-center">
              <BookOpen className="w-12 h-12 mx-auto mb-4 text-slate-600" />
              <p className="text-slate-400">No opportunities match your current filters</p>
              <p className="text-sm text-slate-500 mt-2">Try adjusting your filter criteria</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-700/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Player</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Prop</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Line</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Side</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Edge</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Confidence</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Best Odds</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Book</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Recent</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  {filteredOpportunities.map((opp) => (
                    <tr key={opp.id} className="hover:bg-slate-700/30 transition-colors">
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-white">{opp.player_name}</div>
                          <div className="text-xs text-slate-400">{opp.team} vs {opp.opponent}</div>
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-300">
                        {opp.stat_type.replace('_', ' ').toUpperCase()}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-white font-mono">
                        {opp.line}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          opp.recommended_side === 'over' 
                            ? 'bg-green-900/50 text-green-300' 
                            : 'bg-red-900/50 text-red-300'
                        }`}>
                          {opp.recommended_side.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-green-400">
                            {opp.edge_percentage.toFixed(1)}%
                          </span>
                          <TrendingUp className="w-3 h-3 text-green-400" />
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-300">
                        {opp.confidence.toFixed(0)}%
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-white font-mono">
                        {opp.best_odds > 0 ? '+' : ''}{opp.best_odds}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-300">
                        {opp.best_book}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-xs text-slate-400">
                        {opp.recent_performance}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Disclaimer */}
        <div className="mt-8 text-xs text-slate-500 bg-slate-800/30 rounded-lg p-4">
          <p className="font-semibold mb-2">⚠️ Important Disclaimers:</p>
          <ul className="space-y-1">
            <li>• This tool is for research purposes only (18+/21+ depending on jurisdiction)</li>
            <li>• Edge calculations are estimates based on historical data and model predictions</li>
            <li>• Always verify odds and lines with sportsbooks before placing any wagers</li>
            <li>• Past performance does not guarantee future results</li>
            <li>• Never bet more than you can afford to lose</li>
            <li>• Seek help if gambling becomes a problem: 1-800-522-4700</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default CheatsheetsDashboard;
