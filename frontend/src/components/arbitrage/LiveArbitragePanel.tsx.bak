import React, { useState, useEffect, useCallback } from 'react';
import { 
  RefreshCw, TrendingUp, AlertTriangle, DollarSign, 
  Target, Zap, ArrowUp, BarChart3, Globe
} from 'lucide-react';

interface LiveArbitrageOpportunity {
  id: string;
  type: string;
  event_id: string;
  market_type: string;
  outcomes: Record<string, {
    book: string;
    odds: number;
    stake: number;
  }>;
  guaranteed_profit: number;
  profit_percentage: number;
  total_stake_required: number;
  execution_time_window: number;
  confidence_score: number;
  detection_timestamp: string;
  books_involved: string[];
  risk_factors: {
    execution_risk: string;
    liquidity_risk: string;
    timing_risk: string;
  };
}

interface LiveArbitragePanelProps {
  selectedSport?: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

const LiveArbitragePanel: React.FC<LiveArbitragePanelProps> = ({
  selectedSport = 'NBA',
  autoRefresh = true,
  refreshInterval = 30000 // 30 seconds
}) => {
  const [opportunities, setOpportunities] = useState<LiveArbitrageOpportunity[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [stats, setStats] = useState({
    total: 0,
    avgProfit: 0,
    bestProfit: 0,
    totalValue: 0
  });

  const fetchArbitrageOpportunities = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/arbitrage/live?sport=${selectedSport}`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.success && data.arbitrage_opportunities) {
        setOpportunities(data.arbitrage_opportunities);
        
        // Calculate stats
        const total = data.arbitrage_opportunities.length;
        const profits = data.arbitrage_opportunities.map((opp: LiveArbitrageOpportunity) => opp.profit_percentage);
        const avgProfit = profits.length > 0 ? profits.reduce((a: number, b: number) => a + b, 0) / profits.length : 0;
        const bestProfit = profits.length > 0 ? Math.max(...profits) : 0;
        const totalValue = data.arbitrage_opportunities.reduce((sum: number, opp: LiveArbitrageOpportunity) => 
          sum + opp.guaranteed_profit, 0);

        setStats({
          total,
          avgProfit,
          bestProfit,
          totalValue
        });
        
        setLastUpdated(new Date());
      } else {
        throw new Error(data.error || 'Unknown error occurred');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch arbitrage opportunities');
      // Error logged for debugging
    } finally {
      setLoading(false);
    }
  }, [selectedSport]);

  // Auto-refresh effect
  useEffect(() => {
    fetchArbitrageOpportunities();

    if (autoRefresh) {
      const interval = setInterval(fetchArbitrageOpportunities, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [fetchArbitrageOpportunities, autoRefresh, refreshInterval]);

  const formatTime = (timestamp: string): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    return `${Math.floor(diffMins / 60)}h ${diffMins % 60}m ago`;
  };

  const getRiskColor = (risk: string): string => {
    switch (risk.toLowerCase()) {
      case 'low': return 'text-green-400';
      case 'medium': return 'text-yellow-400';
      case 'high': return 'text-red-400';
      case 'very_high': return 'text-red-600';
      default: return 'text-gray-400';
    }
  };

  const getProfitColor = (profit: number): string => {
    if (profit >= 5) return 'text-green-400';
    if (profit >= 2) return 'text-blue-400';
    if (profit >= 0) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <div className="bg-gray-900 rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-r from-green-500 to-blue-500 rounded-lg">
            <TrendingUp className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Live Arbitrage Opportunities</h2>
            <p className="text-gray-400 text-sm">Real-time cross-book arbitrage detection</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="text-right">
            {lastUpdated && (
              <div className="text-xs text-gray-400">
                Last updated: {lastUpdated.toLocaleTimeString()}
              </div>
            )}
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${error ? 'bg-red-500' : loading ? 'bg-yellow-500' : 'bg-green-500'}`} />
              <span className="text-xs text-gray-400">
                {error ? 'Error' : loading ? 'Updating...' : 'Live'}
              </span>
            </div>
          </div>
          
          <button
            onClick={fetchArbitrageOpportunities}
            disabled={loading}
            className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-5 h-5 text-white ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-800 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-blue-400" />
            <span className="text-gray-400 text-sm">Total</span>
          </div>
          <div className="text-2xl font-bold text-white">{stats.total}</div>
        </div>
        
        <div className="bg-gray-800 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-green-400" />
            <span className="text-gray-400 text-sm">Avg Profit</span>
          </div>
          <div className="text-2xl font-bold text-green-400">{stats.avgProfit.toFixed(1)}%</div>
        </div>
        
        <div className="bg-gray-800 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <ArrowUp className="w-4 h-4 text-blue-400" />
            <span className="text-gray-400 text-sm">Best</span>
          </div>
          <div className="text-2xl font-bold text-blue-400">{stats.bestProfit.toFixed(1)}%</div>
        </div>
        
        <div className="bg-gray-800 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-yellow-400" />
            <span className="text-gray-400 text-sm">Value</span>
          </div>
          <div className="text-2xl font-bold text-yellow-400">${stats.totalValue.toFixed(0)}</div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-900/50 border border-red-700 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-400" />
            <span className="text-red-400 font-medium">Error Loading Opportunities</span>
          </div>
          <p className="text-red-300 text-sm mt-1">{error}</p>
        </div>
      )}

      {/* Opportunities List */}
      <div className="space-y-4">
        {opportunities.length === 0 && !loading && !error && (
          <div className="text-center py-8">
            <Target className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">No arbitrage opportunities found for {selectedSport}</p>
            <p className="text-gray-500 text-sm">Try refreshing or selecting a different sport</p>
          </div>
        )}

        {opportunities.map((opp) => (
          <div key={opp.id} className="bg-gray-800 rounded-lg p-4 border border-gray-700 hover:border-gray-600 transition-colors">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${
                  opp.profit_percentage >= 5 ? 'bg-green-600' : 
                  opp.profit_percentage >= 2 ? 'bg-blue-600' : 'bg-yellow-600'
                }`}>
                  <Zap className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="font-medium text-white">{opp.type.replace('_', ' ').toUpperCase()}</h3>
                  <p className="text-gray-400 text-sm">{opp.market_type} • Event {opp.event_id}</p>
                </div>
              </div>
              
              <div className="text-right">
                <div className={`text-lg font-bold ${getProfitColor(opp.profit_percentage)}`}>
                  +{opp.profit_percentage.toFixed(2)}%
                </div>
                <div className="text-gray-400 text-sm">
                  ${opp.guaranteed_profit.toFixed(2)} profit
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Outcomes */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-300">Bets Required</h4>
                {Object.entries(opp.outcomes).map(([outcome, details]) => (
                  <div key={outcome} className="bg-gray-700 rounded p-2 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">{outcome}</span>
                      <span className="text-white font-medium">${details.stake.toFixed(0)}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs mt-1">
                      <span className="text-gray-400">{details.book}</span>
                      <span className="text-blue-400">{details.odds > 0 ? '+' : ''}{details.odds}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Risk Factors */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-300">Risk Assessment</h4>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Execution</span>
                    <span className={getRiskColor(opp.risk_factors.execution_risk)}>
                      {opp.risk_factors.execution_risk}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Liquidity</span>
                    <span className={getRiskColor(opp.risk_factors.liquidity_risk)}>
                      {opp.risk_factors.liquidity_risk}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Timing</span>
                    <span className={getRiskColor(opp.risk_factors.timing_risk)}>
                      {opp.risk_factors.timing_risk}
                    </span>
                  </div>
                </div>
              </div>

              {/* Details */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-300">Details</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Total Stake</span>
                    <span className="text-white">${opp.total_stake_required.toFixed(0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Time Window</span>
                    <span className="text-yellow-400">{opp.execution_time_window}s</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Confidence</span>
                    <span className="text-blue-400">{(opp.confidence_score * 100).toFixed(0)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Detected</span>
                    <span className="text-gray-400">{formatTime(opp.detection_timestamp)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Books Involved */}
            <div className="mt-3 pt-3 border-t border-gray-700">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-gray-400" />
                <span className="text-gray-400 text-sm">Books:</span>
                <div className="flex gap-2">
                  {opp.books_involved.map((book, index) => (
                    <span key={index} className="bg-gray-700 text-gray-300 px-2 py-1 rounded text-xs">
                      {book}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Loading State */}
      {loading && opportunities.length === 0 && (
        <div className="text-center py-8">
          <RefreshCw className="w-8 h-8 text-blue-400 mx-auto mb-4 animate-spin" />
          <p className="text-gray-400">Loading live arbitrage opportunities...</p>
        </div>
      )}
    </div>
  );
};

export default LiveArbitragePanel;