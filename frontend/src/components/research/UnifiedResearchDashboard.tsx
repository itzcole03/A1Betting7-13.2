import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Target,
  TrendingUp,
  BarChart3,
  Activity,
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
  Users,
  Shield,
  Clock,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  ChevronRight,
  ChevronDown,
  Flame,
  MapPin,
  Calendar,
  Info,
  User,
  Heart,
  SortAsc,
  SortDesc,
  X,
  Plus,
  Loader,
} from 'lucide-react';
import { GamePerformance, UpcomingGameInfo, InjuryStatus, TrendData, AdvancedMetrics } from './types';

// Types for Research Dashboard
interface Player {
  id: string;
  name: string;
  team: string;
  position: string;
  number: number;
  image?: string;
  stats: PlayerStats;
  recentForm: GamePerformance[];
  upcomingGame: UpcomingGameInfo;
  injuryStatus: InjuryStatus;
  props: PropOpportunity[];
  marketValue: number;
  hotness: number;
}

interface PlayerStats {
  season: Record<string, number>;
  last5: Record<string, number>;
  trends: TrendData[];
  advanced: AdvancedMetrics;
}

interface PropOpportunity {
  id: string;
  type: string;
  market: string;
  line: number;
  odds: number;
  confidence: number;
  value: number;
  sportsbook: string;
  lastUpdate: Date;
  trend: 'up' | 'down' | 'stable';
}

interface InjuryReport {
  playerId: string;
  playerName: string;
  team: string;
  injury: string;
  severity: 'minor' | 'moderate' | 'major' | 'questionable';
  status: 'active' | 'day-to-day' | 'out' | 'ir';
  lastUpdate: Date;
  expectedReturn?: Date;
  impact: number; // 1-10 scale
}

interface MatchupAnalysis {
  id: string;
  playerA: string;
  playerB: string;
  advantage: 'playerA' | 'playerB' | 'even';
  confidence: number;
  factors: string[];
  recommendation: string;
  projectedStats: Record<string, number>;
}

// Mock data
const mockPlayers: Player[] = [
  {
    id: '1',
    name: 'Mike Trout',
    team: 'LAA',
    position: 'OF',
    number: 27,
    stats: {
      season: { avg: 0.283, hr: 15, rbi: 44, ops: 0.875 },
      last5: { avg: 0.350, hr: 3, rbi: 8, ops: 1.100 },
      trends: [],
      advanced: {}
    },
    recentForm: [],
    upcomingGame: { opponent: 'HOU', time: '7:05 PM', venue: 'home' },
    injuryStatus: { status: 'healthy', lastUpdate: new Date() },
    props: [
      { id: '1', type: 'hits', market: 'Over 1.5', line: 1.5, odds: -110, confidence: 78, value: 12, sportsbook: 'DraftKings', lastUpdate: new Date(), trend: 'up' },
      { id: '2', type: 'rbis', market: 'Over 0.5', line: 0.5, odds: +125, confidence: 65, value: 8, sportsbook: 'FanDuel', lastUpdate: new Date(), trend: 'stable' }
    ],
    marketValue: 95,
    hotness: 8.7
  },
  {
    id: '2',
    name: 'Mookie Betts',
    team: 'LAD',
    position: 'OF',
    number: 50,
    stats: {
      season: { avg: 0.292, hr: 18, rbi: 52, ops: 0.912 },
      last5: { avg: 0.278, hr: 1, rbi: 3, ops: 0.820 },
      trends: [],
      advanced: {}
    },
    recentForm: [],
    upcomingGame: { opponent: 'SD', time: '10:10 PM', venue: 'away' },
    injuryStatus: { status: 'healthy', lastUpdate: new Date() },
    props: [
      { id: '3', type: 'hits', market: 'Over 1.5', line: 1.5, odds: -115, confidence: 82, value: 15, sportsbook: 'BetMGM', lastUpdate: new Date(), trend: 'up' },
      { id: '4', type: 'runs', market: 'Over 0.5', line: 0.5, odds: -105, confidence: 71, value: 10, sportsbook: 'Caesars', lastUpdate: new Date(), trend: 'down' }
    ],
    marketValue: 92,
    hotness: 7.9
  }
];

