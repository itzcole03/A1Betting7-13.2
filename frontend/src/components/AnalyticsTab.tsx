import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  Target, 
  DollarSign,
  Percent,
  Calendar,
  Award,
  Activity,
  Zap,
  RefreshCw,
  Filter,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';

interface AnalyticsData {
  winRate: number;
  totalBets: number;
  profit: number;
  roi: number;
  avgOdds: number;
  bestSport: string;
  recentPerformance: Array<{
    date: string;
    profit: number;
    bets: number;
  }>;
  sportBreakdown: Array<{
    sport: string;
    winRate: number;
    profit: number;
    bets: number;
  }>;
  monthlyStats: Array<{
    month: string;
    profit: number;
    winRate: number;
  }>;
}

const AnalyticsTab: React.FC = () => {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [timeRange, setTimeRange] = useState('30d');

  // Mock analytics data
  const mockData: AnalyticsData = {
    winRate: 67.3,
    totalBets: 142,
    profit: 2340,
    roi: 15.6,
    avgOdds: -110,
    bestSport: 'NBA',
    recentPerformance: [
      { date: '2024-01-15', profit: 180, bets: 5 },
      { date: '2024-01-14', profit: -75, bets: 3 },
      { date: '2024-01-13', profit: 220, bets: 6 },
      { date: '2024-01-12', profit: 95, bets: 4 },
      { date: '2024-01-11', profit: -50, bets: 2 },
      { date: '2024-01-10', profit: 310, bets: 7 },
      { date: '2024-01-09', profit: 125, bets: 4 }
    ],
    sportBreakdown: [
      { sport: 'NBA', winRate: 72.1, profit: 1250, bets: 43 },
      { sport: 'NFL', winRate: 68.4, profit: 890, bets: 38 },
      { sport: 'NHL', winRate: 61.5, profit: 200, bets: 26 },
      { sport: 'MLB', winRate: 64.7, profit: 0, bets: 35 }
    ],
    monthlyStats: [
      { month: 'Jan 2024', profit: 2340, winRate: 67.3 },
      { month: 'Dec 2023', profit: 1890, winRate: 64.2 },
      { month: 'Nov 2023', profit: 1420, winRate: 69.1 },
      { month: 'Oct 2023', profit: 980, winRate: 61.8 }
    ]
  };

  useEffect(() => {
    setAnalyticsData(mockData);
  }, []);

  const refreshData = async () => {
    setIsLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    setAnalyticsData(mockData);
    setIsLoading(false);
  };

  if (!analyticsData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white">Loading analytics...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-500/20 rounded-xl">
                <BarChart3 className="w-8 h-8 text-purple-400" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">Analytics Dashboard</h1>
                <p className="text-gray-400">Performance tracking and insights</p>
              </div>
            </div>
            
            <div className="flex gap-4 items-center">
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
                <option value="1y">Last year</option>
              </select>
              
              <motion.button
                onClick={refreshData}
                disabled={isLoading}
                className="flex items-center gap-2 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 rounded-lg px-4 py-2 text-purple-400 transition-colors disabled:opacity-50"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* Key Metrics */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        >
          <div className="bg-slate-800/50 backdrop-blur-lg border border-slate-700/50 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400 mb-1">Win Rate</p>
                <p className="text-2xl font-bold text-white">{analyticsData.winRate}%</p>
                <div className="flex items-center gap-1 mt-2">
                  <ArrowUpRight className="w-4 h-4 text-green-400" />
                  <span className="text-green-400 text-sm">+2.3%</span>
                </div>
              </div>
              <div className="p-3 bg-green-500/20 rounded-lg">
                <Target className="w-6 h-6 text-green-400" />
              </div>
            </div>
          </div>

          <div className="bg-slate-800/50 backdrop-blur-lg border border-slate-700/50 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400 mb-1">Total Profit</p>
                <p className="text-2xl font-bold text-white">${analyticsData.profit}</p>
                <div className="flex items-center gap-1 mt-2">
                  <ArrowUpRight className="w-4 h-4 text-green-400" />
                  <span className="text-green-400 text-sm">+$180</span>
                </div>
              </div>
              <div className="p-3 bg-emerald-500/20 rounded-lg">
                <DollarSign className="w-6 h-6 text-emerald-400" />
              </div>
            </div>
          </div>

          <div className="bg-slate-800/50 backdrop-blur-lg border border-slate-700/50 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400 mb-1">ROI</p>
                <p className="text-2xl font-bold text-white">{analyticsData.roi}%</p>
                <div className="flex items-center gap-1 mt-2">
                  <ArrowUpRight className="w-4 h-4 text-blue-400" />
                  <span className="text-blue-400 text-sm">+1.2%</span>
                </div>
              </div>
              <div className="p-3 bg-blue-500/20 rounded-lg">
                <Percent className="w-6 h-6 text-blue-400" />
              </div>
            </div>
          </div>

          <div className="bg-slate-800/50 backdrop-blur-lg border border-slate-700/50 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400 mb-1">Total Bets</p>
                <p className="text-2xl font-bold text-white">{analyticsData.totalBets}</p>
                <div className="flex items-center gap-1 mt-2">
                  <ArrowUpRight className="w-4 h-4 text-purple-400" />
                  <span className="text-purple-400 text-sm">+5 today</span>
                </div>
              </div>
              <div className="p-3 bg-purple-500/20 rounded-lg">
                <Activity className="w-6 h-6 text-purple-400" />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Charts and Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Recent Performance */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-slate-800/50 backdrop-blur-lg border border-slate-700/50 rounded-xl p-6"
          >
            <h3 className="text-xl font-bold text-white mb-6">Recent Performance</h3>
            <div className="space-y-4">
              {analyticsData.recentPerformance.map((day, index) => (
                <div key={day.date} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-purple-400"></div>
                    <span className="text-gray-300">{new Date(day.date).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-400">{day.bets} bets</span>
                    <span className={`font-semibold ${day.profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {day.profit >= 0 ? '+' : ''}${day.profit}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Sport Breakdown */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-slate-800/50 backdrop-blur-lg border border-slate-700/50 rounded-xl p-6"
          >
            <h3 className="text-xl font-bold text-white mb-6">Sport Breakdown</h3>
            <div className="space-y-4">
              {analyticsData.sportBreakdown.map((sport) => (
                <div key={sport.sport} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-white font-medium">{sport.sport}</span>
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-gray-400">{sport.bets} bets</span>
                      <span className={`font-semibold ${sport.profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        ${sport.profit}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 bg-slate-700 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-purple-400 to-blue-400 h-2 rounded-full transition-all"
                        style={{ width: `${sport.winRate}%` }}
                      />
                    </div>
                    <span className="text-sm text-white font-semibold">{sport.winRate}%</span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Monthly Trends */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-slate-800/50 backdrop-blur-lg border border-slate-700/50 rounded-xl p-6"
        >
          <h3 className="text-xl font-bold text-white mb-6">Monthly Trends</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {analyticsData.monthlyStats.map((month) => (
              <div key={month.month} className="bg-slate-700/30 rounded-lg p-4">
                <h4 className="text-white font-semibold mb-2">{month.month}</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-400 text-sm">Profit:</span>
                    <span className={`font-semibold ${month.profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      ${month.profit}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400 text-sm">Win Rate:</span>
                    <span className="text-white font-semibold">{month.winRate}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Insights */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-8 bg-slate-800/50 backdrop-blur-lg border border-slate-700/50 rounded-xl p-6"
        >
          <h3 className="text-xl font-bold text-white mb-4">AI Insights</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-5 h-5 text-green-400" />
                <span className="text-green-400 font-semibold">Strength</span>
              </div>
              <p className="text-gray-300 text-sm">
                Your NBA betting shows exceptional performance with 72.1% win rate. Consider increasing stake size for NBA picks.
              </p>
            </div>
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-5 h-5 text-yellow-400" />
                <span className="text-yellow-400 font-semibold">Opportunity</span>
              </div>
              <p className="text-gray-300 text-sm">
                MLB performance is break-even. Consider reducing exposure or adjusting strategy for baseball props.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AnalyticsTab;
