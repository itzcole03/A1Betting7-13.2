import * as React from 'react';
import {
  EnhancedPropAnalysis,
  enhancedPropAnalysisService,
} from '../services/EnhancedPropAnalysisService';
import { PropAnalysisAggregator } from '../services/PropAnalysisAggregator';
import {
  FeaturedProp,
  fetchBatchPredictions,
  fetchFeaturedProps,
} from '../services/unified/FeaturedPropsService';
import { EnhancedBetsResponse } from '../types/enhancedBetting';
import { EnhancedApiClient } from '../utils/enhancedApiClient';
import ComprehensivePropsLoader from './ComprehensivePropsLoader';
import CondensedPropCard from './CondensedPropCard';
import EnhancedErrorBoundary from './EnhancedErrorBoundary';
import LiveGameStats from './LiveGameStats';
import LoadingOverlay from './LoadingOverlay';
import PastMatchupTracker from './PastMatchupTracker';
import PropCard from './PropCard';
import RealTimePerformanceMonitor from './RealTimePerformanceMonitor';
import VirtualizedPropList from './VirtualizedPropList';

// DEBUG: Log React version and object identity
if (typeof window !== 'undefined') {
  // @ts-ignore
  window.__REACT_DEBUG__ = React;
  // eslint-disable-next-line no-console
  console.log('[PropOllamaUnified] React version:', React.version, 'object:', React);
}

const sports = ['All', 'NBA', 'NFL', 'NHL', 'MLB'];

// Local type for selected prop in bet slip
type SelectedProp = {
  id: string;
  player: string;
  statType: string;
  line: number | string;
  choice: string;
  odds: number;
};

// Utility to safely render cell values
function safeCell(val: any) {
  if (val === undefined || val === null) return '';
  if (typeof val === 'number' && isNaN(val)) return '';
  return String(val);
}

// Filter props to only include players from teams with upcoming games
function filterPropsForUpcomingGames(
  props: FeaturedProp[],
  upcomingGames: Array<{
    game_id?: number;
    home: string;
    away: string;
    time: string;
    event_name: string;
    status?: string;
    venue?: string;
  }>
): FeaturedProp[] {
  if (!upcomingGames || upcomingGames.length === 0) {
    console.log('[PropOllamaUnified] No upcoming games, returning all props');
    return props;
  }

  // Extract team names from upcoming games (both home and away, with normalization)
  const upcomingTeamNames = new Set<string>();

  upcomingGames.forEach(game => {
    // Add both short and full team names from the matchup
    const matchupParts = game.event_name.split(' @ ');
    if (matchupParts.length === 2) {
      upcomingTeamNames.add(matchupParts[0].trim()); // Away team full name
      upcomingTeamNames.add(matchupParts[1].trim()); // Home team full name
    }

    // Also add short names if available
    upcomingTeamNames.add(game.away);
    upcomingTeamNames.add(game.home);
  });

  console.log('[PropOllamaUnified] Upcoming team names:', Array.from(upcomingTeamNames));

  // Get today's date for filtering (be more lenient with date comparison)
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0]; // YYYY-MM-DD format
  const yesterdayStr = new Date(today.getTime() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  // Filter props to only include:
  // 1. Players from teams that have upcoming games
  // 2. Props from games that are not finished (not "Final" status) OR from yesterday/today (more lenient)
  // 3. Focus on team matching as primary filter
  const filteredProps = props.filter(prop => {
    // Check if prop has team information
    const propTeamName = prop.matchup || prop._originalData?.team_name || '';
    const propGameStatus = prop._originalData?.game_status || '';
    const propStartTime = prop._originalData?.start_time || prop.gameTime || '';

    // Enhanced team matching - check multiple variations
    const isUpcomingTeam = Array.from(upcomingTeamNames).some(teamName => {
      const lowerTeamName = teamName.toLowerCase();
      const lowerPropTeam = propTeamName.toLowerCase();

      return (
        lowerPropTeam.includes(lowerTeamName) ||
        lowerTeamName.includes(lowerPropTeam) ||
        // Check for team name variations (e.g., "Red Sox" matches "Boston Red Sox")
        lowerPropTeam
          .split(' ')
          .some((word: string) => lowerTeamName.includes(word) && word.length > 3) ||
        lowerTeamName
          .split(' ')
          .some((word: string) => lowerPropTeam.includes(word) && word.length > 3)
      );
    });

    // For development/demo purposes, be more lenient with date filtering
    // Skip only very old props or keep all if no start time
    const isReasonableDate =
      !propStartTime || propStartTime >= yesterdayStr || propStartTime === todayStr;

    // Primary filter: team must be in upcoming games
    // Secondary filter: not too old (but allow recent games for demo)
    const shouldKeep = isUpcomingTeam && isReasonableDate;

    if (isUpcomingTeam && !shouldKeep) {
      console.log(
        `[PropOllamaUnified] Keeping team match but filtering date for ${prop.player} (${propTeamName}) - Status: ${propGameStatus}, Date: ${propStartTime}`
      );
    }

    if (!isUpcomingTeam && propTeamName) {
      console.log(
        `[PropOllamaUnified] Filtering out prop for ${prop.player} - team not in upcoming games: ${propTeamName}`
      );
    }

    return shouldKeep;
  });

  console.log(
    `[PropOllamaUnified] Filtered ${props.length} props down to ${filteredProps.length} for upcoming games (${upcomingTeamNames.size} teams)`
  );

  return filteredProps;
}

