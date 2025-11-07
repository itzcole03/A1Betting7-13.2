/**
 * Odds Comparison Panel - Multi-sportsbook odds comparison and arbitrage detection
 * Competitive advantage feature for identifying best lines and guaranteed profit opportunities
 */

import React, { useState, useEffect, useCallback } from 'react';
import { 
  TrendingUp, 
  DollarSign, 
  AlertTriangle, 
  RefreshCw, 
  Target,
  BookOpen,
  Clock
} from 'lucide-react';

interface BookLine {
  book_name: string;
  line: number;
  over_price: number;
  under_price: number;
  timestamp: string;
}

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

interface OddsComparisonPanelProps {
  sport?: string;
  className?: string;
}

export const OddsComparisonPanel: React.FC<OddsComparisonPanelProps> = ({
  sport = 'baseball_mlb',
  className = '',
}) => {
  const [bestLines, setBestLines] = useState<CanonicalLine[]>([]);
  const [arbitrageOpps, setArbitrageOpps] = useState<ArbitrageOpportunity[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'comparison' | 'arbitrage'>('comparison');
  const [autoRefresh, setAutoRefresh] = useState(false);

  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

  const fetchOddsData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch odds comparison
      const comparisonResponse = await fetch(`${baseUrl}/v1/odds/compare?sport=${sport}&limit=20`);
      if (!comparisonResponse.ok) {
        throw new Error(`Comparison failed: ${comparisonResponse.status}`);
      }
      const comparisonData = await comparisonResponse.json();
      setBestLines(comparisonData.best_lines || []);

      // Fetch arbitrage opportunities
      const arbitrageResponse = await fetch(`${baseUrl}/v1/odds/arbitrage?sport=${sport}&min_profit=1.0&limit=10`);
      if (!arbitrageResponse.ok) {
        throw new Error(`Arbitrage failed: ${arbitrageResponse.status}`);
      }
      const arbitrageData = await arbitrageResponse.json();
      setArbitrageOpps(arbitrageData.opportunities || []);

      setLastUpdated(new Date().toLocaleTimeString());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch odds data');
      console.error('Odds fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [sport, baseUrl]);

  // Initial fetch
  useEffect(() => {
    fetchOddsData();
  }, [fetchOddsData]);

  // Auto-refresh functionality
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(fetchOddsData, 30000); // 30 seconds
    return () => clearInterval(interval);
  }, [autoRefresh, fetchOddsData]);

  const formatOdds = (americanOdds: number): string => {
    return americanOdds > 0 ? `+${americanOdds}` : americanOdds.toString();
  };

  const formatProfitPercentage = (profit: number): string => {
    return `${profit.toFixed(2)}%`;
  };

  return (
    <div className={`bg-slate-800/50 backdrop-blur rounded-lg border border-slate-700 ${className}`}>
      <div className="p-4 border-b border-slate-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Target className="w-5 h-5 text-green-400" />
            <h3 className="text-lg font-semibold text-white">Odds Intelligence</h3>
            {lastUpdated && (
              <div className="flex items-center gap-1 text-sm text-slate-400">
                <Clock className="w-3 h-3" />
                {lastUpdated}
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 text-sm text-slate-400">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="rounded"
              />
              Auto-refresh
            </label>
            <button
              onClick={fetchOddsData}
              disabled={loading}
              className="flex items-center gap-2 px-3 py-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-md transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-4 mt-3">
          <button
            onClick={() => setActiveTab('comparison')}
            className={`pb-2 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'comparison'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-300'
            }`}
          >
            Best Lines ({bestLines.length})
          </button>
          <button
            onClick={() => setActiveTab('arbitrage')}
            className={`flex items-center gap-1 pb-2 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'arbitrage'
                ? 'border-green-500 text-green-400'
                : 'border-transparent text-slate-400 hover:text-slate-300'
            }`}
          >
            <AlertTriangle className="w-3 h-3" />
            Arbitrage ({arbitrageOpps.length})
          </button>
        </div>
      </div>

      <div className="p-4">
        {error && (
          <div className="mb-4 p-3 bg-red-900/50 border border-red-700 rounded-md">
            <div className="flex items-center gap-2 text-red-300">
              <AlertTriangle className="w-4 h-4" />
              <span className="text-sm">{error}</span>
            </div>
          </div>
        )}

        {loading && (
          <div className="text-center py-8">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-400" />
            <p className="text-slate-400">Loading odds data...</p>
          </div>
        )}

        {!loading && activeTab === 'comparison' && (
          <div className="space-y-4">
            <div className="text-sm text-slate-400 mb-4">
              Best available lines across all sportsbooks. Green indicates arbitrage opportunities.
            </div>
            
            {bestLines.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No odds data available</p>
                <p className="text-sm">Check API configuration or try refreshing</p>
              </div>
            ) : (
              bestLines.map((line, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg border ${
                    line.arbitrage_opportunity
                      ? 'bg-green-900/20 border-green-600'
                      : 'bg-slate-700/50 border-slate-600'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h4 className="font-medium text-white">{line.player_name}</h4>
                      <p className="text-sm text-slate-400">{line.stat_type} • {line.market}</p>
                    </div>
                    {line.arbitrage_opportunity && (
                      <div className="flex items-center gap-1 text-green-400">
                        <TrendingUp className="w-4 h-4" />
                        <span className="text-sm font-medium">
                          {formatProfitPercentage(line.arbitrage_profit)} profit
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-800/50 rounded p-3">
                      <div className="text-xs text-slate-400 mb-1">Best Over</div>
                      <div className="text-white font-medium">{line.best_over_book}</div>
                      <div className="text-sm text-blue-400">
                        O{line.best_over_line} ({formatOdds(line.best_over_price)})
                      </div>
                    </div>
                    <div className="bg-slate-800/50 rounded p-3">
                      <div className="text-xs text-slate-400 mb-1">Best Under</div>
                      <div className="text-white font-medium">{line.best_under_book}</div>
                      <div className="text-sm text-red-400">
                        U{line.best_under_line} ({formatOdds(line.best_under_price)})
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-2 text-xs text-slate-500">
                    Fair Price: {(line.no_vig_fair_price * 100).toFixed(1)}% • {line.books_count} books
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {!loading && activeTab === 'arbitrage' && (
          <div className="space-y-4">
            <div className="text-sm text-slate-400 mb-4">
              Guaranteed profit opportunities across different sportsbooks. Stakes shown for $100 total bet.
            </div>
            
            {arbitrageOpps.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                <DollarSign className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No arbitrage opportunities found</p>
                <p className="text-sm">Try lowering the minimum profit threshold</p>
              </div>
            ) : (
              arbitrageOpps.map((opp, index) => (
                <div key={index} className="p-4 bg-green-900/20 border border-green-600 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="font-medium text-white">{opp.player_name}</h4>
                      <p className="text-sm text-slate-400">{opp.stat_type} • {opp.market}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-green-400 font-bold">
                        {formatProfitPercentage(opp.profit_percentage)}
                      </div>
                      <div className="text-xs text-green-300">Guaranteed Profit</div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mb-3">
                    <div className="bg-slate-800/50 rounded p-3">
                      <div className="text-xs text-slate-400 mb-1">Bet Over</div>
                      <div className="text-white font-medium">{opp.over_book}</div>
                      <div className="text-sm text-blue-400">
                        O{opp.over_line} ({formatOdds(opp.over_price)})
                      </div>
                      <div className="text-xs text-green-300 mt-1">
                        Stake: ${opp.stake_distribution.over}
                      </div>
                    </div>
                    <div className="bg-slate-800/50 rounded p-3">
                      <div className="text-xs text-slate-400 mb-1">Bet Under</div>
                      <div className="text-white font-medium">{opp.under_book}</div>
                      <div className="text-sm text-red-400">
                        U{opp.under_line} ({formatOdds(opp.under_price)})
                      </div>
                      <div className="text-xs text-green-300 mt-1">
                        Stake: ${opp.stake_distribution.under}
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-xs text-slate-500 border-t border-slate-600 pt-2">
                    ⚠️ Arbitrage betting may violate sportsbook terms • Always verify odds before placing bets
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        <div className="mt-6 text-xs text-slate-500 border-t border-slate-700 pt-3">
          <p>🔄 Odds update every 30 seconds when auto-refresh is enabled</p>
          <p>⚠️ Always verify odds at sportsbook before placing bets • For research purposes only (18+/21+)</p>
        </div>
      </div>
    </div>
  );
};

export default OddsComparisonPanel;
