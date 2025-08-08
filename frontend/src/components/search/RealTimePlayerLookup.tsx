import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Clock,
  TrendingUp,
  TrendingDown,
  Target,
  BarChart3,
  Activity,
  Star,
  User,
  Calendar,
  MapPin,
  Trophy,
  AlertCircle,
  CheckCircle,
  Zap,
  Shield,
  Eye,
  Filter,
  SortAsc,
  SortDesc,
  Loader,
  X,
  ChevronRight,
  Info,
  Flame,
  DollarSign,
} from 'lucide-react';

interface PlayerSearchResult {
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
  last10: Record<string, number>;
  home: Record<string, number>;
  away: Record<string, number>;
  vsOpponent: Record<string, number>;
}

interface GamePerformance {
  date: string;
  opponent: string;
  stats: Record<string, number>;
  venue: 'home' | 'away';
  outcome: 'win' | 'loss';
}

interface UpcomingGameInfo {
  date: string;
  opponent: string;
  venue: 'home' | 'away';
  time: string;
  tv: string;
  spread: number;
  total: number;
  pace: number;
}

interface InjuryStatus {
  status: 'healthy' | 'probable' | 'questionable' | 'doubtful' | 'out';
  description?: string;
  lastUpdate: string;
  impact: number;
}

interface PropOpportunity {
  market: string;
  line: number;
  odds: number;
  recommendation: 'over' | 'under' | 'pass';
  confidence: number;
  edge: number;
}

interface SearchFilters {
  team: string[];
  position: string[];
  status: string[];
  minConfidence: number;
  sortBy: 'name' | 'hotness' | 'value' | 'confidence';
  sortOrder: 'asc' | 'desc';
}

