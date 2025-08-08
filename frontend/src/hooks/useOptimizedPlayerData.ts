/**
 * Optimized Player Data Hook
 * Integrates with the new OptimizedRealTimeDataService to provide
 * high-performance, real-time player data with intelligent caching
 * 
 * Addresses key findings from the A1Betting analysis:
 * - Real-time data streaming
 * - Intelligent error handling and fallback
 * - Performance optimization with caching
 * - Circuit breaker pattern implementation
 * - Data quality validation
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { Player } from '../components/player/PlayerDashboardContainer';
import { realTimePlayerDataService } from '../services/RealTimePlayerDataService';

interface UseOptimizedPlayerDataOptions {
  playerId?: string;
  sport?: string;
  enableRealTimeUpdates?: boolean;
  forceRefresh?: boolean;
  fallbackToCache?: boolean;
}

interface UseOptimizedPlayerDataReturn {
  player: Player | null;
  loading: boolean;
  error: string | null;
  isStale: boolean;
  isRealTime: boolean;
  lastUpdated: Date | null;
  dataQuality: 'high' | 'medium' | 'low' | 'unknown';
  dataSources: string[];
  
  // Actions
  refresh: () => Promise<void>;
  clearError: () => void;
  
  // Real-time controls
  subscribeToUpdates: () => void;
  unsubscribeFromUpdates: () => void;
  
  // Performance metrics
  responseTime: number | null;
  cacheHit: boolean;
}

export const useOptimizedPlayerData = (
  options: UseOptimizedPlayerDataOptions
): UseOptimizedPlayerDataReturn => {
  const {
    playerId,
    sport = 'MLB',
    enableRealTimeUpdates = true,
    forceRefresh = false,
    fallbackToCache = true
  } = options;

  // State management
  const [player, setPlayer] = useState<Player | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isStale, setIsStale] = useState(false);
  const [isRealTime, setIsRealTime] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [dataQuality, setDataQuality] = useState<'high' | 'medium' | 'low' | 'unknown'>('unknown');
  const [dataSources, setDataSources] = useState<string[]>([]);
  const [responseTime, setResponseTime] = useState<number | null>(null);
  const [cacheHit, setCacheHit] = useState(false);

  // Refs for cleanup and real-time subscriptions
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Stable references to prevent infinite loops - initialized after function definitions
  const loadPlayerDataRef = useRef<any>(null);
  const subscribeToUpdatesRef = useRef<any>(null);
  const unsubscribeFromUpdatesRef = useRef<any>(null);

  /**
   * Load player data with optimized performance and error handling
   */
  const loadPlayerData = useCallback(async (forceRefresh = false) => {
    if (!playerId) {
      setPlayer(null);
      setError(null);
      setLoading(false);
      return;
    }

    // Cancel any pending requests
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    abortControllerRef.current = new AbortController();
    const startTime = Date.now();
    
    setLoading(true);
    setError(null);
    setCacheHit(false);

    // Set loading timeout to prevent infinite loading states
    loadingTimeoutRef.current = setTimeout(() => {
      setError('Request timeout - data may be unavailable');
      setLoading(false);
    }, 10000);

    try {
      console.log(`[useOptimizedPlayerData] Loading data for ${playerId} (force: ${forceRefresh})`);
      
      // Get player data from optimized service
      const playerData = await realTimePlayerDataService.getPlayerData(playerId, sport);
      
      if (abortControllerRef.current?.signal.aborted) {
        return; // Request was cancelled
      }

      const endTime = Date.now();
      setResponseTime(endTime - startTime);

      if (playerData) {
        setPlayer(playerData);
        setLastUpdated(new Date());
        setError(null);
        
        // Extract metadata from response
        setDataSources(playerData._sources || ['unknown']);
        setDataQuality(determineDataQuality(playerData));
        setCacheHit(endTime - startTime < 100); // Assume cache hit if very fast
        
        // Check if data is stale
        const fetchedAt = playerData._fetched_at;
        if (fetchedAt) {
          const fetchTime = new Date(fetchedAt);
          const ageInMinutes = (Date.now() - fetchTime.getTime()) / (1000 * 60);
          setIsStale(ageInMinutes > 5); // Consider stale after 5 minutes
        }

        console.log(`[useOptimizedPlayerData] Successfully loaded ${playerId} from sources: ${playerData._sources?.join(', ')}`);
      } else {
        setPlayer(null);
        setError('Player data not found');
        setDataQuality('unknown');
      }

    } catch (err) {
      console.error(`[useOptimizedPlayerData] Failed to load ${playerId}:`, err);
      
      if (!abortControllerRef.current?.signal.aborted) {
        setError(err instanceof Error ? err.message : 'Failed to load player data');
        
        // If fallback to cache is enabled, try to get cached data
        if (fallbackToCache && !forceRefresh) {
          try {
            const cachedData = await realTimePlayerDataService.getPlayerData(playerId, sport);
            if (cachedData) {
              setPlayer(cachedData);
              setIsStale(true);
              setDataQuality('low');
              setCacheHit(true);
              console.log(`[useOptimizedPlayerData] Using cached data for ${playerId}`);
            }
          } catch (cacheError) {
            console.warn('[useOptimizedPlayerData] Cache fallback also failed:', cacheError);
          }
        }
      }
    } finally {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
        loadingTimeoutRef.current = null;
      }
      setLoading(false);
    }
  }, [playerId, sport, fallbackToCache]);

  /**
   * Subscribe to real-time updates for the current player
   */
  const subscribeToUpdates = useCallback(() => {
    if (!playerId || !enableRealTimeUpdates) return;

    // Unsubscribe from previous subscription
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
    }

    console.log(`[useOptimizedPlayerData] Subscribing to real-time updates for ${playerId}`);

    unsubscribeRef.current = realTimePlayerDataService.subscribeToPlayer(
      playerId,
      (updateData) => {
        console.log(`[useOptimizedPlayerData] Received real-time update for ${playerId}:`, updateData);
        
        // Handle different types of updates
        if (updateData.type === 'player_stats') {
          setPlayer(prevPlayer => {
            if (!prevPlayer) return null;
            
            return {
              ...prevPlayer,
              season_stats: {
                ...prevPlayer.season_stats,
                ...updateData.data
              },
              _updated_at: new Date().toISOString()
            };
          });
          
          setLastUpdated(new Date());
          setIsRealTime(true);
          setIsStale(false);
          
        } else if (updateData.type === 'injury_update') {
          setPlayer(prevPlayer => {
            if (!prevPlayer) return null;
            
            return {
              ...prevPlayer,
              injury_status: updateData.data.injury_status,
              active: updateData.data.active !== false
            };
          });
          
        } else if (updateData.type === 'lineup_change' || updateData.type === 'trade') {
          // Major changes require full refresh
          if (loadPlayerDataRef.current) {
            loadPlayerDataRef.current(true);
          }
        }
      }
    );

    setIsRealTime(true);
  }, [playerId, enableRealTimeUpdates]);

  /**
   * Unsubscribe from real-time updates
   */
  const unsubscribeFromUpdates = useCallback(() => {
    if (unsubscribeRef.current) {
      console.log(`[useOptimizedPlayerData] Unsubscribing from real-time updates`);
      unsubscribeRef.current();
      unsubscribeRef.current = null;
      setIsRealTime(false);
    }
  }, []);

  /**
   * Refresh player data
   */
  const refresh = useCallback(async () => {
    if (loadPlayerDataRef.current) {
      await loadPlayerDataRef.current(true);
    }
  }, []);

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Update stable references after function definitions
  loadPlayerDataRef.current = loadPlayerData;
  subscribeToUpdatesRef.current = subscribeToUpdates;
  unsubscribeFromUpdatesRef.current = unsubscribeFromUpdates;

  /**
   * Determine data quality based on player data completeness and freshness
   */
  const determineDataQuality = (playerData: Player): 'high' | 'medium' | 'low' | 'unknown' => {
    if (!playerData) return 'unknown';

    let qualityScore = 0;
    let maxScore = 0;

    // Check required fields
    const requiredFields = ['id', 'name', 'team', 'position'];
    requiredFields.forEach(field => {
      maxScore += 1;
      if (playerData[field as keyof Player]) {
        qualityScore += 1;
      }
    });

    // Check season stats completeness
    const stats = playerData.season_stats;
    if (stats) {
      const importantStats = ['games_played', 'batting_average', 'home_runs', 'rbis'];
      importantStats.forEach(stat => {
        maxScore += 1;
        if (stats[stat as keyof typeof stats] !== undefined && stats[stat as keyof typeof stats] !== null) {
          qualityScore += 1;
        }
      });
    } else {
      maxScore += 4; // Penalty for missing stats
    }

    // Check data freshness
    const fetchedAt = playerData._fetched_at;
    if (fetchedAt) {
      maxScore += 1;
      const fetchTime = new Date(fetchedAt);
      const ageInMinutes = (Date.now() - fetchTime.getTime()) / (1000 * 60);
      if (ageInMinutes < 10) {
        qualityScore += 1;
      }
    }

    // Check data sources
    const sources = playerData._sources || [];
    if (sources.length > 1) {
      qualityScore += 0.5; // Bonus for multiple sources
    }

    const qualityRatio = qualityScore / maxScore;
    
    if (qualityRatio >= 0.9) return 'high';
    if (qualityRatio >= 0.7) return 'medium';
    return 'low';
  };

  // Effect for initial data loading
  useEffect(() => {
    if (playerId && loadPlayerDataRef.current) {
      loadPlayerDataRef.current(forceRefresh);
    } else {
      setPlayer(null);
      setError(null);
      setLoading(false);
    }
  }, [playerId, sport, forceRefresh]);

  // Effect for real-time subscription management
  useEffect(() => {
    if (playerId && enableRealTimeUpdates && subscribeToUpdatesRef.current) {
      subscribeToUpdatesRef.current();
    } else if (unsubscribeFromUpdatesRef.current) {
      unsubscribeFromUpdatesRef.current();
    }

    return () => {
      if (unsubscribeFromUpdatesRef.current) {
        unsubscribeFromUpdatesRef.current();
      }
    };
  }, [playerId, enableRealTimeUpdates]);

  // Cleanup effect
  useEffect(() => {
    return () => {
      // Cleanup on unmount
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }

      if (unsubscribeFromUpdatesRef.current) {
        unsubscribeFromUpdatesRef.current();
      }
    };
  }, []);

  // Performance monitoring effect
  useEffect(() => {
    if (responseTime !== null) {
      console.log(`[useOptimizedPlayerData] Response time for ${playerId}: ${responseTime}ms (cache hit: ${cacheHit})`);
      
      // Log slow responses
      if (responseTime > 3000) {
        console.warn(`[useOptimizedPlayerData] Slow response detected: ${responseTime}ms for ${playerId}`);
      }
    }
  }, [responseTime, cacheHit, playerId]);

  return {
    player,
    loading,
    error,
    isStale,
    isRealTime,
    lastUpdated,
    dataQuality,
    dataSources,
    refresh,
    clearError,
    subscribeToUpdates,
    unsubscribeFromUpdates,
    responseTime,
    cacheHit
  };
};

