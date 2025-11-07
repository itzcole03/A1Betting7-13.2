import { motion } from 'framer-motion';
import { ChevronDown, Filter, X } from 'lucide-react';
import React, { useState } from 'react';

import { cn } from '@/lib/utils';

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

const defaultSports: FilterOption[] = [
  { value: 'all', label: 'All Sports', count: 247 },
  { value: 'nfl', label: 'NFL', count: 89 },
  { value: 'nba', label: 'NBA', count: 156 },
  { value: 'mlb', label: 'MLB', count: 78 },
  { value: 'nhl', label: 'NHL', count: 45 },
  { value: 'soccer', label: 'Soccer', count: 234 },
];

const defaultMarkets: FilterOption[] = [
  { value: 'all', label: 'All Markets', count: 547 },
  { value: 'moneyline', label: 'Moneyline', count: 189 },
  { value: 'spread', label: 'Point Spread', count: 167 },
  { value: 'total', label: 'Over/Under', count: 134 },
  { value: 'props', label: 'Player Props', count: 89 },
  { value: 'futures', label: 'Futures', count: 23 },
];

const defaultTimeRanges: FilterOption[] = [
  { value: '1h', label: 'Last Hour' },
  { value: '24h', label: 'Last 24 Hours' },
  { value: '7d', label: 'Last 7 Days' },
  { value: '30d', label: 'Last 30 Days' },
  { value: 'all', label: 'All Time' },
];

const DEFAULT_FILTER_VALUES: BettingFilters = {
  sport: 'all',
  market: 'all',
  timeRange: '24h',
  minOdds: undefined,
  maxOdds: undefined,
  minConfidence: 70,
  status: 'all',
};

const createDefaultFilters = (): BettingFilters => ({ ...DEFAULT_FILTER_VALUES });

const containerVariants = {
  collapsed: { height: 'auto' },
  expanded: { height: 'auto' },
};

const contentVariants = {
  collapsed: { opacity: 0, height: 0 },
  expanded: { opacity: 1, height: 'auto' },
};

const calculateActiveFilters = (filters: BettingFilters): number => {
  return Object.entries(filters).reduce((count, [key, value]) => {
    if (value === undefined || value === null || value === '') {
      return count;
    }

    if (key === 'sport' || key === 'market') {
      return value !== 'all' ? count + 1 : count;
    }

    if (key === 'timeRange') {
      return value !== '24h' ? count + 1 : count;
    }

    if (key === 'status') {
      return value !== 'all' ? count + 1 : count;
    }

    if (key === 'minConfidence') {
      return value !== 70 ? count + 1 : count;
    }

    return count + 1;
  }, 0);
};

