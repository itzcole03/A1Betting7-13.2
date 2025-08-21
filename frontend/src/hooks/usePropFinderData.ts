/**
 * PropFinder Real Data Integration Hook
 * 
 * React hook for integrating PropFinderKillerDashboard with real backend data:
 * - Real prop opportunities from multiple data sources
 * - Alert engine integration for live notifications
 * - Advanced filtering and search capabilities
 * - PropFinder competitive parity features
 */

import { useState, useEffect, useCallback } from 'react';
import { enhancedLogger } from '../utils/enhancedLogger';

// Types matching backend API response
export interface PropOpportunity {
  id: string;
  player: string;
  playerImage?: string;
  team: string;
  teamLogo?: string;
  opponent: string;
  opponentLogo?: string;
  sport: 'NBA' | 'NFL' | 'MLB' | 'NHL';
  market: string;
  line: number;
  pick: 'over' | 'under';
  odds: number;
  impliedProbability: number;
  aiProbability: number;
  edge: number;
  confidence: number;
  projectedValue: number;
  volume: number;
  trend: 'up' | 'down' | 'stable';
  trendStrength: number;
  timeToGame: string;
  venue: 'home' | 'away';
  weather?: string;
  injuries: string[];
  recentForm: number[];
  matchupHistory: {
    games: number;
    average: number;
    hitRate: number;
  };
  lineMovement: {
    open: number;
    current: number;
    direction: 'up' | 'down' | 'stable';
  };
  bookmakers: Array<{
    name: string;
    odds: number;
    line: number;
  }>;
  isBookmarked: boolean;
  tags: string[];
  socialSentiment: number;
  sharpMoney: 'heavy' | 'moderate' | 'light' | 'public';
  lastUpdated: string;
  alertTriggered: boolean;
  alertSeverity?: string;
  
  // Phase 1.2 - Best Line Aggregator fields
  bestBookmaker?: string;
  lineSpread?: number;
  oddsSpread?: number;
  numBookmakers?: number;
  hasArbitrage?: boolean;
  arbitrageProfitPct?: number;
}

export interface OpportunitiesResponse {
  opportunities: PropOpportunity[];
  total: number;
  filtered: number;
  summary: {
    total_opportunities: number;
    avg_confidence: number;
    max_edge: number;
    alert_triggered_count: number;
    sharp_heavy_count: number;
    sports_breakdown: Record<string, number>;
    markets_breakdown: Record<string, number>;
  };
}

export interface PropFinderStats {
  total_opportunities: number;
  avg_confidence: number;
  max_edge: number;
  alert_count: number;
  sharp_heavy_count: number;
  sports_count: number;
  markets_count: number;
  last_updated: string;
}

export interface FilterOptions {
  sports?: string[];
  confidence_min?: number;
  confidence_max?: number;
  edge_min?: number;
  edge_max?: number;
  markets?: string[];
  venues?: string[];
  sharp_money?: string[];
  bookmarked_only?: boolean;
  alert_triggered_only?: boolean;
  search?: string;
}

export interface UsePropFinderDataOptions {
  autoRefresh?: boolean;
  refreshInterval?: number; // in seconds
  initialFilters?: FilterOptions;
  limit?: number;
  userId?: string; // Phase 4.2: User context for bookmarks
}

export interface UsePropFinderDataReturn {
  // Data
  opportunities: PropOpportunity[];
  stats: PropFinderStats | null;
  
  // Loading states
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  
  // Filters and search
  filters: FilterOptions;
  searchQuery: string;
  
  // Actions
  refreshData: () => Promise<void>;
  updateFilters: (newFilters: Partial<FilterOptions>) => void;
  setSearchQuery: (query: string) => void;
  bookmarkOpportunity: (opportunityId: string, opportunity: PropOpportunity, bookmarked: boolean) => Promise<void>;
  getOpportunityById: (opportunityId: string) => Promise<PropOpportunity | null>;
  getUserBookmarks: () => Promise<PropOpportunity[]>;
  
  // Auto-refresh control
  toggleAutoRefresh: () => void;
  isAutoRefreshEnabled: boolean;
  
  // Phase 4.2: User context
  userId?: string;
}

const DEFAULT_REFRESH_INTERVAL = 30; // 30 seconds
const API_BASE = '/api/propfinder';

