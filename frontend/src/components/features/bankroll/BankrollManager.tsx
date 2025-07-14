import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  DollarSign,
  PieChart,
  Target,
  Shield,
  AlertTriangle,
  Calculator,
  RefreshCw,
  BarChart3,
  Clock,
  Users,
  Settings,
  Plus,
  Minus,
} from 'lucide-react';
import { Layout } from '../../core/Layout';

interface BankrollAccount {
  id: string;
  name: string;
  balance: number;
  initialBalance: number;
  currency: string;
  type: 'primary' | 'hedge' | 'recreational';
  riskLevel: 'conservative' | 'moderate' | 'aggressive';
  allocation: number;
  lastUpdated: Date;
}

interface Transaction {
  id: string;
  accountId: string;
  type: 'deposit' | 'withdrawal' | 'bet_placed' | 'bet_won' | 'bet_lost';
  amount: number;
  description: string;
  timestamp: Date;
  metadata?: {
    betId?: string;
    odds?: number;
    sport?: string;
  };
}

interface RiskMetrics {
  totalBankroll: number;
  availableBalance: number;
  lockedInBets: number;
  roi: number;
  sharpeRatio: number;
  maxDrawdown: number;
  winRate: number;
  avgBetSize: number;
  riskScore: number;
  diversificationIndex: number;
}

interface AllocationTarget {
  category: string;
  currentPercentage: number;
  targetPercentage: number;
  amount: number;
  color: string;
}

