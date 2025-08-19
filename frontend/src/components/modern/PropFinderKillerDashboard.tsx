import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Heart,
  ChevronDown,
  User,
  Download,
  Filter,
  RefreshCw,
  Settings,
  Loader2,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Minus,
  Search,
  X,
  Calendar,
  Clock,
  Target,
  BarChart3,
  Zap,
  Shield,
  Award,
  Info,
} from 'lucide-react';
import PropFinderDataService from '../../services/PropFinderDataService';

// Types matching PropFinder interface exactly
interface PropFinderPlayer {
  id: string;
  name: string;
  team: string;
  position: string;
  number: number;
  imageUrl?: string;
  pfRating: number;
  prop: string;
  l10Avg: number;
  l5Avg: number;
  odds: string;
  streak: number;
  matchup: string;
  percentages: {
    '2024': number;
    '2025': number;
    'h2h': number;
    'l5': number;
    'last': number;
    'l4': number;
  };
  isFavorite: boolean;
}

interface PropCategory {
  id: string;
  name: string;
  selected: boolean;
}

interface Game {
  id: string;
  homeTeam: string;
  awayTeam: string;
  time: string;
  date: string;
  status?: string;
  selected: boolean;
  locked?: boolean;
}

const PropFinderKillerDashboard: React.FC = () => {
  const [betType, setBetType] = useState<'OVER' | 'UNDER'>('OVER');
  const [searchPlayer, setSearchPlayer] = useState('Search Player');
  const [playerSearchQuery, setPlayerSearchQuery] = useState('');
  const [showAllLines, setShowAllLines] = useState(true);
  const [_currentPage, _setCurrentPage] = useState(1);
  const [showPlayerDropdown, setShowPlayerDropdown] = useState(false);
  const [showCategoriesDropdown, setShowCategoriesDropdown] = useState(false);
  const [showGamesDropdown, setShowGamesDropdown] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [filteredPlayers, setFilteredPlayers] = useState<PropFinderPlayer[]>([]);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
  const [selectedMarketType, setSelectedMarketType] = useState<'main' | 'alternate'>('main');
  const [minPFRating, setMinPFRating] = useState<number>(0);
  const [maxOdds, setMaxOdds] = useState<number>(500);
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  
  // Performance tracking
  const [lastUpdateTime, setLastUpdateTime] = useState<Date>(new Date());
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState<number>(30); // seconds
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Admin user detection - integrate with your authentication system
  // This should check if the current user has admin privileges
  const isAdminUser = true; // TODO: Replace with actual auth check like: useAuth().user?.isAdmin
  const [favorites, setFavorites] = useState<string[]>([]);
  
  // Real data loading states
  const [isLoadingGames, setIsLoadingGames] = useState(false);
  const [isLoadingProps, setIsLoadingProps] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [realPlayers, setRealPlayers] = useState<PropFinderPlayer[]>([]);
  
  // Games state
  const [games, setGames] = useState<Game[]>([]);
  
  // Enhanced caching with metadata
  const [propsCache, setPropsCache] = useState<Map<string, PropFinderPlayer[]>>(new Map());
  const [cacheTimestamps, setCacheTimestamps] = useState<Map<string, number>>(new Map());
  const [cacheHits, setCacheHits] = useState<number>(0);
  const [apiCalls, setApiCalls] = useState<number>(0);
  const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache
  
  // PropFinder Data Service instance
  const propFinderService = PropFinderDataService.getInstance();

  // Enhanced search and filtering
  const searchFilteredPlayers = useMemo(() => {
    if (!playerSearchQuery.trim()) return filteredPlayers;
    
    const query = playerSearchQuery.toLowerCase().trim();
    return filteredPlayers.filter(player => 
      player.name.toLowerCase().includes(query) ||
      player.team.toLowerCase().includes(query) ||
      player.position.toLowerCase().includes(query) ||
      player.prop.toLowerCase().includes(query)
    );
  }, [filteredPlayers, playerSearchQuery]);

  // Enhanced sorting
  const sortedPlayers = useMemo(() => {
    if (!sortConfig) return searchFilteredPlayers;
    
    const { key, direction } = sortConfig;
    const sorted = [...searchFilteredPlayers].sort((a, b) => {
      let aValue: any = a;
      let bValue: any = b;
      
      // Handle nested properties
      if (key.includes('.')) {
        const keys = key.split('.');
        aValue = keys.reduce((obj, k) => obj?.[k], a);
        bValue = keys.reduce((obj, k) => obj?.[k], b);
      } else {
        aValue = a[key as keyof PropFinderPlayer];
        bValue = b[key as keyof PropFinderPlayer];
      }
      
      // Handle numeric sorting
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return direction === 'asc' ? aValue - bValue : bValue - aValue;
      }
      
      // Handle string sorting
      const aStr = String(aValue).toLowerCase();
      const bStr = String(bValue).toLowerCase();
      
      if (direction === 'asc') {
        return aStr < bStr ? -1 : aStr > bStr ? 1 : 0;
      } else {
        return aStr > bStr ? -1 : aStr < bStr ? 1 : 0;
      }
    });
    
    return sorted;
  }, [searchFilteredPlayers, sortConfig]);

  // Advanced filtering with more options
  const advancedFilteredPlayers = useMemo(() => {
    let filtered = sortedPlayers;
    
    // PF Rating filter
    if (minPFRating > 0) {
      filtered = filtered.filter(player => player.pfRating >= minPFRating);
    }
    
    // Odds filter (convert odds string to number for comparison)
    if (maxOdds < 500) {
      filtered = filtered.filter(player => {
        const odds = player.odds;
        const numericOdds = parseInt(odds.replace(/[+-]/g, ''));
        return numericOdds <= maxOdds;
      });
    }
    
    // Favorites only filter
    if (onlyFavorites) {
      filtered = filtered.filter(player => favorites.includes(player.id));
    }
    
    return filtered;
  }, [sortedPlayers, minPFRating, maxOdds, onlyFavorites, favorites]);

  // Auto refresh functionality
  useEffect(() => {
    if (autoRefreshEnabled && refreshInterval > 0) {
      refreshIntervalRef.current = setInterval(() => {
        if (games.length > 0) {
          loadPropsForSelectedGames();
          setLastUpdateTime(new Date());
        }
      }, refreshInterval * 1000);
    } else if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
      refreshIntervalRef.current = null;
    }
    
    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [autoRefreshEnabled, refreshInterval, games]);

  // Handle sorting
  const handleSort = useCallback((key: string) => {
    setSortConfig(current => {
      if (current?.key === key) {
        // Toggle direction
        return { key, direction: current.direction === 'asc' ? 'desc' : 'asc' };
      } else {
        // New sort
        return { key, direction: 'desc' };
      }
    });
  }, []);
  
  // Real data loading functions
  const loadTodaysGames = useCallback(async () => {
    setIsLoadingGames(true);
    setError(null);
    try {
      const realGames = await propFinderService.getTodaysGames(true);
      setApiCalls(prev => prev + 1);
      
      // Transform real games to PropFinder format
      const transformedGames: Game[] = realGames.map((game, index) => ({
        id: game.id.toString(),
        homeTeam: game.home_team,
        awayTeam: game.away_team,
        time: new Date(game.game_time).toLocaleTimeString('en-US', { 
          hour: 'numeric', 
          minute: '2-digit', 
          hour12: true 
        }),
        date: new Date(game.game_date).toLocaleDateString('en-US', { 
          month: 'numeric', 
          day: 'numeric' 
        }),
        status: game.status || 'Unknown',
        selected: false, // Will be set below based on most recent upcoming
        locked: !isAdminUser && index !== 0
      }));

      // Find the most recent upcoming game (not finished) OR a finished game that's likely to have props
      let selectedGameIndex = 0;
      
      // Filter to games that are likely to have props
      const gamesWithPossibleProps = transformedGames.filter((game) => {
        const isFinal = game.status?.toLowerCase() === 'final' || 
                       game.status?.toLowerCase() === 'completed';
        const isInProgress = game.status?.toLowerCase() === 'in progress' ||
                            game.status?.toLowerCase() === 'live';
        const isPostponed = game.status?.toLowerCase() === 'postponed';
        
        // Props are most likely available for Final games, less likely for In Progress, never for Postponed
        return isFinal || (!isPostponed && !isInProgress);
      });
      
      if (gamesWithPossibleProps.length > 0) {
        // Prefer Final games, then other valid games
        const finalGames = gamesWithPossibleProps.filter(game => 
          game.status?.toLowerCase() === 'final' || 
          game.status?.toLowerCase() === 'completed'
        );
        
        const gameToSelect = finalGames.length > 0 ? finalGames[0] : gamesWithPossibleProps[0];
        selectedGameIndex = transformedGames.findIndex(game => game.id === gameToSelect.id);
      } else {
        // If no good games found, select the first available
        selectedGameIndex = 0;
      }
      
      // Set the selected game
      if (transformedGames[selectedGameIndex]) {
        transformedGames[selectedGameIndex].selected = true;
      }
      
      setGames(transformedGames);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load games');
    } finally {
      setIsLoadingGames(false);
    }
  }, [propFinderService, isAdminUser]);

  const loadPropsForSelectedGames = useCallback(async () => {
    setIsLoadingProps(true);
    setError(null);
    
    try {
      const selectedGames = games.filter(game => game.selected && !game.locked);
      if (selectedGames.length === 0) {
        setRealPlayers([]);
        return; // Will reach finally block
      }

      let allProps: PropFinderPlayer[] = [];
      const currentTime = Date.now();
      let gamesProcessed = 0;
      let gamesWithProps = 0;
      
      for (const game of selectedGames) {
        gamesProcessed++;
        
        // Check if we have cached data that's still fresh
        const cacheKey = `${game.id}_${betType}`;
        const cachedProps = propsCache.get(cacheKey);
        const cacheTime = cacheTimestamps.get(cacheKey);
        const isCacheValid = cachedProps && cacheTime && (currentTime - cacheTime) < CACHE_DURATION;

        if (isCacheValid && cachedProps.length > 0) {
          // Using cached props for performance
          allProps = [...allProps, ...cachedProps];
          setCacheHits(prev => prev + 1);
          gamesWithProps++;
          continue;
        }

        try {
          // Loading fresh props
          setApiCalls(prev => prev + 1);
          const gameProps = await propFinderService.getGameProps(game.id);
          
          if (gameProps && gameProps.length > 0) {
            gamesWithProps++;
            
            // Transform API props to dashboard format
            const transformedProps = gameProps.map(prop => ({
              id: prop.id,
              name: prop.player_name,
              team: prop.team,
              position: prop.category || 'N/A',
              number: 0, // Will be populated if available
              imageUrl: prop.player_id ? 
                `https://img.mlbstatic.com/mlb-photos/image/upload/c_fill,g_auto/w_180,h_180/v1/people/${prop.player_id}/headshot/67/current` :
                undefined,
              pfRating: prop.pf_rating || prop.confidence || 50,
              prop: prop.prop_type ? `${betType.toLowerCase()} ${prop.target || 0.5} ${prop.prop_type}` : `${betType.toLowerCase()} hits`,
              l10Avg: prop.l10_avg || 0,
              l5Avg: prop.l5_avg || 0,
              odds: prop.odds || '+100',
              streak: prop.streak || 0,
              matchup: prop.matchup || `vs ${game.homeTeam === prop.team ? game.awayTeam : game.homeTeam}`,
              percentages: prop.percentages || {
                '2024': Math.round(prop.confidence || 50),
                '2025': Math.round((prop.confidence || 50) * 0.9),
                'h2h': Math.round((prop.confidence || 50) * 0.8),
                'l5': Math.round((prop.l5_avg || 0) * 100),
                'last': Math.round((prop.confidence || 50) * 0.7),
                'l4': Math.round((prop.confidence || 50) * 0.75),
              },
              isFavorite: favorites.includes(prop.id),
            }));
            
            allProps = [...allProps, ...transformedProps];
            
            // Cache the transformed props
            setPropsCache(prev => new Map(prev).set(cacheKey, transformedProps));
            setCacheTimestamps(prev => new Map(prev).set(cacheKey, currentTime));
          } else {
            // Try enhanced props as fallback, but don't let it block loading completion
            try {
              const enhancedPlayers = await propFinderService.getEnhancedGameProps(
                game.id, 
                'hits' // This can be made dynamic based on selected prop type
              );
              
              if (enhancedPlayers && enhancedPlayers.length > 0) {
                gamesWithProps++;
                
                // Transform enhanced players to PropFinder format
                const transformedProps = enhancedPlayers.map(player => ({
                  id: player.id,
                  name: player.name,
                  team: player.team,
                  position: player.position,
                  number: player.jersey_number,
                  imageUrl: player.image_url,
                  pfRating: player.pf_rating,
                  prop: `${betType.toLowerCase()} ${player.prop}`,
                  l10Avg: player.l10_avg,
                  l5Avg: player.l5_avg,
                  odds: player.odds,
                  streak: player.streak,
                  matchup: player.matchup || `vs ${game.homeTeam === player.team ? game.awayTeam : game.homeTeam}`,
                  percentages: player.percentages,
                  isFavorite: favorites.includes(player.id),
                }));
                
                allProps = [...allProps, ...transformedProps];
              }
            } catch (enhancedError) {
              // Don't log enhanced errors unless in development
              if (process.env.NODE_ENV === 'development') {
                // eslint-disable-next-line no-console
                console.warn(`Enhanced props failed for game ${game.id}:`, enhancedError);
              }
            }
          }
        } catch (gameError) {
          // Continue with other games instead of failing completely
          if (process.env.NODE_ENV === 'development') {
            // eslint-disable-next-line no-console
            console.warn(`Failed to load props for game ${game.id}:`, gameError);
          }
          // Game-specific errors don't prevent loading completion
        }
      }

      setRealPlayers(allProps);
      setLastUpdateTime(new Date());
      
      // Provide helpful messaging based on results
      if (allProps.length === 0 && selectedGames.length > 0) {
        if (gamesProcessed === selectedGames.length) {
          // All games processed but no props found
          const gameStatuses = selectedGames.map(g => g.status).join(', ');
          setError(`No props available for selected games (${gameStatuses}). Props are typically only available for games that haven't started yet.`);
        } else {
          setError('Failed to load props from all selected games. Try refreshing or selecting different games.');
        }
      } else if (allProps.length > 0 && gamesWithProps < selectedGames.length) {
        // Some games had props, some didn't - this is normal
        if (process.env.NODE_ENV === 'development') {
          // eslint-disable-next-line no-console
          console.info(`Loaded props from ${gamesWithProps} of ${selectedGames.length} selected games`);
        }
      }
      
    } catch (err) {
      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.error('Error loading props:', err);
      }
      setError(err instanceof Error ? err.message : 'Failed to load props');
    } finally {
      // ALWAYS clear loading state, regardless of success or failure
      setIsLoadingProps(false);
    }
  }, [games, propFinderService, betType, favorites, propsCache, cacheTimestamps, CACHE_DURATION]);

  // Load games on component mount
  useEffect(() => {
    loadTodaysGames();
  }, [loadTodaysGames]);

  // Load initial props when games are first loaded
  const [hasInitialLoad, setHasInitialLoad] = useState(false);
  useEffect(() => {
    if (!hasInitialLoad && games.length > 0) {
      const hasSelectedGames = games.some(g => g.selected);
      if (hasSelectedGames) {
        loadPropsForSelectedGames();
        setHasInitialLoad(true);
      }
    }
  }, [games, hasInitialLoad, loadPropsForSelectedGames]);

  // Enhanced player stats loading with better caching
  const _loadPlayerStats = useCallback(async (playerId: string, statType: string = 'hits') => {
    try {
      const stats = await propFinderService.getPlayerComprehensiveStats(playerId, statType);
      return stats;
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.error(`Failed to load stats for player ${playerId}:`, error);
      }
      return null;
    }
  }, [propFinderService]);

  // Enhanced PropFinder Core Analysis Functions
  const calculatePFRating = useCallback((player: PropFinderPlayer): number => {
    const propMatch = player.prop.match(/[\d.]+/);
    const propValue = parseFloat(propMatch?.[0] || '0');
    const l10Hit = player.l10Avg > propValue ? 1 : 0;
    const l5Hit = player.l5Avg > propValue ? 1 : 0;
    const recentTrend = player.l5Avg > player.l10Avg ? 10 : -10;
    const consistencyBonus = Math.abs(player.l5Avg - player.l10Avg) < 0.2 ? 5 : 0;
    
    // Enhanced rating calculation with more factors
    let rating = 50; // Neutral base
    rating += (l10Hit * 15) + (l5Hit * 20); // Recent performance weight
    rating += recentTrend; // Trending bonus/penalty  
    rating += consistencyBonus; // Consistency bonus
    rating += (player.percentages['2024'] - 50) * 0.3; // Season performance adjustment
    
    // Streak impact
    if (Math.abs(player.streak) >= 3) {
      rating += player.streak > 0 ? 8 : -8;
    }
    
    // Matchup context (simplified - could be enhanced with actual matchup data)
    if (player.matchup.includes('vs')) {
      rating += Math.random() * 10 - 5; // Random matchup modifier
    }
    
    return Math.max(1, Math.min(100, Math.round(rating)));
  }, []);

  const analyzePropValue = useCallback((player: PropFinderPlayer, betDirection: 'OVER' | 'UNDER'): {
    recommendation: 'STRONG' | 'LEAN' | 'AVOID';
    confidence: number;
    reasoning: string[];
    edge?: number;
  } => {
    const propMatch = player.prop.match(/[\d.]+/);
    const propValue = parseFloat(propMatch?.[0] || '0');
    const reasoning: string[] = [];
    let confidence = 50;

    // L10 vs L5 trend analysis
    if (betDirection === 'OVER') {
      if (player.l5Avg > propValue && player.l10Avg > propValue) {
        confidence += 25;
        reasoning.push(`Consistently hitting OVER in recent games (L5: ${player.l5Avg}, L10: ${player.l10Avg})`);
      }
      if (player.l5Avg > player.l10Avg) {
        confidence += 15;
        reasoning.push('Trending upward in recent form');
      }
      if (player.l5Avg > propValue + 0.5) {
        confidence += 10;
        reasoning.push('L5 average well above line');
      }
    } else {
      if (player.l5Avg < propValue && player.l10Avg < propValue) {
        confidence += 25;
        reasoning.push(`Consistently hitting UNDER in recent games (L5: ${player.l5Avg}, L10: ${player.l10Avg})`);
      }
      if (player.l5Avg < player.l10Avg) {
        confidence += 15;
        reasoning.push('Trending downward in recent form');
      }
      if (player.l5Avg < propValue - 0.5) {
        confidence += 10;
        reasoning.push('L5 average well below line');
      }
    }

    // Season performance analysis
    if (player.percentages['2024'] > 60) {
      confidence += 10;
      reasoning.push('Strong season-long performance');
    } else if (player.percentages['2024'] < 40) {
      confidence -= 10;
      reasoning.push('Below-average season performance');
    }

    // Enhanced streak analysis
    if (Math.abs(player.streak) >= 3) {
      if ((player.streak > 0 && betDirection === 'OVER') || (player.streak < 0 && betDirection === 'UNDER')) {
        confidence += 15;
        reasoning.push(`On ${Math.abs(player.streak)}-game ${player.streak > 0 ? 'hot' : 'cold'} streak aligning with bet`);
      } else {
        confidence -= 8;
        reasoning.push('Current streak works against this bet');
      }
    }

    // Value betting calculation
    const odds = player.odds;
    const isPositive = odds.startsWith('+');
    const numericOdds = parseInt(odds.replace(/[+-]/, ''));
    const impliedProbability = isPositive 
      ? 100 / (numericOdds + 100) * 100
      : numericOdds / (numericOdds + 100) * 100;

    const recentHitRate = (player.percentages.l5 + player.percentages['2024']) / 2;
    const fairValue = betDirection === 'OVER' ? recentHitRate : (100 - recentHitRate);
    const edge = fairValue - impliedProbability;

    if (edge > 10) {
      confidence += 15;
      reasoning.push(`Strong value bet with ${edge.toFixed(1)}% edge`);
    } else if (edge < -10) {
      confidence -= 10;
      reasoning.push('Poor value against market odds');
    }

    const recommendation: 'STRONG' | 'LEAN' | 'AVOID' = 
      confidence >= 80 ? 'STRONG' : confidence >= 65 ? 'LEAN' : 'AVOID';

    return { recommendation, confidence: Math.max(0, Math.min(100, confidence)), reasoning, edge };
  }, []);

  const getValueBetting = useCallback((player: PropFinderPlayer): {
    impliedProbability: number;
    fairValue: number;
    edge: number;
    kellyBet?: number;
  } => {
    const odds = player.odds;
    const isPositive = odds.startsWith('+');
    const numericOdds = parseInt(odds.replace(/[+-]/, ''));
    
    // Convert American odds to implied probability
    const impliedProbability = isPositive 
      ? 100 / (numericOdds + 100) * 100
      : numericOdds / (numericOdds + 100) * 100;

    // Enhanced fair value calculation using multiple factors
    const l5Weight = 0.4;
    const l10Weight = 0.3;
    const seasonWeight = 0.2;
    const streakWeight = 0.1;
    
    const baseHitRate = (player.percentages.l5 * l5Weight) + 
                       (player.percentages['2024'] * seasonWeight) +
                       ((player.l10Avg / 3) * 100 * l10Weight); // Convert to percentage
    
    const streakAdjustment = player.streak > 0 ? 
      Math.min(player.streak * 2, 10) : Math.max(player.streak * 2, -10);
    
    const fairValue = betType === 'OVER' ? 
      baseHitRate + (streakAdjustment * streakWeight * 100) : 
      100 - (baseHitRate + (streakAdjustment * streakWeight * 100));
    
    // Calculate edge (positive = good bet, negative = bad bet)
    const edge = fairValue - impliedProbability;
    
    // Kelly Criterion calculation for bet sizing
    let kellyBet = 0;
    if (edge > 0) {
      const decimalOdds = isPositive ? (numericOdds / 100) + 1 : (100 / numericOdds) + 1;
      const winProbability = fairValue / 100;
      kellyBet = ((decimalOdds * winProbability - 1) / (decimalOdds - 1)) * 100;
      kellyBet = Math.max(0, Math.min(kellyBet, 10)); // Cap at 10% of bankroll
    }
    
    return { impliedProbability, fairValue, edge, kellyBet };
  }, [betType]);

  const [categories, setCategories] = useState<PropCategory[]>([
    { id: 'hits', name: 'Hits', selected: true },
    { id: 'totalBases', name: 'Total Bases', selected: true },
    { id: 'homeRuns', name: 'Home Runs', selected: true },
    { id: 'singles', name: 'Singles', selected: true },
    { id: 'doubles', name: 'Doubles', selected: true },
    { id: 'triples', name: 'Triples', selected: true },
    { id: 'battingStrikeouts', name: 'Batting Strikeouts', selected: true },
    { id: 'runs', name: 'Runs', selected: true },
    { id: 'rbis', name: 'RBIs', selected: true },
    { id: 'hitsRunsRbis', name: 'Hits + Runs + RBIs', selected: true },
    { id: 'stolenBases', name: 'Stolen Bases', selected: true },
    { id: 'walks', name: 'Walks', selected: true },
    { id: 'strikeouts', name: 'Strikeouts', selected: true },
    { id: 'outs', name: 'Outs', selected: true },
    { id: 'hitsAllowed', name: 'Hits Allowed', selected: true },
    { id: 'walksAllowed', name: 'Walks Allowed', selected: true },
    { id: 'earnedRuns', name: 'Earned Runs', selected: true },
  ]);

  // Update games admin status when admin status changes (real data will override this)
  useEffect(() => {
    setGames(prevGames => 
      prevGames.map(game => ({
        ...game,
        locked: !isAdminUser && prevGames.indexOf(game) !== 0 // Keep first game always unlocked
      }))
    );
  }, [isAdminUser]);

  const mockPlayers: PropFinderPlayer[] = useMemo(() => [
    {
      id: '1',
      name: 'Nico Hoerner',
      team: 'CHC',
      position: '2B',
      number: 2,
      imageUrl: 'https://www.propfinder.app/img/MLB/players/663538.png',
      pfRating: 0, // Will be calculated
      prop: 'o0.5 Stolen Bases',
      l10Avg: 0.3,
      l5Avg: 0.6,
      odds: '+370',
      streak: 0,
      matchup: 'vs RHP',
      percentages: {
        '2024': 18,
        '2025': 15,
        'h2h': 6,
        'l5': 40,
        'last': 20,
        'l4': 10,
      },
      isFavorite: false,
    },
    {
      id: '2',
      name: 'Dansby Swanson',
      team: 'CHC',
      position: 'SS',
      number: 7,
      imageUrl: 'https://www.propfinder.app/img/MLB/players/621020.png',
      pfRating: 0, // Will be calculated
      prop: 'o0.5 Stolen Bases',
      l10Avg: 0.2,
      l5Avg: 0.0,
      odds: '+800',
      streak: 0,
      matchup: 'vs RHP',
      percentages: {
        '2024': 12,
        '2025': 7,
        'h2h': 6,
        'l5': 0,
        'last': 20,
        'l4': 10,
      },
      isFavorite: false,
    },
    {
      id: '3',
      name: 'Christian Yelich',
      team: 'MIL',
      position: 'LF',
      number: 22,
      imageUrl: 'https://www.propfinder.app/img/MLB/players/592885.png',
      pfRating: 0, // Will be calculated
      prop: 'o1.5 Total Bases',
      l10Avg: 1.8,
      l5Avg: 2.2,
      odds: '+110',
      streak: 3,
      matchup: 'vs LHP',
      percentages: {
        '2024': 65,
        '2025': 70,
        'h2h': 75,
        'l5': 80,
        'last': 60,
        'l4': 85,
      },
      isFavorite: true,
    },
  ], []);

  // Calculate PF Ratings and apply filtering with enhanced processing
  const processedPlayers = useMemo(() => {
    // Use real players if available, otherwise fall back to mock data
    const sourceData = realPlayers.length > 0 ? realPlayers : mockPlayers;
    let players = sourceData.map(player => ({
      ...player,
      pfRating: calculatePFRating(player)
    }));

    // Filter by selected categories
    const selectedCategoryIds = categories.filter(cat => cat.selected).map(cat => cat.id);
    players = players.filter(player => {
      const propType = player.prop.toLowerCase();
      return selectedCategoryIds.some(catId => {
        switch(catId) {
          case 'stolenBases': return propType.includes('stolen');
          case 'totalBases': return propType.includes('total bases');
          case 'hits': return propType.includes('hit');
          case 'homeRuns': return propType.includes('home run');
          case 'runs': return propType.includes('runs');
          case 'rbis': return propType.includes('rbi');
          case 'singles': return propType.includes('single');
          case 'doubles': return propType.includes('double');
          case 'triples': return propType.includes('triple');
          case 'battingStrikeouts': return propType.includes('strikeout');
          case 'walks': return propType.includes('walk');
          case 'hitsRunsRbis': return propType.includes('hits + runs + rbis');
          case 'strikeouts': return propType.includes('strikeouts') && !propType.includes('batting');
          case 'outs': return propType.includes('outs');
          case 'hitsAllowed': return propType.includes('hits allowed');
          case 'walksAllowed': return propType.includes('walks allowed');
          case 'earnedRuns': return propType.includes('earned runs');
          default: return true;
        }
      });
    });

    // Filter by selected games
    const selectedTeams = games.filter(game => game.selected).flatMap(game => [game.homeTeam, game.awayTeam]);
    if (selectedTeams.length > 0) {
      players = players.filter(player => selectedTeams.includes(player.team));
    }

    // Apply advanced filters
    if (minPFRating > 0) {
      players = players.filter(player => player.pfRating >= minPFRating);
    }
    
    if (maxOdds < 500) {
      players = players.filter(player => {
        const numericOdds = parseInt(player.odds.replace(/[+-]/g, ''));
        return numericOdds <= maxOdds;
      });
    }
    
    if (onlyFavorites) {
      players = players.filter(player => favorites.includes(player.id));
    }

    // Apply search filter
    if (playerSearchQuery.trim()) {
      const query = playerSearchQuery.toLowerCase().trim();
      players = players.filter(player => 
        player.name.toLowerCase().includes(query) ||
        player.team.toLowerCase().includes(query) ||
        player.position.toLowerCase().includes(query) ||
        player.prop.toLowerCase().includes(query)
      );
    }

    // Apply sorting
    if (sortConfig) {
      const { key, direction } = sortConfig;
      players.sort((a, b) => {
        let aValue: unknown = a;
        let bValue: unknown = b;
        
        // Handle nested properties
        if (key.includes('.')) {
          const keys = key.split('.');
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          aValue = keys.reduce((obj, k) => (obj as any)?.[k], a as any);
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          bValue = keys.reduce((obj, k) => (obj as any)?.[k], b as any);
        } else {
          aValue = a[key as keyof PropFinderPlayer];
          bValue = b[key as keyof PropFinderPlayer];
        }
        
        // Handle numeric sorting
        if (typeof aValue === 'number' && typeof bValue === 'number') {
          return direction === 'asc' ? aValue - bValue : bValue - aValue;
        }
        
        // Handle string sorting
        const aStr = String(aValue).toLowerCase();
        const bStr = String(bValue).toLowerCase();
        
        if (direction === 'asc') {
          return aStr < bStr ? -1 : aStr > bStr ? 1 : 0;
        } else {
          return aStr > bStr ? -1 : aStr < bStr ? 1 : 0;
        }
      });
    } else {
      // Default sort by PF Rating (descending)
      players.sort((a, b) => b.pfRating - a.pfRating);
    }

    return players;
  }, [
    realPlayers, 
    mockPlayers, 
    categories, 
    games, 
    minPFRating, 
    maxOdds, 
    onlyFavorites, 
    playerSearchQuery, 
    sortConfig,
    calculatePFRating,
    favorites
  ]);

  // Update filtered players when processing changes
  useEffect(() => {
    setFilteredPlayers(processedPlayers);
  }, [processedPlayers]);

  const selectedCategoriesCount = categories.filter(c => c.selected).length;
  const selectedGamesCount = games.filter(g => g.selected).length;

  // Enhanced circular progress component with animations and better styling
  const CircularProgress: React.FC<{ 
    value: number; 
    size?: number; 
    showLabel?: boolean;
    animated?: boolean;
  }> = ({ value, size = 50, showLabel = true, animated = true }) => {
    const radius = (size - 4) / 2;
    const circumference = radius * 2 * Math.PI;
    const strokeDasharray = `${circumference} ${circumference}`;
    const strokeDashoffset = circumference - (value / 100) * circumference;

    const getColor = (rating: number) => {
      if (rating >= 80) return { main: '#22c55e', bg: '#166534' }; // green
      if (rating >= 70) return { main: '#3b82f6', bg: '#1e40af' }; // blue  
      if (rating >= 60) return { main: '#f59e0b', bg: '#d97706' }; // amber
      if (rating >= 50) return { main: '#f97316', bg: '#ea580c' }; // orange
      return { main: '#ef4444', bg: '#dc2626' }; // red
    };

    const colors = getColor(value);

    return (
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          className="transform -rotate-90"
          width={size}
          height={size}
        >
          {/* Background circle */}
          <circle
            stroke={colors.bg}
            fill="transparent"
            strokeWidth="3"
            r={radius}
            cx={size / 2}
            cy={size / 2}
            opacity="0.3"
          />
          {/* Progress circle */}
          <motion.circle
            stroke={colors.main}
            fill="transparent"
            strokeWidth="3"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={animated ? strokeDashoffset : 0}
            strokeLinecap="round"
            r={radius}
            cx={size / 2}
            cy={size / 2}
            initial={animated ? { strokeDashoffset: circumference } : {}}
            animate={animated ? { strokeDashoffset } : {}}
            transition={{ duration: 1, ease: "easeOut" }}
          />
        </svg>
        {showLabel && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-sm font-bold text-white">{value}</span>
          </div>
        )}
      </div>
    );
  };

  // Enhanced performance cell component with better color logic
  const PerformanceCell: React.FC<{ 
    value: number; 
    showFraction?: boolean; 
    denominator?: number;
    size?: 'sm' | 'md' | 'lg';
    tooltip?: string;
  }> = ({ 
    value, 
    showFraction = false, 
    denominator = 0,
    size = 'md',
    tooltip
  }) => {
    const getColorClass = (val: number) => {
      if (val >= 70) return 'bg-green-600 text-white border-green-500';
      if (val >= 60) return 'bg-green-500 text-white border-green-400';
      if (val >= 50) return 'bg-yellow-500 text-black border-yellow-400';
      if (val >= 40) return 'bg-orange-500 text-white border-orange-400';
      if (val >= 30) return 'bg-red-500 text-white border-red-400';
      if (val > 0) return 'bg-red-600 text-white border-red-500';
      return 'bg-slate-600 text-slate-300 border-slate-500';
    };

    const sizeClasses = {
      sm: 'px-1.5 py-1 text-xs min-w-[45px]',
      md: 'px-2 py-1.5 text-xs min-w-[55px]',
      lg: 'px-3 py-2 text-sm min-w-[65px]'
    };

    const numerator = showFraction && denominator > 0 ? Math.floor((value/100) * denominator) : 0;

    return (
      <div 
        className={`${sizeClasses[size]} rounded border font-bold text-center transition-all hover:shadow-md ${getColorClass(value)}`}
        title={tooltip}
      >
        <div>{value}%</div>
        {showFraction && denominator > 0 && (
          <div className="text-xs opacity-90 leading-tight">
            {numerator}/{denominator}
          </div>
        )}
      </div>
    );
  };

  // Enhanced recommendation badge component
  const RecommendationBadge: React.FC<{ 
    recommendation: string; 
    confidence: number;
    edge?: number;
  }> = ({ recommendation, confidence, edge }) => {
    const getStyle = (rec: string) => {
      switch (rec) {
        case 'STRONG':
          return 'bg-green-500/20 text-green-300 border-green-500/50 shadow-green-500/25';
        case 'LEAN':
          return 'bg-blue-500/20 text-blue-300 border-blue-500/50 shadow-blue-500/25';
        case 'AVOID':
          return 'bg-red-500/20 text-red-300 border-red-500/50 shadow-red-500/25';
        default:
          return 'bg-slate-500/20 text-slate-300 border-slate-500/50';
      }
    };

    return (
      <div className="space-y-1">
        <div className={`px-2 py-1 rounded-full text-xs font-semibold border shadow-sm ${getStyle(recommendation)}`}>
          {recommendation}
        </div>
        <div className="text-xs text-slate-400 text-center">
          {confidence}%
          {edge !== undefined && edge > 0 && (
            <span className="text-green-400 ml-1">+{edge.toFixed(1)}%</span>
          )}
        </div>
      </div>
    );
  };

  // Enhanced streak indicator component
  const StreakIndicator: React.FC<{ streak: number; size?: 'sm' | 'md' }> = ({ 
    streak, 
    size = 'md' 
  }) => {
    if (streak === 0) {
      return <span className="text-slate-400">0</span>;
    }

    const isHot = streak > 0;
    const streakMagnitude = Math.abs(streak);
    
    const getStreakStyle = (magnitude: number, hot: boolean) => {
      if (magnitude >= 5) {
        return hot 
          ? 'bg-red-600 text-white animate-pulse' 
          : 'bg-blue-600 text-white animate-pulse';
      } else if (magnitude >= 3) {
        return hot 
          ? 'bg-red-500 text-white' 
          : 'bg-blue-500 text-white';
      } else {
        return hot 
          ? 'bg-orange-500 text-white' 
          : 'bg-cyan-500 text-white';
      }
    };

    const sizeClasses = size === 'sm' ? 'text-xs px-1.5 py-0.5' : 'text-xs px-2 py-1';

    return (
      <div className="flex items-center gap-2">
        <span className="text-white font-medium">{streak}</span>
        {streakMagnitude >= 3 && (
          <div className={`rounded-full font-bold ${sizeClasses} ${getStreakStyle(streakMagnitude, isHot)}`}>
            {isHot ? '🔥' : '❄️'}
            {streakMagnitude >= 5 ? 'FIRE' : isHot ? 'HOT' : 'COLD'}
          </div>
        )}
      </div>
    );
  };

  // Enhanced odds display component with market dropdown
  const OddsDisplay: React.FC<{ 
    odds: string; 
    playerId?: string;
    impliedProb?: number;
    edge?: number;
  }> = ({ odds, impliedProb, edge }) => {
    const [showMarkets, setShowMarkets] = useState(false);

    return (
      <div className="relative">
        <div className="flex items-center gap-2">
          <span className="text-white font-medium">{odds}</span>
          <span className="text-slate-400">¥</span>
          <button 
            onClick={() => setShowMarkets(!showMarkets)}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <ChevronDown className="w-3 h-3" />
          </button>
        </div>
        {impliedProb && (
          <div className="text-xs text-slate-400 mt-1">
            {impliedProb.toFixed(1)}% implied
            {edge !== undefined && (
              <span className={`ml-1 ${edge > 0 ? 'text-green-400' : 'text-red-400'}`}>
                ({edge > 0 ? '+' : ''}{edge.toFixed(1)}%)
              </span>
            )}
          </div>
        )}
        
        <AnimatePresence>
          {showMarkets && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-full left-0 mt-1 bg-slate-800 border border-slate-600 rounded-lg shadow-xl z-10 min-w-[200px]"
            >
              <div className="p-3 space-y-2">
                <div className="text-sm font-medium text-white mb-2">Markets</div>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between text-slate-300">
                    <span>DraftKings</span>
                    <span className="font-medium">{odds}</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>FanDuel</span>
                    <span className="font-medium">+105</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>BetMGM</span>
                    <span className="font-medium">-110</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  // Enhanced player image component with better fallback
  const PlayerImage: React.FC<{ 
    src?: string; 
    name: string; 
    size?: number;
  }> = ({ src, name, size = 40 }) => {
    const [imageError, setImageError] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const initials = name.split(' ').map(n => n[0]).join('').substring(0, 2);

    return (
      <div 
        className="rounded-full bg-slate-700 flex items-center justify-center overflow-hidden border border-slate-600"
        style={{ width: size, height: size }}
      >
        {src && !imageError ? (
          <>
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              </div>
            )}
            <img 
              src={src} 
              alt={name}
              className="w-full h-full object-cover"
              onLoad={() => setIsLoading(false)}
              onError={() => {
                setImageError(true);
                setIsLoading(false);
              }}
            />
          </>
        ) : (
          <div className="text-slate-300 font-semibold text-sm">
            {initials || <User className="w-5 h-5" />}
          </div>
        )}
      </div>
    );
  };

  const toggleCategory = (categoryId: string) => {
    setCategories(prev => prev.map(cat => 
      cat.id === categoryId ? { ...cat, selected: !cat.selected } : cat
    ));
  };

  const toggleAllCategories = () => {
    const allSelected = categories.every(cat => cat.selected);
    setCategories(prev => prev.map(cat => ({ ...cat, selected: !allSelected })));
  };

  // Debounced game selection to prevent rapid API calls
  const [selectedGameIds, setSelectedGameIds] = useState<Set<string>>(new Set());
  const [gameSelectionTimeout, setGameSelectionTimeout] = useState<NodeJS.Timeout | null>(null);

  const debouncedGameSelection = React.useCallback((updatedGames: Game[]) => {
    // Clear existing timeout
    if (gameSelectionTimeout) {
      clearTimeout(gameSelectionTimeout);
    }

    // Set new timeout for delayed prop loading
    const timeout = setTimeout(() => {
      const newSelectedIds = new Set(updatedGames.filter(g => g.selected).map(g => g.id));
      if (!areSetsEqual(selectedGameIds, newSelectedIds)) {
        setSelectedGameIds(newSelectedIds);
        if (newSelectedIds.size > 0) {
          loadPropsForSelectedGames();
        }
      }
    }, 300); // 300ms debounce

    setGameSelectionTimeout(timeout);
  }, [gameSelectionTimeout, selectedGameIds, loadPropsForSelectedGames]);

  // Helper function to compare Sets
  const areSetsEqual = (set1: Set<string>, set2: Set<string>) => {
    return set1.size === set2.size && [...set1].every(x => set2.has(x));
  };

  const toggleGame = (gameId: string) => {
    const updatedGames = games.map(game => 
      game.id === gameId ? { ...game, selected: !game.selected } : game
    );
    setGames(updatedGames);
    debouncedGameSelection(updatedGames);
  };

  const toggleFavorite = (playerId: string) => {
    setFavorites(prev =>
      prev.includes(playerId)
        ? prev.filter(fav => fav !== playerId)
        : [...prev, playerId]
    );
  };

  const toggleBetType = () => {
    setBetType(prev => prev === 'OVER' ? 'UNDER' : 'OVER');
  };

  // Cleanup timeouts on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      if (gameSelectionTimeout) {
        clearTimeout(gameSelectionTimeout);
      }
    };
  }, [gameSelectionTimeout]);

  const _getRecommendationBadge = (recommendation: string, confidence: number) => {
    const colors = {
      STRONG: 'bg-green-500/20 text-green-400 border-green-500/50',
      LEAN: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50',
      AVOID: 'bg-red-500/20 text-red-400 border-red-500/50'
    };
    
    return (
      <div className={`px-2 py-1 rounded-full text-xs font-semibold border ${colors[recommendation as keyof typeof colors]}`}>
        {recommendation} ({confidence}%)
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Top Filter Bar - Exact PropFinder Replica */}
      <div className="bg-slate-800 border-b border-slate-700 p-4">
        <div className="flex items-center gap-4 flex-wrap">
          {/* OVER/UNDER Toggle */}
          <div className="flex bg-slate-900 rounded-lg p-1">
            <button
              onClick={() => setBetType('OVER')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                betType === 'OVER' 
                  ? 'bg-purple-600 text-white' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              OVER
            </button>
            <button
              onClick={() => setBetType('UNDER')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                betType === 'UNDER' 
                  ? 'bg-purple-600 text-white' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              UNDER
            </button>
          </div>

          {/* Search Player Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowPlayerDropdown(!showPlayerDropdown)}
              className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 px-4 py-2 rounded-lg text-white min-w-[160px] justify-between"
            >
              <User className="w-4 h-4" />
              <span>{searchPlayer}</span>
              <ChevronDown className="w-4 h-4" />
            </button>

            <AnimatePresence>
              {showPlayerDropdown && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute top-full left-0 mt-1 w-80 bg-slate-800 border border-slate-600 rounded-lg shadow-xl z-50"
                >
                  <div className="p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Search className="w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search players, teams, positions..."
                        value={playerSearchQuery}
                        onChange={(e) => setPlayerSearchQuery(e.target.value)}
                        className="flex-1 bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        autoFocus
                      />
                      {playerSearchQuery && (
                        <button
                          onClick={() => setPlayerSearchQuery('')}
                          className="text-slate-400 hover:text-white"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    {playerSearchQuery && (
                      <div className="text-sm text-slate-300">
                        Found {processedPlayers.filter(p => 
                          p.name.toLowerCase().includes(playerSearchQuery.toLowerCase()) ||
                          p.team.toLowerCase().includes(playerSearchQuery.toLowerCase()) ||
                          p.position.toLowerCase().includes(playerSearchQuery.toLowerCase())
                        ).length} matching players
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Categories Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowCategoriesDropdown(!showCategoriesDropdown)}
              className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 px-4 py-2 rounded-lg text-white min-w-[140px] justify-between"
            >
              <span>Categories</span>
              <div className="flex items-center gap-2">
                <span className="bg-purple-600 text-white px-2 py-1 rounded text-xs font-medium">
                  {selectedCategoriesCount} selected
                </span>
                <ChevronDown className="w-4 h-4" />
              </div>
            </button>

            <AnimatePresence>
              {showCategoriesDropdown && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute top-full left-0 mt-1 w-80 bg-slate-800 border border-slate-600 rounded-lg shadow-xl z-50"
                >
                  <div className="p-4 max-h-96 overflow-y-auto">
                    <div className="border-b border-slate-600 pb-3 mb-3">
                      <span className="text-purple-400 text-sm font-medium">Categories</span>
                      <button 
                        onClick={toggleAllCategories}
                        className="ml-2 text-sm text-purple-400 hover:text-purple-300"
                      >
                        <ChevronDown className="w-4 h-4 inline" />
                      </button>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 cursor-pointer hover:bg-slate-700 p-2 rounded">
                        <input
                          type="checkbox"
                          checked={categories.every(cat => cat.selected)}
                          onChange={toggleAllCategories}
                          className="w-4 h-4 text-purple-600 bg-slate-700 border-slate-600 rounded focus:ring-purple-500"
                        />
                        <span className="text-white font-medium">Select All</span>
                      </label>
                      
                      {categories.map((category) => (
                        <label key={category.id} className="flex items-center gap-2 cursor-pointer hover:bg-slate-700 p-2 rounded">
                          <input
                            type="checkbox"
                            checked={category.selected}
                            onChange={() => toggleCategory(category.id)}
                            className="w-4 h-4 text-purple-600 bg-slate-700 border-slate-600 rounded focus:ring-purple-500"
                          />
                          <span className="text-white">{category.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Games Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowGamesDropdown(!showGamesDropdown)}
              className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 px-4 py-2 rounded-lg text-white min-w-[120px] justify-between"
            >
              <span>Games</span>
              <div className="flex items-center gap-2">
                <span className="bg-purple-600 text-white px-2 py-1 rounded text-xs font-medium">
                  {selectedGamesCount} selected
                </span>
                <ChevronDown className="w-4 h-4" />
              </div>
            </button>

            <AnimatePresence>
              {showGamesDropdown && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute top-full left-0 mt-1 w-80 bg-slate-800 border border-slate-600 rounded-lg shadow-xl z-50"
                >
                  <div className="p-4 max-h-96 overflow-y-auto">
                    <div className="border-b border-slate-600 pb-3 mb-3">
                      <span className="text-purple-400 text-sm font-medium">Games</span>
                      <button className="ml-2 text-sm text-purple-400 hover:text-purple-300">
                        <ChevronDown className="w-4 h-4 inline" />
                      </button>
                    </div>
                    
                    <div className="space-y-2">
                      {isLoadingGames ? (
                        <div className="flex items-center gap-2 p-4 text-slate-400">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Loading games...</span>
                        </div>
                      ) : (
                        <>
                          <label className="flex items-center gap-2 cursor-pointer hover:bg-slate-700 p-2 rounded">
                            <input
                              type="checkbox"
                              checked={games.every(g => g.selected)}
                              onChange={() => setGames(prev => prev.map(g => ({ ...g, selected: true })))}
                              className="w-4 h-4 text-purple-600 bg-slate-700 border-slate-600 rounded focus:ring-purple-500"
                            />
                            <span className="text-white font-medium">Select All</span>
                          </label>
                      
                      {games.map((game) => (
                        <div key={game.id}>
                          {game.locked && !isAdminUser ? (
                            <div className="flex items-center gap-2 p-2 rounded bg-slate-700/50">
                              <div className="w-4 h-4 bg-slate-600 rounded flex items-center justify-center">
                                <div className="w-2 h-2 bg-purple-400 rounded-full" />
                              </div>
                              <span className="text-purple-400 text-sm">
                                UNLOCK {game.awayTeam} @ {game.homeTeam}
                              </span>
                            </div>
                          ) : (
                            <label className="flex items-center gap-2 cursor-pointer hover:bg-slate-700 p-2 rounded">
                              <input
                                type="checkbox"
                                checked={game.selected}
                                onChange={() => toggleGame(game.id)}
                                className="w-4 h-4 text-purple-600 bg-slate-700 border-slate-600 rounded focus:ring-purple-500"
                              />
                              <span className="text-white text-sm">
                                {game.date} - {game.time}
                              </span>
                              <div className="flex items-center gap-1 text-xs">
                                <span className="w-6 h-6 bg-yellow-600 rounded-full flex items-center justify-center text-black font-bold">
                                  {game.awayTeam.substring(0, 1)}
                                </span>
                                <span className="text-slate-400">@</span>
                                <span className="text-slate-400">-1</span>
                                <span className="w-6 h-6 bg-red-600 rounded-full flex items-center justify-center text-white font-bold">
                                  {game.homeTeam.substring(0, 1)}
                                </span>
                              </div>
                              {isAdminUser && game.id !== '1' && (
                                <span className="text-green-400 text-xs ml-2">ADMIN</span>
                              )}
                            </label>
                          )}
                        </div>
                      ))}
                        </>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Bet Type Toggle */}
          <div className="flex items-center gap-2">
            <span className="text-slate-300 text-sm">Bet Type:</span>
            <button
              onClick={toggleBetType}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                betType === 'OVER' 
                  ? 'bg-green-600 text-white shadow-lg' 
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              OVER
            </button>
            <button
              onClick={toggleBetType}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                betType === 'UNDER' 
                  ? 'bg-red-600 text-white shadow-lg' 
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              UNDER
            </button>
          </div>

          {/* Advanced Filters Toggle */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-all flex items-center gap-2 ${
                showAdvancedFilters 
                  ? 'bg-purple-600 text-white shadow-lg' 
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              <Filter className="w-4 h-4" />
              Advanced
              <ChevronDown className={`w-4 h-4 transition-transform ${showAdvancedFilters ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {/* Favorites Filter Toggle */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setOnlyFavorites(!onlyFavorites)}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                onlyFavorites
                  ? 'bg-red-600 text-white shadow-lg' 
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              } flex items-center gap-2`}
            >
              <Heart className={`w-4 h-4 ${onlyFavorites ? 'fill-current' : ''}`} />
              Favorites ({favorites.length})
            </button>
          </div>

          {/* Performance Stats */}
          <div className="flex items-center gap-4 text-sm text-slate-400">
            <div className="flex items-center gap-1">
              <BarChart3 className="w-4 h-4" />
              <span>{processedPlayers.length} props</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span>{Math.round(cacheHits / Math.max(apiCalls, 1) * 100)}% cached</span>
            </div>
            {lastUpdateTime && (
              <div className="flex items-center gap-1">
                <RefreshCw className="w-4 h-4" />
                <span>Updated {lastUpdateTime.toLocaleTimeString()}</span>
              </div>
            )}
          </div>

          {/* Show All Lines Toggle */}
          <div className="flex items-center gap-6 ml-auto">            
            <div className="flex items-center gap-3">
              <span className="text-slate-300 text-sm">Show All Lines:</span>
              <div className="relative">
                <input
                  type="checkbox"
                  id="showAllLines"
                  checked={showAllLines}
                  onChange={(e) => setShowAllLines(e.target.checked)}
                  className="sr-only"
                />
                <label
                  htmlFor="showAllLines"
                  className={`flex items-center cursor-pointer w-12 h-6 rounded-full p-1 transition-all ${
                    showAllLines ? 'bg-purple-600' : 'bg-slate-600'
                  }`}
                >
                  <div
                    className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                      showAllLines ? 'translate-x-6' : ''
                    }`}
                  />
                </label>
              </div>
              <span className="text-slate-300 text-sm">{processedPlayers.length}/{realPlayers.length || mockPlayers.length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Advanced Filters Panel */}
      <AnimatePresence>
        {showAdvancedFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-slate-800/90 border-b border-slate-600 overflow-hidden"
          >
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
                {/* PF Rating Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                    <Award className="w-4 h-4" />
                    Min PF Rating
                  </label>
                  <div className="space-y-2">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={minPFRating}
                      onChange={(e) => setMinPFRating(parseInt(e.target.value))}
                      className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer slider"
                    />
                    <div className="flex justify-between text-xs text-slate-400">
                      <span>0</span>
                      <span className="text-white font-medium">{minPFRating}</span>
                      <span>100</span>
                    </div>
                  </div>
                </div>

                {/* Odds Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                    <Target className="w-4 h-4" />
                    Max Odds
                  </label>
                  <div className="space-y-2">
                    <input
                      type="range"
                      min="100"
                      max="500"
                      value={maxOdds}
                      onChange={(e) => setMaxOdds(parseInt(e.target.value))}
                      className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer slider"
                    />
                    <div className="flex justify-between text-xs text-slate-400">
                      <span>+100</span>
                      <span className="text-white font-medium">+{maxOdds}</span>
                      <span>+500</span>
                    </div>
                  </div>
                </div>

                {/* Market Type Selection */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Market Type</label>
                  <div className="flex bg-slate-700 rounded-lg p-1">
                    <button
                      onClick={() => setSelectedMarketType('main')}
                      className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-all ${
                        selectedMarketType === 'main' 
                          ? 'bg-purple-600 text-white' 
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Main
                    </button>
                    <button
                      onClick={() => setSelectedMarketType('alternate')}
                      className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-all ${
                        selectedMarketType === 'alternate' 
                          ? 'bg-purple-600 text-white' 
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Alt
                    </button>
                  </div>
                </div>

                {/* Auto Refresh Controls */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                    <Zap className="w-4 h-4" />
                    Auto Refresh
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={autoRefreshEnabled}
                        onChange={(e) => setAutoRefreshEnabled(e.target.checked)}
                        className="w-4 h-4 text-purple-600 bg-slate-700 border-slate-600 rounded focus:ring-purple-500"
                      />
                      <span className="text-sm text-slate-300">Enable</span>
                    </label>
                    <select
                      value={refreshInterval}
                      onChange={(e) => setRefreshInterval(parseInt(e.target.value))}
                      disabled={!autoRefreshEnabled}
                      className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white text-sm disabled:opacity-50"
                    >
                      <option value={15}>15s</option>
                      <option value={30}>30s</option>
                      <option value={60}>1m</option>
                      <option value={300}>5m</option>
                    </select>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Quick Actions</label>
                  <div className="space-y-2">
                    <button
                      onClick={() => {
                        setMinPFRating(70);
                        setMaxOdds(200);
                        setOnlyFavorites(false);
                      }}
                      className="w-full px-3 py-2 bg-green-600/20 text-green-300 rounded-lg text-sm font-medium hover:bg-green-600/30 transition-colors"
                    >
                      Strong Bets
                    </button>
                    <button
                      onClick={() => {
                        setMinPFRating(0);
                        setMaxOdds(500);
                        setOnlyFavorites(false);
                      }}
                      className="w-full px-3 py-2 bg-slate-600/50 text-slate-300 rounded-lg text-sm font-medium hover:bg-slate-600/70 transition-colors"
                    >
                      Reset Filters
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Action Bar */}
      <div className="bg-slate-800/80 border-b border-slate-600 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button className="flex items-center gap-2 text-slate-400 hover:text-white text-sm">
            <Settings className="w-4 h-4" />
            View Settings
          </button>
          <button className="flex items-center gap-2 text-slate-400 hover:text-white text-sm">
            <Filter className="w-4 h-4" />
            Filters
          </button>
          <button className="flex items-center gap-2 text-slate-400 hover:text-white text-sm">
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => {
              setError(null);
              loadTodaysGames();
              if (games.length > 0) {
                loadPropsForSelectedGames();
              }
            }}
            disabled={isLoadingGames || isLoadingProps}
            className="flex items-center gap-2 text-slate-400 hover:text-white text-sm disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${(isLoadingGames || isLoadingProps) ? 'animate-spin' : ''}`} />
            Refresh {(isLoadingGames || isLoadingProps) ? 'Loading...' : ''}
          </button>
        </div>
      </div>

      {/* Enhanced Main Data Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-800 border-b border-slate-600 sticky top-0 z-10">
            <tr className="text-slate-300">
              <th className="text-left p-3 text-sm font-semibold w-8">
                <Heart className="w-4 h-4 text-slate-500" />
              </th>
              <th 
                className="text-left p-3 text-sm font-semibold w-20 cursor-pointer hover:bg-slate-700 transition-colors"
                onClick={() => handleSort('pfRating')}
              >
                <div className="flex items-center gap-1">
                  <span>PF Rating</span>
                  {sortConfig?.key === 'pfRating' && (
                    <ChevronDown className={`w-3 h-3 transition-transform ${sortConfig.direction === 'asc' ? 'rotate-180' : ''}`} />
                  )}
                </div>
              </th>
              <th 
                className="text-left p-3 text-sm font-semibold w-16 cursor-pointer hover:bg-slate-700 transition-colors"
                onClick={() => handleSort('team')}
              >
                Team
              </th>
              <th 
                className="text-left p-3 text-sm font-semibold w-16 cursor-pointer hover:bg-slate-700 transition-colors"
                onClick={() => handleSort('position')}
              >
                Pos
              </th>
              <th 
                className="text-left p-3 text-sm font-semibold w-48 cursor-pointer hover:bg-slate-700 transition-colors"
                onClick={() => handleSort('name')}
              >
                Player
              </th>
              <th 
                className="text-left p-3 text-sm font-semibold w-32 cursor-pointer hover:bg-slate-700 transition-colors"
                onClick={() => handleSort('prop')}
              >
                Prop
              </th>
              <th 
                className="text-left p-3 text-sm font-semibold w-24 cursor-pointer hover:bg-slate-700 transition-colors"
                onClick={() => handleSort('l10Avg')}
              >
                <div className="flex items-center gap-1">
                  <span>L10 Avg</span>
                  <Info className="w-3 h-3 text-slate-500" />
                </div>
              </th>
              <th 
                className="text-left p-3 text-sm font-semibold w-24 cursor-pointer hover:bg-slate-700 transition-colors"
                onClick={() => handleSort('l5Avg')}
              >
                <div className="flex items-center gap-1">
                  <span>L5 Avg</span>
                  <Info className="w-3 h-3 text-slate-500" />
                </div>
              </th>
              <th 
                className="text-left p-3 text-sm font-semibold w-24 cursor-pointer hover:bg-slate-700 transition-colors"
                onClick={() => handleSort('odds')}
              >
                Odds
              </th>
              <th 
                className="text-left p-3 text-sm font-semibold w-20 cursor-pointer hover:bg-slate-700 transition-colors"
                onClick={() => handleSort('streak')}
              >
                Streak
              </th>
              <th className="text-left p-3 text-sm font-semibold w-24">Matchup</th>
              <th 
                className="text-left p-3 text-sm font-semibold w-20 cursor-pointer hover:bg-slate-700 transition-colors"
                onClick={() => handleSort('percentages.2024')}
              >
                2024
              </th>
              <th 
                className="text-left p-3 text-sm font-semibold w-20 cursor-pointer hover:bg-slate-700 transition-colors"
                onClick={() => handleSort('percentages.2025')}
              >
                2025
              </th>
              <th 
                className="text-left p-3 text-sm font-semibold w-20 cursor-pointer hover:bg-slate-700 transition-colors"
                onClick={() => handleSort('percentages.h2h')}
              >
                H2H
              </th>
              <th 
                className="text-left p-3 text-sm font-semibold w-20 cursor-pointer hover:bg-slate-700 transition-colors"
                onClick={() => handleSort('percentages.l5')}
              >
                L5
              </th>
              <th 
                className="text-left p-3 text-sm font-semibold w-20 cursor-pointer hover:bg-slate-700 transition-colors"
                onClick={() => handleSort('percentages.last')}
              >
                L...
              </th>
              <th 
                className="text-left p-3 text-sm font-semibold w-20 cursor-pointer hover:bg-slate-700 transition-colors"
                onClick={() => handleSort('percentages.l4')}
              >
                L4
              </th>
            </tr>
          </thead>
          <tbody>
            {processedPlayers.map((player, index) => {
              const analysis = analyzePropValue(player, betType);
              const valueAnalysis = getValueBetting(player);
              
              return (
                <motion.tr
                  key={player.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(index * 0.05, 1) }}
                  className="border-b border-slate-600/50 hover:bg-slate-800/60 transition-all duration-200 group"
                >
                  {/* Favorite Toggle */}
                  <td className="p-3">
                    <button
                      onClick={() => toggleFavorite(player.id)}
                      className={`text-slate-400 hover:text-red-500 transition-colors ${
                        favorites.includes(player.id) ? 'text-red-500' : ''
                      }`}
                    >
                      <Heart className={`w-4 h-4 ${favorites.includes(player.id) ? 'fill-current' : ''}`} />
                    </button>
                  </td>
                  
                  {/* Enhanced PF Rating */}
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <CircularProgress value={player.pfRating} size={50} animated />
                      <RecommendationBadge 
                        recommendation={analysis.recommendation}
                        confidence={analysis.confidence}
                        edge={analysis.edge}
                      />
                    </div>
                  </td>
                  
                  {/* Team */}
                  <td className="p-3">
                    <span className="text-white font-medium">{player.team}</span>
                  </td>
                  
                  {/* Position */}
                  <td className="p-3">
                    <span className="text-slate-300">{player.position}</span>
                  </td>
                  
                  {/* Enhanced Player Info */}
                  <td className="p-3">
                    <div className="flex items-center gap-3">
                      <PlayerImage 
                        src={player.imageUrl} 
                        name={player.name}
                        size={40}
                      />
                      <div>
                        <div className="text-white font-medium">{player.name}</div>
                        <div className="text-slate-400 text-xs flex items-center gap-1">
                          #{player.number || '??'} • {player.position}
                          {analysis.edge && analysis.edge > 5 && (
                            <span className="bg-green-600/20 text-green-300 px-1.5 py-0.5 rounded text-xs font-medium">
                              EDGE
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>
                  
                  {/* Enhanced Prop Display */}
                  <td className="p-3">
                    <div className="space-y-1">
                      <span className="text-white font-medium">{player.prop}</span>
                      {valueAnalysis.edge > 0 && (
                        <div className="flex items-center gap-1 text-xs">
                          <TrendingUp className="w-3 h-3 text-green-400" />
                          <span className="text-green-400 font-semibold">
                            +{valueAnalysis.edge.toFixed(1)}% EDGE
                          </span>
                        </div>
                      )}
                      {valueAnalysis.kellyBet && valueAnalysis.kellyBet > 1 && (
                        <div className="text-blue-400 text-xs font-medium">
                          Kelly: {valueAnalysis.kellyBet.toFixed(1)}%
                        </div>
                      )}
                    </div>
                  </td>
                  
                  {/* Enhanced Performance Metrics */}
                  <td className="p-3">
                    <div className="flex items-center gap-1">
                      <span className={`font-medium ${
                        player.l10Avg > 0.8 ? 'text-green-400' : 
                        player.l10Avg > 0.5 ? 'text-yellow-400' : 'text-red-400'
                      }`}>
                        {player.l10Avg.toFixed(1)}
                      </span>
                      {player.l5Avg > player.l10Avg && (
                        <TrendingUp className="w-3 h-3 text-green-400" />
                      )}
                      {player.l5Avg < player.l10Avg && (
                        <TrendingDown className="w-3 h-3 text-red-400" />
                      )}
                    </div>
                  </td>
                  
                  <td className="p-3">
                    <div className="flex items-center gap-1">
                      <span className={`font-medium ${
                        player.l5Avg > 0.8 ? 'text-green-400' : 
                        player.l5Avg > 0.5 ? 'text-yellow-400' : 'text-red-400'
                      }`}>
                        {player.l5Avg.toFixed(1)}
                      </span>
                      {Math.abs(player.l5Avg - player.l10Avg) < 0.1 && (
                        <Minus className="w-3 h-3 text-slate-400" />
                      )}
                    </div>
                  </td>
                  
                  {/* Enhanced Odds Display */}
                  <td className="p-3">
                    <OddsDisplay 
                      odds={player.odds} 
                      playerId={player.id}
                      impliedProb={valueAnalysis.impliedProbability}
                      edge={valueAnalysis.edge}
                    />
                  </td>
                  
                  {/* Enhanced Streak Indicator */}
                  <td className="p-3">
                    <StreakIndicator streak={player.streak} />
                  </td>
                  
                  {/* Enhanced Matchup */}
                  <td className="p-3">
                    <div className="bg-orange-500/20 text-orange-300 px-2 py-1 rounded text-xs font-medium border border-orange-500/30">
                      {player.matchup}
                    </div>
                  </td>
                  
                  {/* Enhanced Performance Cells */}
                  <td className="p-3">
                    <PerformanceCell 
                      value={player.percentages['2024']} 
                      showFraction 
                      denominator={150}
                      tooltip="2024 Season Performance"
                    />
                  </td>
                  
                  <td className="p-3">
                    <PerformanceCell 
                      value={player.percentages['2025']} 
                      showFraction 
                      denominator={119}
                      tooltip="2025 Season Performance"
                    />
                  </td>
                  
                  <td className="p-3">
                    <PerformanceCell 
                      value={player.percentages.h2h} 
                      showFraction 
                      denominator={32}
                      tooltip="Head-to-Head Performance"
                    />
                  </td>
                  
                  <td className="p-3">
                    <PerformanceCell 
                      value={player.percentages.l5} 
                      showFraction 
                      denominator={5}
                      tooltip="Last 5 Games Performance"
                    />
                  </td>
                  
                  <td className="p-3">
                    <PerformanceCell 
                      value={player.percentages.last} 
                      showFraction 
                      denominator={10}
                      tooltip="Last 10 Performance"
                    />
                  </td>
                  
                  <td className="p-3">
                    <PerformanceCell 
                      value={player.percentages.l4} 
                      showFraction 
                      denominator={2}
                      tooltip="Last 4 Performance"
                    />
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Loading State */}
      {isLoadingProps && (
        <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-10">
          <div className="bg-slate-800 rounded-lg p-6 flex items-center gap-3 border border-slate-600">
            <Loader2 className="w-5 h-5 animate-spin text-blue-400" />
            <span className="text-white">Loading player props...</span>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-10">
          <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-6 max-w-md">
            <div className="flex items-center gap-3 mb-3">
              <AlertCircle className="w-5 h-5 text-red-400" />
              <span className="text-red-400 font-medium">Error Loading Data</span>
            </div>
            <p className="text-slate-300 text-sm mb-4">{error}</p>
            <button
              onClick={() => {
                setError(null);
                loadTodaysGames();
              }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Enhanced Footer with Performance Metrics */}
      <div className="bg-slate-800/90 border-t border-slate-600 p-4">
        <div className="flex items-center justify-between text-sm text-slate-300">
          <div className="flex items-center gap-6">
            <span className="font-medium">
              Showing {processedPlayers.length} of {realPlayers.length || mockPlayers.length} props
            </span>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <Shield className="w-4 h-4 text-green-400" />
                <span>{processedPlayers.filter(p => p.pfRating >= 70).length} Strong</span>
              </div>
              <div className="flex items-center gap-1">
                <Award className="w-4 h-4 text-blue-400" />
                <span>{processedPlayers.filter(p => p.pfRating >= 50 && p.pfRating < 70).length} Lean</span>
              </div>
              <div className="flex items-center gap-1">
                <AlertCircle className="w-4 h-4 text-red-400" />
                <span>{processedPlayers.filter(p => p.pfRating < 50).length} Avoid</span>
              </div>
            </div>
            
            {favorites.length > 0 && (
              <div className="flex items-center gap-1 text-red-400">
                <Heart className="w-4 h-4 fill-current" />
                <span>{favorites.length} Favorited</span>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-6">
            <div className="text-xs text-slate-400">
              Cache Hit Rate: {Math.round(cacheHits / Math.max(apiCalls, 1) * 100)}%
            </div>
            <div className="text-xs text-slate-400">
              API Calls: {apiCalls}
            </div>
            {lastUpdateTime && (
              <div className="text-xs text-slate-400">
                Last Updated: {lastUpdateTime.toLocaleTimeString()}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PropFinderKillerDashboard;