const RealTimePlayerLookup: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<PlayerSearchResult[]>([]);
  const [selectedPlayer, setSelectedPlayer] = useState<PlayerSearchResult | null>(null);
  const [filters, setFilters] = useState<SearchFilters>({
    team: [],
    position: [],
    status: [],
    minConfidence: 70,
    sortBy: 'hotness',
    sortOrder: 'desc',
  });
  const [showFilters, setShowFilters] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  // Mock data for demonstration
  const mockSearchResults: PlayerSearchResult[] = [
    {
      id: 'tatum-1',
      name: 'Jayson Tatum',
      team: 'Boston Celtics',
      position: 'SF',
      number: 0,
      image: '🏀',
      stats: {
        season: { points: 27.8, rebounds: 8.4, assists: 4.9, threes: 3.1, steals: 1.1 },
        last5: { points: 31.2, rebounds: 9.1, assists: 5.4, threes: 3.8, steals: 1.3 },
        last10: { points: 29.5, rebounds: 8.7, assists: 5.1, threes: 3.5, steals: 1.2 },
        home: { points: 29.1, rebounds: 8.9, assists: 5.2, threes: 3.4, steals: 1.1 },
        away: { points: 26.5, rebounds: 7.9, assists: 4.6, threes: 2.8, steals: 1.0 },
        vsOpponent: { points: 32.4, rebounds: 9.8, assists: 5.7, threes: 4.1, steals: 1.4 },
      },
      recentForm: [
        { date: '2024-01-15', opponent: 'MIA', stats: { points: 34, rebounds: 9, assists: 6 }, venue: 'home', outcome: 'win' },
        { date: '2024-01-13', opponent: 'PHI', stats: { points: 28, rebounds: 7, assists: 5 }, venue: 'away', outcome: 'loss' },
        { date: '2024-01-11', opponent: 'BRK', stats: { points: 31, rebounds: 10, assists: 4 }, venue: 'home', outcome: 'win' },
      ],
      upcomingGame: {
        date: '2024-01-18',
        opponent: 'LAL',
        venue: 'home',
        time: '8:00 PM ET',
        tv: 'ESPN',
        spread: -3.5,
        total: 234.5,
        pace: 103.2,
      },
      injuryStatus: {
        status: 'healthy',
        lastUpdate: '2024-01-17',
        impact: 0,
      },
      props: [
        { market: 'Points', line: 27.5, odds: -110, recommendation: 'over', confidence: 87, edge: 12.3 },
        { market: 'Rebounds', line: 8.5, odds: -105, recommendation: 'under', confidence: 72, edge: 8.1 },
        { market: 'Assists', line: 4.5, odds: -115, recommendation: 'over', confidence: 79, edge: 9.7 },
      ],
      marketValue: 92,
      hotness: 94,
    },
    {
      id: 'curry-1',
      name: 'Stephen Curry',
      team: 'Golden State Warriors',
      position: 'PG',
      number: 30,
      image: '🏀',
      stats: {
        season: { points: 29.3, rebounds: 4.8, assists: 6.2, threes: 4.7, steals: 1.3 },
        last5: { points: 32.1, rebounds: 5.2, assists: 7.1, threes: 5.8, steals: 1.6 },
        last10: { points: 30.8, rebounds: 5.0, assists: 6.7, threes: 5.2, steals: 1.4 },
        home: { points: 31.2, rebounds: 5.1, assists: 6.8, threes: 5.1, steals: 1.4 },
        away: { points: 27.4, rebounds: 4.5, assists: 5.6, threes: 4.3, steals: 1.2 },
        vsOpponent: { points: 28.9, rebounds: 4.7, assists: 6.5, threes: 4.9, steals: 1.3 },
      },
      recentForm: [
        { date: '2024-01-16', opponent: 'DEN', stats: { points: 35, rebounds: 6, assists: 8 }, venue: 'away', outcome: 'win' },
        { date: '2024-01-14', opponent: 'LAC', stats: { points: 29, rebounds: 4, assists: 7 }, venue: 'home', outcome: 'loss' },
      ],
      upcomingGame: {
        date: '2024-01-19',
        opponent: 'PHX',
        venue: 'away',
        time: '10:00 PM ET',
        tv: 'TNT',
        spread: +2.5,
        total: 229.5,
        pace: 98.7,
      },
      injuryStatus: {
        status: 'probable',
        description: 'Left ankle soreness',
        lastUpdate: '2024-01-17',
        impact: 0.15,
      },
      props: [
        { market: 'Points', line: 29.5, odds: -108, recommendation: 'over', confidence: 82, edge: 9.4 },
        { market: '3-Pointers', line: 4.5, odds: -112, recommendation: 'over', confidence: 89, edge: 15.2 },
      ],
      marketValue: 89,
      hotness: 88,
    },
  ];

  const teams = ['BOS', 'GSW', 'LAL', 'BRK', 'MIA', 'PHI', 'DEN', 'PHX', 'LAC'];
  const positions = ['PG', 'SG', 'SF', 'PF', 'C'];

  const handleSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsLoading(true);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Filter mock results based on query
    const filtered = mockSearchResults.filter(player =>
      player.name.toLowerCase().includes(query.toLowerCase()) ||
      player.team.toLowerCase().includes(query.toLowerCase()) ||
      player.position.toLowerCase().includes(query.toLowerCase())
    );
    
    setSearchResults(filtered);
    setIsLoading(false);

    // Add to recent searches
    if (query.length > 2 && !recentSearches.includes(query)) {
      setRecentSearches(prev => [query, ...prev.slice(0, 4)]);
    }
  }, [recentSearches]);

  const filteredAndSortedResults = useMemo(() => {
    let filtered = searchResults.filter(player => {
      if (filters.team.length > 0 && !filters.team.includes(player.team.split(' ').pop() || '')) return false;
      if (filters.position.length > 0 && !filters.position.includes(player.position)) return false;
      if (player.props.length > 0 && Math.max(...player.props.map(p => p.confidence)) < filters.minConfidence) return false;
      return true;
    });

    filtered.sort((a, b) => {
      let aValue: number, bValue: number;
      
      switch (filters.sortBy) {
        case 'name':
          return filters.sortOrder === 'asc' 
            ? a.name.localeCompare(b.name)
            : b.name.localeCompare(a.name);
        case 'hotness':
          aValue = a.hotness;
          bValue = b.hotness;
          break;
        case 'value':
          aValue = a.marketValue;
          bValue = b.marketValue;
          break;
        case 'confidence':
          aValue = Math.max(...a.props.map(p => p.confidence));
          bValue = Math.max(...b.props.map(p => p.confidence));
          break;
        default:
          return 0;
      }
      
      return filters.sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
    });

    return filtered;
  }, [searchResults, filters]);

  const getInjuryStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-400';
      case 'probable': return 'text-yellow-400';
      case 'questionable': return 'text-orange-400';
      case 'doubtful': return 'text-red-400';
      case 'out': return 'text-red-500';
      default: return 'text-gray-400';
    }
  };

  const getRecommendationColor = (rec: string) => {
    switch (rec) {
      case 'over': return 'text-green-400';
      case 'under': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      handleSearch(searchQuery);
    }, 300);

    return () => clearTimeout(delayedSearch);
  }, [searchQuery, handleSearch]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent mb-2">
            Real-Time Player Lookup
          </h1>
          <p className="text-gray-400">Sub-second search with comprehensive statistics and matchup data</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Search Panel */}
          <div className="lg:col-span-1 space-y-6">
            {/* Search Input */}
            <div className="bg-slate-800/50 backdrop-blur-lg rounded-xl border border-slate-700/50 p-6">
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search players..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all"
                />
                {isLoading && (
                  <Loader className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-cyan-400 animate-spin" />
                )}
              </div>

              {/* Recent Searches */}
              {recentSearches.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-400 mb-2">Recent Searches</h4>
                  <div className="flex flex-wrap gap-2">
                    {recentSearches.map((search, index) => (
                      <button
                        key={index}
                        onClick={() => setSearchQuery(search)}
                        className="px-3 py-1 bg-slate-700 text-gray-300 rounded-full text-sm hover:bg-slate-600 transition-colors"
                      >
                        {search}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Quick Filters */}
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-medium text-white">Filters</h4>
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="p-2 bg-slate-700 rounded-lg hover:bg-slate-600 transition-colors"
                >
                  <Filter className="w-4 h-4 text-gray-400" />
                </button>
              </div>

              <AnimatePresence>
                {showFilters && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="space-y-4"
                  >
                    {/* Team Filter */}
                    <div>
                      <label className="text-sm text-gray-400 mb-2 block">Teams</label>
                      <div className="flex flex-wrap gap-2">
                        {teams.map(team => (
                          <button
                            key={team}
                            onClick={() => setFilters(prev => ({
                              ...prev,
                              team: prev.team.includes(team) 
                                ? prev.team.filter(t => t !== team)
                                : [...prev.team, team]
                            }))}
                            className={`px-2 py-1 rounded text-xs transition-colors ${
                              filters.team.includes(team)
                                ? 'bg-cyan-500 text-white'
                                : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
                            }`}
                          >
                            {team}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Position Filter */}
                    <div>
                      <label className="text-sm text-gray-400 mb-2 block">Positions</label>
                      <div className="flex flex-wrap gap-2">
                        {positions.map(pos => (
                          <button
                            key={pos}
                            onClick={() => setFilters(prev => ({
                              ...prev,
                              position: prev.position.includes(pos) 
                                ? prev.position.filter(p => p !== pos)
                                : [...prev.position, pos]
                            }))}
                            className={`px-2 py-1 rounded text-xs transition-colors ${
                              filters.position.includes(pos)
                                ? 'bg-cyan-500 text-white'
                                : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
                            }`}
                          >
                            {pos}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Confidence Filter */}
                    <div>
                      <label className="text-sm text-gray-400 mb-2 block">
                        Min Confidence: {filters.minConfidence}%
                      </label>
                      <input
                        type="range"
                        min="50"
                        max="95"
                        value={filters.minConfidence}
                        onChange={(e) => setFilters(prev => ({ ...prev, minConfidence: parseInt(e.target.value) }))}
                        className="w-full accent-cyan-400"
                      />
                    </div>

                    {/* Sort Options */}
                    <div>
                      <label className="text-sm text-gray-400 mb-2 block">Sort By</label>
                      <div className="flex space-x-2">
                        <select
                          value={filters.sortBy}
                          onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value as any }))}
                          className="flex-1 px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white text-sm"
                        >
                          <option value="hotness">Hotness</option>
                          <option value="value">Market Value</option>
                          <option value="confidence">Confidence</option>
                          <option value="name">Name</option>
                        </select>
                        <button
                          onClick={() => setFilters(prev => ({ 
                            ...prev, 
                            sortOrder: prev.sortOrder === 'asc' ? 'desc' : 'asc' 
                          }))}
                          className="p-2 bg-slate-700 rounded hover:bg-slate-600 transition-colors"
                        >
                          {filters.sortOrder === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Search Results */}
            <div className="bg-slate-800/50 backdrop-blur-lg rounded-xl border border-slate-700/50 p-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-bold text-white">Search Results</h4>
                <span className="text-sm text-gray-400">{filteredAndSortedResults.length} players</span>
              </div>

              <div className="space-y-3 max-h-96 overflow-y-auto">
                {filteredAndSortedResults.map((player) => (
                  <motion.div
                    key={player.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-3 rounded-lg cursor-pointer transition-all ${
                      selectedPlayer?.id === player.id
                        ? 'bg-cyan-500/20 border border-cyan-500/40'
                        : 'bg-slate-700/30 hover:bg-slate-700/50'
                    }`}
                    onClick={() => setSelectedPlayer(player)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="text-2xl">{player.image}</div>
                        <div>
                          <div className="font-medium text-white">{player.name}</div>
                          <div className="text-sm text-gray-400">{player.team} • #{player.number} • {player.position}</div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className={`w-2 h-2 rounded-full ${getInjuryStatusColor(player.injuryStatus.status)}`} />
                        <span className="text-sm font-bold text-orange-400">{player.hotness}%</span>
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>

          {/* Player Details */}
          <div className="lg:col-span-2">
            {selectedPlayer ? (
              <div className="space-y-6">
                {/* Player Header */}
                <div className="bg-slate-800/50 backdrop-blur-lg rounded-xl border border-slate-700/50 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-4">
                      <div className="text-4xl">{selectedPlayer.image}</div>
                      <div>
                        <h2 className="text-2xl font-bold text-white">{selectedPlayer.name}</h2>
                        <p className="text-gray-400">{selectedPlayer.team} • #{selectedPlayer.number} • {selectedPlayer.position}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-lg font-bold ${getInjuryStatusColor(selectedPlayer.injuryStatus.status)}`}>
                        {selectedPlayer.injuryStatus.status.toUpperCase()}
                      </div>
                      <div className="text-sm text-gray-400">Injury Status</div>
                    </div>
                  </div>

                  {/* Upcoming Game */}
                  <div className="bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border border-cyan-500/20 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-bold text-white">Next Game</div>
                        <div className="text-sm text-gray-300">
                          {selectedPlayer.upcomingGame.venue === 'home' ? 'vs' : '@'} {selectedPlayer.upcomingGame.opponent}
                        </div>
                        <div className="text-xs text-gray-400">
                          {selectedPlayer.upcomingGame.date} • {selectedPlayer.upcomingGame.time} • {selectedPlayer.upcomingGame.tv}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-400">Spread: {selectedPlayer.upcomingGame.spread > 0 ? '+' : ''}{selectedPlayer.upcomingGame.spread}</div>
                        <div className="text-sm text-gray-400">Total: {selectedPlayer.upcomingGame.total}</div>
                        <div className="text-sm text-gray-400">Pace: {selectedPlayer.upcomingGame.pace}</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Statistics Comparison */}
                <div className="bg-slate-800/50 backdrop-blur-lg rounded-xl border border-slate-700/50 p-6">
                  <h3 className="text-xl font-bold text-white mb-6">Statistics Breakdown</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {Object.entries(selectedPlayer.stats.season).map(([stat, value]) => (
                      <div key={stat} className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-white capitalize">{stat}</span>
                          <div className="text-sm text-gray-400">vs Opponent: {selectedPlayer.stats.vsOpponent[stat]?.toFixed(1)}</div>
                        </div>
                        
                        <div className="space-y-2">
                          {[
                            { label: 'Season', value: selectedPlayer.stats.season[stat], color: 'bg-gray-500' },
                            { label: 'L5', value: selectedPlayer.stats.last5[stat], color: 'bg-green-500' },
                            { label: 'L10', value: selectedPlayer.stats.last10[stat], color: 'bg-blue-500' },
                            { label: 'Home', value: selectedPlayer.stats.home[stat], color: 'bg-purple-500' },
                            { label: 'Away', value: selectedPlayer.stats.away[stat], color: 'bg-orange-500' },
                          ].map((item) => (
                            <div key={item.label} className="flex items-center space-x-3">
                              <div className="w-12 text-xs text-gray-400">{item.label}</div>
                              <div className="flex-1 bg-slate-700 rounded-full h-2">
                                <div
                                  className={`h-2 rounded-full ${item.color}`}
                                  style={{ 
                                    width: `${Math.min((item.value / Math.max(...Object.values(selectedPlayer.stats.season))) * 100, 100)}%` 
                                  }}
                                />
                              </div>
                              <div className="w-12 text-sm font-bold text-white text-right">{item.value.toFixed(1)}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Prop Opportunities */}
                <div className="bg-slate-800/50 backdrop-blur-lg rounded-xl border border-slate-700/50 p-6">
                  <h3 className="text-xl font-bold text-white mb-6">Prop Opportunities</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {selectedPlayer.props.map((prop, index) => (
                      <div key={index} className="bg-slate-700/30 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="font-medium text-white">{prop.market}</div>
                          <div className={`text-sm font-bold ${getRecommendationColor(prop.recommendation)}`}>
                            {prop.recommendation.toUpperCase()}
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-gray-400">Line:</span>
                            <span className="text-white font-bold">{prop.line}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Odds:</span>
                            <span className="text-white">{prop.odds > 0 ? '+' : ''}{prop.odds}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Confidence:</span>
                            <span className="text-cyan-400 font-bold">{prop.confidence}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Edge:</span>
                            <span className="text-green-400 font-bold">+{prop.edge.toFixed(1)}%</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recent Form */}
                <div className="bg-slate-800/50 backdrop-blur-lg rounded-xl border border-slate-700/50 p-6">
                  <h3 className="text-xl font-bold text-white mb-6">Recent Form</h3>
                  
                  <div className="space-y-3">
                    {selectedPlayer.recentForm.map((game, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
                        <div className="flex items-center space-x-4">
                          <div className={`w-3 h-3 rounded-full ${
                            game.outcome === 'win' ? 'bg-green-400' : 'bg-red-400'
                          }`} />
                          <div>
                            <div className="font-medium text-white">
                              {game.venue === 'home' ? 'vs' : '@'} {game.opponent}
                            </div>
                            <div className="text-sm text-gray-400">{game.date}</div>
                          </div>
                        </div>
                        
                        <div className="flex space-x-4 text-sm">
                          {Object.entries(game.stats).map(([stat, value]) => (
                            <div key={stat} className="text-center">
                              <div className="text-white font-bold">{value}</div>
                              <div className="text-gray-400 capitalize">{stat}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-slate-800/50 backdrop-blur-lg rounded-xl border border-slate-700/50 p-12 text-center">
                <Search className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">Search for Players</h3>
                <p className="text-gray-400">Enter a player name, team, or position to get started</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RealTimePlayerLookup;
