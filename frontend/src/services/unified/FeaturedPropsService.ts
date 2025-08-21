/**
 * MLB Odds & AI Insights Mapping Logic (A1Betting7-13.2)
 * Enhanced with intelligent data management and real-time capabilities
 *
 * This file is responsible for fetching, mapping, and surfacing MLB odds and AI insights
 * in the frontend analytics table using the enhanced data manager.
 */

import { debugEnhancedDataManager } from '../DebugEnhancedDataManager';
import { enhancedDataManager } from '../EnhancedDataManager';
import { enhancedLogger } from '../../utils/enhancedLogger';

export interface FeaturedProp {
  id: string;
  player: string;
  matchup: string;
  stat: string;
  line: number;
  overOdds: number;
  underOdds: number;
  confidence: number;
  sport: string;
  gameTime: string;
  pickType: string;
  espnPlayerId?: string;
  // Preserve original raw data for backend processing
  _originalData?: Record<string, unknown>;
}

/**
 * Enhanced batch prediction using backend-side batching and intelligent caching
 */
export async function fetchBatchPredictions(props: FeaturedProp[]): Promise<FeaturedProp[]> {
  try {
    // Use original raw data for backend if available, otherwise convert props to backend format
    const propsForBackend = props.map(prop => {
      // If we have original data, use it (this preserves the exact format the backend expects)
      if (prop._originalData) {
        return prop._originalData;
      }

      // Fallback: convert FeaturedProp format to backend format
      return {
        id: prop.id,
        player: prop.player,
        stat: prop.stat,
        line: prop.line,
        overOdds: prop.overOdds,
        underOdds: prop.underOdds,
        confidence: prop.confidence,
        sport: prop.sport,
        gameTime: prop.gameTime,
        pickType: prop.pickType,
      };
    });

    // Create a single batch request for all props
    const batchRequest = {
      id: 'batch_predictions',
      endpoint: '/api/unified/batch-predictions',
      // The Unified fetchBatch expects params to be an object. Wrap array in an `items` field.
      params: { items: propsForBackend } as Record<string, unknown>,
      priority: 'high' as const,
    };

    // Process batch with intelligent caching
  // Call fetchBatch with the correctly shaped params object
  const results = await enhancedDataManager.fetchBatch([batchRequest]);

    // Extract predictions from batch results
    const batchResult = results['batch_predictions'];
  let backendPredictions: unknown[] = [];

    if (batchResult) {
      // Handle backend response format: { predictions: [...], errors: [...] }
      if (
        typeof batchResult === 'object' &&
        batchResult !== null &&
        'predictions' in batchResult &&
        Array.isArray((batchResult as Record<string, unknown>).predictions)
      ) {
        backendPredictions = (batchResult as Record<string, unknown>).predictions as unknown[];
      } else if (Array.isArray(batchResult)) {
        backendPredictions = batchResult;
      } else if (typeof batchResult === 'object') {
        backendPredictions = [batchResult];
      }
    }

    enhancedLogger.info('FeaturedPropsService', 'fetchBatchPredictions', `Backend predictions received`, {
      received: Array.isArray(backendPredictions) ? backendPredictions.length : 0,
      requested: props.length,
    });

    // Transform backend predictions back to FeaturedProp format with enhanced data
    const enhancedProps: FeaturedProp[] = props.map((originalProp, index) => {
      const backendPrediction = backendPredictions[index];

      const bp = backendPrediction as Record<string, any> | undefined;
      if (!bp || bp.error) {
        // If prediction failed, return original prop
        enhancedLogger.warn('FeaturedPropsService', 'fetchBatchPredictions', `No prediction for prop`, { index, propId: originalProp.id });
        return originalProp;
      }

      // Merge original prop structure with enhanced prediction data
      const enhancedProp: FeaturedProp = {
        ...originalProp,
        // Update confidence from backend prediction
  confidence: bp.confidence || originalProp.confidence,
  // Add enhanced data as custom properties (will be available for enhanced analysis)
  ...(bp.recommendation && { recommendation: bp.recommendation }),
  ...(bp.quantum_confidence && { quantumConfidence: bp.quantum_confidence }),
  ...(bp.neural_score && { neuralScore: bp.neural_score }),
  ...(bp.kelly_fraction && { kellyFraction: bp.kelly_fraction }),
  ...(bp.expected_value && { expectedValue: bp.expected_value }),
  ...(bp.shap_explanation && { shapExplanation: bp.shap_explanation }),
  ...(bp.risk_assessment && { riskAssessment: bp.risk_assessment }),
  ...(bp.optimal_stake && { optimalStake: bp.optimal_stake }),
      };

      return enhancedProp;
    });

  enhancedLogger.info('FeaturedPropsService', 'fetchBatchPredictions', `Enhanced props created`, { enhancedCount: enhancedProps.length });

    return enhancedProps;
  } catch (error) {
    enhancedLogger.error('FeaturedPropsService', 'fetchBatchPredictions', 'Batch predictions failed', undefined, error as Error);
    // Return original props if batch enhancement fails
    return props;
  }
}

