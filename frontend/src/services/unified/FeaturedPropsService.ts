/**
 * MLB Odds & AI Insights Mapping Logic (A1Betting7-13.2)
 * Enhanced with intelligent data management and real-time capabilities
 *
 * This file is responsible for fetching, mapping, and surfacing MLB odds and AI insights
 * in the frontend analytics table using the enhanced data manager.
 */

import { debugEnhancedDataManager } from '../DebugEnhancedDataManager';
import { enhancedDataManager } from '../EnhancedDataManager';

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
      params: propsForBackend, // Pass the entire array as params
      priority: 'high' as const,
    };

    // Process batch with intelligent caching
    const results = await enhancedDataManager.fetchBatch([batchRequest]);

    // Extract predictions from batch results
    const batchResult = results['batch_predictions'];
    let backendPredictions: any[] = [];

    if (batchResult) {
      // Handle backend response format: { predictions: [...], errors: [...] }
      if (
        typeof batchResult === 'object' &&
        batchResult !== null &&
        'predictions' in batchResult &&
        Array.isArray((batchResult as any).predictions)
      ) {
        backendPredictions = (batchResult as any).predictions;
      } else if (Array.isArray(batchResult)) {
        backendPredictions = batchResult;
      } else if (typeof batchResult === 'object') {
        backendPredictions = [batchResult];
      }
    }

    console.log(
      `[FeaturedPropsService] Backend predictions received: ${backendPredictions.length} results for ${props.length} props`
    );

    // Transform backend predictions back to FeaturedProp format with enhanced data
    const enhancedProps: FeaturedProp[] = props.map((originalProp, index) => {
      const backendPrediction = backendPredictions[index];

      if (!backendPrediction || backendPrediction.error) {
        // If prediction failed, return original prop
        console.warn(`[FeaturedPropsService] No prediction for prop ${index}:`, originalProp.id);
        return originalProp;
      }

      // Merge original prop structure with enhanced prediction data
      const enhancedProp: FeaturedProp = {
        ...originalProp,
        // Update confidence from backend prediction
        confidence: backendPrediction.confidence || originalProp.confidence,
        // Add enhanced data as custom properties (will be available for enhanced analysis)
        ...(backendPrediction.recommendation && {
          recommendation: backendPrediction.recommendation,
        }),
        ...(backendPrediction.quantum_confidence && {
          quantumConfidence: backendPrediction.quantum_confidence,
        }),
        ...(backendPrediction.neural_score && { neuralScore: backendPrediction.neural_score }),
        ...(backendPrediction.kelly_fraction && {
          kellyFraction: backendPrediction.kelly_fraction,
        }),
        ...(backendPrediction.expected_value && {
          expectedValue: backendPrediction.expected_value,
        }),
        ...(backendPrediction.shap_explanation && {
          shapExplanation: backendPrediction.shap_explanation,
        }),
        ...(backendPrediction.risk_assessment && {
          riskAssessment: backendPrediction.risk_assessment,
        }),
        ...(backendPrediction.optimal_stake && { optimalStake: backendPrediction.optimal_stake }),
      };

      return enhancedProp;
    });

    console.log(
      `[FeaturedPropsService] Enhanced props created: ${enhancedProps.length} props with enhanced data`
    );

    return enhancedProps;
  } catch (error) {
    console.error('[FeaturedPropsService] Batch predictions failed:', error);
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
      console.log(`[FeaturedPropsService] Fetching ${sport} props with enhanced data manager`);

      try {
        // Try to use enhanced data manager for optimized MLB data fetching
        console.log(`[FeaturedPropsService] Calling enhancedDataManager.fetchSportsProps with:`, {
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

        console.log(`[FeaturedPropsService] Enhanced fetch completed: ${props.length} props`);
        return props;
      } catch (enhancedError) {
        console.warn(
          '[FeaturedPropsService] Enhanced manager failed, trying debug manager',
          enhancedError
        );

        // Try debug manager as second fallback
        try {
          console.log(`[FeaturedPropsService] Trying debug manager...`);
          const debugProps = await debugEnhancedDataManager.fetchSportsProps(
            sport,
            marketType || 'player',
            {
              statTypes,
              limit,
              offset,
            }
          );
          console.log(`[FeaturedPropsService] Debug manager succeeded: ${debugProps.length} props`);
          return debugProps;
        } catch (debugError) {
          console.warn(
            '[FeaturedPropsService] Debug manager also failed, falling back to direct API',
            debugError
          );
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
        const responseData = data as any;
        const mappedProps = mapToFeaturedProps(responseData?.odds || [], sport);
        console.log(`[FeaturedPropsService] Fallback fetch completed: ${mappedProps.length} props`);
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
    console.error(`[FeaturedPropsService] Failed to fetch ${sport || 'general'} props:`, error);

    // Try to get cached data as fallback
    if (useCache) {
      try {
        const fallbackProps = await enhancedDataManager.fetchSportsProps(
          sport || 'general',
          marketType || 'player',
          { useCache: true, realtime: false }
        );

        console.warn(
          `[FeaturedPropsService] Using fallback cached data: ${fallbackProps.length} props`
        );
        return fallbackProps;
      } catch (fallbackError) {
        console.error('[FeaturedPropsService] Fallback also failed:', fallbackError);
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
        (error as any).code === 'ERR_NETWORK');

    if (isConnectivityError) {
      console.log(`[FeaturedPropsService] Backend unavailable for ${sport} - using mock data`);

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
): Promise<any> {
  const { useCache = true, priority = 'normal' } = options;

  try {
    return await enhancedDataManager.fetchPropAnalysis(propId, player, stat, {
      useCache,
      priority,
    });
  } catch (error) {
    console.error(`[FeaturedPropsService] Enhanced analysis failed for ${player} ${stat}:`, error);
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
function mapToFeaturedProps(rawData: any[], sport?: string): FeaturedProp[] {
  return rawData.map(item => {
    // Handle MLB odds data structure
    const player = item.player || item.player_name || item.away_team || item.home_team || 'Unknown';
    const matchup =
      item.matchup ||
      item.event_name ||
      `${item.away_team || 'Team A'} vs ${item.home_team || 'Team B'}`;
    const stat = item.stat || item.stat_type || item.market_type || 'Unknown';

    return {
      id: item.id || item.event_id || `${player}-${stat}`,
      player,
      matchup,
      stat,
      line: parseFloat(item.line || item.line_score || 0),
      overOdds: parseFloat(item.overOdds || item.over_odds || item.value || 0),
      underOdds: parseFloat(item.underOdds || item.under_odds || item.value || 0),
      confidence: parseFloat(item.confidence || 75), // Default confidence for real games
      sport: sport || item.sport || 'MLB', // Use passed sport parameter first
      gameTime: item.gameTime || item.start_time || new Date().toISOString(),
      pickType: item.pickType || stat || 'prop',
      // Important: This is the player_id field from the MLB API that powers the headshot URLs
      // The headshots are loaded from: https://midfield.mlbstatic.com/v1/people/{player_id}/spots/120
      espnPlayerId: item.espnPlayerId || item.player_id || item.playerId || undefined,
      // Preserve original raw data for backend processing
      _originalData: item,
    };
  });
}
