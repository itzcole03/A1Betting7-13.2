import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Activity, 
  TrendingUp, 
  TrendingDown,
  DollarSign, 
  Calendar, 
  Filter,
  Plus,
  Target,
  PieChart,
  BarChart3,
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Clock,
  Star,
  Download,
  RefreshCw
} from 'lucide-react';

interface BetEntry {
  id: string;
  timestamp: Date;
  player: string;
  prop: string;
  line: number;
  bet: 'OVER' | 'UNDER';
  odds: number;
  stake: number;
  sportsbook: string;
  confidence: number;
  expectedValue: number;
  status: 'PENDING' | 'WON' | 'LOST' | 'PUSH' | 'VOID';
  result?: number;
  payout?: number;
  notes?: string;
  tags: string[];
}

interface BetStats {
  totalBets: number;
  totalStaked: number;
  totalReturn: number;
  profit: number;
  roi: number;
  winRate: number;
  avgOdds: number;
  avgStake: number;
  avgConfidence: number;
  longestWinStreak: number;
  currentStreak: number;
  bestBet: BetEntry | null;
  worstBet: BetEntry | null;
}

interface PerformanceMetrics {
  daily: { date: string; profit: number; bets: number }[];
  byConfidence: { range: string; winRate: number; roi: number; count: number }[];
  bySportsbook: { name: string; profit: number; winRate: number; count: number }[];
  byPropType: { prop: string; profit: number; winRate: number; count: number }[];
}