const PropOllamaUnified: React.FC = () => {
  // Initialize enhanced API client with connection resilience
  const apiClient = React.useMemo(() => {
    return new EnhancedApiClient(import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000');
  }, []);

  // Performance monitoring state
  const [connectionHealth, setConnectionHealth] = React.useState<{
    status: 'healthy' | 'degraded' | 'error';
    latency: number;
    lastCheck: Date;
  }>({
    status: 'healthy',
    latency: 0,
    lastCheck: new Date(),
  });

  const [visiblePropsCount, setVisiblePropsCount] = React.useState(6);
  const [selectedProps, setSelectedProps] = React.useState<SelectedProp[]>([]);
  const [entryAmount, setEntryAmount] = React.useState<number>(10);
  const [sortBy, setSortBy] = React.useState<
    | 'confidence'
    | 'value'
    | 'player'
    | 'upcoming-games'
    | 'odds-low-high'
    | 'odds-high-low'
    | 'team'
  >('confidence');
  const [searchTerm, setSearchTerm] = React.useState<string>('');
  // State declarations (restored, only once, above useEffect)
  const [renderError, setRenderError] = React.useState<string | null>(null);
  const [expandedRowKey, setExpandedRowKey] = React.useState<string | null>(null);

  // Debug tracking for expandedRowKey changes
  React.useEffect(() => {
    console.log('[PropOllamaUnified] expandedRowKey changed:', expandedRowKey);
  }, [expandedRowKey]);

  // Add a flag to prevent clicks during initial loading
  const [initialLoadingComplete, setInitialLoadingComplete] = React.useState(false);
  const [clicksEnabled, setClicksEnabled] = React.useState(false);

  // Enable clicks with a small delay after loading completes to avoid test environment issues
  React.useEffect(() => {
    if (initialLoadingComplete && !clicksEnabled) {
      const timer = setTimeout(() => {
        console.log(`[PropOllamaUnified] ${new Date().toISOString()} Enabling clicks after delay`);
        setClicksEnabled(true);
      }, 100); // Small delay to let DOM settle
      return () => clearTimeout(timer);
    }
  }, [initialLoadingComplete, clicksEnabled]);

  // Debug logging for component lifecycle
  React.useEffect(() => {
    console.log(`[PropOllamaUnified] ${new Date().toISOString()} Component mounted`);
    return () => {
      console.log(`[PropOllamaUnified] ${new Date().toISOString()} Component unmounting`);
    };
  }, []);

  // Connection health monitoring with circuit breaker integration
  React.useEffect(() => {
    const healthMonitor = async () => {
      const startTime = Date.now();
      try {
        const response = await apiClient.get('/health', { cache: false, timeout: 15000 });
        const latency = Date.now() - startTime;

        setConnectionHealth({
          status: latency < 1000 ? 'healthy' : 'degraded',
          latency,
          lastCheck: new Date(),
        });

        console.log(`[PropOllamaUnified] Health check: ${response.status} (${latency}ms)`);
      } catch (error) {
        console.warn('[PropOllamaUnified] Health check failed:', error);
        setConnectionHealth({
          status: 'error',
          latency: Date.now() - startTime,
          lastCheck: new Date(),
        });
      }
    };

    // Initial health check
    healthMonitor();

    // Periodic health checks every 30 seconds
    const interval = setInterval(healthMonitor, 30000);

    return () => clearInterval(interval);
  }, [apiClient]);

  // Debug wrapper for setExpandedRowKey
  const debugSetExpandedRowKey = React.useCallback(
    (value: string | null) => {
      const timestamp = new Date().toISOString();
      console.log(`[PropOllamaUnified] ${timestamp} setExpandedRowKey called:`, {
        from: expandedRowKey,
        to: value,
        renderingPhase: 'unknown',
        stack: new Error().stack,
      });
      setExpandedRowKey(value);
    },
    [expandedRowKey]
  );
  const [projections, setProjections] = React.useState<FeaturedProp[]>([]);

  // Debug tracking for projections changes
  React.useEffect(() => {
    console.log(
      `[PropOllamaUnified] ${new Date().toISOString()} projections state changed:`,
      projections.length,
      'props'
    );
  }, [projections]);
  const [unifiedResponse, setUnifiedResponse] = React.useState<EnhancedBetsResponse | null>(null);
  const [selectedSport, setSelectedSport] = React.useState<string>('MLB');
  const [propType, setPropType] = React.useState<'team' | 'player'>('player');

  // State for MLB filtering
  const [selectedStatType, setSelectedStatType] = React.useState<string>('Popular');
  const [selectedDate, setSelectedDate] = React.useState<string>('');
  const [showUpcomingGames, setShowUpcomingGames] = React.useState<boolean>(false);
  const [upcomingGames, setUpcomingGames] = React.useState<
    Array<{
      game_id?: number;
      home: string;
      away: string;
      time: string;
      event_name: string;
      status?: string;
      venue?: string;
    }>
  >([]);
  const [selectedGame, setSelectedGame] = React.useState<{
    game_id?: number;
    home: string;
    away: string;
    time: string;
    event_name: string;
    status?: string;
    venue?: string;
  } | null>(null);

  // Performance optimization toggles
  const [useVirtualization, setUseVirtualization] = React.useState<boolean>(false);
  const VIRTUALIZATION_THRESHOLD = 100; // Switch to virtualization for datasets larger than this

  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const [error, setError] = React.useState<string | null>(null);
  const [analyzingPropId, setAnalyzingPropId] = React.useState<string | null>(null);

  // MLB Stat Types Configuration (matching the UI from the screenshot)
  const mlbStatTypes = [
    {
      key: 'Popular',
      label: 'Popular',
      icon: '🔥',
      statTypes: ['hits', 'home_runs', 'rbi', 'strikeouts_pitcher'],
    },
    {
      key: 'pitcher_strikeouts',
      label: 'Pitcher Strikeouts',
      icon: '',
      statTypes: ['strikeouts_pitcher'],
    },
    {
      key: 'total_bases',
      label: 'Total Bases',
      icon: '',
      statTypes: ['total_hits', 'doubles', 'home_runs'],
    },
    {
      key: 'innings_runs_allowed',
      label: '1st Inning Runs Allowed',
      icon: '',
      statTypes: ['earned_runs'],
    },
    {
      key: 'hitter_fantasy_score',
      label: 'Hitter Fantasy Score',
      icon: '',
      statTypes: ['hits', 'home_runs', 'rbi', 'runs_scored'],
    },
    {
      key: 'hits_runs_rbis',
      label: 'Hits+Runs+RBIs',
      icon: '',
      statTypes: ['hits', 'runs_scored', 'rbi'],
    },
    { key: 'home_runs', label: 'Home Runs', icon: '', statTypes: ['home_runs'] },
    { key: 'hits_allowed', label: 'Hits Allowed', icon: '', statTypes: ['hits_allowed'] },
    { key: 'stolen_bases', label: 'Stolen Bases', icon: '', statTypes: ['stolen_bases'] },
    { key: 'walks_allowed', label: 'Walks Allowed', icon: '', statTypes: ['walks_pitcher'] },
    { key: 'singles', label: 'Singles', icon: '', statTypes: ['hits'] },
    { key: 'pitching_outs', label: 'Pitching Outs', icon: '', statTypes: ['strikeouts_pitcher'] },
    { key: 'walks', label: 'Walks', icon: '', statTypes: ['walks_batter'] },
    {
      key: 'earned_runs_allowed',
      label: 'Earned Runs Allowed',
      icon: '',
      statTypes: ['earned_runs'],
    },
    { key: 'hits', label: 'Hits', icon: '', statTypes: ['hits', 'total_hits'] },
    { key: 'rbis', label: 'RBIs', icon: '', statTypes: ['rbi'] },
    { key: 'runs', label: 'Runs', icon: '', statTypes: ['runs_scored'] },
    {
      key: 'hitter_strikeouts',
      label: 'Hitter Strikeouts',
      icon: '',
      statTypes: ['strikeouts_batter'],
    },
  ];

  // Function to fetch upcoming games from real-time MLB API
  const fetchUpcomingGames = React.useCallback(async () => {
    try {
      const response = await fetch('/mlb/todays-games');
      if (response.ok) {
        const data = await response.json();

        if (data.status === 'ok' && data.games) {
          // Convert the API response to the format expected by the UI
          const formattedGames = data.games.map((game: any) => ({
            game_id: game.game_id, // Add game_id for live stats
            away: game.away,
            home: game.home,
            time:
              game.status === 'Warmup'
                ? 'Starting Soon'
                : game.status === 'In Progress'
                ? 'Live'
                : game.status === 'Game Over'
                ? 'Final'
                : new Date(game.time).toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit',
                  }),
            event_name: game.event_name,
            status: game.status,
            venue: game.venue,
          }));

          console.log('[PropOllamaUnified] Fetched real-time games:', formattedGames);
          setUpcomingGames(formattedGames.slice(0, 14)); // Show up to 14 games
        } else {
          console.warn('[PropOllamaUnified] No games data in API response');
          setUpcomingGames([]);
        }
      }
    } catch (error) {
      console.error('Error fetching upcoming games:', error);
      // Keep existing fallback games on error
    }
  }, []);

  // Fetch upcoming games when MLB is selected
  React.useEffect(() => {
    if (selectedSport === 'MLB') {
      fetchUpcomingGames();
    }
  }, [selectedSport, fetchUpcomingGames]);
  // Enhanced analysis cache
  const [enhancedAnalysisCache, setEnhancedAnalysisCache] = React.useState<
    Map<string, EnhancedPropAnalysis>
  >(new Map());
  const [loadingAnalysis, setLoadingAnalysis] = React.useState<Set<string>>(new Set());

  // Unified loading state management
  const [loadingStage, setLoadingStage] = React.useState<
    'activating' | 'fetching' | 'processing' | null
  >(null);
  const [loadingMessage, setLoadingMessage] = React.useState<string>('');

  // Function to fetch enhanced analysis for a prop
  const fetchEnhancedAnalysis = React.useCallback(
    async (proj: FeaturedProp) => {
      const cacheKey = `${proj.id}-${proj.player}-${proj.stat}`;

      // Check if already in cache
      const cached = enhancedAnalysisCache.get(cacheKey);
      if (cached) {
        return cached;
      }

      // Check if already loading
      if (loadingAnalysis.has(cacheKey)) {
        return null;
      }

      // Mark as loading
      setLoadingAnalysis(prev => new Set(prev).add(cacheKey));

      try {
        const analysis = await enhancedPropAnalysisService.getEnhancedPropAnalysis(
          proj.id,
          proj.player,
          proj.stat || 'hits',
          proj.line || 0,
          proj.matchup ? proj.matchup.split(' vs ')[0] : 'Unknown Team',
          proj.matchup || 'Unknown vs Unknown'
        );

        if (analysis) {
          setEnhancedAnalysisCache(prev => new Map(prev).set(cacheKey, analysis));
          return analysis;
        }

        return null;
      } catch (error) {
        console.error('Error fetching enhanced analysis:', error);
        return null;
      } finally {
        setLoadingAnalysis(prev => {
          const newSet = new Set(prev);
          newSet.delete(cacheKey);
          return newSet;
        });
      }
    },
    [enhancedAnalysisCache, loadingAnalysis]
  );
  const [propAnalystResponses, setPropAnalystResponses] = React.useState<
    Record<
      string,
      {
        loading: boolean;
        error?: string;
        content?: string;
        isFallback?: boolean;
        isStale?: boolean;
      }
    >
  >({});

  // Ref for click-outside detection on expanded cards
  const expandedCardRef = React.useRef<HTMLDivElement>(null);

  // Click-outside detection to collapse expanded cards
  React.useEffect(() => {
    if (!expandedRowKey) return;

    function handleClickOutside(event: MouseEvent) {
      if (expandedCardRef.current && !expandedCardRef.current.contains(event.target as Node)) {
        debugSetExpandedRowKey(null);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        debugSetExpandedRowKey(null);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [expandedRowKey]);

  // Fetch analysis for expanded prop card
  React.useEffect(() => {
    if (!expandedRowKey) return;
    // If already loaded or loading, do nothing
    if (
      propAnalystResponses[expandedRowKey]?.loading ||
      propAnalystResponses[expandedRowKey]?.content
    )
      return;
    setPropAnalystResponses(prev => ({
      ...prev,
      [expandedRowKey]: { loading: true },
    }));
    const fetchAnalysis = async () => {
      try {
        const aggregator = new PropAnalysisAggregator();
        const proj = projections.find(p => p.id === expandedRowKey);
        if (!proj) return;
        const response = await aggregator.getAnalysis({
          propId: proj.id,
          player: proj.player,
          team: proj.matchup || '',
          statType: proj.stat,
          line: proj.line,
          overOdds: proj.overOdds ?? 0,
          underOdds: proj.underOdds ?? 0,
          sport: proj.sport,
        });
        // Map response to local state shape
        setPropAnalystResponses(prev => ({
          ...prev,
          [expandedRowKey]: {
            loading: false,
            content: response.overAnalysis || response.underAnalysis || '',
            isFallback: response.isFallback,
            isStale: response.isStale,
            error: response.error
              ? typeof response.error === 'string'
                ? response.error
                : response.error.message || String(response.error)
              : undefined,
          },
        }));
      } catch (err: any) {
        setPropAnalystResponses(prev => ({
          ...prev,
          [expandedRowKey]: { error: err?.message || 'Analysis error', loading: false },
        }));
      }
    };
    fetchAnalysis();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expandedRowKey]);
  const [ensembleLoading, setEnsembleLoading] = React.useState<boolean>(false);
  const [ensembleError, setEnsembleError] = React.useState<string | null>(null);
  const [ensembleResult, setEnsembleResult] = React.useState<string | null>(null);
  // Sports options
  // State declarations
  // (All state variables are now declared above, only once)
  // Fetch unified backend data on mount and when selectedSport changes
  // Granular loading state for prop-level progress
  const [propLoadingProgress, setPropLoadingProgress] = React.useState<number>(0);

  // Sport activation management
  const [sportActivationStatus, setSportActivationStatus] = React.useState<{
    [sport: string]: 'ready' | 'loading' | 'error';
  }>({});

  // Track previous sport for cleanup
  const previousSportRef = React.useRef<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    console.log(
      `[PropOllamaUnified] ${new Date().toISOString()} Data loading useEffect triggered - selectedSport: ${selectedSport}, propType: ${propType}, selectedStatType: ${selectedStatType}`
    );

    const activateSportAndFetchData = async (retryCount = 0) => {
      console.log(
        `[PropOllamaUnified] ${new Date().toISOString()} Starting activateSportAndFetchData`
      );
      setIsLoading(true);
      setPropLoadingProgress(0);
      setError(null);
      setLoadingStage('activating');
      setLoadingMessage('');

      try {
        // Step 0: Cleanup previous sport if switching sports
        const previousSport = previousSportRef.current;
        if (previousSport && previousSport !== selectedSport && previousSport !== 'All') {
          try {
            console.log(`🧹 Cleaning up previous sport: ${previousSport}`);
            const deactivationResponse = await fetch(`/api/sports/deactivate/${previousSport}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
            });

            if (deactivationResponse.ok) {
              console.log(`✅ ${previousSport} service deactivated successfully`);
              setSportActivationStatus(prev => ({ ...prev, [previousSport]: 'ready' }));
            } else {
              console.warn(`⚠️ Failed to deactivate ${previousSport} service`);
            }
          } catch (cleanupError) {
            console.warn(`⚠️ Error deactivating ${previousSport}:`, cleanupError);
          }
        }

        // Update previous sport reference
        previousSportRef.current = selectedSport;

        // Step 1: Activate the sport service in backend (lazy loading)
        if (selectedSport !== 'All') {
          setLoadingStage('activating');
          setSportActivationStatus(prev => ({ ...prev, [selectedSport]: 'loading' }));

          try {
            const activationResponse = await fetch(`/api/sports/activate/${selectedSport}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
            });

            if (activationResponse.ok) {
              const activationData = await activationResponse.json();
              console.log(
                `[PropOllamaUnified] ${selectedSport} service activation:`,
                activationData
              );

              setSportActivationStatus(prev => ({ ...prev, [selectedSport]: 'ready' }));

              // Show user feedback if models were newly loaded
              if (activationData.newly_loaded) {
                console.log(
                  `🚀 ${selectedSport} models loaded in ${activationData.load_time.toFixed(2)}s`
                );
              }
            } else {
              console.warn(`[PropOllamaUnified] Sport activation failed for ${selectedSport}`);
              setSportActivationStatus(prev => ({ ...prev, [selectedSport]: 'error' }));
            }
          } catch (activationError) {
            console.warn(
              `[PropOllamaUnified] Sport activation error for ${selectedSport}:`,
              activationError
            );
            setSportActivationStatus(prev => ({ ...prev, [selectedSport]: 'error' }));
          }
        }

        // Step 2: Fetch props data with server-side filtering (now that sport service is active)
        setLoadingStage('fetching');

        // Get stat types for server-side filtering
        let statTypesForFiltering: string[] = [];
        if (selectedSport === 'MLB') {
          console.log(`[PropOllamaUnified] Looking for stat type config for: ${selectedStatType}`);
          const statTypeConfig = mlbStatTypes.find(st => st.key === selectedStatType);
          console.log(`[PropOllamaUnified] Found stat type config:`, statTypeConfig);

          if (statTypeConfig && statTypeConfig.statTypes.length > 0) {
            statTypesForFiltering = statTypeConfig.statTypes;
            console.log(
              `[PropOllamaUnified] Using server-side filtering for ${selectedStatType}:`,
              statTypesForFiltering
            );
          } else {
            console.warn(
              `[PropOllamaUnified] No stat type config found for ${selectedStatType}, will fetch all props`
            );
          }
        }

        // Fetch all props with pagination to ensure we get all games
        let allProps: FeaturedProp[] = [];
        let offset = 0;
        const batchSize = 500; // Max allowed by backend
        let hasMoreProps = true;

        console.log('[PropOllamaUnified] Fetching all props with pagination...');

        while (hasMoreProps && offset < 3000) {
          // Safety limit to avoid infinite loops
          const batchProps: FeaturedProp[] | string = await fetchFeaturedProps(
            selectedSport,
            propType,
            {
              statTypes: statTypesForFiltering,
              limit: batchSize,
              offset: offset,
            }
          );

          if (typeof batchProps === 'string') {
            console.warn(
              `[PropOllamaUnified] Received error string at offset ${offset}:`,
              batchProps
            );
            break;
          }

          if (!Array.isArray(batchProps) || batchProps.length === 0) {
            console.log(`[PropOllamaUnified] No more props at offset ${offset}`);
            hasMoreProps = false;
            break;
          }

          allProps.push(...batchProps);
          console.log(
            `[PropOllamaUnified] Fetched ${batchProps.length} props at offset ${offset}, total: ${allProps.length}`
          );

          if (batchProps.length < batchSize) {
            // Less than full batch means we've reached the end
            hasMoreProps = false;
          } else {
            offset += batchSize;
          }
        }

        let candidateProps = allProps;

        // Debug log with enhanced details
        console.log('[PropOllamaUnified] All props fetched via pagination:', {
          totalProps: candidateProps.length,
          selectedSport,
          propType,
          selectedStatType,
          statTypesForFiltering,
          firstProp: candidateProps.length > 0 ? candidateProps[0] : null,
          uniqueGames:
            candidateProps.length > 0 ? [...new Set(candidateProps.map(p => p.matchup))].length : 0,
        });

        // FALLBACK LOGIC: If propType is 'player' but we have very few props relative to upcoming games,
        // automatically try team props as well to ensure games have props available
        if (propType === 'player' && candidateProps.length > 0 && upcomingGames.length > 0) {
          // Simple team normalization function for early access
          const normalizeTeamNameLocal = (teamName: string): string => {
            return teamName
              .toLowerCase()
              .replace(/\s+/g, '') // Remove spaces
              .replace(/[^a-z]/g, '') // Remove non-letters
              .substring(0, 10); // Take first 10 chars for matching
          };

          // Helper function to extract teams from event name
          const extractTeamsFromEventLocal = (eventName: string): string[] => {
            // Handle both "Team A @ Team B" and "Team A vs Team B" formats
            const teams = eventName.split(/@|vs/).map(t => normalizeTeamNameLocal(t.trim()));
            return teams.filter(team => team.length > 0);
          };

          // Count how many upcoming games have props
          const gamesWithProps = new Set<string>();
          candidateProps.forEach(prop => {
            upcomingGames.forEach(game => {
              const gameTeams = extractTeamsFromEventLocal(game.event_name);
              const propTeams = extractTeamsFromEventLocal(prop.matchup);
              if (gameTeams.some((team: string) => propTeams.includes(team))) {
                gamesWithProps.add(game.event_name);
              }
            });
          });

          const percentageWithProps = gamesWithProps.size / upcomingGames.length;
          console.log(
            `[PropOllamaUnified] Fallback check: ${gamesWithProps.size}/${
              upcomingGames.length
            } games (${Math.round(percentageWithProps * 100)}%) have player props`
          );

          // If less than 80% of games have player props, also fetch team props
          if (percentageWithProps < 0.8) {
            console.log(
              '[PropOllamaUnified] Low player prop coverage, fetching team props as fallback...'
            );
            setLoadingMessage('Fetching additional team props...');

            try {
              let teamProps: FeaturedProp[] = [];
              let teamOffset = 0;
              let hasMoreTeamProps = true;

              // Fetch team props with same pagination logic
              while (hasMoreTeamProps && teamOffset < 3000) {
                const batchTeamProps: FeaturedProp[] | string = await fetchFeaturedProps(
                  selectedSport,
                  'team', // Force team props
                  {
                    statTypes: statTypesForFiltering,
                    limit: batchSize,
                    offset: teamOffset,
                  }
                );

                if (
                  typeof batchTeamProps === 'string' ||
                  !Array.isArray(batchTeamProps) ||
                  batchTeamProps.length === 0
                ) {
                  hasMoreTeamProps = false;
                  break;
                }

                teamProps.push(...batchTeamProps);
                console.log(
                  `[PropOllamaUnified] Fetched ${batchTeamProps.length} team props at offset ${teamOffset}, total: ${teamProps.length}`
                );

                if (batchTeamProps.length < batchSize) {
                  hasMoreTeamProps = false;
                } else {
                  teamOffset += batchSize;
                }
              }

              if (teamProps.length > 0) {
                console.log(
                  `[PropOllamaUnified] Adding ${teamProps.length} team props to ${candidateProps.length} player props`
                );
                candidateProps = [...candidateProps, ...teamProps];
              }
            } catch (teamPropsError) {
              console.warn(
                '[PropOllamaUnified] Failed to fetch team props fallback:',
                teamPropsError
              );
            }
          }
        }

        console.log(
          `[PropOllamaUnified] Final candidate props after fallback: ${candidateProps.length} props`
        );
        const statTypesInProps = [...new Set(candidateProps.map(p => p.stat))];
        console.log(`[PropOllamaUnified] Stat types in received props:`, statTypesInProps);

        if (cancelled) return;

        // Since we now use pagination, candidateProps is always an array
        if (!candidateProps || candidateProps.length === 0) {
          setError('Error: No props available. The backend returned no data.');
          setProjections([]);
          setIsLoading(false);
          console.error('[DIAGNOSTIC] Backend returned no props after pagination');
          return;
        }
        // Use backend batch endpoint for predictions with fallback
        let enriched_props: FeaturedProp[] = [];
        if (candidateProps.length > 0) {
          try {
            // Show progress bar as batch loads
            setLoadingStage('processing');
            console.log(
              '[PropOllamaUnified] Calling fetchBatchPredictions with',
              candidateProps.length,
              'props'
            );
            const batchResults = await fetchBatchPredictions(candidateProps);
            console.log('[PropOllamaUnified] Batch results received:', batchResults);
            if (cancelled) return;

            // batchResults now returns enhanced FeaturedProp objects, not raw backend responses
            enriched_props = batchResults;

            // Check if we have valid enhanced props
            if (enriched_props.length === 0) {
              console.warn('[PropOllamaUnified] No enhanced props returned, using original props');
              enriched_props = candidateProps;
            } else {
              console.log('[PropOllamaUnified] Using', enriched_props.length, 'enhanced props');
              console.log('[PropOllamaUnified] Sample enhanced prop:', enriched_props[0]);
            }
            setPropLoadingProgress(1);
          } catch (batchError) {
            console.warn(
              '[PropOllamaUnified] Batch predictions failed, using original props:',
              batchError
            );
            enriched_props = candidateProps;
            setPropLoadingProgress(1);
          }
        } else {
          setError('Error: No props found for today. Please check back later or try refreshing.');
        }
        setUnifiedResponse(null);

        // Filter props to only include players from teams with upcoming games
        const filteredProps = filterPropsForUpcomingGames(enriched_props, upcomingGames);
        console.log(
          `[PropOllamaUnified] ${new Date().toISOString()} Filtered props from ${
            enriched_props.length
          } to ${filteredProps.length} (upcoming games only)`
        );

        setProjections(filteredProps);

        // If no props after filtering, show informative message
        if (filteredProps.length === 0 && enriched_props.length > 0) {
          setError(
            `Found ${enriched_props.length} props, but none are for teams with upcoming games today. Please check back when games are scheduled.`
          );
        }

        // If we successfully fetched props, reset activation status to 'ready'
        if (selectedSport === 'MLB' && filteredProps.length > 0) {
          setSportActivationStatus(prev => ({ ...prev, [selectedSport]: 'ready' }));
        }
      } catch (err: any) {
        // Log the error object for debugging
        // eslint-disable-next-line no-console
        console.error(
          '[PropOllamaUnified] Unified backend fetch error:',
          err,
          err?.response || err?.message || err
        );
        // Retry up to 2 times on network/5xx errors
        if (
          !cancelled &&
          retryCount < 2 &&
          (err?.response?.status >= 500 ||
            err?.code === 'ECONNREFUSED' ||
            err?.message?.includes('Network'))
        ) {
          setTimeout(() => activateSportAndFetchData(retryCount + 1), 1000 * (retryCount + 1));
          return;
        }
        let errorMsg = 'Failed to fetch odds and AI insights.';
        if (err?.response) {
          errorMsg += ` (Status: ${err.response.status})`;
          if (err.response.data && typeof err.response.data === 'object') {
            errorMsg += `: ${JSON.stringify(err.response.data)}`;
          } else if (typeof err.response.data === 'string') {
            errorMsg += `: ${err.response.data}`;
          }
        } else if (err?.message) {
          errorMsg += ` (${err.message})`;
        }
        errorMsg += ' Please ensure the backend server is running and reachable.';
        setError(errorMsg);
        setProjections([]);
      } finally {
        console.log(
          `[PropOllamaUnified] ${new Date().toISOString()} Data loading complete - setting initialLoadingComplete to true`
        );
        setIsLoading(false);
        setInitialLoadingComplete(true); // Mark initial loading as complete
        setPropLoadingProgress(0);
        setLoadingStage(null);
        setLoadingMessage('');
      }
    };
    activateSportAndFetchData();
    return () => {
      cancelled = true;
    };
  }, [selectedSport, propType, selectedStatType]);

  // Helper functions for sorting
  const parseGameTime = (gameTime: string): Date => {
    try {
      return new Date(gameTime);
    } catch {
      return new Date(0); // Default to epoch if parsing fails
    }
  };

  const getAvgOdds = (overOdds: number, underOdds: number): number => {
    return (overOdds + underOdds) / 2;
  };

  const extractTeamFromMatchup = (matchup: string): string => {
    // Extract first team from matchup string (format like "Team A vs Team B")
    return matchup.split(' vs ')[0] || matchup.split(' @ ')[0] || matchup;
  };

  // Sort handler
  const handleSortByChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSortBy(
      e.target.value as
        | 'confidence'
        | 'value'
        | 'player'
        | 'upcoming-games'
        | 'odds-low-high'
        | 'odds-high-low'
        | 'team'
    );
    setVisiblePropsCount(6); // Reset to show only 6 when sort changes
  };

  // Sort projections based on selected sort criteria
  const sortedProjections = React.useMemo(() => {
    // Debug logging for E2E tests
    console.log(
      `[PropOllamaUnified] ${new Date().toISOString()} sortedProjections useMemo - projections array:`,
      projections
    );
    console.log('[PropOllamaUnified] sortedProjections input:', {
      projections: projections.length,
      selectedSport,
      selectedStatType,
      searchTerm,
      selectedDate,
      sampleProp: projections[0],
    });

    // ACTIVE MLB FILTERING: Filter by selected stat type for MLB
    console.log(
      `[PropOllamaUnified] About to apply MLB filtering from projections:`,
      projections.length,
      'items'
    );

    let filtered = [...projections];

    // Apply search term filter
    if (searchTerm && searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(
        proj =>
          proj.player?.toLowerCase().includes(searchLower) ||
          proj.matchup?.toLowerCase().includes(searchLower) ||
          proj.stat?.toLowerCase().includes(searchLower)
      );
      console.log(
        `[PropOllamaUnified] After search filter (${searchTerm}):`,
        filtered.length,
        'items'
      );
    }

    // Apply MLB stat type filtering (reduced since server-side filtering is now active)
    if (selectedSport === 'MLB') {
      const statTypeConfig = mlbStatTypes.find(st => st.key === selectedStatType);
      if (statTypeConfig && statTypeConfig.statTypes.length > 0) {
        // Server-side filtering should handle most cases, but keep client-side as fallback
        const serverFilteredCount = filtered.length;

        // Debug: Log what stat values we're actually seeing
        const uniqueStatValues = [...new Set(filtered.map(proj => proj.stat))];
        console.log(`[PropOllamaUnified] Available stat values in props:`, uniqueStatValues);
        console.log(`[PropOllamaUnified] Looking for stat types:`, statTypeConfig.statTypes);

        // Apply very lenient client-side filtering only for Popular to show some variety
        if (selectedStatType === 'Popular') {
          // For Popular, only do very loose filtering to ensure we show props
          filtered = filtered.filter(proj => {
            // Accept props that match any of the popular stat types or have confidence > 60
            const matchesStatType = statTypeConfig.statTypes.some(
              statType =>
                proj.stat?.toLowerCase().includes(statType.toLowerCase()) ||
                proj.stat
                  ?.toLowerCase()
                  .replace('_', ' ')
                  .includes(statType.toLowerCase().replace('_', ' ')) ||
                proj.stat?.toLowerCase().includes(statType.toLowerCase().replace('_', ''))
            );
            const highConfidence = proj.confidence > 60;
            return matchesStatType || highConfidence;
          });
          console.log(
            `[PropOllamaUnified] Client-side filter (${selectedStatType}): ${serverFilteredCount} -> ${filtered.length} props`
          );
        } else {
          console.log(
            `[PropOllamaUnified] Skipping client-side filter for ${selectedStatType}, relying on server-side filtering`
          );
        }
      }
    }

    // Apply game-specific filtering
    if (selectedGame) {
      const originalFilteredCount = filtered.length;

      // Helper function to normalize team names for matching
      const normalizeTeamName = (teamName: string): string => {
        const name = teamName.toLowerCase().trim();
        // Comprehensive MLB team mapping with all abbreviations and variations
        const teamMappings: Record<string, string[]> = {
          // American League East
          'blue jays': ['tor', 'toronto', 'jays', 'toronto blue jays'],
          orioles: ['bal', 'baltimore', 'baltimore orioles'],
          'red sox': ['bos', 'boston', 'sox', 'boston red sox'],
          rays: ['tb', 'tampa bay', 'tampa bay rays', 'tampa'],
          yankees: ['nyy', 'new york yankees', 'ny yankees', 'yankees'],

          // American League Central
          'white sox': ['cws', 'chicago', 'chicago white sox', 'chw'],
          guardians: ['cle', 'cleveland', 'cleveland guardians'],
          tigers: ['det', 'detroit', 'detroit tigers'],
          royals: ['kc', 'kansas city', 'kansas city royals'],
          twins: ['min', 'minnesota', 'minnesota twins'],

          // American League West
          astros: ['hou', 'houston', 'houston astros'],
          angels: ['laa', 'los angeles angels', 'anaheim', 'la angels'],
          athletics: ['oak', 'oakland', 'oakland athletics', 'as'],
          mariners: ['sea', 'seattle', 'seattle mariners'],
          rangers: ['tex', 'texas', 'texas rangers'],

          // National League East
          braves: ['atl', 'atlanta', 'atlanta braves'],
          marlins: ['mia', 'miami', 'miami marlins', 'florida'],
          mets: ['nym', 'new york mets', 'ny mets'],
          phillies: ['phi', 'philadelphia', 'philadelphia phillies'],
          nationals: ['wsh', 'washington', 'washington nationals'],

          // National League Central
          cubs: ['chc', 'chicago cubs', 'chicago', 'chi cubs'],
          reds: ['cin', 'cincinnati', 'cincinnati reds'],
          brewers: ['mil', 'milwaukee', 'milwaukee brewers'],
          pirates: ['pit', 'pittsburgh', 'pittsburgh pirates'],
          cardinals: ['stl', 'st louis', 'st. louis', 'st louis cardinals'],

          // National League West
          diamondbacks: ['ari', 'arizona', 'arizona diamondbacks', 'dbacks'],
          rockies: ['col', 'colorado', 'colorado rockies'],
          dodgers: ['lad', 'los angeles dodgers', 'la dodgers'],
          padres: ['sd', 'san diego', 'san diego padres'],
          giants: ['sf', 'san francisco', 'san francisco giants'],
        };

        // Find canonical team name by checking all variants
        for (const [canonical, variants] of Object.entries(teamMappings)) {
          if (variants.includes(name) || name.includes(canonical)) {
            return canonical;
          }
        }
        return name;
      };

      // Helper function to extract teams from event name
      const extractTeamsFromEvent = (eventName: string) => {
        const normalized = eventName.toLowerCase();
        let away = '',
          home = '';

        if (normalized.includes(' @ ')) {
          [away, home] = normalized.split(' @ ').map(t => t.trim());
        } else if (normalized.includes(' vs ')) {
          [away, home] = normalized.split(' vs ').map(t => t.trim());
        }

        return {
          away: normalizeTeamName(away),
          home: normalizeTeamName(home),
        };
      };

      // Extract normalized team names from selected game
      const selectedTeams = extractTeamsFromEvent(selectedGame.event_name);
      const selectedAwayNorm = normalizeTeamName(selectedGame.away);
      const selectedHomeNorm = normalizeTeamName(selectedGame.home);

      console.log(`[PropOllamaUnified] Filtering for game: ${selectedGame.event_name}`);
      console.log(
        `[PropOllamaUnified] Selected teams (normalized): away=${selectedAwayNorm}, home=${selectedHomeNorm}`
      );
      console.log(
        `[PropOllamaUnified] Original teams: away=${selectedGame.away}, home=${selectedGame.home}`
      );

      filtered = filtered.filter(proj => {
        // Try exact event_name match first
        const propEventName = proj._originalData?.event_name;
        if (propEventName && propEventName === selectedGame.event_name) {
          console.log(
            `[PropOllamaUnified] ✅ Exact event match: ${proj.player} - ${propEventName}`
          );
          return true;
        }

        // Try normalized matchup comparison
        if (proj.matchup) {
          const propTeams = extractTeamsFromEvent(proj.matchup);
          const propEventTeams = extractTeamsFromEvent(propEventName || '');

          // Check if teams match in either direction (home/away can be swapped)
          const teamsMatch =
            (propTeams.away === selectedAwayNorm && propTeams.home === selectedHomeNorm) ||
            (propTeams.away === selectedHomeNorm && propTeams.home === selectedAwayNorm) ||
            (propEventTeams.away === selectedAwayNorm &&
              propEventTeams.home === selectedHomeNorm) ||
            (propEventTeams.away === selectedHomeNorm && propEventTeams.home === selectedAwayNorm);

          if (teamsMatch) {
            console.log(
              `[PropOllamaUnified] ✅ Matchup teams match: ${proj.player} - ${proj.matchup}`
            );
            return true;
          }
        }

        // Fallback: try team_name matching from original data
        const propTeamName = proj._originalData?.team_name;
        if (propTeamName) {
          const propTeamNorm = normalizeTeamName(propTeamName);
          console.log(
            `[PropOllamaUnified] Team check: ${proj.player} - prop team: "${propTeamName}" -> "${propTeamNorm}", selected: "${selectedAwayNorm}", "${selectedHomeNorm}"`
          );
          if (propTeamNorm === selectedAwayNorm || propTeamNorm === selectedHomeNorm) {
            console.log(
              `[PropOllamaUnified] ✅ Team match: ${proj.player} - ${propTeamName} -> ${propTeamNorm}`
            );
            return true;
          }
        }

        // Debug log for unmatched props
        console.log(`[PropOllamaUnified] ❌ No match: ${proj.player}`, {
          propEventName,
          matchup: proj.matchup,
          teamName: propTeamName,
          selectedEvent: selectedGame.event_name,
        });

        return false;
      });

      console.log(
        `[PropOllamaUnified] After game filter (${selectedGame.away} @ ${selectedGame.home}):`,
        `${filtered.length} items (from ${originalFilteredCount})`
      );

      // If no props found for selected game, log this for debugging
      if (filtered.length === 0) {
        console.warn(
          `[PropOllamaUnified] No props found for selected game: ${selectedGame.event_name}`
        );
        // Get the original unfiltered data for debugging
        console.warn(
          `[PropOllamaUnified] Available props sample (${projections.length} total):`,
          projections.slice(0, 3).map((p: any) => ({
            matchup: p.matchup,
            team: p._originalData?.team_name,
            event_name: p._originalData?.event_name,
          }))
        );
      }
    }

    console.log(`[PropOllamaUnified] Created filtered array:`, filtered.length, 'items');

    // Debug: Show final stat types in filtered results
    if (filtered.length > 0) {
      const finalStatTypes = [...new Set(filtered.map(p => p.stat))];
      console.log(`[PropOllamaUnified] Final stat types in filtered results:`, finalStatTypes);
      console.log(
        `[PropOllamaUnified] Expected stat types for ${selectedStatType}:`,
        mlbStatTypes.find(st => st.key === selectedStatType)?.statTypes || 'none'
      );
    }

    console.log('[PropOllamaUnified] ACTIVE FILTERING - Before sorting:', {
      filtered: filtered.length,
      sortBy,
      sampleFiltered: filtered[0],
    });

    const sorted = filtered.sort((a, b) => {
      if (sortBy === 'confidence') return b.confidence - a.confidence;
      if (sortBy === 'value') return (b as any).expected_value - (a as any).expected_value;
      if (sortBy === 'player') return (a.player || '').localeCompare(b.player || '');
      if (sortBy === 'team')
        return extractTeamFromMatchup(a.matchup || '').localeCompare(
          extractTeamFromMatchup(b.matchup || '')
        );
      if (sortBy === 'upcoming-games') {
        const aTime = parseGameTime(a.gameTime);
        const bTime = parseGameTime(b.gameTime);
        return aTime.getTime() - bTime.getTime(); // Soonest games first
      }
      if (sortBy === 'odds-low-high') {
        const aAvgOdds = getAvgOdds(a.overOdds || 0, a.underOdds || 0);
        const bAvgOdds = getAvgOdds(b.overOdds || 0, b.underOdds || 0);
        return aAvgOdds - bAvgOdds; // Low to high
      }
      if (sortBy === 'odds-high-low') {
        const aAvgOdds = getAvgOdds(a.overOdds || 0, a.underOdds || 0);
        const bAvgOdds = getAvgOdds(b.overOdds || 0, b.underOdds || 0);
        return bAvgOdds - aAvgOdds; // High to low
      }
      return 0; // Default case
    });

    console.log(`[PropOllamaUnified] After sorting: ${sorted.length} items`);

    // Debug logging for E2E tests
    console.log('[PropOllamaUnified] sortedProjections output:', {
      filtered: sorted.length,
      sampleFiltered: sorted[0],
    });

    return sorted;
  }, [
    projections,
    sortBy,
    selectedSport,
    searchTerm,
    selectedStatType,
    selectedDate,
    selectedGame,
    mlbStatTypes,
  ]);

  // Reset visible count when projections or sort changes
  React.useEffect(() => {
    setVisiblePropsCount(6);
  }, [projections, sortBy]);

  // Consolidate props by player to avoid duplicate cards
  const consolidatedProjections = React.useMemo(() => {
    console.log('[PropOllamaUnified] consolidatedProjections input:', {
      sortedProjections: sortedProjections.length,
      sample: sortedProjections[0],
    });

    const playerMap = new Map<
      string,
      FeaturedProp & {
        alternativeProps?: Array<{
          stat: string;
          line: number;
          confidence: number;
          overOdds?: number;
          underOdds?: number;
        }>;
      }
    >();

    sortedProjections.forEach(proj => {
      const playerKey = `${proj.player}-${proj.matchup}`;
      console.log('[PropOllamaUnified] Processing proj:', {
        player: proj.player,
        matchup: proj.matchup,
        playerKey,
      });

      if (playerMap.has(playerKey)) {
        // Add this prop as an alternative stat for the existing player card
        const existingProj = playerMap.get(playerKey)!;
        if (!existingProj.alternativeProps) {
          existingProj.alternativeProps = [];
        }
        existingProj.alternativeProps.push({
          stat: proj.stat || 'Unknown',
          line: proj.line || 0,
          confidence: proj.confidence || 0,
          overOdds: proj.overOdds,
          underOdds: proj.underOdds,
        });
        console.log('[PropOllamaUnified] Added as alternative prop to existing:', playerKey);
      } else {
        // First prop for this player - create the main card
        playerMap.set(playerKey, {
          ...proj,
          alternativeProps: [],
        });
        console.log('[PropOllamaUnified] Created new main card for:', playerKey);
      }
    });

    const consolidated = Array.from(playerMap.values()).sort((a, b) => {
      // Sort by highest confidence across all props for this player
      const aMaxConfidence = Math.max(
        a.confidence,
        ...(a.alternativeProps?.map(p => p.confidence) || [])
      );
      const bMaxConfidence = Math.max(
        b.confidence,
        ...(b.alternativeProps?.map(p => p.confidence) || [])
      );
      return bMaxConfidence - aMaxConfidence;
    });

    console.log('[PropOllamaUnified] consolidatedProjections output:', {
      consolidated: consolidated.length,
      sample: consolidated[0],
    });
    return consolidated;
  }, [sortedProjections]);

  // Auto-enable virtualization for large datasets
  React.useEffect(() => {
    const shouldUseVirtualization = consolidatedProjections.length > VIRTUALIZATION_THRESHOLD;
    if (shouldUseVirtualization !== useVirtualization) {
      setUseVirtualization(shouldUseVirtualization);
      console.log(
        `[PropOllamaUnified] Auto-${
          shouldUseVirtualization ? 'enabled' : 'disabled'
        } virtualization for ${consolidatedProjections.length} props`
      );
    }
  }, [consolidatedProjections.length, useVirtualization, VIRTUALIZATION_THRESHOLD]);

  // Show only the specified number of consolidated props
  const visibleProjections = consolidatedProjections.slice(0, visiblePropsCount);
  console.log('[PropOllamaUnified] visibleProjections:', {
    visibleProjections: visibleProjections.length,
    visiblePropsCount,
    sample: visibleProjections[0],
  });

  // isSelected handler
  const isSelected = (projectionId: string) => selectedProps.some(p => p.id === projectionId);

  // addProp handler (accepts EnhancedPrediction)
  const addProp = (proj: FeaturedProp, choice: 'over' | 'under') => {
    if (selectedProps.length < 6 && !isSelected(proj.id)) {
      setSelectedProps([
        ...selectedProps,
        {
          id: proj.id,
          player: proj.player,
          statType: proj.stat,
          line: proj.line,
          choice,
          odds: 1, // Placeholder, update if odds are available in EnhancedPrediction
        },
      ]);
    }
  };

  // removeProp handler
  const removeProp = (propId: string) =>
    setSelectedProps(selectedProps.filter(p => p.id !== propId));

  // calculatePayout handler
  const calculatePayout = () => {
    const odds = selectedProps.reduce((acc, p) => acc * (p.odds || 1), 1);
    return (entryAmount * odds).toFixed(2);
  };

  // Per-prop analyze handler (not used in card view, but kept for future expansion)
  // ...existing code...

  // refreshProjections handler (now robust: clears error, triggers fetch)
  const refreshProjections = async () => {
    setError(null);
    setIsLoading(true);
    setPropLoadingProgress(0);
    setLoadingStage('fetching');
    setLoadingMessage('');
    // Just trigger the effect by toggling selectedSport (force re-fetch)
    setSelectedSport(prev => prev);
  };

  // Ensemble LLM analysis handler
  const handleRunLLM = async () => {
    setEnsembleLoading(true);
    setEnsembleError(null);
    setEnsembleResult(null);
    try {
      // Generate real session identifiers instead of dummy data
      const generateSessionId = () => {
        return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      };

      const generateUserId = () => {
        // Try to get user ID from localStorage or generate anonymous ID
        const storedUserId = localStorage.getItem('a1betting_user_id');
        if (storedUserId) {
          return storedUserId;
        }
        const anonymousId = `anon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        localStorage.setItem('a1betting_user_id', anonymousId);
        return anonymousId;
      };

      const response = await fetch('/api/propollama/final_analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: generateUserId(),
          sessionId: generateSessionId(),
          selectedProps,
          entryAmount,
        }),
      });
      if (!response.ok) {
        throw new Error(`Backend error: ${response.status}`);
      }
      const data = await response.json();
      setEnsembleResult(data.content || 'No analysis available.');
      if (data.error) setEnsembleError(data.error);
    } catch (err: any) {
      setEnsembleError(err.message || 'Failed to get LLM analysis.');
    } finally {
      setEnsembleLoading(false);
    }
  };

  return (
    <EnhancedErrorBoundary>
      <div className='max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 py-6'>
        {/* Performance and Connection Monitoring */}
        {process.env.NODE_ENV === 'development' && (
          <RealTimePerformanceMonitor
            config={{
              updateInterval: 5000,
              enableRealTimeMonitoring: true,
              enableAlerts: true,
              alertThresholds: {
                apiResponseTime: 2000,
                errorRate: 0.05,
                memoryUsage: 100 * 1024 * 1024, // 100MB
                connectionLatency: 1000,
              },
            }}
            onAlert={alert => {
              console.warn('[Performance Alert]', alert);
            }}
            visible={true}
            connectionHealth={connectionHealth}
          />
        )}

        {/* Sport Tabs with activation status */}
        <div className='mb-6'>
          <div role='tablist' aria-label='Sport Tabs' className='flex gap-2'>
            {sports.map(sport => {
              const activationStatus = sportActivationStatus[sport];
              const isActivating = activationStatus === 'loading';
              const hasError = activationStatus === 'error';

              return (
                <button
                  key={sport}
                  role='tab'
                  aria-selected={selectedSport === sport}
                  tabIndex={selectedSport === sport ? 0 : -1}
                  className={`px-4 py-2 rounded-lg font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-yellow-400 relative ${
                    selectedSport === sport
                      ? 'bg-yellow-500 text-black shadow-lg'
                      : 'bg-slate-800 text-white hover:bg-yellow-600 hover:text-black'
                  } ${isActivating ? 'opacity-75' : ''} ${hasError ? 'border border-red-500' : ''}`}
                  onClick={() => setSelectedSport(sport)}
                  aria-label={sport}
                  disabled={isActivating}
                >
                  {sport}
                  {isActivating && (
                    <div className='absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full animate-pulse'></div>
                  )}
                  {hasError && (
                    <div className='absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full'></div>
                  )}
                </button>
              );
            })}
          </div>
          {/* Show activation status message - replaced by unified loading overlay */}
          {selectedSport !== 'All' &&
            sportActivationStatus[selectedSport] === 'error' &&
            !isLoading && (
              <div className='mt-2 text-sm text-red-400'>
                ⚠️ Failed to load {selectedSport} service. Using cached data if available.
              </div>
            )}
        </div>

        {/* Modern Unified Filter Bar - Only show for MLB */}
        {selectedSport === 'MLB' && (
          <div className='mb-6 bg-slate-800/50 backdrop-blur-sm border border-slate-600 rounded-xl p-4'>
            {/* Primary Filter Row */}
            <div className='flex flex-wrap items-center gap-4 mb-4'>
              {/* Stat Type Filter */}
              <div className='flex items-center gap-2'>
                <label
                  htmlFor='stat-type-select'
                  className='text-sm font-medium text-gray-300 whitespace-nowrap'
                >
                  Stat Type:
                </label>
                <select
                  id='stat-type-select'
                  value={selectedStatType}
                  onChange={e => {
                    console.log(
                      `[PropOllamaUnified] Stat type changing from ${selectedStatType} to ${e.target.value}`
                    );
                    setSelectedStatType(e.target.value);
                  }}
                  className='px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent min-w-[160px]'
                >
                  {mlbStatTypes.map(statType => (
                    <option key={statType.key} value={statType.key}>
                      {statType.icon && `${statType.icon} `}
                      {statType.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Prop Type Toggle */}
              <div className='flex items-center gap-2'>
                <label className='text-sm font-medium text-gray-300 whitespace-nowrap'>
                  Prop Type:
                </label>
                <div className='flex bg-slate-800 border border-slate-600 rounded-lg p-1'>
                  <button
                    onClick={() => setPropType('player')}
                    className={`px-3 py-1 text-sm rounded-md transition-colors ${
                      propType === 'player'
                        ? 'bg-yellow-400 text-slate-900 font-medium'
                        : 'text-white hover:bg-slate-700'
                    }`}
                  >
                    Player
                  </button>
                  <button
                    onClick={() => setPropType('team')}
                    className={`px-3 py-1 text-sm rounded-md transition-colors ${
                      propType === 'team'
                        ? 'bg-yellow-400 text-slate-900 font-medium'
                        : 'text-white hover:bg-slate-700'
                    }`}
                  >
                    Team
                  </button>
                </div>
              </div>

              {/* Sort Dropdown */}
              <div className='flex items-center gap-2'>
                <label
                  htmlFor='sort-select'
                  className='text-sm font-medium text-gray-300 whitespace-nowrap'
                >
                  Sort by:
                </label>
                <select
                  id='sort-select'
                  value={sortBy}
                  onChange={handleSortByChange}
                  className='px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent min-w-[180px]'
                >
                  <option value='confidence'>Confidence (High to Low)</option>
                  <option value='value'>Expected Value (High to Low)</option>
                  <option value='upcoming-games'>Upcoming Games (Soonest First)</option>
                  <option value='odds-low-high'>Odds (Low to High)</option>
                  <option value='odds-high-low'>Odds (High to Low)</option>
                  <option value='player'>Player (A-Z)</option>
                  <option value='team'>Team (A-Z)</option>
                </select>
              </div>

              {/* Date Filter */}
              <div className='flex items-center gap-2'>
                <label className='text-sm font-medium text-gray-300 whitespace-nowrap'>Date:</label>
                <input
                  type='date'
                  value={selectedDate}
                  onChange={e => setSelectedDate(e.target.value)}
                  className='px-3 py-2 bg-slate-800 border border-slate-600 text-white text-sm rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400'
                />
              </div>

              {/* Quick Actions */}
              <div className='flex items-center gap-2 ml-auto'>
                <button
                  className='bg-slate-700 hover:bg-slate-600 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors'
                  onClick={() => {
                    setSelectedDate('');
                    setSelectedStatType('Popular');
                  }}
                >
                  Reset
                </button>
                <button
                  className='bg-yellow-500 hover:bg-yellow-400 text-slate-900 px-3 py-2 rounded-lg text-sm font-medium transition-colors'
                  onClick={() => {
                    // Apply filters logic can go here
                  }}
                >
                  Apply
                </button>
              </div>
            </div>

            {/* Upcoming Games Row - Collapsible */}
            <div className='border-t border-slate-600 pt-4'>
              <div className='flex items-center justify-between mb-3'>
                <h3 className='text-sm font-medium text-white flex items-center gap-2'>
                  <span>📅</span>
                  Upcoming Games
                  {selectedGame && (
                    <span className='text-xs text-yellow-400 ml-2'>
                      (Filtered: {selectedGame.away} @ {selectedGame.home})
                    </span>
                  )}
                </h3>
                <div className='flex gap-2'>
                  {selectedGame && (
                    <button
                      onClick={() => setSelectedGame(null)}
                      className='px-2 py-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded transition-colors'
                    >
                      Clear Filter
                    </button>
                  )}
                  <button
                    className='text-yellow-400 hover:text-yellow-300 text-sm font-medium transition-colors'
                    onClick={() => setShowUpcomingGames(!showUpcomingGames)}
                  >
                    {showUpcomingGames ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>

              {showUpcomingGames && (
                <div className='grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2'>
                  {upcomingGames.length > 0
                    ? upcomingGames.map((game, idx) => (
                        <div
                          key={idx}
                          onClick={() => setSelectedGame(game)}
                          className={`bg-slate-800 rounded-lg p-2 border transition-colors cursor-pointer ${
                            selectedGame?.event_name === game.event_name
                              ? 'border-yellow-400 bg-slate-700'
                              : 'border-slate-700 hover:border-slate-600'
                          }`}
                        >
                          <div className='flex flex-col items-center text-center'>
                            <div className='text-white font-medium text-xs mb-1'>
                              <span className='text-red-400'>{game.away}</span>
                            </div>
                            <div className='text-white font-medium text-xs mb-1'>
                              <span className='text-blue-400'>{game.home}</span>
                            </div>
                            <div className='text-gray-400 text-xs'>{game.time}</div>
                          </div>
                        </div>
                      ))
                    : // Fallback games if no real data
                      [
                        {
                          home: 'BOS',
                          away: 'HOU',
                          time: '10:35 am',
                          event_name: 'Houston Astros @ Boston Red Sox',
                        },
                        {
                          home: 'MIL',
                          away: 'WSH',
                          time: '12:35 pm',
                          event_name: 'Washington Nationals @ Milwaukee Brewers',
                        },
                        {
                          home: 'CLE',
                          away: 'MIN',
                          time: '12:40 pm',
                          event_name: 'Minnesota Twins @ Cleveland Guardians',
                        },
                        {
                          home: 'MIA',
                          away: 'NYY',
                          time: '12:40 pm',
                          event_name: 'New York Yankees @ Miami Marlins',
                        },
                        {
                          home: 'COL',
                          away: 'PIT',
                          time: '2:10 pm',
                          event_name: 'Pittsburgh Pirates @ Colorado Rockies',
                        },
                        {
                          home: 'LAA',
                          away: 'CWS',
                          time: '3:07 pm',
                          event_name: 'Chicago White Sox @ Los Angeles Angels',
                        },
                        {
                          home: 'SD',
                          away: 'STL',
                          time: '3:10 pm',
                          event_name: 'St. Louis Cardinals @ San Diego Padres',
                        },
                      ].map((game, idx) => (
                        <div
                          key={`fallback-${idx}`}
                          onClick={() => setSelectedGame(game)}
                          className={`bg-slate-800 rounded-lg p-2 border transition-colors cursor-pointer ${
                            selectedGame?.event_name === game.event_name
                              ? 'border-yellow-400 bg-slate-700'
                              : 'border-slate-700 hover:border-slate-600'
                          }`}
                        >
                          <div className='flex flex-col items-center text-center'>
                            <div className='text-white font-medium text-xs mb-1'>
                              <span className='text-red-400'>{game.away}</span>
                            </div>
                            <div className='text-white font-medium text-xs mb-1'>
                              <span className='text-blue-400'>{game.home}</span>
                            </div>
                            <div className='text-gray-400 text-xs'>{game.time}</div>
                          </div>
                        </div>
                      ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Main Content Layout */}
        {/* Top-level fallback/analysis content for error or empty state */}
        {(error || visibleProjections.length === 0) && !isLoading && (
          <div className='flex flex-col items-center gap-2 mb-4'>
            {error && (
              <div className='text-center text-red-400 py-4' role='alert'>
                {typeof error === 'string' ? error : 'Error: Unable to load props.'}
              </div>
            )}
          </div>
        )}

        <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
          {/* Main prop cards - left 2/3 */}
          <div className='lg:col-span-2'>
            <div className='flex items-center justify-between mb-4'>
              <h1 className='text-2xl font-bold text-white'>{selectedSport} AI Props</h1>
            </div>

            {/* Main Content: Grid layout for condensed cards, single column for expanded */}
            {!useVirtualization || expandedRowKey ? (
              /* Standard Rendering */
              <div
                className={`
              ${expandedRowKey ? 'flex flex-col gap-6' : 'grid grid-cols-1 md:grid-cols-2 gap-4'}
            `}
              >
                {/* Loading state now handled by LoadingOverlay */}
                {!isLoading && (
                  <>
                    {visibleProjections.length > 0 ? (
                      <>
                        {console.log(
                          '[PropOllamaUnified] Rendering visibleProjections (Standard):',
                          {
                            length: visibleProjections.length,
                            isLoading,
                            expandedRowKey,
                            sample: visibleProjections[0],
                          }
                        )}
                        {visibleProjections.map((proj, idx) => {
                          console.log(`[PropOllamaUnified] Map rendering prop ${idx}:`, {
                            propId: proj.id,
                            expandedRowKey,
                            isExpanded: expandedRowKey === proj.id,
                            player: proj.player,
                          });
                          // Only show analysis/fallback for expanded card
                          const isExpanded = expandedRowKey === proj.id;
                          const handleExpand = () => {
                            console.log(
                              `[PropOllamaUnified] ${new Date().toISOString()} handleExpand called for ${
                                proj.id
                              }, current isExpanded: ${isExpanded}, initialLoadingComplete: ${initialLoadingComplete}, clicksEnabled: ${clicksEnabled}`
                            );

                            // Prevent clicks during initial loading and until clicks are explicitly enabled
                            if (!clicksEnabled) {
                              console.log(
                                `[PropOllamaUnified] Ignoring click - clicks not enabled yet for ${proj.id}`
                              );
                              return;
                            }

                            console.log(
                              `[PropOllamaUnified] ${new Date().toISOString()} Executing expand/collapse for ${
                                proj.id
                              } - setting expandedRowKey from ${expandedRowKey} to ${
                                isExpanded ? null : proj.id
                              }`
                            );
                            debugSetExpandedRowKey(isExpanded ? null : proj.id);
                          };
                          let analysisNode: React.ReactNode = '';
                          if (isExpanded) {
                            const analysisState = propAnalystResponses[proj.id];
                            if (analysisState && analysisState.loading) {
                              analysisNode = (
                                <div className='text-center text-yellow-300 py-4' role='status'>
                                  Fetching latest AI-powered projections...
                                </div>
                              );
                            } else if (analysisState && analysisState.error) {
                              analysisNode = (
                                <>
                                  <div className='text-gray-200 text-sm' data-testid='ai-take'>
                                    AI's Take
                                  </div>
                                  <div className='text-red-400 text-sm' role='alert'>
                                    Error: Unable to load analysis.
                                  </div>
                                  <div className='text-gray-200 text-sm' data-testid='no-analysis'>
                                    No analysis available.
                                  </div>
                                </>
                              );
                            } else if (
                              analysisState &&
                              (analysisState.isFallback ||
                                analysisState.isStale ||
                                (analysisState.content &&
                                  /No analysis available\./i.test(analysisState.content)))
                            ) {
                              analysisNode = (
                                <>
                                  <div className='text-gray-200 text-sm' data-testid='ai-take'>
                                    AI's Take
                                  </div>
                                  <div className='text-gray-200 text-sm' data-testid='no-analysis'>
                                    No analysis available.
                                  </div>
                                </>
                              );
                            } else if (analysisState && analysisState.content) {
                              analysisNode = (
                                <>
                                  <div className='text-gray-200 text-sm' data-testid='ai-take'>
                                    AI's Take
                                  </div>
                                  <div className='text-gray-200 text-sm'>
                                    {analysisState.content}
                                  </div>
                                </>
                              );
                            } else if (!proj.pickType) {
                              analysisNode = (
                                <>
                                  <div className='text-gray-200 text-sm' data-testid='ai-take'>
                                    AI's Take
                                  </div>
                                  <div className='text-gray-200 text-sm' data-testid='no-analysis'>
                                    No analysis available.
                                  </div>
                                </>
                              );
                            }
                          }
                          console.log(
                            `[PropOllamaUnified] analysisNode for ${proj.player}:`,
                            analysisNode
                          );
                          // Derive extra fields for CondensedPropCard
                          const grade =
                            proj.confidence >= 80 ? 'A+' : proj.confidence >= 60 ? 'B' : 'C';
                          // Example logo URL logic (replace with real mapping if available)
                          const logoUrl = proj.matchup
                            ? `/logos/${proj.matchup.split(' ')[0].toLowerCase()}.png`
                            : '';
                          // Accent color by team name in matchup
                          let accentColor = '#222';
                          if (proj.matchup && proj.matchup.toLowerCase().includes('chiefs'))
                            accentColor = '#b71c1c';
                          else if (proj.matchup && proj.matchup.toLowerCase().includes('rams'))
                            accentColor = '#0d47a1';
                          else if (proj.matchup && proj.matchup.toLowerCase().includes('eagles'))
                            accentColor = '#004d40';
                          // Bookmark logic (placeholder: bookmarked if confidence >= 90)
                          const bookmarked = proj.confidence >= 90;
                          // Debug log for espnPlayerId
                          console.log('espnPlayerId for', proj.player, ':', proj.espnPlayerId);
                          return (
                            <div
                              key={`${proj.id}-${proj.player}-${proj.stat}-${idx}`}
                              data-testid='prop-card-wrapper'
                            >
                              {!isExpanded ? (
                                <CondensedPropCard
                                  player={proj.player}
                                  team={proj.matchup || ''}
                                  stat={proj.stat || 'Unknown'}
                                  line={proj.line || 0}
                                  confidence={proj.confidence || 0}
                                  grade={grade}
                                  logoUrl={logoUrl}
                                  accentColor={accentColor}
                                  bookmarked={bookmarked}
                                  matchup={proj.matchup || ''}
                                  espnPlayerId={proj.espnPlayerId}
                                  onClick={handleExpand}
                                  isExpanded={isExpanded}
                                  alternativeProps={(proj as any).alternativeProps}
                                />
                              ) : (
                                <div ref={expandedCardRef} data-testid='prop-card'>
                                  {(() => {
                                    console.log(
                                      `[PropOllamaUnified] ${new Date().toISOString()} Rendering EnhancedPropCard for ${
                                        proj.player
                                      } with analysisNode:`,
                                      typeof analysisNode,
                                      analysisNode
                                    );
                                    return null;
                                  })()}
                                  <EnhancedPropCard
                                    proj={proj}
                                    analysisNode={isExpanded ? analysisNode : ''}
                                    onCollapse={() => debugSetExpandedRowKey(null)}
                                    fetchEnhancedAnalysis={fetchEnhancedAnalysis}
                                    enhancedAnalysisCache={enhancedAnalysisCache}
                                    loadingAnalysis={loadingAnalysis}
                                  />
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </>
                    ) : (
                      <div className='text-center py-8'>
                        <div className='text-gray-400 text-lg mb-2'>
                          Generating comprehensive props...
                        </div>
                        {selectedGame && selectedGame.game_id && (
                          <ComprehensivePropsLoader
                            gameId={selectedGame.game_id}
                            onPropsGenerated={setProjections}
                          />
                        )}
                        {!selectedGame && (
                          <div className='text-sm text-gray-500 mb-4'>
                            Select a game to generate comprehensive props for all players
                          </div>
                        )}
                      </div>
                    )}
                    {sortedProjections.length > visiblePropsCount && (
                      <div className='text-center py-4'>
                        <button
                          className='bg-yellow-500 hover:bg-yellow-600 text-black font-semibold px-4 py-2 rounded-lg transition-colors'
                          onClick={() => setVisiblePropsCount(prev => prev + 6)}
                        >
                          View More ({Math.min(6, sortedProjections.length - visiblePropsCount)}{' '}
                          more)
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            ) : (
              /* Virtualized Rendering for Large Datasets */
              !isLoading && (
                <VirtualizedPropList
                  projections={consolidatedProjections}
                  isSelected={isSelected}
                  addProp={addProp}
                  removeProp={removeProp}
                  expandedRowKey={expandedRowKey}
                  setExpandedRowKey={debugSetExpandedRowKey}
                  expandedCardRef={expandedCardRef}
                  propAnalystResponses={propAnalystResponses}
                  clicksEnabled={clicksEnabled}
                  enhancedAnalysisCache={enhancedAnalysisCache}
                  fetchEnhancedAnalysis={fetchEnhancedAnalysis}
                  loadingAnalysis={loadingAnalysis}
                />
              )
            )}

            {/* Show Past Matchup Tracker or Live Game Stats for all selected games */}
            {selectedGame && selectedGame.game_id && (
              <div className='mt-6 max-w-2xl mx-auto'>
                {selectedGame.status === 'In Progress' || selectedGame.status === 'Warmup' ? (
                  <LiveGameStats
                    gameId={selectedGame.game_id}
                    awayTeam={selectedGame.away}
                    homeTeam={selectedGame.home}
                  />
                ) : (
                  <PastMatchupTracker
                    gameId={selectedGame.game_id}
                    awayTeam={selectedGame.away}
                    homeTeam={selectedGame.home}
                  />
                )}
              </div>
            )}
          </div>

          {/* Unified Loading Overlay */}
          <LoadingOverlay
            isVisible={isLoading && loadingStage !== null}
            stage={loadingStage || 'fetching'}
            sport={selectedSport}
            message={loadingMessage}
          />

          {/* Bet Slip - right 1/3 */}
          <div className='bg-slate-800/50 border border-slate-700/50 rounded-xl p-6 flex flex-col gap-4'>
            <h2 className='text-xl font-bold text-white mb-2'>Bet Slip</h2>
            {selectedProps.length === 0 ? (
              <div className='text-gray-400'>
                No props selected. Select up to 6 props to build your entry.
              </div>
            ) : (
              <div>
                <ul className='mb-2'>
                  {selectedProps.map((prop, idx) => (
                    <li key={prop.id} className='flex items-center justify-between gap-2 mb-1'>
                      <span className='text-white'>
                        {safeCell(prop.player)} {safeCell(prop.statType)} {safeCell(prop.line)}
                      </span>
                      <span className='text-yellow-400 font-semibold'>
                        {safeCell(prop.choice?.toUpperCase?.() ?? prop.choice)}
                      </span>
                      <span className='text-gray-300'>Odds: {safeCell(prop.odds)}</span>
                      <button
                        className='ml-2 px-2 py-1 rounded bg-gray-700 text-white hover:bg-gray-800'
                        onClick={() => removeProp(prop.id)}
                      >
                        Remove
                      </button>
                    </li>
                  ))}
                </ul>
                <div className='flex items-center gap-2 mb-2'>
                  <span className='text-white'>Entry Amount:</span>
                  <input
                    type='number'
                    min={1}
                    max={1000}
                    value={entryAmount}
                    onChange={e => setEntryAmount(Number(e.target.value))}
                    className='w-20 bg-slate-700/50 border border-slate-600 rounded-lg px-2 py-1 text-white'
                  />
                </div>
                <div className='text-white mb-2'>
                  Potential Payout:{' '}
                  <span className='text-yellow-400 font-bold'>${calculatePayout()}</span>
                </div>
                <button
                  className='w-full bg-yellow-500 hover:bg-yellow-600 text-black font-semibold py-2 rounded-lg transition-colors disabled:bg-gray-600 disabled:text-gray-400 mb-2'
                  disabled={selectedProps.length < 2 || ensembleLoading}
                  onClick={handleRunLLM}
                  aria-busy={ensembleLoading}
                >
                  {ensembleLoading ? 'Running LLM...' : 'Run LLM (Final Analysis)'}
                </button>
                {ensembleError && (
                  <div className='bg-red-700 text-white p-2 rounded mb-2' role='alert'>
                    {ensembleError}
                  </div>
                )}
                {ensembleResult && !ensembleError && (
                  <div className='bg-slate-950/80 border border-yellow-700 rounded-lg p-4 mt-2'>
                    <div className='font-bold text-yellow-300 mb-1'>LLM Final Analysis</div>
                    <div className='text-white whitespace-pre-line'>{ensembleResult}</div>
                  </div>
                )}
                <button
                  className='w-full bg-yellow-500 hover:bg-yellow-600 text-black font-semibold py-2 rounded-lg transition-colors disabled:bg-gray-600 disabled:text-gray-400'
                  disabled={selectedProps.length < 2}
                >
                  Place Entry
                </button>
                <div className='text-xs text-gray-400 mt-2'>
                  Select 2-6 props. Payout increases with more selections.
                </div>
              </div>
            )}
          </div>
          {/* Chat/Analyst section removed; now handled per-prop in expanded row */}
        </div>
        {/* Close main content grid */}
      </div>
    </EnhancedErrorBoundary>
  );
};

// Enhanced PropCard component with real data integration
const EnhancedPropCard: React.FC<{
  proj: FeaturedProp;
  analysisNode: React.ReactNode;
  onCollapse: () => void;
  fetchEnhancedAnalysis: (proj: FeaturedProp) => Promise<EnhancedPropAnalysis | null>;
  enhancedAnalysisCache: Map<string, EnhancedPropAnalysis>;
  loadingAnalysis: Set<string>;
}> = ({
  proj,
  analysisNode,
  onCollapse,
  fetchEnhancedAnalysis,
  enhancedAnalysisCache,
  loadingAnalysis,
}) => {
  const [enhancedData, setEnhancedData] = React.useState<EnhancedPropAnalysis | null>(null);
  const [isLoadingEnhanced, setIsLoadingEnhanced] = React.useState(false);
  const [hasRequestedAnalysis, setHasRequestedAnalysis] = React.useState(false);

  const cacheKey = `${proj.id}-${proj.player}-${proj.stat}`;

  // Check if analysis is already cached
  React.useEffect(() => {
    const cached = enhancedAnalysisCache.get(cacheKey);
    if (cached) {
      setEnhancedData(cached);
      setHasRequestedAnalysis(true);
    }
  }, [cacheKey, enhancedAnalysisCache]);

  // Handle analysis request when user clicks the toggle
  const handleRequestAnalysis = async () => {
    if (hasRequestedAnalysis || loadingAnalysis.has(cacheKey)) {
      return;
    }

    setIsLoadingEnhanced(true);
    setHasRequestedAnalysis(true);

    try {
      const analysis = await fetchEnhancedAnalysis(proj);
      if (analysis) {
        setEnhancedData(analysis);
      }
    } finally {
      setIsLoadingEnhanced(false);
    }
  };

  // Get real stats and insights, or fallback to mock data
  const getStatsAndInsights = () => {
    if (enhancedData) {
      return {
        stats: enhancedData.statistics,
        insights: enhancedData.insights.map(insight => ({
          icon: getInsightIcon(insight.type),
          text: insight.text,
        })),
        summary: generateBettingRecommendation(proj),
        deepAnalysis: enhancedData.deep_analysis,
      };
    }

    // Fallback to mock data if enhanced data not available
    return {
      stats: [
        { label: '7/7', value: 0 },
        { label: '7/8', value: 1 },
        { label: '7/9', value: 0 },
        { label: '7/11', value: 1 },
        { label: '7/12', value: 1 },
        { label: '7/13', value: 0 },
        { label: '7/18', value: 1 },
        { label: '7/20', value: 0 },
        { label: '7/21', value: 0 },
        { label: '7/23', value: 0 },
      ],
      insights: [
        {
          icon: '🔥',
          text: `${proj.player} has consistently gone UNDER 1.5 hits + RBIs in his last 10 games, hitting this mark only twice during this stretch.`,
        },
        {
          icon: '🔒',
          text: `The defense ranks #6 in the league, allowing a mere estimated batting average of .256, contributing to a tougher matchup for ${proj.player}.`,
        },
        {
          icon: '⚡',
          text: `With the opposing pitcher allowing an xwOBA of .359 but a solid xBA of .298 against ${proj.player}, this suggests he may struggle against today's opposing pitcher.`,
        },
      ],
      summary: generateBettingRecommendation(proj),
      deepAnalysis: '',
    };
  };

  // Helper function to generate actionable betting recommendations
  const generateBettingRecommendation = (proj: FeaturedProp): string => {
    try {
      // Extract basic information with fallbacks
      const player = proj.player || 'Unknown Player';
      const stat = proj.stat || 'Unknown Stat';
      const line = proj.line || 0;
      const confidence = proj.confidence || 0;

      // Determine OVER/UNDER recommendation based on confidence
      // Higher confidence (>65%) suggests the player will exceed the line (OVER)
      // Lower confidence suggests they won't exceed the line (UNDER)
      const recommendation = confidence > 65 ? 'OVER' : 'UNDER';

      // Extract opponent from matchup string
      const opponent = extractOpponentFromMatchup(proj.matchup);

      // Format stat name for better readability
      const formattedStat = formatStatName(stat, line);

      // Generate recommendation sentence matching PROP app format
      if (confidence < 50) {
        // Low confidence - provide cautious recommendation
        return `Monitoring ${player} (${formattedStat}) versus ${opponent} - proceed with caution`;
      } else if (confidence < 60) {
        // Medium-low confidence - suggest lean
        return `Lean ${recommendation} on ${player} (${formattedStat}) versus ${opponent}`;
      } else {
        // Good confidence - provide strong recommendation
        return `We suggest betting the ${recommendation} on ${player} (${formattedStat}) versus ${opponent}`;
      }
    } catch (error) {
      console.warn('Error generating betting recommendation:', error);
      return proj.stat ? `Prop type: ${proj.stat}` : 'No summary available.';
    }
  };

  // Helper function to extract opponent from matchup string
  const extractOpponentFromMatchup = (matchup: string): string => {
    if (!matchup || matchup === 'N/A') return 'TBD';

    try {
      // Handle various matchup formats:
      // "Team1 vs Team2", "Team1 @ Team2", "Player vs Team", etc.
      const vsMatch = matchup.match(/(?:vs|@|versus)\s+(.+?)(?:\s|$)/i);
      if (vsMatch) {
        return vsMatch[1].trim();
      }

      // Handle "Team1 - Team2" format
      const dashMatch = matchup.match(/\s-\s(.+?)(?:\s|$)/);
      if (dashMatch) {
        return dashMatch[1].trim();
      }

      // If no clear pattern, return the matchup as-is (truncated if too long)
      return matchup.length > 20 ? matchup.substring(0, 20) + '...' : matchup;
    } catch (error) {
      console.warn('Error extracting opponent from matchup:', error);
      return 'TBD';
    }
  };

  // Helper function to format stat names for better readability
  const formatStatName = (stat: string, line: number): string => {
    try {
      const lowerStat = stat.toLowerCase();

      // Format common stat types with proper line display
      if (lowerStat.includes('hit') && lowerStat.includes('rbi')) {
        return `${line} hits + RBI`;
      } else if (lowerStat.includes('hit')) {
        return `${line} hits`;
      } else if (lowerStat.includes('run') && lowerStat.includes('rbi')) {
        return `${line} runs + RBI`;
      } else if (lowerStat.includes('point')) {
        return `${line} points`;
      } else if (lowerStat.includes('rebound')) {
        return `${line} rebounds`;
      } else if (lowerStat.includes('assist')) {
        return `${line} assists`;
      } else if (lowerStat.includes('yard')) {
        return `${line} yards`;
      } else if (lowerStat.includes('reception')) {
        return `${line} receptions`;
      } else {
        // Generic fallback - just add the line number
        return `${line} ${stat.toLowerCase()}`;
      }
    } catch (error) {
      console.warn('Error formatting stat name:', error);
      return `${line} ${stat}`;
    }
  };

  const { stats, insights, summary, deepAnalysis } = getStatsAndInsights();

  // Keep the summary clean and concise - just show the betting recommendation
  // Don't append additional metadata about alternative props
  return (
    <PropCard
      player={proj.player}
      team={proj.matchup || ''}
      position={''}
      score={Math.round(proj.confidence || 0)}
      summary={summary}
      analysis={enhancedData?.deep_analysis || analysisNode}
      onCollapse={onCollapse}
      onRequestAnalysis={handleRequestAnalysis}
      isAnalysisLoading={isLoadingEnhanced || loadingAnalysis.has(cacheKey)}
      hasAnalysis={!!enhancedData?.deep_analysis || hasRequestedAnalysis}
      stats={stats}
      insights={insights}
    />
  );
};

// Helper function to get appropriate icon for insight type
const getInsightIcon = (type: string): string => {
  const iconMap: Record<string, string> = {
    feature_importance: '🎯',
    matchup_factor: '⚔️',
    historical_matchup: '📊',
    recent_trend: '📈',
    weather_impact: '🌤️',
    performance_trend: '🔥',
    matchup_advantage: '⚡',
  };
  return iconMap[type] || '💡';
};

export default PropOllamaUnified;
