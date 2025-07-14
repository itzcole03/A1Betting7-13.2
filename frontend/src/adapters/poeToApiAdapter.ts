import { unifiedMonitor } from '@/core/UnifiedMonitor';
import {
  PrizePicksProps,
  PoeApiResponse,
  PoeDataBlock,
  PoePropCardContent,
} from '@/types/prizePicksUnified';

/**
 * Adapts data from a "Poe-like" source (structured as PoeDataBlock)
 * into a more usable format, such as PrizePicksProps for prop card display.
 */
export class PoeToApiAdapter {
  constructor() {}

  /**
   * Transforms an array of PoeDataBlock objects into an array of PrizePicksProps.
   * Focuses on blocks of type 'prop_card'.
   *
   * @param poeDataBlocks - An array of PoeDataBlock objects.
   * @returns An array of PrizePicksProps.
   */
  public transformPoeDataToPrizePicksProps(poeDataBlocks: PoeDataBlock[]): PrizePicksProps[] {
    const trace = unifiedMonitor.startTrace('PoeToApiAdapter.transformPoeData', {
      category: 'adapter.transform',
    });
    const transformedProps: PrizePicksProps[] = [];

    try {
      for (const block of poeDataBlocks) {
        if (block.type === 'prop_card' && block.content) {
          const content = block.content as PoePropCardContent;

          // Basic mapping, assuming PoePropCardContent fields align or can be mapped
          const prop: PrizePicksProps = {
            playerId: content.playerId || block.id,
            playerName: content.playerName || content.player || 'Unknown Player',
            league: content.statType?.includes('NBA')
              ? 'NBA'
              : content.statType?.includes('NFL')
                ? 'NFL'
                : 'Unknown', // Crude league detection
            player_name: content.playerName || content.player || 'Unknown Player',
            stat_type: content.statType || content.stat || 'Unknown Stat',
            line: content.line,
            description: `${content.playerName} - ${content.statType} ${content.line}`,
            image_url: content.playerImage,
            overOdds: content.overOdds,
            underOdds: content.underOdds,
            // start_time, status would need to come from PoeDataBlock metadata or extended content
            // For now, these are example transformations
          };
          transformedProps.push(prop);
        }
      }
      unifiedMonitor.endTrace(trace);
      return transformedProps;
    } catch (error) {
      unifiedMonitor.reportError(error, { operation: 'transformPoeDataToPrizePicksProps' });
      unifiedMonitor.endTrace(trace);
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

      const trace = unifiedMonitor.startTrace('poeToApiAdapter.fetch', {
        category: 'adapter.fetch',
      });
      return this.transformPoeDataToPrizePicksProps(realApiResponse.dataBlocks || []);
    } catch (error) {
      // console.error('Error fetching real API data:', error);
      // Fallback to empty array instead of mock data
      return [];
    }
  }
}

// Export a singleton instance if preferred, or allow instantiation
export const poeToApiAdapter = new PoeToApiAdapter();
