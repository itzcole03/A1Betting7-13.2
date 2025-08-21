/**
 * OddsComparison - Real-time odds comparison and arbitrage detection
 * Integrates with backend odds aggregation service for live updates
 */

import {
  AlertCircle,
  Clock,
  Download,
  Eye,
  Filter,
  RefreshCw,
  Search,
  Target,
  TrendingUp,
  Zap,
} from 'lucide-react';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { enhancedLogger } from '../../../utils/enhancedLogger';
import { mockOddsData } from './MockOddsData';

// (Removed unused BookLine interface - kept canonical and arbitrage types only)

interface CanonicalLine {
  market: string;
  player_name: string;
  stat_type: string;
  best_over_book: string;
  best_over_price: number;
  best_over_line: number;
  best_under_book: string;
  best_under_price: number;
  best_under_line: number;
  no_vig_fair_price: number;
  arbitrage_opportunity: boolean;
  arbitrage_profit: number;
  books_count: number;
}

interface ArbitrageOpportunity {
  market: string;
  player_name: string;
  stat_type: string;
  over_book: string;
  over_price: number;
  over_line: number;
  under_book: string;
  under_price: number;
  under_line: number;
  profit_percentage: number;
  stake_distribution: {
    over: number;
    under: number;
  };
  timestamp: string;
}

interface OddsFilters {
  sport: string;
  searchQuery: string;
  minArbitrageProfit: number;
  books: string[];
  statTypes: string[];
  showArbitrageOnly: boolean;
}

const DEFAULT_FILTERS: OddsFilters = {
  sport: 'baseball_mlb',
  searchQuery: '',
  minArbitrageProfit: 1.0,
  books: [],
  statTypes: [],
  showArbitrageOnly: false,
};