/**
 * Enhanced props fetching with intelligent caching and real-time updates
 */
export async function fetchFeaturedProps(
  sport?: string,
  marketType?: string,
  options: {
    useCache?: boolean;
    realtime?: boolean;
    priority?: 'high' | 'normal' | 'low';
    statTypes?: string[]; // Add stat types filtering
    limit?: number; // Add pagination support
    offset?: number;
  } = {}
): Promise<FeaturedProp[]> {
  const {
    useCache = true,
    realtime = false,
    priority = 'high',
    statTypes,
    limit = 50,
    offset = 0,
  } = options;

  try {
    if (sport === 'MLB') {
  enhancedLogger.info('FeaturedPropsService', 'fetchFeaturedProps', `Fetching ${sport} props with enhanced data manager`);

      try {
        // Try to use enhanced data manager for optimized MLB data fetching
        enhancedLogger.debug('FeaturedPropsService', 'fetchFeaturedProps', 'Calling enhancedDataManager.fetchSportsProps with params', {
          sport,
          marketType: marketType || 'player',
          statTypes,
          limit,
          offset,
          useCache,
          realtime,
        });

        const props = await enhancedDataManager.fetchSportsProps(sport, marketType || 'player', {
          useCache, // Re-enable caching now that testing is complete
          realtime,
          consolidate: true, // Enable smart consolidation
          statTypes, // Pass statTypes for filtering
          limit, // Pass limit for pagination
          offset, // Pass offset for pagination
        });

  enhancedLogger.info('FeaturedPropsService', 'fetchFeaturedProps', `Enhanced fetch completed: ${props.length} props`, { count: props.length });
        return props;
      } catch (enhancedError) {
  enhancedLogger.warn('FeaturedPropsService', 'fetchFeaturedProps', 'Enhanced manager failed, trying debug manager', undefined, enhancedError as Error);

        // Try debug manager as second fallback
        try {
          enhancedLogger.debug('FeaturedPropsService', 'fetchFeaturedProps', 'Trying debug manager...');
          const debugProps = await debugEnhancedDataManager.fetchSportsProps(
            sport,
            marketType || 'player',
            {
              statTypes,
              limit,
              offset,
            }
          );
          enhancedLogger.info('FeaturedPropsService', 'fetchFeaturedProps', `Debug manager succeeded: ${debugProps.length} props`, { count: debugProps.length });
          return debugProps;
        } catch (debugError) {
          enhancedLogger.warn('FeaturedPropsService', 'fetchFeaturedProps', 'Debug manager also failed, falling back to direct API', undefined, debugError as Error);
        }

        // Fallback to direct API call with absolute URL
        const endpoint = `http://localhost:8000/mlb/odds-comparison/`;
        const params = {
          market_type: marketType === 'player' ? 'playerprops' : 'regular',
          ...(statTypes && statTypes.length > 0 && { stat_types: statTypes.join(',') }),
          limit,
          offset,
        };

        const data = await enhancedDataManager.fetchData(endpoint, params, {
          cache: useCache,
          ttl: 300000, // 5 minutes
          priority,
        });

        // Map to FeaturedProp interface
  const responseData = data as unknown;
  const mappedProps = mapToFeaturedProps(((responseData as Record<string, unknown>)?.odds as unknown[]) || [], sport);
  enhancedLogger.info('FeaturedPropsService', 'fetchFeaturedProps', `Fallback fetch completed: ${mappedProps.length} props`, { count: mappedProps.length });
        return mappedProps;
      }
    } else {
      // Fallback for other sports using enhanced data manager with absolute URL
      const endpoint = `http://localhost:8000/api/props/${sport || 'general'}`;
      const params = {
        market_type: marketType === 'player' ? 'playerprops' : 'regular',
      };

      const data = await enhancedDataManager.fetchData(endpoint, params, {
        cache: useCache,
        ttl: 300000, // 5 minutes
        priority,
      });

      // Map to FeaturedProp interface
      return mapToFeaturedProps(Array.isArray(data) ? data : [], sport);
    }
  } catch (error) {
  enhancedLogger.error('FeaturedPropsService', 'fetchFeaturedProps', `Failed to fetch ${sport || 'general'} props`, undefined, error as Error);

    // Try to get cached data as fallback
    if (useCache) {
      try {
        const fallbackProps = await enhancedDataManager.fetchSportsProps(
          sport || 'general',
          marketType || 'player',
          { useCache: true, realtime: false }
        );

  enhancedLogger.warn('FeaturedPropsService', 'fetchFeaturedProps', `Using fallback cached data: ${fallbackProps.length} props`);
        return fallbackProps;
      } catch (fallbackError) {
  enhancedLogger.error('FeaturedPropsService', 'fetchFeaturedProps', 'Fallback also failed', undefined, fallbackError as Error);
      }
    }

    // Check if this is a connectivity issue (including axios errors)
    const isConnectivityError =
      error instanceof Error &&
      (error.message.includes('Failed to fetch') ||
        error.message.includes('Network Error') ||
        error.message.includes('timeout') ||
        error.message.includes('signal timed out') ||
        error.name === 'NetworkError' ||
  ((error as unknown) as Record<string, unknown>).code === 'ERR_NETWORK');

    if (isConnectivityError) {
  enhancedLogger.warn('FeaturedPropsService', 'fetchFeaturedProps', `Backend unavailable for ${sport} - using mock data`);

      // Return mock data when backend is unavailable
      const mockProps: FeaturedProp[] = [
        {
          id: 'mock-aaron-judge-hr',
          player: 'Aaron Judge',
          matchup: 'Yankees vs Red Sox',
          stat: 'Home Runs',
          line: 1.5,
          overOdds: 120,
          underOdds: -110,
          confidence: 85,
          sport: sport || 'MLB',
          gameTime: new Date().toISOString(),
          pickType: 'over',
        },
        {
          id: 'mock-mike-trout-hits',
          player: 'Mike Trout',
          matchup: 'Angels vs Astros',
          stat: 'Hits',
          line: 1.5,
          overOdds: -105,
          underOdds: -115,
          confidence: 78,
          sport: sport || 'MLB',
          gameTime: new Date().toISOString(),
          pickType: 'over',
        },
        {
          id: 'mock-mookie-betts-rbis',
          player: 'Mookie Betts',
          matchup: 'Dodgers vs Giants',
          stat: 'RBIs',
          line: 0.5,
          overOdds: 110,
          underOdds: -130,
          confidence: 82,
          sport: sport || 'MLB',
          gameTime: new Date().toISOString(),
          pickType: 'over',
        },
      ];

      return mockProps;
    }

    throw error;
  }
}

