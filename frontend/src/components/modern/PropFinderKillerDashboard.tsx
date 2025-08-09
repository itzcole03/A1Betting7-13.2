import React, { useState, useEffect, useMemo, useTransition, useDeferredValue, startTransition } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Filter,
  TrendingUp,
  TrendingDown,
  Zap,
  Brain,
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
  PlayCircle,
  PauseCircle,
  Maximize2,
  Eye,
  EyeOff,
  Plus,
  Minus,
  Info,
  Bookmark,
  Share2,
  Download,
  Trophy,
  Flame,
  Shield,
  Calculator,
} from 'lucide-react';
import CommunityEngagement from '../community/CommunityEngagement';

// Enhanced interfaces based on competitor analysis
interface PropOpportunity {
  id: string;
  player: string;
  playerImage?: string;
  team: string;
  teamLogo?: string;
  opponent: string;
  opponentLogo?: string;
  sport: 'NBA' | 'NFL' | 'MLB' | 'NHL';
  market: string;
  line: number;
  pick: 'over' | 'under';
  odds: number;
  impliedProbability: number;
  aiProbability: number;
  edge: number;
  confidence: number;
  projectedValue: number;
  volume: number;
  trend: 'up' | 'down' | 'stable';
  trendStrength: number;
  timeToGame: string;
  venue: 'home' | 'away';
  weather?: string;
  injuries: string[];
  recentForm: number[];
  matchupHistory: {
    games: number;
    average: number;
    hitRate: number;
  };
  lineMovement: {
    open: number;
    current: number;
    direction: 'up' | 'down' | 'stable';
  };
  bookmakers: Array<{
    name: string;
    odds: number;
    line: number;
  }>;
  isBookmarked: boolean;
  tags: string[];
  socialSentiment: number;
  sharpMoney: 'heavy' | 'moderate' | 'light' | 'public';
}

interface FilterState {
  sport: string[];
  confidence: [number, number];
  edge: [number, number];
  timeToGame: string;
  market: string[];
  venue: string[];
  sharpMoney: string[];
  showBookmarked: boolean;
  sortBy: 'confidence' | 'edge' | 'time' | 'volume' | 'trend';
  sortOrder: 'asc' | 'desc';
}

