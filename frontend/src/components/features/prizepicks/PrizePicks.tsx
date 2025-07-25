import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Target,
  TrendingUp,
  User,
  Calendar,
  DollarSign,
  Zap,
  Brain,
  RefreshCw,
  Filter,
  Star,
  AlertCircle,
  CheckCircle,
  Clock,
  BarChart3,
  Trophy,
  Plus,
} from 'lucide-react';
// @ts-expect-error TS(6142): Module '../../core/Layout' was resolved to 'C:/Use... Remove this comment to see the full error message
import { Layout } from '../../core/Layout';
import {
  PlayerProp,
  Lineup,
  PrizePicksStats,
  transformToProjection,
} from '../../../types/prizePicksUnified';
import PrizePicksService from '../../../services/prizePicks';

const _PrizePicks: React.FC = () => {
  const [props, setProps] = useState<PlayerProp[]>([]);
  const [lineups, setLineups] = useState<Lineup[]>([]);
  const [selectedProps, setSelectedProps] = useState<PlayerProp[]>([]);
  const [stats, setStats] = useState<PrizePicksStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [filters, setFilters] = useState({
    sport: 'all',
    minConfidence: 70,
    minValue: 0,
    maxRisk: 'high',
  });
  const [activeTab, setActiveTab] = useState<'props' | 'lineups' | 'stats'>('props');
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [lineupName, setLineupName] = useState('');
  const [entryAmount, setEntryAmount] = useState(25);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    loadPrizePicksData();
  }, [filters]);

  const _loadPrizePicksData = async () => {
    setIsLoading(true);
    try {
      // Fetch real data from the ML ensemble backend
      const _data = await PrizePicksService.getPrizePicksData();

      // Filter props based on current filters
      const _filteredProps = data.props.filter(prop => {
        if (
          filters.sport !== 'all' &&
          !(prop.stat || prop.stat_type || '').toLowerCase().includes(filters.sport)
        ) {
          return false;
        }
        if (prop.confidence < filters.minConfidence) {
          return false;
        }
        if ((prop.value || 0) < filters.minValue) {
          return false;
        }
        const _riskLevel = (prop as unknown).riskAssessment || 'High';
        if (filters.maxRisk === 'low' && riskLevel !== 'Low') {
          return false;
        }
        if (filters.maxRisk === 'medium' && !['Low', 'Medium'].includes(riskLevel)) {
          return false;
        }
        return true;
      });

      setProps(filteredProps);
      setStats(data.stats);

      // Log backend status for debugging
      console.log('🎯 Backend Status:', data.backendStatus);
    } catch (error) {
      console.error('Failed to load PrizePicks data:', error);

      // Fallback to basic data if backend is unavailable
      const _fallbackProps: PlayerProp[] = [
        {
          id: 'fallback-001',
          playerId: 'system-fallback',
          playerName: 'Backend Connecting...',
          team: 'SYS',
          position: 'N/A',
          league: 'SYSTEM',
          sport: 'system',
          stat_type: 'Status',
          stat: 'Status',
          line_score: 0,
          line: 0,
          over: 0,
          under: 0,
          over_odds: -110,
          under_odds: -110,
          start_time: new Date().toISOString(),
          status: 'connecting',
          description: 'System connecting to backend',
          rank: 0,
          is_promo: false,
          projection: 0,
          confidence: 0,
          market_efficiency: 0,
          value: 0,
          edge: 0,
          recentAvg: 0,
          seasonAvg: 0,
          matchup: 'System Check',
          gameTime: new Date(),
          trends: {
            last5: [0, 0, 0, 0, 0],
            homeAway: { home: 0, away: 0 },
            vsOpponent: 0,
          },
        },
      ];

      const _fallbackStats: PrizePicksStats = {
        totalLineups: 0,
        winRate: 0,
        avgMultiplier: 0,
        totalWinnings: 0,
        bestStreak: 0,
        currentStreak: 0,
        avgConfidence: 0,
      };

      setProps(fallbackProps);
      setStats(fallbackStats);
    } finally {
      setIsLoading(false);
    }
  };

  const _validateLineup = (props: PlayerProp[]) => {
    const _errors: string[] = [];
    if (props.length < 2) errors.push('Minimum 2 picks required for PrizePicks lineup');
    if (props.length > 6) errors.push('Maximum 6 picks allowed in PrizePicks');
    if (entryAmount < 5) errors.push('Minimum entry amount is $5');
    if (entryAmount > 1000) errors.push('Maximum entry amount is $1000');

    // Check for duplicate players in same game
    const _gamePlayerCombos = props.map(p => `${p.matchup}-${p.playerName}`);
    const _duplicates = gamePlayerCombos.filter(
      (combo, index) => gamePlayerCombos.indexOf(combo) !== index
    );
    if (duplicates.length > 0) {
      errors.push('Cannot select multiple props for same player in same game');
    }

    // Validate confidence thresholds
    const _avgConfidence = props.reduce((sum, p) => sum + p.confidence, 0) / props.length;
    if (avgConfidence < 60) errors.push('Average confidence below recommended 60% threshold');

    setValidationErrors(errors);
    return errors.length === 0;
  };

  const _addToLineup = (prop: PlayerProp) => {
    if (selectedProps.length >= 6) return;
    if (selectedProps.find(p => p.id === prop.id)) return;

    const _newProps = [...selectedProps, prop];
    setSelectedProps(newProps);
    validateLineup(newProps);
  };

  const _removeFromLineup = (propId: string) => {
    const _newProps = selectedProps.filter(p => p.id !== propId);
    setSelectedProps(newProps);
    validateLineup(newProps);
  };

  const _calculateLineupStats = () => {
    if (selectedProps.length === 0) {
      return { totalValue: 0, avgConfidence: 0, multiplier: 1, risk: 'low' as const };
    }

    // @ts-expect-error TS(2532): Object is possibly 'undefined'.
    const _totalValue = selectedProps.reduce((sum, prop) => sum + prop.value, 0);
    const _avgConfidence =
      selectedProps.reduce((sum, prop) => sum + prop.confidence, 0) / selectedProps.length;

    // Official PrizePicks multipliers
    const _prizePicksMultipliers: Record<number, number> = {
      2: 3.0, // 2-pick Power Play
      3: 5.0, // 3-pick Flex Play
      4: 10.0, // 4-pick Power Play
      5: 20.0, // 5-pick Flex Play
      6: 50.0, // 6-pick Power Play
    };

    const _multiplier = prizePicksMultipliers[selectedProps.length] || 1;

    let _risk: 'low' | 'medium' | 'high' = 'low';
    if (avgConfidence < 65) risk = 'high';
    else if (avgConfidence < 75) risk = 'medium';

    // Factor in correlation risk
    const _correlationRisk = selectedProps.some(prop =>
      selectedProps.some(
        other =>
          other.id !== prop.id &&
          other.matchup === prop.matchup &&
          // @ts-expect-error TS(2532): Object is possibly 'undefined'.
          other.gameTime.getTime() === prop.gameTime.getTime()
      )
    );

    if (correlationRisk && risk === 'low') risk = 'medium';

    return { totalValue, avgConfidence, multiplier, risk };
  };

  const _createLineup = () => {
    if (!validateLineup(selectedProps)) {
      return;
    }
    setShowSaveModal(true);
  };

  const _saveLineup = () => {
    if (!lineupName.trim()) {
      setValidationErrors(['Please enter a lineup name']);
      return;
    }

    const _lineupStats = calculateLineupStats();
    const _newLineup: Lineup = {
      id: `lineup-${Date.now()}`,
      name: lineupName,
      picks: [...selectedProps],
      totalValue: lineupStats.totalValue,
      expectedReturn: lineupStats.multiplier * 0.85, // Accounting for PrizePicks edge
      risk: lineupStats.risk,
      confidence: lineupStats.avgConfidence,
      multiplier: lineupStats.multiplier,
      cost: entryAmount,
      createdAt: new Date(),
      validated: true,
      projectedPayout: entryAmount * lineupStats.multiplier,
      entryAmount: entryAmount,
    };

    setLineups([newLineup, ...lineups]);
    setSelectedProps([]);
    setShowSaveModal(false);
    setLineupName('');
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const _getConfidenceColor = (confidence: number) => {
    if (confidence >= 85) return 'text-green-400';
    if (confidence >= 75) return 'text-yellow-400';
    return 'text-red-400';
  };

  const _getValueColor = (value: number) => {
    if (value >= 2) return 'text-green-400';
    if (value >= 1) return 'text-yellow-400';
    return 'text-red-400';
  };

  const _getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low':
        return 'text-green-400 bg-green-500/20';
      case 'medium':
        return 'text-yellow-400 bg-yellow-500/20';
      case 'high':
        return 'text-red-400 bg-red-500/20';
      default:
        return 'text-gray-400 bg-gray-500/20';
    }
  };

  const _lineupStats = calculateLineupStats();

  return (
    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <Layout
      title='PrizePicks Pro'
      subtitle='AI-Powered Daily Fantasy Optimization • 87% Win Rate'
      headerActions={
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <div className='flex items-center space-x-3'>
          {stats && (
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div className='text-right'>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <div className='text-sm text-gray-400'>Win Rate</div>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <div className='text-lg font-bold text-green-400'>{stats.winRate}%</div>
            </div>
          )}
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <button
            onClick={loadPrizePicksData}
            disabled={isLoading}
            className='flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 rounded-lg text-white font-medium transition-all disabled:opacity-50'
          >
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <span>Refresh</span>
          </button>
        </div>
      }
    >
      {/* Stats Overview */}
      {stats && (
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <div className='grid grid-cols-1 md:grid-cols-4 gap-6 mb-6'>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className='bg-slate-800/50 backdrop-blur-lg border border-slate-700/50 rounded-xl p-6'
          >
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div className='flex items-center justify-between'>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <div>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <p className='text-gray-400 text-sm'>Win Rate</p>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <p className='text-2xl font-bold text-green-400'>{stats.winRate}%</p>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <p className='text-xs text-green-300 mt-1'>{stats.totalLineups} lineups</p>
              </div>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <Trophy className='w-8 h-8 text-green-400' />
            </div>
          </motion.div>

          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className='bg-slate-800/50 backdrop-blur-lg border border-slate-700/50 rounded-xl p-6'
          >
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div className='flex items-center justify-between'>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <div>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <p className='text-gray-400 text-sm'>Total Winnings</p>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <p className='text-2xl font-bold text-purple-400'>
                  ${stats.totalWinnings.toLocaleString()}
                </p>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <p className='text-xs text-purple-300 mt-1'>All time</p>
              </div>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <DollarSign className='w-8 h-8 text-purple-400' />
            </div>
          </motion.div>

          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className='bg-slate-800/50 backdrop-blur-lg border border-slate-700/50 rounded-xl p-6'
          >
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div className='flex items-center justify-between'>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <div>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <p className='text-gray-400 text-sm'>Avg Multiplier</p>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <p className='text-2xl font-bold text-cyan-400'>{stats.avgMultiplier}x</p>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <p className='text-xs text-cyan-300 mt-1'>Per lineup</p>
              </div>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <Zap className='w-8 h-8 text-cyan-400' />
            </div>
          </motion.div>

          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className='bg-slate-800/50 backdrop-blur-lg border border-slate-700/50 rounded-xl p-6'
          >
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div className='flex items-center justify-between'>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <div>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <p className='text-gray-400 text-sm'>Current Streak</p>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <p className='text-2xl font-bold text-yellow-400'>{stats.currentStreak}</p>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <p className='text-xs text-yellow-300 mt-1'>Best: {stats.bestStreak}</p>
              </div>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <Star className='w-8 h-8 text-yellow-400' />
            </div>
          </motion.div>
        </div>
      )}

      {/* Tab Navigation */}
      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <div className='flex items-center space-x-1 mb-6 bg-slate-800/50 rounded-lg p-1'>
        {[
          { id: 'props', label: 'Player Props', icon: Target },
          { id: 'lineups', label: 'Lineup Builder', icon: Trophy },
          { id: 'stats', label: 'Performance', icon: BarChart3 },
        ].map(tab => (
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as unknown)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                : 'text-gray-400 hover:text-white hover:bg-slate-700/50'
            }`}
          >
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <tab.icon className='w-4 h-4' />
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {activeTab === 'props' && (
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <>
          {/* Filters */}
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className='bg-slate-800/50 backdrop-blur-lg border border-slate-700/50 rounded-xl p-6 mb-6'
          >
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div className='flex items-center justify-between mb-4'>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <h3 className='text-lg font-bold text-white'>Filters</h3>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <Filter className='w-5 h-5 text-gray-400' />
            </div>

            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <div>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <label className='text-sm text-gray-400 mb-1 block' htmlFor='pp-filter-sport'>Sport</label>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <select
                  id='pp-filter-sport'
                  value={filters.sport}
                  onChange={e => setFilters({ ...filters, sport: e.target.value })}
                  className='w-full px-3 py-2 bg-slate-900/50 border border-slate-700/50 rounded-lg text-white text-sm focus:outline-none focus:border-cyan-400'
                >
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <option value='all'>All Sports</option>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <option value='nba'>NBA</option>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <option value='nfl'>NFL</option>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <option value='mlb'>MLB</option>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <option value='nhl'>NHL</option>
                </select>
              </div>

              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <div>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <label className='text-sm text-gray-400 mb-1 block' htmlFor='pp-filter-min-confidence'>Min Confidence (%)</label>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <input
                  id='pp-filter-min-confidence'
                  type='range'
                  min='50'
                  max='95'
                  value={filters.minConfidence}
                  onChange={e =>
                    setFilters({ ...filters, minConfidence: parseInt(e.target.value) })
                  }
                  className='w-full'
                />
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <div className='text-xs text-gray-400 text-center'>{filters.minConfidence}%</div>
              </div>

              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <div>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <label className='text-sm text-gray-400 mb-1 block' htmlFor='pp-filter-min-value'>Min Value</label>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <input
                  id='pp-filter-min-value'
                  type='range'
                  min='0'
                  max='5'
                  step='0.1'
                  value={filters.minValue}
                  onChange={e => setFilters({ ...filters, minValue: parseFloat(e.target.value) })}
                  className='w-full'
                />
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <div className='text-xs text-gray-400 text-center'>{filters.minValue}</div>
              </div>

              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <div>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <label className='text-sm text-gray-400 mb-1 block' htmlFor='pp-filter-max-risk'>Max Risk</label>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <select
                  id='pp-filter-max-risk'
                  value={filters.maxRisk}
                  onChange={e => setFilters({ ...filters, maxRisk: e.target.value })}
                  className='w-full px-3 py-2 bg-slate-900/50 border border-slate-700/50 rounded-lg text-white text-sm focus:outline-none focus:border-cyan-400'
                >
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <option value='low'>Low Risk Only</option>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <option value='medium'>Medium Risk & Below</option>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <option value='high'>All Risk Levels</option>
                </select>
              </div>
            </div>
          </motion.div>

          {/* Current Lineup Builder */}
          {selectedProps.length > 0 && (
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className='bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-xl p-6 mb-6'
            >
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <div className='flex items-center justify-between mb-4'>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <h3 className='text-lg font-bold text-white'>Current Lineup</h3>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <div className='flex items-center space-x-3'>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <div className='flex items-center space-x-2'>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <label className='text-sm text-gray-300' htmlFor='pp-lineup-entry'>Entry:</label>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <input
                      id='pp-lineup-entry'
                      type='number'
                      min='5'
                      max='1000'
                      value={entryAmount}
                      onChange={e => setEntryAmount(Number(e.target.value))}
                      className='w-20 px-2 py-1 bg-slate-900/50 border border-slate-700/50 rounded text-white text-sm'
                    />
                  </div>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <button
                    onClick={createLineup}
                    disabled={selectedProps.length < 2 || validationErrors.length > 0}
                    className='flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 rounded-lg text-white font-medium transition-all disabled:opacity-50'
                  >
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <Plus className='w-4 h-4' />
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <span>Save Lineup</span>
                  </button>
                </div>
              </div>

              {/* Validation Errors */}
              {validationErrors.length > 0 && (
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <div className='mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg'>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <div className='flex items-center space-x-2 mb-2'>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <AlertCircle className='w-4 h-4 text-red-400' />
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <span className='text-red-400 font-medium'>Validation Issues</span>
                  </div>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <ul className='text-red-300 text-sm space-y-1'>
                    {validationErrors.map((error, index) => (
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <li key={index}>• {error}</li>
                    ))}
                  </ul>
                </div>
              )}

              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <div className='grid grid-cols-1 md:grid-cols-4 gap-4 mb-4'>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <div className='text-center'>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <div className='text-2xl font-bold text-purple-400'>{selectedProps.length}/6</div>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <div className='text-sm text-gray-400'>Picks</div>
                </div>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <div className='text-center'>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <div className='text-2xl font-bold text-cyan-400'>
                    {lineupStats.avgConfidence.toFixed(1)}%
                  </div>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <div className='text-sm text-gray-400'>Avg Confidence</div>
                </div>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <div className='text-center'>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <div className='text-2xl font-bold text-green-400'>
                    {lineupStats.multiplier.toFixed(1)}x
                  </div>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <div className='text-sm text-gray-400'>Multiplier</div>
                </div>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <div className='text-center'>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${getRiskColor(lineupStats.risk)}`}
                  >
                    {lineupStats.risk.toUpperCase()} RISK
                  </span>
                </div>
              </div>

              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <div className='flex flex-wrap gap-2'>
                {selectedProps.map(prop => (
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <div
                    key={prop.id}
                    className='flex items-center space-x-2 bg-slate-800/50 rounded-lg px-3 py-2'
                  >
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <span className='text-sm text-white'>
                      {prop.playerName} {prop.stat}
                    </span>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <button
                      onClick={() => removeFromLineup(prop.id)}
                      className='text-red-400 hover:text-red-300'
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Player Props */}
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
                <h3 className='text-xl font-bold text-white'>Top Player Props</h3>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <p className='text-gray-400 text-sm'>
                  AI-analyzed opportunities with highest value
                </p>
              </div>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <div className='flex items-center space-x-2'>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <Brain className='w-5 h-5 text-purple-400' />
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <span className='text-purple-400 text-sm font-medium'>AI Optimized</span>
              </div>
            </div>

            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div className='space-y-4'>
              {props.map((prop, index) => (
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <motion.div
                  key={prop.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                  className='bg-slate-900/50 border border-slate-700/50 rounded-lg p-4 hover:border-cyan-500/30 transition-all'
                >
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <div className='flex items-start justify-between mb-3'>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <div className='flex items-center space-x-4'>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <div className='w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center'>
                        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                        <User className='w-6 h-6 text-white' />
                      </div>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <div>
                        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                        <h4 className='font-bold text-white'>{prop.playerName}</h4>
                        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                        <div className='flex items-center space-x-2 text-sm text-gray-400'>
                          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                          <span>{prop.team}</span>
                          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                          <span>•</span>
                          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                          <span>{prop.position}</span>
                          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                          <span>•</span>
                          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                          <span>{prop.matchup}</span>
                        </div>
                      </div>
                    </div>

                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <button
                      onClick={() => addToLineup(prop)}
                      disabled={
                        selectedProps.length >= 6 ||
                        selectedProps.find(p => p.id === prop.id) !== undefined
                      }
                      className='px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 rounded-lg text-white font-medium transition-all disabled:opacity-50'
                    >
                      {selectedProps.find(p => p.id === prop.id) ? 'Added' : 'Add'}
                    </button>
                  </div>

                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <div className='grid grid-cols-2 md:grid-cols-6 gap-4 mb-3'>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <div>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <div className='text-sm text-gray-400'>Stat</div>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <div className='font-bold text-white'>{prop.stat}</div>
                    </div>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <div>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <div className='text-sm text-gray-400'>Line</div>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <div className='font-bold text-white'>{prop.line}</div>
                    </div>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <div>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <div className='text-sm text-gray-400'>Projection</div>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <div className='font-bold text-cyan-400'>{prop.projection}</div>
                    </div>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <div>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <div className='text-sm text-gray-400'>Confidence</div>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <div className={`font-bold ${getConfidenceColor(prop.confidence)}`}>
                        {prop.confidence.toFixed(1)}%
                      </div>
                    </div>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <div>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <div className='text-sm text-gray-400'>Value</div>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <div className={`font-bold ${getValueColor(prop.value)}`}>
                        // @ts-expect-error TS(2532): Object is possibly 'undefined'.
                        {prop.value.toFixed(1)}
                      </div>
                    </div>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <div>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <div className='text-sm text-gray-400'>Edge</div>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <div className='font-bold text-green-400'>+{prop.edge.toFixed(1)}%</div>
                    </div>
                  </div>

                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <div className='flex items-center justify-between text-sm text-gray-400 pt-3 border-t border-slate-700/50'>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <span>Recent: {prop.recentAvg} avg</span>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <span>Season: {prop.seasonAvg} avg</span>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <span>
                      // @ts-expect-error TS(2532): Object is possibly 'undefined'.
                      vs {prop.matchup.split(' ')[1]}: {prop.trends.vsOpponent}
                    </span>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <span className='flex items-center space-x-1'>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <Clock className='w-4 h-4' />
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <span>
                        // @ts-expect-error TS(2769): No overload matches this call.
                        {new Date(prop.gameTime).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </>
      )}

      {activeTab === 'lineups' && (
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className='bg-slate-800/50 backdrop-blur-lg border border-slate-700/50 rounded-xl p-6'
        >
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div className='flex items-center justify-between mb-6'>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <h3 className='text-xl font-bold text-white'>Saved Lineups</h3>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <p className='text-gray-400 text-sm'>Your optimized PrizePicks lineups</p>
            </div>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <Trophy className='w-5 h-5 text-yellow-400' />
          </div>

          {lineups.length === 0 ? (
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div className='text-center py-12'>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <Trophy className='w-16 h-16 text-gray-400 mx-auto mb-4' />
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <h4 className='text-xl font-bold text-gray-400 mb-2'>No Lineups Yet</h4>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <p className='text-gray-500'>Create your first lineup in the Player Props tab</p>
            </div>
          ) : (
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div className='space-y-4'>
              {lineups.map((lineup, index) => (
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <motion.div
                  key={lineup.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className='bg-slate-900/50 border border-slate-700/50 rounded-lg p-4'
                >
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <div className='flex items-center justify-between mb-3'>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <h4 className='font-bold text-white'>{lineup.name}</h4>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <div className='flex items-center space-x-4'>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${getRiskColor(lineup.risk)}`}
                      >
                        {lineup.risk.toUpperCase()}
                      </span>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <span className='text-green-400 font-bold'>
                        {lineup.multiplier.toFixed(1)}x
                      </span>
                    </div>
                  </div>

                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <div className='grid grid-cols-2 md:grid-cols-4 gap-4 mb-3'>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <div>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <div className='text-sm text-gray-400'>Picks</div>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <div className='font-bold text-white'>{lineup.picks.length}</div>
                    </div>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <div>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <div className='text-sm text-gray-400'>Confidence</div>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <div className='font-bold text-cyan-400'>{lineup.confidence.toFixed(1)}%</div>
                    </div>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <div>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <div className='text-sm text-gray-400'>Expected Return</div>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <div className='font-bold text-green-400'>
                        ${lineup.expectedReturn.toFixed(2)}
                      </div>
                    </div>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <div>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <div className='text-sm text-gray-400'>Cost</div>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <div className='font-bold text-white'>${lineup.cost}</div>
                    </div>
                  </div>

                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <div className='text-sm text-gray-400'>
                    Created: {lineup.createdAt.toLocaleDateString()}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {activeTab === 'stats' && stats && (
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
          {[
            {
              label: 'Total Lineups',
              value: stats.totalLineups.toString(),
              icon: Trophy,
              color: 'text-purple-400',
            },
            {
              label: 'Win Rate',
              value: `${stats.winRate}%`,
              icon: Target,
              color: 'text-green-400',
            },
            {
              label: 'Avg Multiplier',
              value: `${stats.avgMultiplier}x`,
              icon: TrendingUp,
              color: 'text-cyan-400',
            },
            {
              label: 'Total Winnings',
              value: `$${stats.totalWinnings.toLocaleString()}`,
              icon: DollarSign,
              color: 'text-green-400',
            },
            {
              label: 'Best Streak',
              value: stats.bestStreak.toString(),
              icon: Star,
              color: 'text-yellow-400',
            },
            {
              label: 'Current Streak',
              value: stats.currentStreak.toString(),
              icon: Zap,
              color: 'text-orange-400',
            },
          ].map((stat, index) => (
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className='bg-slate-800/50 backdrop-blur-lg border border-slate-700/50 rounded-xl p-6'
            >
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <div className='flex items-center justify-between'>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <div>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <p className='text-gray-400 text-sm'>{stat.label}</p>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                </div>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <stat.icon className={`w-8 h-8 ${stat.color}`} />
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Real-Time Strategy Optimizer */}
      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.0 }}
        className='bg-slate-800/50 backdrop-blur-lg border border-slate-700/50 rounded-xl p-6 mt-8'
      >
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <div className='flex items-center justify-between mb-6'>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <h3 className='text-xl font-bold text-white'>Real-Time Strategy Optimizer</h3>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <p className='text-gray-400 text-sm'>
              AI-powered lineup optimization with live market data
            </p>
          </div>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <Brain className='w-6 h-6 text-purple-400' />
        </div>

        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div className='bg-slate-900/50 rounded-lg p-4'>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <h4 className='text-sm font-medium text-gray-400 mb-3'>Market Sentiment</h4>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div className='space-y-3'>
              {[
                { player: 'LeBron James', sentiment: 'Bullish', confidence: 94, volume: 'High' },
                { player: 'Stephen Curry', sentiment: 'Neutral', confidence: 78, volume: 'Medium' },
                { player: 'Luka Dončić', sentiment: 'Bearish', confidence: 82, volume: 'Low' },
              ].map((market, index) => (
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <div key={index} className='bg-slate-800/50 rounded-lg p-3'>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <div className='flex items-center justify-between mb-2'>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <span className='text-white font-medium text-sm'>{market.player}</span>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        market.sentiment === 'Bullish'
                          ? 'bg-green-500/20 text-green-400'
                          : market.sentiment === 'Bearish'
                            ? 'bg-red-500/20 text-red-400'
                            : 'bg-gray-500/20 text-gray-400'
                      }`}
                    >
                      {market.sentiment}
                    </span>
                  </div>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <div className='flex items-center justify-between text-xs'>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <span className='text-gray-400'>Confidence: {market.confidence}%</span>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <span className='text-cyan-400'>Volume: {market.volume}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div className='bg-slate-900/50 rounded-lg p-4'>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <h4 className='text-sm font-medium text-gray-400 mb-3'>Optimization Signals</h4>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div className='space-y-3'>
              {[
                {
                  signal: 'Injury Report Update',
                  impact: 'High',
                  action: 'Fade Embiid Props',
                  time: '2m ago',
                },
                {
                  signal: 'Line Movement Alert',
                  impact: 'Medium',
                  action: 'Boost Tatum Points',
                  time: '5m ago',
                },
                {
                  signal: 'Weather Update',
                  impact: 'Low',
                  action: 'Adjust NFL Totals',
                  time: '12m ago',
                },
              ].map((signal, index) => (
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <div key={index} className='bg-slate-800/50 rounded-lg p-3'>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <div className='flex items-center justify-between mb-1'>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <span className='text-white font-medium text-sm'>{signal.signal}</span>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <span
                      className={`text-xs ${
                        signal.impact === 'High'
                          ? 'text-red-400'
                          : signal.impact === 'Medium'
                            ? 'text-yellow-400'
                            : 'text-green-400'
                      }`}
                    >
                      {signal.impact}
                    </span>
                  </div>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <div className='text-cyan-400 text-xs mb-1'>{signal.action}</div>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <div className='text-gray-400 text-xs'>{signal.time}</div>
                </div>
              ))}
            </div>
          </div>

          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div className='bg-slate-900/50 rounded-lg p-4'>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <h4 className='text-sm font-medium text-gray-400 mb-3'>Live Performance</h4>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div className='space-y-3'>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <div className='text-center'>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <div className='text-2xl font-bold text-green-400 mb-1'>87.3%</div>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <div className='text-xs text-gray-400'>Today's Win Rate</div>
              </div>

              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <div className='bg-slate-800/50 rounded-lg p-3'>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <div className='text-center'>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <div className='text-lg font-bold text-purple-400 mb-1'>+$2,847</div>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <div className='text-xs text-gray-400'>Live P&L</div>
                </div>
              </div>

              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <div className='bg-slate-800/50 rounded-lg p-3'>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <div className='text-center'>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <div className='text-lg font-bold text-cyan-400 mb-1'>34</div>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <div className='text-xs text-gray-400'>Active Positions</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Advanced Correlation Analysis */}
      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.1 }}
        className='bg-slate-800/50 backdrop-blur-lg border border-slate-700/50 rounded-xl p-6 mt-8'
      >
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <div className='flex items-center justify-between mb-6'>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <h3 className='text-xl font-bold text-white'>Correlation & Stack Analysis</h3>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <p className='text-gray-400 text-sm'>Optimize lineup correlation for maximum upside</p>
          </div>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <BarChart3 className='w-6 h-6 text-green-400' />
        </div>

        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <h4 className='text-lg font-medium text-white mb-4'>Player Correlations</h4>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div className='space-y-3'>
              {[
                {
                  player1: 'LeBron James',
                  player2: 'Anthony Davis',
                  correlation: 0.73,
                  recommendation: 'Stack',
                },
                {
                  player1: 'Curry',
                  player2: 'Thompson',
                  correlation: 0.68,
                  recommendation: 'Stack',
                },
                { player1: 'Luka', player2: 'Irving', correlation: -0.34, recommendation: 'Avoid' },
                {
                  player1: 'Tatum',
                  player2: 'Brown',
                  correlation: 0.45,
                  recommendation: 'Neutral',
                },
              ].map((corr, index) => (
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <div
                  key={index}
                  className='flex items-center justify-between bg-slate-900/50 rounded-lg p-3'
                >
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <div>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <div className='text-white font-medium text-sm'>
                      {corr.player1} + {corr.player2}
                    </div>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <div className='text-gray-400 text-xs'>Correlation: {corr.correlation}</div>
                  </div>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${
                      corr.recommendation === 'Stack'
                        ? 'bg-green-500/20 text-green-400'
                        : corr.recommendation === 'Avoid'
                          ? 'bg-red-500/20 text-red-400'
                          : 'bg-gray-500/20 text-gray-400'
                    }`}
                  >
                    {corr.recommendation}
                  </span>
                </div>
              ))}
            </div>
          </div>

          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <h4 className='text-lg font-medium text-white mb-4'>Stack Recommendations</h4>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div className='space-y-3'>
              {[
                {
                  stack: 'Lakers Core',
                  players: ['LeBron', 'AD', 'Reaves'],
                  upside: '+28%',
                  risk: 'Medium',
                  confidence: 89,
                },
                {
                  stack: 'Warriors Splash',
                  players: ['Curry', 'Thompson', 'Poole'],
                  upside: '+31%',
                  risk: 'High',
                  confidence: 76,
                },
                {
                  stack: 'Celtics Wings',
                  players: ['Tatum', 'Brown', 'Smart'],
                  upside: '+22%',
                  risk: 'Low',
                  confidence: 94,
                },
              ].map((stack, index) => (
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <div key={index} className='bg-slate-900/50 rounded-lg p-3'>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <div className='flex items-center justify-between mb-2'>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <span className='text-white font-medium text-sm'>{stack.stack}</span>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <span className='text-green-400 font-bold text-sm'>{stack.upside}</span>
                  </div>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <div className='text-gray-300 text-xs mb-2'>{stack.players.join(' + ')}</div>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <div className='flex items-center justify-between text-xs'>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <span
                      className={`px-2 py-1 rounded-full ${
                        stack.risk === 'Low'
                          ? 'bg-green-500/20 text-green-400'
                          : stack.risk === 'Medium'
                            ? 'bg-yellow-500/20 text-yellow-400'
                            : 'bg-red-500/20 text-red-400'
                      }`}
                    >
                      {stack.risk} Risk
                    </span>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <span className='text-cyan-400'>{stack.confidence}% Confidence</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Save Lineup Modal */}
      {showSaveModal && (
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <div className='fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4'>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className='bg-slate-800 border border-slate-700 rounded-xl p-6 w-full max-w-md'
          >
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <h3 className='text-xl font-bold text-white mb-4'>Save Lineup</h3>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div className='space-y-4'>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <div>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <label className='block text-sm text-gray-400 mb-2' htmlFor='pp-lineup-name'>Lineup Name</label>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <input
                  id='pp-lineup-name'
                  type='text'
                  value={lineupName}
                  onChange={e => setLineupName(e.target.value)}
                  placeholder='Enter lineup name...'
                  className='w-full px-3 py-2 bg-slate-900/50 border border-slate-700/50 rounded-lg text-white'
                />
              </div>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <div className='grid grid-cols-2 gap-4 text-sm'>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <div>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <span className='text-gray-400'>Picks:</span>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <span className='text-white ml-2'>{selectedProps.length}</span>
                </div>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <div>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <span className='text-gray-400'>Entry:</span>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <span className='text-white ml-2'>${entryAmount}</span>
                </div>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <div>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <span className='text-gray-400'>Multiplier:</span>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <span className='text-cyan-400 ml-2'>{lineupStats.multiplier}x</span>
                </div>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <div>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <span className='text-gray-400'>Payout:</span>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <span className='text-green-400 ml-2'>
                    ${(entryAmount * lineupStats.multiplier).toFixed(2)}
                  </span>
                </div>
              </div>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <div className='flex space-x-3'>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <button
                  onClick={saveLineup}
                  className='flex-1 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 rounded-lg text-white font-medium transition-all'
                >
                  Save Lineup
                </button>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <button
                  onClick={() => setShowSaveModal(false)}
                  className='px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-white font-medium transition-all'
                >
                  Cancel
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Success Message */}
      {showSuccess && (
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <div className='fixed top-4 right-4 z-50'>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <motion.div
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 100 }}
            className='bg-green-500/20 border border-green-500/30 rounded-lg p-4 flex items-center space-x-2'
          >
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <CheckCircle className='w-5 h-5 text-green-400' />
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <span className='text-green-300 font-medium'>Lineup saved successfully!</span>
          </motion.div>
        </div>
      )}

      {/* Advanced Performance Tracking */}
      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.2 }}
        className='bg-slate-800/50 backdrop-blur-lg border border-slate-700/50 rounded-xl p-6 mt-8'
      >
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <div className='flex items-center justify-between mb-6'>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <h3 className='text-xl font-bold text-white'>Advanced Performance Tracking</h3>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <p className='text-gray-400 text-sm'>
              Comprehensive analytics with streak monitoring and bet history analysis
            </p>
          </div>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <BarChart3 className='w-6 h-6 text-purple-400' />
        </div>

        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <div className='grid grid-cols-1 md:grid-cols-4 gap-4 mb-6'>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div className='bg-slate-900/50 rounded-lg p-4 text-center'>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div className='text-2xl font-bold text-green-400 mb-1'>$42,730</div>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div className='text-sm text-gray-400'>Total Winnings</div>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div className='text-xs text-green-300 mt-1'>All time</div>
          </div>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div className='bg-slate-900/50 rounded-lg p-4 text-center'>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div className='text-2xl font-bold text-cyan-400 mb-1'>2.89</div>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div className='text-sm text-gray-400'>Avg Odds</div>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div className='text-xs text-cyan-300 mt-1'>Per lineup</div>
          </div>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div className='bg-slate-900/50 rounded-lg p-4 text-center'>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div className='text-2xl font-bold text-yellow-400 mb-1'>$47</div>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div className='text-sm text-gray-400'>Avg Stake</div>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div className='text-xs text-yellow-300 mt-1'>Kelly optimized</div>
          </div>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div className='bg-slate-900/50 rounded-lg p-4 text-center'>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div className='text-2xl font-bold text-purple-400 mb-1'>$2,847</div>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div className='text-sm text-gray-400'>Best Win</div>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div className='text-xs text-purple-300 mt-1'>6-pick lineup</div>
          </div>
        </div>

        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div className='bg-slate-900/50 rounded-lg p-4'>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <h4 className='text-sm font-medium text-gray-400 mb-3'>Lineup Performance by Type</h4>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div className='space-y-3'>
              {[
                { type: '2-Pick Power', lineups: 89, winRate: 94.4, avgPayout: 3.0, profit: 8420 },
                { type: '3-Pick Flex', lineups: 67, winRate: 85.1, avgPayout: 5.0, profit: 6730 },
                { type: '4-Pick Power', lineups: 34, winRate: 76.5, avgPayout: 10.0, profit: 4890 },
                { type: '5-Pick Flex', lineups: 18, winRate: 66.7, avgPayout: 20.0, profit: 3240 },
                { type: '6-Pick Power', lineups: 7, winRate: 57.1, avgPayout: 50.0, profit: 1450 },
              ].map((type, index) => (
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <div key={index} className='bg-slate-800/50 rounded-lg p-3'>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <div className='flex items-center justify-between mb-2'>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <span className='text-white font-medium text-sm'>{type.type}</span>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <span className='text-green-400 text-sm'>{type.winRate}%</span>
                  </div>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <div className='grid grid-cols-2 gap-2 text-xs'>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <div className='text-gray-400'>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      Lineups: <span className='text-white'>{type.lineups}</span>
                    </div>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <div className='text-gray-400'>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      Avg Payout: <span className='text-cyan-400'>{type.avgPayout}x</span>
                    </div>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <div className='text-gray-400'>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      Profit: <span className='text-green-400'>${type.profit}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div className='bg-slate-900/50 rounded-lg p-4'>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <h4 className='text-sm font-medium text-gray-400 mb-3'>Recent Betting History</h4>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div className='space-y-2'>
              {[
                {
                  id: 'bet-001',
                  date: '2 hours ago',
                  lineup: 'LeBron + Curry + Luka (3-pick)',
                  stake: 25,
                  odds: 5.0,
                  status: 'Won',
                  payout: 125,
                  profit: 100,
                },
                {
                  id: 'bet-002',
                  date: '1 day ago',
                  lineup: 'Tatum + Brown (2-pick)',
                  stake: 50,
                  odds: 3.0,
                  status: 'Won',
                  payout: 150,
                  profit: 100,
                },
                {
                  id: 'bet-003',
                  date: '2 days ago',
                  lineup: 'Giannis + Embiid + KD + Butler (4-pick)',
                  stake: 15,
                  odds: 10.0,
                  status: 'Lost',
                  payout: 0,
                  profit: -15,
                },
                {
                  id: 'bet-004',
                  date: '3 days ago',
                  lineup: 'Jokic + Murray + MPJ (3-pick)',
                  stake: 30,
                  odds: 5.0,
                  status: 'Won',
                  payout: 150,
                  profit: 120,
                },
              ].map((bet, index) => (
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <div key={index} className='bg-slate-800/50 rounded-lg p-2'>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <div className='flex items-center justify-between mb-1'>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <span className='text-white text-xs font-medium'>{bet.lineup}</span>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        bet.status === 'Won'
                          ? 'bg-green-500/20 text-green-400'
                          : bet.status === 'Lost'
                            ? 'bg-red-500/20 text-red-400'
                            : 'bg-yellow-500/20 text-yellow-400'
                      }`}
                    >
                      {bet.status}
                    </span>
                  </div>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <div className='grid grid-cols-3 gap-1 text-xs'>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <div className='text-gray-400'>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      Stake: <span className='text-white'>${bet.stake}</span>
                    </div>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <div className='text-gray-400'>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      Odds: <span className='text-cyan-400'>{bet.odds}x</span>
                    </div>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <div className='text-gray-400'>
                      P&L:{' '}
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <span className={bet.profit > 0 ? 'text-green-400' : 'text-red-400'}>
                        {bet.profit > 0 ? '+' : ''}${bet.profit}
                      </span>
                    </div>
                  </div>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <div className='text-gray-400 text-xs mt-1'>{bet.date}</div>
                </div>
              ))}
            </div>
          </div>

          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div className='bg-slate-900/50 rounded-lg p-4'>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <h4 className='text-sm font-medium text-gray-400 mb-3'>Performance Insights</h4>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div className='space-y-3'>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <div className='bg-slate-800/50 rounded-lg p-3 text-center'>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <div className='text-2xl font-bold text-green-400 mb-1'>17</div>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <div className='text-xs text-gray-400'>Current Win Streak</div>
              </div>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <div className='bg-slate-800/50 rounded-lg p-3 text-center'>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <div className='text-2xl font-bold text-yellow-400 mb-1'>29</div>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <div className='text-xs text-gray-400'>Longest Win Streak</div>
              </div>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <div className='space-y-2'>
                {[
                  { period: 'Today', profit: '+$275', bets: 7 },
                  { period: 'This Week', profit: '+$1,420', bets: 34 },
                  { period: 'This Month', profit: '+$4,830', bets: 127 },
                ].map((period, index) => (
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <div key={index} className='flex items-center justify-between text-sm'>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <span className='text-gray-400'>{period.period}</span>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <div className='text-right'>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <span className='text-green-400 font-medium'>{period.profit}</span>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <div className='text-gray-400 text-xs'>{period.bets} lineups</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Machine Learning Lineup Optimization */}
      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.4 }}
        className='bg-slate-800/50 backdrop-blur-lg border border-slate-700/50 rounded-xl p-6 mt-8'
      >
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <div className='flex items-center justify-between mb-6'>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <h3 className='text-xl font-bold text-white'>Machine Learning Lineup Optimization</h3>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <p className='text-gray-400 text-sm'>
              AI-powered lineup generation with genetic algorithms and neural networks
            </p>
          </div>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <Brain className='w-6 h-6 text-purple-400' />
        </div>

        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <div className='grid grid-cols-1 md:grid-cols-4 gap-4 mb-6'>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div className='bg-slate-900/50 rounded-lg p-4 text-center'>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div className='text-2xl font-bold text-purple-400 mb-1'>10,000</div>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div className='text-sm text-gray-400'>Lineups Generated</div>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div className='text-xs text-purple-300 mt-1'>Per optimization run</div>
          </div>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div className='bg-slate-900/50 rounded-lg p-4 text-center'>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div className='text-2xl font-bold text-green-400 mb-1'>94.7%</div>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div className='text-sm text-gray-400'>ML Accuracy</div>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div className='text-xs text-green-300 mt-1'>Lineup prediction</div>
          </div>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div className='bg-slate-900/50 rounded-lg p-4 text-center'>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div className='text-2xl font-bold text-cyan-400 mb-1'>87.3%</div>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div className='text-sm text-gray-400'>Win Rate</div>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div className='text-xs text-cyan-300 mt-1'>ML-optimized lineups</div>
          </div>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div className='bg-slate-900/50 rounded-lg p-4 text-center'>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div className='text-2xl font-bold text-yellow-400 mb-1'>+31.7%</div>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div className='text-sm text-gray-400'>Expected Value</div>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div className='text-xs text-yellow-300 mt-1'>Top lineup</div>
          </div>
        </div>

        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div className='bg-slate-900/50 rounded-lg p-4'>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <h4 className='text-sm font-medium text-gray-400 mb-3'>Genetic Algorithm Evolution</h4>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div className='space-y-3'>
              {[
                {
                  generation: 'Generation 1',
                  population: 1000,
                  bestFitness: 0.647,
                  avgFitness: 0.423,
                  mutation: '12.3%',
                  crossover: '78.9%',
                },
                {
                  generation: 'Generation 25',
                  population: 1000,
                  bestFitness: 0.834,
                  avgFitness: 0.672,
                  mutation: '8.7%',
                  crossover: '84.2%',
                },
                {
                  generation: 'Generation 50',
                  population: 1000,
                  bestFitness: 0.917,
                  avgFitness: 0.789,
                  mutation: '5.4%',
                  crossover: '89.1%',
                },
                {
                  generation: 'Generation 100 (Final)',
                  population: 1000,
                  bestFitness: 0.973,
                  avgFitness: 0.847,
                  mutation: '2.1%',
                  crossover: '92.8%',
                },
              ].map((gen, index) => (
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <div key={index} className='bg-slate-800/50 rounded-lg p-3'>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <div className='text-white font-medium text-sm mb-2'>{gen.generation}</div>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <div className='grid grid-cols-2 gap-2 text-xs'>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <div className='text-gray-400'>
                      Best:{' '}
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <span className='text-green-400'>{(gen.bestFitness * 100).toFixed(1)}%</span>
                    </div>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <div className='text-gray-400'>
                      Avg:{' '}
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <span className='text-cyan-400'>{(gen.avgFitness * 100).toFixed(1)}%</span>
                    </div>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <div className='text-gray-400'>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      Mutation: <span className='text-purple-400'>{gen.mutation}</span>
                    </div>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <div className='text-gray-400'>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      Crossover: <span className='text-yellow-400'>{gen.crossover}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div className='bg-slate-900/50 rounded-lg p-4'>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <h4 className='text-sm font-medium text-gray-400 mb-3'>Neural Network Analysis</h4>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div className='space-y-3'>
              {[
                {
                  layer: 'Input Layer',
                  neurons: 247,
                  activation: 'Linear',
                  description: 'Player stats & features',
                  weights: 'Optimized',
                },
                {
                  layer: 'Hidden Layer 1',
                  neurons: 512,
                  activation: 'ReLU',
                  description: 'Feature extraction',
                  weights: 'Learning',
                },
                {
                  layer: 'Hidden Layer 2',
                  neurons: 256,
                  activation: 'ReLU',
                  description: 'Pattern recognition',
                  weights: 'Stable',
                },
                {
                  layer: 'Hidden Layer 3',
                  neurons: 128,
                  activation: 'ReLU',
                  description: 'Combination analysis',
                  weights: 'Converged',
                },
                {
                  layer: 'Output Layer',
                  neurons: 1,
                  activation: 'Sigmoid',
                  description: 'Lineup probability',
                  weights: 'Optimal',
                },
              ].map((layer, index) => (
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <div key={index} className='bg-slate-800/50 rounded-lg p-3'>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <div className='flex items-center justify-between mb-2'>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <span className='text-white font-medium text-sm'>{layer.layer}</span>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <span className='text-cyan-400 text-xs'>{layer.neurons} neurons</span>
                  </div>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <div className='text-gray-300 text-xs mb-1'>{layer.description}</div>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <div className='grid grid-cols-2 gap-2 text-xs'>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <div className='text-gray-400'>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      Activation: <span className='text-purple-400'>{layer.activation}</span>
                    </div>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <div className='text-gray-400'>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      Weights: <span className='text-green-400'>{layer.weights}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div className='bg-slate-900/50 rounded-lg p-4'>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <h4 className='text-sm font-medium text-gray-400 mb-3'>Optimization Results</h4>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div className='space-y-3'>
              {[
                {
                  lineup: 'AI Optimal #1',
                  players: ['LeBron', 'Curry', 'Luka', 'Tatum', 'Giannis', 'Jokic'],
                  confidence: 97.3,
                  expectedValue: 31.7,
                  risk: 'Medium',
                  multiplier: 50.0,
                },
                {
                  lineup: 'AI Optimal #2',
                  players: ['Durant', 'Irving', 'Butler', 'Embiid', 'Lillard'],
                  confidence: 94.8,
                  expectedValue: 28.4,
                  risk: 'Low',
                  multiplier: 20.0,
                },
                {
                  lineup: 'AI Optimal #3',
                  players: ['Morant', 'Young', 'Booker', 'Davis'],
                  confidence: 91.2,
                  expectedValue: 24.9,
                  risk: 'Medium',
                  multiplier: 10.0,
                },
              ].map((lineup, index) => (
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <div key={index} className='bg-slate-800/50 rounded-lg p-3'>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <div className='flex items-center justify-between mb-2'>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <span className='text-white font-medium text-sm'>{lineup.lineup}</span>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <span className='text-green-400 text-sm'>+{lineup.expectedValue}%</span>
                  </div>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <div className='text-gray-300 text-xs mb-2'>{lineup.players.join(', ')}</div>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <div className='grid grid-cols-2 gap-2 text-xs'>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <div className='text-gray-400'>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      Confidence: <span className='text-cyan-400'>{lineup.confidence}%</span>
                    </div>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <div className='text-gray-400'>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      Multiplier: <span className='text-purple-400'>{lineup.multiplier}x</span>
                    </div>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <div className='text-gray-400'>
                      Risk:{' '}
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <span
                        className={
                          lineup.risk === 'Low'
                            ? 'text-green-400'
                            : lineup.risk === 'Medium'
                              ? 'text-yellow-400'
                              : 'text-red-400'
                        }
                      >
                        {lineup.risk}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Advanced Correlation Engine */}
      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.5 }}
        className='bg-slate-800/50 backdrop-blur-lg border border-slate-700/50 rounded-xl p-6 mt-8'
      >
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <div className='flex items-center justify-between mb-6'>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <h3 className='text-xl font-bold text-white'>Advanced Correlation Engine</h3>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <p className='text-gray-400 text-sm'>
              Multi-dimensional correlation analysis with dynamic weighting and risk assessment
            </p>
          </div>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <Target className='w-6 h-6 text-green-400' />
        </div>

        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div className='bg-slate-900/50 rounded-lg p-4'>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <h4 className='text-lg font-medium text-white mb-4'>Dynamic Correlation Matrix</h4>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div className='space-y-3'>
              {[
                {
                  pair: 'LeBron Points ↔ Lakers Win',
                  correlation: 0.847,
                  type: 'Strong Positive',
                  timeframe: 'Game-level',
                  stability: 'High (0.89)',
                  recommendation: 'Stack recommended',
                },
                {
                  pair: 'Curry 3PM ↔ Warriors Pace',
                  correlation: 0.692,
                  type: 'Moderate Positive',
                  timeframe: 'Quarter-level',
                  stability: 'Medium (0.67)',
                  recommendation: 'Conditional stack',
                },
                {
                  pair: 'Total Points ↔ Pace',
                  correlation: 0.734,
                  type: 'Strong Positive',
                  timeframe: 'Game-level',
                  stability: 'Very High (0.94)',
                  recommendation: 'High confidence',
                },
                {
                  pair: 'Defense Rating ↔ Opp Scoring',
                  correlation: -0.623,
                  type: 'Strong Negative',
                  timeframe: 'Season-level',
                  stability: 'High (0.88)',
                  recommendation: 'Contrarian play',
                },
              ].map((corr, index) => (
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <div key={index} className='bg-slate-800/50 rounded-lg p-3'>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <div className='text-white font-medium text-sm mb-2'>{corr.pair}</div>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <div className='grid grid-cols-2 gap-2 text-xs mb-2'>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <div className='text-gray-400'>
                      Correlation:{' '}
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <span
                        className={
                          Math.abs(corr.correlation) > 0.7
                            ? 'text-green-400'
                            : Math.abs(corr.correlation) > 0.5
                              ? 'text-yellow-400'
                              : 'text-red-400'
                        }
                      >
                        {corr.correlation.toFixed(3)}
                      </span>
                    </div>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <div className='text-gray-400'>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      Type: <span className='text-cyan-400'>{corr.type}</span>
                    </div>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <div className='text-gray-400'>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      Timeframe: <span className='text-purple-400'>{corr.timeframe}</span>
                    </div>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <div className='text-gray-400'>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      Stability: <span className='text-green-400'>{corr.stability}</span>
                    </div>
                  </div>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <div className='text-yellow-400 text-xs'>{corr.recommendation}</div>
                </div>
              ))}
            </div>
          </div>

          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div className='bg-slate-900/50 rounded-lg p-4'>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <h4 className='text-lg font-medium text-white mb-4'>Risk-Adjusted Stack Analysis</h4>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div className='space-y-3'>
              {[
                {
                  stack: 'Lakers Core Stack',
                  players: ['LeBron O25.5', 'AD O22.5', 'Reaves O12.5'],
                  correlation: 0.73,
                  upside: '+28.4%',
                  downside: '-15.7%',
                  probability: 0.847,
                  risk: 'Medium',
                },
                {
                  stack: 'Warriors Splash Bros',
                  players: ['Curry O4.5 3PM', 'Klay O3.5 3PM'],
                  correlation: 0.68,
                  upside: '+22.1%',
                  downside: '-12.3%',
                  probability: 0.792,
                  risk: 'Low',
                },
                {
                  stack: 'Pace-Based Stack',
                  players: ['Game Total Over', 'Both Teams 110+'],
                  correlation: 0.89,
                  upside: '+19.7%',
                  downside: '-8.9%',
                  probability: 0.913,
                  risk: 'Low',
                },
              ].map((stack, index) => (
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <div key={index} className='bg-slate-800/50 rounded-lg p-3'>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <div className='text-white font-medium text-sm mb-2'>{stack.stack}</div>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <div className='text-gray-300 text-xs mb-2'>{stack.players.join(' + ')}</div>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <div className='grid grid-cols-2 gap-2 text-xs mb-2'>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <div className='text-gray-400'>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      Correlation: <span className='text-cyan-400'>{stack.correlation}</span>
                    </div>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <div className='text-gray-400'>
                      Probability:{' '}
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <span className='text-purple-400'>
                        {(stack.probability * 100).toFixed(1)}%
                      </span>
                    </div>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <div className='text-gray-400'>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      Upside: <span className='text-green-400'>{stack.upside}</span>
                    </div>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <div className='text-gray-400'>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      Downside: <span className='text-red-400'>{stack.downside}</span>
                    </div>
                  </div>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <div className='flex items-center justify-between'>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        stack.risk === 'Low'
                          ? 'bg-green-500/20 text-green-400'
                          : stack.risk === 'Medium'
                            ? 'bg-yellow-500/20 text-yellow-400'
                            : 'bg-red-500/20 text-red-400'
                      }`}
                    >
                      {stack.risk} Risk
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </Layout>
  );
};

export default PrizePicks;
