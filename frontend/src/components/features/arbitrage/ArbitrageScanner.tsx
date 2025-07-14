import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Zap,
  DollarSign,
  Clock,
  TrendingUp,
  AlertTriangle,
  RefreshCw,
  Filter,
  Eye,
  Target,
  Activity,
  BarChart3,
  ExternalLink,
  Copy,
  CheckCircle,
  Timer,
  Shield,
  Brain,
} from 'lucide-react';
import { Layout } from '../../core/Layout';

interface ArbitrageOpportunity {
  id: string;
  sport: string;
  league: string;
  game: string;
  market: string;
  team1: string;
  team2: string;
  gameTime: Date;
  bookmakers: Array<{
    name: string;
    odds: number;
    side: string;
    url?: string;
  }>;
  profit: number;
  profitPercentage: number;
  requiredStake1: number;
  requiredStake2: number;
  totalStake: number;
  guaranteedProfit: number;
  timeRemaining: number;
  confidence: number;
  status: 'active' | 'expired' | 'taken';
  difficulty: 'easy' | 'medium' | 'hard';
}

interface ArbitrageStats {
  totalOpportunities: number;
  activeOpportunities: number;
  avgProfit: number;
  bestProfit: number;
  totalProfit: number;
  successRate: number;
  avgDuration: number;
}

