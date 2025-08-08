import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  TrendingUp,
  TrendingDown,
  Target,
  Clock,
  DollarSign,
  BarChart3,
  Activity,
  Star,
  ChevronDown,
  ChevronUp,
  Settings,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Filter,
  Calendar,
  User,
  Trophy,
  Shield,
  Zap,
  Brain,
  Eye,
  Plus,
  Minus,
  ArrowRight,
  Flame,
  Info,
} from 'lucide-react';

interface PlayerData {
  id: string;
  name: string;
  team: string;
  position: string;
  image?: string;
  stats: PlayerStats;
  recentForm: number[];
  trends: TrendAnalysis;
  matchupHistory: MatchupData[];
  injuries: InjuryReport[];
  confidence: number;
  evCalculation: EVData;
}

interface PlayerStats {
  season: Record<string, number>;
  l5: Record<string, number>;
  l10: Record<string, number>;
  l15: Record<string, number>;
  l20: Record<string, number>;
  l25: Record<string, number>;
  custom?: Record<string, number>;
}

interface TrendAnalysis {
  direction: 'up' | 'down' | 'stable';
  strength: number;
  consistency: number;
  momentum: number;
  ceiling: number;
  floor: number;
}

interface MatchupData {
  opponent: string;
  date: string;
  performance: Record<string, number>;
  outcome: 'win' | 'loss';
  venue: 'home' | 'away';
}

interface InjuryReport {
  type: string;
  severity: 'minor' | 'moderate' | 'major';
  status: 'active' | 'probable' | 'questionable' | 'doubtful' | 'out';
  impact: number;
}

interface EVData {
  expectedValue: number;
  impliedProbability: number;
  trueProbability: number;
  edge: number;
  confidence: number;
  reasoning: string[];
}

interface TrendRange {
  id: string;
  label: string;
  games: number;
  active: boolean;
  custom?: boolean;
}