export const BettingFilters: React.FC<BettingFiltersProps> = ({
  sports = defaultSports,
  markets = defaultMarkets,
  timeRanges = defaultTimeRanges,
  onFiltersChange,
  className,
}) => {
  const [filters, setFilters] = useState<BettingFilters>(() => createDefaultFilters());
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeFilters, setActiveFilters] = useState(() =>
    calculateActiveFilters(DEFAULT_FILTER_VALUES)
  );

  const handleFilterChange = <K extends keyof BettingFilters>(key: K, value: BettingFilters[K]) => {
    const nextFilters = { ...filters, [key]: value };
    setFilters(nextFilters);

    const nextActive = calculateActiveFilters(nextFilters);
    setActiveFilters(nextActive);
    onFiltersChange?.(nextFilters);
  };

  const clearFilters = () => {
    const resetFilters = createDefaultFilters();
    setFilters(resetFilters);
    setActiveFilters(calculateActiveFilters(resetFilters));
    onFiltersChange?.(resetFilters);
  };

  const handleOddsChange = (
    key: 'minOdds' | 'maxOdds'
  ): ((event: React.ChangeEvent<HTMLInputElement>) => void) => {
    return event => {
      const { value } = event.target;
      const numericValue = value ? Number.parseFloat(value) : undefined;
      const normalizedValue =
        numericValue !== undefined && Number.isFinite(numericValue) ? numericValue : undefined;
      handleFilterChange(key, normalizedValue as BettingFilters[typeof key]);
    };
  };

  return (
    <motion.div
      className={cn(
        'rounded-xl border border-slate-700/50 bg-slate-800/50 p-4 backdrop-blur-lg',
        className
      )}
      variants={containerVariants}
      initial='collapsed'
      animate={isExpanded ? 'expanded' : 'collapsed'}
    >
      <div className='mb-4 flex items-center justify-between'>
        <div className='flex items-center space-x-3'>
          <Filter className='h-5 w-5 text-cyan-400' />
          <h3 className='text-lg font-semibold text-white'>Filters</h3>
          {activeFilters > 0 && (
            <span className='rounded-full bg-cyan-500/20 px-2 py-1 text-xs font-medium text-cyan-400'>
              {activeFilters} active
            </span>
          )}
        </div>

        <div className='flex items-center space-x-2'>
          {activeFilters > 0 && (
            <button
              onClick={clearFilters}
              className='flex items-center space-x-1 rounded-lg bg-red-500/20 px-3 py-1 text-sm text-red-400 transition-colors hover:bg-red-500/30'
              type='button'
            >
              <X className='h-3 w-3' />
              <span>Clear</span>
            </button>
          )}
          <button
            onClick={() => setIsExpanded(previous => !previous)}
            className='flex items-center space-x-1 rounded-lg bg-slate-700/50 px-3 py-1 text-white transition-colors hover:bg-slate-700'
            type='button'
          >
            <span className='text-sm'>{isExpanded ? 'Less' : 'More'}</span>
            <ChevronDown
              className={cn('h-4 w-4 transition-transform', isExpanded && 'rotate-180')}
            />
          </button>
        </div>
      </div>

      <div className='mb-4 grid grid-cols-1 gap-4 md:grid-cols-3'>
        <div>
          <label htmlFor='filter-sport' className='mb-2 block text-sm font-medium text-gray-300'>
            Sport
          </label>
          <select
            id='filter-sport'
            value={filters.sport}
            onChange={event => handleFilterChange('sport', event.target.value)}
            className='w-full rounded-lg border border-slate-600/50 bg-slate-700/50 px-3 py-2 text-white focus:border-cyan-400 focus:outline-none'
          >
            {sports.map(sport => (
              <option key={sport.value} value={sport.value}>
                {sport.label}
                {sport.count ? ` (${sport.count})` : ''}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor='filter-market' className='mb-2 block text-sm font-medium text-gray-300'>
            Market
          </label>
          <select
            id='filter-market'
            value={filters.market}
            onChange={event => handleFilterChange('market', event.target.value)}
            className='w-full rounded-lg border border-slate-600/50 bg-slate-700/50 px-3 py-2 text-white focus:border-cyan-400 focus:outline-none'
          >
            {markets.map(market => (
              <option key={market.value} value={market.value}>
                {market.label}
                {market.count ? ` (${market.count})` : ''}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor='filter-time-range'
            className='mb-2 block text-sm font-medium text-gray-300'
          >
            Time Range
          </label>
          <select
            id='filter-time-range'
            value={filters.timeRange}
            onChange={event => handleFilterChange('timeRange', event.target.value)}
            className='w-full rounded-lg border border-slate-600/50 bg-slate-700/50 px-3 py-2 text-white focus:border-cyan-400 focus:outline-none'
          >
            {timeRanges.map(range => (
              <option key={range.value} value={range.value}>
                {range.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <motion.div
        variants={contentVariants}
        initial='collapsed'
        animate={isExpanded ? 'expanded' : 'collapsed'}
        transition={{ duration: 0.3 }}
        className='overflow-hidden'
      >
        <div className='border-t border-slate-700/50 pt-4'>
          <h4 className='mb-3 text-sm font-medium text-gray-300'>Advanced Filters</h4>

          <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4'>
            <div>
              <label
                htmlFor='filter-min-odds'
                className='mb-2 block text-sm font-medium text-gray-300'
              >
                Min Odds
              </label>
              <input
                id='filter-min-odds'
                type='number'
                step='0.01'
                placeholder='1.50'
                value={filters.minOdds ?? ''}
                onChange={handleOddsChange('minOdds')}
                className='w-full rounded-lg border border-slate-600/50 bg-slate-700/50 px-3 py-2 text-white focus:border-cyan-400 focus:outline-none'
              />
            </div>

            <div>
              <label
                htmlFor='filter-max-odds'
                className='mb-2 block text-sm font-medium text-gray-300'
              >
                Max Odds
              </label>
              <input
                id='filter-max-odds'
                type='number'
                step='0.01'
                placeholder='5.00'
                value={filters.maxOdds ?? ''}
                onChange={handleOddsChange('maxOdds')}
                className='w-full rounded-lg border border-slate-600/50 bg-slate-700/50 px-3 py-2 text-white focus:border-cyan-400 focus:outline-none'
              />
            </div>

            <div>
              <label
                htmlFor='filter-min-confidence'
                className='mb-2 block text-sm font-medium text-gray-300'
              >
                Min Confidence ({filters.minConfidence ?? DEFAULT_FILTER_VALUES.minConfidence}%)
              </label>
              <input
                id='filter-min-confidence'
                type='range'
                min='0'
                max='100'
                value={filters.minConfidence ?? DEFAULT_FILTER_VALUES.minConfidence}
                onChange={event =>
                  handleFilterChange('minConfidence', Number.parseInt(event.target.value, 10))
                }
                className='slider h-2 w-full cursor-pointer appearance-none rounded-lg bg-slate-700'
              />
            </div>

            <div>
              <label
                htmlFor='filter-status'
                className='mb-2 block text-sm font-medium text-gray-300'
              >
                Status
              </label>
              <select
                id='filter-status'
                value={filters.status ?? 'all'}
                onChange={event => handleFilterChange('status', event.target.value)}
                className='w-full rounded-lg border border-slate-600/50 bg-slate-700/50 px-3 py-2 text-white focus:border-cyan-400 focus:outline-none'
              >
                <option value='all'>All Status</option>
                <option value='active'>Active</option>
                <option value='settled'>Settled</option>
                <option value='pending'>Pending</option>
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