const BetTrackingDashboard: React.FC = () => {
  const [bets, setBets] = useState<BetEntry[]>([]);
  const [filteredBets, setFilteredBets] = useState<BetEntry[]>([]);
  const [stats, setStats] = useState<BetStats | null>(null);
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'bets' | 'analytics' | 'add'>('overview');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [filterDateRange, setFilterDateRange] = useState<string>('ALL');
  const [isAddingBet, setIsAddingBet] = useState(false);

  // Mock data for demonstration
  const mockBets: BetEntry[] = [
    {
      id: '1',
      timestamp: new Date('2025-01-13'),
      player: 'Mike Trout',
      prop: 'Total Bases',
      line: 1.5,
      bet: 'OVER',
      odds: -115,
      stake: 100,
      sportsbook: 'DraftKings',
      confidence: 82,
      expectedValue: 12.5,
      status: 'WON',
      result: 2,
      payout: 186.96,
      notes: 'Strong matchup vs RHP, favorable wind conditions',
      tags: ['high-confidence', 'weather-play']
    },
    {
      id: '2',
      timestamp: new Date('2025-01-12'),
      player: 'Shohei Ohtani',
      prop: 'Hits + Runs + RBI',
      line: 2.5,
      bet: 'OVER',
      odds: -105,
      stake: 75,
      sportsbook: 'FanDuel',
      confidence: 78,
      expectedValue: 9.8,
      status: 'LOST',
      result: 2,
      payout: 0,
      notes: 'Got unlucky with BABIP',
      tags: ['combo-prop']
    },
    {
      id: '3',
      timestamp: new Date('2025-01-11'),
      player: 'Aaron Judge',
      prop: 'Home Runs',
      line: 0.5,
      bet: 'OVER',
      odds: +150,
      stake: 50,
      sportsbook: 'BetMGM',
      confidence: 65,
      expectedValue: 8.2,
      status: 'PENDING',
      notes: 'Wind favoring right field',
      tags: ['homer-prop', 'weather-play']
    }
  ];

  useEffect(() => {
    // Load mock data
    setBets(mockBets);
    setFilteredBets(mockBets);
    calculateStats(mockBets);
    calculateMetrics(mockBets);
  }, []);

  useEffect(() => {
    applyFilters();
  }, [bets, filterStatus, filterDateRange]);

  const calculateStats = (betData: BetEntry[]): void => {
    if (betData.length === 0) {
      setStats(null);
      return;
    }

    const completedBets = betData.filter(bet => ['WON', 'LOST', 'PUSH'].includes(bet.status));
    const wonBets = completedBets.filter(bet => bet.status === 'WON');
    
    const totalStaked = betData.reduce((sum, bet) => sum + bet.stake, 0);
    const totalReturn = completedBets.reduce((sum, bet) => sum + (bet.payout || 0), 0);
    const profit = totalReturn - completedBets.reduce((sum, bet) => sum + bet.stake, 0);
    
    const winRate = completedBets.length > 0 ? (wonBets.length / completedBets.length) * 100 : 0;
    const roi = completedBets.length > 0 ? (profit / completedBets.reduce((sum, bet) => sum + bet.stake, 0)) * 100 : 0;
    
    const avgOdds = betData.length > 0 ? betData.reduce((sum, bet) => sum + bet.odds, 0) / betData.length : 0;
    const avgStake = betData.length > 0 ? totalStaked / betData.length : 0;
    const avgConfidence = betData.length > 0 ? betData.reduce((sum, bet) => sum + bet.confidence, 0) / betData.length : 0;

    // Calculate streaks
    let currentStreak = 0;
    let longestWinStreak = 0;
    let tempStreak = 0;
    
    for (let i = completedBets.length - 1; i >= 0; i--) {
      if (completedBets[i].status === 'WON') {
        if (i === completedBets.length - 1) currentStreak++;
        tempStreak++;
        longestWinStreak = Math.max(longestWinStreak, tempStreak);
      } else {
        if (i === completedBets.length - 1 && completedBets[i].status === 'LOST') {
          currentStreak = -1;
        }
        tempStreak = 0;
      }
    }

    const bestBet = wonBets.length > 0 ? wonBets.reduce((best, bet) => 
      ((bet.payout || 0) - bet.stake) > ((best.payout || 0) - best.stake) ? bet : best
    ) : null;

    const lostBets = completedBets.filter(bet => bet.status === 'LOST');
    const worstBet = lostBets.length > 0 ? lostBets.reduce((worst, bet) => 
      bet.stake > worst.stake ? bet : worst
    ) : null;

    setStats({
      totalBets: betData.length,
      totalStaked,
      totalReturn,
      profit,
      roi,
      winRate,
      avgOdds,
      avgStake,
      avgConfidence,
      longestWinStreak,
      currentStreak,
      bestBet,
      worstBet
    });
  };

  const calculateMetrics = (betData: BetEntry[]): void => {
    const completedBets = betData.filter(bet => ['WON', 'LOST', 'PUSH'].includes(bet.status));
    
    // Daily metrics
    const dailyMap = new Map();
    completedBets.forEach(bet => {
      const date = bet.timestamp.toISOString().split('T')[0];
      if (!dailyMap.has(date)) {
        dailyMap.set(date, { profit: 0, bets: 0 });
      }
      const day = dailyMap.get(date);
      day.profit += (bet.payout || 0) - bet.stake;
      day.bets += 1;
    });
    
    const daily = Array.from(dailyMap.entries()).map(([date, data]) => ({
      date,
      profit: data.profit,
      bets: data.bets
    }));

    // Confidence analysis
    const confidenceRanges = [
      { range: '80-100%', min: 80, max: 100 },
      { range: '60-79%', min: 60, max: 79 },
      { range: '40-59%', min: 40, max: 59 },
      { range: '20-39%', min: 20, max: 39 }
    ];

    const byConfidence = confidenceRanges.map(range => {
      const rangeBets = completedBets.filter(bet => 
        bet.confidence >= range.min && bet.confidence <= range.max
      );
      const winRate = rangeBets.length > 0 ? 
        (rangeBets.filter(bet => bet.status === 'WON').length / rangeBets.length) * 100 : 0;
      const totalStaked = rangeBets.reduce((sum, bet) => sum + bet.stake, 0);
      const totalReturn = rangeBets.reduce((sum, bet) => sum + (bet.payout || 0), 0);
      const roi = totalStaked > 0 ? ((totalReturn - totalStaked) / totalStaked) * 100 : 0;
      
      return {
        range: range.range,
        winRate,
        roi,
        count: rangeBets.length
      };
    });

    // Sportsbook analysis
    const sportsbookMap = new Map();
    completedBets.forEach(bet => {
      if (!sportsbookMap.has(bet.sportsbook)) {
        sportsbookMap.set(bet.sportsbook, { profit: 0, won: 0, total: 0 });
      }
      const book = sportsbookMap.get(bet.sportsbook);
      book.profit += (bet.payout || 0) - bet.stake;
      if (bet.status === 'WON') book.won += 1;
      book.total += 1;
    });

    const bySportsbook = Array.from(sportsbookMap.entries()).map(([name, data]) => ({
      name,
      profit: data.profit,
      winRate: (data.won / data.total) * 100,
      count: data.total
    }));

    // Prop type analysis
    const propMap = new Map();
    completedBets.forEach(bet => {
      if (!propMap.has(bet.prop)) {
        propMap.set(bet.prop, { profit: 0, won: 0, total: 0 });
      }
      const prop = propMap.get(bet.prop);
      prop.profit += (bet.payout || 0) - bet.stake;
      if (bet.status === 'WON') prop.won += 1;
      prop.total += 1;
    });

    const byPropType = Array.from(propMap.entries()).map(([prop, data]) => ({
      prop,
      profit: data.profit,
      winRate: (data.won / data.total) * 100,
      count: data.total
    }));

    setMetrics({
      daily,
      byConfidence,
      bySportsbook,
      byPropType
    });
  };

  const applyFilters = (): void => {
    let filtered = [...bets];

    if (filterStatus !== 'ALL') {
      filtered = filtered.filter(bet => bet.status === filterStatus);
    }

    if (filterDateRange !== 'ALL') {
      const now = new Date();
      let startDate: Date;
      
      switch (filterDateRange) {
        case '7D':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30D':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case '90D':
          startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          break;
        default:
          startDate = new Date(0);
      }
      
      filtered = filtered.filter(bet => bet.timestamp >= startDate);
    }

    setFilteredBets(filtered);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'WON': return 'text-green-400 bg-green-500/20';
      case 'LOST': return 'text-red-400 bg-red-500/20';
      case 'PENDING': return 'text-yellow-400 bg-yellow-500/20';
      case 'PUSH': return 'text-blue-400 bg-blue-500/20';
      case 'VOID': return 'text-slate-400 bg-slate-500/20';
      default: return 'text-slate-400 bg-slate-500/20';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatOdds = (odds: number) => {
    return odds > 0 ? `+${odds}` : odds.toString();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-cyan-300">
      {/* Header */}
      <div className="border-b border-cyan-800/30 bg-black/20 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">
                Bet Tracking Dashboard
              </h1>
              <p className="text-slate-400 mt-1">Track performance, analyze trends, and optimize your betting strategy</p>
            </div>
            <div className="flex items-center space-x-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsAddingBet(true)}
                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 px-4 py-2 rounded-lg flex items-center space-x-2 transition-all duration-200"
              >
                <Plus className="w-4 h-4" />
                <span>Add Bet</span>
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-lg flex items-center space-x-2 transition-all duration-200"
              >
                <Download className="w-4 h-4" />
                <span>Export</span>
              </motion.button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Tab Navigation */}
        <div className="flex space-x-1 bg-slate-800/30 rounded-lg p-1 mb-8">
          {[
            { key: 'overview', label: 'Overview', icon: Eye },
            { key: 'bets', label: 'Bet History', icon: Activity },
            { key: 'analytics', label: 'Analytics', icon: BarChart3 },
            { key: 'add', label: 'Add Bet', icon: Plus }
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key as any)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-all duration-200 ${
                activeTab === key
                  ? 'bg-cyan-600 text-white'
                  : 'text-slate-400 hover:text-cyan-300 hover:bg-slate-700/50'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {activeTab === 'overview' && stats && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Key Metrics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="bg-slate-800/50 rounded-xl p-6 border border-cyan-800/30">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-green-500/20 rounded-lg">
                      <TrendingUp className="w-6 h-6 text-green-400" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-green-400">
                        {formatCurrency(stats.profit)}
                      </div>
                      <div className="text-sm text-slate-400">Total Profit</div>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-800/50 rounded-xl p-6 border border-cyan-800/30">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-500/20 rounded-lg">
                      <Target className="w-6 h-6 text-blue-400" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-blue-400">
                        {stats.winRate.toFixed(1)}%
                      </div>
                      <div className="text-sm text-slate-400">Win Rate</div>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-800/50 rounded-xl p-6 border border-cyan-800/30">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-yellow-500/20 rounded-lg">
                      <DollarSign className="w-6 h-6 text-yellow-400" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-yellow-400">
                        {stats.roi > 0 ? '+' : ''}{stats.roi.toFixed(1)}%
                      </div>
                      <div className="text-sm text-slate-400">ROI</div>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-800/50 rounded-xl p-6 border border-cyan-800/30">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-purple-500/20 rounded-lg">
                      <Activity className="w-6 h-6 text-purple-400" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-purple-400">
                        {stats.totalBets}
                      </div>
                      <div className="text-sm text-slate-400">Total Bets</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Performance Summary */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-slate-800/50 rounded-xl p-6 border border-cyan-800/30">
                  <h3 className="text-xl font-semibold text-cyan-100 mb-4">Performance Stats</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Total Staked</span>
                      <span className="text-cyan-100 font-medium">{formatCurrency(stats.totalStaked)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Total Return</span>
                      <span className="text-cyan-100 font-medium">{formatCurrency(stats.totalReturn)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Average Stake</span>
                      <span className="text-cyan-100 font-medium">{formatCurrency(stats.avgStake)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Average Confidence</span>
                      <span className="text-cyan-100 font-medium">{stats.avgConfidence.toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Longest Win Streak</span>
                      <span className="text-cyan-100 font-medium">{stats.longestWinStreak}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Current Streak</span>
                      <span className={`font-medium ${stats.currentStreak > 0 ? 'text-green-400' : stats.currentStreak < 0 ? 'text-red-400' : 'text-slate-400'}`}>
                        {stats.currentStreak > 0 ? `+${stats.currentStreak}` : stats.currentStreak}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-800/50 rounded-xl p-6 border border-cyan-800/30">
                  <h3 className="text-xl font-semibold text-cyan-100 mb-4">Recent Bets</h3>
                  <div className="space-y-3">
                    {filteredBets.slice(0, 5).map((bet) => (
                      <div key={bet.id} className="bg-slate-700/30 rounded-lg p-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-medium text-cyan-100">{bet.player}</div>
                            <div className="text-sm text-slate-400">{bet.prop} {bet.line} {bet.bet}</div>
                          </div>
                          <div className="text-right">
                            <div className={`text-xs px-2 py-1 rounded ${getStatusColor(bet.status)}`}>
                              {bet.status}
                            </div>
                            <div className="text-sm text-slate-400 mt-1">{formatCurrency(bet.stake)}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'bets' && (
            <motion.div
              key="bets"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Filters */}
              <div className="bg-slate-800/50 rounded-xl p-6 border border-cyan-800/30">
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center space-x-2">
                    <Filter className="w-4 h-4 text-slate-400" />
                    <span className="text-slate-400">Filters:</span>
                  </div>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-cyan-100"
                  >
                    <option value="ALL">All Status</option>
                    <option value="PENDING">Pending</option>
                    <option value="WON">Won</option>
                    <option value="LOST">Lost</option>
                    <option value="PUSH">Push</option>
                  </select>
                  <select
                    value={filterDateRange}
                    onChange={(e) => setFilterDateRange(e.target.value)}
                    className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-cyan-100"
                  >
                    <option value="ALL">All Time</option>
                    <option value="7D">Last 7 Days</option>
                    <option value="30D">Last 30 Days</option>
                    <option value="90D">Last 90 Days</option>
                  </select>
                </div>
              </div>

              {/* Bet List */}
              <div className="bg-slate-800/50 rounded-xl border border-cyan-800/30 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-700/50">
                      <tr>
                        <th className="text-left p-4 text-slate-300">Date</th>
                        <th className="text-left p-4 text-slate-300">Player</th>
                        <th className="text-left p-4 text-slate-300">Prop</th>
                        <th className="text-center p-4 text-slate-300">Bet</th>
                        <th className="text-center p-4 text-slate-300">Odds</th>
                        <th className="text-center p-4 text-slate-300">Stake</th>
                        <th className="text-center p-4 text-slate-300">Confidence</th>
                        <th className="text-center p-4 text-slate-300">Status</th>
                        <th className="text-center p-4 text-slate-300">P&L</th>
                        <th className="text-center p-4 text-slate-300">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredBets.map((bet) => (
                        <tr key={bet.id} className="border-t border-slate-700/30 hover:bg-slate-700/20">
                          <td className="p-4 text-cyan-100">{bet.timestamp.toLocaleDateString()}</td>
                          <td className="p-4 text-cyan-100 font-medium">{bet.player}</td>
                          <td className="p-4 text-cyan-100">{bet.prop} {bet.line}</td>
                          <td className="p-4 text-center">
                            <span className={`px-2 py-1 rounded text-xs ${
                              bet.bet === 'OVER' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                            }`}>
                              {bet.bet}
                            </span>
                          </td>
                          <td className="p-4 text-center text-cyan-100">{formatOdds(bet.odds)}</td>
                          <td className="p-4 text-center text-cyan-100">{formatCurrency(bet.stake)}</td>
                          <td className="p-4 text-center">
                            <span className={`font-medium ${
                              bet.confidence >= 80 ? 'text-green-400' :
                              bet.confidence >= 65 ? 'text-yellow-400' : 'text-red-400'
                            }`}>
                              {bet.confidence}%
                            </span>
                          </td>
                          <td className="p-4 text-center">
                            <span className={`px-2 py-1 rounded text-xs ${getStatusColor(bet.status)}`}>
                              {bet.status}
                            </span>
                          </td>
                          <td className="p-4 text-center">
                            {bet.status === 'PENDING' ? (
                              <span className="text-slate-400">-</span>
                            ) : (
                              <span className={`font-medium ${
                                (bet.payout || 0) - bet.stake > 0 ? 'text-green-400' : 'text-red-400'
                              }`}>
                                {formatCurrency((bet.payout || 0) - bet.stake)}
                              </span>
                            )}
                          </td>
                          <td className="p-4">
                            <div className="flex justify-center space-x-2">
                              <button className="text-blue-400 hover:text-blue-300 transition-colors">
                                <Eye className="w-4 h-4" />
                              </button>
                              <button className="text-green-400 hover:text-green-300 transition-colors">
                                <Edit className="w-4 h-4" />
                              </button>
                              <button className="text-red-400 hover:text-red-300 transition-colors">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'analytics' && metrics && (
            <motion.div
              key="analytics"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="text-center py-12">
                <PieChart className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-slate-300 mb-2">Advanced Analytics Coming Soon</h3>
                <p className="text-slate-400">
                  Detailed performance analytics, trend analysis, and predictive insights.
                </p>
              </div>
            </motion.div>
          )}

          {activeTab === 'add' && (
            <motion.div
              key="add"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="text-center py-12">
                <Plus className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-slate-300 mb-2">Add New Bet</h3>
                <p className="text-slate-400 mb-6">
                  Track your bets by adding them manually or importing from sportsbooks.
                </p>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 px-6 py-3 rounded-lg transition-all duration-200"
                >
                  Get Started
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default BetTrackingDashboard;
