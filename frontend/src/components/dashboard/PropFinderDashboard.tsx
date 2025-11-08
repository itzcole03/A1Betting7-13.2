import { useVirtualizer } from '@tanstack/react-virtual';
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  Bell,
  DollarSign,
  Filter,
  Heart,
  Search,
  Settings,
  Star,
  Target,
  TrendingUp,
  Users,
  X,
  Zap,
} from 'lucide-react';
import React, { useMemo, useRef, useState } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { useOddsHistory } from '../../hooks/useOddsHistory';
import { PropOpportunity, usePropFinderData } from '../../hooks/usePropFinderData';
import { bookmarkService } from '../../services/BookmarkService';
import { clvColor, clvTooltip, formatClvPercent } from '../../utils/clvFormatting';
import { enhancedLogger } from '../../utils/enhancedLogger';
import {
  formatEvPercent,
  getEvBadgeColorClass,
  isValuePlay,
  shouldShowEvBadge,
} from '../../utils/evFormatting';
import { evTelemetry } from '../../utils/evTelemetry';
import MovementAnalysis from '../analysis/MovementAnalysis';
import LiveArbitragePanel from '../arbitrage/LiveArbitragePanel';
import ArbitrageBadge from '../propfinder/ArbitrageBadge';
import EvPill from '../propfinder/EvPill';
import MiniLineSparkline from '../propfinder/MiniLineSparkline';
import PerformanceMetrics from './PerformanceMetrics';
import DashboardSettingsPanel, { DashboardLayout } from './DashboardSettingsPanel';

// Dev debug window shape
type DevWindow = Window & {
  __propfinder_force_show_all?: boolean;
  __propfinder_last_response?: unknown;
  __propfinder_last_fetch_status?: unknown;
  __propfinder_last_request_params?: unknown;
  __propfinder_last_stats?: unknown;
};

// Debounce hook for search optimization
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = React.useState<T>(value);

  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// Utility functions
const formatOdds = (odds: number): string => {
  return odds > 0 ? `+${odds}` : `${odds}`;
};

const getConfidenceColor = (confidence: number): string => {
  if (confidence >= 80) return 'bg-green-500';
  if (confidence >= 70) return 'bg-blue-500';
  if (confidence >= 60) return 'bg-yellow-500';
  return 'bg-red-500';
};

const getEdgeColor = (edge: number): string => {
  if (edge >= 8) return 'text-green-400';
  if (edge >= 5) return 'text-blue-400';
  if (edge >= 0) return 'text-yellow-400';
  return 'text-red-400';
};

const getSportIcon = (sport: string): string => {
  switch (sport) {
    case 'NBA':
      return '🏀';
    case 'MLB':
      return '⚾';
    case 'NFL':
      return '🏈';
    case 'NHL':
      return '🏒';
    default:
      return '🎯';
  }
};

