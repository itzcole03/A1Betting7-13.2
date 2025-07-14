import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Globe,
  Calendar,
  TrendingUp,
  BarChart3,
  Clock,
  Star,
  Filter,
  Search,
  RefreshCw,
  Settings,
  Play,
  Pause,
  Target,
  Trophy,
  Activity,
  Users,
  DollarSign,
  Zap,
  Eye,
  ChevronDown,
  ChevronRight,
  AlertCircle,
  CheckCircle,
  Plus,
  Minus,
} from 'lucide-react';
import { Layout } from '../../core/Layout';
import {
  SPORTS_CONFIG,
  SPORT_CATEGORIES,
  SEASON_FILTERS,
  SPORT_COMBINATIONS,
  getSportById,
  getSportDisplayName,
  getSportColor,
  getSportEmoji,
  getSportsByCategory,
  getActiveSports,
  getFantasySports,
  getLiveBettingSports,
  getSportMarkets,
} from '../../../constants/sports';

interface SportPerformance {
  sportId: string;
  winRate: number;
  roi: number;
  totalBets: number;
  activeBets: number;
  profit: number;
  volume: number;
  trend: 'up' | 'down' | 'stable';
  lastUpdated: Date;
  topMarkets: Array<{
    market: string;
    winRate: number;
    volume: number;
  }>;
  recentGames: Array<{
    game: string;
    result: 'won' | 'lost' | 'pending';
    profit: number;
    date: Date;
  }>;
}

interface SportAlert {
  id: string;
  sportId: string;
  type: 'opportunity' | 'performance' | 'news' | 'injury' | 'weather';
  title: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: Date;
  actionRequired: boolean;
  dismissed: boolean;
}

