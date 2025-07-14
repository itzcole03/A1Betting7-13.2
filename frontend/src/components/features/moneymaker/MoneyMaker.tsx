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
} from 'lucide-react';
import { Layout } from '../../core/Layout';

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
}

const MoneyMaker: React.FC = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [opportunities, setOpportunities] = useState<BettingOpportunity[]>([]);
  const [totalBankroll, setTotalBankroll] = useState(10000);

  useEffect(() => {
    // Mock data - replace with real API calls
    const mockOpportunities: BettingOpportunity[] = [
      {
        id: '1',
        game: 'Lakers vs Warriors',
        market: 'Over 225.5 Total Points',
        confidence: 94.2,
        expectedROI: 23.4,
        kellyStake: 2500,
        expectedProfit: 585,
        odds: 1.92,
        risk: 'low',
      },
      {
        id: '2',
        game: 'Mahomes 300+ Passing Yards',
        market: 'Player Props',
        confidence: 89.7,
        expectedROI: 18.2,
        kellyStake: 1800,
        expectedProfit: 327,
        odds: 2.15,
        risk: 'medium',
      },
      {
        id: '3',
        game: 'Celtics -4.5 vs Heat',
        market: 'Point Spread',
        confidence: 92.1,
        expectedROI: 15.8,
        kellyStake: 2200,
        expectedProfit: 347,
        odds: 1.87,
        risk: 'low',
      },
    ];
    setOpportunities(mockOpportunities);
  }, []);

  const runAnalysis = async () => {
    setIsAnalyzing(true);
    // Simulate AI analysis
    await new Promise(resolve => setTimeout(resolve, 3000));
    setIsAnalyzing(false);
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low':
        return 'text-green-400 bg-green-500/20';
      case 'medium':
        return 'text-yellow-400 bg-yellow-500/20';
      case 'high':
        return 'text-red-400 bg-red-500/20';
      default:
        return 'text-gray-400 bg-gray-500/20';
    }
  };

  return (
    <Layout
      title='Money Maker'
      subtitle='AI-Powered Betting Recommendations & Portfolio Optimization'
      headerActions={
        <div className='flex items-center space-x-3'>
          <div className='text-right'>
            <div className='text-sm text-gray-400'>Total Bankroll</div>
            <div className='text-lg font-bold text-green-400'>
              ${totalBankroll.toLocaleString()}
            </div>
          </div>
          <button
            onClick={runAnalysis}
            disabled={isAnalyzing}
            className='flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-green-500 to-cyan-500 hover:from-green-600 hover:to-cyan-600 rounded-lg text-white font-medium transition-all disabled:opacity-50'
          >
            <Brain className={`w-4 h-4 ${isAnalyzing ? 'animate-pulse' : ''}`} />
            <span>{isAnalyzing ? 'Analyzing...' : 'Run Analysis'}</span>
          </button>
        </div>
      }
    >
      {/* Portfolio Summary */}
      <div className='grid grid-cols-1 md:grid-cols-4 gap-6 mb-6'>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className='bg-slate-800/50 backdrop-blur-lg border border-slate-700/50 rounded-xl p-6'
        >
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-gray-400 text-sm'>Expected Profit</p>
              <p className='text-2xl font-bold text-green-400'>+$1,259</p>
              <p className='text-xs text-green-300 mt-1'>Today's opportunities</p>
            </div>
            <DollarSign className='w-8 h-8 text-green-400' />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className='bg-slate-800/50 backdrop-blur-lg border border-slate-700/50 rounded-xl p-6'
        >
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-gray-400 text-sm'>Portfolio ROI</p>
              <p className='text-2xl font-bold text-purple-400'>+19.2%</p>
              <p className='text-xs text-purple-300 mt-1'>Weighted average</p>
            </div>
            <TrendingUp className='w-8 h-8 text-purple-400' />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className='bg-slate-800/50 backdrop-blur-lg border border-slate-700/50 rounded-xl p-6'
        >
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-gray-400 text-sm'>AI Confidence</p>
              <p className='text-2xl font-bold text-cyan-400'>92.1%</p>
              <p className='text-xs text-cyan-300 mt-1'>Model consensus</p>
            </div>
            <Brain className='w-8 h-8 text-cyan-400' />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className='bg-slate-800/50 backdrop-blur-lg border border-slate-700/50 rounded-xl p-6'
        >
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-gray-400 text-sm'>Opportunities</p>
              <p className='text-2xl font-bold text-yellow-400'>{opportunities.length}</p>
              <p className='text-xs text-yellow-300 mt-1'>Active bets</p>
            </div>
            <Target className='w-8 h-8 text-yellow-400' />
          </div>
        </motion.div>
      </div>

      {/* Betting Opportunities */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className='bg-slate-800/50 backdrop-blur-lg border border-slate-700/50 rounded-xl p-6'
      >
        <div className='flex items-center justify-between mb-6'>
          <div>
            <h3 className='text-xl font-bold text-white'>Top Opportunities</h3>
            <p className='text-gray-400 text-sm'>
              Optimized for maximum return with Kelly Criterion
            </p>
          </div>
          <div className='flex items-center space-x-2'>
            <Zap className='w-5 h-5 text-yellow-400' />
            <span className='text-yellow-400 text-sm font-medium'>Live Analysis</span>
          </div>
        </div>

        <div className='space-y-4'>
          {opportunities.map((opportunity, index) => (
            <motion.div
              key={opportunity.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 + index * 0.1 }}
              className='bg-slate-900/50 border border-slate-700/50 rounded-lg p-6 hover:border-cyan-500/30 transition-all group'
            >
              <div className='flex items-start justify-between mb-4'>
                <div>
                  <h4 className='font-bold text-white text-lg'>{opportunity.game}</h4>
                  <p className='text-gray-300'>{opportunity.market}</p>
                </div>
                <div className='text-right'>
                  <div className='text-2xl font-bold text-green-400'>
                    +{opportunity.expectedROI}%
                  </div>
                  <div className='text-sm text-gray-400'>Expected ROI</div>
                </div>
              </div>

              <div className='grid grid-cols-2 md:grid-cols-4 gap-4 mb-4'>
                <div>
                  <div className='text-sm text-gray-400'>Kelly Stake</div>
                  <div className='font-bold text-white'>
                    ${opportunity.kellyStake.toLocaleString()}
                  </div>
                </div>
                <div>
                  <div className='text-sm text-gray-400'>Expected Profit</div>
                  <div className='font-bold text-green-400'>+${opportunity.expectedProfit}</div>
                </div>
                <div>
                  <div className='text-sm text-gray-400'>Confidence</div>
                  <div className='font-bold text-cyan-400'>{opportunity.confidence}%</div>
                </div>
                <div>
                  <div className='text-sm text-gray-400'>Risk Level</div>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${getRiskColor(opportunity.risk)}`}
                  >
                    {opportunity.risk.toUpperCase()}
                  </span>
                </div>
              </div>

              <div className='flex items-center justify-between pt-4 border-t border-slate-700/50'>
                <div className='flex items-center space-x-4 text-sm text-gray-400'>
                  <span>Odds: {opportunity.odds}</span>
                  <span>•</span>
                  <span>Model Consensus: 47/47</span>
                </div>
                <button className='px-4 py-2 bg-gradient-to-r from-green-500 to-cyan-500 hover:from-green-600 hover:to-cyan-600 rounded-lg text-white font-medium transition-all group-hover:scale-105'>
                  Place Bet
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* AI Analysis Panel */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className='bg-slate-800/50 backdrop-blur-lg border border-slate-700/50 rounded-xl p-6'
      >
        <div className='flex items-center space-x-3 mb-4'>
          <Brain className='w-6 h-6 text-purple-400' />
          <h3 className='text-xl font-bold text-white'>AI Analysis Engine</h3>
        </div>

        <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
          <div className='text-center'>
            <div className='w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-3'>
              <Calculator className='w-8 h-8 text-purple-400' />
            </div>
            <div className='text-lg font-bold text-white'>Kelly Criterion</div>
            <div className='text-sm text-gray-400'>Optimal stake calculation</div>
          </div>

          <div className='text-center'>
            <div className='w-16 h-16 bg-cyan-500/20 rounded-full flex items-center justify-center mx-auto mb-3'>
              <BarChart3 className='w-8 h-8 text-cyan-400' />
            </div>
            <div className='text-lg font-bold text-white'>Portfolio Theory</div>
            <div className='text-sm text-gray-400'>Risk-adjusted optimization</div>
          </div>

          <div className='text-center'>
            <div className='w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-3'>
              <TrendingUp className='w-8 h-8 text-green-400' />
            </div>
            <div className='text-lg font-bold text-white'>ML Ensemble</div>
            <div className='text-sm text-gray-400'>47+ predictive models</div>
          </div>
        </div>
      </motion.div>
    </Layout>
  );
};

export default MoneyMaker;
