import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  TrendingUp, 
  Target, 
  BarChart3, 
  PieChart, 
  Activity,
  Calendar,
  Star,
  Trophy,
  DollarSign,
  Brain,
  Zap,
  Eye,
  Calculator,
  Filter,
  Download,
  BookOpen,
  Users
} from 'lucide-react';

// Enhanced interfaces based on PropFinder features
interface PlayerStats {
  playerId: string;
  name: string;
  team: string;
  position: string;
  recentGames: GameStats[];
  seasonStats: SeasonStats;
  advancedMetrics: AdvancedMetrics;
  trends: TrendData[];
  matchupData: MatchupData[];
  confidenceScores: ConfidenceScore[];
}

interface GameStats {
  date: string;
  opponent: string;
  stats: Record<string, number>;
  gameResult: 'W' | 'L';
  venue: 'HOME' | 'AWAY';
}

interface SeasonStats {
  battingAvg?: number;
  homeRuns?: number;
  rbi?: number;
  onBasePercentage?: number;
  sluggingPercentage?: number;
  exitVelocity?: number;
  launchAngle?: number;
  strikeoutRate?: number;
}

interface AdvancedMetrics {
  xBA?: number;      // Expected Batting Average
  xSLG?: number;     // Expected Slugging
  hardHitRate?: number;
  barrelRate?: number;
  whiffRate?: number;
  chaseRate?: number;
}

interface TrendData {
  metric: string;
  periods: {
    L5: number;
    L10: number;
    L15: number;
    L20: number;
    L25: number;
    season: number;
  };
  trend: 'up' | 'down' | 'stable';
  confidence: number;
}

interface MatchupData {
  opponent: string;
  gamesPlayed: number;
  avgPerformance: Record<string, number>;
  lastFaceoff: string;
  advantages: string[];
  weaknesses: string[];
}

interface ConfidenceScore {
  prop: string;
  line: number;
  confidence: number;
  expectedValue: number;
  recommendation: 'OVER' | 'UNDER' | 'PASS';
  reasoning: string;
}

interface PropOpportunity {
  player: string;
  prop: string;
  line: number;
  odds: number;
  confidence: number;
  expectedValue: number;
  edge: number;
  recommendation: string;
  reasoning: string;
  sampleSize: number;
}