const PropFinderKillerDashboard: React.FC = () => {
  const [opportunities, setOpportunities] = useState<PropOpportunity[]>([]);
  const [filteredOpportunities, setFilteredOpportunities] = useState<PropOpportunity[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOpp, setSelectedOpp] = useState<PropOpportunity | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'compact'>('grid');
  const [showOnlyPremium, setShowOnlyPremium] = useState(false);

  // React 19 concurrent features for better performance
  const [isPending, startTransitionLocal] = useTransition();
  const deferredSearchQuery = useDeferredValue(searchQuery);
  
  const [filters, setFilters] = useState<FilterState>({
    sport: [],
    confidence: [80, 100],
    edge: [0, 50],
    timeToGame: 'all',
    market: [],
    venue: [],
    sharpMoney: [],
    showBookmarked: false,
    sortBy: 'confidence',
    sortOrder: 'desc',
  });

  // Mock data enhanced with PropFinder-style features
  useEffect(() => {
    const mockData: PropOpportunity[] = [
      {
        id: '1',
        player: 'LeBron James',
        playerImage: '/api/placeholder/40/40',
        team: 'LAL',
        teamLogo: '/api/placeholder/24/24',
        opponent: 'GSW',
        opponentLogo: '/api/placeholder/24/24',
        sport: 'NBA',
        market: 'Points',
        line: 25.5,
        pick: 'over',
        odds: -110,
        impliedProbability: 52.4,
        aiProbability: 73.2,
        edge: 20.8,
        confidence: 94.7,
        projectedValue: 28.4,
        volume: 847,
        trend: 'up',
        trendStrength: 85,
        timeToGame: '2h 15m',
        venue: 'home',
        weather: 'Clear',
        injuries: [],
        recentForm: [31, 28, 24, 29, 27],
        matchupHistory: { games: 12, average: 27.8, hitRate: 75 },
        lineMovement: { open: 24.5, current: 25.5, direction: 'up' },
        bookmakers: [
          { name: 'DraftKings', odds: -110, line: 25.5 },
          { name: 'FanDuel', odds: -105, line: 25.5 },
          { name: 'BetMGM', odds: -115, line: 25.5 },
        ],
        isBookmarked: true,
        tags: ['Prime Time', 'Revenge Game', 'Sharp Play'],
        socialSentiment: 78,
        sharpMoney: 'heavy',
      },
      {
        id: '2',
        player: 'Luka Dončić',
        playerImage: '/api/placeholder/40/40',
        team: 'DAL',
        teamLogo: '/api/placeholder/24/24',
        opponent: 'PHX',
        opponentLogo: '/api/placeholder/24/24',
        sport: 'NBA',
        market: 'Assists',
        line: 8.5,
        pick: 'over',
        odds: -120,
        impliedProbability: 54.5,
        aiProbability: 79.3,
        edge: 24.8,
        confidence: 91.2,
        projectedValue: 10.1,
        volume: 632,
        trend: 'up',
        trendStrength: 92,
        timeToGame: '4h 30m',
        venue: 'away',
        injuries: ['Minor ankle'],
        recentForm: [12, 9, 8, 11, 10],
        matchupHistory: { games: 8, average: 9.8, hitRate: 88 },
        lineMovement: { open: 8.5, current: 8.5, direction: 'stable' },
        bookmakers: [
          { name: 'DraftKings', odds: -120, line: 8.5 },
          { name: 'FanDuel', odds: -115, line: 8.5 },
          { name: 'Caesars', odds: -125, line: 8.5 },
        ],
        isBookmarked: false,
        tags: ['Sharp Play', 'Pace Up'],
        socialSentiment: 82,
        sharpMoney: 'heavy',
      },
      {
        id: '3',
        player: 'Jayson Tatum',
        playerImage: '/api/placeholder/40/40',
        team: 'BOS',
        teamLogo: '/api/placeholder/24/24',
        opponent: 'MIA',
        opponentLogo: '/api/placeholder/24/24',
        sport: 'NBA',
        market: 'Rebounds',
        line: 7.5,
        pick: 'under',
        odds: +105,
        impliedProbability: 48.8,
        aiProbability: 68.4,
        edge: 19.6,
        confidence: 87.1,
        projectedValue: 6.2,
        volume: 423,
        trend: 'down',
        trendStrength: 74,
        timeToGame: '1h 45m',
        venue: 'home',
        injuries: [],
        recentForm: [6, 5, 8, 6, 7],
        matchupHistory: { games: 15, average: 6.8, hitRate: 67 },
        lineMovement: { open: 8.5, current: 7.5, direction: 'down' },
        bookmakers: [
          { name: 'DraftKings', odds: +105, line: 7.5 },
          { name: 'FanDuel', odds: +100, line: 7.5 },
          { name: 'BetMGM', odds: +110, line: 7.5 },
        ],
        isBookmarked: false,
        tags: ['Value Play', 'Line Movement'],
        socialSentiment: 65,
        sharpMoney: 'moderate',
      },
    ];
    setOpportunities(mockData);
    setFilteredOpportunities(mockData);
  }, []);

  // Advanced filtering logic
  const applyFilters = useMemo(() => {
    let filtered = opportunities.filter(opp => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        if (
          !opp.player.toLowerCase().includes(query) &&
          !opp.team.toLowerCase().includes(query) &&
          !opp.opponent.toLowerCase().includes(query) &&
          !opp.market.toLowerCase().includes(query)
        ) {
          return false;
        }
      }

      // Sport filter
      if (filters.sport.length > 0 && !filters.sport.includes(opp.sport)) {
        return false;
      }

      // Confidence range
      if (opp.confidence < filters.confidence[0] || opp.confidence > filters.confidence[1]) {
        return false;
      }

      // Edge range
      if (opp.edge < filters.edge[0] || opp.edge > filters.edge[1]) {
        return false;
      }

      // Bookmarked filter
      if (filters.showBookmarked && !opp.isBookmarked) {
        return false;
      }

      return true;
    });

    // Sorting
    filtered.sort((a, b) => {
      let aVal, bVal;
      switch (filters.sortBy) {
        case 'confidence':
          aVal = a.confidence;
          bVal = b.confidence;
          break;
        case 'edge':
          aVal = a.edge;
          bVal = b.edge;
          break;
        case 'volume':
          aVal = a.volume;
          bVal = b.volume;
          break;
        case 'trend':
          aVal = a.trendStrength;
          bVal = b.trendStrength;
          break;
        default:
          aVal = a.confidence;
          bVal = b.confidence;
      }

      return filters.sortOrder === 'desc' ? bVal - aVal : aVal - bVal;
    });

    return filtered;
  }, [opportunities, searchQuery, filters]);

  useEffect(() => {
    setFilteredOpportunities(applyFilters);
  }, [applyFilters]);

  // Auto-refresh functionality
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      // Simulate real-time updates
      setOpportunities(prev => 
        prev.map(opp => ({
          ...opp,
          confidence: Math.max(50, Math.min(99, opp.confidence + (Math.random() - 0.5) * 2)),
          edge: Math.max(0, Math.min(50, opp.edge + (Math.random() - 0.5) * 1)),
          volume: Math.max(0, opp.volume + Math.floor((Math.random() - 0.5) * 20)),
        }))
      );
    }, 5000);

    return () => clearInterval(interval);
  }, [autoRefresh]);

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 90) return 'text-green-400 bg-green-500/20';
    if (confidence >= 80) return 'text-yellow-400 bg-yellow-500/20';
    if (confidence >= 70) return 'text-orange-400 bg-orange-500/20';
    return 'text-red-400 bg-red-500/20';
  };

  const getEdgeColor = (edge: number) => {
    if (edge >= 20) return 'text-emerald-400';
    if (edge >= 15) return 'text-green-400';
    if (edge >= 10) return 'text-yellow-400';
    return 'text-orange-400';
  };

  const getSharpMoneyIcon = (sharpMoney: string) => {
    switch (sharpMoney) {
      case 'heavy':
        return <Flame className="w-3 h-3 text-red-400" />;
      case 'moderate':
        return <Target className="w-3 h-3 text-yellow-400" />;
      case 'light':
        return <Eye className="w-3 h-3 text-blue-400" />;
      default:
        return <Activity className="w-3 h-3 text-gray-400" />;
    }
  };

  const toggleBookmark = useCallback((id: string) => {
    startTransitionLocal(() => {
      setOpportunities(prev =>
        prev.map(opp =>
          opp.id === id ? { ...opp, isBookmarked: !opp.isBookmarked } : opp
        )
      );
    });
  }, [], { priority: 'low', batchUpdates: true });

  return (
    <PerformanceProfiler id="PropFinderKillerDashboard">
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      {/* Top Header */}
      <div className="sticky top-0 z-50 bg-slate-900/95 backdrop-blur-lg border-b border-slate-700">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Brain className="w-8 h-8 text-cyan-400" />
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                    PropFinder Killer
                  </h1>
                  <p className="text-sm text-gray-400">AI-Powered Player Prop Research</p>
                </div>
              </div>
              
              {/* Live Indicator */}
              <div className="flex items-center space-x-2 bg-green-500/20 px-3 py-1 rounded-full">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-xs text-green-400 font-medium">LIVE</span>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* View Mode Toggle */}
              <div className="flex items-center bg-slate-800 rounded-lg p-1">
                {(['grid', 'list', 'compact'] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setViewMode(mode)}
                    className={`px-3 py-2 text-xs font-medium rounded transition-all ${
                      viewMode === mode
                        ? 'bg-cyan-500 text-white'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    {mode.charAt(0).toUpperCase() + mode.slice(1)}
                  </button>
                ))}
              </div>

              {/* Auto Refresh Toggle */}
              <button
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all ${
                  autoRefresh
                    ? 'bg-green-500 text-white'
                    : 'bg-slate-700 text-gray-400 hover:bg-slate-600'
                }`}
              >
                {autoRefresh ? <PlayCircle className="w-4 h-4" /> : <PauseCircle className="w-4 h-4" />}
                <span className="text-sm">Auto Refresh</span>
              </button>

              <button className="p-2 text-gray-400 hover:text-white transition-colors">
                <Settings className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Search and Filters Bar */}
          <div className="flex items-center space-x-4 mt-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search players, teams, markets..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all"
              />
            </div>

            <button
              onClick={() => setFiltersOpen(!filtersOpen)}
              className={`flex items-center space-x-2 px-4 py-3 rounded-lg font-medium transition-all ${
                filtersOpen
                  ? 'bg-cyan-500 text-white'
                  : 'bg-slate-800 text-gray-400 hover:bg-slate-700 hover:text-white'
              }`}
            >
              <Filter className="w-4 h-4" />
              <span>Filters</span>
              {filtersOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            <button
              onClick={() => setFilters({ ...filters, showBookmarked: !filters.showBookmarked })}
              className={`flex items-center space-x-2 px-4 py-3 rounded-lg font-medium transition-all ${
                filters.showBookmarked
                  ? 'bg-yellow-500 text-black'
                  : 'bg-slate-800 text-gray-400 hover:bg-slate-700 hover:text-white'
              }`}
            >
              <Bookmark className="w-4 h-4" />
              <span>Bookmarked</span>
            </button>
          </div>
        </div>

        {/* Advanced Filters Panel */}
        <AnimatePresence>
          {filtersOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border-t border-slate-700 overflow-hidden"
            >
              <div className="px-6 py-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {/* Sport Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Sports</label>
                    <div className="space-y-2">
                      {['NBA', 'NFL', 'MLB', 'NHL'].map((sport) => (
                        <label key={sport} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={filters.sport.includes(sport)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setFilters({ ...filters, sport: [...filters.sport, sport] });
                              } else {
                                setFilters({ ...filters, sport: filters.sport.filter(s => s !== sport) });
                              }
                            }}
                            className="mr-2 text-cyan-400"
                          />
                          <span className="text-sm text-gray-300">{sport}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Confidence Range */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Confidence Range: {filters.confidence[0]}% - {filters.confidence[1]}%
                    </label>
                    <div className="space-y-2">
                      <input
                        type="range"
                        min="50"
                        max="100"
                        value={filters.confidence[0]}
                        onChange={(e) => setFilters({
                          ...filters,
                          confidence: [parseInt(e.target.value), filters.confidence[1]]
                        })}
                        className="w-full"
                      />
                      <input
                        type="range"
                        min="50"
                        max="100"
                        value={filters.confidence[1]}
                        onChange={(e) => setFilters({
                          ...filters,
                          confidence: [filters.confidence[0], parseInt(e.target.value)]
                        })}
                        className="w-full"
                      />
                    </div>
                  </div>

                  {/* Edge Range */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Edge Range: {filters.edge[0]}% - {filters.edge[1]}%
                    </label>
                    <div className="space-y-2">
                      <input
                        type="range"
                        min="0"
                        max="50"
                        value={filters.edge[0]}
                        onChange={(e) => setFilters({
                          ...filters,
                          edge: [parseInt(e.target.value), filters.edge[1]]
                        })}
                        className="w-full"
                      />
                      <input
                        type="range"
                        min="0"
                        max="50"
                        value={filters.edge[1]}
                        onChange={(e) => setFilters({
                          ...filters,
                          edge: [filters.edge[0], parseInt(e.target.value)]
                        })}
                        className="w-full"
                      />
                    </div>
                  </div>

                  {/* Sort Options */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Sort By</label>
                    <select
                      value={filters.sortBy}
                      onChange={(e) => setFilters({ ...filters, sortBy: e.target.value as any })}
                      className="w-full bg-slate-800 border border-slate-600 rounded-lg p-2 text-white"
                    >
                      <option value="confidence">Confidence</option>
                      <option value="edge">Edge</option>
                      <option value="volume">Volume</option>
                      <option value="trend">Trend Strength</option>
                    </select>
                    <div className="flex items-center mt-2">
                      <button
                        onClick={() => setFilters({ 
                          ...filters, 
                          sortOrder: filters.sortOrder === 'desc' ? 'asc' : 'desc' 
                        })}
                        className="flex items-center space-x-1 text-sm text-cyan-400 hover:text-cyan-300"
                      >
                        {filters.sortOrder === 'desc' ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                        <span>{filters.sortOrder === 'desc' ? 'Descending' : 'Ascending'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Main Content */}
      <div className="px-6 py-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-slate-800/50 backdrop-blur-lg border border-slate-700 rounded-xl p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Total Opportunities</p>
                <p className="text-2xl font-bold text-white">{filteredOpportunities.length}</p>
                <p className="text-xs text-green-400 mt-1">+12 new today</p>
              </div>
              <Activity className="w-8 h-8 text-cyan-400" />
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-slate-800/50 backdrop-blur-lg border border-slate-700 rounded-xl p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Avg Confidence</p>
                <p className="text-2xl font-bold text-white">
                  {(filteredOpportunities.reduce((sum, opp) => sum + opp.confidence, 0) / filteredOpportunities.length || 0).toFixed(1)}%
                </p>
                <p className="text-xs text-green-400 mt-1">Above threshold</p>
              </div>
              <Brain className="w-8 h-8 text-purple-400" />
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-slate-800/50 backdrop-blur-lg border border-slate-700 rounded-xl p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Best Edge</p>
                <p className="text-2xl font-bold text-white">
                  {Math.max(...filteredOpportunities.map(opp => opp.edge), 0).toFixed(1)}%
                </p>
                <p className="text-xs text-green-400 mt-1">Market inefficiency</p>
              </div>
              <Target className="w-8 h-8 text-green-400" />
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-slate-800/50 backdrop-blur-lg border border-slate-700 rounded-xl p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Sharp Money</p>
                <p className="text-2xl font-bold text-white">
                  {filteredOpportunities.filter(opp => opp.sharpMoney === 'heavy').length}
                </p>
                <p className="text-xs text-red-400 mt-1">Heavy action</p>
              </div>
              <Flame className="w-8 h-8 text-red-400" />
            </div>
          </motion.div>
        </div>

        {/* Opportunities List */}
        <div className="space-y-4">
          <AnimatePresence>
            {filteredOpportunities.map((opp, index) => (
              <motion.div
                key={opp.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.05 }}
                className="bg-slate-800/50 backdrop-blur-lg border border-slate-700 rounded-xl hover:border-cyan-400/50 transition-all group"
              >
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-4">
                      {/* Player Info */}
                      <div className="flex items-center space-x-3">
                        <div className="relative">
                          <div className="w-12 h-12 bg-slate-700 rounded-full flex items-center justify-center">
                            <span className="text-lg font-bold text-white">
                              {opp.player.split(' ').map(n => n[0]).join('')}
                            </span>
                          </div>
                          <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-slate-600 rounded-full flex items-center justify-center text-xs">
                            {opp.team}
                          </div>
                        </div>
                        <div>
                          <h3 className="font-bold text-white text-lg">{opp.player}</h3>
                          <p className="text-sm text-gray-400">{opp.team} vs {opp.opponent} • {opp.timeToGame}</p>
                        </div>
                      </div>

                      {/* Tags */}
                      <div className="flex items-center space-x-2">
                        {opp.tags.slice(0, 2).map((tag, i) => (
                          <span
                            key={i}
                            className="px-2 py-1 bg-cyan-500/20 text-cyan-400 text-xs font-medium rounded-full"
                          >
                            {tag}
                          </span>
                        ))}
                        {getSharpMoneyIcon(opp.sharpMoney)}
                      </div>
                    </div>

                    <div className="flex items-center space-x-4">
                      <button
                        onClick={() => toggleBookmark(opp.id)}
                        className={`p-2 rounded-lg transition-all ${
                          opp.isBookmarked 
                            ? 'text-yellow-400 bg-yellow-500/20' 
                            : 'text-gray-400 hover:text-yellow-400'
                        }`}
                      >
                        <Bookmark className="w-5 h-5" />
                      </button>
                      <button className="p-2 text-gray-400 hover:text-white transition-colors">
                        <Share2 className="w-5 h-5" />
                      </button>
                      <button 
                        onClick={() => setSelectedOpp(selectedOpp?.id === opp.id ? null : opp)}
                        className="p-2 text-gray-400 hover:text-cyan-400 transition-colors"
                      >
                        <Maximize2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  {/* Market Info */}
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-4">
                    <div className="bg-slate-900/50 rounded-lg p-4">
                      <div className="text-sm text-gray-400 mb-1">Market</div>
                      <div className="font-bold text-white">{opp.market}</div>
                      <div className="text-sm text-cyan-400">
                        {opp.pick.toUpperCase()} {opp.line}
                      </div>
                    </div>

                    <div className="bg-slate-900/50 rounded-lg p-4">
                      <div className="text-sm text-gray-400 mb-1">AI Confidence</div>
                      <div className={`font-bold text-2xl ${getConfidenceColor(opp.confidence).split(' ')[0]}`}>
                        {opp.confidence.toFixed(1)}%
                      </div>
                      <div className="text-xs text-gray-400">vs {opp.impliedProbability.toFixed(1)}% implied</div>
                    </div>

                    <div className="bg-slate-900/50 rounded-lg p-4">
                      <div className="text-sm text-gray-400 mb-1">Edge</div>
                      <div className={`font-bold text-2xl ${getEdgeColor(opp.edge)}`}>
                        +{opp.edge.toFixed(1)}%
                      </div>
                      <div className="text-xs text-gray-400">Market inefficiency</div>
                    </div>

                    <div className="bg-slate-900/50 rounded-lg p-4">
                      <div className="text-sm text-gray-400 mb-1">Projection</div>
                      <div className="font-bold text-white text-xl">{opp.projectedValue.toFixed(1)}</div>
                      <div className="text-xs text-gray-400">Expected value</div>
                    </div>

                    <div className="bg-slate-900/50 rounded-lg p-4">
                      <div className="text-sm text-gray-400 mb-1">Best Odds</div>
                      <div className="font-bold text-white text-xl">{opp.odds > 0 ? '+' : ''}{opp.odds}</div>
                      <div className="text-xs text-gray-400">{opp.bookmakers[0]?.name}</div>
                    </div>
                  </div>

                  {/* Trend & Analytics */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-6">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-400">Trend:</span>
                        {opp.trend === 'up' ? (
                          <TrendingUp className="w-4 h-4 text-green-400" />
                        ) : opp.trend === 'down' ? (
                          <TrendingDown className="w-4 h-4 text-red-400" />
                        ) : (
                          <Activity className="w-4 h-4 text-gray-400" />
                        )}
                        <span className="text-sm font-medium text-white">{opp.trendStrength}% strength</span>
                      </div>

                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-400">Volume:</span>
                        <span className="text-sm font-medium text-white">{opp.volume.toLocaleString()}</span>
                      </div>

                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-400">Form:</span>
                        <div className="flex space-x-1">
                          {opp.recentForm.slice(-5).map((value, i) => (
                            <div
                              key={i}
                              className={`w-2 h-6 rounded-sm ${
                                value > opp.line ? 'bg-green-400' : 'bg-red-400'
                              }`}
                              style={{ opacity: 0.5 + (i * 0.1) }}
                            />
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <div className="text-sm text-gray-400">Line Movement</div>
                        <div className="flex items-center space-x-1">
                          <span className="text-sm text-white">{opp.lineMovement.open}</span>
                          <span className="text-xs text-gray-400">→</span>
                          <span className="text-sm font-bold text-white">{opp.lineMovement.current}</span>
                          {opp.lineMovement.direction === 'up' ? (
                            <ChevronUp className="w-3 h-3 text-green-400" />
                          ) : opp.lineMovement.direction === 'down' ? (
                            <ChevronDown className="w-3 h-3 text-red-400" />
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Details */}
                  <AnimatePresence>
                    {selectedOpp?.id === opp.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="border-t border-slate-700 mt-4 pt-4"
                      >
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          {/* Matchup History */}
                          <div className="bg-slate-900/50 rounded-lg p-4">
                            <h4 className="font-bold text-white mb-3">Matchup History</h4>
                            <div className="space-y-2">
                              <div className="flex justify-between">
                                <span className="text-gray-400">Games:</span>
                                <span className="text-white">{opp.matchupHistory.games}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-400">Average:</span>
                                <span className="text-white">{opp.matchupHistory.average}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-400">Hit Rate:</span>
                                <span className="text-green-400">{opp.matchupHistory.hitRate}%</span>
                              </div>
                            </div>
                          </div>

                          {/* Bookmaker Comparison */}
                          <div className="bg-slate-900/50 rounded-lg p-4">
                            <h4 className="font-bold text-white mb-3">Bookmaker Odds</h4>
                            <div className="space-y-2">
                              {opp.bookmakers.map((book, i) => (
                                <div key={i} className="flex justify-between">
                                  <span className="text-gray-400">{book.name}:</span>
                                  <span className="text-white">{book.odds > 0 ? '+' : ''}{book.odds}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Additional Insights */}
                          <div className="bg-slate-900/50 rounded-lg p-4">
                            <h4 className="font-bold text-white mb-3">Insights</h4>
                            <div className="space-y-2">
                              <div className="flex justify-between">
                                <span className="text-gray-400">Venue:</span>
                                <span className="text-white capitalize">{opp.venue}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-400">Weather:</span>
                                <span className="text-white">{opp.weather || 'Indoor'}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-400">Social Sentiment:</span>
                                <span className="text-white">{opp.socialSentiment}%</span>
                              </div>
                              {opp.injuries.length > 0 && (
                                <div className="mt-2">
                                  <span className="text-red-400 text-sm">⚠️ {opp.injuries.join(', ')}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Empty State */}
        {filteredOpportunities.length === 0 && (
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">No opportunities found</h3>
            <p className="text-gray-400 mb-4">Try adjusting your filters or search criteria</p>
            <button
              onClick={() => {
                setSearchQuery('');
                setFilters({
                  sport: [],
                  confidence: [80, 100],
                  edge: [0, 50],
                  timeToGame: 'all',
                  market: [],
                  venue: [],
                  sharpMoney: [],
                  showBookmarked: false,
                  sortBy: 'confidence',
                  sortOrder: 'desc',
                });
              }}
              className="px-6 py-3 bg-cyan-500 text-white rounded-lg font-medium hover:bg-cyan-600 transition-colors"
            >
              Clear All Filters
            </button>
          </div>
        )}
      </div>

      {/* Community Engagement Section */}
      <div className="mt-8">
        <CommunityEngagement />
      </div>
      </div>
    </PerformanceProfiler>
  );
};

export default PropFinderKillerDashboard;