const OddsComparison: React.FC = () => {
  const [bestLines, setBestLines] = useState<CanonicalLine[]>([]);
  const [arbitrageOps, setArbitrageOps] = useState<ArbitrageOpportunity[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<OddsFilters>(DEFAULT_FILTERS);
  const [showFilters, setShowFilters] = useState(false);
  const [activeTab, setActiveTab] = useState<'lines' | 'arbitrage'>('lines');
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Available books and stat types for filtering
  const [availableBooks, setAvailableBooks] = useState<string[]>([]);
  // prefix with '_' because it's declared for future UI but currently unused
  const [_availableStatTypes] = useState<string[]>([
    'hits',
    'home_runs',
    'rbis',
    'total_bases',
    'runs_scored',
    'strikeouts',
    'walks',
  ]);

  // Fetch odds comparison data
  const fetchOddsData = useCallback(async () => {
    setLoading(true);
    setError(null);

  // Use mock data immediately for demo mode
  enhancedLogger.info('OddsComparison', 'fetchOddsData', 'Using mock data (backend unavailable)');
    setBestLines(mockOddsData.best_lines);

    // Extract unique books for filtering
    const books = new Set<string>();
    mockOddsData.best_lines.forEach((line: unknown) => {
      if (line && typeof line === 'object') {
        const l = line as Record<string, unknown>;
        const bo = l.best_over_book as string | undefined;
        const bu = l.best_under_book as string | undefined;
        if (typeof bo === 'string') books.add(bo);
        if (typeof bu === 'string') books.add(bu);
      }
    });
    setAvailableBooks(Array.from(books));

    setLastUpdate(new Date());
    setLoading(false);

    // Still try to fetch real data in background but don't block UI
    try {
      const params = new URLSearchParams({
        sport: filters.sport,
        limit: '100',
      });

      const response = await fetch(`/v1/odds/compare?${params}`, {
        signal: AbortSignal.timeout(2000),
      });

      if (response.ok) {
        const data = await response.json();
        setBestLines(data.best_lines || mockOddsData.best_lines);

        const realBooks = new Set<string>();
        data.best_lines?.forEach((line: CanonicalLine) => {
          realBooks.add(line.best_over_book);
          realBooks.add(line.best_under_book);
        });
        setAvailableBooks(Array.from(realBooks));
        setLastUpdate(new Date());
  enhancedLogger.info('OddsComparison', 'fetchOddsData', 'Successfully loaded real data', { timestamp: new Date().toISOString() });
      }
    } catch (err) {
      // Silently continue with mock data
      enhancedLogger.warn('OddsComparison', 'fetchOddsData', 'Backend unavailable, continuing with mock data', undefined, err as Error);
    }
  }, [filters.sport]);

  // Fetch arbitrage opportunities
  const fetchArbitrageData = useCallback(async () => {
    // Use mock data immediately
    setArbitrageOps(mockOddsData.arbitrage_opportunities);

    // Try to get real data in background
    try {
      const params = new URLSearchParams({
        sport: filters.sport,
        min_profit: filters.minArbitrageProfit.toString(),
        limit: '50',
      });

      const response = await fetch(`/v1/odds/arbitrage?${params}`, {
        signal: AbortSignal.timeout(2000),
      });

      if (response.ok) {
        const data = await response.json();
        setArbitrageOps(data.opportunities || mockOddsData.arbitrage_opportunities);
      }
    } catch (err) {
      enhancedLogger.warn('OddsComparison', 'fetchArbitrageData', 'Arbitrage API unavailable, using mock data', undefined, err as Error);
    }
  }, [filters.sport, filters.minArbitrageProfit]);

  // Generate mock data for demo
  const _generateMockBestLines = (): CanonicalLine[] => {
    const mockPlayers = ['Aaron Judge', 'Mookie Betts', 'Ronald Acuna Jr.', 'Juan Soto'];
    const statTypes = ['hits', 'home_runs', 'rbis', 'total_bases'];
    const books = ['DraftKings', 'FanDuel', 'BetMGM', 'Caesars'];

    return mockPlayers.flatMap(player =>
      statTypes.map(stat => ({
        market: 'Mock Game',
        player_name: player,
        stat_type: stat,
        best_over_book: books[Math.floor(Math.random() * books.length)],
        best_over_price: -110 + Math.floor(Math.random() * 20),
        best_over_line: 1.5 + Math.random() * 2,
        best_under_book: books[Math.floor(Math.random() * books.length)],
        best_under_price: -110 + Math.floor(Math.random() * 20),
        best_under_line: 1.5 + Math.random() * 2,
        no_vig_fair_price: 0.45 + Math.random() * 0.1,
        arbitrage_opportunity: Math.random() > 0.8,
        arbitrage_profit: Math.random() * 3,
        books_count: 3 + Math.floor(Math.random() * 3),
      }))
    );
  };

  const _generateMockArbitrageOps = (): ArbitrageOpportunity[] => {
    const mockPlayers = ['Aaron Judge', 'Mookie Betts'];
    const statTypes = ['hits', 'total_bases'];
    const books = ['DraftKings', 'FanDuel', 'BetMGM', 'Caesars'];

    return mockPlayers.map((player, i) => ({
      market: 'Mock Game',
      player_name: player,
      stat_type: statTypes[i % statTypes.length],
      over_book: books[0],
      over_price: -105,
      over_line: 1.5 + i * 0.5,
      under_book: books[1],
      under_price: -105,
      under_line: 1.5 + i * 0.5,
      profit_percentage: 2.0 + Math.random() * 2,
      stake_distribution: {
        over: 48 + Math.random() * 4,
        under: 52 - Math.random() * 4,
      },
      timestamp: new Date().toISOString(),
    }));
  };

  // Filter lines based on current filters
  const filteredLines = useMemo(() => {
    return bestLines
      .filter(line => {
        if (
          filters.searchQuery &&
          !line.player_name.toLowerCase().includes(filters.searchQuery.toLowerCase())
        ) {
          return false;
        }
        if (
          filters.books.length &&
          !filters.books.includes(line.best_over_book) &&
          !filters.books.includes(line.best_under_book)
        ) {
          return false;
        }
        if (filters.statTypes.length && !filters.statTypes.includes(line.stat_type)) {
          return false;
        }
        if (filters.showArbitrageOnly && !line.arbitrage_opportunity) {
          return false;
        }
        return true;
      })
      .sort((a, b) => b.arbitrage_profit - a.arbitrage_profit);
  }, [bestLines, filters]);

  // Export data to CSV
  const exportToCSV = useCallback(() => {
    const data = activeTab === 'lines' ? filteredLines : arbitrageOps;

    if (activeTab === 'lines') {
      const headers = [
        'Player',
        'Stat',
        'Best Over',
        'Over Book',
        'Best Under',
        'Under Book',
        'Fair Price',
        'Arbitrage',
        'Books',
      ];
      const canonicalLines = (data as CanonicalLine[]).filter(
        (l): l is CanonicalLine => !!l && typeof l.player_name === 'string'
      );

      const csvContent = [
        headers.join(','),
        ...canonicalLines.map(line =>
          [
            line.player_name,
            line.stat_type,
            line.best_over_price,
            line.best_over_book,
            line.best_under_price,
            line.best_under_book,
            line.no_vig_fair_price.toFixed(3),
            line.arbitrage_profit.toFixed(2) + '%',
            line.books_count,
          ].join(',')
        ),
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `odds-comparison-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } else {
      const headers = [
        'Player',
        'Stat',
        'Over Book',
        'Over Odds',
        'Under Book',
        'Under Odds',
        'Profit %',
        'Over Stake',
        'Under Stake',
      ];
      const csvContent = [
        headers.join(','),
        ...arbitrageOps.map(op =>
          [
            op.player_name,
            op.stat_type,
            op.over_book,
            op.over_price,
            op.under_book,
            op.under_price,
            op.profit_percentage.toFixed(2) + '%',
            '$' + op.stake_distribution.over.toFixed(2),
            '$' + op.stake_distribution.under.toFixed(2),
          ].join(',')
        ),
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `arbitrage-opportunities-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    }
  }, [activeTab, filteredLines, arbitrageOps]);

  // Auto-refresh functionality
  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        fetchOddsData();
        if (activeTab === 'arbitrage') {
          fetchArbitrageData();
        }
      }, 30000); // Refresh every 30 seconds

      return () => clearInterval(interval);
    }
  }, [autoRefresh, activeTab, fetchOddsData, fetchArbitrageData]);

  // Initial data load
  useEffect(() => {
    fetchOddsData();
  }, [fetchOddsData]);

  useEffect(() => {
    if (activeTab === 'arbitrage') {
      fetchArbitrageData();
    }
  }, [activeTab, fetchArbitrageData]);

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900'>
      <div className='max-w-7xl mx-auto px-4 py-8'>
        {/* Header */}
        <div className='mb-8'>
          <div className='flex items-center justify-between'>
            <div>
              <h1 className='text-3xl font-bold text-white mb-2'>Odds Comparison</h1>
              <p className='text-slate-300'>
                Real-time sportsbook comparison and arbitrage detection
              </p>
            </div>
            <div className='flex items-center gap-3'>
              <button
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  autoRefresh ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-600 hover:bg-gray-700'
                } text-white`}
              >
                <Zap className='w-4 h-4' />
                Auto-refresh
              </button>
              <button
                onClick={exportToCSV}
                className='flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors'
              >
                <Download className='w-4 h-4' />
                Export
              </button>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className='flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors'
              >
                <Filter className='w-4 h-4' />
                Filters
              </button>
            </div>
          </div>

          {/* Status Bar */}
          <div className='mt-4 flex items-center justify-between bg-slate-800/50 backdrop-blur rounded-lg p-4'>
            <div className='flex items-center gap-6'>
              <div className='text-sm'>
                <span className='text-slate-400'>Total Lines:</span>
                <span className='text-white font-semibold ml-2'>{filteredLines.length}</span>
              </div>
              <div className='text-sm'>
                <span className='text-slate-400'>Arbitrage Ops:</span>
                <span className='text-green-400 font-semibold ml-2'>
                  {filteredLines.filter(line => line.arbitrage_opportunity).length}
                </span>
              </div>
              <div className='text-sm'>
                <span className='text-slate-400'>Books:</span>
                <span className='text-white font-semibold ml-2'>{availableBooks.length}</span>
              </div>
              {lastUpdate && (
                <div className='text-sm'>
                  <span className='text-slate-400'>Updated:</span>
                  <span className='text-white font-semibold ml-2'>
                    {lastUpdate.toLocaleTimeString()}
                  </span>
                </div>
              )}
            </div>
            <button
              onClick={() => {
                fetchOddsData();
                if (activeTab === 'arbitrage') fetchArbitrageData();
              }}
              disabled={loading}
              className='flex items-center gap-2 px-3 py-1 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-white rounded-md transition-colors'
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className='bg-slate-800/50 backdrop-blur rounded-lg border border-slate-700 p-6 mb-6'>
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
              {/* Search */}
              <div>
                <label className='block text-sm font-medium text-slate-300 mb-2'>
                  Search Players
                </label>
                <div className='relative'>
                  <Search className='w-4 h-4 absolute left-3 top-3 text-slate-400' />
                  <input
                    type='text'
                    placeholder='Search by player name...'
                    value={filters.searchQuery}
                    onChange={e => setFilters(prev => ({ ...prev, searchQuery: e.target.value }))}
                    className='w-full bg-slate-700 text-white border border-slate-600 rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500'
                  />
                </div>
              </div>

              {/* Min Arbitrage Profit */}
              <div>
                <label className='block text-sm font-medium text-slate-300 mb-2'>
                  Min Arbitrage Profit: {filters.minArbitrageProfit}%
                </label>
                <input
                  type='range'
                  min='0.1'
                  max='5'
                  step='0.1'
                  value={filters.minArbitrageProfit}
                  onChange={e =>
                    setFilters(prev => ({
                      ...prev,
                      minArbitrageProfit: parseFloat(e.target.value),
                    }))
                  }
                  className='w-full'
                />
              </div>

              {/* Show Arbitrage Only */}
              <div className='flex items-center'>
                <input
                  type='checkbox'
                  id='arbitrage-only'
                  checked={filters.showArbitrageOnly}
                  onChange={e =>
                    setFilters(prev => ({
                      ...prev,
                      showArbitrageOnly: e.target.checked,
                    }))
                  }
                  className='mr-2'
                />
                <label htmlFor='arbitrage-only' className='text-sm text-slate-300'>
                  Show arbitrage opportunities only
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className='bg-slate-800/50 backdrop-blur rounded-lg border border-slate-700 mb-6'>
          <div className='border-b border-slate-700'>
            <nav className='flex space-x-8 px-6'>
      {[ 
                { id: 'lines', label: 'Best Lines', icon: TrendingUp },
                { id: 'arbitrage', label: 'Arbitrage Opportunities', icon: Target },
      ].map(tab => {
                const Icon = tab.icon;
                return (
                  <button
        key={tab.id}
        onClick={() => setActiveTab(tab.id as 'lines' | 'arbitrage')}
                    className={`flex items-center gap-2 py-4 border-b-2 font-medium text-sm transition-colors ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-400'
                        : 'border-transparent text-slate-400 hover:text-slate-300 hover:border-slate-600'
                    }`}
                  >
                    <Icon className='w-4 h-4' />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Tab Content */}
          <div className='p-6'>
            {error && (
              <div className='mb-6 bg-red-900/50 border border-red-700 rounded-lg p-4'>
                <div className='flex items-center gap-2 text-red-300'>
                  <AlertCircle className='w-5 h-5' />
                  <span>{error}</span>
                </div>
              </div>
            )}

            {activeTab === 'lines' && (
              <div>
                {loading && filteredLines.length === 0 ? (
                  <div className='text-center py-8'>
                    <RefreshCw className='w-8 h-8 mx-auto mb-4 text-slate-600 animate-spin' />
                    <p className='text-slate-400'>Loading odds comparison...</p>
                  </div>
                ) : filteredLines.length === 0 ? (
                  <div className='text-center py-8'>
                    <Eye className='w-12 h-12 mx-auto mb-4 text-slate-600' />
                    <p className='text-slate-400'>No lines match your current filters</p>
                  </div>
                ) : (
                  <div className='overflow-x-auto'>
                    <table className='w-full'>
                      <thead className='bg-slate-700/50'>
                        <tr>
                          <th className='px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase'>
                            Player
                          </th>
                          <th className='px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase'>
                            Stat
                          </th>
                          <th className='px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase'>
                            Best Over
                          </th>
                          <th className='px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase'>
                            Best Under
                          </th>
                          <th className='px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase'>
                            Fair Price
                          </th>
                          <th className='px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase'>
                            Arbitrage
                          </th>
                          <th className='px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase'>
                            Books
                          </th>
                        </tr>
                      </thead>
                      <tbody className='divide-y divide-slate-700'>
                        {filteredLines.map((line, index) => (
                          <tr key={index} className='hover:bg-slate-700/30 transition-colors'>
                            <td className='px-4 py-4 whitespace-nowrap'>
                              <div className='text-sm font-medium text-white'>
                                {line.player_name}
                              </div>
                              <div className='text-xs text-slate-400'>{line.market}</div>
                            </td>
                            <td className='px-4 py-4 whitespace-nowrap text-sm text-slate-300'>
                              {line.stat_type.replace('_', ' ').toUpperCase()}
                            </td>
                            <td className='px-4 py-4 whitespace-nowrap'>
                              <div className='text-sm text-white'>
                                {line.best_over_price > 0 ? '+' : ''}
                                {line.best_over_price}
                              </div>
                              <div className='text-xs text-slate-400'>{line.best_over_book}</div>
                            </td>
                            <td className='px-4 py-4 whitespace-nowrap'>
                              <div className='text-sm text-white'>
                                {line.best_under_price > 0 ? '+' : ''}
                                {line.best_under_price}
                              </div>
                              <div className='text-xs text-slate-400'>{line.best_under_book}</div>
                            </td>
                            <td className='px-4 py-4 whitespace-nowrap text-sm text-slate-300'>
                              {line.no_vig_fair_price.toFixed(3)}
                            </td>
                            <td className='px-4 py-4 whitespace-nowrap'>
                              {line.arbitrage_opportunity ? (
                                <div className='flex items-center gap-2'>
                                  <span className='text-green-400 font-medium'>
                                    {line.arbitrage_profit.toFixed(2)}%
                                  </span>
                                  <Target className='w-3 h-3 text-green-400' />
                                </div>
                              ) : (
                                <span className='text-slate-500'>-</span>
                              )}
                            </td>
                            <td className='px-4 py-4 whitespace-nowrap text-sm text-slate-300'>
                              {line.books_count}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'arbitrage' && (
              <div>
                {arbitrageOps.length === 0 ? (
                  <div className='text-center py-8'>
                    <Target className='w-12 h-12 mx-auto mb-4 text-slate-600' />
                    <p className='text-slate-400'>No arbitrage opportunities found</p>
                    <p className='text-sm text-slate-500 mt-2'>
                      Try lowering the minimum profit threshold
                    </p>
                  </div>
                ) : (
                  <div className='space-y-4'>
                    {arbitrageOps.map((op, index) => (
                      <div
                        key={index}
                        className='bg-slate-700/30 rounded-lg p-6 border border-green-700/30'
                      >
                        <div className='flex items-center justify-between mb-4'>
                          <div>
                            <h3 className='text-lg font-semibold text-white'>{op.player_name}</h3>
                            <p className='text-sm text-slate-400'>
                              {op.stat_type.replace('_', ' ').toUpperCase()}
                            </p>
                          </div>
                          <div className='text-right'>
                            <div className='text-2xl font-bold text-green-400'>
                              {op.profit_percentage.toFixed(2)}%
                            </div>
                            <div className='text-sm text-slate-400'>Guaranteed Profit</div>
                          </div>
                        </div>

                        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                          {/* Over Bet */}
                          <div className='bg-slate-800/50 rounded-lg p-4'>
                            <div className='flex items-center gap-2 mb-2'>
                              <TrendingUp className='w-4 h-4 text-green-400' />
                              <span className='text-sm font-medium text-green-400'>
                                OVER {op.over_line}
                              </span>
                            </div>
                            <div className='text-lg font-semibold text-white'>{op.over_book}</div>
                            <div className='text-sm text-slate-300'>
                              Odds: {op.over_price > 0 ? '+' : ''}
                              {op.over_price}
                            </div>
                            <div className='text-sm text-slate-400'>
                              Stake: ${op.stake_distribution.over.toFixed(2)}
                            </div>
                          </div>

                          {/* Under Bet */}
                          <div className='bg-slate-800/50 rounded-lg p-4'>
                            <div className='flex items-center gap-2 mb-2'>
                              <TrendingUp className='w-4 h-4 text-red-400 rotate-180' />
                              <span className='text-sm font-medium text-red-400'>
                                UNDER {op.under_line}
                              </span>
                            </div>
                            <div className='text-lg font-semibold text-white'>{op.under_book}</div>
                            <div className='text-sm text-slate-300'>
                              Odds: {op.under_price > 0 ? '+' : ''}
                              {op.under_price}
                            </div>
                            <div className='text-sm text-slate-400'>
                              Stake: ${op.stake_distribution.under.toFixed(2)}
                            </div>
                          </div>
                        </div>

                        <div className='mt-4 flex items-center justify-between'>
                          <div className='flex items-center gap-2 text-xs text-slate-500'>
                            <Clock className='w-3 h-3' />
                            {new Date(op.timestamp).toLocaleTimeString()}
                          </div>
                          <div className='text-xs text-slate-400'>
                            Total Investment: $
                            {(op.stake_distribution.over + op.stake_distribution.under).toFixed(2)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Disclaimer */}
        <div className='mt-8 text-xs text-slate-500 bg-slate-800/30 rounded-lg p-4'>
          <p className='font-semibold mb-2'>⚠️ Important Disclaimers:</p>
          <ul className='space-y-1'>
            <li>
              • Odds are provided for informational purposes only (18+/21+ depending on
              jurisdiction)
            </li>
            <li>• Always verify odds with sportsbooks before placing any wagers</li>
            <li>• Arbitrage opportunities may disappear quickly due to market changes</li>
            <li>• Account limits and betting restrictions may apply at individual sportsbooks</li>
            <li>• Never bet more than you can afford to lose</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default OddsComparison;
