import { AnimatePresence, motion } from 'framer-motion';
import {
  Activity,
  AlertCircle,
  BarChart3,
  Calendar,
  ChevronDown,
  ChevronUp,
  Globe,
  RefreshCw,
  Search,
  Star,
  Target,
  TrendingUp,
  Users,
  Zap,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import {
  SEASON_FILTERS,
  SPORTS_CONFIG,
  SPORT_CATEGORIES,
  getFantasySports,
  getLiveBettingSports,
  getSportDisplayName,
  getSportEmoji,
  getSportsByCategory,
} from '../../../constants/sports';
// @ts-expect-error TS(6142): Module '../../core/Layout' was resolved to 'C:/Use... Remove this comment to see the full error message
import { Layout } from '../../core/Layout';

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

const _SportsManager: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedSeason, setSelectedSeason] = useState<string>('active');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'alphabetical' | 'performance' | 'activity' | 'profit'>(
    'performance'
  );
  // Removed unused viewMode state
  const [performanceData, setPerformanceData] = useState<SportPerformance[]>([]);
  const [alerts, setAlerts] = useState<SportAlert[]>([]);
  const [selectedSports, setSelectedSports] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [expandedSports, setExpandedSports] = useState<Set<string>>(new Set());
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadSportsData();
    loadFavorites();
    const _interval = setInterval(loadSportsData, 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);

  const _loadSportsData = async () => {
    setIsLoading(true);
    try {
      // Generate comprehensive performance data for all sports
      const _mockPerformance: SportPerformance[] = SPORTS_CONFIG.map(sport => {
        const _winRate = 60 + Math.random() * 35;
        const _roi = 5 + Math.random() * 45;
        const _totalBets = Math.floor(Math.random() * 500) + 50;
        const _activeBets = Math.floor(Math.random() * 50) + 5;
        const _profit = (Math.random() - 0.2) * 10000;

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
      const _mockAlerts: SportAlert[] = SPORTS_CONFIG.slice(0, 8).map((sport, index) => ({
        id: `alert-${sport.id}-${index}`,
        sportId: sport.id,
        type: ['opportunity', 'performance', 'news', 'injury', 'weather'][
          Math.floor(Math.random() * 5)
        ] as unknown,
        title: generateAlertTitle(sport.id),
        message: generateAlertMessage(),
        severity: ['low', 'medium', 'high', 'critical'][Math.floor(Math.random() * 4)] as unknown,
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

  const _loadFavorites = () => {
    const _saved = localStorage.getItem('a1betting-favorite-sports');
    if (saved) {
      setFavorites(new Set(JSON.parse(saved)));
    }
  };

  const _saveFavorites = (newFavorites: Set<string>) => {
    setFavorites(newFavorites);
    localStorage.setItem('a1betting-favorite-sports', JSON.stringify(Array.from(newFavorites)));
  };

  const _toggleFavorite = (sportId: string) => {
    const _newFavorites = new Set(favorites);
    if (newFavorites.has(sportId)) {
      newFavorites.delete(sportId);
    } else {
      newFavorites.add(sportId);
    }
    saveFavorites(newFavorites);
  };

  const _toggleSportSelection = (sportId: string) => {
    const _newSelected = new Set(selectedSports);
    if (newSelected.has(sportId)) {
      newSelected.delete(sportId);
    } else {
      newSelected.add(sportId);
    }
    setSelectedSports(newSelected);
  };

  const _toggleExpanded = (sportId: string) => {
    const _newExpanded = new Set(expandedSports);
    if (newExpanded.has(sportId)) {
      newExpanded.delete(sportId);
    } else {
      newExpanded.add(sportId);
    }
    setExpandedSports(newExpanded);
  };

  const _dismissAlert = (alertId: string) => {
    setAlerts(prev =>
      prev.map(alert => (alert.id === alertId ? { ...alert, dismissed: true } : alert))
    );
  };

  const _generateGameName = (sport: string): string => {
    const _games = {
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
    const _sportGames = games[sport as keyof typeof games] || ['Game 1', 'Game 2'];
    return sportGames[Math.floor(Math.random() * sportGames.length)];
  };

  const _generateAlertTitle = (sport: string): string => {
    const _titles = [
      `High-value opportunity in ${sport}`,
      `Performance alert for ${sport}`,
      `Breaking news in ${sport}`,
      `Injury update affects ${sport} betting`,
      `Weather impact on ${sport} games`,
    ];
    return titles[Math.floor(Math.random() * titles.length)];
  };

  const _generateAlertMessage = (): string => {
    const _messages = [
      'Multiple arbitrage opportunities detected with 15%+ ROI',
      'Win rate dropped below 70% threshold in last 48 hours',
      'Major trade/signing affects team odds significantly',
      'Key player injury creates value betting opportunities',
      'Adverse weather conditions may impact outdoor games',
    ];
    return messages[Math.floor(Math.random() * messages.length)];
  };

  const _getFilteredSports = () => {
    const _filtered = SPORTS_CONFIG;

    // Category filter
    if (selectedCategory !== 'all') {
      if (selectedCategory === 'favorites') {
        filtered = filtered.filter(sport => favorites.has(sport.id));
      } else {
        filtered = getSportsByCategory(selectedCategory as unknown);
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
      const _perfA = performanceData.find(p => p.sportId === a.id);
      const _perfB = performanceData.find(p => p.sportId === b.id);

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

  const _getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        return <TrendingUp className='w-4 h-4 text-green-400' />;
      case 'down':
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        return <TrendingUp className='w-4 h-4 text-red-400 rotate-180' />;
      default:
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        return <Activity className='w-4 h-4 text-gray-400' />;
    }
  };

  const _getAlertIcon = (type: string) => {
    switch (type) {
      case 'opportunity':
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        return <Target className='w-4 h-4' />;
      case 'performance':
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        return <BarChart3 className='w-4 h-4' />;
      case 'news':
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        return <Globe className='w-4 h-4' />;
      case 'injury':
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        return <Users className='w-4 h-4' />;
      case 'weather':
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        return <Calendar className='w-4 h-4' />;
      default:
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        return <AlertCircle className='w-4 h-4' />;
    }
  };

  const _getAlertColor = (severity: string) => {
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

  const _filteredSports = getFilteredSports();
  const _activeAlerts = alerts.filter(alert => !alert.dismissed);

  return (
    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <Layout
      title='Sports Manager'
      subtitle='Comprehensive Sports Portfolio Management • Performance Analytics'
      headerActions={
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <div className='flex items-center space-x-3'>
          {/* Visually hidden label for search input */}
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <label htmlFor='sportsmanager-search-input' className='sr-only'>
            Search sports
          </label>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div className='relative'>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400' />
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <input
              id='sportsmanager-search-input'
              type='text'
              placeholder='Search sports...'
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className='pl-10 pr-4 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white text-sm focus:outline-none focus:border-cyan-400'
            />
          </div>

          {/* Visually hidden label for sort select */}
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <label htmlFor='sportsmanager-sort-select' className='sr-only'>
            Sort sports by
          </label>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <select
            id='sportsmanager-sort-select'
            value={sortBy}
            onChange={e => setSortBy(e.target.value as unknown)}
            className='px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white text-sm focus:outline-none focus:border-cyan-400'
          >
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <option value='performance'>Performance</option>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <option value='alphabetical'>Alphabetical</option>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <option value='activity'>Activity</option>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <option value='profit'>Profit</option>
          </select>

          {/* Visually hidden label for refresh button */}
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <label htmlFor='sportsmanager-refresh-btn' className='sr-only'>
            Refresh sports data
          </label>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <button
            id='sportsmanager-refresh-btn'
            onClick={loadSportsData}
            disabled={isLoading}
            className='flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 rounded-lg text-white font-medium transition-all disabled:opacity-50'
          >
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <span>Refresh</span>
          </button>
        </div>
      }
    >
      {/* Alerts Section */}
      {activeAlerts.length > 0 && (
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className='mb-8'
        >
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div className='flex items-center justify-between mb-4'>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <h3 className='text-lg font-bold text-white'>Active Alerts</h3>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <span className='text-sm text-gray-400'>{activeAlerts.length} alerts</span>
          </div>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            {activeAlerts.slice(0, 4).map((alert, index) => (
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <motion.div
                key={alert.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`p-4 rounded-lg border ${getAlertColor(alert.severity)}`}
              >
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <div className='flex items-start justify-between mb-2'>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <div className='flex items-center space-x-2'>
                    {getAlertIcon(alert.type)}
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <span className='font-medium'>{alert.title}</span>
                  </div>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <button
                    onClick={() => dismissAlert(alert.id)}
                    className='text-gray-400 hover:text-white'
                  >
                    ×
                  </button>
                </div>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <p className='text-sm opacity-80 mb-2'>{alert.message}</p>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <div className='flex items-center justify-between text-xs'>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <span>
                    {getSportEmoji(alert.sportId)} {getSportDisplayName(alert.sportId)}
                  </span>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <span>{alert.timestamp.toLocaleTimeString()}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Filters */}
      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className='bg-slate-800/50 backdrop-blur-lg border border-slate-700/50 rounded-xl p-6 mb-8'
      >
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <div className='flex flex-wrap items-center gap-4'>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <label className='block text-sm font-medium text-gray-300 mb-2'>Category</label>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div className='flex flex-wrap gap-2'>
              {[
                { id: 'all', label: 'All Sports', count: SPORTS_CONFIG.length },
                { id: 'favorites', label: 'Favorites', count: favorites.size },
                ...SPORT_CATEGORIES.filter(cat => cat.id !== 'all'),
              ].map(category => (
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
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

          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <label className='block text-sm font-medium text-gray-300 mb-2'>Season Status</label>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div className='flex flex-wrap gap-2'>
              {SEASON_FILTERS.map(filter => (
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
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
      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
      >
        {filteredSports.map((sport, index) => {
          const _performance = performanceData.find(p => p.sportId === sport.id);
          const _sportAlerts = alerts.filter(a => a.sportId === sport.id && !a.dismissed);
          const _isExpanded = expandedSports.has(sport.id);
          const _isFavorite = favorites.has(sport.id);
          const _isSelected = selectedSports.has(sport.id);

          return (
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
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
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <div className='flex items-center justify-between mb-4'>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <div className='flex items-center space-x-3'>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <span className='text-3xl'>{sport.emoji}</span>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <div>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <h3 className='font-bold text-white'>{sport.name}</h3>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <p className='text-sm text-gray-400'>{sport.displayName}</p>
                  </div>
                </div>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <div className='flex items-center space-x-2'>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      toggleFavorite(sport.id);
                    }}
                    className={`p-1 rounded transition-colors ${
                      isFavorite ? 'text-yellow-400' : 'text-gray-400 hover:text-yellow-400'
                    }`}
                  >
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <Star className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
                  </button>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <div
                    className={`w-3 h-3 rounded-full ${
                      sport.season.active ? 'bg-green-400' : 'bg-gray-400'
                    }`}
                  />
                </div>
              </div>

              {/* Performance Metrics */}
              {performance && (
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <div className='grid grid-cols-2 gap-4 mb-4'>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <div>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <div className='text-xs text-gray-400'>Win Rate</div>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <div className='flex items-center space-x-1'>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <span className='text-lg font-bold text-white'>
                        {performance.winRate.toFixed(1)}%
                      </span>
                      {getTrendIcon(performance.trend)}
                    </div>
                  </div>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <div>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <div className='text-xs text-gray-400'>ROI</div>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <div className='text-lg font-bold text-cyan-400'>
                      {performance.roi.toFixed(1)}%
                    </div>
                  </div>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <div>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <div className='text-xs text-gray-400'>Active Bets</div>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <div className='text-lg font-bold text-white'>{performance.activeBets}</div>
                  </div>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <div>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <div className='text-xs text-gray-400'>Profit</div>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <div
                      className={`text-lg font-bold ${
                        performance.profit >= 0 ? 'text-green-400' : 'text-red-400'
                      }`}
                    >
                      ${Math.abs(performance.profit).toFixed(0)}
                    </div>
                  </div>
                </div>
              )}

              {/* Category & Status */}
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <div className='flex items-center justify-between mb-4'>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
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
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <span className='flex items-center space-x-1 text-xs text-orange-400'>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <AlertCircle className='w-3 h-3' />
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <span>{sportAlerts.length} alerts</span>
                  </span>
                )}
              </div>

              {/* Expand/Collapse */}
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <button
                onClick={e => {
                  e.stopPropagation();
                  toggleExpanded(sport.id);
                }}
                className='w-full flex items-center justify-center space-x-2 py-2 bg-slate-700/30 hover:bg-slate-600/30 rounded-lg text-gray-300 text-sm transition-colors'
              >
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <span>{isExpanded ? 'Less Details' : 'More Details'}</span>
                {isExpanded ? (
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <ChevronUp className='w-4 h-4' />
                ) : (
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <ChevronDown className='w-4 h-4' />
                )}
              </button>

              {/* Expanded Details */}
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <AnimatePresence>
                {isExpanded && (
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className='mt-4 space-y-4'
                  >
                    {/* Leagues */}
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <div>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <h4 className='text-sm font-medium text-gray-300 mb-2'>Leagues</h4>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <div className='flex flex-wrap gap-1'>
                        {sport.leagues.map(league => (
                          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
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
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <div>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <h4 className='text-sm font-medium text-gray-300 mb-2'>Popular Markets</h4>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <div className='flex flex-wrap gap-1'>
                        {sport.popularMarkets.slice(0, 4).map(market => (
                          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
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
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <div className='flex items-center justify-between text-xs'>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <div className='flex items-center space-x-3'>
                        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                        <span
                          className={`flex items-center space-x-1 ${
                            sport.fantasyAvailable ? 'text-green-400' : 'text-gray-500'
                          }`}
                        >
                          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                          <Users className='w-3 h-3' />
                          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                          <span>Fantasy</span>
                        </span>
                        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                        <span
                          className={`flex items-center space-x-1 ${
                            sport.liveBettingAvailable ? 'text-blue-400' : 'text-gray-500'
                          }`}
                        >
                          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                          <Zap className='w-3 h-3' />
                          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                          <span>Live</span>
                        </span>
                      </div>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <span className='text-gray-400'>
                        Season: {sport.season.start} - {sport.season.end}
                      </span>
                    </div>

                    {/* Top Markets Performance */}
                    {performance && performance.topMarkets.length > 0 && (
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <div>
                        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                        <h4 className='text-sm font-medium text-gray-300 mb-2'>Top Markets</h4>
                        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                        <div className='space-y-2'>
                          {performance.topMarkets.map(market => (
                            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                            <div
                              key={market.market}
                              className='flex items-center justify-between text-xs'
                            >
                              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                              <span className='text-gray-300'>{market.market}</span>
                              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
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
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <div className='text-center py-12'>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <Globe className='w-16 h-16 mx-auto mb-4 text-gray-400 opacity-50' />
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <h3 className='text-lg font-medium text-gray-300 mb-2'>No sports found</h3>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <p className='text-gray-400'>Try adjusting your filters or search query</p>
        </div>
      )}

      {/* Selected Sports Actions */}
      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <AnimatePresence>
        {selectedSports.size > 0 && (
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className='fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-slate-800/90 backdrop-blur-lg border border-slate-700/50 rounded-xl p-4 shadow-2xl'
          >
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div className='flex items-center space-x-4'>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <span className='text-white font-medium'>
                {selectedSports.size} sport{selectedSports.size > 1 ? 's' : ''} selected
              </span>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <div className='flex items-center space-x-2'>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <button className='px-3 py-2 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 rounded-lg text-sm transition-colors'>
                  Analyze Performance
                </button>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <button className='px-3 py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 rounded-lg text-sm transition-colors'>
                  Create Portfolio
                </button>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
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
