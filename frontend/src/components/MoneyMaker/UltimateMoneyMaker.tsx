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
import Layout from '../core/Layout';

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
    const _mockOpportunities: BettingOpportunity[] = [
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
    setOpportunities(_mockOpportunities);
  }, []);

  const _runQuantumAnalysis = async () => {
    setIsAnalyzing(true);

    // Simulate comprehensive AI analysis
    await new Promise(resolve => setTimeout(resolve, 3500));

    // Generate enhanced opportunities with quantum boost
    const _enhancedOpportunities = opportunities.map(opp => ({
      ...opp,
      confidence: Math.min(opp.confidence + 2.5, 99.9),
      expectedROI: opp.expectedROI * 1.15,
      expectedProfit: opp.expectedProfit * 1.15,
    }));

    setOpportunities(_enhancedOpportunities);
    setIsAnalyzing(false);
  };

  const _getRiskColor = (risk: string) => {
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

  const _getStrategyColor = (strategy: string) => {
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

  const _totalExpectedProfit = opportunities.reduce((sum, opp) => sum + opp.expectedProfit, 0);
  const _averageROI =
    opportunities.reduce((sum, opp) => sum + opp.expectedROI, 0) / opportunities.length;
  const _averageConfidence =
    opportunities.reduce((sum, opp) => sum + opp.confidence, 0) / opportunities.length;

  return (
    <Layout
      title='Ultimate Money Maker'
      subtitle='Advanced AI-Powered Betting Engine with Neural Network Analysis'
      headerActions={
        <div className='flex items-center space-x-4'>
          <div className='text-right'>
            <div className='text-sm text-gray-400'>Total Bankroll</div>
            <div className='text-lg font-bold text-green-400'>
              ${totalBankroll.toLocaleString()}
            </div>
          </div>
          <button
            onClick={_runQuantumAnalysis}
            disabled={isAnalyzing}
            className={`flex items-center space-x-2 px-6 py-3 bg-gradient-to-r ${_getStrategyColor(config.strategy)} hover:scale-105 rounded-lg text-white font-bold transition-all disabled:opacity-50 shadow-lg`}
          >
            <Brain className={`w-5 h-5 ${isAnalyzing ? 'animate-spin' : ''}`} />
            <span>{isAnalyzing ? 'AI Analysis...' : 'Activate Advanced AI'}</span>
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
          ADVANCED AI PROFIT ENGINE
        </h2>
        <div className='grid grid-cols-1 md:grid-cols-4 gap-6'>
          <div className='text-center'>
            <div className='text-3xl font-bold text-green-400'>
              ${_totalExpectedProfit.toLocaleString()}
            </div>
            <div className='text-gray-400'>Expected Profit</div>
          </div>
          <div className='text-center'>
            <div className='text-3xl font-bold text-purple-400'>{_averageROI.toFixed(1)}%</div>
            <div className='text-gray-400'>Average ROI</div>
          </div>
          <div className='text-center'>
            <div className='text-3xl font-bold text-cyan-400'>{_averageConfidence.toFixed(1)}%</div>
            <div className='text-gray-400'>AI Confidence</div>
          </div>
          <div className='text-center'>
            <div className='text-3xl font-bold text-yellow-400'>{opportunities.length}</div>
            <div className='text-gray-400'>Active Picks</div>
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
                    className={`inline-flex px-3 py-1 rounded-full text-xs font-medium border ${_getRiskColor(opportunity.risk)}`}
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
      </motion.div>
    </Layout>
  );
};

export default UltimateMoneyMaker;
