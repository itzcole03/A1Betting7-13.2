// @ts-expect-error TS(2307): Cannot find module '@/lib/utils' or its correspond... Remove this comment to see the full error message
import { cn } from '@/lib/utils';
import React, { useEffect, useMemo, useRef, useState } from 'react';

// Types for search modal
interface SearchResult {
  id: string;
  type: 'page' | 'bet' | 'user' | 'game' | 'team' | 'player' | 'prediction' | 'article' | 'setting';
  title: string;
  subtitle?: string;
  description?: string;
  url?: string;
  icon?: string;
  image?: string;
  category: string;
  tags?: string[];
  metadata?: Record<string, unknown>;
  relevanceScore?: number;
  lastUpdated?: Date;
}

interface SearchFilter {
  id: string;
  label: string;
  type: 'checkbox' | 'radio' | 'select' | 'daterange';
  options?: Array<{ value: string; label: string; count?: number }>;
  value?: unknown;
  category?: string;
}

interface SearchHistory {
  id: string;
  query: string;
  timestamp: Date;
  resultCount: number;
  filters?: Record<string, unknown>;
}

interface SearchSuggestion {
  id: string;
  text: string;
  type: 'query' | 'filter' | 'shortcut';
  category?: string;
  icon?: string;
}

interface SearchModalProps {
  isOpen: boolean;
  variant?: 'default' | 'cyber' | 'minimal' | 'fullscreen';
  placeholder?: string;
  maxResults?: number;
  showFilters?: boolean;
  showHistory?: boolean;
  showSuggestions?: boolean;
  showCategories?: boolean;
  enableVoiceSearch?: boolean;
  enableAdvancedSearch?: boolean;
  debounceMs?: number;
  className?: string;
  onClose: () => void;
  onSearch: (query: string, filters?: Record<string, unknown>) => Promise<SearchResult[]>;
  onResultClick?: (result: SearchResult) => void;
  onHistoryClick?: (historyItem: SearchHistory) => void;
  onSuggestionClick?: (suggestion: SearchSuggestion) => void;
}

const _defaultFilters: SearchFilter[] = [
  {
    id: 'type',
    label: 'Content Type',
    type: 'checkbox',
    options: [
      { value: 'bet', label: 'Bets', count: 0 },
      { value: 'prediction', label: 'Predictions', count: 0 },
      { value: 'game', label: 'Games', count: 0 },
      { value: 'team', label: 'Teams', count: 0 },
      { value: 'player', label: 'Players', count: 0 },
      { value: 'article', label: 'Articles', count: 0 },
    ],
  },
  {
    id: 'timeframe',
    label: 'Time Frame',
    type: 'radio',
    options: [
      { value: 'today', label: 'Today' },
      { value: 'week', label: 'This Week' },
      { value: 'month', label: 'This Month' },
      { value: 'all', label: 'All Time' },
    ],
    value: 'all',
  },
];

const _defaultSuggestions: SearchSuggestion[] = [
  { id: '1', text: 'NBA games today', type: 'query', category: 'Sports', icon: '🏀' },
  {
    id: '2',
    text: 'High confidence predictions',
    type: 'filter',
    category: 'Predictions',
    icon: '🎯',
  },
  { id: '3', text: 'My betting history', type: 'shortcut', category: 'Account', icon: '📊' },
  { id: '4', text: 'Live games', type: 'query', category: 'Sports', icon: '🔴' },
  { id: '5', text: 'Top performing models', type: 'filter', category: 'AI', icon: '🤖' },
];

const _getResultIcon = (type: string) => {
  const _icons = {
    page: '📄',
    bet: '🎯',
    user: '👤',
    game: '🎮',
    team: '🏆',
    player: '⭐',
    prediction: '🔮',
    article: '📰',
    setting: '⚙️',
  };
  return icons[type as keyof typeof icons] || '🔍';
};

const _highlightText = (text: string, query: string): React.ReactNode => {
  if (!query.trim()) return text;

  const _regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  const _parts = text.split(regex);

  return parts.map((part, index) =>
    regex.test(part) ? (
      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <mark key={index} className='bg-yellow-200 text-yellow-900 rounded px-1'>
        {part}
      </mark>
    ) : (
      part
    )
  );
};

