import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Filter,
  Search,
  X,
  Calendar,
  Clock,
  DollarSign,
  TrendingUp,
  Star,
  Users,
  Target,
  Zap,
  BarChart3,
  ChevronDown,
  RefreshCw,
  Bookmark,
  Settings,
} from 'lucide-react';
import {
  SPORTS_CONFIG,
  SPORT_CATEGORIES,
  SEASON_FILTERS,
  getSportById,
  getSportDisplayName,
  getSportColor,
} from '../../constants/sports';

export interface FilterState {
  sports: string[];
  categories: string[];
  seasons: string[];
  dateRange: {
    start: Date | null;
    end: Date | null;
  };
  markets: string[];
  minOdds: number | null;
  maxOdds: number | null;
  minValue: number | null;
  maxValue: number | null;
  search: string;
  favoriteOnly: boolean;
  liveOnly: boolean;
  fantasyOnly: boolean;
  sortBy: 'value' | 'odds' | 'time' | 'alphabetical' | 'popularity';
  sortOrder: 'asc' | 'desc';
  tags: string[];
}

interface AdvancedFiltersProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  onSavePreset?: (name: string, filters: FilterState) => void;
  onLoadPreset?: (filters: FilterState) => void;
  presets?: Array<{ name: string; filters: FilterState }>;
  isOpen: boolean;
  onToggle: () => void;
  resultCount?: number;
  isLoading?: boolean;
}

const MARKET_TYPES = [
  'Moneyline',
  'Spread',
  'Total',
  'Player Props',
  'Futures',
  'Live',
  'Period Betting',
  'Head-to-Head',
  'Special Props',
  'Team Props',
  'Game Props',
  'Season Props',
];

const SORT_OPTIONS = [
  { value: 'value', label: 'Best Value' },
  { value: 'odds', label: 'Odds' },
  { value: 'time', label: 'Game Time' },
  { value: 'alphabetical', label: 'Alphabetical' },
  { value: 'popularity', label: 'Popularity' },
];

const POPULAR_TAGS = [
  'High Value',
  'Live Betting',
  'Prime Time',
  'Rivalry Game',
  'Playoff Game',
  'Home Favorite',
  'Road Dog',
  'Low Total',
  'High Total',
  'Sharp Money',
  'Public Bet',
  'Weather Game',
  'Injury Impact',
  'Back-to-Back',
  'Rest Advantage',
];

