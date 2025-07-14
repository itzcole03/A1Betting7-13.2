import { motion } from 'framer-motion';
import {
  AlertTriangle,
  BarChart3,
  DollarSign,
  PieChart,
  Settings,
  Shield,
  Target,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';

interface BankrollData {
  currentBalance: number;
  startingBalance: number;
  totalProfit: number;
  totalWagered: number;
  winRate: number;
  roi: number;
  sharpeRatio: number;
  maxDrawdown: number;
  streakData: {
    currentStreak: number;
    longestWinStreak: number;
    longestLossStreak: number;
  };
}

interface BetAllocation {
  id: string;
  game: string;
  type: string;
  confidence: number;
  kellyPercent: number;
  recommendedStake: number;
  maxStake: number;
  expectedValue: number;
  risk: 'low' | 'medium' | 'high';
}

interface RiskMetrics {
  riskLevel: 'conservative' | 'moderate' | 'aggressive';
  maxBetSize: number;
  diversificationScore: number;
  volatility: number;
  valueAtRisk: number;
}

export const BankrollManager: React.FC = () => {
  const [bankrollData, setBankrollData] = useState<BankrollData | null>(null);
  const [allocations, setAllocations] = useState<BetAllocation[]>([]);
  const [riskMetrics, setRiskMetrics] = useState<RiskMetrics | null>(null);
  const [riskLevel, setRiskLevel] = useState<'conservative' | 'moderate' | 'aggressive'>(
    'moderate'
  );
  const [targetBalance, setTargetBalance] = useState<number>(25000);
  const [kellyFraction, setKellyFraction] = useState<number>(0.25);

  useEffect(() => {
    const generateBankrollData = (): BankrollData => {
      const startingBalance = 10000;
      const currentBalance = startingBalance + (Math.random() * 15000 - 2500);
      const totalProfit = currentBalance - startingBalance;

      return {
        currentBalance,
        startingBalance,
        totalProfit,
        totalWagered: Math.floor(Math.random() * 50000 + 20000),
        winRate: 55 + Math.random() * 20,
        roi: (totalProfit / startingBalance) * 100,
        sharpeRatio: 1.2 + Math.random() * 0.8,
        maxDrawdown: Math.random() * 15 + 5,
        streakData: {
          currentStreak: Math.floor(Math.random() * 10) - 5,
          longestWinStreak: Math.floor(Math.random() * 15) + 5,
          longestLossStreak: Math.floor(Math.random() * 8) + 2,
        },
      };
    };

    const generateBetAllocations = (): BetAllocation[] => {
      const games = [
        { game: 'Lakers vs Warriors', type: 'Spread' },
        { game: 'Chiefs vs Bills', type: 'Total' },
        { game: 'Yankees vs Red Sox', type: 'Moneyline' },
        { game: 'Celtics vs Heat', type: 'Player Props' },
        { game: 'Rangers vs Lightning', type: 'Puck Line' },
      ];

      return games.map((g, index) => {
        const confidence = 60 + Math.random() * 35;
        const kellyPercent = ((confidence - 50) / 10) * kellyFraction;
        const currentBalance = 18500; // Use current balance

        return {
          id: `allocation-${index}`,
          ...g,
          confidence,
          kellyPercent: Math.max(0, Math.min(kellyPercent, 5)),
          recommendedStake: Math.max(0, (kellyPercent / 100) * currentBalance),
          maxStake: (kellyPercent / 100) * currentBalance * 2,
          expectedValue: confidence > 65 ? Math.random() * 8 + 2 : Math.random() * 4,
          risk: confidence > 80 ? 'low' : confidence > 65 ? 'medium' : 'high',
        };
      });
    };

    const generateRiskMetrics = (): RiskMetrics => {
      return {
        riskLevel,
        maxBetSize: riskLevel === 'conservative' ? 2 : riskLevel === 'moderate' ? 5 : 8,
        diversificationScore: 75 + Math.random() * 20,
        volatility:
          riskLevel === 'conservative'
            ? 8 + Math.random() * 5
            : riskLevel === 'moderate'
              ? 12 + Math.random() * 8
              : 18 + Math.random() * 12,
        valueAtRisk: Math.random() * 15 + 5,
      };
    };

    setBankrollData(generateBankrollData());
    setAllocations(generateBetAllocations());
    setRiskMetrics(generateRiskMetrics());
  }, [riskLevel, kellyFraction]);

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low':
        return 'text-green-400 border-green-400';
      case 'medium':
        return 'text-yellow-400 border-yellow-400';
      case 'high':
        return 'text-red-400 border-red-400';
      default:
        return 'text-gray-400 border-gray-400';
    }
  };

  const getStreakColor = (streak: number) => {
    if (streak > 0) return 'text-green-400';
    if (streak < 0) return 'text-red-400';
    return 'text-gray-400';
  };

  const calculateOptimalBankroll = () => {
    if (!bankrollData) return 0;
    const winRate = bankrollData.winRate / 100;
    const avgOdds = 2.0; // Assume average odds of 2.0
    const kellyOptimal = (winRate * avgOdds - 1) / (avgOdds - 1);
    return bankrollData.currentBalance * kellyOptimal;
  };

  return (
    <div className='space-y-8'>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className='text-center'
      >
        <Card className='p-12 bg-gradient-to-r from-green-900/20 to-emerald-900/20 border-green-500/30'>
          <h1 className='text-5xl font-black bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent mb-4'>
            BANKROLL MANAGER
          </h1>
          <p className='text-xl text-gray-300 mb-8'>Advanced Portfolio & Risk Management</p>

          <div className='flex items-center justify-center gap-8'>
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 3, repeat: Infinity }}
              className='text-green-500'
            >
              <DollarSign className='w-12 h-12' />
            </motion.div>

            {bankrollData && (
              <div className='grid grid-cols-4 gap-8 text-center'>
                <div>
                  <div className='text-3xl font-bold text-green-400'>
                    ${bankrollData.currentBalance.toLocaleString()}
                  </div>
                  <div className='text-gray-400'>Current Balance</div>
                </div>
                <div>
                  <div
                    className={`text-3xl font-bold ${bankrollData.totalProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}
                  >
                    {bankrollData.totalProfit >= 0 ? '+' : ''}$
                    {bankrollData.totalProfit.toLocaleString()}
                  </div>
                  <div className='text-gray-400'>Total P&L</div>
                </div>
                <div>
                  <div className='text-3xl font-bold text-blue-400'>
                    {bankrollData.winRate.toFixed(1)}%
                  </div>
                  <div className='text-gray-400'>Win Rate</div>
                </div>
                <div>
                  <div
                    className={`text-3xl font-bold ${bankrollData.roi >= 0 ? 'text-green-400' : 'text-red-400'}`}
                  >
                    {bankrollData.roi >= 0 ? '+' : ''}
                    {bankrollData.roi.toFixed(1)}%
                  </div>
                  <div className='text-gray-400'>ROI</div>
                </div>
              </div>
            )}
          </div>
        </Card>
      </motion.div>

      {/* Risk Settings */}
      <Card className='p-6'>
        <div className='grid grid-cols-1 lg:grid-cols-4 gap-6'>
          <div>
            <label htmlFor='risk-level-select' className='block text-sm text-gray-400 mb-2'>
              Risk Level
            </label>
            <select
              id='risk-level-select'
              value={riskLevel}
              onChange={e => setRiskLevel(e.target.value as any)}
              className='w-full p-2 bg-gray-800 border border-gray-700 rounded-lg'
              aria-label='Risk level'
            >
              <option value='conservative'>Conservative</option>
              <option value='moderate'>Moderate</option>
              <option value='aggressive'>Aggressive</option>
            </select>
          </div>

          <div>
            <label className='block text-sm text-gray-400 mb-2'>
              Kelly Fraction: {kellyFraction}
            </label>
            <input
              type='range'
              min='0.1'
              max='1'
              step='0.05'
              value={kellyFraction}
              onChange={e => setKellyFraction(parseFloat(e.target.value))}
              className='w-full'
              aria-label='Kelly fraction'
            />
          </div>

          <div>
            <label htmlFor='target-balance-input' className='block text-sm text-gray-400 mb-2'>
              Target Balance
            </label>
            <input
              id='target-balance-input'
              type='number'
              value={targetBalance}
              onChange={e => setTargetBalance(parseInt(e.target.value) || 0)}
              className='w-full p-2 bg-gray-800 border border-gray-700 rounded-lg'
              aria-label='Target balance'
              placeholder='Target balance'
            />
          </div>

          <div className='flex items-end'>
            <Button className='w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700'>
              <Settings className='w-4 h-4 mr-2' />
              Update Settings
            </Button>
          </div>
        </div>
      </Card>

      {/* Main Content */}
      <div className='grid grid-cols-1 xl:grid-cols-3 gap-8'>
        {/* Performance Metrics */}
        <div className='xl:col-span-2 space-y-6'>
          {/* Bankroll Stats */}
          <Card className='p-6'>
            <h3 className='text-xl font-bold text-white mb-4 flex items-center gap-2'>
              <BarChart3 className='w-5 h-5 text-green-400' />
              Performance Analytics
            </h3>

            {bankrollData && (
              <div className='grid grid-cols-2 lg:grid-cols-4 gap-6'>
                <div className='text-center'>
                  <div className='text-2xl font-bold text-purple-400'>
                    {bankrollData.sharpeRatio.toFixed(2)}
                  </div>
                  <div className='text-sm text-gray-400'>Sharpe Ratio</div>
                </div>

                <div className='text-center'>
                  <div className='text-2xl font-bold text-red-400'>
                    -{bankrollData.maxDrawdown.toFixed(1)}%
                  </div>
                  <div className='text-sm text-gray-400'>Max Drawdown</div>
                </div>

                <div className='text-center'>
                  <div className='text-2xl font-bold text-blue-400'>
                    ${bankrollData.totalWagered.toLocaleString()}
                  </div>
                  <div className='text-sm text-gray-400'>Total Wagered</div>
                </div>

                <div className='text-center'>
                  <div
                    className={`text-2xl font-bold ${getStreakColor(bankrollData.streakData.currentStreak)}`}
                  >
                    {bankrollData.streakData.currentStreak > 0 ? '+' : ''}
                    {bankrollData.streakData.currentStreak}
                  </div>
                  <div className='text-sm text-gray-400'>Current Streak</div>
                </div>
              </div>
            )}
          </Card>

          {/* Bet Allocations */}
          <Card className='p-6'>
            <h3 className='text-xl font-bold text-white mb-4 flex items-center gap-2'>
              <Target className='w-5 h-5 text-blue-400' />
              Recommended Allocations
            </h3>

            <div className='space-y-4'>
              {allocations.map((allocation, index) => (
                <motion.div
                  key={allocation.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className='p-4 bg-slate-800/50 rounded-lg border border-slate-700/50'
                >
                  <div className='flex items-start justify-between mb-3'>
                    <div>
                      <h4 className='font-bold text-white text-sm'>{allocation.game}</h4>
                      <p className='text-gray-400 text-xs'>{allocation.type}</p>
                    </div>

                    <div className='flex items-center gap-2'>
                      <Badge variant='outline' className={getRiskColor(allocation.risk)}>
                        {allocation.risk}
                      </Badge>
                      <Badge variant='outline' className='text-green-400 border-green-400'>
                        {allocation.confidence.toFixed(0)}%
                      </Badge>
                    </div>
                  </div>

                  <div className='grid grid-cols-2 lg:grid-cols-4 gap-3 text-sm'>
                    <div>
                      <span className='text-gray-400'>Kelly %:</span>
                      <div className='text-blue-400 font-bold'>
                        {allocation.kellyPercent.toFixed(2)}%
                      </div>
                    </div>
                    <div>
                      <span className='text-gray-400'>Recommended:</span>
                      <div className='text-green-400 font-bold'>
                        ${allocation.recommendedStake.toFixed(0)}
                      </div>
                    </div>
                    <div>
                      <span className='text-gray-400'>Max Stake:</span>
                      <div className='text-yellow-400 font-bold'>
                        ${allocation.maxStake.toFixed(0)}
                      </div>
                    </div>
                    <div>
                      <span className='text-gray-400'>Expected Value:</span>
                      <div className='text-purple-400 font-bold'>
                        +{allocation.expectedValue.toFixed(1)}%
                      </div>
                    </div>
                  </div>

                  <div className='mt-3'>
                    <div className='flex justify-between text-xs mb-1'>
                      <span className='text-gray-400'>Confidence Level</span>
                      <span className='text-white'>{allocation.confidence.toFixed(1)}%</span>
                    </div>
                    <div className='w-full bg-gray-700 rounded-full h-2'>
                      <motion.div
                        className='bg-gradient-to-r from-green-400 to-green-500 h-2 rounded-full'
                        animate={{ width: `${allocation.confidence}%` }}
                        transition={{ duration: 1, delay: index * 0.1 }}
                      />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </Card>
        </div>

        {/* Risk Management */}
        <div className='space-y-6'>
          {/* Risk Metrics */}
          <Card className='p-6'>
            <h4 className='text-lg font-bold text-white mb-4 flex items-center gap-2'>
              <Shield className='w-5 h-5 text-red-400' />
              Risk Analysis
            </h4>

            {riskMetrics && (
              <div className='space-y-4'>
                <div>
                  <div className='flex justify-between text-sm mb-1'>
                    <span className='text-gray-400'>Risk Level</span>
                    <span className='text-white capitalize'>{riskMetrics.riskLevel}</span>
                  </div>
                  <Badge
                    variant='outline'
                    className={
                      riskMetrics.riskLevel === 'conservative'
                        ? 'text-green-400 border-green-400'
                        : riskMetrics.riskLevel === 'moderate'
                          ? 'text-yellow-400 border-yellow-400'
                          : 'text-red-400 border-red-400'
                    }
                  >
                    {riskMetrics.riskLevel.toUpperCase()}
                  </Badge>
                </div>

                <div>
                  <div className='flex justify-between text-sm mb-1'>
                    <span className='text-gray-400'>Max Bet Size</span>
                    <span className='text-red-400 font-bold'>{riskMetrics.maxBetSize}%</span>
                  </div>
                  <div className='w-full bg-gray-700 rounded-full h-2'>
                    <motion.div
                      className='bg-gradient-to-r from-red-400 to-red-500 h-2 rounded-full'
                      animate={{ width: `${riskMetrics.maxBetSize * 10}%` }}
                      transition={{ duration: 1 }}
                    />
                  </div>
                </div>

                <div>
                  <div className='flex justify-between text-sm mb-1'>
                    <span className='text-gray-400'>Diversification</span>
                    <span className='text-green-400 font-bold'>
                      {riskMetrics.diversificationScore.toFixed(0)}%
                    </span>
                  </div>
                  <div className='w-full bg-gray-700 rounded-full h-2'>
                    <motion.div
                      className='bg-gradient-to-r from-green-400 to-green-500 h-2 rounded-full'
                      animate={{ width: `${riskMetrics.diversificationScore}%` }}
                      transition={{ duration: 1 }}
                    />
                  </div>
                </div>

                <div>
                  <div className='flex justify-between text-sm mb-1'>
                    <span className='text-gray-400'>Volatility</span>
                    <span className='text-orange-400 font-bold'>
                      {riskMetrics.volatility.toFixed(1)}%
                    </span>
                  </div>
                  <div className='w-full bg-gray-700 rounded-full h-2'>
                    <motion.div
                      className='bg-gradient-to-r from-orange-400 to-orange-500 h-2 rounded-full'
                      animate={{ width: `${Math.min(riskMetrics.volatility * 2, 100)}%` }}
                      transition={{ duration: 1 }}
                    />
                  </div>
                </div>

                <div>
                  <div className='flex justify-between text-sm mb-1'>
                    <span className='text-gray-400'>Value at Risk (95%)</span>
                    <span className='text-purple-400 font-bold'>
                      {riskMetrics.valueAtRisk.toFixed(1)}%
                    </span>
                  </div>
                  <div className='w-full bg-gray-700 rounded-full h-2'>
                    <motion.div
                      className='bg-gradient-to-r from-purple-400 to-purple-500 h-2 rounded-full'
                      animate={{ width: `${riskMetrics.valueAtRisk * 5}%` }}
                      transition={{ duration: 1 }}
                    />
                  </div>
                </div>
              </div>
            )}
          </Card>

          {/* Kelly Calculator */}
          <Card className='p-6'>
            <h4 className='text-lg font-bold text-white mb-4 flex items-center gap-2'>
              <PieChart className='w-5 h-5 text-blue-400' />
              Kelly Calculator
            </h4>

            <div className='space-y-4 text-sm'>
              <div className='p-3 bg-slate-800/50 rounded-lg'>
                <div className='flex justify-between mb-2'>
                  <span className='text-gray-400'>Optimal Bankroll</span>
                  <span className='text-blue-400 font-bold'>
                    ${calculateOptimalBankroll().toFixed(0)}
                  </span>
                </div>
                <div className='text-xs text-gray-500'>
                  Based on current win rate and Kelly criterion
                </div>
              </div>

              <div className='p-3 bg-slate-800/50 rounded-lg'>
                <div className='flex justify-between mb-2'>
                  <span className='text-gray-400'>Recommended Unit Size</span>
                  <span className='text-green-400 font-bold'>
                    ${bankrollData ? (bankrollData.currentBalance * 0.01).toFixed(0) : 0}
                  </span>
                </div>
                <div className='text-xs text-gray-500'>1% of current bankroll (conservative)</div>
              </div>

              {bankrollData && (
                <div className='p-3 bg-slate-800/50 rounded-lg'>
                  <div className='flex justify-between mb-2'>
                    <span className='text-gray-400'>Progress to Target</span>
                    <span className='text-purple-400 font-bold'>
                      {((bankrollData.currentBalance / targetBalance) * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className='w-full bg-gray-700 rounded-full h-2'>
                    <motion.div
                      className='bg-gradient-to-r from-purple-400 to-purple-500 h-2 rounded-full'
                      animate={{
                        width: `${Math.min((bankrollData.currentBalance / targetBalance) * 100, 100)}%`,
                      }}
                      transition={{ duration: 1 }}
                    />
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Streak Information */}
          {bankrollData && (
            <Card className='p-6'>
              <h4 className='text-lg font-bold text-white mb-4'>Streak Analysis</h4>

              <div className='space-y-3 text-sm'>
                <div className='flex justify-between'>
                  <span className='text-gray-400'>Current Streak:</span>
                  <span
                    className={`font-bold ${getStreakColor(bankrollData.streakData.currentStreak)}`}
                  >
                    {bankrollData.streakData.currentStreak > 0 ? '+' : ''}
                    {bankrollData.streakData.currentStreak}
                    {bankrollData.streakData.currentStreak > 0
                      ? ' W'
                      : bankrollData.streakData.currentStreak < 0
                        ? ' L'
                        : ' -'}
                  </span>
                </div>

                <div className='flex justify-between'>
                  <span className='text-gray-400'>Longest Win Streak:</span>
                  <span className='text-green-400 font-bold'>
                    {bankrollData.streakData.longestWinStreak} W
                  </span>
                </div>

                <div className='flex justify-between'>
                  <span className='text-gray-400'>Longest Loss Streak:</span>
                  <span className='text-red-400 font-bold'>
                    {bankrollData.streakData.longestLossStreak} L
                  </span>
                </div>
              </div>

              {Math.abs(bankrollData.streakData.currentStreak) > 3 && (
                <div className='mt-4 p-3 bg-yellow-900/20 border border-yellow-500/30 rounded-lg'>
                  <div className='flex items-center gap-2'>
                    <AlertTriangle className='w-4 h-4 text-yellow-400' />
                    <span className='text-yellow-400 text-sm font-bold'>Streak Alert</span>
                  </div>
                  <p className='text-yellow-300 text-xs mt-1'>
                    {bankrollData.streakData.currentStreak > 0
                      ? 'Consider maintaining discipline during winning streaks'
                      : 'Consider reducing bet sizes during losing streaks'}
                  </p>
                </div>
              )}
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};
