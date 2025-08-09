import React, { useState, useEffect, useCallback } from 'react';
import { 
  Calculator, TrendingUp, Shield, AlertTriangle, DollarSign, 
  BarChart3, Target, Settings, RefreshCw, PieChart, LineChart,
  ArrowUp, ArrowDown, Eye, Play, Pause, Zap, CheckCircle
} from 'lucide-react';

interface BettingOpportunity {
  opportunity_id: string;
  description: string;
  sport: string;
  market_type: string;
  offered_odds: number;
  true_probability: number;
  confidence_interval_low: number;
  confidence_interval_high: number;
  max_bet_limit: number;
  sportsbook: string;
  expires_in_hours: number;
  metadata?: Record<string, any>;
}

interface KellyResult {
  opportunity_id: string;
  classic_kelly_fraction: number;
  recommended_fraction: number;
  recommended_bet_size: number;
  expected_value: number;
  expected_growth_rate: number;
  risk_of_ruin: number;
  bankroll_percentage: number;
  confidence_score: number;
  risk_warnings: string[];
  variant_used: string;
  calculation_metadata: Record<string, any>;
}

interface PortfolioMetrics {
  total_bankroll: number;
  allocated_capital: number;
  available_capital: number;
  expected_return: number;
  portfolio_variance: number;
  sharpe_ratio: number;
  max_drawdown: number;
  kelly_leverage: number;
  correlation_risk: number;
  diversification_score: number;
  risk_adjusted_kelly: number;
}

interface RiskManagement {
  current_settings: Record<string, any>;
  portfolio_status: Record<string, any>;
  risk_alerts: string[];
}

const AdvancedKellyDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('calculator');
  const [kellyResults, setKellyResults] = useState<Record<string, KellyResult>>({});
  const [portfolioMetrics, setPortfolioMetrics] = useState<PortfolioMetrics | null>(null);
  const [riskManagement, setRiskManagement] = useState<RiskManagement | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [simulationResults, setSimulationResults] = useState<any>(null);
  
  // Single bet calculator state
  const [singleBet, setSingleBet] = useState<BettingOpportunity>({
    opportunity_id: `single_bet_${Date.now()}`,
    description: 'Single Bet Calculation',
    sport: 'nfl',
    market_type: 'moneyline',
    offered_odds: 2.0,
    true_probability: 0.55,
    confidence_interval_low: 0.5,
    confidence_interval_high: 0.6,
    max_bet_limit: 10000,
    sportsbook: 'draftkings',
    expires_in_hours: 24
  });
  
  // Portfolio calculator state
  const [portfolioOpportunities, setPortfolioOpportunities] = useState<BettingOpportunity[]>([]);
  const [kellyVariant, setKellyVariant] = useState('adaptive');
  
  // Risk management state
  const [riskSettings, setRiskSettings] = useState({
    max_bet_percentage: 0.1,
    max_daily_risk: 0.25,
    max_total_exposure: 0.5,
    min_edge_threshold: 0.02,
    min_confidence_threshold: 0.7,
    kelly_fraction_cap: 0.25
  });

  const fetchPortfolioMetrics = useCallback(async () => {
    try {
      const response = await fetch('/api/advanced-kelly/portfolio-metrics');
      if (response.ok) {
        const data = await response.json();
        setPortfolioMetrics(data);
      }
    } catch (error) {
      console.error('Error fetching portfolio metrics:', error);
    }
  }, []);

  const fetchRiskManagement = useCallback(async () => {
    try {
      const response = await fetch('/api/advanced-kelly/risk-management');
      if (response.ok) {
        const data = await response.json();
        setRiskManagement(data);
      }
    } catch (error) {
      console.error('Error fetching risk management:', error);
    }
  }, []);

  useEffect(() => {
    fetchPortfolioMetrics();
    fetchRiskManagement();
  }, [fetchPortfolioMetrics, fetchRiskManagement]);

  const calculateSingleBetKelly = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/advanced-kelly/calculate?variant=${kellyVariant}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(singleBet)
      });
      
      if (response.ok) {
        const result = await response.json();
        setKellyResults({ [singleBet.opportunity_id]: result });
      }
    } catch (error) {
      console.error('Error calculating Kelly bet size:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const optimizePortfolio = async () => {
    if (portfolioOpportunities.length === 0) return;
    
    setIsLoading(true);
    try {
      const response = await fetch('/api/advanced-kelly/portfolio-optimization', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          opportunities: portfolioOpportunities,
          variant: 'portfolio'
        })
      });
      
      if (response.ok) {
        const results = await response.json();
        setKellyResults(results);
      }
    } catch (error) {
      console.error('Error optimizing portfolio:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const runSimulation = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/advanced-kelly/simulation?` + new URLSearchParams({
        probability: singleBet.true_probability.toString(),
        odds: singleBet.offered_odds.toString(),
        num_bets: '1000',
        variant: kellyVariant
      }));
      
      if (response.ok) {
        const data = await response.json();
        setSimulationResults(data);
      }
    } catch (error) {
      console.error('Error running simulation:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateRiskSettings = async () => {
    try {
      const response = await fetch('/api/advanced-kelly/risk-management/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(riskSettings)
      });
      
      if (response.ok) {
        await fetchRiskManagement();
      }
    } catch (error) {
      console.error('Error updating risk settings:', error);
    }
  };

  const addPortfolioOpportunity = () => {
    const newOpp: BettingOpportunity = {
      opportunity_id: `portfolio_bet_${Date.now()}`,
      description: `Betting Opportunity ${portfolioOpportunities.length + 1}`,
      sport: 'nfl',
      market_type: 'moneyline',
      offered_odds: 2.0,
      true_probability: 0.55,
      confidence_interval_low: 0.5,
      confidence_interval_high: 0.6,
      max_bet_limit: 5000,
      sportsbook: 'fanduel',
      expires_in_hours: 12
    };
    setPortfolioOpportunities([...portfolioOpportunities, newOpp]);
  };

  const removePortfolioOpportunity = (index: number) => {
    const updated = portfolioOpportunities.filter((_, i) => i !== index);
    setPortfolioOpportunities(updated);
  };

  const updatePortfolioOpportunity = (index: number, field: keyof BettingOpportunity, value: any) => {
    const updated = [...portfolioOpportunities];
    updated[index] = { ...updated[index], [field]: value };
    setPortfolioOpportunities(updated);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatPercentage = (percentage: number) => {
    return `${(percentage * 100).toFixed(2)}%`;
  };

  const getRiskColor = (risk: number) => {
    if (risk < 0.05) return 'text-green-600';
    if (risk < 0.15) return 'text-yellow-600';
    if (risk < 0.3) return 'text-orange-600';
    return 'text-red-600';
  };

  // Single Bet Calculator Tab
  const SingleBetCalculatorTab = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Single Bet Kelly Calculator</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Input Form */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <input
                type="text"
                value={singleBet.description}
                onChange={(e) => setSingleBet({ ...singleBet, description: e.target.value })}
                className="w-full rounded-lg border-gray-300 shadow-sm"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sport</label>
                <select
                  value={singleBet.sport}
                  onChange={(e) => setSingleBet({ ...singleBet, sport: e.target.value })}
                  className="w-full rounded-lg border-gray-300 shadow-sm"
                >
                  <option value="nfl">NFL</option>
                  <option value="nba">NBA</option>
                  <option value="mlb">MLB</option>
                  <option value="nhl">NHL</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Market Type</label>
                <select
                  value={singleBet.market_type}
                  onChange={(e) => setSingleBet({ ...singleBet, market_type: e.target.value })}
                  className="w-full rounded-lg border-gray-300 shadow-sm"
                >
                  <option value="moneyline">Moneyline</option>
                  <option value="spread">Spread</option>
                  <option value="total">Total</option>
                  <option value="prop">Prop</option>
                </select>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Offered Odds (Decimal)</label>
                <input
                  type="number"
                  step="0.01"
                  value={singleBet.offered_odds}
                  onChange={(e) => setSingleBet({ ...singleBet, offered_odds: parseFloat(e.target.value) })}
                  className="w-full rounded-lg border-gray-300 shadow-sm"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">True Probability</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="1"
                  value={singleBet.true_probability}
                  onChange={(e) => setSingleBet({ ...singleBet, true_probability: parseFloat(e.target.value) })}
                  className="w-full rounded-lg border-gray-300 shadow-sm"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confidence Low</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="1"
                  value={singleBet.confidence_interval_low}
                  onChange={(e) => setSingleBet({ ...singleBet, confidence_interval_low: parseFloat(e.target.value) })}
                  className="w-full rounded-lg border-gray-300 shadow-sm"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confidence High</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="1"
                  value={singleBet.confidence_interval_high}
                  onChange={(e) => setSingleBet({ ...singleBet, confidence_interval_high: parseFloat(e.target.value) })}
                  className="w-full rounded-lg border-gray-300 shadow-sm"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Kelly Variant</label>
              <select
                value={kellyVariant}
                onChange={(e) => setKellyVariant(e.target.value)}
                className="w-full rounded-lg border-gray-300 shadow-sm"
              >
                <option value="classic">Classic Kelly</option>
                <option value="fractional">Fractional Kelly (1/4)</option>
                <option value="adaptive">Adaptive Kelly</option>
              </select>
            </div>
            
            <button
              onClick={calculateSingleBetKelly}
              disabled={isLoading}
              className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              <Calculator className="w-4 h-4" />
              <span>{isLoading ? 'Calculating...' : 'Calculate Kelly'}</span>
            </button>
          </div>
          
          {/* Results */}
          <div className="space-y-4">
            {kellyResults[singleBet.opportunity_id] && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-3">Kelly Results</h4>
                
                {(() => {
                  const result = kellyResults[singleBet.opportunity_id];
                  return (
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Classic Kelly:</span>
                        <span className="font-medium">{formatPercentage(result.classic_kelly_fraction)}</span>
                      </div>
                      
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Recommended:</span>
                        <span className="font-medium text-blue-600">{formatPercentage(result.recommended_fraction)}</span>
                      </div>
                      
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Bet Size:</span>
                        <span className="font-medium text-green-600">{formatCurrency(result.recommended_bet_size)}</span>
                      </div>
                      
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Expected Value:</span>
                        <span className="font-medium">{formatCurrency(result.expected_value)}</span>
                      </div>
                      
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Growth Rate:</span>
                        <span className="font-medium">{formatPercentage(result.expected_growth_rate)}</span>
                      </div>
                      
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Risk of Ruin:</span>
                        <span className={`font-medium ${getRiskColor(result.risk_of_ruin)}`}>
                          {formatPercentage(result.risk_of_ruin)}
                        </span>
                      </div>
                      
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Confidence:</span>
                        <span className="font-medium">{formatPercentage(result.confidence_score)}</span>
                      </div>
                      
                      {result.risk_warnings.length > 0 && (
                        <div className="mt-4 space-y-1">
                          <span className="text-sm font-medium text-orange-600">Warnings:</span>
                          {result.risk_warnings.map((warning, index) => (
                            <div key={index} className="text-xs text-orange-600 flex items-start space-x-1">
                              <AlertTriangle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                              <span>{warning}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            )}
            
            <button
              onClick={runSimulation}
              disabled={isLoading}
              className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
            >
              <Play className="w-4 h-4" />
              <span>{isLoading ? 'Running...' : 'Run Simulation'}</span>
            </button>
          </div>
        </div>
      </div>
      
      {/* Simulation Results */}
      {simulationResults && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Simulation Results (1000 bets)</h3>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-sm text-gray-600">Final Bankroll</div>
              <div className="text-lg font-bold text-blue-600">
                {simulationResults.results.final_bankroll.toFixed(2)}x
              </div>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-sm text-gray-600">Total Return</div>
              <div className="text-lg font-bold text-green-600">
                {formatPercentage(simulationResults.results.total_return)}
              </div>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-sm text-gray-600">Max Drawdown</div>
              <div className="text-lg font-bold text-red-600">
                {formatPercentage(simulationResults.results.max_drawdown)}
              </div>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-sm text-gray-600">Growth Rate</div>
              <div className="text-lg font-bold text-purple-600">
                {formatPercentage(simulationResults.results.average_growth_rate)}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // Portfolio Optimizer Tab
  const PortfolioOptimizerTab = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Portfolio Kelly Optimization</h3>
          <button
            onClick={addPortfolioOpportunity}
            className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            <Target className="w-4 h-4" />
            <span>Add Opportunity</span>
          </button>
        </div>
        
        {portfolioOpportunities.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <PieChart className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No opportunities added yet. Add some betting opportunities to optimize your portfolio.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {portfolioOpportunities.map((opp, index) => (
              <div key={opp.opportunity_id} className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <input
                    type="text"
                    value={opp.description}
                    onChange={(e) => updatePortfolioOpportunity(index, 'description', e.target.value)}
                    className="font-medium bg-transparent border-none p-0 focus:ring-0"
                  />
                  <button
                    onClick={() => removePortfolioOpportunity(index)}
                    className="text-red-600 hover:text-red-800"
                  >
                    ×
                  </button>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Odds</label>
                    <input
                      type="number"
                      step="0.01"
                      value={opp.offered_odds}
                      onChange={(e) => updatePortfolioOpportunity(index, 'offered_odds', parseFloat(e.target.value))}
                      className="w-full text-sm rounded border-gray-300"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Probability</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="1"
                      value={opp.true_probability}
                      onChange={(e) => updatePortfolioOpportunity(index, 'true_probability', parseFloat(e.target.value))}
                      className="w-full text-sm rounded border-gray-300"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Sportsbook</label>
                    <select
                      value={opp.sportsbook}
                      onChange={(e) => updatePortfolioOpportunity(index, 'sportsbook', e.target.value)}
                      className="w-full text-sm rounded border-gray-300"
                    >
                      <option value="draftkings">DraftKings</option>
                      <option value="fanduel">FanDuel</option>
                      <option value="betmgm">BetMGM</option>
                      <option value="caesars">Caesars</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Max Bet</label>
                    <input
                      type="number"
                      value={opp.max_bet_limit}
                      onChange={(e) => updatePortfolioOpportunity(index, 'max_bet_limit', parseFloat(e.target.value))}
                      className="w-full text-sm rounded border-gray-300"
                    />
                  </div>
                </div>
                
                {/* Show Kelly result if available */}
                {kellyResults[opp.opportunity_id] && (
                  <div className="mt-3 p-3 bg-blue-50 rounded border-l-4 border-blue-400">
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Kelly: </span>
                        <span className="font-medium">{formatPercentage(kellyResults[opp.opportunity_id].recommended_fraction)}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Bet Size: </span>
                        <span className="font-medium">{formatCurrency(kellyResults[opp.opportunity_id].recommended_bet_size)}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Expected: </span>
                        <span className="font-medium">{formatCurrency(kellyResults[opp.opportunity_id].expected_value)}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
            
            <button
              onClick={optimizePortfolio}
              disabled={isLoading}
              className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              <BarChart3 className="w-4 h-4" />
              <span>{isLoading ? 'Optimizing...' : 'Optimize Portfolio'}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );

  // Risk Management Tab
  const RiskManagementTab = () => (
    <div className="space-y-6">
      {/* Current Portfolio Status */}
      {portfolioMetrics && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Portfolio Metrics</h3>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{formatCurrency(portfolioMetrics.total_bankroll)}</div>
              <div className="text-sm text-gray-600">Total Bankroll</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{formatCurrency(portfolioMetrics.available_capital)}</div>
              <div className="text-sm text-gray-600">Available Capital</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{formatPercentage(portfolioMetrics.expected_return)}</div>
              <div className="text-sm text-gray-600">Expected Return</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{formatPercentage(portfolioMetrics.max_drawdown)}</div>
              <div className="text-sm text-gray-600">Max Drawdown</div>
            </div>
          </div>
          
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Sharpe Ratio</span>
                <span className="font-medium">{portfolioMetrics.sharpe_ratio.toFixed(2)}</span>
              </div>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Diversification</span>
                <span className="font-medium">{formatPercentage(portfolioMetrics.diversification_score)}</span>
              </div>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Kelly Leverage</span>
                <span className="font-medium">{formatPercentage(portfolioMetrics.kelly_leverage)}</span>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Risk Alerts */}
      {riskManagement && riskManagement.risk_alerts.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <h4 className="font-medium text-red-800">Risk Alerts</h4>
          </div>
          <div className="space-y-1">
            {riskManagement.risk_alerts.map((alert, index) => (
              <div key={index} className="text-sm text-red-700">{alert}</div>
            ))}
          </div>
        </div>
      )}
      
      {/* Risk Settings */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Risk Management Settings</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Max Bet Percentage ({formatPercentage(riskSettings.max_bet_percentage)})
              </label>
              <input
                type="range"
                min="0.01"
                max="0.5"
                step="0.01"
                value={riskSettings.max_bet_percentage}
                onChange={(e) => setRiskSettings({ ...riskSettings, max_bet_percentage: parseFloat(e.target.value) })}
                className="w-full"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Max Daily Risk ({formatPercentage(riskSettings.max_daily_risk)})
              </label>
              <input
                type="range"
                min="0.1"
                max="1.0"
                step="0.05"
                value={riskSettings.max_daily_risk}
                onChange={(e) => setRiskSettings({ ...riskSettings, max_daily_risk: parseFloat(e.target.value) })}
                className="w-full"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Max Total Exposure ({formatPercentage(riskSettings.max_total_exposure)})
              </label>
              <input
                type="range"
                min="0.1"
                max="1.0"
                step="0.05"
                value={riskSettings.max_total_exposure}
                onChange={(e) => setRiskSettings({ ...riskSettings, max_total_exposure: parseFloat(e.target.value) })}
                className="w-full"
              />
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Min Edge Threshold ({formatPercentage(riskSettings.min_edge_threshold)})
              </label>
              <input
                type="range"
                min="0.001"
                max="0.1"
                step="0.001"
                value={riskSettings.min_edge_threshold}
                onChange={(e) => setRiskSettings({ ...riskSettings, min_edge_threshold: parseFloat(e.target.value) })}
                className="w-full"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Min Confidence ({formatPercentage(riskSettings.min_confidence_threshold)})
              </label>
              <input
                type="range"
                min="0.5"
                max="0.95"
                step="0.05"
                value={riskSettings.min_confidence_threshold}
                onChange={(e) => setRiskSettings({ ...riskSettings, min_confidence_threshold: parseFloat(e.target.value) })}
                className="w-full"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Kelly Fraction Cap ({formatPercentage(riskSettings.kelly_fraction_cap)})
              </label>
              <input
                type="range"
                min="0.05"
                max="0.5"
                step="0.05"
                value={riskSettings.kelly_fraction_cap}
                onChange={(e) => setRiskSettings({ ...riskSettings, kelly_fraction_cap: parseFloat(e.target.value) })}
                className="w-full"
              />
            </div>
          </div>
        </div>
        
        <button
          onClick={updateRiskSettings}
          className="mt-6 flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Shield className="w-4 h-4" />
          <span>Update Risk Settings</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Advanced Kelly Criterion Calculator</h1>
        <p className="text-gray-600">Sophisticated bet sizing with dynamic risk management and portfolio optimization</p>
      </div>

      {/* Navigation Tabs */}
      <div className="mb-6">
        <nav className="flex space-x-8">
          {[
            { id: 'calculator', label: 'Single Bet', icon: Calculator },
            { id: 'portfolio', label: 'Portfolio', icon: PieChart },
            { id: 'risk', label: 'Risk Management', icon: Shield }
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

      {/* Tab Content */}
      {activeTab === 'calculator' && <SingleBetCalculatorTab />}
      {activeTab === 'portfolio' && <PortfolioOptimizerTab />}
      {activeTab === 'risk' && <RiskManagementTab />}
    </div>
  );
};

export default AdvancedKellyDashboard;
