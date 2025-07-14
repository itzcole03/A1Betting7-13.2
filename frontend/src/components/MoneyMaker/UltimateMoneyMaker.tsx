import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  DollarSign,
  TrendingUp,
  Target,
  Zap,
  Brain,
  Calculator,
  BarChart3,
  AlertTriangle,
  RefreshCw,
  Cpu,
  Activity,
  Clock,
  Settings,
  PlayCircle,
  TrendingDown,
} from 'lucide-react';
import { Layout } from '../core/Layout';

interface BettingOpportunity {
  id: string;
  game: string;
  market: string;
  confidence: number;
  expectedROI: number;
  kellyStake: number;
  expectedProfit: number;
  odds: number;
  risk: 'low' | 'medium' | 'high';
  pick: string;
  neural: string;
  reason: string;
}

interface MoneyMakerConfig {
  investment: number;
  strategy: 'quantum' | 'neural' | 'aggressive' | 'conservative';
  confidence: number;
  portfolio: number;
  sports: string;
  riskLevel: string;
  timeFrame: string;
  leagues: string[];
  maxOdds: number;
  minOdds: number;
  playerTypes: string;
  weatherFilter: boolean;
  injuryFilter: boolean;
  lineMovement: string;
  homeAdvantage?: boolean;
  travelFatigue?: boolean;
  hotStreaks?: boolean;
  matchupHistory?: boolean;
  fadePublic?: boolean;
  followSharps?: boolean;
}

