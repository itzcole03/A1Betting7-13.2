import { useQuery } from '@tanstack/react-query';
// @ts-expect-error TS(2305): Module '"../services/data/UnifiedDataPipeline"' ha... Remove this comment to see the full error message
import { unifiedDataPipeline } from '../services/data/UnifiedDataPipeline';
// @ts-expect-error TS(2305): Module '"../types/unified"' has no exported member... Remove this comment to see the full error message
import { GameData, OddsData } from '../types/unified';

/**
 * Hook to fetch games from the Sportradar backend specialist.
 * @param sport The sport identifier (e.g., 'nba', 'soccer')
 * @param date Optional date string (YYYY-MM-DD)
 */
export function useSportradarGames(_sport: string, _date?: string) {
  return useQuery<GameData[0], Error>({
    queryKey: ['srGames', sport, date],
    queryFn: () => unifiedDataPipeline.fetchSportradarGames(sport, date),
    enabled: Boolean(sport),
  });
}

/**
 * Hook to fetch odds for a specific event from TheOdds API backend specialist.
 * @param eventId The ID of the event/game
 * @param market Optional market filter (e.g., 'h2h')
 */
export function useEventOdds(_eventId: string, _market?: string) {
  return useQuery<OddsData[0], Error>({
    queryKey: ['eventOdds', eventId, market],
    queryFn: () => unifiedDataPipeline.fetchOdds(eventId, market),
    enabled: Boolean(eventId),
  });
}