// Main PropFinder Dashboard Component
const PropFinderDashboard: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSports, setSelectedSports] = useState<string[]>(['NBA', 'MLB']);
  const [confidenceRange, setConfidenceRange] = useState([0, 100]);
  const [edgeRange, setEdgeRange] = useState([0, 20]);
  const [evRange, setEvRange] = useState([0, 100]); // EV percentage range filter aligned with backend values
  const [selectedEvTiers, setSelectedEvTiers] = useState<string[]>([
    'high',
    'moderate',
    'low',
    'negative',
  ]);
  const [showFilters, setShowFilters] = useState<boolean>(() => {
    try {
      if (typeof window !== 'undefined') {
        return localStorage.getItem('e2e_test_mode') === 'true' || false;
      }
    } catch {
      /* ignore */
    }
    return false;
  });
  const [selectedPreset, setSelectedPreset] = useState('');
  const [volatilityMin, setVolatilityMin] = useState<number>(0); // simple volatility threshold

  // Phase 1.2 specific filters
  const [showArbitrageOnly, setShowArbitrageOnly] = useState(false);
  const [showLowJuiceOnly, setShowLowJuiceOnly] = useState(false);
  const [minBookmakers, setMinBookmakers] = useState(1);
  const [selectedSharpMoney, setSelectedSharpMoney] = useState<string[]>([]);

  // NEW: EV-specific state for Phase 4.2
  const [sortBy, setSortBy] = useState<'default' | 'ev' | 'confidence' | 'arbitrage' | 'clv'>(
    'default'
  );
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [minEvPercent, setMinEvPercent] = useState(0);
  const [customEvThreshold, setCustomEvThreshold] = useState(5.0);
  const [showBookmarkedOnly, setShowBookmarkedOnly] = useState(false);

  // NEW: CLV-specific state for Step 4
  const [showCLV, setShowCLV] = useState(false);
  // removed unused leaderboard and legacy modal states to reduce clutter
  const [showLineMovementModal, setShowLineMovementModal] = useState(false);
  const [selectedOpportunity, setSelectedOpportunity] = useState<PropOpportunity | null>(null);
  const [showArbitrage, setShowArbitrage] = useState(false);

  // Dashboard customization state (consolidated features)
  const [showSettings, setShowSettings] = useState(false);
  const [showPerformanceMetrics, setShowPerformanceMetrics] = useState(true);
  const [dashboardLayout, setDashboardLayout] = useState<DashboardLayout>('comfortable');
  const [enableRealTimeUpdates, setEnableRealTimeUpdates] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(false);

  // Store EV threshold in localStorage
  React.useEffect(() => {
    const stored = localStorage.getItem('propfinder.evThreshold');
    if (stored) {
      setCustomEvThreshold(Number(stored));
    }
  }, []);

  React.useEffect(() => {
    localStorage.setItem('propfinder.evThreshold', customEvThreshold.toString());
  }, [customEvThreshold]);

  // Store minEV filter in localStorage
  React.useEffect(() => {
    const stored = localStorage.getItem('propfinder.minEvPercent');
    if (stored) {
      setMinEvPercent(Number(stored));
    }
  }, []);

  React.useEffect(() => {
    localStorage.setItem('propfinder.minEvPercent', minEvPercent.toString());
  }, [minEvPercent]);

  // Store CLV settings in localStorage
  React.useEffect(() => {
    const stored = localStorage.getItem('propfinder.showCLV');
    if (stored) {
      setShowCLV(stored === 'true');
    }
  }, []);

  React.useEffect(() => {
    localStorage.setItem('propfinder.showCLV', showCLV.toString());
  }, [showCLV]);

  // Load dashboard preferences from localStorage
  React.useEffect(() => {
    try {
      const saved = localStorage.getItem('dashboardPreferences');
      if (saved) {
        const prefs = JSON.parse(saved);
        setDashboardLayout(prefs.layout || 'comfortable');
        setShowPerformanceMetrics(prefs.showMetrics !== false);
        setEnableRealTimeUpdates(prefs.enableRealTime !== false);
        setAutoRefresh(prefs.autoRefresh || false);
      }
    } catch (error) {
      enhancedLogger.warn('PropFinderDashboard', 'preferences', 'Failed to load preferences', { error });
    }
  }, []);

  // Save dashboard preferences to localStorage
  React.useEffect(() => {
    try {
      localStorage.setItem('dashboardPreferences', JSON.stringify({
        layout: dashboardLayout,
        showMetrics: showPerformanceMetrics,
        enableRealTime: enableRealTimeUpdates,
        autoRefresh: autoRefresh,
      }));
    } catch (error) {
      enhancedLogger.warn('PropFinderDashboard', 'preferences', 'Failed to save preferences', { error });
    }
  }, [dashboardLayout, showPerformanceMetrics, enableRealTimeUpdates, autoRefresh]);

  // Apply layout spacing based on user preference
  const spacingClass = useMemo(() => {
    return {
      compact: 'p-2',
      comfortable: 'p-6',
      spacious: 'p-8'
    }[dashboardLayout];
  }, [dashboardLayout]);

  // Memoize options to avoid recreating the object each render which would
  // cause usePropFinderData's internal `initialFilters` memo to change and
  // potentially trigger an infinite update loop.
  const propfinderOptions = React.useMemo(() => {
    return {
      autoRefresh: true,
      refreshInterval: 30,
      includeCLV: showCLV, // Enable CLV data fetching when column is visible
      limit: 25, // page size for pagination
      initialFilters: {
        sports: selectedSports,
        confidence_min: confidenceRange[0],
        confidence_max: confidenceRange[1],
        edge_min: edgeRange[0],
        edge_max: edgeRange[1],
      },
    } as const;
    // Only recreate when these dependencies change
  }, [showCLV, selectedSports, confidenceRange[0], confidenceRange[1], edgeRange[0], edgeRange[1]]);

  // Real data integration using our enhanced hook
  const {
    opportunities,
    stats,
    loading,
    error,
    bookmarkOpportunity,
    refreshData,
    isAutoRefreshEnabled,
    toggleAutoRefresh,
    updateFilters,
    setSearchQuery: setServerSearchQuery,
    filters: activeFilters,
    loadMore,
    hasMore,
  } = usePropFinderData(propfinderOptions);

  // Odds history for movement analysis
  const {
    data: oddsHistoryData,
    loading: _oddsHistoryLoading,
    error: _oddsHistoryError,
  } = useOddsHistory(
    selectedOpportunity ? { prop_id: selectedOpportunity.id, hours_back: 24 } : null,
    showLineMovementModal
  );

  // Auto-refresh functionality for dashboard customization
  React.useEffect(() => {
    if (!autoRefresh) return;
    
    const interval = setInterval(() => {
      refreshData();
      enhancedLogger.debug('PropFinderDashboard', 'autoRefresh', 'Auto-refreshing data');
    }, 30000); // 30 seconds
    
    return () => clearInterval(interval);
  }, [autoRefresh, refreshData]);

  if (process.env.NODE_ENV === 'development') {
    // eslint-disable-next-line no-console
    console.info('[PropFinderDashboard] render state', {
      opportunities: opportunities.length,
      loading,
      error,
      stats,
      activeFilters,
    });
  }

  // Quick filter presets for Phase 4.1
  const filterPresets = [
    {
      name: 'High Value',
      icon: Star,
      confidenceMin: 80,
      edgeMin: 8,
      description: 'Elite opportunities',
    },
    {
      name: 'Premium Only',
      icon: DollarSign,
      confidenceMin: 70,
      edgeMin: 5,
      description: 'Premium confidence',
    },
    {
      name: 'Value Plays',
      icon: Target,
      confidenceMin: 60,
      edgeMin: 2,
      description: 'Value opportunities',
    },
    {
      name: 'Arbitrage',
      icon: TrendingUp,
      confidenceMin: 50,
      edgeMin: 0,
      description: 'Arbitrage opportunities',
      arbitrageOnly: true,
    },
  ];

  // Debounced search query for Phase 4.1
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  React.useEffect(() => {
    updateFilters({
      sports: selectedSports,
      confidence_min: confidenceRange[0],
      confidence_max: confidenceRange[1],
      edge_min: edgeRange[0],
      edge_max: edgeRange[1],
      sharp_money: selectedSharpMoney.length > 0 ? selectedSharpMoney : null,
      bookmarked_only: showBookmarkedOnly ? true : null,
    });
  }, [
    confidenceRange,
    edgeRange,
    selectedSharpMoney,
    selectedSports,
    showBookmarkedOnly,
    updateFilters,
  ]);

  React.useEffect(() => {
    setServerSearchQuery(debouncedSearchQuery);
  }, [debouncedSearchQuery, setServerSearchQuery]);

  // Dev flag read once per render (safe for SSR-checking)
  const devForceFlag = (() => {
    if (typeof window === 'undefined') return false;
    const w = window as DevWindow;
    if (w.__propfinder_force_show_all) return true;
    if (
      typeof localStorage !== 'undefined' &&
      localStorage.getItem('__propfinder_force_show_all') === '1'
    )
      return true;
    return false;
  })();

  // Filter opportunities based on current filters
  const filteredOpportunities = useMemo(() => {
    // Dev-mode override: if set on window or via localStorage, bypass client-side filtering
    // and show all server opportunities. localStorage flag allows Playwright/global-setup
    // to persist the override into storageState so headless browsers can reproduce the dev mode.
    const devForceShowAll = process.env.NODE_ENV === 'development' && devForceFlag;

    if (devForceShowAll) {
      // Return the raw server opportunities so the UI shows exactly what the backend returned.
      return opportunities;
    }
    const normalizedSearch = debouncedSearchQuery.trim().toLowerCase();
    const selectedSportsNormalized = selectedSports.map(sport => sport.toLowerCase());
    const selectedEvTiersNormalized = selectedEvTiers.map(tier => tier.toLowerCase());
    const selectedSharpMoneyNormalized = selectedSharpMoney.map(sharp => sharp.toLowerCase());

    const filtersRecord = (activeFilters ?? {}) as Record<string, unknown>;
    const serverSportsFilter = Array.isArray(filtersRecord['sports'])
      ? (filtersRecord['sports'] as string[])
      : null;
    const applyLocalSportsFilter = !serverSportsFilter || serverSportsFilter.length === 0;

    const hasServerConfidenceFilter =
      filtersRecord['confidence_min'] !== undefined ||
      filtersRecord['confidence_max'] !== undefined;
    const hasServerEdgeFilter =
      filtersRecord['edge_min'] !== undefined || filtersRecord['edge_max'] !== undefined;

    // Precompute lightweight normalized fields once per opportunity to avoid repeated work
    const opportunityIndex = opportunities.map(opp => ({
      id: opp.id,
      player: (opp.player || '').toString().toLowerCase(),
      market: (opp.market || '').toString().toLowerCase(),
      team: (opp.team || '').toString().toLowerCase(),
      sport: (opp.sport || '').toString().toLowerCase(),
      evTier: (opp.evTier || '').toString().toLowerCase(),
      sharpMoney: (opp.sharpMoney || '').toString().toLowerCase(),
      recentForm: Array.isArray(opp.recentForm) ? opp.recentForm : [],
      // Precompute numeric fields used for sorting to keep the index lightweight
      evPercent: opp.evPercent ?? 0,
      confidence: opp.confidence ?? 0,
      arbitrageProfitPct: opp.arbitrageProfitPct ?? 0,
      raw: opp,
    }));

    let filtered = opportunityIndex.filter(
      ({ raw, player, market, team, sport, evTier, sharpMoney, recentForm }) => {
        // normalizeString intentionally omitted (unused)
        const opp = raw;

        const matchesSearch =
          !normalizedSearch ||
          player.includes(normalizedSearch) ||
          market.includes(normalizedSearch) ||
          team.includes(normalizedSearch);

        const matchesSports =
          selectedSportsNormalized.length === 0 || selectedSportsNormalized.includes(sport);
        const matchesConfidence =
          (opp.confidence || 0) >= confidenceRange[0] &&
          (opp.confidence || 0) <= confidenceRange[1];
        const matchesEdge = (opp.edge || 0) >= edgeRange[0] && (opp.edge || 0) <= edgeRange[1];
        const matchesEvRange =
          (opp.evPercent || 0) >= evRange[0] && (opp.evPercent || 0) <= evRange[1];
        const evTierKey = evTier || 'negative';
        const matchesEvTier =
          selectedEvTiersNormalized.length === 0 || selectedEvTiersNormalized.includes(evTierKey);
        const matchesArbitrage = !showArbitrageOnly || Boolean(opp.hasArbitrage);
        const matchesLowJuice = !showLowJuiceOnly || Boolean(opp.isLowJuice);
        const matchesBookmakers = !opp.numBookmakers || opp.numBookmakers >= minBookmakers;
        const matchesSharpMoney =
          selectedSharpMoneyNormalized.length === 0 ||
          selectedSharpMoneyNormalized.includes(sharpMoney);
        const volatility =
          recentForm && recentForm.length > 1
            ? Math.max(...recentForm) - Math.min(...recentForm)
            : 0;
        const matchesVolatility = volatility >= volatilityMin;

        // NEW: EV filtering
        const matchesEvPercent = (opp.evPercent || 0) >= minEvPercent;
        const matchesBookmarked = !showBookmarkedOnly || opp.isBookmarked;

        if (!matchesSearch) return false;
        if (applyLocalSportsFilter && !matchesSports) return false;
        if (!hasServerConfidenceFilter && !matchesConfidence) return false;
        if (!hasServerEdgeFilter && !matchesEdge) return false;
        if (!matchesEvRange) return false;
        if (!matchesEvTier) return false;
        if (!matchesArbitrage) return false;
        if (!matchesLowJuice) return false;
        if (!matchesBookmakers) return false;
        if (!matchesSharpMoney) return false;
        if (!matchesEvPercent) return false;
        if (!matchesBookmarked) return false;
        if (!matchesVolatility) return false;

        return true;
      }
    );

    // NEW: Sorting logic
    if (sortBy !== 'default') {
      // Map UI sort key to telemetry-friendly key (legacy uses 'profit' for arbitrage)
      const telemetrySort =
        sortBy === 'arbitrage' ? 'profit' : (sortBy as 'ev' | 'confidence' | 'profit');
      evTelemetry.logEvent('ev_sort_applied', { sortBy: telemetrySort });

      filtered = filtered.sort((a, b) => {
        let comparison = 0;

        switch (sortBy) {
          case 'ev':
            comparison = (a.evPercent || 0) - (b.evPercent || 0);
            break;
          case 'confidence':
            comparison = (a.confidence || 0) - (b.confidence || 0);
            break;
          case 'arbitrage':
            comparison = (a.arbitrageProfitPct || 0) - (b.arbitrageProfitPct || 0);
            break;
          default:
            comparison = 0;
        }

        return sortOrder === 'desc' ? -comparison : comparison;
      });
    }

    return filtered;
  }, [
    opportunities,
    // include dev override flag so toggling it re-evaluates the memo
    debouncedSearchQuery,
    selectedSports,
    confidenceRange,
    edgeRange,
    evRange,
    selectedEvTiers,
    showArbitrageOnly,
    showLowJuiceOnly,
    minBookmakers,
    selectedSharpMoney,
    minEvPercent,
    showBookmarkedOnly,
    sortBy,
    sortOrder,
    volatilityMin,
    activeFilters,
    devForceFlag,
  ]);

  // Virtualization setup
  const parentRef = useRef<HTMLDivElement>(null);
  const VIRTUALIZATION_THRESHOLD = 20;
  const shouldVirtualize = filteredOpportunities.length > VIRTUALIZATION_THRESHOLD;

  const virtualizer = useVirtualizer({
    count: filteredOpportunities.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 120,
    enabled: shouldVirtualize,
  });

  const totalServerCount = stats?.total_opportunities ?? opportunities.length;
  const serverFilteredCount = stats?.filtered_opportunities ?? opportunities.length;

  React.useEffect(() => {
    if (!loading && !error && opportunities.length > 0 && filteredOpportunities.length === 0) {
      enhancedLogger.warn(
        'PropFinderDashboard',
        'client-filtered-empty',
        'All server opportunities were filtered out on the client',
        {
          serverCount: opportunities.length,
          activeFilters,
          search: debouncedSearchQuery,
        }
      );
    }
  }, [
    activeFilters,
    debouncedSearchQuery,
    error,
    filteredOpportunities.length,
    loading,
    opportunities.length,
  ]);

  // Handle preset application
  const applyPreset = (preset: (typeof filterPresets)[0]) => {
    setSelectedPreset(preset.name);
    setConfidenceRange([preset.confidenceMin, 100]);
    setEdgeRange([preset.edgeMin, 20]);
    if ('arbitrageOnly' in preset && preset.arbitrageOnly) {
      setShowArbitrageOnly(true);
    }
  };

  // Handle bookmark toggle (memoized) to keep stable callback references for rows
  const handleBookmarkToggle = React.useCallback(
    async (opportunityId: string, isBookmarked: boolean) => {
      try {
        const opportunity = opportunities.find(o => o.id === opportunityId);
        if (!opportunity) return;

        // Log telemetry for bookmark action
        evTelemetry.logEvent('ev_bookmark_toggled', {
          opportunityId,
          evPercent: opportunity.evPercent || undefined,
        });

        await bookmarkOpportunity(opportunityId, opportunity, !isBookmarked);
      } catch (error) {
        // Log error for debugging in development
        if (process.env.NODE_ENV === 'development') {
          enhancedLogger.error(
            'PropFinderDashboard',
            'handleBookmarkToggle',
            'Failed to toggle bookmark',
            undefined,
            error as Error
          );
        }
      }
    },
    [opportunities, bookmarkOpportunity]
  );

  if (loading) {
    return (
      <div className='flex items-center justify-center min-h-screen bg-gray-900'>
        <div className='text-white text-xl'>Loading PropFinder opportunities...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className='flex flex-col items-center justify-center min-h-screen bg-gray-900'>
        <div className='text-red-400 text-xl mb-4'>Error: {error}</div>
        <button
          onClick={refreshData}
          className='px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700'
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <>
      <div className={`min-h-screen bg-gray-900 text-white ${spacingClass}`}>
        <div className='max-w-7xl mx-auto'>
          {/* Enhanced Header with Stats */}
          <div className='mb-8'>
            <div className='flex justify-between items-start'>
              <div>
                <h1
                  className='text-4xl font-bold mb-2 flex items-center gap-3'
                  data-testid='propfinder-killer-heading'
                >
                  PropFinder
                  <span className='text-2xl'>🎯</span>
                  {isAutoRefreshEnabled && (
                    <span className='text-sm bg-green-600 px-2 py-1 rounded-full'>LIVE</span>
                  )}
                </h1>
                <p className='text-gray-400'>
                  Elite prop betting opportunities with multi-bookmaker best lines
                </p>
              </div>

              {stats && (
                <div className='grid grid-cols-3 gap-4 text-center'>
                  <div className='bg-gray-800 p-3 rounded-lg'>
                    <div className='text-2xl font-bold text-blue-400'>
                      {stats.total_opportunities}
                    </div>
                    <div className='text-xs text-gray-400'>Total Opps</div>
                  </div>
                  <div className='bg-gray-800 p-3 rounded-lg'>
                    <div className='text-2xl font-bold text-green-400'>
                      {(stats?.avg_confidence || 0).toFixed(1)}%
                    </div>
                    <div className='text-xs text-gray-400'>Avg Confidence</div>
                  </div>
                  <div className='bg-gray-800 p-3 rounded-lg'>
                    <div className='text-2xl font-bold text-yellow-400'>
                      {(stats?.max_edge || 0).toFixed(1)}%
                    </div>
                    <div className='text-xs text-gray-400'>Max Edge</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Enhanced Controls */}
          <div className='mb-6 space-y-4'>
            <div className='flex flex-wrap gap-4'>
              <div className='relative flex-1 min-w-64'>
                <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4' />
                <input
                  type='text'
                  placeholder='Search players, markets, or teams...'
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className='w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                />
              </div>

              <button
                onClick={() => setShowFilters(!showFilters)}
                className='px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2'
              >
                <Filter className='w-4 h-4' />
                Filters
              </button>

              <button
                onClick={toggleAutoRefresh}
                className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                  isAutoRefreshEnabled
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-gray-800 border border-gray-700 hover:bg-gray-700'
                }`}
              >
                🔄 Auto Refresh
              </button>

              <button
                onClick={() => setShowSettings(true)}
                className='px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2'
                title='Dashboard Settings'
                aria-label='Open dashboard settings'
              >
                <Settings className='w-4 h-4' />
                Settings
              </button>
            </div>

            {/* NEW: Sorting Controls */}
            <div className='flex flex-wrap gap-2 items-center'>
              <span className='text-sm text-gray-400'>Sort by:</span>
              <div className='flex gap-1'>
                {[
                  { key: 'default', label: 'Default', icon: Target },
                  { key: 'ev', label: 'EV %', icon: DollarSign },
                  { key: 'confidence', label: 'Confidence', icon: Star },
                  { key: 'arbitrage', label: 'Arbitrage', icon: TrendingUp },
                ].map(({ key, label, icon: Icon }) => (
                  <button
                    key={key}
                    onClick={() => {
                      if (sortBy === key) {
                        setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
                      } else {
                        setSortBy(key as typeof sortBy);
                        setSortOrder(key === 'default' ? 'desc' : 'desc');
                      }
                    }}
                    className={`flex items-center gap-1 px-3 py-1 rounded transition-colors text-sm ${
                      sortBy === key
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                    }`}
                  >
                    <Icon className='w-3 h-3' />
                    {label}
                    {sortBy === key &&
                      (sortOrder === 'desc' ? (
                        <ArrowDown className='w-3 h-3' />
                      ) : (
                        <ArrowUp className='w-3 h-3' />
                      ))}
                  </button>
                ))}
              </div>

              {/* Bookmark toggle */}
              <button
                onClick={() => setShowBookmarkedOnly(!showBookmarkedOnly)}
                className={`flex items-center gap-1 px-3 py-1 rounded transition-colors text-sm ${
                  showBookmarkedOnly
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                }`}
              >
                <Heart className={`w-3 h-3 ${showBookmarkedOnly ? 'fill-current' : ''}`} />
                Bookmarked Only
              </button>

              {/* CLV toggle */}
              <button
                onClick={() => {
                  const newState = !showCLV;
                  setShowCLV(newState);
                  // Track CLV feature usage
                  evTelemetry.logEvent('ev_integration_active', {
                    bookmarkCount: newState ? 1 : 0, // Simple tracking of CLV usage
                  });
                }}
                className={`flex items-center gap-1 px-3 py-1 rounded transition-colors text-sm ${
                  showCLV
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                }`}
                title='Show Closing Line Value column'
              >
                <TrendingUp className={`w-3 h-3 ${showCLV ? 'fill-current' : ''}`} />
                Show CLV
              </button>

              <button
                onClick={() => setShowArbitrage(!showArbitrage)}
                className={`flex items-center gap-1 px-3 py-1 rounded transition-colors text-sm ${
                  showArbitrage
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                }`}
                title='Show Live Arbitrage Panel'
              >
                <Zap className={`w-3 h-3 ${showArbitrage ? 'fill-current' : ''}`} />
                Live Arbitrage
              </button>
            </div>

            {showFilters && (
              <div
                data-testid='prop-filters'
                className='bg-gray-800 p-6 rounded-lg border border-gray-700 space-y-6'
              >
                {/* Quick Filter Presets */}
                <div>
                  <label className='block text-sm font-medium mb-3'>Quick Filters</label>
                  <div className='flex flex-wrap gap-3'>
                    {filterPresets.map(preset => {
                      const IconComponent = preset.icon;
                      return (
                        <button
                          key={preset.name}
                          onClick={() => applyPreset(preset)}
                          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                            selectedPreset === preset.name
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                          }`}
                        >
                          <IconComponent className='w-4 h-4' />
                          <span className='text-sm font-medium'>{preset.name}</span>
                          <span className='text-xs text-gray-400'>({preset.description})</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Enhanced Filter Controls */}
                <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
                  {/* Sports Selection */}
                  <div>
                    <label className='block text-sm font-medium mb-2'>Sports</label>
                    <div className='space-y-2'>
                      {['NBA', 'MLB', 'NFL', 'NHL'].map(sport => (
                        <label key={sport} className='flex items-center gap-2'>
                          <input
                            type='checkbox'
                            checked={selectedSports.includes(sport)}
                            onChange={e => {
                              if (e.target.checked) {
                                setSelectedSports([...selectedSports, sport]);
                              } else {
                                setSelectedSports(selectedSports.filter(s => s !== sport));
                              }
                            }}
                            className='rounded bg-gray-700 border-gray-600'
                          />
                          <span className='text-sm'>
                            {getSportIcon(sport)} {sport}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Confidence Range */}
                  <div>
                    <label className='block text-sm font-medium mb-2'>
                      Confidence: {confidenceRange[0]}% - {confidenceRange[1]}%
                    </label>
                    <div className='space-y-2'>
                      <input
                        type='range'
                        min='0'
                        max='100'
                        step='5'
                        value={confidenceRange[0]}
                        onChange={e =>
                          setConfidenceRange([Number(e.target.value), confidenceRange[1]])
                        }
                        className='w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer'
                      />
                      <input
                        type='range'
                        min='0'
                        max='100'
                        step='5'
                        value={confidenceRange[1]}
                        onChange={e =>
                          setConfidenceRange([confidenceRange[0], Number(e.target.value)])
                        }
                        className='w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer'
                      />
                    </div>
                  </div>

                  {/* Edge Range */}
                  <div>
                    <label className='block text-sm font-medium mb-2'>
                      Edge: {edgeRange[0]}% - {edgeRange[1]}%
                    </label>
                    <div className='space-y-2'>
                      <input
                        type='range'
                        min='-5'
                        max='20'
                        step='1'
                        value={edgeRange[0]}
                        onChange={e => setEdgeRange([Number(e.target.value), edgeRange[1]])}
                        className='w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer'
                      />
                      <input
                        type='range'
                        min='-5'
                        max='20'
                        step='1'
                        value={edgeRange[1]}
                        onChange={e => setEdgeRange([edgeRange[0], Number(e.target.value)])}
                        className='w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer'
                      />
                    </div>
                  </div>
                </div>

                {/* EV Filter Section */}
                <div className='grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-700'>
                  {/* EV Range Filter */}
                  <div>
                    <label className='block text-sm font-medium mb-2'>
                      EV Range: {evRange[0]}% - {evRange[1]}%
                    </label>
                    <div className='space-y-2'>
                      <input
                        type='range'
                        min='-10'
                        max='25'
                        step='1'
                        value={evRange[0]}
                        onChange={e => setEvRange([Number(e.target.value), evRange[1]])}
                        className='w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer'
                      />
                      <input
                        type='range'
                        min='-10'
                        max='25'
                        step='1'
                        value={evRange[1]}
                        onChange={e => setEvRange([evRange[0], Number(e.target.value)])}
                        className='w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer'
                      />
                    </div>
                  </div>

                  {/* EV Tier Filter */}
                  <div>
                    <label className='block text-sm font-medium mb-2'>EV Tiers</label>
                    <div className='space-y-2'>
                      {[
                        { tier: 'high', label: 'High (8%+)', color: 'text-green-400' },
                        { tier: 'moderate', label: 'Moderate (3-8%)', color: 'text-yellow-400' },
                        { tier: 'low', label: 'Low (0-3%)', color: 'text-gray-400' },
                        { tier: 'negative', label: 'Negative (<0%)', color: 'text-red-400' },
                      ].map(({ tier, label, color }) => (
                        <label key={tier} className='flex items-center gap-2'>
                          <input
                            type='checkbox'
                            checked={selectedEvTiers.includes(tier)}
                            onChange={e => {
                              if (e.target.checked) {
                                setSelectedEvTiers([...selectedEvTiers, tier]);
                              } else {
                                setSelectedEvTiers(selectedEvTiers.filter(t => t !== tier));
                              }
                            }}
                            className='rounded bg-gray-700 border-gray-600'
                          />
                          <span className={`text-sm ${color}`}>{label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Phase 1.2 Enhanced Filters */}
                <div className='grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-gray-700'>
                  {/* Arbitrage Filter */}
                  <div>
                    <label className='flex items-center gap-2'>
                      <input
                        type='checkbox'
                        checked={showArbitrageOnly}
                        onChange={e => setShowArbitrageOnly(e.target.checked)}
                        className='rounded bg-gray-700 border-gray-600'
                      />
                      <span className='text-sm font-medium'>🎯 Arbitrage Opportunities Only</span>
                    </label>
                  </div>

                  {/* Low Juice Filter */}
                  <div>
                    <label className='flex items-center gap-2'>
                      <input
                        type='checkbox'
                        checked={showLowJuiceOnly}
                        onChange={e => setShowLowJuiceOnly(e.target.checked)}
                        className='rounded bg-gray-700 border-gray-600'
                      />
                      <span className='text-sm font-medium'>⚡ Low Juice Only</span>
                      {showLowJuiceOnly && (
                        <span className='ml-2 px-2 py-1 bg-green-600 text-white text-xs rounded-full'>
                          &lt;3% Vig
                        </span>
                      )}
                    </label>
                  </div>

                  {/* Minimum Bookmakers */}
                  <div>
                    <label className='block text-sm font-medium mb-2'>
                      Min Bookmakers: {minBookmakers}
                    </label>
                    <input
                      type='range'
                      min='1'
                      max='5'
                      step='1'
                      value={minBookmakers}
                      onChange={e => setMinBookmakers(Number(e.target.value))}
                      className='w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer'
                    />
                  </div>

                  {/* Sharp Money Filter */}
                  <div>
                    <label className='block text-sm font-medium mb-2'>Sharp Money</label>
                    <div className='space-y-1'>
                      {['heavy', 'moderate', 'light'].map(level => (
                        <label key={level} className='flex items-center gap-2'>
                          <input
                            type='checkbox'
                            checked={selectedSharpMoney.includes(level)}
                            onChange={e => {
                              if (e.target.checked) {
                                setSelectedSharpMoney([...selectedSharpMoney, level]);
                              } else {
                                setSelectedSharpMoney(selectedSharpMoney.filter(l => l !== level));
                              }
                            }}
                            className='rounded bg-gray-700 border-gray-600'
                          />
                          <span className='text-xs capitalize'>{level}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                {/* NEW: Phase 4.2 EV Filters */}
                <div className='grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-gray-700'>
                  {/* EV Percent Filter */}
                  <div>
                    <label className='block text-sm font-medium mb-2'>
                      Min EV: {formatEvPercent(minEvPercent)}
                    </label>
                    <input
                      type='range'
                      min='-10'
                      max='20'
                      step='0.5'
                      value={minEvPercent}
                      onChange={e => {
                        const value = Number(e.target.value);
                        setMinEvPercent(value);
                        // Log telemetry for filter usage
                        evTelemetry.logEvent('ev_filter_used', { filterThreshold: value });
                      }}
                      className='w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer'
                    />
                    <div className='flex justify-between text-xs text-gray-400 mt-1'>
                      <span>-10%</span>
                      <span>0%</span>
                      <span>+20%</span>
                    </div>
                  </div>

                  {/* Custom EV Threshold */}
                  <div>
                    <label className='block text-sm font-medium mb-2'>
                      Value Threshold: {formatEvPercent(customEvThreshold)}
                    </label>
                    <input
                      type='range'
                      min='1'
                      max='15'
                      step='0.5'
                      value={customEvThreshold}
                      onChange={e => setCustomEvThreshold(Number(e.target.value))}
                      className='w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer'
                    />
                    <div className='text-xs text-gray-400 mt-1'>
                      Opportunities above this % show "Value" badge
                    </div>
                  </div>

                  {/* Bookmark Filter */}
                  <div className='flex flex-col gap-2'>
                    <label className='flex items-center gap-2'>
                      <input
                        type='checkbox'
                        checked={showBookmarkedOnly}
                        onChange={e => setShowBookmarkedOnly(e.target.checked)}
                        className='rounded bg-gray-700 border-gray-600'
                      />
                      <span className='text-sm font-medium'>❤️ Show Bookmarked Only</span>
                    </label>
                    <div className='text-xs text-gray-400'>
                      {bookmarkService.getBookmarkCount()} opportunities bookmarked
                    </div>
                  </div>

                  {/* Volatility threshold */}
                  <div>
                    <label className='block text-sm font-medium mb-2'>
                      Volatility Min: {volatilityMin.toFixed(1)}
                    </label>
                    <input
                      type='range'
                      min='0'
                      max='20'
                      step='0.5'
                      value={volatilityMin}
                      onChange={e => setVolatilityMin(Number(e.target.value))}
                      className='w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer'
                    />
                    <div className='text-xs text-gray-400 mt-1'>
                      Based on recent performance variation
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Performance Metrics */}
          {showPerformanceMetrics && (
            <PerformanceMetrics opportunities={filteredOpportunities} />
          )}

          {/* Results Summary */}
          <div className='mb-4 flex justify-between items-center'>
            <p className='text-gray-400'>
              Showing {filteredOpportunities.length} of {serverFilteredCount} opportunities (server
              total {totalServerCount})
            </p>
            {shouldVirtualize && (
              <div className='text-sm text-blue-400 flex items-center gap-1'>
                <Zap className='w-4 h-4' />
                Virtualized rendering active
              </div>
            )}
          </div>

          {/* Enhanced Data Table */}
          {filteredOpportunities.length === 0 ? (
            // If server has items but client filters excluded all, show helpful hint and quick actions
            stats && (stats.total_opportunities ?? 0) > 0 ? (
              <div className='text-center py-12 text-gray-400'>
                <Target className='w-16 h-16 mx-auto mb-4 text-gray-600' />
                <div className='text-xl mb-2'>No opportunities match your current filters</div>
                <div className='text-sm mb-4'>
                  Server has <strong className='text-blue-300'>{stats.total_opportunities}</strong>{' '}
                  opportunities but your filters removed them.
                </div>
                <div className='flex items-center justify-center gap-3'>
                  <button
                    onClick={() => {
                      // Clear common filters quickly
                      setSearchQuery('');
                      setServerSearchQuery('');
                      setSelectedSports(['NBA', 'MLB']);
                      setConfidenceRange([0, 100]);
                      setEdgeRange([0, 20]);
                      setEvRange([0, 100]);
                      setSelectedEvTiers(['high', 'moderate', 'low', 'negative']);
                      setShowBookmarkedOnly(false);
                      setSelectedSharpMoney([]);
                      // Trigger a data refresh
                      try {
                        refreshData();
                      } catch {
                        /* ignore */
                      }
                    }}
                    className='px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700'
                  >
                    Clear filters
                  </button>
                  <button
                    onClick={() => {
                      try {
                        refreshData();
                      } catch {
                        // intentionally ignored (refresh failure shouldn't block UI)
                      }
                    }}
                    className='px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600'
                  >
                    Re-fetch
                  </button>
                </div>
                <div className='text-xs text-gray-500 mt-4'>
                  Tip: try clearing search or relaxing sliders to see more opportunities.
                </div>
              </div>
            ) : (
              <div className='text-center py-12 text-gray-400'>
                <Target className='w-16 h-16 mx-auto mb-4 text-gray-600' />
                <div className='text-xl mb-2'>No opportunities match your current filters</div>
                <div className='text-sm'>Try adjusting your filters or search criteria</div>
              </div>
            )
          ) : (
            <>
              {/* Enhanced Table Header */}
              <div data-testid='prop-list'>
                <div
                  className={`grid gap-4 px-4 py-3 bg-gray-800 border-b border-gray-700 text-sm font-medium text-gray-300 ${
                    showCLV ? 'grid-cols-10' : 'grid-cols-9'
                  }`}
                >
                  <div>Player</div>
                  <div>Market & Line</div>
                  <div>Best Odds</div>
                  <div>Confidence</div>
                  <div>Edge/Value</div>
                  <div>EV & Outliers</div>
                  {showCLV && (
                    <div
                      className='cursor-pointer hover:text-white transition-colors flex items-center gap-1'
                      onClick={() => setSortBy('clv')}
                      title='Click to sort by CLV'
                    >
                      CLV%
                      {sortBy === 'clv' &&
                        (sortOrder === 'desc' ? (
                          <ArrowDown className='w-3 h-3' />
                        ) : (
                          <ArrowUp className='w-3 h-3' />
                        ))}
                    </div>
                  )}
                  <div>Bookmakers</div>
                  <div>Insights</div>
                  <div>Actions</div>
                </div>

                {/* Enhanced Table Body */}
                {shouldVirtualize ? (
                  <div ref={parentRef} className='h-96 overflow-auto' style={{ contain: 'strict' }}>
                    <div
                      style={{
                        height: `${virtualizer.getTotalSize()}px`,
                        width: '100%',
                        position: 'relative',
                      }}
                    >
                      {virtualizer.getVirtualItems().map(virtualItem => {
                        const opportunity = filteredOpportunities[virtualItem.index];
                        return (
                          <div
                            key={virtualItem.key}
                            style={{
                              position: 'absolute',
                              top: 0,
                              left: 0,
                              width: '100%',
                              height: `${virtualItem.size}px`,
                              transform: `translateY(${virtualItem.start}px)`,
                            }}
                            className={`grid gap-4 px-4 py-3 hover:bg-gray-800 transition-colors items-center border-b border-gray-700 ${
                              showCLV ? 'grid-cols-10' : 'grid-cols-9'
                            }`}
                            data-testid='prop-card'
                          >
                            <ErrorBoundary
                              FallbackComponent={({ error, resetErrorBoundary }) => (
                                <div className='text-sm text-red-400'>
                                  Row failed to render
                                  <button
                                    onClick={() => resetErrorBoundary()}
                                    className='ml-2 underline'
                                  >
                                    retry
                                  </button>
                                </div>
                              )}
                              onError={(error, info) => {
                                // Development-only telemetry
                                if (process.env.NODE_ENV === 'development') {
                                  // eslint-disable-next-line no-console
                                  console.error('[PropFinder] row render error', error, info);
                                }
                              }}
                            >
                              <OpportunityRow
                                opportunity={opportunity}
                                onBookmarkToggle={handleBookmarkToggle}
                                customEvThreshold={customEvThreshold}
                                showCLV={showCLV}
                                onSetAlert={(_player, _sport, _market, _book) => {
                                  setSelectedOpportunity(opportunity);
                                  setShowLineMovementModal(true);
                                }}
                              />
                            </ErrorBoundary>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className='divide-y divide-gray-700'>
                    {filteredOpportunities.map(opportunity => (
                      <div
                        key={opportunity.id}
                        data-testid='prop-card'
                        className={`grid gap-4 px-4 py-3 hover:bg-gray-800 transition-colors items-center ${
                          showCLV ? 'grid-cols-10' : 'grid-cols-9'
                        }`}
                      >
                        <OpportunityRow
                          opportunity={opportunity}
                          onBookmarkToggle={handleBookmarkToggle}
                          customEvThreshold={customEvThreshold}
                          showCLV={showCLV}
                          onSetAlert={(_player, _sport, _market, _book) => {
                            setSelectedOpportunity(opportunity);
                            setShowLineMovementModal(true);
                          }}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Pagination: Load more button */}
              {hasMore && (
                <div className='flex justify-center mt-4'>
                  <button
                    onClick={async () => {
                      try {
                        await loadMore();
                      } catch {
                        // intentionally ignored (refresh failure shouldn't block UI)
                      }
                    }}
                    disabled={loading}
                    className='px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700'
                  >
                    {loading ? 'Loading…' : 'Load more'}
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Live Arbitrage Panel */}
        {showArbitrage && (
          <div className='mt-6'>
            <LiveArbitragePanel
              selectedSport={selectedSports.length === 1 ? selectedSports[0] : 'NBA'}
              autoRefresh={true}
              refreshInterval={30000}
            />
          </div>
        )}

        {/* Line Movement Modal */}
        {showLineMovementModal && selectedOpportunity && (
          <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
            <div className='bg-gray-900 rounded-lg w-full max-w-6xl mx-4 border border-gray-700 max-h-[90vh] overflow-hidden'>
              {/* Header */}
              <div className='flex items-center justify-between p-4 border-b border-gray-700'>
                <h3 className='text-xl font-bold text-white'>Line Movement Analysis</h3>
                <button
                  onClick={() => setShowLineMovementModal(false)}
                  className='text-gray-400 hover:text-white transition-colors'
                >
                  <X className='w-6 h-6' />
                </button>
              </div>

              {/* Content */}
              <div className='overflow-auto max-h-[calc(90vh-80px)]'>
                <MovementAnalysis
                  data={{
                    prop_id: selectedOpportunity.id,
                    sportsbook: selectedOpportunity.bestBookmaker || 'Unknown',
                    total_snapshots: oddsHistoryData?.length || 0,
                    date_range: {
                      start: oddsHistoryData?.[0]?.captured_at || new Date().toISOString(),
                      end:
                        oddsHistoryData?.[oddsHistoryData.length - 1]?.captured_at ||
                        new Date().toISOString(),
                    },
                    snapshots: oddsHistoryData || [],
                  }}
                  title={`${selectedOpportunity.player || 'Unknown Player'} - ${
                    selectedOpportunity.market || 'Unknown Market'
                  }`}
                  height={500}
                  showAlerts={true}
                  showSteamDetection={true}
                />
              </div>
            </div>
          </div>
        )}
      </div>
      <DebugOverlay
        activeFilters={activeFilters}
        stats={stats}
        opportunitiesCount={opportunities.length}
      />
    </>
  );
};

//Enhanced Opportunity row component with Phase 4.2 EV features
const OpportunityRowInner: React.FC<{
  opportunity: PropOpportunity;
  onBookmarkToggle: (id: string, isBookmarked: boolean) => void;
  onSetAlert: (player: string, sport: string, market: string, book: string) => void;
  customEvThreshold: number;
  showCLV: boolean;
}> = ({ opportunity, onBookmarkToggle, onSetAlert, customEvThreshold, showCLV }) => {
  const [isFavorited, setIsFavorited] = useState(Boolean(opportunity.isBookmarked));

  const safePlayer = opportunity.player || 'Unknown Player';
  const safeInitials = (() => {
    try {
      if (!safePlayer || typeof safePlayer !== 'string') return '??';
      return (
        safePlayer
          .split(' ')
          .filter(Boolean)
          .map(n => n[0])
          .join('') || '??'
      );
    } catch {
      return '??';
    }
  })();
  const safeTimeToGame = opportunity.timeToGame || 'Unknown';

  const handleBookmarkClick = () => {
    const newState = !isFavorited;
    setIsFavorited(newState);
    onBookmarkToggle(opportunity.id, Boolean(opportunity.isBookmarked));
  };

  const handleSetAlert = () => {
    onSetAlert(
      safePlayer,
      safeSport,
      opportunity.market || 'Unknown',
      opportunity.bestBookmaker || 'Unknown'
    );
  };

  // Safe accessors with defaults
  const safeConfidence = opportunity.confidence || 0;
  const safeEdge = opportunity.edge || 0;
  const safeOdds = opportunity.odds || 0;
  const safeAiProbability = opportunity.aiProbability || 0;
  const safeProjectedValue = opportunity.projectedValue || 0;
  const safeSport = opportunity.sport || 'Unknown';
  const safePick = opportunity.pick || 'over';
  const safeLine = opportunity.line || 0;

  return (
    <>
      {/* Enhanced Player Column with Avatar and Team */}
      <div className='flex items-center space-x-3'>
        <div className='relative'>
          <div className='w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-lg'>
            {safeInitials}
          </div>
          {opportunity.alertTriggered && (
            <div className='absolute -top-1 -right-1 w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center'>
              <AlertTriangle className='w-3 h-3 text-white' />
            </div>
          )}
        </div>
        <div>
          <div className='font-medium text-white'>{safePlayer}</div>
          <div className='text-xs text-gray-400 flex items-center gap-1'>
            <span>{getSportIcon(safeSport)}</span>
            <span>{opportunity.team || 'Unknown Team'}</span>
            <span className='mx-1'>vs</span>
            <span>{opportunity.opponent || 'Unknown Opponent'}</span>
          </div>
        </div>
      </div>

      {/* Enhanced Market & Line Column */}
      <div className='space-y-1'>
        <div className='font-medium text-white'>{opportunity.market || 'Unknown Market'}</div>
        <div className='text-sm text-blue-400'>
          {safePick.toUpperCase()} {safeLine}
        </div>
        <div className='text-xs text-gray-400'>{safeTimeToGame}</div>
      </div>

      {/* Best Odds Column with Best Book */}
      <div className='space-y-1'>
        <div className='font-bold text-lg text-white'>{formatOdds(safeOdds)}</div>
        {opportunity.bestBookmaker && (
          <div className='text-xs text-green-400'>Best: {opportunity.bestBookmaker}</div>
        )}
        {opportunity.oddsSpread && opportunity.oddsSpread > 10 && (
          <div className='text-xs text-yellow-400'>Spread: {opportunity.oddsSpread}</div>
        )}
        {opportunity.isLowJuice && (
          <div className='text-xs bg-green-600 text-white px-2 py-1 rounded-full font-bold'>
            ⚡ Low Juice
          </div>
        )}
        {opportunity.vigPercent && (
          <div className='text-xs text-gray-400'>Vig: {opportunity.vigPercent.toFixed(1)}%</div>
        )}
      </div>

      {/* Enhanced Confidence Column */}
      <div className='space-y-1'>
        <div className='flex items-center gap-2'>
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold text-white ${getConfidenceColor(
              safeConfidence
            )}`}
          >
            {Math.round(safeConfidence)}%
          </div>
        </div>
        <div className='text-xs text-gray-400'>AI: {safeAiProbability.toFixed(1)}%</div>
      </div>

      {/* Enhanced Edge/Value Column */}
      <div className='space-y-1'>
        <div className={`font-bold text-lg ${getEdgeColor(safeEdge)}`}>
          {safeEdge > 0 ? '+' : ''}
          {safeEdge.toFixed(1)}%
        </div>
        <div className='text-xs text-gray-400'>Value: ${safeProjectedValue.toFixed(2)}</div>
        {opportunity.hasArbitrage && (
          <ArbitrageBadge
            profitPct={opportunity.arbitrageProfitPct}
            books={
              Array.isArray(opportunity.bookmakers)
                ? opportunity.bookmakers.map(b => ({ name: b.name }))
                : []
            }
          />
        )}
      </div>

      {/* NEW: EV & Outliers Column */}
      <div className='space-y-1'>
        {opportunity.evPercent !== undefined && opportunity.evPercent !== null ? (
          <>
            <EvPill evPercent={opportunity.evPercent} />
            {shouldShowEvBadge(opportunity.evPercent) && (
              <div
                className={`text-xs text-white px-2 py-1 rounded-full font-bold ${getEvBadgeColorClass(
                  opportunity.evPercent
                )}`}
              >
                {opportunity.evPercent >= 7
                  ? 'GREEN'
                  : opportunity.evPercent >= 4
                  ? 'ORANGE'
                  : opportunity.evPercent >= 2
                  ? 'YELLOW'
                  : 'GRAY'}{' '}
                EV
              </div>
            )}
            {isValuePlay(opportunity.evPercent, opportunity.isOutlier, customEvThreshold) && (
              <div className='text-xs bg-yellow-600 text-white px-2 py-1 rounded-full font-bold flex items-center gap-1'>
                💎 VALUE
              </div>
            )}
          </>
        ) : (
          <div className='text-xs text-gray-500'>EV: N/A</div>
        )}
      </div>

      {/* NEW: CLV Column */}
      {showCLV && (
        <div className='space-y-1'>
          {opportunity.clvPercent !== undefined && opportunity.clvPercent !== null ? (
            <>
              <span
                style={{
                  backgroundColor: clvColor(opportunity.clvPercent),
                  color: '#ffffff',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  fontSize: '14px',
                  fontWeight: 'bold',
                }}
                title={clvTooltip(opportunity.clvPercent)}
              >
                {formatClvPercent(opportunity.clvPercent)}
              </span>
              {opportunity.closingLine && (
                <div className='text-xs text-gray-400'>Close: {opportunity.closingLine}</div>
              )}
            </>
          ) : (
            <div className='text-xs text-gray-500'>--</div>
          )}
        </div>
      )}

      {/* Phase 1.2 - Bookmakers Column */}
      <div className='space-y-1'>
        <div className='flex items-center gap-1'>
          <Users className='w-4 h-4 text-gray-400' />
          <span className='text-sm font-medium'>
            {opportunity.numBookmakers || opportunity.bookmakers?.length || 1}
          </span>
        </div>
        <div className='text-xs text-gray-400'>
          {opportunity.bookmakers
            ?.slice(0, 2)
            .map(book => book.name)
            .join(', ')}
          {(opportunity.bookmakers?.length || 0) > 2 && '...'}
        </div>
        {opportunity.lineSpread && opportunity.lineSpread > 0.5 && (
          <div className='text-xs text-yellow-400'>
            Line Spread: {opportunity.lineSpread.toFixed(1)}
          </div>
        )}
        {/* Mini sparkline using recentForm (fallback) */}
        <MiniLineSparkline
          history={Array.isArray(opportunity.recentForm) ? opportunity.recentForm : []}
        />
      </div>

      {/* Insights Column */}
      <div className='space-y-1'>
        <div className='flex flex-wrap gap-1'>
          {opportunity.tags?.slice(0, 2).map(tag => (
            <span key={tag} className='text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded'>
              {tag}
            </span>
          ))}
        </div>
        <div className='text-xs text-gray-400'>Sharp: {opportunity.sharpMoney || 'moderate'}</div>
      </div>

      {/* Enhanced Actions Column */}
      <div className='flex items-center gap-2'>
        <Heart
          onClick={handleBookmarkClick}
          className={`w-5 h-5 cursor-pointer transition-colors ${
            isFavorited ? 'fill-red-500 text-red-500' : 'text-gray-400 hover:text-red-400'
          }`}
        />
        <Bell
          onClick={handleSetAlert}
          className='w-5 h-5 cursor-pointer transition-colors text-gray-400 hover:text-yellow-400'
        />
        {safeEdge > 10 && (
          <div className='text-xs bg-yellow-600 text-white px-2 py-1 rounded-full font-bold'>
            🔥 HOT
          </div>
        )}
        {opportunity.hasArbitrage && (
          <ArbitrageBadge
            profitPct={opportunity.arbitrageProfitPct}
            books={
              Array.isArray(opportunity.bookmakers)
                ? opportunity.bookmakers.map(b => ({ name: b.name }))
                : []
            }
          />
        )}
      </div>

      {/* NEW: CLV Column (conditional) */}
      {showCLV && (
        <div className='space-y-1' title={clvTooltip(opportunity.clvPercent)}>
          <div className='font-bold text-lg' style={{ color: clvColor(opportunity.clvPercent) }}>
            {formatClvPercent(opportunity.clvPercent)}
          </div>
          {opportunity.closingLine && opportunity.closingOdds && (
            <div className='text-xs text-gray-400'>
              Close: {opportunity.closingLine} ({opportunity.closingOdds > 0 ? '+' : ''}
              {opportunity.closingOdds})
            </div>
          )}
        </div>
      )}
    </>
  );
};

const OpportunityRow = React.memo(OpportunityRowInner);

export default PropFinderDashboard;

// Dev-only debug overlay to surface PropFinder fetch diagnostics (shown only in development)
const DebugOverlay: React.FC<{
  activeFilters: Record<string, unknown> | null | undefined;
  stats: unknown;
  opportunitiesCount: number;
}> = ({ activeFilters, stats, opportunitiesCount }) => {
  const [open, setOpen] = React.useState(false);
  const [lastResponse, setLastResponse] = React.useState<unknown>(null);
  const [lastStatus, setLastStatus] = React.useState<unknown>(null);
  const [lastParams, setLastParams] = React.useState<unknown>(null);
  const [forceShowAll, setForceShowAll] = React.useState<boolean>(() => {
    try {
      if (typeof window === 'undefined') return false;
      // prefer explicit window override, fallback to persisted localStorage flag

      const w = window as DevWindow;
      if (w.__propfinder_force_show_all) return true;
      // persisted flag (used by Playwright storageState creation)
      if (
        typeof localStorage !== 'undefined' &&
        localStorage.getItem('__propfinder_force_show_all') === '1'
      )
        return true;
    } catch {
      /* ignore */
    }
    return false;
  });

  React.useEffect(() => {
    try {
      const w = typeof window !== 'undefined' ? (window as DevWindow) : undefined;
      setLastResponse(w && w.__propfinder_last_response ? w.__propfinder_last_response : null);
      setLastStatus(
        w && w.__propfinder_last_fetch_status ? w.__propfinder_last_fetch_status : null
      );
      setLastParams(
        w && w.__propfinder_last_request_params ? w.__propfinder_last_request_params : null
      );
      setForceShowAll(Boolean(w && w.__propfinder_force_show_all));
    } catch {
      // ignore
    }
  }, [opportunitiesCount, stats, activeFilters]);

  if (process.env.NODE_ENV !== 'development') return null;

  return (
    <div style={{ position: 'fixed', right: 12, bottom: 12, zIndex: 9999 }}>
      <div className='bg-gray-800 border border-gray-700 text-xs text-gray-200 p-2 rounded-lg shadow-lg w-96'>
        <div className='flex items-center justify-between'>
          <div className='font-medium'>PropFinder Debug</div>
          <div className='flex items-center gap-2'>
            <button
              onClick={() => {
                const newState = !forceShowAll;
                try {
                  if (typeof window !== 'undefined')
                    (window as DevWindow).__propfinder_force_show_all = newState;
                  if (typeof localStorage !== 'undefined')
                    localStorage.setItem('__propfinder_force_show_all', newState ? '1' : '0');
                } catch {
                  /* ignore */
                }
                setForceShowAll(newState);
              }}
              title='Dev: show all server items (bypass client filters)'
              className={`px-2 py-1 rounded text-xs transition-colors ${
                forceShowAll ? 'bg-yellow-600 text-black' : 'bg-gray-700 text-gray-300'
              }`}
            >
              {forceShowAll ? 'Showing Server Items' : 'Show Server Items'}
            </button>
            <button
              onClick={() => setOpen(prev => !prev)}
              className='text-gray-400 hover:text-white ml-2 text-sm px-2 py-1'
            >
              {open ? 'Close' : 'Open'}
            </button>
          </div>
        </div>
        {open && (
          <div className='mt-2 max-h-64 overflow-auto'>
            <div className='mb-2'>
              <strong>Opportunities (client):</strong> {opportunitiesCount}
            </div>
            <div className='mb-2'>
              <strong>Server Stats:</strong>
              <pre className='text-xs whitespace-pre-wrap break-words'>
                {JSON.stringify(stats, null, 2)}
              </pre>
            </div>
            <div className='mb-2'>
              <strong>Active Filters:</strong>
              <pre className='text-xs whitespace-pre-wrap break-words'>
                {JSON.stringify(activeFilters, null, 2)}
              </pre>
            </div>
            <div className='mb-2'>
              <strong>Last Fetch Status:</strong>
              <pre className='text-xs whitespace-pre-wrap break-words'>
                {JSON.stringify(lastStatus, null, 2)}
              </pre>
            </div>
            <div className='mb-2'>
              <strong>Last Request Params:</strong>
              <pre className='text-xs whitespace-pre-wrap break-words'>
                {JSON.stringify(lastParams, null, 2)}
              </pre>
            </div>
            <div>
              <strong>Last Response (sample):</strong>
              <pre className='text-xs whitespace-pre-wrap break-words'>
                {JSON.stringify(
                  (() => {
                    if (!lastResponse) return null;
                    if (typeof lastResponse === 'object' && lastResponse !== null) {
                      const lr = lastResponse as Record<string, unknown>;
                      const data = lr['data'];
                      if (data && typeof data === 'object') {
                        const d = data as Record<string, unknown>;
                        const sample = Array.isArray(d['opportunities'])
                          ? (d['opportunities'] as unknown[]).slice(0, 2)
                          : undefined;
                        return { summary: d['summary'], sample };
                      }
                    }
                    return lastResponse;
                  })(),
                  null,
                  2
                )}
              </pre>
            </div>
          </div>
        )}
      </div>

      {/* Dashboard Settings Panel */}
      <DashboardSettingsPanel
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        layout={dashboardLayout}
        onLayoutChange={setDashboardLayout}
        showMetrics={showPerformanceMetrics}
        onShowMetricsChange={setShowPerformanceMetrics}
        enableRealTime={enableRealTimeUpdates}
        onEnableRealTimeChange={setEnableRealTimeUpdates}
        autoRefresh={autoRefresh}
        onAutoRefreshChange={setAutoRefresh}
      />
    </div>
  );
};