const AdvancedPlayerDashboard: React.FC = () => {
  const [selectedPlayer, setSelectedPlayer] = useState<PlayerData | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStat, setSelectedStat] = useState('points');
  const [trendRanges, setTrendRanges] = useState<TrendRange[]>([
    { id: 'l5', label: 'L5', games: 5, active: true },
    { id: 'l10', label: 'L10', games: 10, active: true },
    { id: 'l15', label: 'L15', games: 15, active: false },
    { id: 'l20', label: 'L20', games: 20, active: false },
    { id: 'l25', label: 'L25', games: 25, active: false },
  ]);
  const [customRange, setCustomRange] = useState({ games: 7, label: 'L7' });
  const [showCustomRange, setShowCustomRange] = useState(false);

  // Mock data based on roadmap requirements
  const mockPlayerData: PlayerData = {
    id: '1',
    name: 'Jayson Tatum',
    team: 'Boston Celtics',
    position: 'SF/PF',
    image: '🏀',
    stats: {
      season: { points: 27.8, rebounds: 8.4, assists: 4.9, threes: 3.1, blocks: 0.6 },
      l5: { points: 31.2, rebounds: 9.1, assists: 5.4, threes: 3.8, blocks: 0.8 },
      l10: { points: 29.5, rebounds: 8.7, assists: 5.1, threes: 3.5, blocks: 0.7 },
      l15: { points: 28.9, rebounds: 8.5, assists: 4.8, threes: 3.3, blocks: 0.6 },
      l20: { points: 28.1, rebounds: 8.3, assists: 4.7, threes: 3.2, blocks: 0.6 },
      l25: { points: 27.9, rebounds: 8.2, assists: 4.8, threes: 3.1, blocks: 0.6 },
    },
    recentForm: [28, 34, 31, 25, 37, 29, 32, 26, 35, 30],
    trends: {
      direction: 'up',
      strength: 0.75,
      consistency: 0.82,
      momentum: 0.68,
      ceiling: 42,
      floor: 18,
    },
    matchupHistory: [
      { opponent: 'Miami Heat', date: '2024-01-15', performance: { points: 34, rebounds: 9, assists: 6 }, outcome: 'win', venue: 'home' },
      { opponent: 'Philadelphia 76ers', date: '2024-01-12', performance: { points: 28, rebounds: 7, assists: 5 }, outcome: 'loss', venue: 'away' },
    ],
    injuries: [],
    confidence: 87.4,
    evCalculation: {
      expectedValue: 1.15,
      impliedProbability: 0.52,
      trueProbability: 0.64,
      edge: 12.3,
      confidence: 87.4,
      reasoning: [
        'Strong recent form with 31.2 PPG over L5',
        'Favorable matchup against weak perimeter defense',
        'Playing at home with 89% historical cover rate',
        'No injury concerns or rest risk',
      ],
    },
  };

  const statCategories = [
    { id: 'points', label: 'Points', icon: Target, color: 'text-orange-400' },
    { id: 'rebounds', label: 'Rebounds', icon: BarChart3, color: 'text-blue-400' },
    { id: 'assists', label: 'Assists', icon: Activity, color: 'text-green-400' },
    { id: 'threes', label: '3-Pointers', icon: Zap, color: 'text-purple-400' },
    { id: 'blocks', label: 'Blocks', icon: Shield, color: 'text-red-400' },
  ];

  const activeTrendRanges = trendRanges.filter(range => range.active);

  const getTrendDirection = (current: number, previous: number) => {
    if (current > previous * 1.05) return 'up';
    if (current < previous * 0.95) return 'down';
    return 'stable';
  };

  const getTrendIcon = (direction: string) => {
    switch (direction) {
      case 'up': return <TrendingUp className="w-4 h-4 text-green-400" />;
      case 'down': return <TrendingDown className="w-4 h-4 text-red-400" />;
      default: return <Activity className="w-4 h-4 text-gray-400" />;
    }
  };

  const addCustomRange = () => {
    if (customRange.games > 0 && customRange.games <= 82) {
      const newRange: TrendRange = {
        id: `custom-${customRange.games}`,
        label: customRange.label || `L${customRange.games}`,
        games: customRange.games,
        active: true,
        custom: true,
      };
      setTrendRanges(prev => [...prev, newRange]);
      setShowCustomRange(false);
      setCustomRange({ games: 7, label: 'L7' });
    }
  };

  const toggleTrendRange = (id: string) => {
    setTrendRanges(prev => 
      prev.map(range => 
        range.id === id ? { ...range, active: !range.active } : range
      )
    );
  };

  const removeCustomRange = (id: string) => {
    setTrendRanges(prev => prev.filter(range => range.id !== id));
  };

  useEffect(() => {
    // Mock player selection for demo
    setSelectedPlayer(mockPlayerData);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                Advanced Player Dashboard
              </h1>
              <p className="text-gray-400 mt-1">PropFinder-style analytics with enhanced AI predictions</p>
            </div>
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2 bg-green-500/20 px-3 py-1 rounded-full">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-xs text-green-400 font-medium">LIVE DATA</span>
              </div>
              <button className="p-2 bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors">
                <RefreshCw className="w-5 h-5 text-gray-400" />
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search players..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-gray-400 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all"
            />
          </div>
        </div>

        {selectedPlayer && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Player Info & Controls */}
            <div className="lg:col-span-1 space-y-6">
              {/* Player Card */}
              <div className="bg-slate-800/50 backdrop-blur-lg rounded-xl border border-slate-700/50 p-6">
                <div className="flex items-center space-x-4 mb-4">
                  <div className="text-4xl">{selectedPlayer.image}</div>
                  <div>
                    <h2 className="text-xl font-bold text-white">{selectedPlayer.name}</h2>
                    <p className="text-gray-400">{selectedPlayer.team} • {selectedPlayer.position}</p>
                  </div>
                </div>

                {/* EV Calculation */}
                <div className="bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border border-cyan-500/20 rounded-lg p-4 mb-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <Brain className="w-5 h-5 text-cyan-400" />
                      <span className="font-bold text-white">AI Analysis</span>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-cyan-400">+{selectedPlayer.evCalculation.edge}%</div>
                      <div className="text-xs text-gray-400">Expected Edge</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mb-3">
                    <div>
                      <div className="text-sm text-gray-400">True Prob</div>
                      <div className="font-bold text-white">{(selectedPlayer.evCalculation.trueProbability * 100).toFixed(1)}%</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-400">Implied Prob</div>
                      <div className="font-bold text-white">{(selectedPlayer.evCalculation.impliedProbability * 100).toFixed(1)}%</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="flex-1 bg-slate-700 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-cyan-400 to-purple-400 h-2 rounded-full"
                        style={{ width: `${selectedPlayer.confidence}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium text-white">{selectedPlayer.confidence}%</span>
                  </div>
                </div>

                {/* AI Reasoning */}
                <div className="space-y-2">
                  <h4 className="font-bold text-white mb-2">AI Reasoning</h4>
                  {selectedPlayer.evCalculation.reasoning.map((reason, index) => (
                    <div key={index} className="flex items-start space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-400 mt-0.5" />
                      <span className="text-sm text-gray-300">{reason}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Trend Range Controls */}
              <div className="bg-slate-800/50 backdrop-blur-lg rounded-xl border border-slate-700/50 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-white">Trend Ranges</h3>
                  <button
                    onClick={() => setShowCustomRange(!showCustomRange)}
                    className="p-2 bg-slate-700 rounded-lg hover:bg-slate-600 transition-colors"
                  >
                    <Plus className="w-4 h-4 text-gray-400" />
                  </button>
                </div>

                {/* Custom Range Input */}
                <AnimatePresence>
                  {showCustomRange && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="mb-4 p-3 bg-slate-700/50 rounded-lg"
                    >
                      <div className="flex items-center space-x-2 mb-2">
                        <input
                          type="number"
                          min="1"
                          max="82"
                          value={customRange.games}
                          onChange={(e) => setCustomRange(prev => ({ ...prev, games: parseInt(e.target.value) || 0 }))}
                          className="w-20 px-2 py-1 bg-slate-800 border border-slate-600 rounded text-white text-sm"
                        />
                        <input
                          type="text"
                          value={customRange.label}
                          onChange={(e) => setCustomRange(prev => ({ ...prev, label: e.target.value }))}
                          className="flex-1 px-2 py-1 bg-slate-800 border border-slate-600 rounded text-white text-sm"
                          placeholder="Label (e.g., L7)"
                        />
                        <button
                          onClick={addCustomRange}
                          className="px-3 py-1 bg-cyan-500 text-white rounded text-sm hover:bg-cyan-600 transition-colors"
                        >
                          Add
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Range Toggles */}
                <div className="space-y-2">
                  {trendRanges.map((range) => (
                    <div key={range.id} className="flex items-center justify-between p-2 bg-slate-700/30 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={range.active}
                          onChange={() => toggleTrendRange(range.id)}
                          className="rounded text-cyan-400 focus:ring-cyan-400"
                        />
                        <span className="text-white font-medium">{range.label}</span>
                        <span className="text-gray-400 text-sm">({range.games} games)</span>
                      </div>
                      {range.custom && (
                        <button
                          onClick={() => removeCustomRange(range.id)}
                          className="p-1 text-red-400 hover:bg-red-400/20 rounded"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Statistics & Analysis */}
            <div className="lg:col-span-2 space-y-6">
              {/* Stat Category Selector */}
              <div className="bg-slate-800/50 backdrop-blur-lg rounded-xl border border-slate-700/50 p-6">
                <div className="flex items-center space-x-4 mb-6">
                  {statCategories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => setSelectedStat(category.id)}
                      className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all ${
                        selectedStat === category.id
                          ? 'bg-cyan-500 text-white'
                          : 'text-gray-400 hover:text-white hover:bg-slate-700'
                      }`}
                    >
                      <category.icon className="w-4 h-4" />
                      <span>{category.label}</span>
                    </button>
                  ))}
                </div>

                {/* Trend Analysis Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
                  <div className="bg-slate-700/30 rounded-lg p-4">
                    <div className="text-sm text-gray-400 mb-1">Season Avg</div>
                    <div className="text-2xl font-bold text-white">
                      {selectedPlayer.stats.season[selectedStat]?.toFixed(1)}
                    </div>
                  </div>

                  {activeTrendRanges.map((range) => {
                    const currentValue = selectedPlayer.stats[range.id as keyof PlayerStats]?.[selectedStat] || 0;
                    const seasonValue = selectedPlayer.stats.season[selectedStat] || 0;
                    const direction = getTrendDirection(currentValue, seasonValue);

                    return (
                      <div key={range.id} className="bg-slate-700/30 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-1">
                          <div className="text-sm text-gray-400">{range.label}</div>
                          {getTrendIcon(direction)}
                        </div>
                        <div className="text-2xl font-bold text-white">
                          {currentValue.toFixed(1)}
                        </div>
                        <div className={`text-xs ${
                          direction === 'up' ? 'text-green-400' : 
                          direction === 'down' ? 'text-red-400' : 'text-gray-400'
                        }`}>
                          {direction === 'up' ? '+' : direction === 'down' ? '' : '±'}
                          {((currentValue - seasonValue) / seasonValue * 100).toFixed(1)}%
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Trend Visualization */}
                <div className="bg-slate-700/30 rounded-lg p-4">
                  <h4 className="font-bold text-white mb-4">Recent Form Trend</h4>
                  <div className="flex items-end space-x-2 h-24">
                    {selectedPlayer.recentForm.map((value, index) => (
                      <div
                        key={index}
                        className="flex-1 bg-gradient-to-t from-cyan-500 to-purple-500 rounded-t-sm opacity-70 hover:opacity-100 transition-opacity"
                        style={{ 
                          height: `${(value / Math.max(...selectedPlayer.recentForm)) * 100}%`,
                          minHeight: '10%'
                        }}
                        title={`Game ${index + 1}: ${value} ${selectedStat}`}
                      />
                    ))}
                  </div>
                  <div className="flex justify-between mt-2 text-xs text-gray-400">
                    <span>Oldest</span>
                    <span>Most Recent</span>
                  </div>
                </div>
              </div>

              {/* Advanced Metrics */}
              <div className="bg-slate-800/50 backdrop-blur-lg rounded-xl border border-slate-700/50 p-6">
                <h3 className="font-bold text-white mb-4">Advanced Trend Metrics</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-cyan-400">{(selectedPlayer.trends.strength * 100).toFixed(0)}%</div>
                    <div className="text-sm text-gray-400">Trend Strength</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-400">{(selectedPlayer.trends.consistency * 100).toFixed(0)}%</div>
                    <div className="text-sm text-gray-400">Consistency</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-400">{(selectedPlayer.trends.momentum * 100).toFixed(0)}%</div>
                    <div className="text-sm text-gray-400">Momentum</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-400">{selectedPlayer.trends.ceiling}-{selectedPlayer.trends.floor}</div>
                    <div className="text-sm text-gray-400">Range</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdvancedPlayerDashboard;