/**
 * Enhanced prop analysis fetching with intelligent caching
 */
export async function fetchEnhancedPropAnalysis(
  propId: string,
  player: string,
  stat: string,
  options: {
    useCache?: boolean;
    priority?: 'high' | 'normal' | 'low';
  } = {}
): Promise<unknown> {
  const { useCache = true, priority = 'normal' } = options;

  try {
    return await enhancedDataManager.fetchPropAnalysis(propId, player, stat, {
      useCache,
      priority,
    });
  } catch (error) {
    enhancedLogger.error('FeaturedPropsService', 'fetchEnhancedPropAnalysis', `Enhanced analysis failed for ${player} ${stat}`, undefined, error as Error);
    throw error;
  }
}

/**
 * Subscribe to real-time prop updates
 */
export function subscribeToPropsUpdates(
  sport: string,
  callback: (props: FeaturedProp[]) => void,
  options: {
    marketType?: string;
    prefetch?: boolean;
  } = {}
): () => void {
  const { marketType = 'player', prefetch = true } = options;

  return enhancedDataManager.subscribe(
    `sports:${sport}:${marketType}`,
    data => {
      // Transform real-time data to FeaturedProp format
      const props = mapToFeaturedProps(Array.isArray(data) ? data : [data], sport);
      callback(props);
    },
    {
      realtime: true,
      prefetch,
      priority: 'high',
    }
  );
}

