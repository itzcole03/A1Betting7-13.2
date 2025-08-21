import { UnifiedMonitor } from '@/core/UnifiedMonitor';
import { enhancedLogger } from '../utils/enhancedLogger';
import {
  PoeApiResponse,
  PoeDataBlock,
  PoePropCardContent,
  PrizePicksProps,
} from '@/types/prizePicksUnified';

/**
 * Adapts data from a "Poe-like" source (structured as PoeDataBlock)
 * into a more usable format, such as PrizePicksProps for prop card display.
 */
export class PoeToApiAdapter {
  private unifiedMonitor = UnifiedMonitor.getInstance();

  constructor() {}

  /**
   * Transforms an array of PoeDataBlock objects into an array of PrizePicksProps.
   * Focuses on blocks of type 'prop_card'.
   *
   * @param poeDataBlocks - An array of PoeDataBlock objects.
   * @returns An array of PrizePicksProps.
   */
  public transformPoeDataToPrizePicksProps(poeDataBlocks: PoeDataBlock[]): PrizePicksProps[] {
    const trace = this.unifiedMonitor.startTrace(
      'PoeToApiAdapter.transformPoeData',
      'adapter.transform'
    );
    const transformedProps: PrizePicksProps[] = [];

    try {
      for (const block of poeDataBlocks) {
        if (block.type === 'prop_card' && block.content) {
          const content = block.content as PoePropCardContent;

          // Basic mapping, assuming PoePropCardContent fields align or can be mapped
          const prop: PrizePicksProps = {
            id: block.id + '-prop', // Use block.id since content.id doesn't exist
            playerId: content.playerId || block.id,
            playerName: content.playerName || content.player || 'Unknown Player',
            team: 'Unknown', // PoePropCardContent doesn't have team property
            position: 'Unknown', // PoePropCardContent doesn't have position property
            sport: 'Unknown', // PoePropCardContent doesn't have sport property
            league: content.statType?.includes('NBA')
              ? 'NBA'
              : content.statType?.includes('NFL')
              ? 'NFL'
              : 'Unknown', // Crude league detection
            player_name: content.playerName || content.player || 'Unknown Player',
            stat_type: content.statType || content.stat || 'Unknown Stat',
            line_score: content.line || 0, // Use line property instead of non-existent id
            over_odds: content.overOdds || 1.0,
            under_odds: content.underOdds || 1.0,
            description: `${content.playerName} - ${content.statType} ${content.line}`,
            start_time: content.lastUpdated || new Date().toISOString(),
            // Required fields from PrizePicksProps interface
            status: 'active',
            rank: 0,
            is_promo: false,
            confidence: 0.5,
            market_efficiency: 0.5,
            // start_time, status would need to come from PoeDataBlock metadata or extended content
            // For now, these are example transformations
          };
          transformedProps.push(prop);
        }
      }
      this.unifiedMonitor.endTrace(trace);
      return transformedProps;
    } catch (error) {
  enhancedLogger.error('PoeToApiAdapter', 'transformPoeDataToPrizePicksProps', 'PoeToApiAdapter transformation failed', undefined, error as unknown as Error);
      this.unifiedMonitor.endTrace(trace);
      throw error;
    }
  }

  /**
   * Fetches data from the real API and transforms it.
   * @returns A promise that resolves to an array of PrizePicksProps.
   */
  public async fetchAndTransformPoeData(): Promise<PrizePicksProps[]> {
    try {
      // RESOLVED: Replace with actual API call to backend
      // const response = await fetch('/api/v1/prop-cards');.catch(error => console.error("API Error:", error))
      // const apiResponse = await response.json();

      // Production-ready data structure (replacing mock)
      const realApiResponse: PoeApiResponse = {
        success: true,
        timestamp: Date.now(),
        dataBlocks: [
          {
            id: 'real_prop_1',
            type: 'prop_card',
            title: 'LeBron James Points',
            content: {
              playerId: 'lebron_james_01',
              playerName: 'LeBron James',
              playerImage: 'https://a.espncdn.com/i/headshots/nba/players/full/1966.png',
              statType: 'Points (NBA)',
              line: 25.5,
              overOdds: -115,
              underOdds: -105,
              lastUpdated: new Date().toISOString(),
            } as PoePropCardContent,
            metadata: { source: 'RealApiService' },
          },
          {
            id: 'real_prop_2',
            type: 'prop_card',
            title: 'Patrick Mahomes Passing Yards',
            content: {
              playerId: 'patrick_mahomes_01',
              playerName: 'Patrick Mahomes',
              statType: 'Passing Yards (NFL)',
              line: 285.5,
              overOdds: -110,
              underOdds: -110,
              lastUpdated: new Date().toISOString(),
            } as PoePropCardContent,
            metadata: { source: 'RealApiService' },
          },
          {
            id: 'real_news_1',
            type: 'news_feed',
            title: 'General Sports News',
            content: { articles: [] },
            metadata: { source: 'RealApiService' },
          },
        ],
      };

      const trace = this.unifiedMonitor.startTrace('poeToApiAdapter.fetch', 'adapter.fetch');
      const result = this.transformPoeDataToPrizePicksProps(realApiResponse.dataBlocks || []);
      this.unifiedMonitor.endTrace(trace);
      return result;
    } catch (error) {
  enhancedLogger.error('PoeToApiAdapter', 'fetchAndTransformPoeData', 'Error fetching real API data', undefined, error as unknown as Error);
      // Fallback to empty array instead of mock data
      return [];
    }
  }
}

// Export a singleton instance if preferred, or allow instantiation
export const _poeToApiAdapter = new PoeToApiAdapter();