const EnhancedPlayerDashboard: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlayer, setSelectedPlayer] = useState<PlayerStats | null>(null);
  const [selectedTrendRange, setSelectedTrendRange] = useState<keyof TrendData['periods']>('L10');
  const [activeTab, setActiveTab] = useState<'overview' | 'trends' | 'matchups' | 'props' | 'tracking'>('overview');
  const [isLoading, setIsLoading] = useState(false);
  const [propOpportunities, setPropOpportunities] = useState<PropOpportunity[]>([]);
  const [trackedBets, setTrackedBets] = useState<any[]>([]);

  // Mock data for demonstration
  const mockPlayerData: PlayerStats = {
    playerId: '1',
    name: 'Mike Trout',
    team: 'LAA',
    position: 'OF',
    recentGames: [
      { date: '2025-01-13', opponent: 'TEX', stats: { hits: 2, atBats: 4, homeRuns: 1, rbi: 3 }, gameResult: 'W', venue: 'HOME' },
      { date: '2025-01-12', opponent: 'TEX', stats: { hits: 1, atBats: 3, homeRuns: 0, rbi: 1 }, gameResult: 'W', venue: 'HOME' },
      { date: '2025-01-11', opponent: 'SEA', stats: { hits: 3, atBats: 5, homeRuns: 1, rbi: 2 }, gameResult: 'L', venue: 'AWAY' },
      { date: '2025-01-10', opponent: 'SEA', stats: { hits: 0, atBats: 4, homeRuns: 0, rbi: 0 }, gameResult: 'L', venue: 'AWAY' },
      { date: '2025-01-09', opponent: 'OAK', stats: { hits: 2, atBats: 4, homeRuns: 0, rbi: 1 }, gameResult: 'W', venue: 'HOME' },
    ],
    seasonStats: {
      battingAvg: 0.312,
      homeRuns: 45,
      rbi: 104,
      onBasePercentage: 0.456,
      sluggingPercentage: 0.629,
      exitVelocity: 92.8,
      launchAngle: 13.2,
      strikeoutRate: 0.182
    },
    advancedMetrics: {
      xBA: 0.287,
      xSLG: 0.611,
      hardHitRate: 0.52,
      barrelRate: 0.18,
      whiffRate: 0.24,
      chaseRate: 0.28
    },
    trends: [
      { metric: 'Batting Average', periods: { L5: 0.350, L10: 0.325, L15: 0.310, L20: 0.305, L25: 0.312, season: 0.312 }, trend: 'up', confidence: 85 },
      { metric: 'Home Runs', periods: { L5: 1.2, L10: 0.9, L15: 1.1, L20: 1.0, L25: 0.95, season: 0.89 }, trend: 'up', confidence: 78 },
      { metric: 'RBI', periods: { L5: 2.8, L10: 2.1, L15: 2.0, L20: 1.9, L25: 2.0, season: 1.95 }, trend: 'up', confidence: 72 }
    ],
    matchupData: [
      { opponent: 'TEX', gamesPlayed: 19, avgPerformance: { hits: 1.8, homeRuns: 0.4, rbi: 1.2 }, lastFaceoff: '2024-09-15', advantages: ['Right-handed pitching', 'Outdoor day games'], weaknesses: ['Left-handed relievers'] },
      { opponent: 'SEA', gamesPlayed: 18, avgPerformance: { hits: 1.3, homeRuns: 0.2, rbi: 0.8 }, lastFaceoff: '2024-09-20', advantages: ['T-Mobile Park dimensions'], weaknesses: ['Felix Hernandez history', 'Marine Layer'] }
    ],
    confidenceScores: [
      { prop: 'Total Bases', line: 1.5, confidence: 82, expectedValue: 12.5, recommendation: 'OVER', reasoning: 'Strong recent form vs RHP, favorable ballpark conditions' },
      { prop: 'Hits + Runs + RBI', line: 2.5, confidence: 76, expectedValue: 8.3, recommendation: 'OVER', reasoning: 'Above average performance in last 10 games, good matchup history' },
      { prop: 'Home Runs', line: 0.5, confidence: 68, expectedValue: 4.1, recommendation: 'OVER', reasoning: 'Increased launch angle in recent games, wind favoring right field' }
    ]
  };

  const mockPropOpportunities: PropOpportunity[] = [
    {
      player: 'Mike Trout',
      prop: 'Total Bases',
      line: 1.5,
      odds: -115,
      confidence: 82,
      expectedValue: 12.5,
      edge: 8.2,
      recommendation: 'OVER',
      reasoning: 'Strong recent form vs RHP, favorable ballpark conditions, 15+ game sample shows 68% hit rate',
      sampleSize: 24
    },
    {
      player: 'Shohei Ohtani',
      prop: 'Hits + Runs + RBI',
      line: 2.5,
      odds: -105,
      confidence: 78,
      expectedValue: 9.8,
      edge: 6.1,
      recommendation: 'OVER',
      reasoning: 'Elite form in last 10 games, historically strong vs opponent pitcher',
      sampleSize: 18
    }
  ];

  const handlePlayerSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.length > 2) {
      setIsLoading(true);
      // Simulate API call
      setTimeout(() => {
        setSelectedPlayer(mockPlayerData);
        setPropOpportunities(mockPropOpportunities);
        setIsLoading(false);
      }, 1000);
    }
  };

  const trendRanges = [
    { key: 'L5' as const, label: 'Last 5', color: 'bg-blue-500' },
    { key: 'L10' as const, label: 'Last 10', color: 'bg-green-500' },
    { key: 'L15' as const, label: 'Last 15', color: 'bg-yellow-500' },
    { key: 'L20' as const, label: 'Last 20', color: 'bg-orange-500' },
    { key: 'L25' as const, label: 'Last 25', color: 'bg-red-500' },
    { key: 'season' as const, label: 'Season', color: 'bg-purple-500' }
  ];

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'text-green-400';
    if (confidence >= 65) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getEVColor = (ev: number) => {
    if (ev >= 10) return 'text-green-400';
    if (ev >= 5) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-cyan-300">
      {/* Header */}
      <div className="border-b border-cyan-800/30 bg-black/20 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">
                Enhanced Player Research
              </h1>
              <p className="text-slate-400 mt-1">PropFinder-style analytics with AI insights</p>
            </div>
            <div className="flex items-center space-x-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 px-4 py-2 rounded-lg flex items-center space-x-2 transition-all duration-200"
              >
                <BookOpen className="w-4 h-4" />
                <span>Tutorials</span>
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-green-600 hover:bg-green-500 px-4 py-2 rounded-lg flex items-center space-x-2 transition-all duration-200"
              >
                <Download className="w-4 h-4" />
                <span>Export</span>
              </motion.button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Search Section */}
        <div className="mb-8">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search players (e.g., 'Mike Trout', 'Ohtani')..."
              value={searchQuery}
              onChange={(e) => handlePlayerSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-slate-800/50 border border-cyan-800/30 rounded-lg focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all duration-200 text-cyan-100 placeholder-slate-400"
            />
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full"
            />
            <span className="ml-3 text-slate-400">Analyzing player data...</span>
          </div>
        )}

        {/* Main Content */}
        {selectedPlayer && !isLoading && (
          <div className="space-y-8">
            {/* Player Header */}
            <div className="bg-gradient-to-r from-slate-800/50 to-slate-700/50 rounded-xl p-6 border border-cyan-800/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-xl">
                    {selectedPlayer.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-cyan-100">{selectedPlayer.name}</h2>
                    <p className="text-slate-400">{selectedPlayer.team} • {selectedPlayer.position}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-400">.312</div>
                    <div className="text-sm text-slate-400">Season AVG</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-400">45</div>
                    <div className="text-sm text-slate-400">Home Runs</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-400">104</div>
                    <div className="text-sm text-slate-400">RBI</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex space-x-1 bg-slate-800/30 rounded-lg p-1">
              {[
                { key: 'overview', label: 'Overview', icon: Eye },
                { key: 'trends', label: 'Trends', icon: TrendingUp },
                { key: 'matchups', label: 'Matchups', icon: Target },
                { key: 'props', label: 'Props', icon: Calculator },
                { key: 'tracking', label: 'Bet Tracking', icon: Activity }
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
              {activeTab === 'overview' && (
                <motion.div
                  key="overview"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="grid grid-cols-1 lg:grid-cols-2 gap-6"
                >
                  {/* Season Stats */}
                  <div className="bg-slate-800/50 rounded-xl p-6 border border-cyan-800/30">
                    <h3 className="text-xl font-semibold text-cyan-100 mb-4 flex items-center">
                      <BarChart3 className="w-5 h-5 mr-2" />
                      Season Statistics
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-slate-400">Batting Avg</span>
                          <span className="text-cyan-100 font-medium">.312</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">OBP</span>
                          <span className="text-cyan-100 font-medium">.456</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">SLG</span>
                          <span className="text-cyan-100 font-medium">.629</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">K Rate</span>
                          <span className="text-cyan-100 font-medium">18.2%</span>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-slate-400">Exit Velo</span>
                          <span className="text-cyan-100 font-medium">92.8 mph</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Launch Angle</span>
                          <span className="text-cyan-100 font-medium">13.2°</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Hard Hit %</span>
                          <span className="text-cyan-100 font-medium">52.0%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Barrel Rate</span>
                          <span className="text-cyan-100 font-medium">18.0%</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Advanced Metrics */}
                  <div className="bg-slate-800/50 rounded-xl p-6 border border-cyan-800/30">
                    <h3 className="text-xl font-semibold text-cyan-100 mb-4 flex items-center">
                      <Brain className="w-5 h-5 mr-2" />
                      Advanced Metrics
                    </h3>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">Expected BA</span>
                        <div className="flex items-center space-x-2">
                          <span className="text-cyan-100 font-medium">.287</span>
                          <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded">+25 pts</span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">Expected SLG</span>
                        <div className="flex items-center space-x-2">
                          <span className="text-cyan-100 font-medium">.611</span>
                          <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded">+18 pts</span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">Whiff Rate</span>
                        <span className="text-cyan-100 font-medium">24.0%</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">Chase Rate</span>
                        <span className="text-cyan-100 font-medium">28.0%</span>
                      </div>
                    </div>
                  </div>

                  {/* Recent Games */}
                  <div className="lg:col-span-2 bg-slate-800/50 rounded-xl p-6 border border-cyan-800/30">
                    <h3 className="text-xl font-semibold text-cyan-100 mb-4 flex items-center">
                      <Calendar className="w-5 h-5 mr-2" />
                      Recent Games
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-slate-700">
                            <th className="text-left py-2 text-slate-400">Date</th>
                            <th className="text-left py-2 text-slate-400">Opponent</th>
                            <th className="text-center py-2 text-slate-400">H</th>
                            <th className="text-center py-2 text-slate-400">AB</th>
                            <th className="text-center py-2 text-slate-400">HR</th>
                            <th className="text-center py-2 text-slate-400">RBI</th>
                            <th className="text-center py-2 text-slate-400">Result</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedPlayer.recentGames.map((game, index) => (
                            <tr key={index} className="border-b border-slate-700/50">
                              <td className="py-2 text-cyan-100">{game.date}</td>
                              <td className="py-2 text-cyan-100">{game.opponent}</td>
                              <td className="py-2 text-center text-cyan-100">{game.stats.hits}</td>
                              <td className="py-2 text-center text-cyan-100">{game.stats.atBats}</td>
                              <td className="py-2 text-center text-cyan-100">{game.stats.homeRuns}</td>
                              <td className="py-2 text-center text-cyan-100">{game.stats.rbi}</td>
                              <td className="py-2 text-center">
                                <span className={`px-2 py-1 rounded text-xs ${
                                  game.gameResult === 'W' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                                }`}>
                                  {game.gameResult}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'trends' && (
                <motion.div
                  key="trends"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-6"
                >
                  {/* Trend Range Selector */}
                  <div className="bg-slate-800/50 rounded-xl p-6 border border-cyan-800/30">
                    <h3 className="text-xl font-semibold text-cyan-100 mb-4 flex items-center">
                      <Filter className="w-5 h-5 mr-2" />
                      Select Trend Range
                    </h3>
                    <div className="flex flex-wrap gap-3">
                      {trendRanges.map(({ key, label, color }) => (
                        <button
                          key={key}
                          onClick={() => setSelectedTrendRange(key)}
                          className={`px-4 py-2 rounded-lg transition-all duration-200 ${
                            selectedTrendRange === key
                              ? `${color} text-white shadow-lg`
                              : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Trend Analysis */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {selectedPlayer.trends.map((trend, index) => (
                      <div key={index} className="bg-slate-800/50 rounded-xl p-6 border border-cyan-800/30">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="text-lg font-semibold text-cyan-100">{trend.metric}</h4>
                          <div className={`flex items-center space-x-1 ${
                            trend.trend === 'up' ? 'text-green-400' : 
                            trend.trend === 'down' ? 'text-red-400' : 'text-yellow-400'
                          }`}>
                            <TrendingUp className={`w-4 h-4 ${trend.trend === 'down' ? 'rotate-180' : ''}`} />
                            <span className="text-sm">{trend.trend}</span>
                          </div>
                        </div>
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span className="text-slate-400">Current ({selectedTrendRange})</span>
                            <span className="text-cyan-100 font-bold text-lg">
                              {trend.periods[selectedTrendRange].toFixed(3)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Season Avg</span>
                            <span className="text-slate-400">{trend.periods.season.toFixed(3)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Confidence</span>
                            <span className={`font-semibold ${getConfidenceColor(trend.confidence)}`}>
                              {trend.confidence}%
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {activeTab === 'props' && (
                <motion.div
                  key="props"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-6"
                >
                  {/* Prop Opportunities */}
                  <div className="bg-slate-800/50 rounded-xl p-6 border border-cyan-800/30">
                    <h3 className="text-xl font-semibold text-cyan-100 mb-4 flex items-center">
                      <Target className="w-5 h-5 mr-2" />
                      Top Prop Opportunities
                    </h3>
                    <div className="space-y-4">
                      {propOpportunities.map((opportunity, index) => (
                        <div key={index} className="bg-slate-700/50 rounded-lg p-4 border border-cyan-800/20">
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <h4 className="text-lg font-semibold text-cyan-100">{opportunity.prop}</h4>
                              <p className="text-slate-400">Line: {opportunity.line} | Odds: {opportunity.odds}</p>
                            </div>
                            <div className="text-right">
                              <div className={`text-2xl font-bold ${
                                opportunity.recommendation === 'OVER' ? 'text-green-400' : 
                                opportunity.recommendation === 'UNDER' ? 'text-red-400' : 'text-yellow-400'
                              }`}>
                                {opportunity.recommendation}
                              </div>
                              <div className="text-sm text-slate-400">Sample: {opportunity.sampleSize} games</div>
                            </div>
                          </div>
                          <div className="grid grid-cols-3 gap-4 mb-3">
                            <div className="text-center">
                              <div className={`text-xl font-bold ${getConfidenceColor(opportunity.confidence)}`}>
                                {opportunity.confidence}%
                              </div>
                              <div className="text-xs text-slate-400">Confidence</div>
                            </div>
                            <div className="text-center">
                              <div className={`text-xl font-bold ${getEVColor(opportunity.expectedValue)}`}>
                                +{opportunity.expectedValue.toFixed(1)}%
                              </div>
                              <div className="text-xs text-slate-400">Expected Value</div>
                            </div>
                            <div className="text-center">
                              <div className="text-xl font-bold text-blue-400">
                                {opportunity.edge.toFixed(1)}%
                              </div>
                              <div className="text-xs text-slate-400">Edge</div>
                            </div>
                          </div>
                          <div className="bg-slate-800/50 rounded p-3">
                            <p className="text-sm text-cyan-100">{opportunity.reasoning}</p>
                          </div>
                          <div className="mt-3 flex space-x-2">
                            <button className="bg-green-600 hover:bg-green-500 px-4 py-2 rounded text-sm transition-colors">
                              Track Bet
                            </button>
                            <button className="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded text-sm transition-colors">
                              View Analysis
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Confidence Scores */}
                  <div className="bg-slate-800/50 rounded-xl p-6 border border-cyan-800/30">
                    <h3 className="text-xl font-semibold text-cyan-100 mb-4 flex items-center">
                      <Brain className="w-5 h-5 mr-2" />
                      AI Confidence Analysis
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {selectedPlayer.confidenceScores.map((score, index) => (
                        <div key={index} className="bg-slate-700/50 rounded-lg p-4">
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-semibold text-cyan-100">{score.prop}</h4>
                            <span className={`text-sm font-bold ${
                              score.recommendation === 'OVER' ? 'text-green-400' : 
                              score.recommendation === 'UNDER' ? 'text-red-400' : 'text-yellow-400'
                            }`}>
                              {score.recommendation}
                            </span>
                          </div>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-slate-400">Line</span>
                              <span className="text-cyan-100">{score.line}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-400">Confidence</span>
                              <span className={getConfidenceColor(score.confidence)}>{score.confidence}%</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-400">EV</span>
                              <span className={getEVColor(score.expectedValue)}>+{score.expectedValue}%</span>
                            </div>
                          </div>
                          <div className="mt-3 text-xs text-slate-300 bg-slate-800/50 p-2 rounded">
                            {score.reasoning}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'tracking' && (
                <motion.div
                  key="tracking"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-6"
                >
                  {/* Bet Tracking Feature */}
                  <div className="bg-slate-800/50 rounded-xl p-6 border border-cyan-800/30">
                    <h3 className="text-xl font-semibold text-cyan-100 mb-4 flex items-center">
                      <Activity className="w-5 h-5 mr-2" />
                      Bet Tracking & Performance
                    </h3>
                    <div className="text-center py-12">
                      <Users className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                      <h4 className="text-xl font-semibold text-slate-300 mb-2">Coming Soon</h4>
                      <p className="text-slate-400 mb-6">
                        Track your bets, analyze performance, and build your betting portfolio with comprehensive analytics.
                      </p>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 px-6 py-3 rounded-lg transition-all duration-200"
                      >
                        Get Notified When Available
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Empty State */}
        {!selectedPlayer && !isLoading && (
          <div className="text-center py-12">
            <Search className="w-16 h-16 text-slate-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-300 mb-2">Start Your Research</h3>
            <p className="text-slate-400 mb-6">
              Search for any player to access PropFinder-style analytics with advanced metrics, 
              customizable trends, and AI-powered insights.
            </p>
            <div className="flex flex-wrap justify-center gap-2 text-sm">
              <span className="bg-slate-800 px-3 py-1 rounded text-slate-300">Try: "Mike Trout"</span>
              <span className="bg-slate-800 px-3 py-1 rounded text-slate-300">Try: "Shohei Ohtani"</span>
              <span className="bg-slate-800 px-3 py-1 rounded text-slate-300">Try: "Aaron Judge"</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EnhancedPlayerDashboard;
