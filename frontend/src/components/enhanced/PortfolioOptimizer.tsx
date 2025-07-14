import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  DollarSign,
  Target,
  PieChart,
  AlertCircle,
  CheckCircle,
  Calculator,
  BarChart3,
  Settings,
  Zap,
  RefreshCw,
} from 'lucide-react';
import {
  PortfolioMetrics,
  EnhancedPrediction,
  PortfolioAnalysis,
} from '../../types/enhancedBetting';

interface PortfolioOptimizerProps {
  metrics?: PortfolioMetrics;
  predictions: EnhancedPrediction[];
  onOptimize: (selectedBets: string[]) => void;
  investmentAmount: number;
  onInvestmentChange: (amount: number) => void;
  isLoading?: boolean;
}

const PortfolioOptimizer: React.FC<PortfolioOptimizerProps> = ({
  metrics,
  predictions,
  onOptimize,
  investmentAmount,
  onInvestmentChange,
  isLoading = false,
}) => {
  const [selectedBets, setSelectedBets] = useState<Set<string>>(new Set());
  const [optimizationMode, setOptimizationMode] = useState<
    'balanced' | 'aggressive' | 'conservative'
  >('balanced');
  const [maxPositions, setMaxPositions] = useState(5);
  const [portfolioAnalysis, setPortfolioAnalysis] = useState<PortfolioAnalysis | null>(null);

  // Auto-select top bets based on optimization mode
  useEffect(() => {
    if (predictions.length > 0) {
      let sortedPredictions = [...predictions];

      switch (optimizationMode) {
        case 'aggressive':
          sortedPredictions.sort((a, b) => b.expected_value - a.expected_value);
          break;
        case 'conservative':
          sortedPredictions.sort(
            (a, b) =>
              b.confidence * (1 - b.risk_assessment.overall_risk) -
              a.confidence * (1 - a.risk_assessment.overall_risk)
          );
          break;
        default: // balanced
          sortedPredictions.sort(
            (a, b) =>
              (b.expected_value * b.confidence) / 100 - (a.expected_value * a.confidence) / 100
          );
      }

      const topBets = sortedPredictions.slice(0, maxPositions).map(bet => bet.id);
      setSelectedBets(new Set(topBets));
    }
  }, [predictions, optimizationMode, maxPositions]);

  const toggleBetSelection = (betId: string) => {
    const newSelected = new Set(selectedBets);
    if (newSelected.has(betId)) {
      newSelected.delete(betId);
    } else {
      newSelected.add(betId);
    }
    setSelectedBets(newSelected);
  };

  const selectedPredictions = predictions.filter(bet => selectedBets.has(bet.id));

  // Calculate portfolio metrics for selected bets
  const calculatePortfolioMetrics = () => {
    if (selectedPredictions.length === 0) return null;

    const totalEV = selectedPredictions.reduce((sum, bet) => sum + bet.expected_value, 0);
    const avgConfidence =
      selectedPredictions.reduce((sum, bet) => sum + bet.confidence, 0) /
      selectedPredictions.length;
    const totalKelly = selectedPredictions.reduce((sum, bet) => sum + bet.kelly_fraction, 0);
    const avgRisk =
      selectedPredictions.reduce((sum, bet) => sum + bet.risk_assessment.overall_risk, 0) /
      selectedPredictions.length;

    // Diversification score
    const uniqueSports = new Set(selectedPredictions.map(bet => bet.sport)).size;
    const uniqueTeams = new Set(selectedPredictions.map(bet => bet.team)).size;
    const diversificationScore = (uniqueSports + uniqueTeams) / (2 * selectedPredictions.length);

    return {
      totalExpectedValue: totalEV,
      averageConfidence: avgConfidence,
      totalKellyAllocation: totalKelly,
      averageRisk: avgRisk,
      diversificationScore: Math.min(1, diversificationScore),
      projectedReturn: totalEV * investmentAmount,
      riskAdjustedReturn: totalEV / Math.max(avgRisk, 0.1),
    };
  };

  const currentMetrics = calculatePortfolioMetrics();

  const getRiskColor = (risk: number) => {
    if (risk < 0.3) return 'text-green-400';
    if (risk < 0.6) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getRiskLevel = (risk: number) => {
    if (risk < 0.3) return 'LOW';
    if (risk < 0.6) return 'MEDIUM';
    return 'HIGH';
  };

  return (
    <div className='bg-gradient-to-br from-gray-800 via-gray-800 to-gray-900 border border-green-500/30 rounded-xl p-6 space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div className='flex items-center space-x-3'>
          <div className='p-2 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-lg'>
            <PieChart className='w-6 h-6 text-green-400' />
          </div>
          <div>
            <h3 className='text-xl font-bold text-white'>Portfolio Optimizer</h3>
            <p className='text-sm text-gray-400'>Modern Portfolio Theory + Kelly Criterion</p>
          </div>
        </div>
        <button
          onClick={() => onOptimize(Array.from(selectedBets))}
          disabled={selectedBets.size === 0 || isLoading}
          className='flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 disabled:from-gray-600 disabled:to-gray-600 text-white rounded-lg font-medium transition-all duration-300 shadow-lg hover:shadow-green-500/25'
        >
          {isLoading ? <RefreshCw className='w-4 h-4 animate-spin' /> : <Zap className='w-4 h-4' />}
          <span>Optimize</span>
        </button>
      </div>

      {/* Investment Amount Input */}
      <div className='bg-gray-700/30 rounded-lg p-4'>
        <label className='block text-sm font-medium text-gray-300 mb-2'>
          Total Investment Amount
        </label>
        <div className='relative'>
          <DollarSign className='absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400' />
          <input
            type='number'
            value={investmentAmount}
            onChange={e => onInvestmentChange(Number(e.target.value))}
            className='w-full pl-10 pr-4 py-3 bg-gray-600 border border-gray-500 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent'
            placeholder='1000'
            min='100'
            max='100000'
            step='100'
          />
        </div>
      </div>

      {/* Optimization Settings */}
      <div className='grid grid-cols-2 gap-4'>
        <div>
          <label className='block text-sm font-medium text-gray-300 mb-2'>Optimization Mode</label>
          <select
            value={optimizationMode}
            onChange={e => setOptimizationMode(e.target.value as any)}
            className='w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500'
          >
            <option value='balanced'>Balanced</option>
            <option value='aggressive'>Aggressive</option>
            <option value='conservative'>Conservative</option>
          </select>
        </div>

        <div>
          <label className='block text-sm font-medium text-gray-300 mb-2'>Max Positions</label>
          <select
            value={maxPositions}
            onChange={e => setMaxPositions(Number(e.target.value))}
            className='w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500'
          >
            <option value={3}>3 Positions</option>
            <option value={5}>5 Positions</option>
            <option value={8}>8 Positions</option>
            <option value={10}>10 Positions</option>
          </select>
        </div>
      </div>

      {/* Portfolio Metrics */}
      {currentMetrics && (
        <div className='grid grid-cols-2 lg:grid-cols-4 gap-4'>
          <div className='bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-lg p-4'>
            <div className='flex items-center space-x-2 mb-2'>
              <TrendingUp className='w-4 h-4 text-green-400' />
              <span className='text-sm text-gray-400'>Expected Return</span>
            </div>
            <div className='text-xl font-bold text-green-400'>
              ${currentMetrics.projectedReturn.toFixed(0)}
            </div>
            <div className='text-xs text-gray-400'>
              +{((currentMetrics.projectedReturn / investmentAmount) * 100).toFixed(1)}%
            </div>
          </div>

          <div className='bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20 rounded-lg p-4'>
            <div className='flex items-center space-x-2 mb-2'>
              <Target className='w-4 h-4 text-blue-400' />
              <span className='text-sm text-gray-400'>Avg Confidence</span>
            </div>
            <div className='text-xl font-bold text-blue-400'>
              {currentMetrics.averageConfidence.toFixed(1)}%
            </div>
          </div>

          <div className='bg-gradient-to-br from-purple-500/10 to-indigo-500/10 border border-purple-500/20 rounded-lg p-4'>
            <div className='flex items-center space-x-2 mb-2'>
              <PieChart className='w-4 h-4 text-purple-400' />
              <span className='text-sm text-gray-400'>Diversification</span>
            </div>
            <div className='text-xl font-bold text-purple-400'>
              {(currentMetrics.diversificationScore * 100).toFixed(0)}%
            </div>
          </div>

          <div className='bg-gradient-to-br from-orange-500/10 to-red-500/10 border border-orange-500/20 rounded-lg p-4'>
            <div className='flex items-center space-x-2 mb-2'>
              <AlertCircle className='w-4 h-4 text-orange-400' />
              <span className='text-sm text-gray-400'>Portfolio Risk</span>
            </div>
            <div className={`text-xl font-bold ${getRiskColor(currentMetrics.averageRisk)}`}>
              {getRiskLevel(currentMetrics.averageRisk)}
            </div>
            <div className='text-xs text-gray-400'>
              {(currentMetrics.averageRisk * 100).toFixed(1)}%
            </div>
          </div>
        </div>
      )}

      {/* Bet Selection */}
      <div className='space-y-3'>
        <div className='flex items-center justify-between'>
          <h4 className='text-sm font-semibold text-gray-300'>
            Portfolio Composition ({selectedBets.size} bets)
          </h4>
          <div className='text-sm text-gray-400'>
            Kelly Allocation:{' '}
            {currentMetrics ? (currentMetrics.totalKellyAllocation * 100).toFixed(1) : 0}%
          </div>
        </div>

        <div className='max-h-64 overflow-y-auto space-y-2'>
          {predictions.slice(0, 10).map(bet => {
            const isSelected = selectedBets.has(bet.id);
            const kellyStake = bet.kelly_fraction * investmentAmount;

            return (
              <motion.div
                key={bet.id}
                className={`p-4 rounded-lg border cursor-pointer transition-all duration-200 ${
                  isSelected
                    ? 'bg-green-500/20 border-green-400/50 shadow-lg shadow-green-500/10'
                    : 'bg-gray-700/30 border-gray-600/50 hover:bg-gray-700/50 hover:border-gray-500/50'
                }`}
                onClick={() => toggleBetSelection(bet.id)}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                <div className='flex items-center justify-between'>
                  <div className='flex items-center space-x-3'>
                    <div
                      className={`p-2 rounded-full ${isSelected ? 'bg-green-500' : 'bg-gray-500'}`}
                    >
                      {isSelected ? (
                        <CheckCircle className='w-4 h-4 text-white' />
                      ) : (
                        <div className='w-4 h-4 rounded-full border-2 border-gray-400'></div>
                      )}
                    </div>
                    <div>
                      <div className='text-sm font-medium text-white'>{bet.player_name}</div>
                      <div className='text-xs text-gray-400'>
                        {bet.stat_type} • {bet.team} • {bet.sport}
                      </div>
                    </div>
                  </div>

                  <div className='text-right'>
                    <div className='text-sm font-semibold text-green-400'>
                      ${kellyStake.toFixed(0)}
                    </div>
                    <div className='text-xs text-gray-400'>
                      {(bet.kelly_fraction * 100).toFixed(1)}% Kelly
                    </div>
                  </div>
                </div>

                {isSelected && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    className='mt-3 pt-3 border-t border-gray-600/50'
                  >
                    <div className='grid grid-cols-4 gap-2 text-xs'>
                      <div>
                        <div className='text-gray-400'>Confidence</div>
                        <div className='text-white font-medium'>{bet.confidence.toFixed(1)}%</div>
                      </div>
                      <div>
                        <div className='text-gray-400'>Expected Value</div>
                        <div className='text-green-400 font-medium'>
                          +{bet.expected_value.toFixed(2)}
                        </div>
                      </div>
                      <div>
                        <div className='text-gray-400'>Risk Level</div>
                        <div
                          className={`font-medium ${getRiskColor(bet.risk_assessment.overall_risk)}`}
                        >
                          {bet.risk_assessment.risk_level.toUpperCase()}
                        </div>
                      </div>
                      <div>
                        <div className='text-gray-400'>Synergy</div>
                        <div className='text-purple-400 font-medium'>
                          {(bet.synergy_rating * 100).toFixed(0)}%
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Recommendations */}
      {currentMetrics && (
        <div className='bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 rounded-lg p-4'>
          <h5 className='text-sm font-semibold text-cyan-400 mb-3 flex items-center space-x-2'>
            <Calculator className='w-4 h-4' />
            <span>Portfolio Recommendations</span>
          </h5>

          <div className='space-y-2 text-sm text-gray-300'>
            {currentMetrics.totalKellyAllocation > 0.5 && (
              <div className='flex items-start space-x-2'>
                <AlertCircle className='w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0' />
                <span>
                  High Kelly allocation ({(currentMetrics.totalKellyAllocation * 100).toFixed(1)}%)
                  - Consider reducing position sizes
                </span>
              </div>
            )}

            {currentMetrics.diversificationScore < 0.6 && (
              <div className='flex items-start space-x-2'>
                <AlertCircle className='w-4 h-4 text-orange-400 mt-0.5 flex-shrink-0' />
                <span>
                  Low diversification ({(currentMetrics.diversificationScore * 100).toFixed(0)}%) -
                  Consider spreading across more sports/teams
                </span>
              </div>
            )}

            {currentMetrics.averageRisk < 0.3 && (
              <div className='flex items-start space-x-2'>
                <CheckCircle className='w-4 h-4 text-green-400 mt-0.5 flex-shrink-0' />
                <span>Excellent risk profile - Well-balanced portfolio with low overall risk</span>
              </div>
            )}

            {currentMetrics.riskAdjustedReturn > 5 && (
              <div className='flex items-start space-x-2'>
                <CheckCircle className='w-4 h-4 text-green-400 mt-0.5 flex-shrink-0' />
                <span>
                  Outstanding risk-adjusted return ({currentMetrics.riskAdjustedReturn.toFixed(1)})
                  - Strong portfolio composition
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Empty State */}
      {predictions.length === 0 && (
        <div className='text-center py-8'>
          <PieChart className='w-12 h-12 text-gray-400 mx-auto mb-3' />
          <h4 className='text-lg font-semibold text-gray-300 mb-2'>No Predictions Available</h4>
          <p className='text-sm text-gray-400'>
            Load betting predictions to start portfolio optimization
          </p>
        </div>
      )}
    </div>
  );
};

export default PortfolioOptimizer;