const AdvancedFilters: React.FC<AdvancedFiltersProps> = ({
  filters,
  onFiltersChange,
  onSavePreset,
  onLoadPreset,
  presets = [],
  isOpen,
  onToggle,
  resultCount = 0,
  isLoading = false,
}) => {
  const [activeTab, setActiveTab] = useState<'basic' | 'advanced' | 'presets'>('basic');
  const [presetName, setPresetName] = useState('');
  const [showSavePreset, setShowSavePreset] = useState(false);

  const updateFilter = <K extends keyof FilterState>(key: K, value: FilterState[K]) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const toggleArrayFilter = <T extends string>(
    key: keyof FilterState,
    value: T,
    currentArray: T[]
  ) => {
    const newArray = currentArray.includes(value)
      ? currentArray.filter(item => item !== value)
      : [...currentArray, value];
    updateFilter(key as keyof FilterState, newArray as FilterState[keyof FilterState]);
  };

  const clearAllFilters = () => {
    const defaultFilters: FilterState = {
      sports: [],
      categories: [],
      seasons: [],
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
    };
    onFiltersChange(defaultFilters);
  };

  const savePreset = () => {
    if (presetName.trim() && onSavePreset) {
      onSavePreset(presetName.trim(), filters);
      setPresetName('');
      setShowSavePreset(false);
      setActiveTab('presets');
    }
  };

  const getActiveFilterCount = (): number => {
    let count = 0;
    if (filters.sports.length > 0) count++;
    if (filters.categories.length > 0) count++;
    if (filters.seasons.length > 0) count++;
    if (filters.dateRange.start || filters.dateRange.end) count++;
    if (filters.markets.length > 0) count++;
    if (filters.minOdds !== null || filters.maxOdds !== null) count++;
    if (filters.minValue !== null || filters.maxValue !== null) count++;
    if (filters.search.trim()) count++;
    if (filters.favoriteOnly) count++;
    if (filters.liveOnly) count++;
    if (filters.fantasyOnly) count++;
    if (filters.tags.length > 0) count++;
    return count;
  };

  const FilterChip: React.FC<{
    label: string;
    onRemove: () => void;
    color?: string;
  }> = ({ label, onRemove, color = '#06ffa5' }) => (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      className='flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-medium border'
      style={{
        backgroundColor: `${color}20`,
        borderColor: `${color}50`,
        color: color,
      }}
    >
      <span>{label}</span>
      <button
        onClick={onRemove}
        className='w-4 h-4 rounded-full flex items-center justify-center hover:bg-black/20 transition-colors'
      >
        <X className='w-3 h-3' />
      </button>
    </motion.div>
  );

  return (
    <div className='space-y-4'>
      {/* Filter Toggle Button */}
      <div className='flex items-center justify-between'>
        <button
          onClick={onToggle}
          className='flex items-center space-x-2 px-4 py-2 bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700/50 rounded-lg text-white transition-all'
        >
          <Filter className='w-4 h-4' />
          <span>Filters</span>
          {getActiveFilterCount() > 0 && (
            <span className='px-2 py-1 bg-cyan-500 text-black text-xs font-bold rounded-full'>
              {getActiveFilterCount()}
            </span>
          )}
          <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        <div className='flex items-center space-x-4'>
          <span className='text-sm text-gray-400'>
            {isLoading ? (
              <div className='flex items-center space-x-2'>
                <RefreshCw className='w-4 h-4 animate-spin' />
                <span>Loading...</span>
              </div>
            ) : (
              `${resultCount.toLocaleString()} results`
            )}
          </span>
          {getActiveFilterCount() > 0 && (
            <button
              onClick={clearAllFilters}
              className='text-sm text-gray-400 hover:text-white transition-colors'
            >
              Clear all
            </button>
          )}
        </div>
      </div>

      {/* Active Filter Chips */}
      <AnimatePresence>
        {getActiveFilterCount() > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className='flex flex-wrap gap-2'
          >
            {filters.sports.map(sport => {
              const sportConfig = getSportById(sport);
              return (
                <FilterChip
                  key={sport}
                  label={getSportDisplayName(sport)}
                  onRemove={() => toggleArrayFilter('sports', sport, filters.sports)}
                  color={sportConfig?.color.primary}
                />
              );
            })}
            {filters.markets.map(market => (
              <FilterChip
                key={market}
                label={market}
                onRemove={() => toggleArrayFilter('markets', market, filters.markets)}
              />
            ))}
            {filters.tags.map(tag => (
              <FilterChip
                key={tag}
                label={tag}
                onRemove={() => toggleArrayFilter('tags', tag, filters.tags)}
              />
            ))}
            {filters.search && (
              <FilterChip
                label={`Search: "${filters.search}"`}
                onRemove={() => updateFilter('search', '')}
              />
            )}
            {filters.favoriteOnly && (
              <FilterChip
                label='Favorites Only'
                onRemove={() => updateFilter('favoriteOnly', false)}
              />
            )}
            {filters.liveOnly && (
              <FilterChip label='Live Only' onRemove={() => updateFilter('liveOnly', false)} />
            )}
            {filters.fantasyOnly && (
              <FilterChip
                label='Fantasy Only'
                onRemove={() => updateFilter('fantasyOnly', false)}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Advanced Filter Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className='bg-slate-800/50 backdrop-blur-lg border border-slate-700/50 rounded-xl p-6'
          >
            {/* Filter Tabs */}
            <div className='flex items-center space-x-4 mb-6 border-b border-slate-700/50'>
              {[
                { id: 'basic', label: 'Basic Filters', icon: Filter },
                { id: 'advanced', label: 'Advanced', icon: Settings },
                { id: 'presets', label: 'Presets', icon: Bookmark },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all ${
                    activeTab === tab.id
                      ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <tab.icon className='w-4 h-4' />
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>

            {/* Basic Filters Tab */}
            {activeTab === 'basic' && (
              <div className='space-y-6'>
                {/* Search */}
                <div>
                  <label className='block text-sm font-medium text-gray-300 mb-2'>Search</label>
                  <div className='relative'>
                    <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400' />
                    <input
                      type='text'
                      value={filters.search}
                      onChange={e => updateFilter('search', e.target.value)}
                      placeholder='Search games, teams, players...'
                      className='w-full pl-10 pr-4 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400'
                    />
                  </div>
                </div>

                {/* Sports Selection */}
                <div>
                  <label className='block text-sm font-medium text-gray-300 mb-3'>Sports</label>
                  <div className='grid grid-cols-2 md:grid-cols-4 gap-2'>
                    {SPORTS_CONFIG.map(sport => (
                      <button
                        key={sport.id}
                        onClick={() => toggleArrayFilter('sports', sport.id, filters.sports)}
                        className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                          filters.sports.includes(sport.id)
                            ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50'
                            : 'bg-slate-700/50 text-gray-300 hover:bg-slate-600/50'
                        }`}
                      >
                        <span>{sport.emoji}</span>
                        <span>{sport.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Sport Categories */}
                <div>
                  <label className='block text-sm font-medium text-gray-300 mb-3'>Categories</label>
                  <div className='grid grid-cols-2 md:grid-cols-4 gap-2'>
                    {SPORT_CATEGORIES.map(category => (
                      <button
                        key={category.id}
                        onClick={() =>
                          toggleArrayFilter('categories', category.id, filters.categories)
                        }
                        className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                          filters.categories.includes(category.id)
                            ? 'bg-purple-500/20 text-purple-400 border border-purple-500/50'
                            : 'bg-slate-700/50 text-gray-300 hover:bg-slate-600/50'
                        }`}
                      >
                        <span>{category.label}</span>
                        <span className='text-xs opacity-70'>({category.count})</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Market Types */}
                <div>
                  <label className='block text-sm font-medium text-gray-300 mb-3'>Markets</label>
                  <div className='grid grid-cols-2 md:grid-cols-3 gap-2'>
                    {MARKET_TYPES.map(market => (
                      <button
                        key={market}
                        onClick={() => toggleArrayFilter('markets', market, filters.markets)}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                          filters.markets.includes(market)
                            ? 'bg-green-500/20 text-green-400 border border-green-500/50'
                            : 'bg-slate-700/50 text-gray-300 hover:bg-slate-600/50'
                        }`}
                      >
                        {market}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Quick Toggles */}
                <div>
                  <label className='block text-sm font-medium text-gray-300 mb-3'>
                    Quick Filters
                  </label>
                  <div className='grid grid-cols-1 md:grid-cols-3 gap-3'>
                    {[
                      { key: 'favoriteOnly', label: 'Favorites Only', icon: Star },
                      { key: 'liveOnly', label: 'Live Betting', icon: Zap },
                      { key: 'fantasyOnly', label: 'Fantasy Available', icon: Users },
                    ].map(toggle => (
                      <button
                        key={toggle.key}
                        onClick={() =>
                          updateFilter(
                            toggle.key as keyof FilterState,
                            !filters[
                              toggle.key as keyof FilterState
                            ] as FilterState[keyof FilterState]
                          )
                        }
                        className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                          filters[toggle.key as keyof FilterState]
                            ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/50'
                            : 'bg-slate-700/50 text-gray-300 hover:bg-slate-600/50'
                        }`}
                      >
                        <toggle.icon className='w-4 h-4' />
                        <span>{toggle.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Advanced Filters Tab */}
            {activeTab === 'advanced' && (
              <div className='space-y-6'>
                {/* Odds Range */}
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  <div>
                    <label className='block text-sm font-medium text-gray-300 mb-2'>Min Odds</label>
                    <input
                      type='number'
                      step='0.01'
                      value={filters.minOdds || ''}
                      onChange={e =>
                        updateFilter('minOdds', e.target.value ? parseFloat(e.target.value) : null)
                      }
                      placeholder='e.g., -200'
                      className='w-full px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400'
                    />
                  </div>
                  <div>
                    <label className='block text-sm font-medium text-gray-300 mb-2'>Max Odds</label>
                    <input
                      type='number'
                      step='0.01'
                      value={filters.maxOdds || ''}
                      onChange={e =>
                        updateFilter('maxOdds', e.target.value ? parseFloat(e.target.value) : null)
                      }
                      placeholder='e.g., +500'
                      className='w-full px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400'
                    />
                  </div>
                </div>

                {/* Value Range */}
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  <div>
                    <label className='block text-sm font-medium text-gray-300 mb-2'>
                      Min Value
                    </label>
                    <input
                      type='number'
                      step='0.1'
                      value={filters.minValue || ''}
                      onChange={e =>
                        updateFilter('minValue', e.target.value ? parseFloat(e.target.value) : null)
                      }
                      placeholder='e.g., 1.5'
                      className='w-full px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400'
                    />
                  </div>
                  <div>
                    <label className='block text-sm font-medium text-gray-300 mb-2'>
                      Max Value
                    </label>
                    <input
                      type='number'
                      step='0.1'
                      value={filters.maxValue || ''}
                      onChange={e =>
                        updateFilter('maxValue', e.target.value ? parseFloat(e.target.value) : null)
                      }
                      placeholder='e.g., 5.0'
                      className='w-full px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400'
                    />
                  </div>
                </div>

                {/* Date Range */}
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  <div>
                    <label className='block text-sm font-medium text-gray-300 mb-2'>
                      Start Date
                    </label>
                    <input
                      type='datetime-local'
                      value={
                        filters.dateRange.start
                          ? filters.dateRange.start.toISOString().slice(0, 16)
                          : ''
                      }
                      onChange={e =>
                        updateFilter('dateRange', {
                          ...filters.dateRange,
                          start: e.target.value ? new Date(e.target.value) : null,
                        })
                      }
                      className='w-full px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white focus:outline-none focus:border-cyan-400'
                    />
                  </div>
                  <div>
                    <label className='block text-sm font-medium text-gray-300 mb-2'>End Date</label>
                    <input
                      type='datetime-local'
                      value={
                        filters.dateRange.end
                          ? filters.dateRange.end.toISOString().slice(0, 16)
                          : ''
                      }
                      onChange={e =>
                        updateFilter('dateRange', {
                          ...filters.dateRange,
                          end: e.target.value ? new Date(e.target.value) : null,
                        })
                      }
                      className='w-full px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white focus:outline-none focus:border-cyan-400'
                    />
                  </div>
                </div>

                {/* Sorting */}
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  <div>
                    <label className='block text-sm font-medium text-gray-300 mb-2'>Sort By</label>
                    <select
                      value={filters.sortBy}
                      onChange={e =>
                        updateFilter('sortBy', e.target.value as FilterState['sortBy'])
                      }
                      className='w-full px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white focus:outline-none focus:border-cyan-400'
                    >
                      {SORT_OPTIONS.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className='block text-sm font-medium text-gray-300 mb-2'>Order</label>
                    <select
                      value={filters.sortOrder}
                      onChange={e =>
                        updateFilter('sortOrder', e.target.value as FilterState['sortOrder'])
                      }
                      className='w-full px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white focus:outline-none focus:border-cyan-400'
                    >
                      <option value='desc'>Descending</option>
                      <option value='asc'>Ascending</option>
                    </select>
                  </div>
                </div>

                {/* Tags */}
                <div>
                  <label className='block text-sm font-medium text-gray-300 mb-3'>Tags</label>
                  <div className='grid grid-cols-2 md:grid-cols-3 gap-2'>
                    {POPULAR_TAGS.map(tag => (
                      <button
                        key={tag}
                        onClick={() => toggleArrayFilter('tags', tag, filters.tags)}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                          filters.tags.includes(tag)
                            ? 'bg-orange-500/20 text-orange-400 border border-orange-500/50'
                            : 'bg-slate-700/50 text-gray-300 hover:bg-slate-600/50'
                        }`}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Presets Tab */}
            {activeTab === 'presets' && (
              <div className='space-y-6'>
                {/* Save Current Preset */}
                <div className='p-4 bg-slate-700/30 rounded-lg'>
                  <h3 className='text-lg font-bold text-white mb-3'>Save Current Filters</h3>
                  <div className='flex items-center space-x-3'>
                    <input
                      type='text'
                      value={presetName}
                      onChange={e => setPresetName(e.target.value)}
                      placeholder='Enter preset name...'
                      className='flex-1 px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400'
                    />
                    <button
                      onClick={savePreset}
                      disabled={!presetName.trim()}
                      className='px-4 py-2 bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 rounded-lg text-white font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed'
                    >
                      Save
                    </button>
                  </div>
                </div>

                {/* Saved Presets */}
                <div>
                  <h3 className='text-lg font-bold text-white mb-3'>Saved Presets</h3>
                  {presets.length > 0 ? (
                    <div className='space-y-2'>
                      {presets.map((preset, index) => (
                        <div
                          key={index}
                          className='flex items-center justify-between p-3 bg-slate-700/30 rounded-lg'
                        >
                          <span className='text-white font-medium'>{preset.name}</span>
                          <button
                            onClick={() => onLoadPreset?.(preset.filters)}
                            className='px-3 py-1 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 rounded text-sm transition-colors'
                          >
                            Load
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className='text-center py-8 text-gray-400'>
                      <Bookmark className='w-12 h-12 mx-auto mb-3 opacity-50' />
                      <p>No saved presets yet</p>
                      <p className='text-sm'>Save your current filters to create a preset</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdvancedFilters;
