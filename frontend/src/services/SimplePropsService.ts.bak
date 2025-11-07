/**
 * Simple Props Service - Bypasses all complex validation and data management
 * This is for debugging the PropGPT/PropFinder merger data fetching issue
 */

export interface SimpleFeaturedProp {
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
  _originalData?: any;
}

/**
 * Simple props fetching that bypasses EnhancedDataManager
 */
export async function fetchPropsSimple(
  sport?: string,
  marketType?: string,
  options: {
    limit?: number;
    offset?: number;
    statTypes?: string[];
  } = {}
): Promise<SimpleFeaturedProp[]> {
  const { limit = 50, offset = 0, statTypes } = options;

  try {
    console.log('[SimplePropsService] Starting simple props fetch...', {
      sport,
      marketType,
      options,
    });

    // Use proxy paths instead of direct localhost to avoid CORS issues
    let endpoint = '';
    const params = new URLSearchParams();

    if (sport === 'MLB') {
      endpoint = '/mlb/odds-comparison/';
      params.append('market_type', marketType === 'player' ? 'playerprops' : 'regular');
    } else {
      endpoint = `/api/props/${sport || 'general'}`;
      params.append('market_type', marketType === 'player' ? 'playerprops' : 'regular');
    }

    params.append('limit', limit.toString());
    params.append('offset', offset.toString());

    if (statTypes && statTypes.length > 0) {
      params.append('stat_types', statTypes.join(','));
    }

    const url = `${endpoint}?${params.toString()}`;
    console.log('[SimplePropsService] Fetching from:', url);

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    const rawData = await response.json();
    console.log('[SimplePropsService] Raw response:', rawData);

    // Simple mapping with no validation or complex logic
    const props: SimpleFeaturedProp[] = (Array.isArray(rawData) ? rawData : []).map(
      (item: any) => ({
        id: item.id || `${item.player_name || 'unknown'}-${item.stat_type || 'stat'}`,
        player:
          item.player_name || item.player || item.away_team || item.home_team || 'Unknown Player',
        matchup:
          item.matchup ||
          item.event_name ||
          `${item.away_team || 'Team A'} vs ${item.home_team || 'Team B'}`,
        stat: item.stat_type || item.stat || item.market_type || 'Unknown Stat',
        line: parseFloat(item.line || item.line_score || 0),
        overOdds: parseFloat(item.overOdds || item.over_odds || item.odds || 100),
        underOdds: parseFloat(item.underOdds || item.under_odds || item.odds || 100),
        confidence: parseFloat(item.confidence || 75),
        sport: sport || item.sport || 'MLB',
        gameTime: item.start_time || item.gameTime || new Date().toISOString(),
        pickType: 'prop',
        _originalData: item,
      })
    );

    console.log('[SimplePropsService] ✅ Mapped props:', props.length);
    return props;
  } catch (error) {
    console.error('[SimplePropsService] ❌ Error fetching props:', error);
    throw error;
  }
}

/**
 * Simple batch predictions - no complex processing
 */
export async function fetchBatchPredictionsSimple(
  props: SimpleFeaturedProp[]
): Promise<SimpleFeaturedProp[]> {
  try {
    console.log('[SimplePropsService] Simple batch predictions for', props.length, 'props');

    // For now, just return the props as-is
    // In a real implementation, this would call the batch prediction API
    return props;
  } catch (error) {
    console.error('[SimplePropsService] Error in batch predictions:', error);
    return props; // Return original props on error
  }
}