export const usePropFinderData = (options: UsePropFinderDataOptions = {}): UsePropFinderDataReturn => {
  const {
    autoRefresh = false,
    refreshInterval = DEFAULT_REFRESH_INTERVAL,
    initialFilters = {},
    limit = 50,
    userId
  } = options;

  // State management
  const [opportunities, setOpportunities] = useState<PropOpportunity[]>([]);
  const [stats, setStats] = useState<PropFinderStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterOptions>(initialFilters);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAutoRefreshEnabled, setIsAutoRefreshEnabled] = useState(autoRefresh);

  // Build query parameters for API calls
  const buildQueryParams = useCallback((currentFilters: FilterOptions, currentSearch: string) => {
    const params = new URLSearchParams();
    
    // Phase 4.2: Add user context for bookmark status
    if (userId) {
      params.set('user_id', userId);
    }
    
    if (currentFilters.sports?.length) {
      params.set('sports', currentFilters.sports.join(','));
    }
    if (currentFilters.confidence_min !== undefined) {
      params.set('confidence_min', currentFilters.confidence_min.toString());
    }
    if (currentFilters.confidence_max !== undefined) {
      params.set('confidence_max', currentFilters.confidence_max.toString());
    }
    if (currentFilters.edge_min !== undefined) {
      params.set('edge_min', currentFilters.edge_min.toString());
    }
    if (currentFilters.edge_max !== undefined) {
      params.set('edge_max', currentFilters.edge_max.toString());
    }
    if (currentFilters.markets?.length) {
      params.set('markets', currentFilters.markets.join(','));
    }
    if (currentFilters.venues?.length) {
      params.set('venues', currentFilters.venues.join(','));
    }
    if (currentFilters.sharp_money?.length) {
      params.set('sharp_money', currentFilters.sharp_money.join(','));
    }
    if (currentFilters.bookmarked_only) {
      params.set('bookmarked_only', 'true');
    }
    if (currentFilters.alert_triggered_only) {
      params.set('alert_triggered_only', 'true');
    }
    if (currentSearch) {
      params.set('search', currentSearch);
    }
    
    params.set('limit', limit.toString());
    
    return params.toString();
  }, [limit, userId]);

  // Fetch opportunities from API
  const fetchOpportunities = useCallback(async (currentFilters: FilterOptions, currentSearch: string, isRefresh = false) => {
    try {
      if (!isRefresh) setLoading(true);
      else setRefreshing(true);
      
      setError(null);
      
      const queryParams = buildQueryParams(currentFilters, currentSearch);
      const response = await fetch(`${API_BASE}/opportunities?${queryParams}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch opportunities: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        setOpportunities(data.data.opportunities);
        
        // Update stats from summary
        const summary = data.data.summary;
        setStats({
          total_opportunities: summary.total_opportunities,
          avg_confidence: summary.avg_confidence,
          max_edge: summary.max_edge,
          alert_count: summary.alert_triggered_count,
          sharp_heavy_count: summary.sharp_heavy_count,
          sports_count: Object.keys(summary.sports_breakdown).length,
          markets_count: Object.keys(summary.markets_breakdown).length,
          last_updated: new Date().toISOString()
        });
      } else {
        throw new Error(data.error?.message || 'Failed to fetch opportunities');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      // Log error for debugging
      if (process.env.NODE_ENV === 'development') {
        enhancedLogger.error('usePropFinderData', 'fetchOpportunities', 'Error fetching PropFinder opportunities', undefined, err as Error);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [buildQueryParams]);

  // Fetch stats separately for overview
  const fetchStats = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/stats`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch stats: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        setStats(data.data);
      }
    } catch (err) {
      // Log error for debugging in development
      if (process.env.NODE_ENV === 'development') {
        enhancedLogger.error('usePropFinderData', 'fetchStats', 'Error fetching PropFinder stats', undefined, err as Error);
      }
      // Don't set error state for stats fetch failures
    }
  }, []);

  // Refresh data function
  const refreshData = useCallback(async () => {
    await Promise.all([
      fetchOpportunities(filters, searchQuery, true),
      fetchStats()
    ]);
  }, [fetchOpportunities, fetchStats, filters, searchQuery]);

  // Update filters
  const updateFilters = useCallback((newFilters: Partial<FilterOptions>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  // Bookmark opportunity with Phase 4.2 persistence
  const bookmarkOpportunity = useCallback(async (opportunityId: string, opportunity: PropOpportunity, bookmarked: boolean) => {
    if (!userId) {
      throw new Error('User ID required for bookmark operations');
    }
    
    try {
      const requestBody = {
        prop_id: opportunityId,
        sport: opportunity.sport,
        player: opportunity.player,
        market: opportunity.market,
        team: opportunity.team,
        bookmarked
      };
      
      const response = await fetch(`${API_BASE}/bookmark?user_id=${userId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });
      
      if (!response.ok) {
        throw new Error(`Failed to bookmark opportunity: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error?.message || 'Failed to bookmark opportunity');
      }
      
      // Update local state
      setOpportunities(prev => 
        prev.map(opp => 
          opp.id === opportunityId 
            ? { ...opp, isBookmarked: bookmarked }
            : opp
        )
      );
    } catch (err) {
      if (process.env.NODE_ENV === 'development') {
        enhancedLogger.error('usePropFinderData', 'bookmarkOpportunity', 'Error bookmarking opportunity', { opportunityId }, err as Error);
      }
      throw err;
    }
  }, [userId]);

  // Get specific opportunity by ID
  const getOpportunityById = useCallback(async (opportunityId: string): Promise<PropOpportunity | null> => {
    try {
      const params = new URLSearchParams();
      if (userId) {
        params.set('user_id', userId);
      }
      
      const queryString = params.toString();
      const url = `${API_BASE}/opportunities/${opportunityId}${queryString ? `?${queryString}` : ''}`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error(`Failed to fetch opportunity: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        return data.data;
      } else {
        throw new Error(data.error?.message || 'Failed to fetch opportunity');
      }
    } catch (err) {
      if (process.env.NODE_ENV === 'development') {
        enhancedLogger.error('usePropFinderData', 'getOpportunityById', 'Error fetching opportunity by ID', { opportunityId }, err as Error);
      }
      return null;
    }
  }, [userId]);

  // Get user bookmarks (Phase 4.2)
  const getUserBookmarks = useCallback(async (): Promise<PropOpportunity[]> => {
    if (!userId) {
      return [];
    }
    
    try {
      const response = await fetch(`${API_BASE}/bookmarks?user_id=${userId}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch bookmarks: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        // Note: This returns bookmark metadata, not full opportunities
        // You might want to fetch full opportunity data for each bookmark
        return data.data;
      } else {
        throw new Error(data.error?.message || 'Failed to fetch bookmarks');
      }
    } catch (err) {
      if (process.env.NODE_ENV === 'development') {
        enhancedLogger.error('usePropFinderData', 'getUserBookmarks', 'Error fetching user bookmarks', undefined, err as Error);
      }
      return [];
    }
  }, [userId]);

  // Toggle auto-refresh
  const toggleAutoRefresh = useCallback(() => {
    setIsAutoRefreshEnabled(prev => !prev);
  }, []);

  // Effect for initial data load
  useEffect(() => {
    fetchOpportunities(filters, searchQuery, false);
  }, [fetchOpportunities, filters, searchQuery]);

  // Effect for auto-refresh
  useEffect(() => {
    if (!isAutoRefreshEnabled) return;
    
    const interval = setInterval(() => {
      refreshData();
    }, refreshInterval * 1000);
    
    return () => clearInterval(interval);
  }, [isAutoRefreshEnabled, refreshInterval, refreshData]);

  // Effect for search debouncing
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery !== '') {
        fetchOpportunities(filters, searchQuery, true);
      }
    }, 300);
    
    return () => clearTimeout(timeoutId);
  }, [searchQuery, filters, fetchOpportunities]);

  return {
    // Data
    opportunities,
    stats,
    
    // Loading states
    loading,
    refreshing,
    error,
    
    // Filters and search
    filters,
    searchQuery,
    
    // Actions
    refreshData,
    updateFilters,
    setSearchQuery,
    bookmarkOpportunity,
    getOpportunityById,
    getUserBookmarks,
    
    // Auto-refresh control
    toggleAutoRefresh,
    isAutoRefreshEnabled,
    
    // Phase 4.2: User context
    userId
  };
};

export default usePropFinderData;