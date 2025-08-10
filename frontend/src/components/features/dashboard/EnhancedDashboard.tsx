import { motion } from 'framer-motion';
import {
  Activity,
  Brain,
  ChevronDown,
  ChevronUp,
  Clock,
  Cpu,
  DollarSign,
  Globe,
  RefreshCw,
  Target,
  TrendingDown,
  TrendingUp,
  Trophy,
  Zap,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { SPORTS_CONFIG, getActiveSports, getSportColor } from '../../../constants/sports';
// @ts-expect-error TS(6142): Module '../../core/AdvancedFilters' was resolved t... Remove this comment to see the full error message
import AdvancedFilters, { FilterState } from '../../core/AdvancedFilters';
// @ts-expect-error TS(6142): Module '../../core/Layout' was resolved to 'C:/Use... Remove this comment to see the full error message
import { Layout } from '../../core/Layout';

interface MetricCard {
  id: string;
  title: string;
  value: string;
  change: string;
  changeType: 'positive' | 'negative' | 'neutral';
  icon: React.ReactNode;
  description: string;
  gradient: string;
  sport?: string;
}

interface LiveOpportunity {
  id: string;
  game: string;
  sport: string;
  type: string;
  confidence: number;
  roi: number;
  stake: number;
  expectedProfit: number;
  status: 'active' | 'pending' | 'won' | 'lost';
  gameTime: Date;
  tags: string[];
}

interface SportMetrics {
  id: string;
  name: string;
  emoji: string;
  activeBets: number;
  totalBets: number;
  winRate: number;
  roi: number;
  profit: number;
  trend: 'up' | 'down' | 'stable';
  isActive: boolean;
}

const _EnhancedDashboard: React.FC = () => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [liveOpportunities, setLiveOpportunities] = useState<LiveOpportunity[]>([]);
  const [sportMetrics, setSportMetrics] = useState<SportMetrics[]>([]);
  const [selectedTimeframe, setSelectedTimeframe] = useState<'1d' | '7d' | '30d' | '90d'>('7d');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    sports: [],
    categories: [],
    seasons: ['active'],
    dateRange: { start: null, end: null },
    markets: [],
    minOdds: null,
    maxOdds: null,
    minValue: null,
    maxValue: null,
    search: '',
    favoriteOnly: false,
    liveOnly: false,
    fantasyOnly: false,
    sortBy: 'value',
    sortOrder: 'desc',
    tags: [],
  });

  useEffect(() => {
    loadDashboardData();
    const _interval = setInterval(loadDashboardData, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, [selectedTimeframe, filters]);

  const _loadDashboardData = async () => {
    setIsRefreshing(true);
    try {
      // Generate comprehensive sport metrics
      const _mockSportMetrics: SportMetrics[] = SPORTS_CONFIG.map(sport => ({
        id: sport.id,
        name: sport.name,
        emoji: sport.emoji,
        activeBets: Math.floor(Math.random() * 20) + 1,
        totalBets: Math.floor(Math.random() * 100) + 10,
        winRate: 65 + Math.random() * 30,
        roi: 10 + Math.random() * 40,
        profit: (Math.random() - 0.3) * 5000,
        trend: Math.random() > 0.6 ? 'up' : Math.random() > 0.3 ? 'stable' : 'down',
        isActive: sport.season.active,
      }));

      // Generate live opportunities for all sports
      // @ts-expect-error TS(2322): Type '{ id: string; game: string; sport: string; t... Remove this comment to see the full error message
      const _mockOpportunities: LiveOpportunity[] = SPORTS_CONFIG.flatMap(sport =>
        Array.from({ length: Math.floor(Math.random() * 3) + 1 }, (_, i) => ({
          id: `${sport.id}-opp-${i}`,
          game: generateGameName(sport.id),
          sport: sport.id,
          type: sport.popularMarkets[Math.floor(Math.random() * sport.popularMarkets.length)],
          confidence: 80 + Math.random() * 15,
          roi: 10 + Math.random() * 30,
          stake: Math.floor(Math.random() * 3000 + 500),
          expectedProfit: Math.floor(Math.random() * 800 + 100),
          status: Math.random() > 0.7 ? 'active' : 'pending',
          gameTime: new Date(Date.now() + Math.random() * 24 * 60 * 60 * 1000),
          tags: generateTags(sport.id),
        }))
      ).slice(0, 15);

      setSportMetrics(mockSportMetrics);
      setLiveOpportunities(mockOpportunities);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const _generateGameName = (sport: string): string => {
    const _teamNames: { [key: string]: string[] } = {
      NBA: ['Lakers', 'Warriors', 'Celtics', 'Heat', 'Nuggets', 'Suns', 'Nets', 'Bucks'],
      NFL: ['Chiefs', 'Bills', 'Cowboys', 'Packers', 'Rams', 'Patriots', '49ers', 'Ravens'],
      MLB: ['Yankees', 'Dodgers', 'Red Sox', 'Giants', 'Cubs', 'Cardinals', 'Astros', 'Braves'],
      NHL: ['Rangers', 'Bruins', 'Lightning', 'Avalanche', 'Kings', 'Oilers', 'Panthers', 'Stars'],
      Soccer: [
        'Man City',
        'Liverpool',
        'Barcelona',
        'Real Madrid',
        'PSG',
        'Bayern',
        'Arsenal',
        'Chelsea',
      ],
      Tennis: ['Djokovic', 'Nadal', 'Alcaraz', 'Medvedev', 'Tsitsipas', 'Rublev', 'Zverev', 'Ruud'],
      MMA: ['Jones vs Gane', 'Adesanya vs Pereira', 'Usman vs Edwards', 'Oliveira vs Makhachev'],
      PGA: [
        'Masters Tournament',
        'US Open',
        'The Open',
        'PGA Championship',
        'Players Championship',
      ],
      WNBA: ['Aces', 'Sky', 'Storm', 'Liberty', 'Sun', 'Mercury', 'Fever', 'Wings'],
      Esports: ['Team Liquid', 'FaZe Clan', 'G2 Esports', 'Cloud9', 'TSM', 'Fnatic', 'NaVi'],
      Boxing: ['Fury vs Wilder', 'Canelo vs GGG', 'Joshua vs Usyk', 'Davis vs Garcia'],
      Formula1: ['Monaco GP', 'British GP', 'Italian GP', 'US GP', 'Abu Dhabi GP'],
    };

    const _teams = teamNames[sport] || ['Team A', 'Team B'];
    if (sport === 'Tennis' || sport === 'MMA' || sport === 'Boxing') {
      return teams[Math.floor(Math.random() * teams.length)];
    }
    if (sport === 'PGA' || sport === 'Formula1') {
      return teams[Math.floor(Math.random() * teams.length)];
    }

    const _team1 = teams[Math.floor(Math.random() * teams.length)];
    const _team2 = teams[Math.floor(Math.random() * teams.length)];
    while (team2 === team1) {
      team2 = teams[Math.floor(Math.random() * teams.length)];
    }
    return `${team1} vs ${team2}`;
  };

  const _generateTags = (sport: string): string[] => {
    const _allTags = [
      'High Value',
      'Live Betting',
      'Prime Time',
      'Rivalry',
      'Sharp Money',
      'Weather Game',
    ];
    return allTags.slice(0, Math.floor(Math.random() * 3) + 1);
  };

  const _getOverallMetrics = () => {
    const _totalActiveBets = sportMetrics.reduce((sum, sport) => sum + sport.activeBets, 0);
    const _totalBets = sportMetrics.reduce((sum, sport) => sum + sport.totalBets, 0);
    const _averageWinRate =
      sportMetrics.reduce((sum, sport) => sum + sport.winRate, 0) / sportMetrics.length;
    const _totalProfit = sportMetrics.reduce((sum, sport) => sum + sport.profit, 0);
    const _averageROI =
      sportMetrics.reduce((sum, sport) => sum + sport.roi, 0) / sportMetrics.length;

    return {
      totalActiveBets,
      totalBets,
      averageWinRate,
      totalProfit,
      averageROI,
    };
  };

  const _filteredOpportunities = liveOpportunities.filter(opp => {
    if (filters.sports.length > 0 && !filters.sports.includes(opp.sport)) return false;
    if (
      filters.search &&
      !opp.game.toLowerCase().includes(filters.search.toLowerCase()) &&
      !opp.type.toLowerCase().includes(filters.search.toLowerCase())
    )
      return false;
    if (filters.liveOnly && opp.status !== 'active') return false;
    if (filters.minValue && opp.roi < filters.minValue) return false;
    if (filters.maxValue && opp.roi > filters.maxValue) return false;
    return true;
  });

  const _filteredSportMetrics = sportMetrics.filter(sport => {
    if (filters.sports.length > 0 && !filters.sports.includes(sport.id)) return false;
    if (filters.seasons.includes('active') && !sport.isActive) return false;
    return true;
  });

  const _overall = getOverallMetrics();

  const _keyMetrics: MetricCard[] = [
    {
      id: 'win-rate',
      title: 'Overall Win Rate',
      value: `${overall.averageWinRate.toFixed(1)}%`,
      change: '+2.3%',
      changeType: 'positive',
      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      icon: <Trophy className='w-6 h-6' />,
      description: 'Across all sports',
      gradient: 'from-green-400 to-green-600',
    },
    {
      id: 'total-profit',
      title: 'Total Profit',
      value: `$${overall.totalProfit.toLocaleString()}`,
      change: `${overall.totalProfit >= 0 ? '+' : ''}$${Math.abs(overall.totalProfit * 0.1).toFixed(
        0
      )}`,
      changeType: overall.totalProfit >= 0 ? 'positive' : 'negative',
      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      icon: <DollarSign className='w-6 h-6' />,
      description: 'Realized profits',
      gradient: 'from-purple-400 to-purple-600',
    },
    {
      id: 'active-opportunities',
      title: 'Live Opportunities',
      value: filteredOpportunities.filter(o => o.status === 'active').length.toString(),
      change: '+7',
      changeType: 'positive',
      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      icon: <Zap className='w-6 h-6' />,
      description: 'Active right now',
      gradient: 'from-yellow-400 to-yellow-600',
    },
    {
      id: 'roi',
      title: 'Average ROI',
      value: `${overall.averageROI.toFixed(1)}%`,
      change: '+12%',
      changeType: 'positive',
      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      icon: <TrendingUp className='w-6 h-6' />,
      description: 'Return on investment',
      gradient: 'from-pink-400 to-pink-600',
    },
    {
      id: 'active-sports',
      title: 'Active Sports',
      value: getActiveSports().length.toString(),
      change: `${SPORTS_CONFIG.length} total`,
      changeType: 'neutral',
      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      icon: <Globe className='w-6 h-6' />,
      description: 'Sports in season',
      gradient: 'from-cyan-400 to-cyan-600',
    },
    {
      id: 'total-bets',
      title: 'Total Bets',
      value: overall.totalBets.toString(),
      change: `${overall.totalActiveBets} active`,
      changeType: 'positive',
      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      icon: <Target className='w-6 h-6' />,
      description: 'All time',
      gradient: 'from-indigo-400 to-indigo-600',
    },
  ];

  const _getTrendIcon = (trend: string) => {
    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    if (trend === 'up') return <TrendingUp className='w-4 h-4 text-green-400' />;
    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    if (trend === 'down') return <TrendingDown className='w-4 h-4 text-red-400' />;
    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    return <Activity className='w-4 h-4 text-gray-400' />;
  };

  return (
    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <Layout
      title='Command Center'
      subtitle='Multi-Sport Platform Overview & Performance Metrics'
      headerActions={
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <div className='flex items-center space-x-3'>
          {/* Visually hidden label for timeframe select */}
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <label htmlFor='dashboard-timeframe-select' className='sr-only'>
            Select timeframe
          </label>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <select
            id='dashboard-timeframe-select'
            value={selectedTimeframe}
            onChange={e => setSelectedTimeframe(e.target.value as unknown)}
            className='px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white text-sm focus:outline-none focus:border-cyan-400'
          >
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <option value='1d'>1 Day</option>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <option value='7d'>7 Days</option>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <option value='30d'>30 Days</option>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <option value='90d'>90 Days</option>
          </select>
          {/* Visually hidden label for refresh button */}
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <label htmlFor='dashboard-refresh-btn' className='sr-only'>
            Refresh dashboard data
          </label>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <button
            id='dashboard-refresh-btn'
            onClick={loadDashboardData}
            disabled={isRefreshing}
            className='flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 rounded-lg text-white font-medium transition-all disabled:opacity-50'
          >
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <span>Refresh</span>
          </button>
        </div>
      }
    >
      {/* Advanced Filters */}
      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <AdvancedFilters
        filters={filters}
        onFiltersChange={setFilters}
        isOpen={filtersOpen}
        onToggle={() => setFiltersOpen(!filtersOpen)}
        resultCount={filteredOpportunities.length}
        isLoading={isRefreshing}
      />

      {/* Key Metrics Grid */}
      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
        {keyMetrics.map((metric, index) => (
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <motion.div
            key={metric.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className='group relative overflow-hidden'
          >
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div className='bg-slate-800/50 backdrop-blur-lg border border-slate-700/50 rounded-xl p-6 hover:border-slate-600/50 transition-all'>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <div
                className={`absolute inset-0 bg-gradient-to-br ${metric.gradient} opacity-5 group-hover:opacity-10 transition-opacity`}
              />
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <div className='relative flex items-start justify-between'>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <div className='flex-1'>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <p className='text-gray-400 text-sm font-medium'>{metric.title}</p>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <p className='text-2xl font-bold text-white mt-1'>{metric.value}</p>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <div className='flex items-center space-x-1 mt-2'>
                    {metric.changeType === 'positive' && (
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <ChevronUp className='w-4 h-4 text-green-400' />
                    )}
                    {metric.changeType === 'negative' && (
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <ChevronDown className='w-4 h-4 text-red-400' />
                    )}
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <span
                      className={`text-sm font-medium ${
                        metric.changeType === 'positive'
                          ? 'text-green-400'
                          : metric.changeType === 'negative'
                          ? 'text-red-400'
                          : 'text-gray-400'
                      }`}
                    >
                      {metric.change}
                    </span>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <span className='text-xs text-gray-500'>{selectedTimeframe}</span>
                  </div>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <p className='text-xs text-gray-500 mt-1'>{metric.description}</p>
                </div>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <div
                  className={`p-3 rounded-lg bg-gradient-to-br ${metric.gradient} bg-opacity-20`}
                >
                  {metric.icon}
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Sports Overview Grid */}
      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className='bg-slate-800/50 backdrop-blur-lg border border-slate-700/50 rounded-xl p-6'
      >
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <div className='flex items-center justify-between mb-6'>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <h3 className='text-xl font-bold text-white'>Sports Performance</h3>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <p className='text-gray-400 text-sm'>Performance metrics across all sports</p>
          </div>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div className='flex items-center space-x-2'>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <Globe className='w-5 h-5 text-cyan-400' />
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <span className='text-cyan-400 text-sm font-medium'>
              {filteredSportMetrics.length} Sports
            </span>
          </div>
        </div>

        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'>
          {filteredSportMetrics.map((sport, index) => {
            const _sportColor = getSportColor(sport.id);
            return (
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <motion.div
                key={sport.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 + index * 0.05 }}
                className='p-4 bg-slate-900/50 rounded-lg border border-slate-700/50 hover:border-slate-600/50 transition-all cursor-pointer'
                onClick={() => {
                  const _newSports = filters.sports.includes(sport.id)
                    ? filters.sports.filter(s => s !== sport.id)
                    : [...filters.sports, sport.id];
                  setFilters(prev => ({ ...prev, sports: newSports }));
                }}
              >
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <div className='flex items-center justify-between mb-3'>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <div className='flex items-center space-x-2'>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <span className='text-2xl'>{sport.emoji}</span>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <h4 className='font-medium text-white'>{sport.name}</h4>
                  </div>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <div className='flex items-center space-x-2'>
                    {getTrendIcon(sport.trend)}
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <div
                      className={`w-3 h-3 rounded-full ${
                        sport.isActive ? 'bg-green-400' : 'bg-gray-400'
                      }`}
                    />
                  </div>
                </div>

                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <div className='grid grid-cols-2 gap-2 text-sm'>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <div>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <div className='text-gray-400'>Win Rate</div>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <div className='text-white font-bold'>{sport.winRate.toFixed(1)}%</div>
                  </div>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <div>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <div className='text-gray-400'>ROI</div>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <div className='text-cyan-400 font-bold'>{sport.roi.toFixed(1)}%</div>
                  </div>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <div>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <div className='text-gray-400'>Active</div>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <div className='text-white font-bold'>{sport.activeBets}</div>
                  </div>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <div>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <div className='text-gray-400'>Profit</div>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <div
                      className={`font-bold ${
                        sport.profit >= 0 ? 'text-green-400' : 'text-red-400'
                      }`}
                    >
                      ${Math.abs(sport.profit).toFixed(0)}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* Live Opportunities & Recent Activity */}
      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        {/* Live Opportunities */}
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className='bg-slate-800/50 backdrop-blur-lg border border-slate-700/50 rounded-xl p-6'
        >
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div className='flex items-center justify-between mb-6'>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <h3 className='text-xl font-bold text-white'>Live Opportunities</h3>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <p className='text-gray-400 text-sm'>Real-time betting recommendations</p>
            </div>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div className='flex items-center space-x-2'>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <div className='w-3 h-3 bg-green-400 rounded-full animate-pulse'></div>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <span className='text-green-400 text-sm font-medium'>
                {filteredOpportunities.filter(o => o.status === 'active').length} Live
              </span>
            </div>
          </div>

          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div className='space-y-4 max-h-96 overflow-y-auto'>
            {filteredOpportunities.slice(0, 8).map((opportunity, index) => {
              const _sportConfig = SPORTS_CONFIG.find(s => s.id === opportunity.sport);
              return (
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <motion.div
                  key={opportunity.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                  className='bg-slate-900/30 border border-slate-700/30 rounded-lg p-4 hover:border-cyan-500/30 transition-all'
                >
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <div className='flex items-center justify-between mb-2'>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <div className='flex items-center space-x-2'>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <span className='text-lg'>{sportConfig?.emoji}</span>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <div className='font-medium text-white'>{opportunity.game}</div>
                    </div>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <div className='text-cyan-400 font-bold'>
                      +{opportunity.roi.toFixed(1)}% ROI
                    </div>
                  </div>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <div className='text-sm text-gray-300 mb-2'>{opportunity.type}</div>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <div className='flex items-center justify-between text-sm mb-2'>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <span className='text-gray-400'>
                      Stake: ${opportunity.stake.toLocaleString()} • Profit: +$
                      {opportunity.expectedProfit}
                    </span>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <span className='text-green-400 font-medium'>
                      {opportunity.confidence.toFixed(1)}% confidence
                    </span>
                  </div>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <div className='flex items-center justify-between'>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <div className='flex flex-wrap gap-1'>
                      {opportunity.tags.slice(0, 2).map(tag => (
                        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                        <span
                          key={tag}
                          className='px-2 py-1 bg-slate-700/50 text-xs text-gray-300 rounded'
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        opportunity.status === 'active'
                          ? 'bg-green-500/20 text-green-400'
                          : opportunity.status === 'pending'
                          ? 'bg-yellow-500/20 text-yellow-400'
                          : 'bg-gray-500/20 text-gray-400'
                      }`}
                    >
                      {opportunity.status.toUpperCase()}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* ML Model Performance */}
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
          className='bg-slate-800/50 backdrop-blur-lg border border-slate-700/50 rounded-xl p-6'
        >
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div className='flex items-center justify-between mb-6'>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <h3 className='text-xl font-bold text-white'>ML Model Performance</h3>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <p className='text-gray-400 text-sm'>47+ active machine learning models</p>
            </div>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div className='flex items-center space-x-2'>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <Cpu className='w-5 h-5 text-purple-400' />
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <span className='text-purple-400 text-sm font-medium'>Ensemble</span>
            </div>
          </div>

          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div className='space-y-4'>
            {[
              {
                name: 'XGBoost Ensemble',
                accuracy: '97.2%',
                status: 'active',
                weight: '35%',
                sport: 'Multi-Sport',
              },
              {
                name: 'Neural Network',
                accuracy: '96.8%',
                status: 'active',
                weight: '30%',
                sport: 'NBA/NFL',
              },
              {
                name: 'LSTM Predictor',
                accuracy: '95.1%',
                status: 'active',
                weight: '20%',
                sport: 'Soccer/Tennis',
              },
              {
                name: 'Random Forest',
                accuracy: '94.6%',
                status: 'active',
                weight: '15%',
                sport: 'MMA/Boxing',
              },
              {
                name: 'Quantum Enhanced',
                accuracy: '98.1%',
                status: 'beta',
                weight: '5%',
                sport: 'Experimental',
              },
            ].map((model, index) => (
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <motion.div
                key={model.name}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 + index * 0.1 }}
                className='bg-slate-900/30 border border-slate-700/30 rounded-lg p-4'
              >
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <div className='flex items-center justify-between mb-2'>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <div className='font-medium text-white'>{model.name}</div>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <div className='flex items-center space-x-2'>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <span className='text-green-400 text-sm font-medium'>{model.accuracy}</span>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <div
                      className={`w-2 h-2 rounded-full ${
                        model.status === 'active' ? 'bg-green-400' : 'bg-yellow-400'
                      }`}
                    ></div>
                  </div>
                </div>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <div className='flex items-center justify-between text-sm'>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <span className='text-gray-400'>
                    Weight: {model.weight} • {model.sport}
                  </span>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <span
                    className={`text-sm ${
                      model.status === 'active' ? 'text-purple-400' : 'text-yellow-400'
                    }`}
                  >
                    {model.status.toUpperCase()}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* System Status & Quick Stats */}
      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className='bg-slate-800/50 backdrop-blur-lg border border-slate-700/50 rounded-xl p-6'
      >
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <h3 className='text-xl font-bold text-white mb-6'>System Status & Performance</h3>
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div className='text-center'>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div className='w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-3'>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <Activity className='w-8 h-8 text-green-400' />
            </div>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div className='text-2xl font-bold text-green-400'>99.9%</div>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div className='text-sm text-gray-400'>System Uptime</div>
          </div>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div className='text-center'>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div className='w-16 h-16 bg-cyan-500/20 rounded-full flex items-center justify-center mx-auto mb-3'>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <Clock className='w-8 h-8 text-cyan-400' />
            </div>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div className='text-2xl font-bold text-cyan-400'>1.2s</div>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div className='text-sm text-gray-400'>Avg Response Time</div>
          </div>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div className='text-center'>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div className='w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-3'>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <Brain className='w-8 h-8 text-purple-400' />
            </div>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div className='text-2xl font-bold text-purple-400'>47</div>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div className='text-sm text-gray-400'>Active ML Models</div>
          </div>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div className='text-center'>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div className='w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-3'>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <Globe className='w-8 h-8 text-yellow-400' />
            </div>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div className='text-2xl font-bold text-yellow-400'>{SPORTS_CONFIG.length}</div>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div className='text-sm text-gray-400'>Supported Sports</div>
          </div>
        </div>
      </motion.div>
    </Layout>
  );
};

export default EnhancedDashboard;