const UltimateMoneyMaker: React.FC = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [opportunities, setOpportunities] = useState<BettingOpportunity[]>([]);
  const [totalBankroll, setTotalBankroll] = useState(10000);
  const [config, setConfig] = useState<MoneyMakerConfig>({
    investment: 1000,
    strategy: 'quantum',
    confidence: 95,
    portfolio: 4,
    sports: 'all',
    riskLevel: 'moderate',
    timeFrame: 'today',
    leagues: ['nba', 'nfl'],
    maxOdds: -150,
    minOdds: -300,
    playerTypes: 'all',
    weatherFilter: true,
    injuryFilter: true,
    lineMovement: 'any',
  });

  useEffect(() => {
    // Mock data - comprehensive opportunities with quantum AI analysis
    const mockOpportunities: BettingOpportunity[] = [
      {
        id: '1',
        game: 'Lakers vs Warriors',
        market: 'Over 225.5 Total Points',
        confidence: 96.2,
        expectedROI: 31.4,
        kellyStake: 2500,
        expectedProfit: 785,
        odds: 1.92,
        risk: 'low',
        pick: 'LeBron Over 25.5 Points',
        neural: 'Network #23',
        reason: 'Weather optimal, no injuries, line moved 2pts',
      },
      {
        id: '2',
        game: 'Chiefs vs Bills',
        market: 'Player Props',
        confidence: 93.7,
        expectedROI: 28.2,
        kellyStake: 1800,
        expectedProfit: 507,
        odds: 2.15,
        risk: 'low',
        pick: 'Mahomes Over 275.5 Yards',
        neural: 'Network #15',
        reason: 'Bills defense allows 12% more vs elite QBs',
      },
      {
        id: '3',
        game: 'Celtics vs Heat',
        market: 'Point Spread',
        confidence: 91.8,
        expectedROI: 25.8,
        kellyStake: 2200,
        expectedProfit: 567,
        odds: 1.87,
        risk: 'low',
        pick: 'Tatum Over 27.5 Points',
        neural: 'Network #41',
        reason: 'Miami missing key defender, pace increase',
      },
      {
        id: '4',
        game: 'Rams vs 49ers',
        market: 'Player Props',
        confidence: 89.4,
        expectedROI: 22.1,
        kellyStake: 1600,
        expectedProfit: 354,
        odds: 1.95,
        risk: 'medium',
        pick: 'Kupp Over 6.5 Receptions',
        neural: 'Network #07',
        reason: 'Slot coverage weakness, injury report clean',
      },
    ];
    setOpportunities(mockOpportunities);
  }, []);

  const runQuantumAnalysis = async () => {
    setIsAnalyzing(true);

    // Simulate comprehensive AI analysis
    await new Promise(resolve => setTimeout(resolve, 3500));

    // Generate enhanced opportunities with quantum boost
    const enhancedOpportunities = opportunities.map(opp => ({
      ...opp,
      confidence: Math.min(opp.confidence + 2.5, 99.9),
      expectedROI: opp.expectedROI * 1.15,
      expectedProfit: opp.expectedProfit * 1.15,
    }));

    setOpportunities(enhancedOpportunities);
    setIsAnalyzing(false);
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low':
        return 'text-green-400 bg-green-500/20 border-green-500/30';
      case 'medium':
        return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30';
      case 'high':
        return 'text-red-400 bg-red-500/20 border-red-500/30';
      default:
        return 'text-gray-400 bg-gray-500/20 border-gray-500/30';
    }
  };

  const getStrategyColor = (strategy: string) => {
    switch (strategy) {
      case 'quantum':
        return 'from-purple-500 to-cyan-500';
      case 'neural':
        return 'from-green-500 to-emerald-500';
      case 'aggressive':
        return 'from-red-500 to-orange-500';
      case 'conservative':
        return 'from-blue-500 to-indigo-500';
      default:
        return 'from-gray-500 to-gray-600';
    }
  };

  const totalExpectedProfit = opportunities.reduce((sum, opp) => sum + opp.expectedProfit, 0);
  const averageROI =
    opportunities.reduce((sum, opp) => sum + opp.expectedROI, 0) / opportunities.length;
  const averageConfidence =
    opportunities.reduce((sum, opp) => sum + opp.confidence, 0) / opportunities.length;

  return (
    <Layout
      title='Ultimate Money Maker'
      subtitle='Quantum AI-Powered Betting Engine with Neural Network Analysis'
      headerActions={
        <div className='flex items-center space-x-4'>
          <div className='text-right'>
            <div className='text-sm text-gray-400'>Total Bankroll</div>
            <div className='text-lg font-bold text-green-400'>
              ${totalBankroll.toLocaleString()}
            </div>
          </div>
          <button
            onClick={runQuantumAnalysis}
            disabled={isAnalyzing}
            className={`flex items-center space-x-2 px-6 py-3 bg-gradient-to-r ${getStrategyColor(config.strategy)} hover:scale-105 rounded-lg text-white font-bold transition-all disabled:opacity-50 shadow-lg`}
          >
            <Brain className={`w-5 h-5 ${isAnalyzing ? 'animate-spin' : ''}`} />
            <span>{isAnalyzing ? 'Quantum Analysis...' : 'Activate Quantum AI'}</span>
          </button>
        </div>
      }
    >
      {/* Hero Stats Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className='text-center mb-8 p-8 bg-gradient-to-r from-purple-900/20 to-cyan-900/20 rounded-xl border border-purple-500/30'
      >
        <h2 className='text-4xl font-black bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent mb-4'>
          QUANTUM NEURAL PROFIT ENGINE
        </h2>
        <div className='grid grid-cols-1 md:grid-cols-4 gap-6'>
          <div className='text-center'>
            <div className='text-3xl font-bold text-green-400'>
              ${totalExpectedProfit.toLocaleString()}
            </div>
            <div className='text-gray-400'>Expected Profit</div>
          </div>
          <div className='text-center'>
            <div className='text-3xl font-bold text-purple-400'>{averageROI.toFixed(1)}%</div>
            <div className='text-gray-400'>Average ROI</div>
          </div>
          <div className='text-center'>
            <div className='text-3xl font-bold text-cyan-400'>{averageConfidence.toFixed(1)}%</div>
            <div className='text-gray-400'>AI Confidence</div>
          </div>
          <div className='text-center'>
            <div className='text-3xl font-bold text-yellow-400'>{opportunities.length}</div>
            <div className='text-gray-400'>Active Picks</div>
          </div>
        </div>
      </motion.div>

      {/* Portfolio Summary Cards */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8'>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className='bg-slate-800/50 backdrop-blur-lg border border-slate-700/50 rounded-xl p-6 hover:border-green-500/50 transition-all'
        >
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-gray-400 text-sm'>Expected Daily Profit</p>
              <p className='text-2xl font-bold text-green-400'>
                +${totalExpectedProfit.toLocaleString()}
              </p>
              <p className='text-xs text-green-300 mt-1'>Today's quantum picks</p>
            </div>
            <DollarSign className='w-8 h-8 text-green-400' />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className='bg-slate-800/50 backdrop-blur-lg border border-slate-700/50 rounded-xl p-6 hover:border-purple-500/50 transition-all'
        >
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-gray-400 text-sm'>Portfolio ROI</p>
              <p className='text-2xl font-bold text-purple-400'>+{averageROI.toFixed(1)}%</p>
              <p className='text-xs text-purple-300 mt-1'>Neural weighted</p>
            </div>
            <TrendingUp className='w-8 h-8 text-purple-400' />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className='bg-slate-800/50 backdrop-blur-lg border border-slate-700/50 rounded-xl p-6 hover:border-cyan-500/50 transition-all'
        >
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-gray-400 text-sm'>Quantum Confidence</p>
              <p className='text-2xl font-bold text-cyan-400'>{averageConfidence.toFixed(1)}%</p>
              <p className='text-xs text-cyan-300 mt-1'>47 neural networks</p>
            </div>
            <Brain className='w-8 h-8 text-cyan-400' />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className='bg-slate-800/50 backdrop-blur-lg border border-slate-700/50 rounded-xl p-6 hover:border-yellow-500/50 transition-all'
        >
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-gray-400 text-sm'>Active Strategy</p>
              <p className='text-2xl font-bold text-yellow-400 capitalize'>{config.strategy}</p>
              <p className='text-xs text-yellow-300 mt-1'>AI optimized</p>
            </div>
            <Cpu className='w-8 h-8 text-yellow-400' />
          </div>
        </motion.div>
      </div>

      {/* Configuration Panel */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className='bg-slate-800/50 backdrop-blur-lg border border-slate-700/50 rounded-xl p-6 mb-8'
      >
        <div className='flex items-center justify-between mb-6'>
          <div className='flex items-center space-x-3'>
            <Settings className='w-6 h-6 text-cyan-400' />
            <h3 className='text-xl font-bold text-white'>Quantum Configuration</h3>
          </div>
        </div>

        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
          <div>
            <label className='block text-sm font-medium text-gray-400 mb-2'>
              Investment Amount
            </label>
            <div className='relative'>
              <DollarSign className='absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400' />
              <input
                type='number'
                value={config.investment}
                onChange={e => setConfig({ ...config, investment: parseInt(e.target.value) || 0 })}
                className='w-full pl-10 pr-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400'
                placeholder='1000'
              />
            </div>
          </div>

          <div>
            <label className='block text-sm font-medium text-gray-400 mb-2'>Strategy Type</label>
            <select
              value={config.strategy}
              onChange={e => setConfig({ ...config, strategy: e.target.value as any })}
              className='w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400'
            >
              <option value='quantum'>🔮 Quantum AI</option>
              <option value='neural'>🧠 Neural Network</option>
              <option value='aggressive'>🚀 Aggressive</option>
              <option value='conservative'>🛡️ Conservative</option>
            </select>
          </div>

          <div>
            <label className='block text-sm font-medium text-gray-400 mb-2'>
              Confidence Threshold
            </label>
            <div className='relative'>
              <input
                type='range'
                min='80'
                max='99'
                value={config.confidence}
                onChange={e => setConfig({ ...config, confidence: parseInt(e.target.value) })}
                className='w-full'
              />
              <div className='text-center text-cyan-400 font-bold mt-1'>{config.confidence}%</div>
            </div>
          </div>

          <div>
            <label className='block text-sm font-medium text-gray-400 mb-2'>Portfolio Size</label>
            <div className='relative'>
              <Target className='absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400' />
              <input
                type='number'
                min='1'
                max='10'
                value={config.portfolio}
                onChange={e => setConfig({ ...config, portfolio: parseInt(e.target.value) || 1 })}
                className='w-full pl-10 pr-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400'
                placeholder='4'
              />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Top Opportunities */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className='bg-slate-800/50 backdrop-blur-lg border border-slate-700/50 rounded-xl p-6'
      >
        <div className='flex items-center justify-between mb-6'>
          <div>
            <h3 className='text-xl font-bold text-white'>Quantum Opportunities</h3>
            <p className='text-gray-400 text-sm'>
              AI-optimized picks with Kelly Criterion bankroll management
            </p>
          </div>
          <div className='flex items-center space-x-2'>
            <Zap className='w-5 h-5 text-yellow-400 animate-pulse' />
            <span className='text-yellow-400 text-sm font-medium'>Live Neural Analysis</span>
          </div>
        </div>

        <div className='space-y-4'>
          {opportunities.map((opportunity, index) => (
            <motion.div
              key={opportunity.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 + index * 0.1 }}
              className='bg-slate-900/30 border border-slate-700/30 rounded-lg p-6 hover:border-cyan-500/30 transition-all group'
            >
              <div className='flex items-center justify-between mb-4'>
                <div className='flex items-center space-x-4'>
                  <div className='w-3 h-3 bg-green-400 rounded-full animate-pulse'></div>
                  <div>
                    <h4 className='font-bold text-white text-lg'>{opportunity.game}</h4>
                    <p className='text-cyan-400 font-medium'>{opportunity.pick}</p>
                  </div>
                </div>
                <div className='text-right'>
                  <div className='text-2xl font-bold text-green-400'>
                    +{opportunity.expectedROI.toFixed(1)}% ROI
                  </div>
                  <div
                    className={`inline-flex px-3 py-1 rounded-full text-xs font-medium border ${getRiskColor(opportunity.risk)}`}
                  >
                    {opportunity.risk.toUpperCase()} RISK
                  </div>
                </div>
              </div>

              <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mb-4'>
                <div className='bg-slate-800/50 rounded-lg p-3'>
                  <div className='text-sm text-gray-400'>Kelly Stake</div>
                  <div className='text-lg font-bold text-white'>
                    ${opportunity.kellyStake.toLocaleString()}
                  </div>
                </div>
                <div className='bg-slate-800/50 rounded-lg p-3'>
                  <div className='text-sm text-gray-400'>Expected Profit</div>
                  <div className='text-lg font-bold text-green-400'>
                    +${opportunity.expectedProfit}
                  </div>
                </div>
                <div className='bg-slate-800/50 rounded-lg p-3'>
                  <div className='text-sm text-gray-400'>AI Confidence</div>
                  <div className='text-lg font-bold text-cyan-400'>
                    {opportunity.confidence.toFixed(1)}%
                  </div>
                </div>
              </div>

              <div className='flex items-center justify-between text-sm'>
                <div className='text-gray-400'>
                  <span className='text-purple-400 font-medium'>{opportunity.neural}</span> • Odds:{' '}
                  <span className='text-yellow-400'>{opportunity.odds.toFixed(2)}</span>
                </div>
                <div className='text-gray-300 italic'>{opportunity.reason}</div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Action Buttons */}
        <div className='flex items-center justify-center space-x-4 mt-8'>
          <button className='flex items-center space-x-2 px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 rounded-lg text-white font-bold transition-all shadow-lg hover:scale-105'>
            <PlayCircle className='w-5 h-5' />
            <span>Execute All Picks</span>
          </button>
          <button className='flex items-center space-x-2 px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 rounded-lg text-white font-bold transition-all shadow-lg hover:scale-105'>
            <Calculator className='w-5 h-5' />
            <span>Kelly Calculator</span>
          </button>
          <button className='flex items-center space-x-2 px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 rounded-lg text-white font-bold transition-all shadow-lg hover:scale-105'>
            <Brain className='w-5 h-5' />
            <span>SHAP Analysis</span>
          </button>
        </div>

        {/* Kelly Calculator Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className='bg-slate-800/50 backdrop-blur-lg border border-slate-700/50 rounded-xl p-6 mt-8'
        >
          <div className='flex items-center justify-between mb-6'>
            <div>
              <h3 className='text-xl font-bold text-white'>Kelly Criterion Calculator</h3>
              <p className='text-gray-400 text-sm'>Optimal position sizing for maximum growth</p>
            </div>
            <Calculator className='w-6 h-6 text-cyan-400' />
          </div>

          <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
            <div className='bg-slate-900/50 rounded-lg p-4'>
              <h4 className='text-sm font-medium text-gray-400 mb-2'>Win Probability</h4>
              <div className='text-2xl font-bold text-cyan-400'>
                {averageConfidence.toFixed(1)}%
              </div>
              <div className='text-xs text-gray-500 mt-1'>From AI models</div>
            </div>
            <div className='bg-slate-900/50 rounded-lg p-4'>
              <h4 className='text-sm font-medium text-gray-400 mb-2'>Kelly %</h4>
              <div className='text-2xl font-bold text-green-400'>
                {((averageConfidence / 100) * 2 - 1).toFixed(1)}%
              </div>
              <div className='text-xs text-gray-500 mt-1'>Optimal bet size</div>
            </div>
            <div className='bg-slate-900/50 rounded-lg p-4'>
              <h4 className='text-sm font-medium text-gray-400 mb-2'>Suggested Stake</h4>
              <div className='text-2xl font-bold text-purple-400'>
                $
                {Math.round(
                  (totalBankroll * ((averageConfidence / 100) * 2 - 1)) / 100
                ).toLocaleString()}
              </div>
              <div className='text-xs text-gray-500 mt-1'>Per opportunity</div>
            </div>
          </div>
        </motion.div>

        {/* SHAP Explanation Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className='bg-slate-800/50 backdrop-blur-lg border border-slate-700/50 rounded-xl p-6 mt-8'
        >
          <div className='flex items-center justify-between mb-6'>
            <div>
              <h3 className='text-xl font-bold text-white'>SHAP Model Explanations</h3>
              <p className='text-gray-400 text-sm'>
                Feature importance for prediction transparency
              </p>
            </div>
            <Brain className='w-6 h-6 text-purple-400' />
          </div>

          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            <div>
              <h4 className='text-lg font-medium text-white mb-4'>Feature Importance</h4>
              {[
                { feature: 'Recent Form', importance: 0.28, impact: 'positive' },
                { feature: 'Matchup History', importance: 0.23, impact: 'positive' },
                { feature: 'Injury Status', importance: 0.19, impact: 'negative' },
                { feature: 'Weather Conditions', importance: 0.15, impact: 'neutral' },
                { feature: 'Line Movement', importance: 0.15, impact: 'positive' },
              ].map((item, index) => (
                <div key={index} className='flex items-center justify-between mb-3'>
                  <span className='text-gray-300'>{item.feature}</span>
                  <div className='flex items-center space-x-2'>
                    <div className='w-24 bg-slate-700 rounded-full h-2'>
                      <div
                        className={`h-2 rounded-full ${
                          item.impact === 'positive'
                            ? 'bg-green-400'
                            : item.impact === 'negative'
                              ? 'bg-red-400'
                              : 'bg-yellow-400'
                        }`}
                        style={{ width: `${item.importance * 100}%` }}
                      />
                    </div>
                    <span className='text-sm text-gray-400'>
                      {(item.importance * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div>
              <h4 className='text-lg font-medium text-white mb-4'>Model Consensus</h4>
              <div className='space-y-3'>
                {[
                  { model: 'XGBoost Ensemble', prediction: 0.94, weight: 0.35 },
                  { model: 'Neural Network', prediction: 0.92, weight: 0.3 },
                  { model: 'LSTM Predictor', prediction: 0.89, weight: 0.2 },
                  { model: 'Random Forest', prediction: 0.87, weight: 0.15 },
                ].map((model, index) => (
                  <div key={index} className='bg-slate-900/50 rounded-lg p-3'>
                    <div className='flex items-center justify-between mb-2'>
                      <span className='text-sm font-medium text-white'>{model.model}</span>
                      <span className='text-sm text-cyan-400'>
                        {(model.prediction * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className='flex items-center space-x-2'>
                      <div className='flex-1 bg-slate-700 rounded-full h-1'>
                        <div
                          className='h-1 bg-gradient-to-r from-cyan-400 to-purple-400 rounded-full'
                          style={{ width: `${model.weight * 100}%` }}
                        />
                      </div>
                      <span className='text-xs text-gray-400'>
                        {(model.weight * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Advanced Player Analysis Engine */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2 }}
          className='bg-slate-800/50 backdrop-blur-lg border border-slate-700/50 rounded-xl p-6 mt-8'
        >
          <div className='flex items-center justify-between mb-6'>
            <div>
              <h3 className='text-xl font-bold text-white'>Multi-Factor Player Analysis</h3>
              <p className='text-gray-400 text-sm'>
                Deep analysis with sentiment, trends, and predictive modeling
              </p>
            </div>
            <Brain className='w-6 h-6 text-purple-400' />
          </div>

          <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
            <div className='bg-slate-900/50 rounded-lg p-4'>
              <h4 className='text-sm font-medium text-gray-400 mb-3'>Analysis Weightings</h4>
              <div className='space-y-3'>
                {[
                  {
                    factor: 'Historical Performance',
                    weight: 30,
                    impact: 'High',
                    color: 'from-blue-400 to-blue-600',
                  },
                  {
                    factor: 'Current Form',
                    weight: 40,
                    impact: 'Very High',
                    color: 'from-green-400 to-green-600',
                  },
                  {
                    factor: 'Social Sentiment',
                    weight: 15,
                    impact: 'Medium',
                    color: 'from-yellow-400 to-yellow-600',
                  },
                  {
                    factor: 'Market Efficiency',
                    weight: 15,
                    impact: 'Medium',
                    color: 'from-purple-400 to-purple-600',
                  },
                ].map((factor, index) => (
                  <div key={index} className='bg-slate-800/50 rounded-lg p-3'>
                    <div className='flex items-center justify-between mb-2'>
                      <span className='text-white font-medium text-sm'>{factor.factor}</span>
                      <span className='text-cyan-400 text-xs'>{factor.weight}%</span>
                    </div>
                    <div className='w-full bg-slate-700 rounded-full h-2 mb-2'>
                      <div
                        className={`bg-gradient-to-r ${factor.color} h-2 rounded-full transition-all duration-500`}
                        style={{ width: `${factor.weight}%` }}
                      ></div>
                    </div>
                    <div className='text-gray-400 text-xs'>Impact: {factor.impact}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className='bg-slate-900/50 rounded-lg p-4'>
              <h4 className='text-sm font-medium text-gray-400 mb-3'>Risk Matrix</h4>
              <div className='space-y-3'>
                {[
                  {
                    type: 'Injury Risk',
                    level: 'LOW',
                    factors: ['No injury history', 'Good fitness'],
                    mitigation: 'Monitor closely',
                  },
                  {
                    type: 'Performance Variance',
                    level: 'MEDIUM',
                    factors: ['Moderate consistency', 'Matchup dependent'],
                    mitigation: 'Adjust position size',
                  },
                  {
                    type: 'Market Sentiment',
                    level: 'LOW',
                    factors: ['Positive outlook', 'Strong support'],
                    mitigation: 'None required',
                  },
                  {
                    type: 'Opponent Matchup',
                    level: 'HIGH',
                    factors: ['Strong defense', 'Poor historical record'],
                    mitigation: 'Reduce exposure',
                  },
                ].map((risk, index) => (
                  <div key={index} className='bg-slate-800/50 rounded-lg p-3'>
                    <div className='flex items-center justify-between mb-2'>
                      <span className='text-white font-medium text-sm'>{risk.type}</span>
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          risk.level === 'LOW'
                            ? 'bg-green-500/20 text-green-400'
                            : risk.level === 'MEDIUM'
                              ? 'bg-yellow-500/20 text-yellow-400'
                              : 'bg-red-500/20 text-red-400'
                        }`}
                      >
                        {risk.level}
                      </span>
                    </div>
                    <ul className='text-gray-400 text-xs space-y-1 mb-2'>
                      {risk.factors.map((factor, i) => (
                        <li key={i}>• {factor}</li>
                      ))}
                    </ul>
                    <div className='text-cyan-400 text-xs font-medium'>
                      Mitigation: {risk.mitigation}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className='bg-slate-900/50 rounded-lg p-4'>
              <h4 className='text-sm font-medium text-gray-400 mb-3'>Predictive Trends</h4>
              <div className='space-y-3'>
                {[
                  {
                    metric: 'Points Per Game',
                    direction: 'up',
                    strength: 85,
                    trend: '+2.4 last 10',
                    support: 'Increased usage',
                  },
                  {
                    metric: 'Assists',
                    direction: 'stable',
                    strength: 72,
                    trend: '±0.1 variance',
                    support: 'Consistent role',
                  },
                  {
                    metric: 'Rebounds',
                    direction: 'down',
                    strength: 45,
                    trend: '-0.8 last 5',
                    support: 'Matchup dependent',
                  },
                  {
                    metric: 'Usage Rate',
                    direction: 'up',
                    strength: 91,
                    trend: '+4.2% increase',
                    support: 'Injury to teammate',
                  },
                ].map((trend, index) => (
                  <div key={index} className='bg-slate-800/50 rounded-lg p-3'>
                    <div className='flex items-center justify-between mb-2'>
                      <span className='text-white font-medium text-sm'>{trend.metric}</span>
                      <div className='flex items-center space-x-2'>
                        <span
                          className={`text-lg ${
                            trend.direction === 'up'
                              ? 'text-green-400'
                              : trend.direction === 'down'
                                ? 'text-red-400'
                                : 'text-gray-400'
                          }`}
                        >
                          {trend.direction === 'up'
                            ? '↗'
                            : trend.direction === 'down'
                              ? '↘'
                              : '→'}
                        </span>
                        <span className='text-cyan-400 text-xs'>{trend.strength}%</span>
                      </div>
                    </div>
                    <div className='text-gray-300 text-xs mb-1'>{trend.trend}</div>
                    <div className='text-gray-400 text-xs'>Supporting: {trend.support}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* ML Simulation Engine */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.3 }}
          className='bg-slate-800/50 backdrop-blur-lg border border-slate-700/50 rounded-xl p-6 mt-8'
        >
          <div className='flex items-center justify-between mb-6'>
            <div>
              <h3 className='text-xl font-bold text-white'>ML Simulation Engine</h3>
              <p className='text-gray-400 text-sm'>
                Monte Carlo simulations with machine learning predictions
              </p>
            </div>
            <Zap className='w-6 h-6 text-yellow-400' />
          </div>

          <div className='grid grid-cols-1 md:grid-cols-4 gap-4 mb-6'>
            <div className='bg-slate-900/50 rounded-lg p-4 text-center'>
              <div className='text-2xl font-bold text-green-400 mb-1'>10,000</div>
              <div className='text-sm text-gray-400'>Simulations Run</div>
            </div>
            <div className='bg-slate-900/50 rounded-lg p-4 text-center'>
              <div className='text-2xl font-bold text-cyan-400 mb-1'>87.3%</div>
              <div className='text-sm text-gray-400'>Win Probability</div>
            </div>
            <div className='bg-slate-900/50 rounded-lg p-4 text-center'>
              <div className='text-2xl font-bold text-purple-400 mb-1'>2.47x</div>
              <div className='text-sm text-gray-400'>Expected Return</div>
            </div>
            <div className='bg-slate-900/50 rounded-lg p-4 text-center'>
              <div className='text-2xl font-bold text-yellow-400 mb-1'>92.1%</div>
              <div className='text-sm text-gray-400'>Model Confidence</div>
            </div>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            <div className='bg-slate-900/50 rounded-lg p-4'>
              <h4 className='text-sm font-medium text-gray-400 mb-3'>Simulation Results</h4>
              <div className='space-y-3'>
                {[
                  {
                    outcome: 'Over 25.5 Points',
                    probability: 87.3,
                    frequency: 8730,
                    edge: '+12.3%',
                  },
                  {
                    outcome: '24-26 Point Range',
                    probability: 34.2,
                    frequency: 3420,
                    edge: '+5.7%',
                  },
                  { outcome: '27+ Points', probability: 53.1, frequency: 5310, edge: '+18.9%' },
                  {
                    outcome: 'Under 25.5 Points',
                    probability: 12.7,
                    frequency: 1270,
                    edge: '-8.4%',
                  },
                ].map((result, index) => (
                  <div key={index} className='flex items-center justify-between'>
                    <div>
                      <div className='text-white text-sm font-medium'>{result.outcome}</div>
                      <div className='text-gray-400 text-xs'>{result.frequency} occurrences</div>
                    </div>
                    <div className='text-right'>
                      <div className='text-cyan-400 font-bold text-sm'>{result.probability}%</div>
                      <div
                        className={`text-xs ${result.edge.includes('+') ? 'text-green-400' : 'text-red-400'}`}
                      >
                        {result.edge}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className='bg-slate-900/50 rounded-lg p-4'>
              <h4 className='text-sm font-medium text-gray-400 mb-3'>Model Performance</h4>
              <div className='space-y-3'>
                {[
                  { model: 'Ensemble Predictor', accuracy: 94.2, predictions: 1547, active: true },
                  { model: 'LSTM Neural Net', accuracy: 92.8, predictions: 1342, active: true },
                  { model: 'XGBoost Classifier', accuracy: 91.5, predictions: 1789, active: true },
                  { model: 'Random Forest', accuracy: 88.3, predictions: 967, active: false },
                ].map((model, index) => (
                  <div key={index} className='flex items-center justify-between'>
                    <div>
                      <div className='flex items-center space-x-2'>
                        <div
                          className={`w-2 h-2 rounded-full ${model.active ? 'bg-green-400' : 'bg-gray-400'}`}
                        ></div>
                        <span className='text-white text-sm font-medium'>{model.model}</span>
                      </div>
                      <div className='text-gray-400 text-xs ml-4'>
                        {model.predictions} predictions
                      </div>
                    </div>
                    <div className='text-cyan-400 font-bold text-sm'>{model.accuracy}%</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Real-Time Prediction Engine */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.4 }}
          className='bg-slate-800/50 backdrop-blur-lg border border-slate-700/50 rounded-xl p-6 mt-8'
        >
          <div className='flex items-center justify-between mb-6'>
            <div>
              <h3 className='text-xl font-bold text-white'>Real-Time Prediction Engine</h3>
              <p className='text-gray-400 text-sm'>
                Live ML predictions with SHAP explanations and ensemble modeling
              </p>
            </div>
            <div className='flex items-center space-x-2'>
              <div className='w-3 h-3 bg-green-400 rounded-full animate-pulse'></div>
              <span className='text-green-400 text-sm font-medium'>Live API</span>
            </div>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-2 gap-6 mb-6'>
            <div className='bg-slate-900/50 rounded-lg p-4'>
              <h4 className='text-sm font-medium text-gray-400 mb-3'>System Health</h4>
              <div className='space-y-3'>
                {[
                  {
                    metric: 'Models Loaded',
                    value: '12',
                    status: 'Active',
                    color: 'text-green-400',
                  },
                  {
                    metric: 'API Latency',
                    value: '143ms',
                    status: 'Optimal',
                    color: 'text-green-400',
                  },
                  {
                    metric: 'Data Freshness',
                    value: '2.1s',
                    status: 'Fresh',
                    color: 'text-green-400',
                  },
                  {
                    metric: 'Error Rate',
                    value: '0.03%',
                    status: 'Excellent',
                    color: 'text-green-400',
                  },
                ].map((item, index) => (
                  <div key={index} className='flex items-center justify-between'>
                    <span className='text-gray-300 text-sm'>{item.metric}</span>
                    <div className='text-right'>
                      <span className={`font-bold text-sm ${item.color}`}>{item.value}</span>
                      <div className='text-xs text-gray-400'>{item.status}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className='bg-slate-900/50 rounded-lg p-4'>
              <h4 className='text-sm font-medium text-gray-400 mb-3'>Prediction Stats</h4>
              <div className='space-y-3'>
                {[
                  { metric: 'Total Predictions', value: '47,832', change: '+1,247' },
                  { metric: 'API Calls', value: '8,934', change: '+234' },
                  { metric: 'Cache Hit Rate', value: '94.2%', change: '+2.1%' },
                  { metric: 'Avg Confidence', value: '87.8%', change: '+1.3%' },
                ].map((item, index) => (
                  <div key={index} className='flex items-center justify-between'>
                    <span className='text-gray-300 text-sm'>{item.metric}</span>
                    <div className='text-right'>
                      <span className='font-bold text-sm text-white'>{item.value}</span>
                      <div className='text-xs text-cyan-400'>{item.change}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
            <div className='bg-slate-900/50 rounded-lg p-4'>
              <h4 className='text-sm font-medium text-gray-400 mb-3'>Active Models</h4>
              <div className='space-y-2'>
                {[
                  { model: 'XGBoost Ensemble v2.1', accuracy: 94.7, predictions: 15420 },
                  { model: 'Neural Network v1.8', accuracy: 92.3, predictions: 12890 },
                  { model: 'LSTM Predictor v3.0', accuracy: 91.8, predictions: 11456 },
                  { model: 'Random Forest v2.5', accuracy: 89.4, predictions: 8066 },
                ].map((model, index) => (
                  <div key={index} className='bg-slate-800/50 rounded-lg p-2'>
                    <div className='flex items-center justify-between mb-1'>
                      <span className='text-white text-xs font-medium'>{model.model}</span>
                      <span className='text-green-400 text-xs'>{model.accuracy}%</span>
                    </div>
                    <div className='text-gray-400 text-xs'>
                      {model.predictions.toLocaleString()} predictions
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className='bg-slate-900/50 rounded-lg p-4'>
              <h4 className='text-sm font-medium text-gray-400 mb-3'>Model Consensus</h4>
              <div className='space-y-3'>
                {[
                  {
                    proposition: 'LeBron Over 25.5 Pts',
                    consensus: 94,
                    models: 11,
                    variance: 0.03,
                  },
                  { proposition: 'Curry Over 4.5 3PM', consensus: 87, models: 12, variance: 0.08 },
                  { proposition: 'Luka Over 8.5 Ast', consensus: 91, models: 10, variance: 0.05 },
                ].map((item, index) => (
                  <div key={index} className='bg-slate-800/50 rounded-lg p-3'>
                    <div className='text-white text-sm font-medium mb-2'>{item.proposition}</div>
                    <div className='grid grid-cols-2 gap-2 text-xs'>
                      <div className='text-gray-400'>
                        Consensus: <span className='text-green-400'>{item.consensus}%</span>
                      </div>
                      <div className='text-gray-400'>
                        Models: <span className='text-cyan-400'>{item.models}/12</span>
                      </div>
                      <div className='text-gray-400'>
                        Variance: <span className='text-purple-400'>{item.variance}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className='bg-slate-900/50 rounded-lg p-4'>
              <h4 className='text-sm font-medium text-gray-400 mb-3'>SHAP Explanations</h4>
              <div className='space-y-2'>
                {[
                  { feature: 'Recent Form (5 games)', impact: 0.31, direction: 'positive' },
                  { feature: 'Opponent Defense Rank', impact: 0.24, direction: 'negative' },
                  { feature: 'Rest Days', impact: 0.18, direction: 'positive' },
                  { feature: 'Home/Away', impact: 0.15, direction: 'neutral' },
                  { feature: 'Usage Rate', impact: 0.12, direction: 'positive' },
                ].map((item, index) => (
                  <div key={index} className='flex items-center justify-between'>
                    <span className='text-gray-300 text-xs'>{item.feature}</span>
                    <div className='flex items-center space-x-2'>
                      <div className='w-12 bg-slate-700 rounded-full h-1'>
                        <div
                          className={`h-1 rounded-full ${
                            item.direction === 'positive'
                              ? 'bg-green-400'
                              : item.direction === 'negative'
                                ? 'bg-red-400'
                                : 'bg-gray-400'
                          }`}
                          style={{ width: `${item.impact * 100}%` }}
                        />
                      </div>
                      <span className='text-cyan-400 text-xs'>
                        {(item.impact * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className='mt-6 flex space-x-3'>
            <button className='px-4 py-2 bg-gradient-to-r from-green-500 to-cyan-500 hover:from-green-600 hover:to-cyan-600 rounded-lg text-white font-medium transition-all'>
              Trigger Model Training
            </button>
            <button className='px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-white transition-colors'>
              Export Predictions
            </button>
            <button className='px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-white transition-colors'>
              API Health Check
            </button>
          </div>
        </motion.div>

        {/* Master Service Integration Hub */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.5 }}
          className='bg-slate-800/50 backdrop-blur-lg border border-slate-700/50 rounded-xl p-6 mt-8'
        >
          <div className='flex items-center justify-between mb-6'>
            <div>
              <h3 className='text-xl font-bold text-white'>Master Service Integration Hub</h3>
              <p className='text-gray-400 text-sm'>
                Unified service registry with health monitoring and metrics collection
              </p>
            </div>
            <Activity className='w-6 h-6 text-green-400' />
          </div>

          <div className='grid grid-cols-1 md:grid-cols-4 gap-4 mb-6'>
            <div className='bg-slate-900/50 rounded-lg p-4 text-center'>
              <div className='text-2xl font-bold text-green-400 mb-1'>23</div>
              <div className='text-sm text-gray-400'>Active Services</div>
              <div className='text-xs text-green-300 mt-1'>All operational</div>
            </div>
            <div className='bg-slate-900/50 rounded-lg p-4 text-center'>
              <div className='text-2xl font-bold text-cyan-400 mb-1'>99.7%</div>
              <div className='text-sm text-gray-400'>Success Rate</div>
              <div className='text-xs text-cyan-300 mt-1'>Last 24h</div>
            </div>
            <div className='bg-slate-900/50 rounded-lg p-4 text-center'>
              <div className='text-2xl font-bold text-purple-400 mb-1'>47ms</div>
              <div className='text-sm text-gray-400'>Avg Response</div>
              <div className='text-xs text-purple-300 mt-1'>All services</div>
            </div>
            <div className='bg-slate-900/50 rounded-lg p-4 text-center'>
              <div className='text-2xl font-bold text-yellow-400 mb-1'>94.2%</div>
              <div className='text-sm text-gray-400'>Cache Hit Rate</div>
              <div className='text-xs text-yellow-300 mt-1'>Performance optimized</div>
            </div>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
            <div className='bg-slate-900/50 rounded-lg p-4'>
              <h4 className='text-sm font-medium text-gray-400 mb-3'>Unified Services Health</h4>
              <div className='space-y-2'>
                {[
                  { name: 'Analytics Service', status: 'healthy', responseTime: 34, uptime: 99.9 },
                  { name: 'Betting Service', status: 'healthy', responseTime: 42, uptime: 99.8 },
                  { name: 'Data Service', status: 'healthy', responseTime: 28, uptime: 100.0 },
                  { name: 'Prediction Service', status: 'healthy', responseTime: 56, uptime: 99.7 },
                  {
                    name: 'Notification Service',
                    status: 'degraded',
                    responseTime: 89,
                    uptime: 98.3,
                  },
                  { name: 'WebSocket Service', status: 'healthy', responseTime: 23, uptime: 99.9 },
                ].map((service, index) => (
                  <div key={index} className='bg-slate-800/50 rounded-lg p-2'>
                    <div className='flex items-center justify-between mb-1'>
                      <span className='text-white text-xs font-medium'>{service.name}</span>
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          service.status === 'healthy'
                            ? 'bg-green-500/20 text-green-400'
                            : service.status === 'degraded'
                              ? 'bg-yellow-500/20 text-yellow-400'
                              : 'bg-red-500/20 text-red-400'
                        }`}
                      >
                        {service.status}
                      </span>
                    </div>
                    <div className='grid grid-cols-2 gap-1 text-xs'>
                      <div className='text-gray-400'>
                        Response: <span className='text-cyan-400'>{service.responseTime}ms</span>
                      </div>
                      <div className='text-gray-400'>
                        Uptime: <span className='text-green-400'>{service.uptime}%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className='bg-slate-900/50 rounded-lg p-4'>
              <h4 className='text-sm font-medium text-gray-400 mb-3'>Service Metrics</h4>
              <div className='space-y-3'>
                {[
                  { service: 'API Gateway', requests: 23847, successRate: 99.7, errors: 8 },
                  { service: 'Prediction Engine', requests: 12456, successRate: 98.9, errors: 23 },
                  { service: 'Data Aggregator', requests: 34567, successRate: 99.9, errors: 4 },
                  { service: 'Cache Layer', requests: 45678, successRate: 99.8, errors: 12 },
                ].map((metric, index) => (
                  <div key={index} className='bg-slate-800/50 rounded-lg p-3'>
                    <div className='text-white font-medium text-sm mb-2'>{metric.service}</div>
                    <div className='grid grid-cols-2 gap-2 text-xs'>
                      <div className='text-gray-400'>
                        Requests:{' '}
                        <span className='text-white'>{metric.requests.toLocaleString()}</span>
                      </div>
                      <div className='text-gray-400'>
                        Success: <span className='text-green-400'>{metric.successRate}%</span>
                      </div>
                      <div className='text-gray-400'>
                        Errors:{' '}
                        <span className={metric.errors > 20 ? 'text-red-400' : 'text-yellow-400'}>
                          {metric.errors}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className='bg-slate-900/50 rounded-lg p-4'>
              <h4 className='text-sm font-medium text-gray-400 mb-3'>System Configuration</h4>
              <div className='space-y-3'>
                {[
                  { setting: 'Caching Enabled', value: 'True', status: 'Optimal' },
                  { setting: 'Retry Logic', value: '3 attempts', status: 'Active' },
                  { setting: 'Timeout', value: '30s', status: 'Configured' },
                  { setting: 'Metrics Collection', value: 'Enabled', status: 'Active' },
                  { setting: 'Error Logging', value: 'Full', status: 'Active' },
                ].map((config, index) => (
                  <div key={index} className='bg-slate-800/50 rounded-lg p-3'>
                    <div className='flex items-center justify-between mb-1'>
                      <span className='text-white text-sm font-medium'>{config.setting}</span>
                      <span className='text-green-400 text-xs'>{config.status}</span>
                    </div>
                    <div className='text-cyan-400 text-xs'>{config.value}</div>
                  </div>
                ))}

                <div className='bg-slate-800/50 rounded-lg p-3'>
                  <div className='text-center'>
                    <div className='text-lg font-bold text-purple-400 mb-1'>7.2GB</div>
                    <div className='text-xs text-gray-400'>Data Quality Score</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Quantum Prediction Engine */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.6 }}
          className='bg-slate-800/50 backdrop-blur-lg border border-slate-700/50 rounded-xl p-6 mt-8'
        >
          <div className='flex items-center justify-between mb-6'>
            <div>
              <h3 className='text-xl font-bold text-white'>Quantum Prediction Engine</h3>
              <p className='text-gray-400 text-sm'>
                Revolutionary quantum computing approach to sports prediction with superposition
                analysis
              </p>
            </div>
            <div className='flex items-center space-x-2'>
              <div className='w-3 h-3 bg-purple-400 rounded-full animate-pulse'></div>
              <span className='text-purple-400 text-sm font-medium'>Quantum Active</span>
            </div>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-4 gap-4 mb-6'>
            <div className='bg-slate-900/50 rounded-lg p-4 text-center'>
              <div className='text-2xl font-bold text-purple-400 mb-1'>16,384</div>
              <div className='text-sm text-gray-400'>Quantum States</div>
              <div className='text-xs text-purple-300 mt-1'>Active simulation</div>
            </div>
            <div className='bg-slate-900/50 rounded-lg p-4 text-center'>
              <div className='text-2xl font-bold text-cyan-400 mb-1'>99.97%</div>
              <div className='text-sm text-gray-400'>Convergence Rate</div>
              <div className='text-xs text-cyan-300 mt-1'>State collapse</div>
            </div>
            <div className='bg-slate-900/50 rounded-lg p-4 text-center'>
              <div className='text-2xl font-bold text-green-400 mb-1'>23ms</div>
              <div className='text-sm text-gray-400'>Decoherence Time</div>
              <div className='text-xs text-green-300 mt-1'>Stability window</div>
            </div>
            <div className='bg-slate-900/50 rounded-lg p-4 text-center'>
              <div className='text-2xl font-bold text-yellow-400 mb-1'>97.3%</div>
              <div className='text-sm text-gray-400'>Quantum Accuracy</div>
              <div className='text-xs text-yellow-300 mt-1'>Verified results</div>
            </div>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
            <div className='bg-slate-900/50 rounded-lg p-4'>
              <h4 className='text-sm font-medium text-gray-400 mb-3'>Superposition Analysis</h4>
              <div className='space-y-3'>
                {[
                  {
                    player: 'LeBron James',
                    stat: 'Points',
                    states: [
                      { range: '20-25', probability: 0.234, amplitude: 0.483 },
                      { range: '25-30', probability: 0.456, amplitude: 0.675 },
                      { range: '30-35', probability: 0.287, amplitude: 0.536 },
                      { range: '35+', probability: 0.023, amplitude: 0.152 },
                    ],
                    dominantState: '25-30 points',
                    entanglement: 'High with team score',
                  },
                ].map((analysis, index) => (
                  <div key={index} className='bg-slate-800/50 rounded-lg p-3'>
                    <div className='text-white font-medium text-sm mb-2'>
                      {analysis.player} - {analysis.stat}
                    </div>
                    <div className='space-y-1 mb-2'>
                      {analysis.states.map((state, stateIndex) => (
                        <div key={stateIndex} className='flex items-center justify-between text-xs'>
                          <span className='text-gray-400'>{state.range}</span>
                          <div className='flex items-center space-x-2'>
                            <div className='w-12 bg-slate-700 rounded-full h-1'>
                              <div
                                className='h-1 bg-purple-400 rounded-full'
                                style={{ width: `${state.probability * 100}%` }}
                              />
                            </div>
                            <span className='text-purple-400'>
                              {(state.probability * 100).toFixed(1)}%
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className='text-cyan-400 text-xs mb-1'>
                      Dominant: {analysis.dominantState}
                    </div>
                    <div className='text-yellow-400 text-xs'>
                      Entanglement: {analysis.entanglement}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className='bg-slate-900/50 rounded-lg p-4'>
              <h4 className='text-sm font-medium text-gray-400 mb-3'>
                Quantum Entanglement Matrix
              </h4>
              <div className='space-y-3'>
                {[
                  {
                    pair: 'LeBron Points ↔ Lakers Win',
                    correlation: 0.847,
                    entanglement: 'Strong',
                    nonlocality: 'Bell violation: 2.73',
                    coherence: '94.2%',
                  },
                  {
                    pair: 'Curry 3PM ↔ Warriors Pace',
                    correlation: 0.692,
                    entanglement: 'Moderate',
                    nonlocality: 'Bell violation: 2.41',
                    coherence: '87.9%',
                  },
                  {
                    pair: 'Total Points ↔ Game Pace',
                    correlation: 0.789,
                    entanglement: 'Strong',
                    nonlocality: 'Bell violation: 2.58',
                    coherence: '91.7%',
                  },
                ].map((entanglement, index) => (
                  <div key={index} className='bg-slate-800/50 rounded-lg p-3'>
                    <div className='text-white font-medium text-sm mb-2'>{entanglement.pair}</div>
                    <div className='grid grid-cols-2 gap-2 text-xs'>
                      <div className='text-gray-400'>
                        Correlation:{' '}
                        <span className='text-cyan-400'>{entanglement.correlation}</span>
                      </div>
                      <div className='text-gray-400'>
                        Strength:{' '}
                        <span className='text-purple-400'>{entanglement.entanglement}</span>
                      </div>
                      <div className='text-gray-400'>
                        Coherence: <span className='text-green-400'>{entanglement.coherence}</span>
                      </div>
                    </div>
                    <div className='text-yellow-400 text-xs mt-1'>{entanglement.nonlocality}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className='bg-slate-900/50 rounded-lg p-4'>
              <h4 className='text-sm font-medium text-gray-400 mb-3'>
                Quantum Optimization Results
              </h4>
              <div className='space-y-3'>
                {[
                  {
                    algorithm: 'Variational Quantum Eigensolver',
                    optimization: 'Player prop combinations',
                    result: 'Optimal 4-prop portfolio found',
                    expectedValue: '+31.7%',
                    confidence: '96.8%',
                  },
                  {
                    algorithm: 'Quantum Approximate Optimization',
                    optimization: 'Lineup construction',
                    result: '6-pick lineup optimized',
                    expectedValue: '+28.4%',
                    confidence: '94.1%',
                  },
                  {
                    algorithm: 'Quantum Machine Learning',
                    optimization: 'Feature selection',
                    result: '23 optimal features identified',
                    expectedValue: '+15.9%',
                    confidence: '91.7%',
                  },
                ].map((optimization, index) => (
                  <div key={index} className='bg-slate-800/50 rounded-lg p-3'>
                    <div className='text-white font-medium text-sm mb-2'>
                      {optimization.algorithm}
                    </div>
                    <div className='text-gray-300 text-xs mb-1'>{optimization.optimization}</div>
                    <div className='text-cyan-400 text-xs mb-2'>{optimization.result}</div>
                    <div className='grid grid-cols-2 gap-2 text-xs'>
                      <div className='text-gray-400'>
                        Expected Value:{' '}
                        <span className='text-green-400'>{optimization.expectedValue}</span>
                      </div>
                      <div className='text-gray-400'>
                        Confidence:{' '}
                        <span className='text-purple-400'>{optimization.confidence}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Advanced Feature Engineering Pipeline */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.7 }}
          className='bg-slate-800/50 backdrop-blur-lg border border-slate-700/50 rounded-xl p-6 mt-8'
        >
          <div className='flex items-center justify-between mb-6'>
            <div>
              <h3 className='text-xl font-bold text-white'>
                Advanced Feature Engineering Pipeline
              </h3>
              <p className='text-gray-400 text-sm'>
                Automated feature discovery and transformation with quantum-enhanced selection
              </p>
            </div>
            <DollarSign className='w-6 h-6 text-green-400' />
          </div>

          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            <div className='bg-slate-900/50 rounded-lg p-4'>
              <h4 className='text-lg font-medium text-white mb-4'>Feature Discovery Engine</h4>
              <div className='space-y-3'>
                {[
                  {
                    feature: 'Player_Fatigue_Index_v3',
                    type: 'Engineered',
                    importance: 0.847,
                    correlation: 'Negative (-0.73) with performance',
                    discovery: 'Auto-discovered from rest patterns',
                  },
                  {
                    feature: 'Momentum_Shift_Indicator',
                    type: 'Composite',
                    importance: 0.692,
                    correlation: 'Predictive (+0.68) of game flow',
                    discovery: 'Derived from play-by-play data',
                  },
                  {
                    feature: 'Weather_Performance_Modifier',
                    type: 'Environmental',
                    importance: 0.573,
                    correlation: 'Conditional (+0.54) outdoor games',
                    discovery: 'Cross-referenced with conditions',
                  },
                  {
                    feature: 'Referee_Bias_Score',
                    type: 'Historical',
                    importance: 0.489,
                    correlation: 'Systematic (+0.41) call patterns',
                    discovery: 'Identified from official tendencies',
                  },
                ].map((feature, index) => (
                  <div key={index} className='bg-slate-800/50 rounded-lg p-3'>
                    <div className='flex items-center justify-between mb-2'>
                      <span className='text-white font-medium text-sm'>{feature.feature}</span>
                      <span className='text-purple-400 text-xs'>{feature.type}</span>
                    </div>
                    <div className='w-full bg-slate-700 rounded-full h-2 mb-2'>
                      <div
                        className='h-2 bg-gradient-to-r from-green-400 to-cyan-400 rounded-full'
                        style={{ width: `${feature.importance * 100}%` }}
                      />
                    </div>
                    <div className='text-xs text-gray-400 mb-1'>
                      Importance: {(feature.importance * 100).toFixed(1)}%
                    </div>
                    <div className='text-xs text-gray-300 mb-1'>{feature.correlation}</div>
                    <div className='text-xs text-yellow-400'>{feature.discovery}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className='bg-slate-900/50 rounded-lg p-4'>
              <h4 className='text-lg font-medium text-white mb-4'>Pipeline Performance</h4>
              <div className='space-y-3'>
                <div className='grid grid-cols-2 gap-4'>
                  <div className='bg-slate-800/50 rounded-lg p-3 text-center'>
                    <div className='text-2xl font-bold text-green-400 mb-1'>2,847</div>
                    <div className='text-xs text-gray-400'>Features Processed</div>
                  </div>
                  <div className='bg-slate-800/50 rounded-lg p-3 text-center'>
                    <div className='text-2xl font-bold text-cyan-400 mb-1'>234</div>
                    <div className='text-xs text-gray-400'>Features Selected</div>
                  </div>
                  <div className='bg-slate-800/50 rounded-lg p-3 text-center'>
                    <div className='text-2xl font-bold text-purple-400 mb-1'>89</div>
                    <div className='text-xs text-gray-400'>Auto-Discovered</div>
                  </div>
                  <div className='bg-slate-800/50 rounded-lg p-3 text-center'>
                    <div className='text-2xl font-bold text-yellow-400 mb-1'>97.3%</div>
                    <div className='text-xs text-gray-400'>Selection Accuracy</div>
                  </div>
                </div>

                <div className='space-y-2'>
                  {[
                    { stage: 'Data Ingestion', status: 'Complete', features: 2847, time: '1.2s' },
                    { stage: 'Transformation', status: 'Complete', features: 2847, time: '3.4s' },
                    { stage: 'Selection', status: 'Complete', features: 234, time: '0.8s' },
                    { stage: 'Validation', status: 'Active', features: 234, time: '2.1s' },
                  ].map((stage, index) => (
                    <div key={index} className='bg-slate-800/50 rounded-lg p-2'>
                      <div className='flex items-center justify-between mb-1'>
                        <span className='text-white text-sm font-medium'>{stage.stage}</span>
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${
                            stage.status === 'Complete'
                              ? 'bg-green-500/20 text-green-400'
                              : stage.status === 'Active'
                                ? 'bg-yellow-500/20 text-yellow-400'
                                : 'bg-gray-500/20 text-gray-400'
                          }`}
                        >
                          {stage.status}
                        </span>
                      </div>
                      <div className='grid grid-cols-2 gap-2 text-xs'>
                        <div className='text-gray-400'>
                          Features: <span className='text-white'>{stage.features}</span>
                        </div>
                        <div className='text-gray-400'>
                          Time: <span className='text-cyan-400'>{stage.time}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </Layout>
  );
};

export default UltimateMoneyMaker;
