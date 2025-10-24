/**
 * Positive EV Feed Component
 *
 * Professional interface for displaying positive expected value betting opportunities.
 * Features real-time updates, filtering, virtualization, and EV tier badge coloring.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useVirtualizer } from '@tanstack/react-virtual';
import {
  AlertCircle,
  BarChart3,
  Clock,
  Database,
  Filter,
  Layers,
  RefreshCw,
  Search,
  Target,
  TrendingUp,
  Zap,
} from 'lucide-react';

import {
  EVFeedFilters,
  EVFeedResponse,
  EVFeedStats,
  EVOpportunity,
  EVTier,
  EV_TIER_COLORS,
  MARKET_TYPE_INFO,
  MarketType,
  SPORT_INFO,
  SportType,
  formatEVPercent,
  formatOdds,
} from '../types/ev-types';
import { evWebSocketService } from '../services/EVWebSocketService';
import { httpFetch } from '../services/HttpClient';
import {
  EvFeedSummary,
  EvHistorySnapshot,
  appendHistorySnapshot,
  computeEvSummary,
} from '../utils/evFeedAnalytics';

const FILTER_STORAGE_KEY = 'a1b.evfeed.filters.v1';
const SETTINGS_STORAGE_KEY = 'a1b.evfeed.settings.v1';
const HISTORY_MIN_INTERVAL_MS = 10_000;
const ALL_TIERS: EVTier[] = [EVTier.LOW, EVTier.MEDIUM, EVTier.HIGH, EVTier.EXTREME];
const TIER_META: Record<EVTier, { label: string; description: string }> = {
  [EVTier.LOW]: {
    label: 'Value Edge',
    description: 'Stable opportunities offering modest positive expected value (0-5% EV).',
  },
  [EVTier.MEDIUM]: {
    label: 'Strong Edge',
    description: 'Compelling plays with enhanced edge and confidence (5-10% EV).',
  },
  [EVTier.HIGH]: {
    label: 'High Confidence',
    description: 'High conviction opportunities often backed by market imbalance (10-20% EV).',
  },
  [EVTier.EXTREME]: {
    label: 'Elite Edge',
    description: 'Rare opportunities with exceptional expected value (20%+ EV).',
  },
};

const sanitizeTiers = (tiers?: EVTier[]): EVTier[] => {
  if (!tiers || !tiers.length) {
    return [...ALL_TIERS];
  }

  const deduped = Array.from(new Set(tiers.filter(tier => ALL_TIERS.includes(tier))));
  return (deduped.length ? deduped : ALL_TIERS).slice() as EVTier[];
};

const clampConfidence = (value?: number): number => {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return 0;
  }

  return Math.min(Math.max(Math.round(value), 0), 100);
};

interface PositiveEVFeedProps {
  className?: string;
}

const PositiveEVFeed: React.FC<PositiveEVFeedProps> = ({ className = '' }) => {
  const [opportunities, setOpportunities] = useState<EVOpportunity[]>([]);
  const [summary, setSummary] = useState<EvFeedSummary>(() => computeEvSummary([]));
  const [history, setHistory] = useState<EvHistorySnapshot[]>([]);
  const [stats, setStats] = useState<EVFeedStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const [filters, setFilters] = useState<EVFeedFilters>({
    minEV: 3,
    sport: SportType.ALL,
    marketType: undefined,
    sourceBook: undefined,
    tiers: [...ALL_TIERS],
    minConfidence: 0,
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [expandedOpportunity, setExpandedOpportunity] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [isWebSocketConnected, setIsWebSocketConnected] = useState(false);

  const filtersInitializedRef = useRef(false);
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const virtualizedContainerRef = useRef<HTMLDivElement | null>(null);
  const lastSnapshotRef = useRef(0);

  const updateDerivedState = useCallback((next: EVOpportunity[]) => {
    const nextSummary = computeEvSummary(next);
    setSummary(nextSummary);

    const now = Date.now();
    if (now - lastSnapshotRef.current >= HISTORY_MIN_INTERVAL_MS) {
      lastSnapshotRef.current = now;
      setHistory(prev => appendHistorySnapshot(prev, next, 30, nextSummary));
    }
  }, []);

  const applyOpportunitiesUpdate = useCallback(
    (updater: (prev: EVOpportunity[]) => EVOpportunity[]) => {
      setOpportunities(prev => {
        const next = updater(prev);
        updateDerivedState(next);
        return next;
      });
    },
    [updateDerivedState]
  );

  // Fetch opportunities from API
  const fetchOpportunities = useCallback(async (showSpinner = true) => {
    try {
      if (showSpinner) setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      params.append('min_ev', filters.minEV.toString());
      params.append('sport', filters.sport);
      if (filters.marketType) params.append('market_type', filters.marketType);
      if (filters.sourceBook) params.append('source_book', filters.sourceBook);
      params.append('limit', '200');

      const response = await httpFetch(`/api/ev/feed?${params.toString()}`, {
        logLabel: 'ev-feed:list',
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch opportunities: ${response.statusText}`);
      }

      const data: EVFeedResponse = await response.json();
      applyOpportunitiesUpdate(() => data.opportunities);
      if (data.last_updated) {
        setLastUpdated(data.last_updated);
      }

      const statsResponse = await httpFetch('/api/ev/feed/stats', {
        logLabel: 'ev-feed:stats',
      });
      if (statsResponse.ok) {
        const statsData: EVFeedStats = await statsResponse.json();
        setStats(statsData);
      }

    } catch (err) {
      // Log error for debugging
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
    } finally {
      if (showSpinner) setLoading(false);
    }
  }, [applyOpportunitiesUpdate, filters]);

  // Manual refresh function
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      if (isWebSocketConnected) {
        // Use WebSocket for immediate update
        evWebSocketService.forceRefresh();
        // Wait a moment for the update
        await new Promise(resolve => setTimeout(resolve, 500));
      } else {
        // Fallback to HTTP refresh
        await httpFetch('/api/ev/feed/refresh', {
          method: 'POST',
          logLabel: 'ev-feed:refresh',
        });
        await new Promise(resolve => setTimeout(resolve, 1000));
        await fetchOpportunities(false);
      }
    } catch (err) {
      // Handle refresh error silently or show toast notification
      setError(err instanceof Error ? err.message : 'Failed to refresh feed');
    } finally {
      setRefreshing(false);
    }
  }, [fetchOpportunities, isWebSocketConnected]);

  const handleTierToggle = useCallback((tier: EVTier) => {
    setFilters(prev => {
      const current = sanitizeTiers(prev.tiers);
      const isActive = current.includes(tier);
      const nextTiers = isActive
        ? current.filter(value => value !== tier)
        : [...current, tier];
      return {
        ...prev,
        tiers: nextTiers.length ? nextTiers : [...ALL_TIERS],
      };
    });
  }, []);

  const handleSelectAllTiers = useCallback(() => {
    setFilters(prev => ({
      ...prev,
      tiers: [...ALL_TIERS],
    }));
  }, []);

  const handleMinConfidenceChange = useCallback((value: number) => {
    setFilters(prev => ({
      ...prev,
      minConfidence: clampConfidence(value),
    }));
  }, []);

  const handleClearConfidence = useCallback(() => {
    setFilters(prev => ({
      ...prev,
      minConfidence: 0,
    }));
  }, []);

  // Hydrate filters + settings once
  useEffect(() => {
    try {
      const storedFilters = localStorage.getItem(FILTER_STORAGE_KEY);
      if (storedFilters) {
        const parsed = JSON.parse(storedFilters) as Partial<EVFeedFilters>;
        setFilters(prev => {
          const next: EVFeedFilters = {
            ...prev,
            ...parsed,
          };
          next.tiers = sanitizeTiers(parsed.tiers as EVTier[] | undefined);
          next.minConfidence = clampConfidence(parsed.minConfidence);
          return next;
        });
      }

      const storedSettings = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (storedSettings) {
        const parsedSettings = JSON.parse(storedSettings);
        if (typeof parsedSettings.autoRefresh === 'boolean') {
          setAutoRefresh(parsedSettings.autoRefresh);
        }
      }
    } catch {
      // Ignore storage errors
    } finally {
      filtersInitializedRef.current = true;
    }
  }, []);

  useEffect(() => {
    if (!filtersInitializedRef.current) return;
    try {
      localStorage.setItem(
        FILTER_STORAGE_KEY,
        JSON.stringify({
          ...filters,
          tiers: sanitizeTiers(filters.tiers),
          minConfidence: clampConfidence(filters.minConfidence),
        })
      );
    } catch {
      // Ignore storage errors
    }
  }, [filters]);

  useEffect(() => {
    if (!filtersInitializedRef.current) return;
    try {
      localStorage.setItem(
        SETTINGS_STORAGE_KEY,
        JSON.stringify({ autoRefresh })
      );
    } catch {
      // Ignore storage errors
    }
  }, [autoRefresh]);

  // Set up auto-refresh
  useEffect(() => {
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
      refreshIntervalRef.current = null;
    }

    if (autoRefresh) {
      refreshIntervalRef.current = setInterval(() => {
        fetchOpportunities(false);
      }, 30_000);
    }

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
        refreshIntervalRef.current = null;
      }
    };
  }, [autoRefresh, fetchOpportunities]);

  // Initial load and WebSocket setup
  useEffect(() => {
    fetchOpportunities();

    // Set up WebSocket connection for real-time updates
    evWebSocketService.connect({
      onOpportunitiesUpdate: newOpportunities => {
        applyOpportunitiesUpdate(() => newOpportunities);
        setLastUpdated(new Date().toISOString());
      },
      onStatsUpdate: newStats => {
        setStats(newStats);
        if (newStats.last_generation_time) {
          setLastUpdated(newStats.last_generation_time);
        }
      },
      onNewOpportunity: opportunity => {
        applyOpportunitiesUpdate(prev => [opportunity, ...prev]);
        setLastUpdated(new Date().toISOString());
      },
      onOpportunityRemoved: opportunityId => {
        applyOpportunitiesUpdate(prev => prev.filter(opp => opp.id !== opportunityId));
        setLastUpdated(new Date().toISOString());
      },
      onConnectionChange: connected => {
        setIsWebSocketConnected(connected);
      },
      onError: error => {
        // Handle WebSocket errors gracefully
        setError(`Connection error: ${error.message}`);
      },
    });

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
        refreshIntervalRef.current = null;
      }
      evWebSocketService.disconnect();
    };
  }, [applyOpportunitiesUpdate, fetchOpportunities]);

  // Filter opportunities by search query
  const selectedTiers = useMemo(() => sanitizeTiers(filters.tiers), [filters.tiers]);
  const minConfidencePercent = useMemo(
    () => clampConfidence(filters.minConfidence),
    [filters.minConfidence]
  );

  const filteredOpportunities = useMemo(() => {
    const minEvDecimal = filters.minEV / 100;
    const hasConfidenceFilter = minConfidencePercent > 0;
    const minConfidenceDecimal = minConfidencePercent / 100;

    return opportunities
      .filter(opp => opp.ev_percent >= minEvDecimal)
      .filter(opp => (filters.sport === SportType.ALL ? true : opp.sport === filters.sport))
      .filter(opp => (filters.marketType ? opp.market_type === filters.marketType : true))
      .filter(opp => (filters.sourceBook ? opp.source_book === filters.sourceBook : true))
      .filter(opp => selectedTiers.includes(opp.ev_tier))
      .filter(opp =>
        hasConfidenceFilter ? (opp.confidence_score ?? 0) >= minConfidenceDecimal : true
      )
      .filter(opp => {
        if (!searchQuery.trim()) return true;
        const query = searchQuery.toLowerCase();
        return (
          opp.player.toLowerCase().includes(query) ||
          opp.market.toLowerCase().includes(query) ||
          opp.source_book.toLowerCase().includes(query) ||
          opp.game_info.toLowerCase().includes(query)
        );
      });
  }, [filters.marketType, filters.minEV, filters.sourceBook, filters.sport, minConfidencePercent, opportunities, searchQuery, selectedTiers]);

  const filteredSummary = useMemo(
    () => computeEvSummary(filteredOpportunities),
    [filteredOpportunities]
  );

  const tierEntries = useMemo(
    () =>
      Object.entries(filteredSummary.tierBreakdown).map(([tier, count]) => ({
        tier: tier as EVTier,
        count,
      })),
    [filteredSummary]
  );

  const recentHistory = useMemo(() => history.slice(-6).reverse(), [history]);

  const shouldVirtualize = filteredOpportunities.length > 60;

  const estimateOpportunityHeight = useCallback(
    (index: number) => {
      const baseHeight = 210;
      const opportunity = filteredOpportunities[index];
      if (!opportunity) return baseHeight;
      const isExpanded = expandedOpportunity === opportunity.id;
      return isExpanded ? baseHeight + 320 : baseHeight;
    },
    [expandedOpportunity, filteredOpportunities]
  );

  const opportunityVirtualizer = useVirtualizer({
    count: shouldVirtualize ? filteredOpportunities.length : 0,
    getScrollElement: () => virtualizedContainerRef.current,
    estimateSize: estimateOpportunityHeight,
    overscan: 6,
  });

  const cacheAgeSeconds = useMemo(() => {
    if (!stats) return null;
    const lastGenerated = new Date(stats.last_generation_time).getTime();
    if (Number.isNaN(lastGenerated)) return null;
    const ageMs = Date.now() - lastGenerated;
    return Math.max(Math.round(ageMs / 1000), 0);
  }, [stats]);

  const lastUpdatedLabel = useMemo(() => {
    if (!lastUpdated) return '—';
    const parsed = new Date(lastUpdated);
    if (Number.isNaN(parsed.getTime())) return '—';
    return parsed.toLocaleTimeString();
  }, [lastUpdated]);

  const backendAverageLabel = useMemo(
    () => (stats ? `Backend avg ${formatEVPercent(stats.avg_ev_percent)}` : 'Live calculations'),
    [stats]
  );

  const tierTotalForProgress = filteredSummary.total || 1;

  // EV Badge Component
  // Opportunity Card Component
  const OpportunityCard: React.FC<{ opportunity: EVOpportunity }> = ({ opportunity }) => {
    const isExpanded = expandedOpportunity === opportunity.id;
    const sportInfo = SPORT_INFO[opportunity.sport];
    
    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -12 }}
        className="bg-slate-900/70 rounded-xl border border-slate-800/70 shadow-lg shadow-black/40 hover:shadow-black/60 transition-all backdrop-blur"
      >
        <div
          className="p-5 cursor-pointer"
          onClick={() => setExpandedOpportunity(isExpanded ? null : opportunity.id)}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-2">
                <span className={`text-sm font-medium ${sportInfo?.color ?? 'text-slate-300'}`}>
                  {sportInfo?.icon ?? '🏟️'} {sportInfo?.name ?? opportunity.sport}
                </span>
                <span className="text-sm text-slate-500">•</span>
                <span className="text-sm text-slate-300 truncate">{opportunity.source_book}</span>
              </div>
              <h3 className="text-lg font-semibold text-white mb-1 truncate">{opportunity.player}</h3>
              <p className="text-sm text-slate-300 mb-2">{opportunity.market}</p>
              <p className="text-xs text-slate-400 mb-3 truncate">{opportunity.game_info}</p>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4 text-sm text-slate-200">
                  <div>
                    <span className="text-slate-400">Odds:</span>
                    <span className="ml-1 font-medium text-white">{formatOdds(opportunity.market_odds)}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Fair:</span>
                    <span className="ml-1 font-medium text-white">{formatOdds(opportunity.our_fair_odds)}</span>
                  </div>
                </div>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    EV_TIER_COLORS[opportunity.ev_tier]?.bg ?? 'bg-slate-800'
                  } ${EV_TIER_COLORS[opportunity.ev_tier]?.text ?? 'text-slate-200'}`}
                >
                  <TrendingUp className="w-3 h-3 mr-1" />
                  {formatEVPercent(opportunity.ev_percent)}
                </span>
              </div>
            </div>
          </div>
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="px-0 pt-4"
              >
                <div className="border-t border-slate-800/70 pt-4 space-y-3 text-sm text-slate-200">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-slate-400">Market Prob:</span>
                      <span className="ml-2 font-medium text-white">
                        {(opportunity.implied_probability * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400">Fair Prob:</span>
                      <span className="ml-2 font-medium text-white">
                        {(opportunity.fair_implied_probability * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400">Confidence:</span>
                      <span className="ml-2 font-medium text-white">
                        {((opportunity.confidence_score || 0) * 100).toFixed(0)}%
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400">Volume:</span>
                      <span className="ml-2 font-medium text-white">
                        {opportunity.volume_indicator || 'Unknown'}
                      </span>
                    </div>
                  </div>
                  {opportunity.updated_at && (
                    <div className="flex items-center justify-end text-xs text-slate-400">
                      Updated {new Date(opportunity.updated_at).toLocaleTimeString()}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    );
  };

  // Filter Panel Component
  const FilterPanel: React.FC = () => (
    <AnimatePresence>
      {showFilters && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="bg-slate-900/70 border-t border-slate-800/70 p-6 space-y-6 text-slate-200 backdrop-blur"
        >
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Minimum EV */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Min EV %
              </label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={filters.minEV}
                onChange={event =>
                  setFilters(prev => ({
                    ...prev,
                    minEV: parseFloat(event.target.value) || 0,
                  }))
                }
                className="w-full px-3 py-2 border border-slate-700 rounded-md text-sm bg-slate-900/60 text-slate-100 focus:ring-2 focus:ring-sky-500 focus:border-transparent"
              />
            </div>
            
            {/* Sport Filter */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Sport
              </label>
              <select
                value={filters.sport}
                onChange={event =>
                  setFilters(prev => ({ ...prev, sport: event.target.value as SportType }))
                }
                className="w-full px-3 py-2 border border-slate-700 rounded-md text-sm bg-slate-900/60 text-slate-100 focus:ring-2 focus:ring-sky-500 focus:border-transparent"
              >
                {Object.values(SportType).map(sport => (
                  <option key={sport} value={sport}>
                    {SPORT_INFO[sport].icon} {SPORT_INFO[sport].name}
                  </option>
                ))}
              </select>
            </div>
            
            {/* Market Type Filter */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Market Type
              </label>
              <select
                value={filters.marketType || ''}
                onChange={event =>
                  setFilters(prev => ({
                    ...prev,
                    marketType: event.target.value
                      ? (event.target.value as MarketType)
                      : undefined,
                  }))
                }
                className="w-full px-3 py-2 border border-slate-700 rounded-md text-sm bg-slate-900/60 text-slate-100 focus:ring-2 focus:ring-sky-500 focus:border-transparent"
              >
                <option value="">All Markets</option>
                {Object.values(MarketType).map(market => (
                  <option key={market} value={market}>
                    {MARKET_TYPE_INFO[market].name}
                  </option>
                ))}
              </select>
            </div>
            
            {/* Sportsbook Filter */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Sportsbook
              </label>
              <select
                value={filters.sourceBook || ''}
                onChange={event =>
                  setFilters(prev => ({
                    ...prev,
                    sourceBook: event.target.value || undefined,
                  }))
                }
                className="w-full px-3 py-2 border border-slate-700 rounded-md text-sm bg-slate-900/60 text-slate-100 focus:ring-2 focus:ring-sky-500 focus:border-transparent"
              >
                <option value="">All Books</option>
                <option value="DraftKings">DraftKings</option>
                <option value="FanDuel">FanDuel</option>
                <option value="BetMGM">BetMGM</option>
                <option value="Caesars">Caesars</option>
                <option value="PointsBet">PointsBet</option>
              </select>
            </div>
          </div>

          <div className="border-t border-slate-800/70 pt-4">
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm font-semibold text-slate-200">EV Tiers</div>
              <button
                type="button"
                onClick={handleSelectAllTiers}
                className="text-xs text-sky-300 hover:text-sky-200 font-medium"
              >
                Select all
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {ALL_TIERS.map(tier => {
                const meta = TIER_META[tier];
                const colors = EV_TIER_COLORS[tier];
                const isChecked = selectedTiers.includes(tier);
                return (
                  <label
                    key={tier}
                    className={`flex items-start space-x-3 rounded-lg border px-3 py-2 transition-colors ${
                      isChecked ? `${colors.border} ${colors.bg}` : 'border-slate-700 bg-slate-900/50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => handleTierToggle(tier)}
                      className="mt-1 h-4 w-4 rounded border-slate-600 bg-slate-900 text-sky-400 focus:ring-2 focus:ring-sky-500"
                    />
                    <div>
                      <p className="text-sm font-medium text-slate-100">{meta.label}</p>
                      <p className="text-xs text-slate-400">{meta.description}</p>
                    </div>
                  </label>
                );
              })}
            </div>
            <p className="text-xs text-slate-400 mt-2">
              Showing {selectedTiers.length} of {ALL_TIERS.length} tiers
            </p>
          </div>

          <div className="border-t border-slate-800/70 pt-4">
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm font-semibold text-slate-200">Minimum Confidence</div>
              <button
                type="button"
                onClick={handleClearConfidence}
                className="text-xs text-sky-300 hover:text-sky-200 font-medium"
              >
                Reset
              </button>
            </div>
            <div className="flex flex-col md:flex-row md:items-center gap-3">
              <input
                type="range"
                min="0"
                max="100"
                step="1"
                value={minConfidencePercent}
                onChange={event => handleMinConfidenceChange(Number(event.target.value))}
                className="w-full md:flex-1 accent-sky-500"
              />
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="1"
                  value={minConfidencePercent}
                  onChange={event => handleMinConfidenceChange(Number(event.target.value))}
                  className="w-20 px-2 py-1 border border-slate-700 rounded-md text-sm bg-slate-900/60 text-slate-100 focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                />
                <span className="text-sm text-slate-300">%</span>
              </div>
            </div>
            <p className="text-xs text-slate-400 mt-2">
              Filters opportunities requiring a model confidence of at least {minConfidencePercent}%.
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center text-slate-100 px-4">
        <div className="text-center max-w-md p-8 bg-slate-900/70 border border-slate-800/70 rounded-2xl shadow-2xl shadow-black/40 backdrop-blur">
          <AlertCircle className="h-12 w-12 text-rose-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">Unable to load the +EV feed</h3>
          <p className="text-slate-300 mb-6">{error}</p>
          <button
            onClick={() => fetchOpportunities()}
            className="bg-blue-600/80 hover:bg-blue-500 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center text-slate-100 px-4">
        <div className="bg-slate-900/70 border border-slate-800/70 rounded-2xl p-12 text-center shadow-2xl shadow-black/40 backdrop-blur">
          <div className="relative h-12 w-12 mx-auto mb-6">
            <div className="absolute inset-0 animate-spin rounded-full border-4 border-cyan-400/70 border-t-transparent" />
            <div
              className="absolute inset-1 rounded-full border-4 border-purple-500/50 border-b-transparent animate-spin"
              style={{ animationDirection: 'reverse', animationDuration: '1.6s' }}
            />
          </div>
          <p className="text-sm text-slate-300">Loading live opportunities…</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100 ${className}`}>
      <div className="bg-slate-900/80 backdrop-blur border-b border-slate-800/70 shadow-[0_12px_40px_-20px_rgba(15,23,42,0.9)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center">
              <TrendingUp className="h-9 w-9 text-emerald-300 mr-3" />
              <div>
                <h1 className="text-2xl font-bold text-white">+EV Feed</h1>
                <p className="text-sm text-slate-300">Positive Expected Value Opportunities</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {stats && (
                <div className="hidden md:flex items-center space-x-6 text-sm text-slate-300">
                  <div className="flex items-center">
                    <Target className="h-4 w-4 mr-1 text-emerald-300" />
                    {stats.total_opportunities.toLocaleString()} opportunities
                  </div>
                  <div className="flex items-center">
                    <BarChart3 className="h-4 w-4 mr-1 text-sky-300" />
                    {formatEVPercent(stats.avg_ev_percent)} avg EV
                  </div>
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-1 text-amber-300" />
                    {new Date(stats.last_generation_time).toLocaleTimeString()}
                  </div>
                </div>
              )}
              <div className="flex items-center space-x-2">
                <div
                  className={`flex items-center px-2.5 py-1.5 rounded-lg text-xs font-medium tracking-wide shadow-inner ${
                    isWebSocketConnected
                      ? 'bg-emerald-500/15 text-emerald-200'
                      : 'bg-amber-500/15 text-amber-200'
                  }`}
                >
                  <div
                    className={`w-2 h-2 rounded-full mr-2 ${
                      isWebSocketConnected
                        ? 'bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.75)]'
                        : 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.75)]'
                    }`}
                  />
                  {isWebSocketConnected ? 'Live' : 'Polling'}
                </div>
                <button
                  onClick={() => setAutoRefresh(!autoRefresh)}
                  className={`p-2 rounded-lg transition-colors border border-transparent ${
                    autoRefresh
                      ? 'bg-emerald-500/10 text-emerald-200 hover:bg-emerald-500/20'
                      : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700/80'
                  }`}
                  title={autoRefresh ? 'Auto-refresh enabled' : 'Auto-refresh disabled'}
                >
                  <Zap className="h-4 w-4" />
                </button>
                <button
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="p-2 rounded-lg transition-colors border border-blue-500/40 bg-blue-500/10 text-sky-200 hover:bg-blue-500/20 disabled:opacity-60 disabled:cursor-not-allowed"
                  title="Manual refresh"
                >
                  <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                </button>
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`p-2 rounded-lg transition-colors border border-transparent ${
                    showFilters
                      ? 'bg-sky-500/20 text-sky-200 border-sky-500/40'
                      : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700/80'
                  }`}
                  title="Toggle filters"
                >
                  <Filter className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by player, market, or sportsbook..."
              value={searchQuery}
              onChange={event => setSearchQuery(event.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-700 bg-slate-900/70 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent shadow-inner shadow-slate-900/40"
            />
          </div>
        </div>
        <FilterPanel />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {filteredOpportunities.length === 0 ? (
          <div className="text-center py-12 bg-slate-900/60 border border-slate-800/70 rounded-2xl shadow-xl shadow-black/30 backdrop-blur">
            <Target className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">No Opportunities Found</h3>
            <p className="text-slate-300">Try adjusting your filters or check back later.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              <div className="bg-slate-900/70 border border-slate-800/70 rounded-2xl p-5 shadow-xl shadow-black/30 backdrop-blur">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center text-sm font-medium text-slate-300">
                    <Target className="h-4 w-4 text-emerald-300 mr-2" /> Active +EV
                  </div>
                  <span className="text-xs text-slate-400">Filtered</span>
                </div>
                <p className="text-3xl font-semibold text-white">{filteredSummary.total.toLocaleString()}</p>
                <p className="text-xs text-slate-400 mt-1">
                  {summary.total.toLocaleString()} opportunities overall
                </p>
              </div>
              <div className="bg-slate-900/70 border border-slate-800/70 rounded-2xl p-5 shadow-xl shadow-black/30 backdrop-blur">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center text-sm font-medium text-slate-300">
                    <BarChart3 className="h-4 w-4 text-sky-300 mr-2" /> Average EV
                  </div>
                  <span className="text-xs text-emerald-300">
                    Top {formatEVPercent(filteredSummary.topEv)}
                  </span>
                </div>
                <p className="text-3xl font-semibold text-white">
                  {formatEVPercent(filteredSummary.averageEv || 0)}
                </p>
                <p className="text-xs text-slate-400 mt-1">{backendAverageLabel}</p>
              </div>
              <div className="bg-slate-900/70 border border-slate-800/70 rounded-2xl p-5 shadow-xl shadow-black/30 backdrop-blur">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center text-sm font-medium text-slate-300">
                    <Layers className="h-4 w-4 text-purple-300 mr-2" /> Sportsbooks
                  </div>
                  <span className="text-xs text-slate-400">Markets {filteredSummary.uniqueMarkets}</span>
                </div>
                <p className="text-3xl font-semibold text-white">
                  {filteredSummary.uniqueBooks.toLocaleString()}
                </p>
                <p className="text-xs text-slate-400 mt-1">Unique books in filtered view</p>
              </div>
              <div className="bg-slate-900/70 border border-slate-800/70 rounded-2xl p-5 shadow-xl shadow-black/30 backdrop-blur">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center text-sm font-medium text-slate-300">
                    <Clock className="h-4 w-4 text-amber-300 mr-2" /> Last Update
                  </div>
                  <span className={`text-xs ${isWebSocketConnected ? 'text-emerald-300' : 'text-amber-200'}`}>
                    {isWebSocketConnected ? 'Live' : 'Polling'}
                  </span>
                </div>
                <p className="text-3xl font-semibold text-white">{lastUpdatedLabel}</p>
                <p className="text-xs text-slate-400 mt-1">
                  Cached age {cacheAgeSeconds != null ? `${cacheAgeSeconds}s` : 'n/a'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
              <div className="xl:col-span-2 bg-slate-900/70 border border-slate-800/70 rounded-2xl p-5 shadow-xl shadow-black/30 backdrop-blur">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center text-sm font-semibold text-slate-200">
                    <TrendingUp className="h-4 w-4 text-emerald-300 mr-2" /> EV Tier Distribution
                  </div>
                  <span className="text-xs text-slate-400">Snapshots {history.length}</span>
                </div>
                {tierEntries.length === 0 ? (
                  <p className="text-sm text-slate-400">Tier data not yet available.</p>
                ) : (
                  <div className="space-y-3">
                    {tierEntries.map(({ tier, count }) => {
                      const color = EV_TIER_COLORS[tier]?.badge ?? 'bg-slate-500';
                      const percent = Math.min(
                        Math.round((count / tierTotalForProgress) * 100),
                        100
                      );
                      const tierLabel = `${tier.charAt(0)}${tier.slice(1).toLowerCase()}`;
                      return (
                        <div key={tier} className="space-y-1">
                          <div className="flex items-center justify-between text-sm font-medium text-slate-200">
                            <span>{tierLabel}</span>
                            <span>
                              {count.toLocaleString()} ({percent}%)
                            </span>
                          </div>
                          <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                            <div className={`h-2 ${color}`} style={{ width: `${percent}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
              <div className="bg-slate-900/70 border border-slate-800/70 rounded-2xl p-5 shadow-xl shadow-black/30 backdrop-blur">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center text-sm font-semibold text-slate-200">
                    <Database className="h-4 w-4 text-indigo-300 mr-2" /> Recent Snapshots
                  </div>
                  <span className="text-xs text-slate-400">Every 10s max</span>
                </div>
                {recentHistory.length === 0 ? (
                  <p className="text-sm text-slate-400">No snapshot history captured yet.</p>
                ) : (
                  <div className="space-y-3">
                    {recentHistory.map(snapshot => (
                      <div
                        key={snapshot.timestamp}
                        className="flex items-center justify-between text-sm text-slate-300"
                      >
                        <div>
                          <span className="font-medium text-slate-100">
                            {new Date(snapshot.timestamp).toLocaleTimeString()}
                          </span>
                          <span className="ml-2 text-xs text-slate-400">
                            Avg {formatEVPercent(snapshot.averageEv)} · Top {formatEVPercent(snapshot.topEv)}
                          </span>
                        </div>
                        <span className="text-xs text-slate-400">
                          {snapshot.count.toLocaleString()} opps
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="bg-slate-900/70 border border-slate-800/70 rounded-2xl p-5 shadow-xl shadow-black/30 backdrop-blur">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center text-sm font-semibold text-slate-200">
                  <TrendingUp className="h-4 w-4 text-emerald-300 mr-2" /> Opportunities
                </div>
                <span className="text-xs text-slate-400">
                  {shouldVirtualize ? 'Virtualized list (fast rendering)' : 'Grid mode'}
                </span>
              </div>
              {shouldVirtualize ? (
                <div className="space-y-4">
                  <div className="text-xs text-slate-300 flex items-center justify-between bg-slate-900/80 border border-slate-800/70 rounded-md px-3 py-2 shadow-sm">
                    <span>
                      ⚡ Virtualized rendering active — showing {filteredOpportunities.length.toLocaleString()} opportunities
                    </span>
                    <span>
                      Rendering {opportunityVirtualizer.getVirtualItems().length} rows in view
                    </span>
                  </div>
                  <div
                    ref={virtualizedContainerRef}
                    className="overflow-auto rounded-lg border border-slate-800/70 bg-slate-900/60"
                    style={{ height: 'calc(100vh - 320px)', maxHeight: '900px', contain: 'strict' }}
                  >
                    <div
                      style={{
                        height: `${opportunityVirtualizer.getTotalSize()}px`,
                        width: '100%',
                        position: 'relative',
                      }}
                    >
                      {opportunityVirtualizer.getVirtualItems().map(virtualItem => {
                        const opportunity = filteredOpportunities[virtualItem.index];
                        if (!opportunity) {
                          return null;
                        }
                        return (
                          <div
                            key={opportunity.id}
                            ref={node => {
                              if (node) {
                                opportunityVirtualizer.measureElement(node);
                              }
                            }}
                            data-index={virtualItem.index}
                            style={{
                              position: 'absolute',
                              top: 0,
                              left: 0,
                              width: '100%',
                              transform: `translateY(${virtualItem.start}px)`,
                            }}
                          >
                            <OpportunityCard opportunity={opportunity} />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  <AnimatePresence>
                    {filteredOpportunities.map(opportunity => (
                      <OpportunityCard key={opportunity.id} opportunity={opportunity} />
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default PositiveEVFeed;