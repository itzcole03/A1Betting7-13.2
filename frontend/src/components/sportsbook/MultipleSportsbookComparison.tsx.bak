/**
 * Multiple Sportsbook Comparison Component
 * 
 * Displays odds comparison across DraftKings, BetMGM, Caesars, and other sportsbooks
 * with arbitrage opportunity detection and best odds highlighting.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { getSportsbookService, BestOdds, ArbitrageOpportunity, SportsbookPerformance } from '../../services/enhanced/SportsbookDataService';

interface MultipleSportsbookComparisonProps {
  sport?: string;
  playerName?: string;
  className?: string;
}

interface FilterState {
  sport: string;
  playerName: string;
  betType: string;
  onlyArbitrage: boolean;
  minProfit: number;
}

export const MultipleSportsbookComparison: React.FC<MultipleSportsbookComparisonProps> = ({
  sport = 'nba',
  playerName = '',
  className = ''
}) => {
  const [bestOdds, setBestOdds] = useState<BestOdds[]>([]);
  const [arbitrageOps, setArbitrageOps] = useState<ArbitrageOpportunity[]>([]);
  const [performance, setPerformance] = useState<SportsbookPerformance | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterState>({
    sport,
    playerName,
    betType: '',
    onlyArbitrage: false,
    minProfit: 2.0
  });

  const sportsbookService = getSportsbookService();

  // Load data when filters change
  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Load best odds
      const oddsData = await sportsbookService.getBestOdds(filters.sport, {
        playerName: filters.playerName || undefined,
        betType: filters.betType || undefined,
        onlyArbitrage: filters.onlyArbitrage
      });
      setBestOdds(oddsData);

      // Load arbitrage opportunities
      const arbData = await sportsbookService.getArbitrageOpportunities(
        filters.sport, 
        filters.minProfit
      );
      setArbitrageOps(arbData);

      // Load performance metrics
      const perfData = await sportsbookService.getPerformanceMetrics();
      setPerformance(perfData);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load sportsbook data');
    } finally {
      setLoading(false);
    }
  }, [filters, sportsbookService]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Update filters
  const updateFilter = (key: keyof FilterState, value: string | boolean | number) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  // Format odds for display
  const formatOdds = (odds: number): string => {
    return odds > 0 ? `+${odds}` : odds.toString();
  };

  // Calculate profit for arbitrage
  const calculateArbitrageProfit = (overOdds: number, underOdds: number, stake: number = 100): number => {
    const result = sportsbookService.calculateArbitrageBets(overOdds, underOdds, stake);
    return result.guaranteedProfit;
  };

  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-md ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Multiple Sportsbook Comparison
        </h2>
        
        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sport</label>
            <select 
              value={filters.sport} 
              onChange={(e) => updateFilter('sport', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="nba">NBA</option>
              <option value="nfl">NFL</option>
              <option value="mlb">MLB</option>
              <option value="nhl">NHL</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Player</label>
            <input
              type="text"
              value={filters.playerName}
              onChange={(e) => updateFilter('playerName', e.target.value)}
              placeholder="Player name..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Bet Type</label>
            <select 
              value={filters.betType} 
              onChange={(e) => updateFilter('betType', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Types</option>
              <option value="points">Points</option>
              <option value="rebounds">Rebounds</option>
              <option value="assists">Assists</option>
              <option value="threes_made">3-Pointers</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Min Profit %</label>
            <input
              type="number"
              value={filters.minProfit}
              onChange={(e) => updateFilter('minProfit', parseFloat(e.target.value) || 0)}
              min="0"
              step="0.5"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div className="flex items-end">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={filters.onlyArbitrage}
                onChange={(e) => updateFilter('onlyArbitrage', e.target.checked)}
                className="mr-2"
              />
              <span className="text-sm text-gray-700">Arbitrage Only</span>
            </label>
          </div>
          
          <div className="flex items-end">
            <button
              onClick={loadData}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mx-6 mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Performance Metrics */}
      {performance && (
        <div className="p-6 border-b border-gray-200 bg-gray-50">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Sportsbook Status</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{performance.summary.healthyProviders}</div>
              <div className="text-sm text-gray-600">Healthy Providers</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {(performance.summary.avgReliability * 100).toFixed(1)}%
              </div>
              <div className="text-sm text-gray-600">Avg Reliability</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{arbitrageOps.length}</div>
              <div className="text-sm text-gray-600">Arbitrage Ops</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{bestOdds.length}</div>
              <div className="text-sm text-gray-600">Props Available</div>
            </div>
          </div>
        </div>
      )}

      {/* Arbitrage Opportunities */}
      {arbitrageOps.length > 0 && (
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            🚨 Arbitrage Opportunities
            <span className="ml-2 px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
              {arbitrageOps.length}
            </span>
          </h3>
          
          <div className="space-y-3">
            {arbitrageOps.slice(0, 5).map((arb, index) => (
              <div key={index} className="p-4 border border-red-200 rounded-lg bg-red-50">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-semibold text-gray-900">
                      {arb.playerName} - {arb.betType} {arb.line}
                    </h4>
                    <div className="text-sm text-gray-600 mt-1">
                      <span className="inline-block mr-4">
                        Over: {formatOdds(arb.overOdds)} @ {arb.overProvider}
                      </span>
                      <span className="inline-block">
                        Under: {formatOdds(arb.underOdds)} @ {arb.underProvider}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-green-600">
                      {arb.guaranteedProfitPercentage.toFixed(2)}% Profit
                    </div>
                    <div className="text-sm text-gray-600">
                      {arb.confidenceLevel} confidence
                    </div>
                  </div>
                </div>
                
                <div className="mt-3 text-sm text-gray-700">
                  Stake: {arb.overStakePercentage.toFixed(1)}% over, {arb.underStakePercentage.toFixed(1)}% under
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Best Odds Comparison */}
      <div className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Best Odds Comparison</h3>
        
        {bestOdds.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No odds data available. Try adjusting your filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full table-auto">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Player</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Bet Type</th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-gray-900">Line</th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-gray-900">Best Over</th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-gray-900">Best Under</th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-gray-900">Books</th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-gray-900">Arbitrage</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {bestOdds.slice(0, 20).map((odds, index) => (
                  <tr key={index} className={odds.arbitrageOpportunity ? 'bg-green-50' : 'hover:bg-gray-50'}>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {odds.playerName}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 capitalize">
                      {odds.betType.replace('_', ' ')}
                    </td>
                    <td className="px-4 py-3 text-sm text-center font-mono">
                      {odds.line}
                    </td>
                    <td className="px-4 py-3 text-sm text-center">
                      <div className="font-mono font-semibold text-green-600">
                        {formatOdds(odds.bestOverOdds)}
                      </div>
                      <div className="text-xs text-gray-500 capitalize">
                        {odds.bestOverProvider}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-center">
                      <div className="font-mono font-semibold text-red-600">
                        {formatOdds(odds.bestUnderOdds)}
                      </div>
                      <div className="text-xs text-gray-500 capitalize">
                        {odds.bestUnderProvider}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-center">
                      <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs">
                        {odds.totalBooks}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-center">
                      {odds.arbitrageOpportunity ? (
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-semibold">
                          {odds.arbitrageProfit.toFixed(2)}%
                        </span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 text-xs text-gray-500">
        Data from DraftKings, BetMGM, Caesars • Updated in real-time • 
        {bestOdds.length > 0 && ` Showing ${Math.min(20, bestOdds.length)} of ${bestOdds.length} props`}
      </div>
    </div>
  );
};

export default MultipleSportsbookComparison;
