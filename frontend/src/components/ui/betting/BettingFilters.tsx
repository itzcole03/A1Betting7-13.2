import { motion } from 'framer-motion';
import { ChevronDown, Filter, X } from 'lucide-react';
import React, { useState } from 'react';

export interface FilterOption {
  value: string;
  label: string;
  count?: number;
}

export interface BettingFiltersProps {
  sports?: FilterOption[];
  markets?: FilterOption[];
  timeRanges?: FilterOption[];
  onFiltersChange?: (filters: BettingFilters) => void;
  className?: string;
}

export interface BettingFilters {
  sport: string;
  market: string;
  timeRange: string;
  minOdds?: number;
  maxOdds?: number;
  minConfidence?: number;
  status?: string;
}

const _defaultSports: FilterOption[] = [
  { value: 'all', label: 'All Sports', count: 247 },
  { value: 'nfl', label: 'NFL', count: 89 },
  { value: 'nba', label: 'NBA', count: 156 },
  { value: 'mlb', label: 'MLB', count: 78 },
  { value: 'nhl', label: 'NHL', count: 45 },
  { value: 'soccer', label: 'Soccer', count: 234 },
];

const _defaultMarkets: FilterOption[] = [
  { value: 'all', label: 'All Markets', count: 547 },
  { value: 'moneyline', label: 'Moneyline', count: 189 },
  { value: 'spread', label: 'Point Spread', count: 167 },
  { value: 'total', label: 'Over/Under', count: 134 },
  { value: 'props', label: 'Player Props', count: 89 },
  { value: 'futures', label: 'Futures', count: 23 },
];

const _defaultTimeRanges: FilterOption[] = [
  { value: '1h', label: 'Last Hour' },
  { value: '24h', label: 'Last 24 Hours' },
  { value: '7d', label: 'Last 7 Days' },
  { value: '30d', label: 'Last 30 Days' },
  { value: 'all', label: 'All Time' },
];