const ArbitrageScanner: React.FC = () => {
  const [opportunities, setOpportunities] = useState<ArbitrageOpportunity[]>([]);
  const [stats, setStats] = useState<ArbitrageStats | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [filters, setFilters] = useState({
    sport: 'all',
    minProfit: 1,
    maxStake: 10000,
    difficulty: 'all',
  });
  const [selectedOpp, setSelectedOpp] = useState<ArbitrageOpportunity | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    loadArbitrageData();
    const interval = setInterval(loadArbitrageData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [filters]);

  const loadArbitrageData = async () => {
    setIsScanning(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));

      const mockOpportunities: ArbitrageOpportunity[] = [
        {
          id: 'arb-001',
          sport: 'Basketball',
          league: 'NBA',
          game: 'Lakers vs Warriors',
          market: 'Moneyline',
          team1: 'Lakers',
          team2: 'Warriors',
          gameTime: new Date(Date.now() + 4 * 60 * 60 * 1000),
          bookmakers: [
            { name: 'DraftKings', odds: 2.15, side: 'Lakers', url: 'https://draftkings.com' },
            { name: 'FanDuel', odds: 2.05, side: 'Warriors', url: 'https://fanduel.com' },
          ],
          profit: 127.45,
          profitPercentage: 2.8,
          requiredStake1: 2326,
          requiredStake2: 2174,
          totalStake: 4500,
          guaranteedProfit: 127.45,
          timeRemaining: 240,
          confidence: 94.5,
          status: 'active',
          difficulty: 'easy',
        },
        {
          id: 'arb-002',
          sport: 'Football',
          league: 'NFL',
          game: 'Chiefs vs Bills',
          market: 'Spread',
          team1: 'Chiefs',
          team2: 'Bills',
          gameTime: new Date(Date.now() + 6 * 60 * 60 * 1000),
          bookmakers: [
            { name: 'BetMGM', odds: 1.95, side: 'Chiefs -3.5', url: 'https://betmgm.com' },
            { name: 'Caesars', odds: 1.98, side: 'Bills +3.5', url: 'https://caesars.com' },
          ],
          profit: 89.32,
          profitPercentage: 1.9,
          requiredStake1: 2387,
          requiredStake2: 2113,
          totalStake: 4500,
          guaranteedProfit: 89.32,
          timeRemaining: 360,
          confidence: 87.2,
          status: 'active',
          difficulty: 'medium',
        },
        {
          id: 'arb-003',
          sport: 'Basketball',
          league: 'NBA',
          game: 'Celtics vs Heat',
          market: 'Total Points',
          team1: 'Over 215.5',
          team2: 'Under 215.5',
          gameTime: new Date(Date.now() + 5 * 60 * 60 * 1000),
          bookmakers: [
            { name: 'PointsBet', odds: 1.92, side: 'Over 215.5', url: 'https://pointsbet.com' },
            { name: 'Unibet', odds: 1.95, side: 'Under 215.5', url: 'https://unibet.com' },
          ],
          profit: 156.78,
          profitPercentage: 3.5,
          requiredStake1: 2294,
          requiredStake2: 2206,
          totalStake: 4500,
          guaranteedProfit: 156.78,
          timeRemaining: 180,
          confidence: 91.8,
          status: 'active',
          difficulty: 'easy',
        },
      ];

      const mockStats: ArbitrageStats = {
        totalOpportunities: 47,
        activeOpportunities: mockOpportunities.length,
        avgProfit: 2.4,
        bestProfit: 4.2,
        totalProfit: 8947.23,
        successRate: 89.6,
        avgDuration: 12.5,
      };

      setOpportunities(mockOpportunities);
      setStats(mockStats);
    } catch (error) {
      console.error('Failed to load arbitrage data:', error);
    } finally {
      setIsScanning(false);
    }
  };

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return 'text-green-400 bg-green-500/20';
      case 'medium':
        return 'text-yellow-400 bg-yellow-500/20';
      case 'hard':
        return 'text-red-400 bg-red-500/20';
      default:
        return 'text-gray-400 bg-gray-500/20';
    }
  };

  const getTimeColor = (minutes: number) => {
    if (minutes < 5) return 'text-red-400';
    if (minutes < 15) return 'text-yellow-400';
    return 'text-green-400';
  };

  const formatTimeRemaining = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  return (
    <Layout
      title='Arbitrage Scanner'
      subtitle='Real-Time Arbitrage Opportunities • Guaranteed Profit'
      headerActions={
        <div className='flex items-center space-x-3'>
          {stats && (
            <div className='text-right'>
              <div className='text-sm text-gray-400'>Active Opportunities</div>
              <div className='text-lg font-bold text-green-400'>{stats.activeOpportunities}</div>
            </div>
          )}
          <button
            onClick={loadArbitrageData}
            disabled={isScanning}
            className='flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-green-500 to-cyan-500 hover:from-green-600 hover:to-cyan-600 rounded-lg text-white font-medium transition-all disabled:opacity-50'
          >
            <RefreshCw className={`w-4 h-4 ${isScanning ? 'animate-spin' : ''}`} />
            <span>{isScanning ? 'Scanning...' : 'Scan Now'}</span>
          </button>
        </div>
      }
    >
      {/* Stats Overview */}
      {stats && (
        <div className='grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8'>
          {[
            {
              label: 'Active Opps',
              value: stats.activeOpportunities.toString(),
              icon: Zap,
              color: 'text-green-400',
            },
            {
              label: 'Avg Profit',
              value: `${stats.avgProfit}%`,
              icon: TrendingUp,
              color: 'text-purple-400',
            },
            {
              label: 'Best Profit',
              value: `${stats.bestProfit}%`,
              icon: Target,
              color: 'text-yellow-400',
            },
            {
              label: 'Total Profit',
              value: `$${stats.totalProfit.toLocaleString()}`,
              icon: DollarSign,
              color: 'text-green-400',
            },
            {
              label: 'Success Rate',
              value: `${stats.successRate}%`,
              icon: CheckCircle,
              color: 'text-cyan-400',
            },
            {
              label: 'Avg Duration',
              value: `${stats.avgDuration}min`,
              icon: Clock,
              color: 'text-blue-400',
            },
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className='bg-slate-800/50 backdrop-blur-lg border border-slate-700/50 rounded-xl p-4'
            >
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-gray-400 text-xs'>{stat.label}</p>
                  <p className={`text-lg font-bold ${stat.color}`}>{stat.value}</p>
                </div>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className='bg-slate-800/50 backdrop-blur-lg border border-slate-700/50 rounded-xl p-6 mb-6'
      >
        <div className='flex items-center justify-between mb-4'>
          <h3 className='text-lg font-bold text-white'>Scanning Filters</h3>
          <Filter className='w-5 h-5 text-gray-400' />
        </div>

        <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
          <div>
            <label className='text-sm text-gray-400 mb-1 block'>Sport</label>
            <select
              value={filters.sport}
              onChange={e => setFilters({ ...filters, sport: e.target.value })}
              className='w-full px-3 py-2 bg-slate-900/50 border border-slate-700/50 rounded-lg text-white text-sm focus:outline-none focus:border-cyan-400'
            >
              <option value='all'>All Sports</option>
              <option value='basketball'>Basketball</option>
              <option value='football'>Football</option>
              <option value='baseball'>Baseball</option>
              <option value='hockey'>Hockey</option>
            </select>
          </div>

          <div>
            <label className='text-sm text-gray-400 mb-1 block'>Min Profit (%)</label>
            <input
              type='range'
              min='0.5'
              max='10'
              step='0.1'
              value={filters.minProfit}
              onChange={e => setFilters({ ...filters, minProfit: parseFloat(e.target.value) })}
              className='w-full'
            />
            <div className='text-xs text-gray-400 text-center'>{filters.minProfit}%</div>
          </div>

          <div>
            <label className='text-sm text-gray-400 mb-1 block'>Max Stake ($)</label>
            <input
              type='range'
              min='1000'
              max='50000'
              step='1000'
              value={filters.maxStake}
              onChange={e => setFilters({ ...filters, maxStake: parseInt(e.target.value) })}
              className='w-full'
            />
            <div className='text-xs text-gray-400 text-center'>
              ${filters.maxStake.toLocaleString()}
            </div>
          </div>

          <div>
            <label className='text-sm text-gray-400 mb-1 block'>Difficulty</label>
            <select
              value={filters.difficulty}
              onChange={e => setFilters({ ...filters, difficulty: e.target.value })}
              className='w-full px-3 py-2 bg-slate-900/50 border border-slate-700/50 rounded-lg text-white text-sm focus:outline-none focus:border-cyan-400'
            >
              <option value='all'>All Levels</option>
              <option value='easy'>Easy Only</option>
              <option value='medium'>Medium & Below</option>
              <option value='hard'>All Difficulties</option>
            </select>
          </div>
        </div>
      </motion.div>

      {/* Arbitrage Opportunities */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className='bg-slate-800/50 backdrop-blur-lg border border-slate-700/50 rounded-xl p-6'
      >
        <div className='flex items-center justify-between mb-6'>
          <div>
            <h3 className='text-xl font-bold text-white'>Live Opportunities</h3>
            <p className='text-gray-400 text-sm'>
              Risk-free profit opportunities updated in real-time
            </p>
          </div>
          <div className='flex items-center space-x-2'>
            <div className='w-3 h-3 bg-green-400 rounded-full animate-pulse'></div>
            <span className='text-green-400 text-sm font-medium'>Live Scanning</span>
          </div>
        </div>

        {opportunities.length === 0 ? (
          <div className='text-center py-12'>
            <Zap className='w-16 h-16 text-gray-400 mx-auto mb-4' />
            <h4 className='text-xl font-bold text-gray-400 mb-2'>No Opportunities Found</h4>
            <p className='text-gray-500'>
              Keep scanning - new arbitrage opportunities appear frequently
            </p>
          </div>
        ) : (
          <div className='space-y-4'>
            {opportunities.map((opp, index) => (
              <motion.div
                key={opp.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + index * 0.1 }}
                className='bg-slate-900/50 border border-slate-700/50 rounded-lg p-6 hover:border-green-500/30 transition-all group'
              >
                <div className='flex items-start justify-between mb-4'>
                  <div>
                    <div className='flex items-center space-x-3 mb-2'>
                      <h4 className='font-bold text-white text-lg'>{opp.game}</h4>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(opp.difficulty)}`}
                      >
                        {opp.difficulty.toUpperCase()}
                      </span>
                    </div>
                    <div className='flex items-center space-x-4 text-sm text-gray-400'>
                      <span>
                        {opp.sport} • {opp.league}
                      </span>
                      <span>Market: {opp.market}</span>
                      <span
                        className={`flex items-center space-x-1 ${getTimeColor(opp.timeRemaining)}`}
                      >
                        <Timer className='w-4 h-4' />
                        <span>{formatTimeRemaining(opp.timeRemaining)} left</span>
                      </span>
                    </div>
                  </div>

                  <div className='text-right'>
                    <div className='text-2xl font-bold text-green-400'>
                      {opp.profitPercentage.toFixed(1)}%
                    </div>
                    <div className='text-sm text-gray-400'>Guaranteed Profit</div>
                  </div>
                </div>

                <div className='grid grid-cols-1 md:grid-cols-2 gap-6 mb-4'>
                  {opp.bookmakers.map((book, idx) => (
                    <div key={idx} className='bg-slate-800/50 rounded-lg p-4'>
                      <div className='flex items-center justify-between mb-2'>
                        <div className='font-medium text-white'>{book.name}</div>
                        <button
                          onClick={() => book.url && window.open(book.url, '_blank')}
                          className='flex items-center space-x-1 text-cyan-400 hover:text-cyan-300 text-sm'
                        >
                          <ExternalLink className='w-4 h-4' />
                          <span>Open</span>
                        </button>
                      </div>
                      <div className='flex items-center justify-between'>
                        <span className='text-gray-300'>{book.side}</span>
                        <span className='font-bold text-white'>{book.odds.toFixed(2)}</span>
                      </div>
                      <div className='text-sm text-gray-400 mt-1'>
                        Stake: $
                        {idx === 0 ? opp.requiredStake1.toFixed(0) : opp.requiredStake2.toFixed(0)}
                      </div>
                    </div>
                  ))}
                </div>

                <div className='grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 p-4 bg-green-500/10 rounded-lg border border-green-500/20'>
                  <div>
                    <div className='text-sm text-gray-400'>Total Stake</div>
                    <div className='font-bold text-white'>${opp.totalStake.toFixed(0)}</div>
                  </div>
                  <div>
                    <div className='text-sm text-gray-400'>Guaranteed Profit</div>
                    <div className='font-bold text-green-400'>
                      +${opp.guaranteedProfit.toFixed(2)}
                    </div>
                  </div>
                  <div>
                    <div className='text-sm text-gray-400'>Confidence</div>
                    <div className='font-bold text-cyan-400'>{opp.confidence.toFixed(1)}%</div>
                  </div>
                  <div>
                    <div className='text-sm text-gray-400'>ROI</div>
                    <div className='font-bold text-purple-400'>
                      {opp.profitPercentage.toFixed(2)}%
                    </div>
                  </div>
                </div>

                <div className='flex items-center justify-between pt-4 border-t border-slate-700/50'>
                  <div className='text-sm text-gray-400'>
                    Game starts: {opp.gameTime.toLocaleString()}
                  </div>
                  <div className='flex items-center space-x-2'>
                    <button
                      onClick={() =>
                        copyToClipboard(
                          `Arbitrage: ${opp.game} ${opp.market}\nProfit: ${opp.profitPercentage.toFixed(1)}% ($${opp.guaranteedProfit.toFixed(2)})\nStakes: $${opp.requiredStake1.toFixed(0)} @ ${opp.bookmakers[0].name}, $${opp.requiredStake2.toFixed(0)} @ ${opp.bookmakers[1].name}`,
                          opp.id
                        )
                      }
                      className='flex items-center space-x-1 px-3 py-1 bg-slate-700/50 hover:bg-slate-600/50 rounded-lg text-sm text-gray-300 transition-colors'
                    >
                      {copiedId === opp.id ? (
                        <CheckCircle className='w-4 h-4 text-green-400' />
                      ) : (
                        <Copy className='w-4 h-4' />
                      )}
                      <span>Copy Details</span>
                    </button>
                    <button
                      onClick={() => setSelectedOpp(opp)}
                      className='px-4 py-2 bg-gradient-to-r from-green-500 to-cyan-500 hover:from-green-600 hover:to-cyan-600 rounded-lg text-white font-medium transition-all group-hover:scale-105'
                    >
                      Execute Arbitrage
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Arbitrage Calculator Modal */}
      {selectedOpp && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className='fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4'
          onClick={() => setSelectedOpp(null)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className='bg-slate-800 border border-slate-700 rounded-xl p-6 max-w-2xl w-full'
            onClick={e => e.stopPropagation()}
          >
            <div className='flex items-center justify-between mb-6'>
              <h3 className='text-xl font-bold text-white'>Arbitrage Calculator</h3>
              <button
                onClick={() => setSelectedOpp(null)}
                className='text-gray-400 hover:text-white'
              >
                ×
              </button>
            </div>

            <div className='space-y-4'>
              <div className='text-center p-4 bg-green-500/20 rounded-lg border border-green-500/30'>
                <div className='text-2xl font-bold text-green-400'>
                  {selectedOpp.profitPercentage.toFixed(2)}% Guaranteed Profit
                </div>
                <div className='text-green-300'>
                  +${selectedOpp.guaranteedProfit.toFixed(2)} on $
                  {selectedOpp.totalStake.toFixed(0)} stake
                </div>
              </div>

              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                {selectedOpp.bookmakers.map((book, idx) => (
                  <div key={idx} className='p-4 bg-slate-900/50 rounded-lg'>
                    <h4 className='font-bold text-white mb-2'>{book.name}</h4>
                    <div className='space-y-2 text-sm'>
                      <div className='flex justify-between'>
                        <span className='text-gray-400'>Bet:</span>
                        <span className='text-white'>{book.side}</span>
                      </div>
                      <div className='flex justify-between'>
                        <span className='text-gray-400'>Odds:</span>
                        <span className='text-white'>{book.odds.toFixed(2)}</span>
                      </div>
                      <div className='flex justify-between'>
                        <span className='text-gray-400'>Stake:</span>
                        <span className='text-white font-bold'>
                          $
                          {idx === 0
                            ? selectedOpp.requiredStake1.toFixed(2)
                            : selectedOpp.requiredStake2.toFixed(2)}
                        </span>
                      </div>
                      <div className='flex justify-between'>
                        <span className='text-gray-400'>Payout:</span>
                        <span className='text-green-400'>
                          $
                          {idx === 0
                            ? (selectedOpp.requiredStake1 * book.odds).toFixed(2)
                            : (selectedOpp.requiredStake2 * book.odds).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className='flex space-x-3'>
                <button
                  onClick={() => setSelectedOpp(null)}
                  className='flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-white transition-colors'
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    // Here you would integrate with betting automation
                    alert('Arbitrage execution would be implemented here');
                    setSelectedOpp(null);
                  }}
                  className='flex-1 px-4 py-2 bg-gradient-to-r from-green-500 to-cyan-500 hover:from-green-600 hover:to-cyan-600 rounded-lg text-white font-medium transition-all'
                >
                  Execute Arbitrage
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Live Arbitrage Feed */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className='bg-slate-800/50 backdrop-blur-lg border border-slate-700/50 rounded-xl p-6 mt-8'
      >
        <div className='flex items-center justify-between mb-6'>
          <div>
            <h3 className='text-xl font-bold text-white'>Live Arbitrage Feed</h3>
            <p className='text-gray-400 text-sm'>Real-time cross-book opportunities</p>
          </div>
          <div className='flex items-center space-x-2'>
            <div className='w-3 h-3 bg-green-400 rounded-full animate-pulse'></div>
            <span className='text-green-400 text-sm font-medium'>Live Feed</span>
          </div>
        </div>

        <div className='space-y-3'>
          {[
            { book1: 'DraftKings', book2: 'FanDuel', profit: 3.2, sport: 'NBA' },
            { book1: 'BetMGM', book2: 'Caesars', profit: 2.8, sport: 'NFL' },
            { book1: 'PointsBet', book2: 'Unibet', profit: 4.1, sport: 'NHL' },
          ].map((arb, index) => (
            <div
              key={index}
              className='flex items-center justify-between bg-slate-900/50 rounded-lg p-3'
            >
              <div className='flex items-center space-x-3'>
                <div className='w-2 h-2 bg-yellow-400 rounded-full animate-pulse'></div>
                <span className='text-white font-medium'>
                  {arb.book1} vs {arb.book2}
                </span>
                <span className='text-gray-400 text-sm'>{arb.sport}</span>
              </div>
              <div className='text-green-400 font-bold'>+{arb.profit}%</div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Advanced Arbitrage Analytics */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className='bg-slate-800/50 backdrop-blur-lg border border-slate-700/50 rounded-xl p-6 mt-8'
      >
        <h3 className='text-xl font-bold text-white mb-6'>Arbitrage Analytics</h3>

        <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
          <div className='bg-slate-900/50 rounded-lg p-4'>
            <h4 className='text-sm font-medium text-gray-400 mb-2'>Best Markets</h4>
            <div className='space-y-2'>
              {[
                { market: 'Player Props', count: 23, avgProfit: 4.2 },
                { market: 'Game Totals', count: 18, avgProfit: 3.1 },
                { market: 'Spreads', count: 15, avgProfit: 2.8 },
              ].map((market, index) => (
                <div key={index} className='flex items-center justify-between'>
                  <span className='text-gray-300 text-sm'>{market.market}</span>
                  <div className='text-right'>
                    <div className='text-cyan-400 font-medium'>{market.count}</div>
                    <div className='text-xs text-gray-400'>+{market.avgProfit}%</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className='bg-slate-900/50 rounded-lg p-4'>
            <h4 className='text-sm font-medium text-gray-400 mb-2'>Top Bookmaker Pairs</h4>
            <div className='space-y-2'>
              {[
                { pair: 'DK vs FD', opportunities: 34 },
                { pair: 'MGM vs Caesar', opportunities: 28 },
                { pair: 'PB vs Unibet', opportunities: 22 },
              ].map((pair, index) => (
                <div key={index} className='flex items-center justify-between'>
                  <span className='text-gray-300 text-sm'>{pair.pair}</span>
                  <span className='text-purple-400 font-medium'>{pair.opportunities}</span>
                </div>
              ))}
            </div>
          </div>

          <div className='bg-slate-900/50 rounded-lg p-4'>
            <h4 className='text-sm font-medium text-gray-400 mb-2'>Profit Distribution</h4>
            <div className='space-y-2'>
              {[
                { range: '2-3%', count: 18 },
                { range: '3-5%', count: 24 },
                { range: '5%+', count: 5 },
              ].map((dist, index) => (
                <div key={index} className='flex items-center justify-between'>
                  <span className='text-gray-300 text-sm'>{dist.range}</span>
                  <span className='text-green-400 font-medium'>{dist.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Arbitrage Intelligence Hub */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.0 }}
        className='bg-slate-800/50 backdrop-blur-lg border border-slate-700/50 rounded-xl p-6 mt-8'
      >
        <div className='flex items-center justify-between mb-6'>
          <div>
            <h3 className='text-xl font-bold text-white'>Arbitrage Intelligence Hub</h3>
            <p className='text-gray-400 text-sm'>
              Advanced market analysis and opportunity prediction
            </p>
          </div>
          <Brain className='w-6 h-6 text-purple-400' />
        </div>

        <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
          <div className='bg-slate-900/50 rounded-lg p-4'>
            <h4 className='text-sm font-medium text-gray-400 mb-3'>Market Inefficiency Tracker</h4>
            <div className='space-y-3'>
              {[
                {
                  market: 'NBA Player Props',
                  inefficiency: 8.7,
                  trend: 'increasing',
                  opportunities: 47,
                },
                {
                  market: 'NFL Game Totals',
                  inefficiency: 5.2,
                  trend: 'stable',
                  opportunities: 23,
                },
                {
                  market: 'NHL Moneylines',
                  inefficiency: 6.9,
                  trend: 'decreasing',
                  opportunities: 31,
                },
                {
                  market: 'MLB Run Lines',
                  inefficiency: 4.1,
                  trend: 'increasing',
                  opportunities: 18,
                },
              ].map((market, index) => (
                <div key={index} className='bg-slate-800/50 rounded-lg p-3'>
                  <div className='flex items-center justify-between mb-2'>
                    <span className='text-white font-medium text-sm'>{market.market}</span>
                    <span className='text-green-400 font-bold text-sm'>{market.inefficiency}%</span>
                  </div>
                  <div className='flex items-center justify-between'>
                    <div className='flex items-center space-x-2'>
                      <span
                        className={`text-xs ${
                          market.trend === 'increasing'
                            ? 'text-green-400'
                            : market.trend === 'decreasing'
                              ? 'text-red-400'
                              : 'text-gray-400'
                        }`}
                      >
                        {market.trend === 'increasing'
                          ? '↗'
                          : market.trend === 'decreasing'
                            ? '↘'
                            : '→'}
                      </span>
                      <span className='text-gray-400 text-xs'>{market.trend}</span>
                    </div>
                    <span className='text-cyan-400 text-xs'>{market.opportunities} opps</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className='bg-slate-900/50 rounded-lg p-4'>
            <h4 className='text-sm font-medium text-gray-400 mb-3'>Bookmaker Correlation Matrix</h4>
            <div className='space-y-3'>
              {[
                {
                  book1: 'DraftKings',
                  book2: 'FanDuel',
                  correlation: 0.23,
                  arbs: 34,
                  avgProfit: 3.2,
                },
                { book1: 'BetMGM', book2: 'Caesars', correlation: 0.18, arbs: 28, avgProfit: 4.1 },
                {
                  book1: 'PointsBet',
                  book2: 'Unibet',
                  correlation: 0.31,
                  arbs: 19,
                  avgProfit: 5.7,
                },
                {
                  book1: 'Barstool',
                  book2: 'WynnBET',
                  correlation: 0.15,
                  arbs: 42,
                  avgProfit: 2.9,
                },
              ].map((pair, index) => (
                <div key={index} className='bg-slate-800/50 rounded-lg p-3'>
                  <div className='flex items-center justify-between mb-2'>
                    <span className='text-white font-medium text-sm'>
                      {pair.book1} × {pair.book2}
                    </span>
                    <span className='text-purple-400 text-xs'>
                      {pair.correlation.toFixed(2)} corr
                    </span>
                  </div>
                  <div className='grid grid-cols-2 gap-2 text-xs'>
                    <div className='text-gray-400'>Arbs: {pair.arbs}</div>
                    <div className='text-green-400'>Avg: {pair.avgProfit}%</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className='bg-slate-900/50 rounded-lg p-4'>
            <h4 className='text-sm font-medium text-gray-400 mb-3'>Opportunity Prediction</h4>
            <div className='space-y-3'>
              {[
                {
                  timeframe: 'Next Hour',
                  predicted: 23,
                  confidence: 87,
                  type: 'High Volume Expected',
                },
                {
                  timeframe: 'Next 4 Hours',
                  predicted: 89,
                  confidence: 82,
                  type: 'Line Movement Phase',
                },
                { timeframe: 'Today', predicted: 247, confidence: 79, type: 'Game Day Volatility' },
                {
                  timeframe: 'This Week',
                  predicted: 1340,
                  confidence: 74,
                  type: 'Normal Activity',
                },
              ].map((pred, index) => (
                <div key={index} className='bg-slate-800/50 rounded-lg p-3'>
                  <div className='flex items-center justify-between mb-2'>
                    <span className='text-white font-medium text-sm'>{pred.timeframe}</span>
                    <span className='text-cyan-400 font-bold text-sm'>{pred.predicted}</span>
                  </div>
                  <div className='flex items-center justify-between mb-1'>
                    <span className='text-gray-400 text-xs'>Confidence: {pred.confidence}%</span>
                    <div className='w-16 bg-slate-700 rounded-full h-1'>
                      <div
                        className='h-1 bg-cyan-400 rounded-full'
                        style={{ width: `${pred.confidence}%` }}
                      />
                    </div>
                  </div>
                  <div className='text-yellow-400 text-xs'>{pred.type}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Advanced Risk Management */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.1 }}
        className='bg-slate-800/50 backdrop-blur-lg border border-slate-700/50 rounded-xl p-6 mt-8'
      >
        <div className='flex items-center justify-between mb-6'>
          <div>
            <h3 className='text-xl font-bold text-white'>Advanced Risk Management</h3>
            <p className='text-gray-400 text-sm'>
              Multi-layer risk assessment for arbitrage opportunities
            </p>
          </div>
          <Shield className='w-6 h-6 text-orange-400' />
        </div>

        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
          <div className='bg-slate-900/50 rounded-lg p-4'>
            <h4 className='text-lg font-medium text-white mb-4'>Risk Factors Matrix</h4>
            <div className='space-y-3'>
              {[
                {
                  factor: 'Bookmaker Reliability',
                  level: 'LOW',
                  score: 92,
                  details: ['Grade A+ operators', 'Fast payouts', 'High limits'],
                },
                {
                  factor: 'Market Volatility',
                  level: 'MEDIUM',
                  score: 67,
                  details: ['Active line movement', 'High betting volume', 'News sensitivity'],
                },
                {
                  factor: 'Time to Game',
                  level: 'HIGH',
                  score: 34,
                  details: [
                    'Game starts in 45 mins',
                    'Limited execution time',
                    'Increased variance',
                  ],
                },
                {
                  factor: 'Position Size Risk',
                  level: 'LOW',
                  score: 89,
                  details: ['Within bankroll limits', 'Diversified exposure', 'Appropriate sizing'],
                },
              ].map((risk, index) => (
                <div key={index} className='bg-slate-800/50 rounded-lg p-3'>
                  <div className='flex items-center justify-between mb-2'>
                    <span className='text-white font-medium text-sm'>{risk.factor}</span>
                    <div className='flex items-center space-x-2'>
                      <span className='text-cyan-400 text-xs'>{risk.score}/100</span>
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
                  </div>
                  <ul className='text-gray-400 text-xs space-y-1'>
                    {risk.details.map((detail, i) => (
                      <li key={i}>• {detail}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          <div className='bg-slate-900/50 rounded-lg p-4'>
            <h4 className='text-lg font-medium text-white mb-4'>Portfolio Risk Metrics</h4>
            <div className='space-y-4'>
              <div className='grid grid-cols-2 gap-4'>
                <div className='bg-slate-800/50 rounded-lg p-3 text-center'>
                  <div className='text-2xl font-bold text-green-400 mb-1'>$47,230</div>
                  <div className='text-xs text-gray-400'>Total Exposure</div>
                </div>
                <div className='bg-slate-800/50 rounded-lg p-3 text-center'>
                  <div className='text-2xl font-bold text-cyan-400 mb-1'>0.23</div>
                  <div className='text-xs text-gray-400'>Portfolio Beta</div>
                </div>
              </div>

              <div className='space-y-3'>
                <div className='bg-slate-800/50 rounded-lg p-3'>
                  <div className='flex items-center justify-between mb-2'>
                    <span className='text-white text-sm'>Value at Risk (95%)</span>
                    <span className='text-red-400 font-bold'>$2,341</span>
                  </div>
                  <div className='text-gray-400 text-xs'>Maximum expected loss in 1 day</div>
                </div>

                <div className='bg-slate-800/50 rounded-lg p-3'>
                  <div className='flex items-center justify-between mb-2'>
                    <span className='text-white text-sm'>Sharpe Ratio</span>
                    <span className='text-green-400 font-bold'>2.87</span>
                  </div>
                  <div className='text-gray-400 text-xs'>Risk-adjusted return measure</div>
                </div>

                <div className='bg-slate-800/50 rounded-lg p-3'>
                  <div className='flex items-center justify-between mb-2'>
                    <span className='text-white text-sm'>Correlation to Market</span>
                    <span className='text-purple-400 font-bold'>0.12</span>
                  </div>
                  <div className='text-gray-400 text-xs'>
                    Low correlation = good diversification
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Event-Driven Analytics Engine */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.2 }}
        className='bg-slate-800/50 backdrop-blur-lg border border-slate-700/50 rounded-xl p-6 mt-8'
      >
        <div className='flex items-center justify-between mb-6'>
          <div>
            <h3 className='text-xl font-bold text-white'>Event-Driven Analytics Engine</h3>
            <p className='text-gray-400 text-sm'>
              Real-time event processing with automated strategy coordination
            </p>
          </div>
          <Activity className='w-6 h-6 text-cyan-400' />
        </div>

        <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
          <div className='bg-slate-900/50 rounded-lg p-4'>
            <h4 className='text-sm font-medium text-gray-400 mb-3'>Live Event Stream</h4>
            <div className='space-y-2'>
              {[
                {
                  type: 'market_update',
                  timestamp: '2s ago',
                  data: 'Lakers -5.5 → -6.0',
                  priority: 'high',
                  processed: true,
                },
                {
                  type: 'prediction_update',
                  timestamp: '8s ago',
                  data: 'LeBron Over 25.5 Pts: 89.4%',
                  priority: 'medium',
                  processed: true,
                },
                {
                  type: 'risk_violation',
                  timestamp: '15s ago',
                  data: 'Portfolio heat: 24.7%',
                  priority: 'high',
                  processed: true,
                },
                {
                  type: 'system_alert',
                  timestamp: '32s ago',
                  data: 'Model accuracy: 94.2%',
                  priority: 'low',
                  processed: true,
                },
                {
                  type: 'arbitrage_found',
                  timestamp: '1m ago',
                  data: 'Warriors ML: 3.2% edge',
                  priority: 'high',
                  processed: true,
                },
              ].map((event, index) => (
                <div key={index} className='bg-slate-800/50 rounded-lg p-2'>
                  <div className='flex items-center justify-between mb-1'>
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        event.priority === 'high'
                          ? 'bg-red-500/20 text-red-400'
                          : event.priority === 'medium'
                            ? 'bg-yellow-500/20 text-yellow-400'
                            : 'bg-green-500/20 text-green-400'
                      }`}
                    >
                      {event.type.replace('_', ' ')}
                    </span>
                    <span className='text-gray-400 text-xs'>{event.timestamp}</span>
                  </div>
                  <div className='text-white text-xs'>{event.data}</div>
                </div>
              ))}
            </div>
          </div>

          <div className='bg-slate-900/50 rounded-lg p-4'>
            <h4 className='text-sm font-medium text-gray-400 mb-3'>Analytics Metrics</h4>
            <div className='space-y-3'>
              <div className='bg-slate-800/50 rounded-lg p-3 text-center'>
                <div className='text-2xl font-bold text-cyan-400 mb-1'>23,847</div>
                <div className='text-xs text-gray-400'>Total Events Processed</div>
              </div>
              <div className='bg-slate-800/50 rounded-lg p-3 text-center'>
                <div className='text-2xl font-bold text-green-400 mb-1'>47ms</div>
                <div className='text-xs text-gray-400'>Avg Processing Latency</div>
              </div>
              <div className='space-y-2'>
                {[
                  { type: 'Market Updates', count: 8934, rate: '99.8%' },
                  { type: 'Predictions', count: 4567, rate: '98.7%' },
                  { type: 'Risk Events', count: 1234, rate: '100%' },
                  { type: 'System Alerts', count: 567, rate: '99.9%' },
                ].map((metric, index) => (
                  <div key={index} className='flex items-center justify-between text-xs'>
                    <span className='text-gray-400'>{metric.type}</span>
                    <div className='text-right'>
                      <span className='text-white'>{metric.count}</span>
                      <div className='text-green-400'>{metric.rate}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className='bg-slate-900/50 rounded-lg p-4'>
            <h4 className='text-sm font-medium text-gray-400 mb-3'>Event Processing Config</h4>
            <div className='space-y-3'>
              {[
                { setting: 'Sample Rate', value: '100%', status: 'Active' },
                { setting: 'Batch Size', value: '100 events', status: 'Optimal' },
                { setting: 'Flush Interval', value: '5s', status: 'Active' },
                { setting: 'Retention Period', value: '30 days', status: 'Configured' },
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
                  <div className='text-lg font-bold text-purple-400 mb-1'>0.03%</div>
                  <div className='text-xs text-gray-400'>Error Rate</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Unified Betting Coordination */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.3 }}
        className='bg-slate-800/50 backdrop-blur-lg border border-slate-700/50 rounded-xl p-6 mt-8'
      >
        <div className='flex items-center justify-between mb-6'>
          <div>
            <h3 className='text-xl font-bold text-white'>Unified Betting Coordination</h3>
            <p className='text-gray-400 text-sm'>
              Advanced betting analysis with hedging opportunities and risk assessment
            </p>
          </div>
          <Target className='w-6 h-6 text-green-400' />
        </div>

        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
          <div className='bg-slate-900/50 rounded-lg p-4'>
            <h4 className='text-lg font-medium text-white mb-4'>Betting Analysis Results</h4>
            <div className='space-y-3'>
              {[
                {
                  id: 'analysis-001',
                  market: 'Lakers vs Warriors ML',
                  predictionConfidence: 87.4,
                  recommendedStake: 420,
                  expectedValue: 18.7,
                  riskLevel: 'medium',
                  riskFactors: ['High volatility market', 'Injury report pending'],
                },
                {
                  id: 'analysis-002',
                  market: 'LeBron Over 25.5 Pts',
                  predictionConfidence: 94.2,
                  recommendedStake: 525,
                  expectedValue: 23.4,
                  riskLevel: 'low',
                  riskFactors: ['Optimal matchup', 'Strong recent form'],
                },
                {
                  id: 'analysis-003',
                  market: 'Game Total Under 219.5',
                  predictionConfidence: 79.8,
                  recommendedStake: 315,
                  expectedValue: 12.1,
                  riskLevel: 'high',
                  riskFactors: ['Weather dependency', 'Line movement active'],
                },
              ].map((analysis, index) => (
                <div key={index} className='bg-slate-800/50 rounded-lg p-3'>
                  <div className='flex items-center justify-between mb-2'>
                    <span className='text-white font-medium text-sm'>{analysis.market}</span>
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        analysis.riskLevel === 'low'
                          ? 'bg-green-500/20 text-green-400'
                          : analysis.riskLevel === 'medium'
                            ? 'bg-yellow-500/20 text-yellow-400'
                            : 'bg-red-500/20 text-red-400'
                      }`}
                    >
                      {analysis.riskLevel} risk
                    </span>
                  </div>
                  <div className='grid grid-cols-2 gap-2 text-xs mb-2'>
                    <div className='text-gray-400'>
                      Confidence:{' '}
                      <span className='text-cyan-400'>{analysis.predictionConfidence}%</span>
                    </div>
                    <div className='text-gray-400'>
                      Stake: <span className='text-yellow-400'>${analysis.recommendedStake}</span>
                    </div>
                    <div className='text-gray-400'>
                      Expected Value:{' '}
                      <span className='text-green-400'>+{analysis.expectedValue}%</span>
                    </div>
                  </div>
                  <div className='text-xs text-gray-400'>
                    Risk Factors: {analysis.riskFactors.join(', ')}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className='bg-slate-900/50 rounded-lg p-4'>
            <h4 className='text-lg font-medium text-white mb-4'>Hedging Opportunities</h4>
            <div className='space-y-3'>
              {[
                {
                  primaryMarket: 'Lakers ML',
                  hedgeMarket: 'Warriors +6.5',
                  hedgeOdds: 1.95,
                  recommendedStake: 180,
                  guaranteedProfit: 67,
                  riskReduction: '78%',
                },
                {
                  primaryMarket: 'Over 219.5',
                  hedgeMarket: 'Under 220.5 (Alt)',
                  hedgeOdds: 2.1,
                  recommendedStake: 140,
                  guaranteedProfit: 43,
                  riskReduction: '65%',
                },
                {
                  primaryMarket: 'LeBron Over 25.5',
                  hedgeMarket: 'LeBron Under 28.5',
                  hedgeOdds: 1.87,
                  recommendedStake: 95,
                  guaranteedProfit: 28,
                  riskReduction: '45%',
                },
              ].map((hedge, index) => (
                <div key={index} className='bg-slate-800/50 rounded-lg p-3'>
                  <div className='text-white font-medium text-sm mb-2'>
                    {hedge.primaryMarket} → {hedge.hedgeMarket}
                  </div>
                  <div className='grid grid-cols-2 gap-2 text-xs'>
                    <div className='text-gray-400'>
                      Hedge Odds: <span className='text-white'>{hedge.hedgeOdds}</span>
                    </div>
                    <div className='text-gray-400'>
                      Stake: <span className='text-yellow-400'>${hedge.recommendedStake}</span>
                    </div>
                    <div className='text-gray-400'>
                      Guaranteed: <span className='text-green-400'>${hedge.guaranteedProfit}</span>
                    </div>
                    <div className='text-gray-400'>
                      Risk Reduction: <span className='text-purple-400'>{hedge.riskReduction}</span>
                    </div>
                  </div>
                </div>
              ))}

              <div className='bg-slate-800/50 rounded-lg p-3'>
                <div className='text-center'>
                  <div className='text-lg font-bold text-green-400 mb-1'>$138</div>
                  <div className='text-xs text-gray-400'>Total Hedging Profit</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Advanced Pattern Recognition Engine */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.4 }}
        className='bg-slate-800/50 backdrop-blur-lg border border-slate-700/50 rounded-xl p-6 mt-8'
      >
        <div className='flex items-center justify-between mb-6'>
          <div>
            <h3 className='text-xl font-bold text-white'>Advanced Pattern Recognition Engine</h3>
            <p className='text-gray-400 text-sm'>
              AI-powered detection of market inefficiencies, streaks, and betting biases
            </p>
          </div>
          <Brain className='w-6 h-6 text-cyan-400' />
        </div>

        <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
          <div className='bg-slate-900/50 rounded-lg p-4'>
            <h4 className='text-sm font-medium text-gray-400 mb-3'>
              Market Inefficiency Detection
            </h4>
            <div className='space-y-3'>
              {[
                {
                  type: 'Odds Drift Pattern',
                  detected: true,
                  severity: 'high',
                  confidence: 94.2,
                  details: 'Lakers ML drifting vs market consensus',
                  opportunity: '+$2,847 potential',
                },
                {
                  type: 'Volume Anomaly',
                  detected: true,
                  severity: 'medium',
                  confidence: 87.9,
                  details: 'Unusual betting volume on Warriors spread',
                  opportunity: '+$1,420 potential',
                },
                {
                  type: 'Cross-Book Delay',
                  detected: true,
                  severity: 'high',
                  confidence: 91.7,
                  details: 'DraftKings 30s behind FanDuel updates',
                  opportunity: '+$3,125 potential',
                },
                {
                  type: 'Public Sentiment Divergence',
                  detected: false,
                  severity: 'low',
                  confidence: 68.3,
                  details: 'Normal alignment with public betting',
                  opportunity: 'No opportunity',
                },
              ].map((pattern, index) => (
                <div key={index} className='bg-slate-800/50 rounded-lg p-3'>
                  <div className='flex items-center justify-between mb-2'>
                    <span className='text-white font-medium text-sm'>{pattern.type}</span>
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        pattern.detected
                          ? pattern.severity === 'high'
                            ? 'bg-red-500/20 text-red-400'
                            : pattern.severity === 'medium'
                              ? 'bg-yellow-500/20 text-yellow-400'
                              : 'bg-green-500/20 text-green-400'
                          : 'bg-gray-500/20 text-gray-400'
                      }`}
                    >
                      {pattern.detected ? pattern.severity : 'none'}
                    </span>
                  </div>
                  <div className='text-gray-300 text-xs mb-2'>{pattern.details}</div>
                  <div className='grid grid-cols-2 gap-2 text-xs'>
                    <div className='text-gray-400'>
                      Confidence: <span className='text-cyan-400'>{pattern.confidence}%</span>
                    </div>
                    <div className='text-gray-400'>
                      Value:{' '}
                      <span className={pattern.detected ? 'text-green-400' : 'text-gray-400'}>
                        {pattern.opportunity}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className='bg-slate-900/50 rounded-lg p-4'>
            <h4 className='text-sm font-medium text-gray-400 mb-3'>Streak & Bias Analysis</h4>
            <div className='space-y-3'>
              {[
                {
                  category: 'Team Performance',
                  pattern: 'Lakers Over Streak',
                  streak: 7,
                  type: 'win',
                  probability: 'Continuation: 73.4%',
                  action: 'Fade streak',
                },
                {
                  category: 'Bookmaker Bias',
                  pattern: 'DraftKings Home Favorite',
                  streak: 12,
                  type: 'bias',
                  probability: 'Exploitable: 89.2%',
                  action: 'Target bias',
                },
                {
                  category: 'Official Tendencies',
                  pattern: 'Ref Tony Foster Over Calls',
                  streak: 5,
                  type: 'official',
                  probability: 'Continues: 81.7%',
                  action: 'Bet Over totals',
                },
                {
                  category: 'Weather Patterns',
                  pattern: 'Cold Weather Unders',
                  streak: 9,
                  type: 'weather',
                  probability: 'Strong: 94.8%',
                  action: 'NFL Under plays',
                },
              ].map((streak, index) => (
                <div key={index} className='bg-slate-800/50 rounded-lg p-3'>
                  <div className='flex items-center justify-between mb-2'>
                    <span className='text-white font-medium text-sm'>{streak.pattern}</span>
                    <span className='text-cyan-400 text-sm'>{streak.streak}</span>
                  </div>
                  <div className='text-gray-400 text-xs mb-1'>{streak.category}</div>
                  <div className='text-gray-300 text-xs mb-2'>{streak.probability}</div>
                  <div className='text-green-400 text-xs font-medium'>{streak.action}</div>
                </div>
              ))}
            </div>
          </div>

          <div className='bg-slate-900/50 rounded-lg p-4'>
            <h4 className='text-sm font-medium text-gray-400 mb-3'>Pattern Performance Metrics</h4>
            <div className='space-y-3'>
              <div className='bg-slate-800/50 rounded-lg p-3 text-center'>
                <div className='text-2xl font-bold text-green-400 mb-1'>89.7%</div>
                <div className='text-xs text-gray-400'>Pattern Accuracy</div>
              </div>
              <div className='bg-slate-800/50 rounded-lg p-3 text-center'>
                <div className='text-2xl font-bold text-purple-400 mb-1'>247</div>
                <div className='text-xs text-gray-400'>Patterns Detected Today</div>
              </div>
              <div className='space-y-2'>
                {[
                  { type: 'Inefficiencies', detected: 34, success: 31 },
                  { type: 'Streaks', detected: 89, success: 76 },
                  { type: 'Biases', detected: 67, success: 59 },
                  { type: 'Anomalies', detected: 57, success: 52 },
                ].map((metric, index) => (
                  <div key={index} className='flex items-center justify-between text-xs'>
                    <span className='text-gray-400'>{metric.type}</span>
                    <div className='text-right'>
                      <span className='text-white'>{metric.detected}</span>
                      <div className='text-green-400'>
                        {((metric.success / metric.detected) * 100).toFixed(0)}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Quantum Analysis Engine */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.5 }}
        className='bg-slate-800/50 backdrop-blur-lg border border-slate-700/50 rounded-xl p-6 mt-8'
      >
        <div className='flex items-center justify-between mb-6'>
          <div>
            <h3 className='text-xl font-bold text-white'>Quantum Analysis Engine</h3>
            <p className='text-gray-400 text-sm'>
              Next-generation probability analysis with quantum computing principles
            </p>
          </div>
          <Activity className='w-6 h-6 text-purple-400' />
        </div>

        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
          <div className='bg-slate-900/50 rounded-lg p-4'>
            <h4 className='text-lg font-medium text-white mb-4'>Quantum Probability States</h4>
            <div className='space-y-3'>
              {[
                {
                  state: 'Lakers Win State',
                  probability: 0.627,
                  entanglement: 'Correlated with LeBron O25.5',
                  decoherence: '47ms',
                  confidence: 94.7,
                },
                {
                  state: 'Under 219.5 State',
                  probability: 0.734,
                  entanglement: 'Anti-correlated with pace',
                  decoherence: '23ms',
                  confidence: 89.2,
                },
                {
                  state: 'Curry O4.5 3PM State',
                  probability: 0.583,
                  entanglement: 'Dependent on defensive scheme',
                  decoherence: '31ms',
                  confidence: 91.8,
                },
              ].map((state, index) => (
                <div key={index} className='bg-slate-800/50 rounded-lg p-3'>
                  <div className='text-white font-medium text-sm mb-2'>{state.state}</div>
                  <div className='grid grid-cols-2 gap-2 text-xs mb-2'>
                    <div className='text-gray-400'>
                      Probability:{' '}
                      <span className='text-cyan-400'>{(state.probability * 100).toFixed(1)}%</span>
                    </div>
                    <div className='text-gray-400'>
                      Confidence: <span className='text-green-400'>{state.confidence}%</span>
                    </div>
                    <div className='text-gray-400'>
                      Decoherence: <span className='text-purple-400'>{state.decoherence}</span>
                    </div>
                  </div>
                  <div className='text-yellow-400 text-xs'>{state.entanglement}</div>
                </div>
              ))}
            </div>
          </div>

          <div className='bg-slate-900/50 rounded-lg p-4'>
            <h4 className='text-lg font-medium text-white mb-4'>Superposition Analysis</h4>
            <div className='space-y-3'>
              {[
                {
                  scenario: 'Multi-Path Outcome Analysis',
                  paths: 8192,
                  convergence: '99.7%',
                  optimalPath: 'Lakers -2.5 + Under 220',
                  expectedValue: '+23.7%',
                },
                {
                  scenario: 'Entangled Prop Correlation',
                  paths: 4096,
                  convergence: '97.3%',
                  optimalPath: 'LeBron O25.5 + AD O22.5',
                  expectedValue: '+18.9%',
                },
                {
                  scenario: 'Quantum Arbitrage Detection',
                  paths: 16384,
                  convergence: '99.9%',
                  optimalPath: 'Cross-book inefficiency',
                  expectedValue: '+12.4%',
                },
              ].map((analysis, index) => (
                <div key={index} className='bg-slate-800/50 rounded-lg p-3'>
                  <div className='text-white font-medium text-sm mb-2'>{analysis.scenario}</div>
                  <div className='grid grid-cols-2 gap-2 text-xs mb-2'>
                    <div className='text-gray-400'>
                      Paths: <span className='text-white'>{analysis.paths.toLocaleString()}</span>
                    </div>
                    <div className='text-gray-400'>
                      Convergence: <span className='text-cyan-400'>{analysis.convergence}</span>
                    </div>
                    <div className='text-gray-400'>
                      Expected Value:{' '}
                      <span className='text-green-400'>{analysis.expectedValue}</span>
                    </div>
                  </div>
                  <div className='text-purple-400 text-xs'>{analysis.optimalPath}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Advanced Risk Modeling Engine */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.6 }}
        className='bg-slate-800/50 backdrop-blur-lg border border-slate-700/50 rounded-xl p-6 mt-8'
      >
        <div className='flex items-center justify-between mb-6'>
          <div>
            <h3 className='text-xl font-bold text-white'>Advanced Risk Modeling Engine</h3>
            <p className='text-gray-400 text-sm'>
              Multi-factor risk models with stress testing and scenario analysis
            </p>
          </div>
          <Shield className='w-6 h-6 text-red-400' />
        </div>

        <div className='grid grid-cols-1 md:grid-cols-4 gap-4 mb-6'>
          <div className='bg-slate-900/50 rounded-lg p-4 text-center'>
            <div className='text-2xl font-bold text-red-400 mb-1'>$2,847</div>
            <div className='text-sm text-gray-400'>Value at Risk (95%)</div>
            <div className='text-xs text-red-300 mt-1'>1-day horizon</div>
          </div>
          <div className='bg-slate-900/50 rounded-lg p-4 text-center'>
            <div className='text-2xl font-bold text-yellow-400 mb-1'>$4,230</div>
            <div className='text-sm text-gray-400'>Expected Shortfall</div>
            <div className='text-xs text-yellow-300 mt-1'>Conditional VaR</div>
          </div>
          <div className='bg-slate-900/50 rounded-lg p-4 text-center'>
            <div className='text-2xl font-bold text-purple-400 mb-1'>0.23</div>
            <div className='text-sm text-gray-400'>Portfolio Beta</div>
            <div className='text-xs text-purple-300 mt-1'>Market correlation</div>
          </div>
          <div className='bg-slate-900/50 rounded-lg p-4 text-center'>
            <div className='text-2xl font-bold text-cyan-400 mb-1'>97.3%</div>
            <div className='text-sm text-gray-400'>Model Confidence</div>
            <div className='text-xs text-cyan-300 mt-1'>Risk prediction</div>
          </div>
        </div>

        <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
          <div className='bg-slate-900/50 rounded-lg p-4'>
            <h4 className='text-sm font-medium text-gray-400 mb-3'>Factor Risk Decomposition</h4>
            <div className='space-y-3'>
              {[
                {
                  factor: 'Market Risk',
                  contribution: 34.7,
                  volatility: 12.3,
                  correlation: 0.67,
                  betaExposure: 0.23,
                  type: 'Systematic',
                },
                {
                  factor: 'Sport-Specific Risk',
                  contribution: 28.9,
                  volatility: 18.7,
                  correlation: 0.34,
                  betaExposure: 0.41,
                  type: 'Systematic',
                },
                {
                  factor: 'Bookmaker Risk',
                  contribution: 19.4,
                  volatility: 8.9,
                  correlation: 0.12,
                  betaExposure: 0.18,
                  type: 'Idiosyncratic',
                },
                {
                  factor: 'Liquidity Risk',
                  contribution: 12.8,
                  volatility: 15.2,
                  correlation: 0.28,
                  betaExposure: 0.09,
                  type: 'Idiosyncratic',
                },
                {
                  factor: 'Model Risk',
                  contribution: 4.2,
                  volatility: 6.1,
                  correlation: 0.05,
                  betaExposure: 0.03,
                  type: 'Idiosyncratic',
                },
              ].map((factor, index) => (
                <div key={index} className='bg-slate-800/50 rounded-lg p-3'>
                  <div className='flex items-center justify-between mb-2'>
                    <span className='text-white font-medium text-sm'>{factor.factor}</span>
                    <span className='text-red-400 text-sm'>{factor.contribution}%</span>
                  </div>
                  <div className='w-full bg-slate-700 rounded-full h-2 mb-2'>
                    <div
                      className='h-2 bg-red-400 rounded-full'
                      style={{ width: `${factor.contribution}%` }}
                    />
                  </div>
                  <div className='grid grid-cols-2 gap-2 text-xs'>
                    <div className='text-gray-400'>
                      Volatility: <span className='text-yellow-400'>{factor.volatility}%</span>
                    </div>
                    <div className='text-gray-400'>
                      Correlation: <span className='text-cyan-400'>{factor.correlation}</span>
                    </div>
                    <div className='text-gray-400'>
                      Beta: <span className='text-purple-400'>{factor.betaExposure}</span>
                    </div>
                    <div className='text-gray-400'>
                      Type: <span className='text-green-400'>{factor.type}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className='bg-slate-900/50 rounded-lg p-4'>
            <h4 className='text-sm font-medium text-gray-400 mb-3'>Stress Testing Scenarios</h4>
            <div className='space-y-3'>
              {[
                {
                  scenario: 'Market Crash (-30%)',
                  portfolioImpact: -8.7,
                  worstPosition: 'NBA Props (-23.4%)',
                  hedgeEffectiveness: 73.2,
                  recoveryTime: '14 days',
                },
                {
                  scenario: 'Sportsbook Closure',
                  portfolioImpact: -12.3,
                  worstPosition: 'Cross-book Arbs (-45.7%)',
                  hedgeEffectiveness: 56.8,
                  recoveryTime: '7 days',
                },
                {
                  scenario: 'Regulation Change',
                  portfolioImpact: -15.9,
                  worstPosition: 'Live Betting (-67.2%)',
                  hedgeEffectiveness: 41.5,
                  recoveryTime: '21 days',
                },
                {
                  scenario: 'Model Breakdown',
                  portfolioImpact: -6.4,
                  worstPosition: 'AI Props (-18.9%)',
                  hedgeEffectiveness: 82.7,
                  recoveryTime: '3 days',
                },
              ].map((stress, index) => (
                <div key={index} className='bg-slate-800/50 rounded-lg p-3'>
                  <div className='text-white font-medium text-sm mb-2'>{stress.scenario}</div>
                  <div className='grid grid-cols-2 gap-2 text-xs mb-2'>
                    <div className='text-gray-400'>
                      Impact: <span className='text-red-400'>{stress.portfolioImpact}%</span>
                    </div>
                    <div className='text-gray-400'>
                      Recovery: <span className='text-cyan-400'>{stress.recoveryTime}</span>
                    </div>
                    <div className='text-gray-400'>
                      Hedge Eff:{' '}
                      <span className='text-green-400'>{stress.hedgeEffectiveness}%</span>
                    </div>
                  </div>
                  <div className='text-yellow-400 text-xs'>{stress.worstPosition}</div>
                </div>
              ))}
            </div>
          </div>

          <div className='bg-slate-900/50 rounded-lg p-4'>
            <h4 className='text-sm font-medium text-gray-400 mb-3'>Risk Metrics Dashboard</h4>
            <div className='space-y-3'>
              <div className='grid grid-cols-1 gap-3'>
                <div className='bg-slate-800/50 rounded-lg p-3'>
                  <div className='text-white text-sm font-medium mb-1'>Sharpe Ratio</div>
                  <div className='text-2xl font-bold text-green-400'>2.87</div>
                  <div className='text-xs text-gray-400'>Risk-adjusted return</div>
                </div>
                <div className='bg-slate-800/50 rounded-lg p-3'>
                  <div className='text-white text-sm font-medium mb-1'>Sortino Ratio</div>
                  <div className='text-2xl font-bold text-cyan-400'>3.42</div>
                  <div className='text-xs text-gray-400'>Downside deviation</div>
                </div>
                <div className='bg-slate-800/50 rounded-lg p-3'>
                  <div className='text-white text-sm font-medium mb-1'>Calmar Ratio</div>
                  <div className='text-2xl font-bold text-purple-400'>4.67</div>
                  <div className='text-xs text-gray-400'>Return/max drawdown</div>
                </div>
              </div>

              <div className='space-y-2'>
                {[
                  { metric: 'Information Ratio', value: '1.89', benchmark: 'vs Market' },
                  { metric: 'Treynor Ratio', value: '0.47', benchmark: 'per Beta' },
                  { metric: 'Jensen Alpha', value: '+12.4%', benchmark: 'CAPM excess' },
                ].map((metric, index) => (
                  <div key={index} className='flex items-center justify-between text-sm'>
                    <span className='text-gray-400'>{metric.metric}</span>
                    <div className='text-right'>
                      <span className='text-white font-medium'>{metric.value}</span>
                      <div className='text-gray-400 text-xs'>{metric.benchmark}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Real-Time Execution Analytics */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.7 }}
        className='bg-slate-800/50 backdrop-blur-lg border border-slate-700/50 rounded-xl p-6 mt-8'
      >
        <div className='flex items-center justify-between mb-6'>
          <div>
            <h3 className='text-xl font-bold text-white'>Real-Time Execution Analytics</h3>
            <p className='text-gray-400 text-sm'>
              Transaction cost analysis, slippage modeling, and execution optimization
            </p>
          </div>
          <Activity className='w-6 h-6 text-green-400' />
        </div>

        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
          <div className='bg-slate-900/50 rounded-lg p-4'>
            <h4 className='text-lg font-medium text-white mb-4'>Execution Performance</h4>
            <div className='space-y-3'>
              {[
                {
                  timeframe: 'Last Hour',
                  orders: 47,
                  filled: 46,
                  avgSlippage: 0.03,
                  avgLatency: 234,
                  costSaved: 420,
                },
                {
                  timeframe: 'Last 4 Hours',
                  orders: 189,
                  filled: 184,
                  avgSlippage: 0.05,
                  avgLatency: 267,
                  costSaved: 1680,
                },
                {
                  timeframe: 'Today',
                  orders: 567,
                  filled: 551,
                  avgSlippage: 0.07,
                  avgLatency: 298,
                  costSaved: 4230,
                },
                {
                  timeframe: 'This Week',
                  orders: 2847,
                  filled: 2769,
                  avgSlippage: 0.08,
                  avgLatency: 312,
                  costSaved: 18420,
                },
              ].map((execution, index) => (
                <div key={index} className='bg-slate-800/50 rounded-lg p-3'>
                  <div className='text-white font-medium text-sm mb-2'>{execution.timeframe}</div>
                  <div className='grid grid-cols-3 gap-2 text-xs'>
                    <div className='text-gray-400'>
                      Orders: <span className='text-white'>{execution.orders}</span>
                    </div>
                    <div className='text-gray-400'>
                      Filled: <span className='text-green-400'>{execution.filled}</span>
                    </div>
                    <div className='text-gray-400'>
                      Fill Rate:{' '}
                      <span className='text-cyan-400'>
                        {((execution.filled / execution.orders) * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className='text-gray-400'>
                      Slippage: <span className='text-yellow-400'>{execution.avgSlippage}%</span>
                    </div>
                    <div className='text-gray-400'>
                      Latency: <span className='text-purple-400'>{execution.avgLatency}ms</span>
                    </div>
                    <div className='text-gray-400'>
                      Saved: <span className='text-green-400'>${execution.costSaved}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className='bg-slate-900/50 rounded-lg p-4'>
            <h4 className='text-lg font-medium text-white mb-4'>Market Impact Analysis</h4>
            <div className='space-y-3'>
              {[
                {
                  orderSize: 'Small ($0-500)',
                  orders: 1847,
                  avgImpact: 0.01,
                  temporaryImpact: 0.008,
                  permanentImpact: 0.002,
                  costBps: 0.7,
                },
                {
                  orderSize: 'Medium ($500-2000)',
                  orders: 734,
                  avgImpact: 0.03,
                  temporaryImpact: 0.021,
                  permanentImpact: 0.009,
                  costBps: 2.1,
                },
                {
                  orderSize: 'Large ($2000-5000)',
                  orders: 156,
                  avgImpact: 0.07,
                  temporaryImpact: 0.048,
                  permanentImpact: 0.022,
                  costBps: 4.9,
                },
                {
                  orderSize: 'XL ($5000+)',
                  orders: 32,
                  avgImpact: 0.15,
                  temporaryImpact: 0.098,
                  permanentImpact: 0.052,
                  costBps: 10.3,
                },
              ].map((impact, index) => (
                <div key={index} className='bg-slate-800/50 rounded-lg p-3'>
                  <div className='text-white font-medium text-sm mb-2'>{impact.orderSize}</div>
                  <div className='grid grid-cols-2 gap-2 text-xs mb-2'>
                    <div className='text-gray-400'>
                      Orders: <span className='text-white'>{impact.orders}</span>
                    </div>
                    <div className='text-gray-400'>
                      Avg Impact: <span className='text-red-400'>{impact.avgImpact}%</span>
                    </div>
                    <div className='text-gray-400'>
                      Temporary: <span className='text-yellow-400'>{impact.temporaryImpact}%</span>
                    </div>
                    <div className='text-gray-400'>
                      Permanent: <span className='text-orange-400'>{impact.permanentImpact}%</span>
                    </div>
                  </div>
                  <div className='text-cyan-400 text-xs'>Cost: {impact.costBps} bps</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </Layout>
  );
};

export default ArbitrageScanner;