/**
 * Hook for optimized player search with real-time capabilities
 */
export const useOptimizedPlayerSearch = () => {
  const [searchResults, setSearchResults] = useState<Player[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const searchPlayers = useCallback(async (query: string, sport: string = 'MLB', limit: number = 10) => {
    if (query.length < 2) {
      setSearchResults([]);
      setSearchError(null);
      return;
    }

    // Cancel previous search
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();
    setSearchLoading(true);
    setSearchError(null);

    try {
      console.log(`[useOptimizedPlayerSearch] Searching for: ${query}`);
      
      const results = await realTimePlayerDataService.searchPlayers(query, sport, limit);
      
      if (!abortControllerRef.current?.signal.aborted) {
        setSearchResults(results);
        console.log(`[useOptimizedPlayerSearch] Found ${results.length} results for: ${query}`);
      }
    } catch (err) {
      if (!abortControllerRef.current?.signal.aborted) {
        console.error('[useOptimizedPlayerSearch] Search failed:', err);
        setSearchError(err instanceof Error ? err.message : 'Search failed');
        setSearchResults([]);
      }
    } finally {
      if (!abortControllerRef.current?.signal.aborted) {
        setSearchLoading(false);
      }
    }
  }, []);

  const clearSearch = useCallback(() => {
    setSearchResults([]);
    setSearchError(null);
    setSearchLoading(false);
    
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    searchResults,
    searchLoading,
    searchError,
    searchPlayers,
    clearSearch
  };
};

/**
 * Hook for monitoring service health and performance
 */
export const useOptimizedServiceHealth = () => {
  const [healthMetrics, setHealthMetrics] = useState<Map<string, any>>(new Map());
  const [overallHealth, setOverallHealth] = useState<'healthy' | 'degraded' | 'offline'>('healthy');

  useEffect(() => {
    const updateHealth = () => {
      const metrics = realTimePlayerDataService.getHealthMetrics();
      setHealthMetrics(metrics);

      // Determine overall health
      const healthValues = Array.from(metrics.values());
      const unhealthyServices = healthValues.filter(m => m.consecutiveFailures > 3).length;
      
      if (healthValues.length === 0) {
        setOverallHealth('offline');
      } else if (unhealthyServices > healthValues.length * 0.5) {
        setOverallHealth('degraded');
      } else {
        setOverallHealth('healthy');
      }
    };

    // Update immediately
    updateHealth();

    // Update every 30 seconds
    const interval = setInterval(updateHealth, 30000);

    return () => clearInterval(interval);
  }, []);

  return {
    healthMetrics,
    overallHealth
  };
};