export const _BettingFilters: React.FC<BettingFiltersProps> = ({
  sports = defaultSports,
  markets = defaultMarkets,
  timeRanges = defaultTimeRanges,
  onFiltersChange,
  className = '',
}) => {
  const [filters, setFilters] = useState<BettingFilters>({
    sport: 'all',
    market: 'all',
    timeRange: '24h',
    minOdds: undefined,
    maxOdds: undefined,
    minConfidence: 70,
    status: 'all',
  });

  const [isExpanded, setIsExpanded] = useState(false);
  const [activeFilters, setActiveFilters] = useState(0);

  const _handleFilterChange = (key: keyof BettingFilters, value: unknown) => {
    const _newFilters = { ...filters, [key]: value };
    setFilters(newFilters);

    // Count active filters (non-default values)
    const _active = Object.entries(newFilters).filter(([k, v]) => {
      if (k === 'sport' || k === 'market') return v !== 'all';
      if (k === 'timeRange') return v !== '24h';
      if (k === 'status') return v !== 'all';
      return v !== undefined && v !== null && v !== '';
    }).length;

    setActiveFilters(active);
    onFiltersChange?.(newFilters);
  };

  const _clearFilters = () => {
    const _defaultFilters: BettingFilters = {
      sport: 'all',
      market: 'all',
      timeRange: '24h',
      minOdds: undefined,
      maxOdds: undefined,
      minConfidence: 70,
      status: 'all',
    };
    setFilters(defaultFilters);
    setActiveFilters(0);
    onFiltersChange?.(defaultFilters);
  };

  const _containerVariants = {
    collapsed: { height: 'auto' },
    expanded: { height: 'auto' },
  };

  const _contentVariants = {
    collapsed: { opacity: 0, height: 0 },
    expanded: { opacity: 1, height: 'auto' },
  };

  return (
    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <motion.div
      className={`bg-slate-800/50 backdrop-blur-lg border border-slate-700/50 rounded-xl p-4 ${className}`}
      variants={containerVariants}
      initial='collapsed'
      animate={isExpanded ? 'expanded' : 'collapsed'}
    >
      {/* Header */}
      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <div className='flex items-center justify-between mb-4'>
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <div className='flex items-center space-x-3'>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <Filter className='w-5 h-5 text-cyan-400' />
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <h3 className='text-lg font-semibold text-white'>Filters</h3>
          {activeFilters > 0 && (
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <span className='px-2 py-1 bg-cyan-500/20 text-cyan-400 rounded-full text-xs font-medium'>
              {activeFilters} active
            </span>
          )}
        </div>

        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <div className='flex items-center space-x-2'>
          {activeFilters > 0 && (
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <button
              onClick={clearFilters}
              className='flex items-center space-x-1 px-3 py-1 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors text-sm'
            >
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <X className='w-3 h-3' />
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <span>Clear</span>
            </button>
          )}
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className='flex items-center space-x-1 px-3 py-1 bg-slate-700/50 text-white rounded-lg hover:bg-slate-700 transition-colors'
          >
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <span className='text-sm'>{isExpanded ? 'Less' : 'More'}</span>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <ChevronDown
              className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            />
          </button>
        </div>
      </div>

      {/* Basic Filters */}
      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mb-4'>
        {/* Sport Filter */}
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <div>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <label htmlFor='filter-sport' className='block text-sm font-medium text-gray-300 mb-2'>
            Sport
          </label>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <select
            id='filter-sport'
            value={filters.sport}
            onChange={e => handleFilterChange('sport', e.target.value)}
            className='w-full px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white focus:outline-none focus:border-cyan-400'
          >
            {sports.map(sport => (
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <option key={sport.value} value={sport.value}>
                {sport.label} {sport.count && `(${sport.count})`}
              </option>
            ))}
          </select>
        </div>

        {/* Market Filter */}
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <div>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <label htmlFor='filter-market' className='block text-sm font-medium text-gray-300 mb-2'>
            Market
          </label>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <select
            id='filter-market'
            value={filters.market}
            onChange={e => handleFilterChange('market', e.target.value)}
            className='w-full px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white focus:outline-none focus:border-cyan-400'
          >
            {markets.map(market => (
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <option key={market.value} value={market.value}>
                {market.label} {market.count && `(${market.count})`}
              </option>
            ))}
          </select>
        </div>

        {/* Time Range Filter */}
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <div>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <label
            htmlFor='filter-time-range'
            className='block text-sm font-medium text-gray-300 mb-2'
          >
            Time Range
          </label>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <select
            id='filter-time-range'
            value={filters.timeRange}
            onChange={e => handleFilterChange('timeRange', e.target.value)}
            className='w-full px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white focus:outline-none focus:border-cyan-400'
          >
            {timeRanges.map(range => (
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <option key={range.value} value={range.value}>
                {range.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Advanced Filters */}
      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <motion.div
        variants={contentVariants}
        initial='collapsed'
        animate={isExpanded ? 'expanded' : 'collapsed'}
        transition={{ duration: 0.3 }}
        className='overflow-hidden'
      >
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <div className='border-t border-slate-700/50 pt-4'>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <h4 className='text-sm font-medium text-gray-300 mb-3'>Advanced Filters</h4>

          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
            {/* Odds Range */}
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <label
                htmlFor='filter-min-odds'
                className='block text-sm font-medium text-gray-300 mb-2'
              >
                Min Odds
              </label>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <input
                id='filter-min-odds'
                type='number'
                step='0.01'
                placeholder='1.50'
                value={filters.minOdds || ''}
                onChange={e =>
                  handleFilterChange(
                    'minOdds',
                    e.target.value ? parseFloat(e.target.value) : undefined
                  )
                }
                className='w-full px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white focus:outline-none focus:border-cyan-400'
              />
            </div>

            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <label
                htmlFor='filter-max-odds'
                className='block text-sm font-medium text-gray-300 mb-2'
              >
                Max Odds
              </label>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <input
                id='filter-max-odds'
                type='number'
                step='0.01'
                placeholder='5.00'
                value={filters.maxOdds || ''}
                onChange={e =>
                  handleFilterChange(
                    'maxOdds',
                    e.target.value ? parseFloat(e.target.value) : undefined
                  )
                }
                className='w-full px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white focus:outline-none focus:border-cyan-400'
              />
            </div>

            {/* Confidence */}
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <label
                htmlFor='filter-min-confidence'
                className='block text-sm font-medium text-gray-300 mb-2'
              >
                Min Confidence ({filters.minConfidence}%)
              </label>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <input
                id='filter-min-confidence'
                type='range'
                min='0'
                max='100'
                value={filters.minConfidence || 70}
                onChange={e => handleFilterChange('minConfidence', parseInt(e.target.value))}
                className='w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer slider'
              />
            </div>

            {/* Status */}
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <label
                htmlFor='filter-status'
                className='block text-sm font-medium text-gray-300 mb-2'
              >
                Status
              </label>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <select
                id='filter-status'
                value={filters.status || 'all'}
                onChange={e => handleFilterChange('status', e.target.value)}
                className='w-full px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white focus:outline-none focus:border-cyan-400'
              >
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <option value='all'>All Status</option>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <option value='active'>Active</option>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <option value='settled'>Settled</option>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <option value='pending'>Pending</option>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <option value='cancelled'>Cancelled</option>
              </select>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default BettingFilters;