/**
 * Get data manager performance metrics
 */
export function getDataManagerMetrics() {
  return enhancedDataManager.getMetrics();
}

/**
 * Clear all cached data
 */
export function clearPropsCache(): void {
  enhancedDataManager.clearCache();
}

/**
 * Prefetch likely needed data based on user patterns
 */
export async function prefetchPropsData(sport: string, patterns: string[] = []): Promise<void> {
  for (const pattern of patterns) {
    await enhancedDataManager.prefetchData(`${sport}:${pattern}`);
  }
}

// Helper function to map raw data to FeaturedProp interface
function mapToFeaturedProps(rawData: unknown[], sport?: string): FeaturedProp[] {
  return rawData.map(item => {
    const it = (item as Record<string, unknown>) || {};
    // Handle MLB odds data structure
    const player = String(it.player ?? it.player_name ?? it.away_team ?? it.home_team ?? 'Unknown');
    const matchup = String(
      it.matchup ?? it.event_name ?? `${String(it.away_team ?? 'Team A')} vs ${String(it.home_team ?? 'Team B')}`
    );
    const stat = String(it.stat ?? it.stat_type ?? it.market_type ?? 'Unknown');

    const id = String(it.id ?? it.event_id ?? `${player}-${stat}`);

    return {
      id,
      player,
      matchup,
      stat,
      line: parseFloat(String(it.line ?? it.line_score ?? 0)),
      overOdds: parseFloat(String(it.overOdds ?? it.over_odds ?? it.value ?? 0)),
      underOdds: parseFloat(String(it.underOdds ?? it.under_odds ?? it.value ?? 0)),
      confidence: parseFloat(String(it.confidence ?? 75)), // Default confidence for real games
      sport: String(sport ?? it.sport ?? 'MLB'), // Use passed sport parameter first
      gameTime: String(it.gameTime ?? it.start_time ?? new Date().toISOString()),
      pickType: String(it.pickType ?? stat ?? 'prop'),
      // Important: This is the player_id field from the MLB API that powers the headshot URLs
      // The headshots are loaded from: https://midfield.mlbstatic.com/v1/people/{player_id}/spots/120
      espnPlayerId:
        typeof (it.espnPlayerId ?? it.player_id ?? it.playerId) === 'string'
          ? ((it.espnPlayerId ?? it.player_id ?? it.playerId) as string)
          : undefined,
      // Preserve original raw data for backend processing
      _originalData: it as Record<string, unknown>,
    };
  });
}