const mockInjuries: InjuryReport[] = [
  {
    playerId: '3',
    playerName: 'Fernando Tatis Jr.',
    team: 'SD',
    injury: 'Shoulder Inflammation',
    severity: 'questionable',
    status: 'day-to-day',
    lastUpdate: new Date(),
    expectedReturn: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
    impact: 6
  },
  {
    playerId: '4',
    playerName: 'Jacob deGrom',
    team: 'TEX',
    injury: 'Elbow Soreness',
    severity: 'moderate',
    status: 'out',
    lastUpdate: new Date(),
    expectedReturn: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    impact: 8
  }
];

const UnifiedResearchDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'player' | 'props' | 'matchups' | 'injuries' | 'lookup'>('player');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [selectedSport, setSelectedSport] = useState('MLB');
  const [filters, setFilters] = useState({
    position: 'all',
    team: 'all',
    confidence: 0,
    value: 0
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Filtered data
  const filteredPlayers = useMemo(() => {
    return mockPlayers.filter(player => 
      player.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      player.team.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  const tabs = [
    { id: 'player', name: 'Player Research', icon: User, description: 'Deep player analytics' },
    { id: 'props', name: 'Prop Scanner', icon: Eye, description: 'Real-time opportunities', badge: 'BETA' },
    { id: 'matchups', name: 'Matchup Analyzer', icon: Target, description: 'Advanced breakdowns' },
    { id: 'injuries', name: 'Injury Tracker', icon: Shield, description: 'Live injury reports', badge: '2' },
    { id: 'lookup', name: 'Player Lookup', icon: Search, description: 'Sub-second search', badge: 'NEW' }
  ];

  const renderPlayerResearch = () => (
    <div className="space-y-6">
      {/* Player Search and Filters */}
      <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between mb-6">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-white mb-2">Player Research</h3>
            <p className="text-slate-400 text-sm">Deep analytics and projections for all players</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-white transition-colors"
            >
              <Filter className="w-4 h-4" />
              Filters
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-cyan-500 hover:bg-cyan-600 rounded-lg text-white transition-colors">
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
        </div>

        {/* Enhanced Filters Panel */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden mb-6"
            >
              <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-600">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Position</label>
                    <select
                      value={filters.position}
                      onChange={(e) => setFilters(prev => ({ ...prev, position: e.target.value }))}
                      className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white"
                    >
                      <option value="all">All Positions</option>
                      <option value="OF">Outfield</option>
                      <option value="IF">Infield</option>
                      <option value="P">Pitcher</option>
                      <option value="C">Catcher</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Team</label>
                    <select
                      value={filters.team}
                      onChange={(e) => setFilters(prev => ({ ...prev, team: e.target.value }))}
                      className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white"
                    >
                      <option value="all">All Teams</option>
                      <option value="LAA">Los Angeles Angels</option>
                      <option value="LAD">Los Angeles Dodgers</option>
                      <option value="SD">San Diego Padres</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Min Confidence</label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={filters.confidence}
                      onChange={(e) => setFilters(prev => ({ ...prev, confidence: parseInt(e.target.value) }))}
                      className="w-full"
                    />
                    <div className="text-xs text-slate-400 mt-1">{filters.confidence}%</div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Min Value</label>
                    <input
                      type="range"
                      min="0"
                      max="20"
                      value={filters.value}
                      onChange={(e) => setFilters(prev => ({ ...prev, value: parseInt(e.target.value) }))}
                      className="w-full"
                    />
                    <div className="text-xs text-slate-400 mt-1">{filters.value}%</div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search players, teams, or positions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 transition-all"
          />
        </div>
      </div>

      {/* Player Results Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredPlayers.map((player) => (
          <motion.div
            key={player.id}
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-slate-800/50 rounded-xl p-6 border border-slate-700 hover:border-cyan-400/50 transition-all cursor-pointer"
            onClick={() => setSelectedPlayer(player)}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                  {player.number}
                </div>
                <div>
                  <h3 className="font-semibold text-white">{player.name}</h3>
                  <p className="text-sm text-slate-400">{player.team} • {player.position}</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Flame className={`w-4 h-4 ${player.hotness > 8 ? 'text-red-500' : player.hotness > 6 ? 'text-orange-500' : 'text-slate-500'}`} />
                <span className="text-xs font-medium text-slate-300">{player.hotness}</span>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-slate-900/50 rounded-lg p-3">
                <div className="text-xs text-slate-400 mb-1">Season AVG</div>
                <div className="text-lg font-semibold text-white">{player.stats.season.avg}</div>
              </div>
              <div className="bg-slate-900/50 rounded-lg p-3">
                <div className="text-xs text-slate-400 mb-1">Last 5 AVG</div>
                <div className="text-lg font-semibold text-white">{player.stats.last5.avg}</div>
              </div>
            </div>

            {/* Top Props */}
            <div className="space-y-2 mb-4">
              <h4 className="text-sm font-medium text-slate-300">Top Props</h4>
              {player.props.slice(0, 2).map((prop) => (
                <div key={prop.id} className="flex items-center justify-between bg-slate-900/30 rounded-lg p-2">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${prop.trend === 'up' ? 'bg-green-500' : prop.trend === 'down' ? 'bg-red-500' : 'bg-yellow-500'}`} />
                    <span className="text-sm text-slate-300">{prop.market}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400">{prop.confidence}%</span>
                    <span className="text-xs font-medium text-cyan-400">+{prop.value}%</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Upcoming Game */}
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 text-slate-400">
                <Calendar className="w-4 h-4" />
                <span>vs {player.upcomingGame.opponent}</span>
              </div>
              <div className="text-slate-300">{player.upcomingGame.time}</div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );

  const renderPropScanner = () => (
    <div className="space-y-6">
      <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-white mb-2">Live Prop Scanner</h3>
            <p className="text-slate-400 text-sm">Real-time prop opportunities across all sportsbooks</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 text-green-400">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span className="text-xs font-medium">Live</span>
            </div>
            <button
              onClick={() => setIsLoading(true)}
              className="flex items-center gap-2 px-4 py-2 bg-cyan-500 hover:bg-cyan-600 rounded-lg text-white transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Scanner Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <select className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white">
            <option>All Sports</option>
            <option>MLB</option>
            <option>NBA</option>
            <option>NFL</option>
          </select>
          <select className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white">
            <option>All Markets</option>
            <option>Player Props</option>
            <option>Game Props</option>
            <option>Team Props</option>
          </select>
          <select className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white">
            <option>Min 70% Confidence</option>
            <option>Min 60% Confidence</option>
            <option>Min 80% Confidence</option>
          </select>
          <select className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white">
            <option>All Sportsbooks</option>
            <option>DraftKings</option>
            <option>FanDuel</option>
            <option>BetMGM</option>
          </select>
        </div>

        {/* Live Props */}
        <div className="space-y-3">
          {mockPlayers.flatMap(player => player.props).map((prop, index) => (
            <motion.div
              key={prop.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-slate-900/50 rounded-lg p-4 border border-slate-700 hover:border-cyan-400/50 transition-all"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-3 h-3 rounded-full ${prop.trend === 'up' ? 'bg-green-500 animate-pulse' : prop.trend === 'down' ? 'bg-red-500' : 'bg-yellow-500'}`} />
                  <div>
                    <div className="font-medium text-white">{prop.market}</div>
                    <div className="text-sm text-slate-400">{prop.type} • {prop.sportsbook}</div>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <div className="text-sm text-slate-400">Confidence</div>
                    <div className={`font-semibold ${prop.confidence > 80 ? 'text-green-400' : prop.confidence > 70 ? 'text-yellow-400' : 'text-red-400'}`}>
                      {prop.confidence}%
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm text-slate-400">Value</div>
                    <div className="font-semibold text-cyan-400">+{prop.value}%</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm text-slate-400">Odds</div>
                    <div className="font-semibold text-white">{prop.odds > 0 ? '+' : ''}{prop.odds}</div>
                  </div>
                  <button className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-white transition-colors">
                    <Plus className="w-4 h-4" />
                    Add
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderInjuryTracker = () => (
    <div className="space-y-6">
      <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-white mb-2">Injury Tracker</h3>
            <p className="text-slate-400 text-sm">Live injury reports and impact analysis</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-1">
              <span className="text-red-400 text-sm font-medium">{mockInjuries.length} Active</span>
            </div>
          </div>
        </div>

        {/* Injury Severity Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Questionable', count: 3, color: 'yellow' },
            { label: 'Day-to-Day', count: 5, color: 'orange' },
            { label: 'Out', count: 2, color: 'red' },
            { label: 'IR', count: 1, color: 'purple' }
          ].map((status) => (
            <div key={status.label} className="bg-slate-900/50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-slate-300">{status.label}</span>
                <div className={`w-2 h-2 rounded-full bg-${status.color}-500`} />
              </div>
              <div className="text-2xl font-bold text-white">{status.count}</div>
            </div>
          ))}
        </div>

        {/* Injury Reports */}
        <div className="space-y-3">
          {mockInjuries.map((injury) => (
            <div key={injury.playerId} className="bg-slate-900/50 rounded-lg p-4 border border-slate-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-3 h-3 rounded-full ${
                    injury.severity === 'minor' ? 'bg-green-500' :
                    injury.severity === 'moderate' ? 'bg-yellow-500' :
                    injury.severity === 'major' ? 'bg-red-500' : 'bg-orange-500'
                  }`} />
                  <div>
                    <div className="font-medium text-white">{injury.playerName}</div>
                    <div className="text-sm text-slate-400">{injury.team} • {injury.injury}</div>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <div className="text-sm text-slate-400">Status</div>
                    <div className={`font-semibold capitalize ${
                      injury.status === 'active' ? 'text-green-400' :
                      injury.status === 'day-to-day' ? 'text-yellow-400' :
                      injury.status === 'out' ? 'text-red-400' : 'text-purple-400'
                    }`}>
                      {injury.status.replace('-', ' ')}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm text-slate-400">Impact</div>
                    <div className="font-semibold text-white">{injury.impact}/10</div>
                  </div>
                  {injury.expectedReturn && (
                    <div className="text-center">
                      <div className="text-sm text-slate-400">Return</div>
                      <div className="font-semibold text-cyan-400">
                        {Math.ceil((injury.expectedReturn.getTime() - Date.now()) / (1000 * 60 * 60 * 24))}d
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderMatchupAnalyzer = () => (
    <div className="space-y-6">
      <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
        <h3 className="text-lg font-semibold text-white mb-4">Matchup Analyzer</h3>
        <p className="text-slate-400 text-sm mb-6">Advanced head-to-head player and team comparisons</p>
        
        {/* Coming Soon Message */}
        <div className="text-center py-12">
          <Target className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <h4 className="text-xl font-semibold text-white mb-2">Advanced Matchup Analysis</h4>
          <p className="text-slate-400 mb-6">Deep statistical comparisons and predictive modeling coming soon</p>
          <div className="flex justify-center gap-4">
            <div className="bg-slate-900/50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-cyan-400">15+</div>
              <div className="text-sm text-slate-400">Comparison Metrics</div>
            </div>
            <div className="bg-slate-900/50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-green-400">90%</div>
              <div className="text-sm text-slate-400">Prediction Accuracy</div>
            </div>
            <div className="bg-slate-900/50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-purple-400">Real-time</div>
              <div className="text-sm text-slate-400">Data Updates</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderPlayerLookup = () => (
    <div className="space-y-6">
      <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
        <h3 className="text-lg font-semibold text-white mb-4">Player Lookup</h3>
        <p className="text-slate-400 text-sm mb-6">Sub-second player search with comprehensive data</p>
        
        {/* Enhanced Search */}
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search any player across all sports..."
            className="w-full pl-12 pr-4 py-4 bg-slate-700 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 transition-all text-lg"
          />
          <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
            <kbd className="px-2 py-1 bg-slate-600 rounded text-xs text-slate-300">⌘K</kbd>
          </div>
        </div>

        {/* Quick Access */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {['Top Performers', 'Hot Players', 'Value Plays', 'Trending Up'].map((category) => (
            <button
              key={category}
              className="bg-slate-900/50 hover:bg-slate-700 rounded-lg p-4 text-left transition-colors border border-slate-700 hover:border-cyan-400/50"
            >
              <div className="font-medium text-white text-sm">{category}</div>
              <div className="text-xs text-slate-400 mt-1">Quick access</div>
            </button>
          ))}
        </div>

        {/* Recent Searches */}
        <div>
          <h4 className="text-sm font-medium text-slate-300 mb-3">Recent Searches</h4>
          <div className="flex flex-wrap gap-2">
            {['Mike Trout', 'Mookie Betts', 'Aaron Judge', 'Shohei Ohtani'].map((player) => (
              <button
                key={player}
                className="flex items-center gap-2 px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-white transition-colors"
              >
                <Clock className="w-3 h-3" />
                <span className="text-sm">{player}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-xl flex items-center justify-center">
              <Search className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Research Dashboard</h1>
              <p className="text-slate-400">Comprehensive player analytics and opportunity discovery</p>
            </div>
          </div>

          {/* Sport Selector */}
          <div className="flex items-center gap-4">
            <select
              value={selectedSport}
              onChange={(e) => setSelectedSport(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white"
            >
              <option value="MLB">⚾ MLB</option>
              <option value="NBA">🏀 NBA</option>
              <option value="NFL">🏈 NFL</option>
              <option value="NHL">🏒 NHL</option>
            </select>
            <div className="flex items-center gap-2 text-green-400">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span className="text-sm font-medium">Live Data</span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-3 px-6 py-3 rounded-xl font-medium transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-cyan-500 to-purple-500 text-white shadow-lg'
                      : 'bg-slate-800/50 text-slate-300 hover:text-white hover:bg-slate-700'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{tab.name}</span>
                  {tab.badge && (
                    <span className={`px-2 py-1 text-xs font-bold rounded-full ${
                      isActive ? 'bg-white/20 text-white' : 'bg-cyan-500 text-white'
                    }`}>
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {activeTab === 'player' && renderPlayerResearch()}
            {activeTab === 'props' && renderPropScanner()}
            {activeTab === 'matchups' && renderMatchupAnalyzer()}
            {activeTab === 'injuries' && renderInjuryTracker()}
            {activeTab === 'lookup' && renderPlayerLookup()}
          </motion.div>
        </AnimatePresence>

        {/* Selected Player Modal */}
        <AnimatePresence>
          {selectedPlayer && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => setSelectedPlayer(null)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-slate-800 rounded-2xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto border border-slate-700"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-xl flex items-center justify-center text-white font-bold text-xl">
                      {selectedPlayer.number}
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-white">{selectedPlayer.name}</h2>
                      <p className="text-slate-400">{selectedPlayer.team} • {selectedPlayer.position}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedPlayer(null)}
                    className="p-2 text-slate-400 hover:text-white transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                {/* Detailed player info would go here */}
                <div className="text-center py-8">
                  <p className="text-slate-400">Detailed player analytics coming soon...</p>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default UnifiedResearchDashboard;