const _useDebounce = (value: string, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const _handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

export const _SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  variant = 'default',
  placeholder = 'Search anything...',
  maxResults = 20,
  showFilters = true,
  showHistory = true,
  showSuggestions = true,
  showCategories = true,
  enableVoiceSearch = false,
  enableAdvancedSearch = true,
  debounceMs = 300,
  className,
  onClose,
  onSearch,
  onResultClick,
  onHistoryClick,
  onSuggestionClick,
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [filters, setFilters] = useState<SearchFilter[]>(defaultFilters);
  const [activeFilters, setActiveFilters] = useState<Record<string, unknown>>({});
  const [searchHistory, setSearchHistory] = useState<SearchHistory[]>([]);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isListening, setIsListening] = useState(false);

  const _inputRef = useRef<HTMLInputElement>(null);
  const _resultsRef = useRef<HTMLDivElement>(null);
  const _debouncedQuery = useDebounce(query, debounceMs);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Handle search
  useEffect(() => {
    if (debouncedQuery.trim()) {
      handleSearch(debouncedQuery);
    } else {
      setResults([]);
      setSelectedIndex(-1);
    }
  }, [debouncedQuery, activeFilters]);

  // Keyboard navigation
  useEffect(() => {
    const _handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => Math.min(prev + 1, results.length - 1));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => Math.max(prev - 1, -1));
          break;
        case 'Enter':
          e.preventDefault();
          if (selectedIndex >= 0 && results[selectedIndex]) {
            handleResultClick(results[selectedIndex]);
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, results, selectedIndex, onClose]);

  // Scroll selected item into view
  useEffect(() => {
    if (resultsRef.current && selectedIndex >= 0) {
      const _selectedElement = resultsRef.current.children[selectedIndex] as HTMLElement;
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex, resultsRef, results]);

  const _handleSearch = async (searchQuery: string) => {
    setLoading(true);
    try {
      const _searchResults = await onSearch(searchQuery, activeFilters);
      setResults(searchResults.slice(0, maxResults));
      setSelectedIndex(-1);

      // Add to history
      const _historyItem: SearchHistory = {
        id: Date.now().toString(),
        query: searchQuery,
        timestamp: new Date(),
        resultCount: searchResults.length,
        filters: { ...activeFilters },
      };

      setSearchHistory(prev => [historyItem, ...prev.slice(0, 9)]); // Keep last 10
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const _handleResultClick = (result: SearchResult) => {
    onResultClick?.(result);
    if (result.url) {
      window.location.href = result.url;
    }
    onClose();
  };

  const _handleFilterChange = (filterId: string, value: unknown) => {
    setActiveFilters(prev => ({
      ...prev,
      [filterId]: value,
    }));
  };

  const _clearFilters = () => {
    setActiveFilters({});
  };

  const _startVoiceSearch = () => {
    if (!enableVoiceSearch || !('webkitSpeechRecognition' in window)) return;

    const _recognition = new (window as unknown).webkitSpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (event: unknown) => {
      const _transcript = event.results[0][0].transcript;
      setQuery(transcript);
    };
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);

    recognition.start();
  };

  const _groupedResults = useMemo(() => {
    if (!showCategories) return { All: results };

    return results.reduce((groups, result) => {
      const _category = result.category || 'Other';
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(result);
      return groups;
    }, {} as Record<string, SearchResult[]>);
  }, [results, showCategories]);

  if (!isOpen) return null;

  const _variantClasses = {
    default: 'max-w-2xl mx-4 mt-20',
    cyber: 'max-w-2xl mx-4 mt-20',
    minimal: 'max-w-xl mx-4 mt-24',
    fullscreen: 'w-full h-full m-0',
  };

  const _modalClasses = {
    default: 'bg-white border border-gray-200 rounded-xl shadow-2xl',
    cyber:
      'bg-slate-900/95 border border-cyan-500/30 rounded-xl shadow-2xl shadow-cyan-500/20 backdrop-blur-md',
    minimal: 'bg-white border border-gray-100 rounded-lg shadow-xl',
    fullscreen: 'bg-white',
  };

  return (
    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <div className='fixed inset-0 z-50 flex items-start justify-center'>
      {/* Backdrop */}
      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <div
        className='absolute inset-0 bg-black/50 backdrop-blur-sm'
        onClick={onClose}
        role='button'
        tabIndex={0}
      />

      {/* Modal */}
      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <div
        className={cn(
          'relative overflow-hidden',
          variantClasses[variant],
          modalClasses[variant],
          variant === 'fullscreen' && 'max-h-full',
          variant !== 'fullscreen' && 'max-h-[80vh]',
          className
        )}
      >
        {/* Search Input */}
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <div
          className={cn(
            'flex items-center p-4 border-b',
            variant === 'cyber' ? 'border-cyan-500/30' : 'border-gray-200'
          )}
        >
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div className='flex items-center flex-1 space-x-3'>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div
              className={cn(
                'text-lg',
                loading ? 'animate-spin' : '',
                variant === 'cyber' ? 'text-cyan-400' : 'text-gray-400'
              )}
            >
              {loading ? '⟳' : '🔍'}
            </div>

            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <input
              ref={inputRef}
              type='text'
              placeholder={placeholder}
              value={query}
              onChange={e => setQuery(e.target.value)}
              className={cn(
                'flex-1 bg-transparent border-none outline-none text-lg placeholder-gray-400',
                variant === 'cyber' ? 'text-cyan-300' : 'text-gray-900'
              )}
            />

            {enableVoiceSearch && (
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <button
                onClick={startVoiceSearch}
                disabled={isListening}
                className={cn(
                  'p-2 rounded transition-colors',
                  isListening && 'animate-pulse',
                  variant === 'cyber'
                    ? 'text-cyan-400 hover:bg-cyan-500/10'
                    : 'text-gray-500 hover:bg-gray-100'
                )}
              >
                🎤
              </button>
            )}

            {enableAdvancedSearch && (
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <button
                onClick={() => setShowAdvanced(!showAdvanced)}
                className={cn(
                  'p-2 rounded transition-colors',
                  showAdvanced && 'bg-blue-100',
                  variant === 'cyber'
                    ? 'text-cyan-400 hover:bg-cyan-500/10'
                    : 'text-gray-500 hover:bg-gray-100'
                )}
              >
                ⚙️
              </button>
            )}
          </div>

          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div
            className={cn(
              'text-xs ml-4',
              variant === 'cyber' ? 'text-cyan-400/70' : 'text-gray-500'
            )}
          >
            {results.length > 0 && `${results.length} results`}
          </div>
        </div>

        {/* Advanced Filters */}
        {showAdvanced && showFilters && (
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div
            className={cn(
              'p-4 border-b',
              variant === 'cyber'
                ? 'border-cyan-500/30 bg-slate-800/50'
                : 'border-gray-200 bg-gray-50'
            )}
          >
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div className='flex items-center justify-between mb-3'>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <h3
                className={cn(
                  'font-medium',
                  variant === 'cyber' ? 'text-cyan-300' : 'text-gray-900'
                )}
              >
                Filters
              </h3>
              {Object.keys(activeFilters).length > 0 && (
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <button
                  onClick={clearFilters}
                  className={cn(
                    'text-sm px-2 py-1 rounded transition-colors',
                    variant === 'cyber'
                      ? 'text-cyan-400 hover:bg-cyan-500/10'
                      : 'text-blue-600 hover:bg-blue-50'
                  )}
                >
                  Clear all
                </button>
              )}
            </div>

            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              {filters.map(filter => (
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <div key={filter.id}>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <label
                    className={cn(
                      'block text-sm font-medium mb-2',
                      variant === 'cyber' ? 'text-cyan-300' : 'text-gray-700'
                    )}
                  >
                    {filter.label}
                  </label>

                  {filter.type === 'checkbox' && (
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <div className='space-y-1'>
                      {filter.options?.map(option => (
                        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                        <label key={option.value} className='flex items-center space-x-2'>
                          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                          <input
                            type='checkbox'
                            checked={activeFilters[filter.id]?.includes(option.value) || false}
                            onChange={e => {
                              const _current = activeFilters[filter.id] || [];
                              const _updated = e.target.checked
                                ? [...current, option.value]
                                : current.filter((v: string) => v !== option.value);
                              handleFilterChange(filter.id, updated);
                            }}
                            className='rounded'
                          />
                          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                          <span
                            className={cn(
                              'text-sm',
                              variant === 'cyber' ? 'text-cyan-400' : 'text-gray-600'
                            )}
                          >
                            {option.label}
                            {option.count !== undefined && ` (${option.count})`}
                          </span>
                        </label>
                      ))}
                    </div>
                  )}

                  {filter.type === 'radio' && (
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <div className='space-y-1'>
                      {filter.options?.map(option => (
                        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                        <label key={option.value} className='flex items-center space-x-2'>
                          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                          <input
                            type='radio'
                            name={filter.id}
                            value={option.value}
                            checked={
                              activeFilters[filter.id] === option.value ||
                              filter.value === option.value
                            }
                            onChange={e => handleFilterChange(filter.id, e.target.value)}
                          />
                          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                          <span
                            className={cn(
                              'text-sm',
                              variant === 'cyber' ? 'text-cyan-400' : 'text-gray-600'
                            )}
                          >
                            {option.label}
                          </span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Content */}
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <div className='max-h-96 overflow-y-auto'>
          {/* No Query State */}
          {!query.trim() && (
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div className='p-6'>
              {/* Recent Searches */}
              {showHistory && searchHistory.length > 0 && (
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <div className='mb-6'>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <h3
                    className={cn(
                      'text-sm font-medium mb-3',
                      variant === 'cyber' ? 'text-cyan-300' : 'text-gray-900'
                    )}
                  >
                    Recent Searches
                  </h3>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <div className='space-y-2'>
                    {searchHistory.slice(0, 5).map(item => (
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <button
                        key={item.id}
                        onClick={() => {
                          setQuery(item.query);
                          onHistoryClick?.(item);
                        }}
                        className={cn(
                          'w-full flex items-center justify-between p-2 rounded transition-colors text-left',
                          variant === 'cyber'
                            ? 'hover:bg-cyan-500/10 text-cyan-400'
                            : 'hover:bg-gray-100 text-gray-700'
                        )}
                      >
                        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                        <div className='flex items-center space-x-3'>
                          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                          <span className='text-sm'>🕒</span>
                          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                          <span className='text-sm'>{item.query}</span>
                        </div>
                        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                        <span
                          className={cn(
                            'text-xs',
                            variant === 'cyber' ? 'text-cyan-400/50' : 'text-gray-500'
                          )}
                        >
                          {item.resultCount} results
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Suggestions */}
              {showSuggestions && (
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <div>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <h3
                    className={cn(
                      'text-sm font-medium mb-3',
                      variant === 'cyber' ? 'text-cyan-300' : 'text-gray-900'
                    )}
                  >
                    Popular Searches
                  </h3>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <div className='grid grid-cols-1 gap-2'>
                    {defaultSuggestions.map(suggestion => (
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <button
                        key={suggestion.id}
                        onClick={() => {
                          setQuery(suggestion.text);
                          onSuggestionClick?.(suggestion);
                        }}
                        className={cn(
                          'flex items-center space-x-3 p-3 rounded transition-colors text-left',
                          variant === 'cyber'
                            ? 'hover:bg-cyan-500/10 border border-cyan-500/20'
                            : 'hover:bg-gray-50 border border-gray-200'
                        )}
                      >
                        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                        <span className='text-lg'>{suggestion.icon}</span>
                        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                        <div>
                          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                          <div
                            className={cn(
                              'font-medium',
                              variant === 'cyber' ? 'text-cyan-300' : 'text-gray-900'
                            )}
                          >
                            {suggestion.text}
                          </div>
                          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                          <div
                            className={cn(
                              'text-xs',
                              variant === 'cyber' ? 'text-cyan-400/70' : 'text-gray-500'
                            )}
                          >
                            {suggestion.category}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Search Results */}
          {query.trim() && (
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div ref={resultsRef}>
              {Object.entries(groupedResults).map(([category, categoryResults]) => (
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <div key={category}>
                  {showCategories && Object.keys(groupedResults).length > 1 && (
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <div
                      className={cn(
                        'sticky top-0 px-4 py-2 border-b text-xs font-medium uppercase tracking-wider',
                        variant === 'cyber'
                          ? 'bg-slate-800/90 border-cyan-500/20 text-cyan-400'
                          : 'bg-gray-50 border-gray-200 text-gray-500'
                      )}
                    >
                      {category} ({categoryResults.length})
                    </div>
                  )}

                  {categoryResults.map((result, index) => {
                    const _globalIndex =
                      Object.entries(groupedResults)
                        .slice(0, Object.keys(groupedResults).indexOf(category))
                        .reduce((acc, [, results]) => acc + results.length, 0) + index;

                    return (
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <button
                        key={result.id}
                        onClick={() => handleResultClick(result)}
                        className={cn(
                          'w-full flex items-start space-x-3 p-4 transition-colors text-left',
                          globalIndex === selectedIndex &&
                            (variant === 'cyber'
                              ? 'bg-cyan-500/20 border-l-2 border-cyan-500'
                              : 'bg-blue-50 border-l-2 border-blue-500'),
                          globalIndex !== selectedIndex &&
                            (variant === 'cyber' ? 'hover:bg-cyan-500/10' : 'hover:bg-gray-50')
                        )}
                      >
                        {/* Icon/Image */}
                        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                        <div className='flex-shrink-0 mt-1'>
                          {result.image ? (
                            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                            <img
                              src={result.image}
                              alt=''
                              className='w-8 h-8 rounded object-cover'
                            />
                          ) : (
                            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                            <span className='text-lg'>
                              {result.icon || getResultIcon(result.type)}
                            </span>
                          )}
                        </div>

                        {/* Content */}
                        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                        <div className='flex-1 min-w-0'>
                          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                          <div
                            className={cn(
                              'font-medium truncate',
                              variant === 'cyber' ? 'text-cyan-300' : 'text-gray-900'
                            )}
                          >
                            {highlightText(result.title, query)}
                          </div>

                          {result.subtitle && (
                            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                            <div
                              className={cn(
                                'text-sm truncate mt-0.5',
                                variant === 'cyber' ? 'text-cyan-400/80' : 'text-gray-600'
                              )}
                            >
                              {highlightText(result.subtitle, query)}
                            </div>
                          )}

                          {result.description && (
                            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                            <div
                              className={cn(
                                'text-xs mt-1 line-clamp-2',
                                variant === 'cyber' ? 'text-cyan-400/60' : 'text-gray-500'
                              )}
                            >
                              {highlightText(result.description, query)}
                            </div>
                          )}

                          {result.tags && result.tags.length > 0 && (
                            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                            <div className='flex flex-wrap gap-1 mt-2'>
                              {result.tags.slice(0, 3).map(tag => (
                                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                                <span
                                  key={tag}
                                  className={cn(
                                    'px-1.5 py-0.5 text-xs rounded',
                                    variant === 'cyber'
                                      ? 'bg-slate-700 text-cyan-400'
                                      : 'bg-gray-100 text-gray-600'
                                  )}
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Relevance Score */}
                        {result.relevanceScore && (
                          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                          <div
                            className={cn(
                              'text-xs px-2 py-1 rounded',
                              variant === 'cyber'
                                ? 'bg-cyan-500/20 text-cyan-300'
                                : 'bg-gray-100 text-gray-600'
                            )}
                          >
                            {Math.round(result.relevanceScore * 100)}%
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              ))}

              {/* No Results */}
              {results.length === 0 && !loading && query.trim() && (
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <div className='p-8 text-center'>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <div className='text-4xl mb-3'>🔍</div>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <div
                    className={cn(
                      'text-lg font-medium mb-2',
                      variant === 'cyber' ? 'text-cyan-300' : 'text-gray-900'
                    )}
                  >
                    No results found
                  </div>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <div
                    className={cn(
                      'text-sm',
                      variant === 'cyber' ? 'text-cyan-400/70' : 'text-gray-600'
                    )}
                  >
                    Try different keywords or adjust your filters
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <div
          className={cn(
            'flex items-center justify-between p-3 border-t text-xs',
            variant === 'cyber'
              ? 'border-cyan-500/30 text-cyan-400/50'
              : 'border-gray-200 text-gray-500'
          )}
        >
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div className='flex items-center space-x-4'>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <span>↑↓ Navigate</span>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <span>↵ Select</span>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <span>Esc Close</span>
          </div>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div className='flex items-center space-x-2'>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            {enableVoiceSearch && <span>🎤 Voice</span>}
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            {enableAdvancedSearch && <span>⚙️ Filters</span>}
          </div>
        </div>

        {/* Cyber Effects */}
        {variant === 'cyber' && (
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div className='absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-purple-500/5 rounded-xl pointer-events-none' />
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div className='absolute inset-0 bg-grid-white/[0.02] rounded-xl pointer-events-none' />
          </>
        )}
      </div>
    </div>
  );
};