const SportsManager: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedSeason, setSelectedSeason] = useState<string>('active');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'alphabetical' | 'performance' | 'activity' | 'profit'>(
    'performance'
  );
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'detailed'>('grid');
  const [performanceData, setPerformanceData] = useState<SportPerformance[]>([]);
  const [alerts, setAlerts] = useState<SportAlert[]>([]);
  const [selectedSports, setSelectedSports] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [expandedSports, setExpandedSports] = useState<Set<string>>(new Set());
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadSportsData();
    loadFavorites();
    const interval = setInterval(loadSportsData, 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);

  const loadSportsData = async () => {
    setIsLoading(true);
    try {
      // Generate comprehensive performance data for all sports
      const mockPerformance: SportPerformance[] = SPORTS_CONFIG.map(sport => {
        const winRate = 60 + Math.random() * 35;
        const roi = 5 + Math.random() * 45;
        const totalBets = Math.floor(Math.random() * 500) + 50;
        const activeBets = Math.floor(Math.random() * 50) + 5;
        const profit = (Math.random() - 0.2) * 10000;

        return {
          sportId: sport.id,
          winRate,
          roi,
          totalBets,
          activeBets,
          profit,
          volume: totalBets * (50 + Math.random() * 200),
          trend: Math.random() > 0.6 ? 'up' : Math.random() > 0.3 ? 'stable' : 'down',
          lastUpdated: new Date(),
          topMarkets: sport.popularMarkets.slice(0, 3).map(market => ({
            market,
            winRate: 50 + Math.random() * 40,
            volume: Math.floor(Math.random() * 100) + 10,
          })),
          recentGames: Array.from({ length: 5 }, (_, i) => ({
            game: generateGameName(sport.id),
            result: Math.random() > 0.4 ? 'won' : Math.random() > 0.2 ? 'lost' : 'pending',
            profit: (Math.random() - 0.4) * 500,
            date: new Date(Date.now() - i * 24 * 60 * 60 * 1000),
          })),
        };
      });

      // Generate alerts for sports
      const mockAlerts: SportAlert[] = SPORTS_CONFIG.slice(0, 8).map((sport, index) => ({
        id: `alert-${sport.id}-${index}`,
        sportId: sport.id,
        type: ['opportunity', 'performance', 'news', 'injury', 'weather'][
          Math.floor(Math.random() * 5)
        ] as any,
        title: generateAlertTitle(sport.id),
        message: generateAlertMessage(sport.id),
        severity: ['low', 'medium', 'high', 'critical'][Math.floor(Math.random() * 4)] as any,
        timestamp: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000),
        actionRequired: Math.random() > 0.7,
        dismissed: false,
      }));

      setPerformanceData(mockPerformance);
      setAlerts(mockAlerts);
    } catch (error) {
      console.error('Failed to load sports data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadFavorites = () => {
    const saved = localStorage.getItem('a1betting-favorite-sports');
    if (saved) {
      setFavorites(new Set(JSON.parse(saved)));
    }
  };

  const saveFavorites = (newFavorites: Set<string>) => {
    setFavorites(newFavorites);
    localStorage.setItem('a1betting-favorite-sports', JSON.stringify(Array.from(newFavorites)));
  };

  const toggleFavorite = (sportId: string) => {
    const newFavorites = new Set(favorites);
    if (newFavorites.has(sportId)) {
      newFavorites.delete(sportId);
    } else {
      newFavorites.add(sportId);
    }
    saveFavorites(newFavorites);
  };

  const toggleSportSelection = (sportId: string) => {
    const newSelected = new Set(selectedSports);
    if (newSelected.has(sportId)) {
      newSelected.delete(sportId);
    } else {
      newSelected.add(sportId);
    }
    setSelectedSports(newSelected);
  };

  const toggleExpanded = (sportId: string) => {
    const newExpanded = new Set(expandedSports);
    if (newExpanded.has(sportId)) {
      newExpanded.delete(sportId);
    } else {
      newExpanded.add(sportId);
    }
    setExpandedSports(newExpanded);
  };

  const dismissAlert = (alertId: string) => {
    setAlerts(prev =>
      prev.map(alert => (alert.id === alertId ? { ...alert, dismissed: true } : alert))
    );
  };

  const generateGameName = (sport: string): string => {
    const games = {
      NBA: ['Lakers vs Warriors', 'Celtics vs Heat', 'Nuggets vs Suns'],
      NFL: ['Chiefs vs Bills', 'Cowboys vs Packers', 'Rams vs 49ers'],
      MLB: ['Yankees vs Red Sox', 'Dodgers vs Giants', 'Astros vs Rangers'],
      NHL: ['Rangers vs Bruins', 'Lightning vs Panthers', 'Avalanche vs Stars'],
      Soccer: ['Man City vs Liverpool', 'Barcelona vs Real Madrid', 'PSG vs Bayern'],
      Tennis: ['Djokovic vs Alcaraz', 'Swiatek vs Sabalenka', 'Medvedev vs Tsitsipas'],
      MMA: ['Jones vs Gane', 'Adesanya vs Pereira', 'Usman vs Edwards'],
      PGA: ['Masters Round 1', 'US Open Final', 'PGA Championship'],
      WNBA: ['Aces vs Sky', 'Storm vs Liberty', 'Sun vs Mercury'],
      Esports: ['Liquid vs FaZe', 'G2 vs Cloud9', 'TSM vs Fnatic'],
      Boxing: ['Fury vs Wilder 4', 'Canelo vs Benavidez', 'Joshua vs Fury'],
      Formula1: ['Monaco GP', 'British GP', 'US GP'],
    };
    const sportGames = games[sport as keyof typeof games] || ['Game 1', 'Game 2'];
    return sportGames[Math.floor(Math.random() * sportGames.length)];
  };

  const generateAlertTitle = (sport: string): string => {
    const titles = [
      `High-value opportunity in ${sport}`,
      `Performance alert for ${sport}`,
      `Breaking news in ${sport}`,
      `Injury update affects ${sport} betting`,
      `Weather impact on ${sport} games`,
    ];
    return titles[Math.floor(Math.random() * titles.length)];
  };

  const generateAlertMessage = (sport: string): string => {
    const messages = [
      'Multiple arbitrage opportunities detected with 15%+ ROI',
      'Win rate dropped below 70% threshold in last 48 hours',
      'Major trade/signing affects team odds significantly',
      'Key player injury creates value betting opportunities',
      'Adverse weather conditions may impact outdoor games',
    ];
    return messages[Math.floor(Math.random() * messages.length)];
  };

  const getFilteredSports = () => {
    let filtered = SPORTS_CONFIG;

    // Category filter
    if (selectedCategory !== 'all') {
      if (selectedCategory === 'favorites') {
        filtered = filtered.filter(sport => favorites.has(sport.id));
      } else {
        filtered = getSportsByCategory(selectedCategory as any);
      }
    }

    // Season filter
    if (selectedSeason === 'active') {
      filtered = filtered.filter(sport => sport.season.active);
    } else if (selectedSeason === 'fantasy') {
      filtered = getFantasySports();
    } else if (selectedSeason === 'live') {
      filtered = getLiveBettingSports();
    }

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(
        sport =>
          sport.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          sport.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          sport.leagues.some(league => league.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Sort
    filtered.sort((a, b) => {
      const perfA = performanceData.find(p => p.sportId === a.id);
      const perfB = performanceData.find(p => p.sportId === b.id);

      switch (sortBy) {
        case 'alphabetical':
          return a.name.localeCompare(b.name);
        case 'performance':
          return (perfB?.winRate || 0) - (perfA?.winRate || 0);
        case 'activity':
          return (perfB?.activeBets || 0) - (perfA?.activeBets || 0);
        case 'profit':
          return (perfB?.profit || 0) - (perfA?.profit || 0);
        default:
          return 0;
      }
    });

    return filtered;
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className='w-4 h-4 text-green-400' />;
      case 'down':
        return <TrendingUp className='w-4 h-4 text-red-400 rotate-180' />;
      default:
        return <Activity className='w-4 h-4 text-gray-400' />;
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'opportunity':
        return <Target className='w-4 h-4' />;
      case 'performance':
        return <BarChart3 className='w-4 h-4' />;
      case 'news':
        return <Globe className='w-4 h-4' />;
      case 'injury':
        return <Users className='w-4 h-4' />;
      case 'weather':
        return <Calendar className='w-4 h-4' />;
      default:
        return <AlertCircle className='w-4 h-4' />;
    }
  };

  const getAlertColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'border-red-500/50 bg-red-500/10 text-red-400';
      case 'high':
        return 'border-orange-500/50 bg-orange-500/10 text-orange-400';
      case 'medium':
        return 'border-yellow-500/50 bg-yellow-500/10 text-yellow-400';
      default:
        return 'border-blue-500/50 bg-blue-500/10 text-blue-400';
    }
  };

  const filteredSports = getFilteredSports();
  const activeAlerts = alerts.filter(alert => !alert.dismissed);

  return (
    <Layout
      title='Sports Manager'
      subtitle='Comprehensive Sports Portfolio Management • Performance Analytics'
      headerActions={
        <div className='flex items-center space-x-3'>
          <div className='relative'>
            <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400' />
            <input
              type='text'
              placeholder='Search sports...'
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className='pl-10 pr-4 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white text-sm focus:outline-none focus:border-cyan-400'
            />
          </div>

          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as any)}
            className='px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white text-sm focus:outline-none focus:border-cyan-400'
          >
            <option value='performance'>Performance</option>
            <option value='alphabetical'>Alphabetical</option>
            <option value='activity'>Activity</option>
            <option value='profit'>Profit</option>
          </select>

          <button
            onClick={loadSportsData}
            disabled={isLoading}
            className='flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 rounded-lg text-white font-medium transition-all disabled:opacity-50'
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      }
    >
      {/* Alerts Section */}
      {activeAlerts.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className='mb-8'
        >
          <div className='flex items-center justify-between mb-4'>
            <h3 className='text-lg font-bold text-white'>Active Alerts</h3>
            <span className='text-sm text-gray-400'>{activeAlerts.length} alerts</span>
          </div>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            {activeAlerts.slice(0, 4).map((alert, index) => (
              <motion.div
                key={alert.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`p-4 rounded-lg border ${getAlertColor(alert.severity)}`}
              >
                <div className='flex items-start justify-between mb-2'>
                  <div className='flex items-center space-x-2'>
                    {getAlertIcon(alert.type)}
                    <span className='font-medium'>{alert.title}</span>
                  </div>
                  <button
                    onClick={() => dismissAlert(alert.id)}
                    className='text-gray-400 hover:text-white'
                  >
                    ×
                  </button>
                </div>
                <p className='text-sm opacity-80 mb-2'>{alert.message}</p>
                <div className='flex items-center justify-between text-xs'>
                  <span>
                    {getSportEmoji(alert.sportId)} {getSportDisplayName(alert.sportId)}
                  </span>
                  <span>{alert.timestamp.toLocaleTimeString()}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className='bg-slate-800/50 backdrop-blur-lg border border-slate-700/50 rounded-xl p-6 mb-8'
      >
        <div className='flex flex-wrap items-center gap-4'>
          <div>
            <label className='block text-sm font-medium text-gray-300 mb-2'>Category</label>
            <div className='flex flex-wrap gap-2'>
              {[
                { id: 'all', label: 'All Sports', count: SPORTS_CONFIG.length },
                { id: 'favorites', label: 'Favorites', count: favorites.size },
                ...SPORT_CATEGORIES.filter(cat => cat.id !== 'all'),
              ].map(category => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`px-3 py-2 rounded-lg text-sm transition-all ${
                    selectedCategory === category.id
                      ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50'
                      : 'bg-slate-700/50 text-gray-300 hover:bg-slate-600/50'
                  }`}
                >
                  {category.label} ({category.count})
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className='block text-sm font-medium text-gray-300 mb-2'>Season Status</label>
            <div className='flex flex-wrap gap-2'>
              {SEASON_FILTERS.map(filter => (
                <button
                  key={filter.id}
                  onClick={() => setSelectedSeason(filter.id)}
                  className={`px-3 py-2 rounded-lg text-sm transition-all ${
                    selectedSeason === filter.id
                      ? 'bg-purple-500/20 text-purple-400 border border-purple-500/50'
                      : 'bg-slate-700/50 text-gray-300 hover:bg-slate-600/50'
                  }`}
                >
                  {filter.label} {filter.count && `(${filter.count})`}
                </button>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Sports Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
      >
        {filteredSports.map((sport, index) => {
          const performance = performanceData.find(p => p.sportId === sport.id);
          const sportAlerts = alerts.filter(a => a.sportId === sport.id && !a.dismissed);
          const isExpanded = expandedSports.has(sport.id);
          const isFavorite = favorites.has(sport.id);
          const isSelected = selectedSports.has(sport.id);

          return (
            <motion.div
              key={sport.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 + index * 0.05 }}
              className={`bg-slate-800/50 backdrop-blur-lg border rounded-xl p-6 transition-all cursor-pointer ${
                isSelected
                  ? 'border-cyan-400 bg-cyan-400/10'
                  : 'border-slate-700/50 hover:border-slate-600/50'
              }`}
              onClick={() => toggleSportSelection(sport.id)}
            >
              {/* Header */}
              <div className='flex items-center justify-between mb-4'>
                <div className='flex items-center space-x-3'>
                  <span className='text-3xl'>{sport.emoji}</span>
                  <div>
                    <h3 className='font-bold text-white'>{sport.name}</h3>
                    <p className='text-sm text-gray-400'>{sport.displayName}</p>
                  </div>
                </div>
                <div className='flex items-center space-x-2'>
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      toggleFavorite(sport.id);
                    }}
                    className={`p-1 rounded transition-colors ${
                      isFavorite ? 'text-yellow-400' : 'text-gray-400 hover:text-yellow-400'
                    }`}
                  >
                    <Star className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
                  </button>
                  <div
                    className={`w-3 h-3 rounded-full ${sport.season.active ? 'bg-green-400' : 'bg-gray-400'}`}
                  />
                </div>
              </div>

              {/* Performance Metrics */}
              {performance && (
                <div className='grid grid-cols-2 gap-4 mb-4'>
                  <div>
                    <div className='text-xs text-gray-400'>Win Rate</div>
                    <div className='flex items-center space-x-1'>
                      <span className='text-lg font-bold text-white'>
                        {performance.winRate.toFixed(1)}%
                      </span>
                      {getTrendIcon(performance.trend)}
                    </div>
                  </div>
                  <div>
                    <div className='text-xs text-gray-400'>ROI</div>
                    <div className='text-lg font-bold text-cyan-400'>
                      {performance.roi.toFixed(1)}%
                    </div>
                  </div>
                  <div>
                    <div className='text-xs text-gray-400'>Active Bets</div>
                    <div className='text-lg font-bold text-white'>{performance.activeBets}</div>
                  </div>
                  <div>
                    <div className='text-xs text-gray-400'>Profit</div>
                    <div
                      className={`text-lg font-bold ${performance.profit >= 0 ? 'text-green-400' : 'text-red-400'}`}
                    >
                      ${Math.abs(performance.profit).toFixed(0)}
                    </div>
                  </div>
                </div>
              )}

              {/* Category & Status */}
              <div className='flex items-center justify-between mb-4'>
                <span
                  className={`px-2 py-1 rounded text-xs ${
                    sport.category === 'major'
                      ? 'bg-purple-500/20 text-purple-400'
                      : sport.category === 'emerging'
                        ? 'bg-cyan-500/20 text-cyan-400'
                        : 'bg-green-500/20 text-green-400'
                  }`}
                >
                  {sport.category.toUpperCase()}
                </span>
                {sportAlerts.length > 0 && (
                  <span className='flex items-center space-x-1 text-xs text-orange-400'>
                    <AlertCircle className='w-3 h-3' />
                    <span>{sportAlerts.length} alerts</span>
                  </span>
                )}
              </div>

              {/* Expand/Collapse */}
              <button
                onClick={e => {
                  e.stopPropagation();
                  toggleExpanded(sport.id);
                }}
                className='w-full flex items-center justify-center space-x-2 py-2 bg-slate-700/30 hover:bg-slate-600/30 rounded-lg text-gray-300 text-sm transition-colors'
              >
                <span>{isExpanded ? 'Less Details' : 'More Details'}</span>
                {isExpanded ? (
                  <ChevronUp className='w-4 h-4' />
                ) : (
                  <ChevronDown className='w-4 h-4' />
                )}
              </button>

              {/* Expanded Details */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className='mt-4 space-y-4'
                  >
                    {/* Leagues */}
                    <div>
                      <h4 className='text-sm font-medium text-gray-300 mb-2'>Leagues</h4>
                      <div className='flex flex-wrap gap-1'>
                        {sport.leagues.map(league => (
                          <span
                            key={league}
                            className='px-2 py-1 bg-slate-700/50 text-xs text-gray-300 rounded'
                          >
                            {league}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Popular Markets */}
                    <div>
                      <h4 className='text-sm font-medium text-gray-300 mb-2'>Popular Markets</h4>
                      <div className='flex flex-wrap gap-1'>
                        {sport.popularMarkets.slice(0, 4).map(market => (
                          <span
                            key={market}
                            className='px-2 py-1 bg-slate-700/50 text-xs text-gray-300 rounded'
                          >
                            {market}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Features */}
                    <div className='flex items-center justify-between text-xs'>
                      <div className='flex items-center space-x-3'>
                        <span
                          className={`flex items-center space-x-1 ${sport.fantasyAvailable ? 'text-green-400' : 'text-gray-500'}`}
                        >
                          <Users className='w-3 h-3' />
                          <span>Fantasy</span>
                        </span>
                        <span
                          className={`flex items-center space-x-1 ${sport.liveBettingAvailable ? 'text-blue-400' : 'text-gray-500'}`}
                        >
                          <Zap className='w-3 h-3' />
                          <span>Live</span>
                        </span>
                      </div>
                      <span className='text-gray-400'>
                        Season: {sport.season.start} - {sport.season.end}
                      </span>
                    </div>

                    {/* Top Markets Performance */}
                    {performance && performance.topMarkets.length > 0 && (
                      <div>
                        <h4 className='text-sm font-medium text-gray-300 mb-2'>Top Markets</h4>
                        <div className='space-y-2'>
                          {performance.topMarkets.map(market => (
                            <div
                              key={market.market}
                              className='flex items-center justify-between text-xs'
                            >
                              <span className='text-gray-300'>{market.market}</span>
                              <span className='text-green-400'>{market.winRate.toFixed(1)}%</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </motion.div>

      {filteredSports.length === 0 && (
        <div className='text-center py-12'>
          <Globe className='w-16 h-16 mx-auto mb-4 text-gray-400 opacity-50' />
          <h3 className='text-lg font-medium text-gray-300 mb-2'>No sports found</h3>
          <p className='text-gray-400'>Try adjusting your filters or search query</p>
        </div>
      )}

      {/* Selected Sports Actions */}
      <AnimatePresence>
        {selectedSports.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className='fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-slate-800/90 backdrop-blur-lg border border-slate-700/50 rounded-xl p-4 shadow-2xl'
          >
            <div className='flex items-center space-x-4'>
              <span className='text-white font-medium'>
                {selectedSports.size} sport{selectedSports.size > 1 ? 's' : ''} selected
              </span>
              <div className='flex items-center space-x-2'>
                <button className='px-3 py-2 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 rounded-lg text-sm transition-colors'>
                  Analyze Performance
                </button>
                <button className='px-3 py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 rounded-lg text-sm transition-colors'>
                  Create Portfolio
                </button>
                <button
                  onClick={() => setSelectedSports(new Set())}
                  className='px-3 py-2 bg-gray-500/20 hover:bg-gray-500/30 text-gray-400 rounded-lg text-sm transition-colors'
                >
                  Clear
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Layout>
  );
};

export default SportsManager;
