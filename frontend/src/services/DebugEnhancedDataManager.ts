/**
 * Debug Enhanced Data Manager
 * This is a debugging version that bypasses validation and logs everything
 */

import { FeaturedProp } from '../services/unified/FeaturedPropsService';

export class DebugEnhancedDataManager {
  /**
   * Simple data fetching with comprehensive logging
   */
  async fetchSportsProps(
    sport: string,
    propType: string = 'player',
    options: {
      useCache?: boolean;
      realtime?: boolean;
      consolidate?: boolean;
      statTypes?: string[];
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<FeaturedProp[]> {
    const { statTypes, limit = 50, offset = 0 } = options;

    console.log('[DebugEnhancedDataManager] Starting fetchSportsProps with:', {
      sport,
      propType,
      options,
    });

    try {
      // Build the API URL
      const baseUrl = 'http://localhost:8000';
      const endpoint =
        sport === 'MLB' ? `${baseUrl}/mlb/odds-comparison/` : `${baseUrl}/api/props/${sport}`;

      const params = new URLSearchParams({
        market_type: propType === 'player' ? 'playerprops' : 'regular',
        limit: limit.toString(),
        offset: offset.toString(),
      });

      if (statTypes && statTypes.length > 0) {
        params.append('stat_types', statTypes.join(','));
      }

      const url = `${endpoint}?${params.toString()}`;
      console.log('[DebugEnhancedDataManager] Fetching from URL:', url);

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const rawData = await response.json();
      console.log('[DebugEnhancedDataManager] Raw API response:', rawData);

      // Simple mapping without validation
      const props: FeaturedProp[] = (Array.isArray(rawData) ? rawData : []).map(
        (item: any, index: number) => {
          const mapped = {
            id: item.id || `${item.player_name || 'unknown'}-${item.stat_type || 'stat'}-${index}`,
            player: item.player_name || item.player || 'Unknown Player',
            matchup: item.matchup || item.event_name || 'Unknown Game',
            stat: item.stat_type || item.stat || 'Unknown Stat',
            line: parseFloat(item.line || item.line_score || 0),
            overOdds: parseFloat(item.overOdds || item.over_odds || item.odds || 100),
            underOdds: parseFloat(item.underOdds || item.under_odds || item.odds || 100),
            confidence: parseFloat(item.confidence || 75),
            sport: sport || item.sport || 'MLB',
            gameTime: item.start_time || item.gameTime || new Date().toISOString(),
            pickType: 'prop' as const,
            _originalData: item,
          };

          console.log(`[DebugEnhancedDataManager] Mapped prop ${index}:`, mapped);
          return mapped;
        }
      );

      console.log(`[DebugEnhancedDataManager] ✅ Successfully mapped ${props.length} props`);
      return props;
    } catch (error) {
      console.error('[DebugEnhancedDataManager] ❌ Error:', error);

      // Check if this is a connectivity issue
      const isConnectivityError = error instanceof Error && (
        error.message.includes('Failed to fetch') ||
        error.message.includes('Network Error') ||
        error.message.includes('timeout') ||
        error.message.includes('signal timed out')
      );

      if (isConnectivityError) {
        console.log(`[DebugEnhancedDataManager] Backend unavailable for ${sport} - using mock data`);

        // Return mock props when backend is unavailable
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
            pickType: 'over'
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
            pickType: 'over'
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
            pickType: 'over'
          }
        ];

        return mockProps;
      }

      throw error;
    }
  }
}

export const debugEnhancedDataManager = new DebugEnhancedDataManager();
