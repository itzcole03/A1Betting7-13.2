import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  DollarSign,
  Trophy,
  Target,
  TrendingUp,
  Star,
  Lock,
  Unlock,
  RotateCcw,
  Zap,
  Settings,
  Filter,
  Search,
  Brain,
  ChevronDown,
  ChevronUp,
  Info,
  RefreshCw,
  Download,
  Upload,
  Share2,
  BarChart3,
  Percent,
} from 'lucide-react';
// @ts-expect-error TS(6142): Module '../../core/Layout' was resolved to 'C:/Use... Remove this comment to see the full error message
import { Layout } from '../../core/Layout';
import {
  lineupService,
  Player,
  Contest,
  LineupOptimization,
  LineupStrategy,
} from '../../../services/lineupService';

const _LineupBuilder: React.FC = () => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [availableContests, setAvailableContests] = useState<Contest[]>([]);
  const [selectedContest, setSelectedContest] = useState<Contest | null>(null);
  const [optimizedLineups, setOptimizedLineups] = useState<LineupOptimization[]>([]);
  const [currentLineup, setCurrentLineup] = useState<Player[]>([]);
  const [lockedPlayers, setLockedPlayers] = useState<Set<string>>(new Set());
  const [excludedPlayers, setExcludedPlayers] = useState<Set<string>>(new Set());
  const [selectedStrategy, setSelectedStrategy] = useState<LineupStrategy | null>(null);
  const [strategies, setStrategies] = useState<LineupStrategy[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'value' | 'salary' | 'projection' | 'ownership'>('value');
  const [filterPosition, setFilterPosition] = useState<string>('all');
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [exposureSettings, setExposureSettings] = useState<{ [playerId: string]: number }>({});

  useEffect(() => {
    loadContests();
    loadStrategies();
  }, []);

  useEffect(() => {
    loadPlayerData();
  }, [selectedContest, filterPosition]);

  const _loadPlayerData = async () => {
    if (!selectedContest) return;

    try {
      const _players = await lineupService.getPlayerPool(selectedContest.id, {
        position: filterPosition === 'all' ? undefined : filterPosition,
      });
      setPlayers(players);
    } catch (error) {
      console.error('Failed to load player data:', error);
    }
  };

  const _loadContests = async () => {
    try {
      const _contests = await lineupService.getContests('NFL');
      setAvailableContests(contests);
      if (contests.length > 0) {
        setSelectedContest(contests[0]);
      }
    } catch (error) {
      console.error('Failed to load contests:', error);
    }
  };

  const _loadStrategies = async () => {
    try {
      const _strategies = await lineupService.getStrategies();
      setStrategies(strategies);
      if (strategies.length > 0) {
        setSelectedStrategy(strategies[0]);
      }
    } catch (error) {
      console.error('Failed to load strategies:', error);
    }
  };

  const _optimizeLineup = async () => {
    if (!selectedContest || !selectedStrategy) return;

    setIsOptimizing(true);
    try {
      const _constraints = {
        lockedPlayers: Array.from(lockedPlayers),
        excludedPlayers: Array.from(excludedPlayers),
      };

      const _optimizations = await lineupService.optimizeLineup(
        selectedContest.id,
        selectedStrategy,
        constraints,
        { numLineups: 1 }
      );

      setOptimizedLineups(optimizations);
      if (optimizations.length > 0) {
        setCurrentLineup(optimizations[0].lineup);
      }
    } catch (error) {
      console.error('Failed to optimize lineup:', error);
    } finally {
      setIsOptimizing(false);
    }
  };

  const _generateOptimalLineup = (): LineupOptimization => {
    if (!selectedContest) {
      throw new Error('No contest selected');
    }

    // Simplified optimization - would use more complex algorithms in production
    const _availablePlayers = players.filter(p => !excludedPlayers.has(p.id));
    const _requiredPositions = selectedContest.positions;
    const _salaryCap = selectedContest.salaryCap;

    let _lineup: Player[] = [];
    let _totalSalary = 0;

    // Lock in required players first
    lockedPlayers.forEach(playerId => {
      const _player = availablePlayers.find(p => p.id === playerId);
      if (player) {
        lineup.push(player);
        totalSalary += player.salary;
      }
    });

    // Fill remaining positions with optimal players
    Object.entries(requiredPositions).forEach(([position, count]) => {
      const _positionPlayers = availablePlayers
        .filter(p => p.position === position && !lineup.includes(p))
        .sort((a, b) => b.value - a.value);

      for (let _i = 0; i < count && positionPlayers.length > 0; i++) {
        const _player = positionPlayers[i];
        if (totalSalary + player.salary <= salaryCap) {
          lineup.push(player);
          totalSalary += player.salary;
        }
      }
    });

    const _projectedPoints = lineup.reduce((sum, p) => sum + p.projectedPoints, 0);
    const _ownership = lineup.reduce((sum, p) => sum + p.ownership, 0) / lineup.length;
    const _ceiling = lineup.reduce((sum, p) => sum + p.ceiling, 0);
    const _floor = lineup.reduce((sum, p) => sum + p.floor, 0);

    // @ts-expect-error TS(2739): Type '{ lineup: Player[]; totalSalary: number; pro... Remove this comment to see the full error message
    return {
      lineup,
      totalSalary,
      projectedPoints,
      ownership,
      ceiling,
      floor,
      variance: ceiling - floor,
      correlation: 0.85, // Would calculate actual correlation
      uniqueness: 100 - ownership,
      confidence: 88,
    };
  };

  const _togglePlayerLock = (playerId: string) => {
    const _newLocked = new Set(lockedPlayers);
    if (newLocked.has(playerId)) {
      newLocked.delete(playerId);
    } else {
      newLocked.add(playerId);
      excludedPlayers.delete(playerId);
    }
    setLockedPlayers(newLocked);
  };

  const _togglePlayerExclude = (playerId: string) => {
    const _newExcluded = new Set(excludedPlayers);
    if (newExcluded.has(playerId)) {
      newExcluded.delete(playerId);
    } else {
      newExcluded.add(playerId);
      lockedPlayers.delete(playerId);
    }
    setExcludedPlayers(newExcluded);
  };

  const _getPlayerStatusColor = (player: Player) => {
    if (lockedPlayers.has(player.id)) return 'border-green-400 bg-green-400/10';
    if (excludedPlayers.has(player.id)) return 'border-red-400 bg-red-400/10';
    return 'border-slate-700/50 bg-slate-900/50';
  };

  const _getPlayerStatusIcon = (player: Player) => {
    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    if (lockedPlayers.has(player.id)) return <Lock className='w-4 h-4 text-green-400' />;
    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    if (excludedPlayers.has(player.id)) return <Unlock className='w-4 h-4 text-red-400' />;
    return null;
  };

  const _getTierColor = (tier: string) => {
    switch (tier) {
      case 'elite':
        return 'text-purple-400 bg-purple-400/20';
      case 'solid':
        return 'text-blue-400 bg-blue-400/20';
      case 'value':
        return 'text-green-400 bg-green-400/20';
      case 'punt':
        return 'text-gray-400 bg-gray-400/20';
      default:
        return 'text-gray-400 bg-gray-400/20';
    }
  };

  const _filteredPlayers = players.filter(player => {
    const _matchesSearch =
      searchQuery === '' ||
      player.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      player.team.toLowerCase().includes(searchQuery.toLowerCase());

    const _matchesPosition = filterPosition === 'all' || player.position === filterPosition;

    return matchesSearch && matchesPosition;
  });

  const _sortedPlayers = [...filteredPlayers].sort((a, b) => {
    switch (sortBy) {
      case 'value':
        return b.value - a.value;
      case 'salary':
        return b.salary - a.salary;
      case 'projection':
        return b.projectedPoints - a.projectedPoints;
      case 'ownership':
        return a.ownership - b.ownership;
      default:
        return 0;
    }
  });

  const _currentLineupSalary = currentLineup.reduce((sum, p) => sum + p.salary, 0);
  const _currentLineupPoints = currentLineup.reduce((sum, p) => sum + p.projectedPoints, 0);
  const _remainingSalary = selectedContest ? selectedContest.salaryCap - currentLineupSalary : 0;

  return (
    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <Layout
      title='Lineup Builder'
      subtitle='AI-Powered Daily Fantasy Optimization • Contest Strategy Engine'
      headerActions={
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <div className='flex items-center space-x-3'>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <select
            value={selectedContest?.id || ''}
            onChange={e => {
              const _contest = availableContests.find(c => c.id === e.target.value);
              setSelectedContest(contest || null);
            }}
            className='px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white text-sm focus:outline-none focus:border-cyan-400'
          >
            {availableContests.map(contest => (
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <option key={contest.id} value={contest.id}>
                {contest.name} (${contest.entryFee})
              </option>
            ))}
          </select>

          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <button
            onClick={optimizeLineup}
            disabled={isOptimizing || !selectedContest}
            className='flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 rounded-lg text-white font-medium transition-all disabled:opacity-50'
          >
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <Brain className={`w-4 h-4 ${isOptimizing ? 'animate-pulse' : ''}`} />
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <span>{isOptimizing ? 'Optimizing...' : 'Optimize'}</span>
          </button>
        </div>
      }
    >
      {/* Contest Info & Current Lineup Stats */}
      {selectedContest && (
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className='grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8'
        >
          {/* Contest Details */}
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div className='bg-slate-800/50 backdrop-blur-lg border border-slate-700/50 rounded-xl p-6'>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <h3 className='text-lg font-bold text-white mb-4'>{selectedContest.name}</h3>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div className='space-y-3'>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <div className='flex justify-between'>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <span className='text-gray-400'>Entry Fee:</span>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <span className='text-white font-bold'>${selectedContest.entryFee}</span>
              </div>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <div className='flex justify-between'>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <span className='text-gray-400'>Total Prizes:</span>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <span className='text-green-400 font-bold'>
                  ${selectedContest.totalPrizes.toLocaleString()}
                </span>
              </div>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <div className='flex justify-between'>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <span className='text-gray-400'>Entries:</span>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <span className='text-white'>
                  {selectedContest.entries.toLocaleString()} /{' '}
                  {selectedContest.maxEntries.toLocaleString()}
                </span>
              </div>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <div className='flex justify-between'>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <span className='text-gray-400'>Salary Cap:</span>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <span className='text-white font-bold'>
                  ${selectedContest.salaryCap.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Current Lineup Stats */}
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div className='bg-slate-800/50 backdrop-blur-lg border border-slate-700/50 rounded-xl p-6'>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <h3 className='text-lg font-bold text-white mb-4'>Lineup Stats</h3>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div className='space-y-3'>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <div className='flex justify-between'>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <span className='text-gray-400'>Total Salary:</span>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <span
                  className={`font-bold ${currentLineupSalary > selectedContest.salaryCap ? 'text-red-400' : 'text-white'}`}
                >
                  ${currentLineupSalary.toLocaleString()}
                </span>
              </div>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <div className='flex justify-between'>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <span className='text-gray-400'>Remaining:</span>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <span
                  className={`font-bold ${remainingSalary < 0 ? 'text-red-400' : 'text-green-400'}`}
                >
                  ${remainingSalary.toLocaleString()}
                </span>
              </div>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <div className='flex justify-between'>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <span className='text-gray-400'>Projected:</span>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <span className='text-purple-400 font-bold'>
                  {currentLineupPoints.toFixed(1)} pts
                </span>
              </div>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <div className='flex justify-between'>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <span className='text-gray-400'>Players:</span>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <span className='text-white'>
                  {currentLineup.length} /{' '}
                  {Object.values(selectedContest.positions).reduce((a, b) => a + b, 0)}
                </span>
              </div>
            </div>
          </div>

          {/* Strategy Settings */}
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div className='bg-slate-800/50 backdrop-blur-lg border border-slate-700/50 rounded-xl p-6'>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <h3 className='text-lg font-bold text-white mb-4'>Strategy</h3>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <select
              value={selectedStrategy?.id || ''}
              onChange={e => {
                const _strategy = strategies.find(s => s.id === e.target.value);
                setSelectedStrategy(strategy || null);
              }}
              className='w-full px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white text-sm focus:outline-none focus:border-cyan-400 mb-4'
            >
              {strategies.map(strategy => (
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <option key={strategy.id} value={strategy.id}>
                  {strategy.name}
                </option>
              ))}
            </select>

            {selectedStrategy && (
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <div className='space-y-2'>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <p className='text-gray-400 text-sm'>{selectedStrategy.description}</p>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <div className='flex items-center justify-between text-xs'>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <span className='text-gray-400'>Variance:</span>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <span
                    className={`px-2 py-1 rounded ${
                      selectedStrategy.settings.varianceTarget === 'high'
                        ? 'bg-red-400/20 text-red-400'
                        : selectedStrategy.settings.varianceTarget === 'medium'
                          ? 'bg-yellow-400/20 text-yellow-400'
                          : 'bg-green-400/20 text-green-400'
                    }`}
                  >
                    {selectedStrategy.settings.varianceTarget.toUpperCase()}
                  </span>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Player Pool */}
      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
        {/* Player List */}
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <div className='lg:col-span-2'>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className='bg-slate-800/50 backdrop-blur-lg border border-slate-700/50 rounded-xl p-6'
          >
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div className='flex items-center justify-between mb-6'>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <div>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <h3 className='text-xl font-bold text-white'>Player Pool</h3>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <p className='text-gray-400 text-sm'>Select and lock players for optimization</p>
              </div>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <Users className='w-5 h-5 text-purple-400' />
            </div>

            {/* Filters */}
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div className='flex items-center space-x-4 mb-6'>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <div className='relative flex-1'>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400' />
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <input
                  type='text'
                  placeholder='Search players...'
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className='w-full pl-10 pr-4 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white text-sm focus:outline-none focus:border-cyan-400'
                />
              </div>

              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <select
                value={filterPosition}
                onChange={e => setFilterPosition(e.target.value)}
                className='px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white text-sm focus:outline-none focus:border-cyan-400'
              >
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <option value='all'>All Positions</option>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <option value='QB'>QB</option>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <option value='RB'>RB</option>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <option value='WR'>WR</option>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <option value='TE'>TE</option>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <option value='DST'>DST</option>
              </select>

              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value as unknown)}
                className='px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white text-sm focus:outline-none focus:border-cyan-400'
              >
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <option value='value'>Value</option>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <option value='salary'>Salary</option>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <option value='projection'>Projection</option>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <option value='ownership'>Ownership</option>
              </select>
            </div>

            {/* Player List */}
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div className='space-y-3 max-h-96 overflow-y-auto'>
              {sortedPlayers.map((player, index) => (
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <motion.div
                  key={player.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + index * 0.05 }}
                  className={`p-4 rounded-lg border cursor-pointer transition-all ${getPlayerStatusColor(player)}`}
                  onClick={() => {
                    if (currentLineup.includes(player)) {
                      setCurrentLineup(current => current.filter(p => p.id !== player.id));
                    } else {
                      setCurrentLineup(current => [...current, player]);
                    }
                  }}
                >
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <div className='flex items-center justify-between mb-2'>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <div className='flex items-center space-x-3'>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <div>
                        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                        <h4 className='font-bold text-white'>{player.name}</h4>
                        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                        <div className='flex items-center space-x-2 text-sm text-gray-400'>
                          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                          <span>{player.team}</span>
                          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                          <span>•</span>
                          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                          <span>{player.position}</span>
                          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                          <span>•</span>
                          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                          <span>{player.matchup}</span>
                        </div>
                      </div>
                    </div>

                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <div className='flex items-center space-x-4'>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <div className='text-right'>
                        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                        <div className='text-white font-bold'>
                          ${player.salary.toLocaleString()}
                        </div>
                        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                        <div className='text-purple-400 text-sm'>
                          {player.projectedPoints.toFixed(1)} pts
                        </div>
                      </div>

                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <div className='flex items-center space-x-2'>
                        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            togglePlayerLock(player.id);
                          }}
                          className={`p-1 rounded ${lockedPlayers.has(player.id) ? 'text-green-400' : 'text-gray-400 hover:text-green-400'}`}
                        >
                          {lockedPlayers.has(player.id) ? (
                            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                            <Lock className='w-4 h-4' />
                          ) : (
                            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                            <Unlock className='w-4 h-4' />
                          )}
                        </button>

                        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            togglePlayerExclude(player.id);
                          }}
                          className={`p-1 rounded ${excludedPlayers.has(player.id) ? 'text-red-400' : 'text-gray-400 hover:text-red-400'}`}
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  </div>

                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <div className='flex items-center justify-between'>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <div className='flex items-center space-x-2'>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <span className={`px-2 py-1 rounded text-xs ${getTierColor(player.tier)}`}>
                        {player.tier.toUpperCase()}
                      </span>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <span className='text-xs text-gray-400'>
                        {player.ownership.toFixed(1)}% owned
                      </span>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <span className='text-xs text-cyan-400'>
                        {player.value.toFixed(2)}x value
                      </span>
                    </div>

                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <div className='flex items-center space-x-1'>
                      {player.tags.slice(0, 2).map((tag, idx) => (
                        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                        <span
                          key={idx}
                          className='px-1 py-0.5 bg-slate-700/50 text-xs text-gray-300 rounded'
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Current Lineup */}
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <div>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className='bg-slate-800/50 backdrop-blur-lg border border-slate-700/50 rounded-xl p-6'
          >
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div className='flex items-center justify-between mb-6'>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <div>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <h3 className='text-xl font-bold text-white'>Current Lineup</h3>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <p className='text-gray-400 text-sm'>Optimized player selection</p>
              </div>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <Trophy className='w-5 h-5 text-yellow-400' />
            </div>

            {/* Lineup Display */}
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div className='space-y-3'>
              {selectedContest &&
                Object.entries(selectedContest.positions).map(([position, count]) => {
                  const _positionPlayers = currentLineup.filter(p => p.position === position);

                  return (
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <div key={position} className='space-y-2'>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <h4 className='text-sm font-bold text-gray-300'>
                        {position} ({positionPlayers.length}/{count})
                      </h4>

                      {Array.from({ length: count }).map((_, idx) => {
                        const _player = positionPlayers[idx];

                        return (
                          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                          <div
                            key={`${position}-${idx}`}
                            className={`p-3 rounded-lg border ${
                              player
                                ? 'border-purple-400/50 bg-purple-400/10'
                                : 'border-slate-700/50 bg-slate-900/50 border-dashed'
                            }`}
                          >
                            {player ? (
                              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                              <div>
                                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                                <div className='font-medium text-white'>{player.name}</div>
                                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                                <div className='flex justify-between text-xs text-gray-400'>
                                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                                  <span>{player.team}</span>
                                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                                  <span>${player.salary.toLocaleString()}</span>
                                </div>
                                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                                <div className='text-xs text-purple-400'>
                                  {player.projectedPoints.toFixed(1)} pts
                                </div>
                              </div>
                            ) : (
                              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                              <div className='text-center text-gray-500 text-sm py-2'>
                                Select {position}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
            </div>

            {/* Lineup Actions */}
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div className='mt-6 space-y-3'>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <button
                onClick={() => setCurrentLineup([])}
                className='w-full flex items-center justify-center space-x-2 px-4 py-2 bg-slate-700/50 hover:bg-slate-600/50 rounded-lg text-white transition-all'
              >
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <RotateCcw className='w-4 h-4' />
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <span>Clear Lineup</span>
              </button>

              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <button
                onClick={() => {
                  /* Export lineup logic */
                }}
                className='w-full flex items-center justify-center space-x-2 px-4 py-2 bg-green-600/20 hover:bg-green-600/30 border border-green-500/50 rounded-lg text-green-400 transition-all'
              >
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <Download className='w-4 h-4' />
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <span>Export CSV</span>
              </button>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Optimization Results */}
      {optimizedLineups.length > 0 && (
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className='mt-8 bg-slate-800/50 backdrop-blur-lg border border-slate-700/50 rounded-xl p-6'
        >
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div className='flex items-center justify-between mb-6'>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <h3 className='text-xl font-bold text-white'>Optimization Results</h3>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <p className='text-gray-400 text-sm'>AI-generated lineup analysis</p>
            </div>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <BarChart3 className='w-5 h-5 text-green-400' />
          </div>

          {optimizedLineups.map((optimization, index) => (
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div key={index} className='border border-slate-700/50 rounded-lg p-4'>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <div className='grid grid-cols-2 md:grid-cols-4 gap-4 mb-4'>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <div className='text-center'>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <div className='text-2xl font-bold text-purple-400'>
                    {optimization.projectedPoints.toFixed(1)}
                  </div>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <div className='text-xs text-gray-400'>Projected Points</div>
                </div>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <div className='text-center'>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <div className='text-2xl font-bold text-green-400'>
                    {optimization.uniqueness.toFixed(1)}%
                  </div>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <div className='text-xs text-gray-400'>Uniqueness</div>
                </div>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <div className='text-center'>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <div className='text-2xl font-bold text-cyan-400'>
                    {optimization.ceiling.toFixed(1)}
                  </div>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <div className='text-xs text-gray-400'>Ceiling</div>
                </div>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <div className='text-center'>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <div className='text-2xl font-bold text-yellow-400'>
                    {optimization.confidence}%
                  </div>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <div className='text-xs text-gray-400'>Confidence</div>
                </div>
              </div>

              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <button
                onClick={() => setCurrentLineup(optimization.lineup)}
                className='w-full px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 rounded-lg text-white font-medium transition-all'
              >
                Use This Lineup
              </button>
            </div>
          ))}
        </motion.div>
      )}
    </Layout>
  );
};

export default LineupBuilder;
