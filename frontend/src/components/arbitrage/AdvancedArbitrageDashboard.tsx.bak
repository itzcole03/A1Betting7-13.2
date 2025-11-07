import React, { useState, useEffect, useCallback } from 'react';
import { 
  Search, Filter, RefreshCw, TrendingUp, AlertTriangle, 
  DollarSign, Clock, Shield, BarChart3, Target, Zap,
  ArrowUp, ArrowDown, Eye, Calculator, Globe, Star
} from 'lucide-react';

interface SportsbookOdds {
  sportsbook: string;
  game_id: string;
  market_type: string;
  selection: string;
  odds_american: number;
  odds_decimal: number;
  line?: number;
  timestamp: string;
  volume: number;
  max_bet: number;
  reliability_score: number;
}

interface ArbitrageOpportunity {
  opportunity_id: string;
  sport: string;
  game_id: string;
  game_description: string;
  arbitrage_type: string;
  total_return: number;
  profit_percentage: number;
  guaranteed_profit: number;
  required_stakes: Record<string, number>;
  sportsbooks_involved: string[];
  odds_combinations: SportsbookOdds[];
  risk_level: string;
  time_window_minutes: number;
  confidence_score: number;
  execution_complexity: number;
  market_efficiency: number;
  expected_hold_hours: number;
  status: string;
  created_at: string;
  expires_at: string;
  reasoning: string;
  metadata: Record<string, any>;
}

interface ArbitragePortfolio {
  total_opportunities: number;
  active_opportunities: number;
  total_expected_profit: number;
  average_return: number;
  risk_distribution: Record<string, number>;
  sportsbook_distribution: Record<string, number>;
  success_rate: number;
  updated_at: string;
}

interface ArbitrageStats {
  total_opportunities_found: number;
  active_opportunities: number;
  average_profit_percentage: number;
  max_profit_percentage: number;
  total_guaranteed_profit: number;
  arbitrage_type_distribution: Record<string, number>;
  risk_level_distribution: Record<string, number>;
  sportsbook_involvement: Record<string, number>;
  average_confidence_score: number;
  last_scan_time: string;
}

const AdvancedArbitrageDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('scanner');
  const [opportunities, setOpportunities] = useState<Record<string, ArbitrageOpportunity[]>>({});
  const [portfolio, setPortfolio] = useState<ArbitragePortfolio | null>(null);
  const [stats, setStats] = useState<ArbitrageStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [filters, setFilters] = useState({
    sport: '',
    minProfit: 0.5,
    maxRiskLevel: 'high',
    sportsbooks: '',
    status: 'active'
  });
  const [selectedOpportunity, setSelectedOpportunity] = useState<ArbitrageOpportunity | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchArbitrageData = useCallback(async () => {
    setIsLoading(true);
    try {
      // Fetch opportunities
      const scanResponse = await fetch('/api/advanced-arbitrage/scan?' + new URLSearchParams({
        min_profit_percentage: filters.minProfit.toString(),
        max_risk_level: filters.maxRiskLevel,
        ...(filters.sport && { sports: filters.sport }),
        ...(filters.sportsbooks && { sportsbooks: filters.sportsbooks })
      }));
      
      if (scanResponse.ok) {
        const scanData = await scanResponse.json();
        setOpportunities(scanData);
      }

      // Fetch portfolio
      const portfolioResponse = await fetch('/api/advanced-arbitrage/portfolio');
      if (portfolioResponse.ok) {
        const portfolioData = await portfolioResponse.json();
        setPortfolio(portfolioData);
      }

      // Fetch stats
      const statsResponse = await fetch('/api/advanced-arbitrage/stats');
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData);
      }
    } catch (error) {
      console.error('Error fetching arbitrage data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchArbitrageData();
  }, [fetchArbitrageData]);

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(fetchArbitrageData, 30000); // Refresh every 30 seconds
      return () => clearInterval(interval);
    }
  }, [autoRefresh, fetchArbitrageData]);

  const handleRefresh = async () => {
    setIsLoading(true);
    try {
      await fetch('/api/advanced-arbitrage/refresh', { method: 'POST' });
      setTimeout(fetchArbitrageData, 2000); // Give it time to process
    } catch (error) {
      console.error('Error refreshing arbitrage data:', error);
    }
  };

  const analyzeOpportunity = async (opportunityId: string, stakeAmount: number = 1000) => {
    try {
      const response = await fetch('/api/advanced-arbitrage/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ opportunity_id: opportunityId, stake_amount: stakeAmount })
      });
      
      if (response.ok) {
        const analysis = await response.json();
        console.log('Arbitrage Analysis:', analysis);
        // You could show this in a modal or detailed view
      }
    } catch (error) {
      console.error('Error analyzing opportunity:', error);
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk.toLowerCase()) {
      case 'low': return 'text-green-600 bg-green-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'extreme': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getArbitrageTypeIcon = (type: string) => {
    switch (type) {
      case 'two_way': return <Target className="w-4 h-4" />;
      case 'three_way': return <BarChart3 className="w-4 h-4" />;
      case 'cross_market': return <Globe className="w-4 h-4" />;
      case 'sure_bet': return <Star className="w-4 h-4" />;
      default: return <Zap className="w-4 h-4" />;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatPercentage = (percentage: number) => {
    return `${percentage.toFixed(2)}%`;
  };

  const formatOdds = (american: number) => {
    return american > 0 ? `+${american}` : american.toString();
  };

  // Scanner Tab Content
  const ScannerTab = () => (
    <div className="space-y-6">
      {/* Control Panel */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Arbitrage Scanner</h3>
          <div className="flex items-center space-x-3">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="rounded border-gray-300"
              />
              <span className="text-sm text-gray-600">Auto-refresh</span>
            </label>
            <button
              onClick={handleRefresh}
              disabled={isLoading}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sport</label>
            <select
              value={filters.sport}
              onChange={(e) => setFilters({ ...filters, sport: e.target.value })}
              className="w-full rounded-lg border-gray-300 shadow-sm"
            >
              <option value="">All Sports</option>
              <option value="nfl">NFL</option>
              <option value="nba">NBA</option>
              <option value="mlb">MLB</option>
              <option value="nhl">NHL</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Min Profit %</label>
            <input
              type="number"
              step="0.1"
              value={filters.minProfit}
              onChange={(e) => setFilters({ ...filters, minProfit: parseFloat(e.target.value) })}
              className="w-full rounded-lg border-gray-300 shadow-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Max Risk</label>
            <select
              value={filters.maxRiskLevel}
              onChange={(e) => setFilters({ ...filters, maxRiskLevel: e.target.value })}
              className="w-full rounded-lg border-gray-300 shadow-sm"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="extreme">Extreme</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sportsbooks</label>
            <input
              type="text"
              placeholder="e.g., draftkings,fanduel"
              value={filters.sportsbooks}
              onChange={(e) => setFilters({ ...filters, sportsbooks: e.target.value })}
              className="w-full rounded-lg border-gray-300 shadow-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="w-full rounded-lg border-gray-300 shadow-sm"
            >
              <option value="active">Active</option>
              <option value="expired">Expired</option>
              <option value="executed">Executed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Opportunities by Type */}
      {Object.entries(opportunities).map(([category, opps]) => (
        <div key={category} className="bg-white rounded-lg shadow-sm border">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 capitalize flex items-center space-x-2">
                {getArbitrageTypeIcon(category)}
                <span>{category.replace('_', ' ')} Arbitrage</span>
              </h3>
              <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                {opps.length} opportunities
              </span>
            </div>
          </div>
          
          <div className="divide-y divide-gray-200">
            {opps.slice(0, 10).map((opp) => (
              <div key={opp.opportunity_id} className="p-6 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <h4 className="font-medium text-gray-900">{opp.game_description}</h4>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRiskColor(opp.risk_level)}`}>
                        {opp.risk_level}
                      </span>
                      <span className="text-sm text-gray-600 uppercase">{opp.sport}</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{opp.reasoning}</p>
                    
                    <div className="flex items-center space-x-6 mt-3">
                      <div className="flex items-center space-x-1">
                        <DollarSign className="w-4 h-4 text-green-600" />
                        <span className="text-sm text-gray-600">Profit:</span>
                        <span className="font-medium text-green-600">{formatCurrency(opp.guaranteed_profit)}</span>
                      </div>
                      
                      <div className="flex items-center space-x-1">
                        <TrendingUp className="w-4 h-4 text-blue-600" />
                        <span className="text-sm text-gray-600">Return:</span>
                        <span className="font-medium text-blue-600">{formatPercentage(opp.profit_percentage)}</span>
                      </div>
                      
                      <div className="flex items-center space-x-1">
                        <Clock className="w-4 h-4 text-orange-600" />
                        <span className="text-sm text-gray-600">Window:</span>
                        <span className="font-medium text-orange-600">{opp.time_window_minutes}m</span>
                      </div>
                      
                      <div className="flex items-center space-x-1">
                        <Shield className="w-4 h-4 text-purple-600" />
                        <span className="text-sm text-gray-600">Confidence:</span>
                        <span className="font-medium text-purple-600">{formatPercentage(opp.confidence_score * 100)}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 mt-3">
                      <span className="text-sm text-gray-600">Sportsbooks:</span>
                      {opp.sportsbooks_involved.map((sb, index) => (
                        <span key={index} className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-xs">
                          {sb}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setSelectedOpportunity(opp)}
                      className="flex items-center space-x-1 px-3 py-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                    >
                      <Eye className="w-4 h-4" />
                      <span>View</span>
                    </button>
                    <button
                      onClick={() => analyzeOpportunity(opp.opportunity_id)}
                      className="flex items-center space-x-1 px-3 py-2 text-green-600 hover:bg-green-50 rounded-lg"
                    >
                      <Calculator className="w-4 h-4" />
                      <span>Analyze</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );

  // Portfolio Tab Content
  const PortfolioTab = () => (
    <div className="space-y-6">
      {portfolio && (
        <>
          {/* Portfolio Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Opportunities</p>
                  <p className="text-2xl font-bold text-gray-900">{portfolio.total_opportunities}</p>
                </div>
                <Target className="w-8 h-8 text-blue-600" />
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Active Opportunities</p>
                  <p className="text-2xl font-bold text-green-600">{portfolio.active_opportunities}</p>
                </div>
                <Zap className="w-8 h-8 text-green-600" />
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Expected Profit</p>
                  <p className="text-2xl font-bold text-purple-600">{formatCurrency(portfolio.total_expected_profit)}</p>
                </div>
                <DollarSign className="w-8 h-8 text-purple-600" />
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Success Rate</p>
                  <p className="text-2xl font-bold text-orange-600">{formatPercentage(portfolio.success_rate * 100)}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-orange-600" />
              </div>
            </div>
          </div>

          {/* Risk Distribution */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Risk Distribution</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(portfolio.risk_distribution).map(([risk, count]) => (
                <div key={risk} className="text-center">
                  <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center ${getRiskColor(risk)}`}>
                    <span className="text-lg font-bold">{count}</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-2 capitalize">{risk} Risk</p>
                </div>
              ))}
            </div>
          </div>

          {/* Sportsbook Distribution */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Sportsbook Involvement</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(portfolio.sportsbook_distribution)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 8)
                .map(([sportsbook, count]) => (
                <div key={sportsbook} className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-900 capitalize">{sportsbook}</span>
                    <span className="text-sm text-gray-600">{count}</span>
                  </div>
                  <div className="mt-2 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${(count / Math.max(...Object.values(portfolio.sportsbook_distribution))) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );

  // Analytics Tab Content
  const AnalyticsTab = () => (
    <div className="space-y-6">
      {stats && (
        <>
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Metrics</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Average Profit</span>
                  <span className="font-medium">{formatPercentage(stats.average_profit_percentage)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Max Profit</span>
                  <span className="font-medium text-green-600">{formatPercentage(stats.max_profit_percentage)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Avg Confidence</span>
                  <span className="font-medium">{formatPercentage(stats.average_confidence_score * 100)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Total Profit</span>
                  <span className="font-medium text-purple-600">{formatCurrency(stats.total_guaranteed_profit)}</span>
                </div>
              </div>
            </div>

            {/* Arbitrage Type Distribution */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Arbitrage Types</h3>
              <div className="space-y-3">
                {Object.entries(stats.arbitrage_type_distribution).map(([type, count]) => (
                  <div key={type} className="flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                      {getArbitrageTypeIcon(type)}
                      <span className="text-sm text-gray-600 capitalize">{type.replace('_', ' ')}</span>
                    </div>
                    <span className="font-medium">{count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Risk Level Distribution */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Risk Levels</h3>
              <div className="space-y-3">
                {Object.entries(stats.risk_level_distribution).map(([risk, count]) => (
                  <div key={risk} className="flex justify-between items-center">
                    <span className={`text-sm px-2 py-1 rounded-full ${getRiskColor(risk)} capitalize`}>
                      {risk}
                    </span>
                    <span className="font-medium">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sportsbook Performance */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Sportsbook Performance</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(stats.sportsbook_involvement)
                .sort(([,a], [,b]) => b - a)
                .map(([sportsbook, involvement]) => (
                <div key={sportsbook} className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-900 capitalize">{sportsbook}</span>
                    <span className="text-sm text-gray-600">{involvement} opps</span>
                  </div>
                  <div className="bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full"
                      style={{ width: `${(involvement / Math.max(...Object.values(stats.sportsbook_involvement))) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Advanced Arbitrage Detection</h1>
        <p className="text-gray-600">Sophisticated arbitrage opportunity detection across 15+ sportsbooks</p>
      </div>

      {/* Navigation Tabs */}
      <div className="mb-6">
        <nav className="flex space-x-8">
          {[
            { id: 'scanner', label: 'Scanner', icon: Search },
            { id: 'portfolio', label: 'Portfolio', icon: BarChart3 },
            { id: 'analytics', label: 'Analytics', icon: TrendingUp }
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="text-center py-12">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Scanning for arbitrage opportunities...</p>
        </div>
      )}

      {/* Tab Content */}
      {!isLoading && (
        <>
          {activeTab === 'scanner' && <ScannerTab />}
          {activeTab === 'portfolio' && <PortfolioTab />}
          {activeTab === 'analytics' && <AnalyticsTab />}
        </>
      )}

      {/* Opportunity Detail Modal */}
      {selectedOpportunity && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Arbitrage Opportunity Details</h2>
                <button
                  onClick={() => setSelectedOpportunity(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Opportunity Info</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Game:</span>
                      <span className="font-medium">{selectedOpportunity.game_description}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Type:</span>
                      <span className="font-medium capitalize">{selectedOpportunity.arbitrage_type.replace('_', ' ')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Profit:</span>
                      <span className="font-medium text-green-600">{formatCurrency(selectedOpportunity.guaranteed_profit)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Return:</span>
                      <span className="font-medium">{formatPercentage(selectedOpportunity.profit_percentage)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Risk Level:</span>
                      <span className={`px-2 py-1 rounded-full text-xs ${getRiskColor(selectedOpportunity.risk_level)}`}>
                        {selectedOpportunity.risk_level}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Required Stakes</h3>
                  <div className="space-y-2">
                    {Object.entries(selectedOpportunity.required_stakes).map(([sportsbook, stake]) => (
                      <div key={sportsbook} className="flex justify-between text-sm">
                        <span className="text-gray-600 capitalize">{sportsbook}:</span>
                        <span className="font-medium">{formatCurrency(stake)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="mt-6">
                <h3 className="font-semibold text-gray-900 mb-3">Odds Combinations</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sportsbook</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Selection</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Odds</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Line</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reliability</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {selectedOpportunity.odds_combinations.map((odds, index) => (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">{odds.sportsbook}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">{odds.selection}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {formatOdds(odds.odds_american)} ({odds.odds_decimal.toFixed(2)})
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {odds.line ? odds.line.toString() : '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatPercentage(odds.reliability_score * 100)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvancedArbitrageDashboard;