const BankrollManager: React.FC = () => {
  const [accounts, setAccounts] = useState<BankrollAccount[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [metrics, setMetrics] = useState<RiskMetrics | null>(null);
  const [allocations, setAllocations] = useState<AllocationTarget[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<string>('all');
  const [timeRange, setTimeRange] = useState<string>('30d');
  const [isLoading, setIsLoading] = useState(false);
  const [showAddAccount, setShowAddAccount] = useState(false);

  useEffect(() => {
    loadBankrollData();
  }, [selectedAccount, timeRange]);

  const loadBankrollData = async (): Promise<void> => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));

      const mockAccounts: BankrollAccount[] = [
        {
          id: 'primary',
          name: 'Primary Bankroll',
          balance: 25000,
          initialBalance: 20000,
          currency: 'USD',
          type: 'primary',
          riskLevel: 'moderate',
          allocation: 70,
          lastUpdated: new Date(),
        },
        {
          id: 'hedge',
          name: 'Hedge Fund',
          balance: 8500,
          initialBalance: 8000,
          currency: 'USD',
          type: 'hedge',
          riskLevel: 'conservative',
          allocation: 25,
          lastUpdated: new Date(),
        },
        {
          id: 'recreational',
          name: 'Fun Bets',
          balance: 1200,
          initialBalance: 1500,
          currency: 'USD',
          type: 'recreational',
          riskLevel: 'aggressive',
          allocation: 5,
          lastUpdated: new Date(),
        },
      ];

      const mockTransactions: Transaction[] = [
        {
          id: 'tx-001',
          accountId: 'primary',
          type: 'bet_won',
          amount: 1250,
          description: 'Lakers vs Warriors - Over 225.5',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
          metadata: { betId: 'bet-001', odds: 1.92, sport: 'NBA' },
        },
        {
          id: 'tx-002',
          accountId: 'primary',
          type: 'bet_placed',
          amount: -500,
          description: 'Chiefs vs Bills - Chiefs -3.5',
          timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
          metadata: { betId: 'bet-002', odds: 1.87, sport: 'NFL' },
        },
        {
          id: 'tx-003',
          accountId: 'hedge',
          type: 'deposit',
          amount: 2000,
          description: 'Monthly deposit',
          timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
        },
      ];

      const mockMetrics: RiskMetrics = {
        totalBankroll: 34700,
        availableBalance: 31200,
        lockedInBets: 3500,
        roi: 15.8,
        sharpeRatio: 1.42,
        maxDrawdown: -8.3,
        winRate: 73.6,
        avgBetSize: 425,
        riskScore: 6.2,
        diversificationIndex: 0.78,
      };

      const mockAllocations: AllocationTarget[] = [
        {
          category: 'NBA Props',
          currentPercentage: 35,
          targetPercentage: 30,
          amount: 12145,
          color: 'rgb(124, 58, 237)',
        },
        {
          category: 'NFL Spreads',
          currentPercentage: 25,
          targetPercentage: 25,
          amount: 8675,
          color: 'rgb(6, 255, 165)',
        },
        {
          category: 'Arbitrage',
          currentPercentage: 20,
          targetPercentage: 25,
          amount: 6940,
          color: 'rgb(0, 212, 255)',
        },
        {
          category: 'Live Betting',
          currentPercentage: 15,
          targetPercentage: 15,
          amount: 5205,
          color: 'rgb(255, 107, 53)',
        },
        {
          category: 'Reserve',
          currentPercentage: 5,
          targetPercentage: 5,
          amount: 1735,
          color: 'rgb(156, 163, 175)',
        },
      ];

      setAccounts(mockAccounts);
      setTransactions(mockTransactions);
      setMetrics(mockMetrics);
      setAllocations(mockAllocations);
    } catch (error) {
      console.error('Failed to load bankroll data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getTotalBalance = () => {
    return accounts.reduce((sum, account) => sum + account.balance, 0);
  };

  const getTotalROI = () => {
    const totalInitial = accounts.reduce((sum, account) => sum + account.initialBalance, 0);
    const totalCurrent = getTotalBalance();
    return totalInitial > 0 ? ((totalCurrent - totalInitial) / totalInitial) * 100 : 0;
  };

  const getAccountTypeColor = (type: string) => {
    switch (type) {
      case 'primary':
        return 'text-green-400 bg-green-500/20';
      case 'hedge':
        return 'text-blue-400 bg-blue-500/20';
      case 'recreational':
        return 'text-purple-400 bg-purple-500/20';
      default:
        return 'text-gray-400 bg-gray-500/20';
    }
  };

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'conservative':
        return 'text-green-400';
      case 'moderate':
        return 'text-yellow-400';
      case 'aggressive':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'deposit':
        return <Plus className='w-4 h-4 text-green-400' />;
      case 'withdrawal':
        return <Minus className='w-4 h-4 text-red-400' />;
      case 'bet_placed':
        return <Target className='w-4 h-4 text-blue-400' />;
      case 'bet_won':
        return <TrendingUp className='w-4 h-4 text-green-400' />;
      case 'bet_lost':
        return <TrendingDown className='w-4 h-4 text-red-400' />;
      default:
        return <DollarSign className='w-4 h-4 text-gray-400' />;
    }
  };

  return (
    <Layout
      title='Bankroll Manager'
      subtitle='Portfolio & Risk Management • Advanced Analytics'
      headerActions={
        <div className='flex items-center space-x-3'>
          <select
            value={timeRange}
            onChange={e => setTimeRange(e.target.value)}
            className='px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white text-sm focus:outline-none focus:border-cyan-400'
          >
            <option value='7d'>Last 7 Days</option>
            <option value='30d'>Last 30 Days</option>
            <option value='90d'>Last 90 Days</option>
            <option value='1y'>Last Year</option>
          </select>

          <button
            onClick={() => setShowAddAccount(true)}
            className='flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-green-500 to-cyan-500 hover:from-green-600 hover:to-cyan-600 rounded-lg text-white font-medium transition-all'
          >
            <Plus className='w-4 h-4' />
            <span>Add Account</span>
          </button>

          <button
            onClick={loadBankrollData}
            disabled={isLoading}
            className='flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-cyan-500 hover:from-purple-600 hover:to-cyan-600 rounded-lg text-white font-medium transition-all disabled:opacity-50'
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      }
    >
      {/* Key Metrics */}
      {metrics && (
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8'>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className='bg-slate-800/50 backdrop-blur-lg border border-slate-700/50 rounded-xl p-6'
          >
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-gray-400 text-sm'>Total Bankroll</p>
                <p className='text-2xl font-bold text-white'>
                  ${metrics.totalBankroll.toLocaleString()}
                </p>
                <p
                  className={`text-xs mt-1 ${getTotalROI() >= 0 ? 'text-green-400' : 'text-red-400'}`}
                >
                  {getTotalROI() >= 0 ? '+' : ''}
                  {getTotalROI().toFixed(1)}% total return
                </p>
              </div>
              <Wallet className='w-8 h-8 text-green-400' />
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
                <p className='text-gray-400 text-sm'>Available Balance</p>
                <p className='text-2xl font-bold text-cyan-400'>
                  ${metrics.availableBalance.toLocaleString()}
                </p>
                <p className='text-xs text-cyan-300 mt-1'>
                  {((metrics.availableBalance / metrics.totalBankroll) * 100).toFixed(1)}% liquid
                </p>
              </div>
              <DollarSign className='w-8 h-8 text-cyan-400' />
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
                <p className='text-gray-400 text-sm'>ROI</p>
                <p className='text-2xl font-bold text-purple-400'>+{metrics.roi}%</p>
                <p className='text-xs text-purple-300 mt-1'>Sharpe: {metrics.sharpeRatio}</p>
              </div>
              <TrendingUp className='w-8 h-8 text-purple-400' />
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
                <p className='text-gray-400 text-sm'>Risk Score</p>
                <p className='text-2xl font-bold text-yellow-400'>{metrics.riskScore}/10</p>
                <p className='text-xs text-yellow-300 mt-1'>Max DD: {metrics.maxDrawdown}%</p>
              </div>
              <Shield className='w-8 h-8 text-yellow-400' />
            </div>
          </motion.div>
        </div>
      )}

      {/* Accounts and Allocation */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8'>
        {/* Account Breakdown */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className='bg-slate-800/50 backdrop-blur-lg border border-slate-700/50 rounded-xl p-6'
        >
          <div className='flex items-center justify-between mb-6'>
            <div>
              <h3 className='text-xl font-bold text-white'>Account Breakdown</h3>
              <p className='text-gray-400 text-sm'>Multiple bankroll management</p>
            </div>
            <Users className='w-5 h-5 text-cyan-400' />
          </div>

          <div className='space-y-4'>
            {accounts.map((account, index) => (
              <motion.div
                key={account.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + index * 0.1 }}
                className='bg-slate-900/50 border border-slate-700/50 rounded-lg p-4'
              >
                <div className='flex items-center justify-between mb-3'>
                  <div className='flex items-center space-x-3'>
                    <div className='w-10 h-10 bg-gradient-to-br from-green-500 to-cyan-500 rounded-lg flex items-center justify-center'>
                      <Wallet className='w-5 h-5 text-white' />
                    </div>
                    <div>
                      <h4 className='font-bold text-white'>{account.name}</h4>
                      <div className='flex items-center space-x-2'>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${getAccountTypeColor(account.type)}`}
                        >
                          {account.type.toUpperCase()}
                        </span>
                        <span className={`text-xs ${getRiskLevelColor(account.riskLevel)}`}>
                          {account.riskLevel}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className='text-right'>
                    <div className='text-lg font-bold text-white'>
                      ${account.balance.toLocaleString()}
                    </div>
                    <div className='text-sm text-gray-400'>{account.allocation}% allocation</div>
                  </div>
                </div>

                <div className='grid grid-cols-3 gap-3 text-sm'>
                  <div>
                    <div className='text-gray-400'>Initial</div>
                    <div className='text-white'>${account.initialBalance.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className='text-gray-400'>P&L</div>
                    <div
                      className={`${account.balance >= account.initialBalance ? 'text-green-400' : 'text-red-400'}`}
                    >
                      {account.balance >= account.initialBalance ? '+' : ''}$
                      {(account.balance - account.initialBalance).toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <div className='text-gray-400'>ROI</div>
                    <div
                      className={`${account.balance >= account.initialBalance ? 'text-green-400' : 'text-red-400'}`}
                    >
                      {(
                        ((account.balance - account.initialBalance) / account.initialBalance) *
                        100
                      ).toFixed(1)}
                      %
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Allocation Targets */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6 }}
          className='bg-slate-800/50 backdrop-blur-lg border border-slate-700/50 rounded-xl p-6'
        >
          <div className='flex items-center justify-between mb-6'>
            <div>
              <h3 className='text-xl font-bold text-white'>Allocation Targets</h3>
              <p className='text-gray-400 text-sm'>Strategy diversification</p>
            </div>
            <PieChart className='w-5 h-5 text-purple-400' />
          </div>

          <div className='space-y-4'>
            {allocations.map((allocation, index) => (
              <motion.div
                key={allocation.category}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7 + index * 0.1 }}
                className='space-y-2'
              >
                <div className='flex items-center justify-between'>
                  <span className='text-white font-medium'>{allocation.category}</span>
                  <div className='flex items-center space-x-2'>
                    <span className='text-sm text-gray-400'>
                      {allocation.currentPercentage}% / {allocation.targetPercentage}%
                    </span>
                    <span className='text-sm text-white'>
                      ${allocation.amount.toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className='relative w-full bg-slate-700 rounded-full h-3'>
                  <div
                    className='h-3 rounded-full transition-all duration-500'
                    style={{
                      width: `${allocation.currentPercentage}%`,
                      backgroundColor: allocation.color,
                    }}
                  />
                  <div
                    className='absolute top-0 h-3 w-1 bg-white rounded-full transition-all duration-500'
                    style={{ left: `${allocation.targetPercentage}%` }}
                  />
                </div>

                {allocation.currentPercentage !== allocation.targetPercentage && (
                  <div className='text-xs text-yellow-400'>
                    {allocation.currentPercentage > allocation.targetPercentage
                      ? 'Overweight'
                      : 'Underweight'}{' '}
                    by {Math.abs(allocation.currentPercentage - allocation.targetPercentage)}%
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Recent Transactions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className='bg-slate-800/50 backdrop-blur-lg border border-slate-700/50 rounded-xl p-6'
      >
        <div className='flex items-center justify-between mb-6'>
          <div>
            <h3 className='text-xl font-bold text-white'>Recent Transactions</h3>
            <p className='text-gray-400 text-sm'>Latest bankroll activity</p>
          </div>
          <Clock className='w-5 h-5 text-green-400' />
        </div>

        <div className='space-y-3'>
          {transactions.map((transaction, index) => (
            <motion.div
              key={transaction.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.9 + index * 0.1 }}
              className='flex items-center justify-between p-4 bg-slate-900/50 rounded-lg'
            >
              <div className='flex items-center space-x-3'>
                {getTransactionIcon(transaction.type)}
                <div>
                  <div className='font-medium text-white'>{transaction.description}</div>
                  <div className='text-sm text-gray-400'>
                    {transaction.timestamp.toLocaleString()}
                    {transaction.metadata?.sport && (
                      <span className='ml-2'>• {transaction.metadata.sport}</span>
                    )}
                  </div>
                </div>
              </div>

              <div className='text-right'>
                <div
                  className={`font-bold ${
                    transaction.amount >= 0 ? 'text-green-400' : 'text-red-400'
                  }`}
                >
                  {transaction.amount >= 0 ? '+' : ''}$
                  {Math.abs(transaction.amount).toLocaleString()}
                </div>
                {transaction.metadata?.odds && (
                  <div className='text-sm text-gray-400'>@ {transaction.metadata.odds}</div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </Layout>
  );
};

export default BankrollManager;
