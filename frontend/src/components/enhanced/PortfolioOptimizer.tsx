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

const _PortfolioOptimizer: React.FC<PortfolioOptimizerProps> = ({
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
      let _sortedPredictions = [...predictions];

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

      const _topBets = sortedPredictions.slice(0, maxPositions).map(bet => bet.id);
      setSelectedBets(new Set(topBets));
    }
  }, [predictions, optimizationMode, maxPositions]);

  const _toggleBetSelection = (betId: string) => {
    const _newSelected = new Set(selectedBets);
    if (newSelected.has(betId)) {
      newSelected.delete(betId);
    } else {
      newSelected.add(betId);
    }
    setSelectedBets(newSelected);
  };

  const _selectedPredictions = predictions.filter(bet => selectedBets.has(bet.id));

  // Calculate portfolio metrics for selected bets
  const _calculatePortfolioMetrics = () => {
    if (selectedPredictions.length === 0) return null;

    const _totalEV = selectedPredictions.reduce((sum, bet) => sum + bet.expected_value, 0);
    const _avgConfidence =
      selectedPredictions.reduce((sum, bet) => sum + bet.confidence, 0) /
      selectedPredictions.length;
    const _totalKelly = selectedPredictions.reduce((sum, bet) => sum + bet.kelly_fraction, 0);
    const _avgRisk =
      selectedPredictions.reduce((sum, bet) => sum + bet.risk_assessment.overall_risk, 0) /
      selectedPredictions.length;

    // Diversification score
    const _uniqueSports = new Set(selectedPredictions.map(bet => bet.sport)).size;
    const _uniqueTeams = new Set(selectedPredictions.map(bet => bet.team)).size;
    const _diversificationScore = (uniqueSports + uniqueTeams) / (2 * selectedPredictions.length);

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

  const _currentMetrics = calculatePortfolioMetrics();

  const _getRiskColor = (risk: number) => {
    if (risk < 0.3) return 'text-green-400';
    if (risk < 0.6) return 'text-yellow-400';
    return 'text-red-400';
  };

  const _getRiskLevel = (risk: number) => {
    if (risk < 0.3) return 'LOW';
    if (risk < 0.6) return 'MEDIUM';
    return 'HIGH';
  };

  return (
    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <div className='bg-gradient-to-br from-gray-800 via-gray-800 to-gray-900 border border-green-500/30 rounded-xl p-6 space-y-6'>
      {/* Header */}
      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <div className='flex items-center justify-between'>
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <div className='flex items-center space-x-3'>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div className='p-2 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-lg'>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <PieChart className='w-6 h-6 text-green-400' />
          </div>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <h3 className='text-xl font-bold text-white'>Portfolio Optimizer</h3>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <p className='text-sm text-gray-400'>Modern Portfolio Theory + Kelly Criterion</p>
          </div>
        </div>
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <button
          onClick={() => onOptimize(Array.from(selectedBets))}
          disabled={selectedBets.size === 0 || isLoading}
          className='flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 disabled:from-gray-600 disabled:to-gray-600 text-white rounded-lg font-medium transition-all duration-300 shadow-lg hover:shadow-green-500/25'
        >
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          {isLoading ? <RefreshCw className='w-4 h-4 animate-spin' /> : <Zap className='w-4 h-4' />}
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <span>Optimize</span>
        </button>
      </div>

      {/* Investment Amount Input */}
      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <div className='bg-gray-700/30 rounded-lg p-4'>
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <label className='block text-sm font-medium text-gray-300 mb-2' htmlFor='po-investment-amount'>
          Total Investment Amount
        </label>
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <div className='relative'>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <DollarSign className='absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400' />
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <input
            id='po-investment-amount'
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
      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <div className='grid grid-cols-2 gap-4'>
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <div>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <label className='block text-sm font-medium text-gray-300 mb-2' htmlFor='po-optimization-mode'>Optimization Mode</label>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <select
            id='po-optimization-mode'
            value={optimizationMode}
            onChange={e => setOptimizationMode(e.target.value as unknown)}
            className='w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500'
          >
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <option value='balanced'>Balanced</option>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <option value='aggressive'>Aggressive</option>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <option value='conservative'>Conservative</option>
          </select>
        </div>

        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <div>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <label className='block text-sm font-medium text-gray-300 mb-2' htmlFor='po-max-positions'>Max Positions</label>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <select
            id='po-max-positions'
            value={maxPositions}
            onChange={e => setMaxPositions(Number(e.target.value))}
            className='w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500'
          >
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <option value={3}>3 Positions</option>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <option value={5}>5 Positions</option>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <option value={8}>8 Positions</option>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <option value={10}>10 Positions</option>
          </select>
        </div>
      </div>

      {/* Portfolio Metrics */}
      {currentMetrics && (
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <div className='grid grid-cols-2 lg:grid-cols-4 gap-4'>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div className='bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-lg p-4'>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div className='flex items-center space-x-2 mb-2'>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <TrendingUp className='w-4 h-4 text-green-400' />
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <span className='text-sm text-gray-400'>Expected Return</span>
            </div>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div className='text-xl font-bold text-green-400'>
              ${currentMetrics.projectedReturn.toFixed(0)}
            </div>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div className='text-xs text-gray-400'>
              +{((currentMetrics.projectedReturn / investmentAmount) * 100).toFixed(1)}%
            </div>
          </div>

          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div className='bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20 rounded-lg p-4'>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div className='flex items-center space-x-2 mb-2'>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <Target className='w-4 h-4 text-blue-400' />
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <span className='text-sm text-gray-400'>Avg Confidence</span>
            </div>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div className='text-xl font-bold text-blue-400'>
              {currentMetrics.averageConfidence.toFixed(1)}%
            </div>
          </div>

          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div className='bg-gradient-to-br from-purple-500/10 to-indigo-500/10 border border-purple-500/20 rounded-lg p-4'>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div className='flex items-center space-x-2 mb-2'>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <PieChart className='w-4 h-4 text-purple-400' />
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <span className='text-sm text-gray-400'>Diversification</span>
            </div>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div className='text-xl font-bold text-purple-400'>
              {(currentMetrics.diversificationScore * 100).toFixed(0)}%
            </div>
          </div>

          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div className='bg-gradient-to-br from-orange-500/10 to-red-500/10 border border-orange-500/20 rounded-lg p-4'>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div className='flex items-center space-x-2 mb-2'>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <AlertCircle className='w-4 h-4 text-orange-400' />
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <span className='text-sm text-gray-400'>Portfolio Risk</span>
            </div>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div className={`text-xl font-bold ${getRiskColor(currentMetrics.averageRisk)}`}>
              {getRiskLevel(currentMetrics.averageRisk)}
            </div>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div className='text-xs text-gray-400'>
              {(currentMetrics.averageRisk * 100).toFixed(1)}%
            </div>
          </div>
        </div>
      )}

      {/* Bet Selection */}
      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <div className='space-y-3'>
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <div className='flex items-center justify-between'>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <h4 className='text-sm font-semibold text-gray-300'>
            Portfolio Composition ({selectedBets.size} bets)
          </h4>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div className='text-sm text-gray-400'>
            Kelly Allocation:{' '}
            {currentMetrics ? (currentMetrics.totalKellyAllocation * 100).toFixed(1) : 0}%
          </div>
        </div>

        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <div className='max-h-64 overflow-y-auto space-y-2'>
          {predictions.slice(0, 10).map(bet => {
            const _isSelected = selectedBets.has(bet.id);
            const _kellyStake = bet.kelly_fraction * investmentAmount;

            return (
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
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
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <div className='flex items-center justify-between'>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <div className='flex items-center space-x-3'>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <div
                      className={`p-2 rounded-full ${isSelected ? 'bg-green-500' : 'bg-gray-500'}`}
                    >
                      {isSelected ? (
                        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                        <CheckCircle className='w-4 h-4 text-white' />
                      ) : (
                        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                        <div className='w-4 h-4 rounded-full border-2 border-gray-400'></div>
                      )}
                    </div>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <div>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <div className='text-sm font-medium text-white'>{bet.player_name}</div>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <div className='text-xs text-gray-400'>
                        {bet.stat_type} • {bet.team} • {bet.sport}
                      </div>
                    </div>
                  </div>

                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <div className='text-right'>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <div className='text-sm font-semibold text-green-400'>
                      ${kellyStake.toFixed(0)}
                    </div>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <div className='text-xs text-gray-400'>
                      {(bet.kelly_fraction * 100).toFixed(1)}% Kelly
                    </div>
                  </div>
                </div>

                {isSelected && (
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    className='mt-3 pt-3 border-t border-gray-600/50'
                  >
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <div className='grid grid-cols-4 gap-2 text-xs'>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <div>
                        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                        <div className='text-gray-400'>Confidence</div>
                        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                        <div className='text-white font-medium'>{bet.confidence.toFixed(1)}%</div>
                      </div>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <div>
                        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                        <div className='text-gray-400'>Expected Value</div>
                        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                        <div className='text-green-400 font-medium'>
                          +{bet.expected_value.toFixed(2)}
                        </div>
                      </div>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <div>
                        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                        <div className='text-gray-400'>Risk Level</div>
                        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                        <div
                          className={`font-medium ${getRiskColor(bet.risk_assessment.overall_risk)}`}
                        >
                          {bet.risk_assessment.risk_level.toUpperCase()}
                        </div>
                      </div>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <div>
                        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                        <div className='text-gray-400'>Synergy</div>
                        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
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
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <div className='bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 rounded-lg p-4'>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <h5 className='text-sm font-semibold text-cyan-400 mb-3 flex items-center space-x-2'>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <Calculator className='w-4 h-4' />
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <span>Portfolio Recommendations</span>
          </h5>

          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div className='space-y-2 text-sm text-gray-300'>
            {currentMetrics.totalKellyAllocation > 0.5 && (
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <div className='flex items-start space-x-2'>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <AlertCircle className='w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0' />
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <span>
                  High Kelly allocation ({(currentMetrics.totalKellyAllocation * 100).toFixed(1)}%)
                  - Consider reducing position sizes
                </span>
              </div>
            )}

            {currentMetrics.diversificationScore < 0.6 && (
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <div className='flex items-start space-x-2'>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <AlertCircle className='w-4 h-4 text-orange-400 mt-0.5 flex-shrink-0' />
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <span>
                  Low diversification ({(currentMetrics.diversificationScore * 100).toFixed(0)}%) -
                  Consider spreading across more sports/teams
                </span>
              </div>
            )}

            {currentMetrics.averageRisk < 0.3 && (
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <div className='flex items-start space-x-2'>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <CheckCircle className='w-4 h-4 text-green-400 mt-0.5 flex-shrink-0' />
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <span>Excellent risk profile - Well-balanced portfolio with low overall risk</span>
              </div>
            )}

            {currentMetrics.riskAdjustedReturn > 5 && (
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <div className='flex items-start space-x-2'>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <CheckCircle className='w-4 h-4 text-green-400 mt-0.5 flex-shrink-0' />
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
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
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <div className='text-center py-8'>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <PieChart className='w-12 h-12 text-gray-400 mx-auto mb-3' />
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <h4 className='text-lg font-semibold text-gray-300 mb-2'>No Predictions Available</h4>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <p className='text-sm text-gray-400'>
            Load betting predictions to start portfolio optimization
          </p>
        </div>
      )}
    </div>
  );
};

export default PortfolioOptimizer;
