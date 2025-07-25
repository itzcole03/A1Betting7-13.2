import { get, post } from './client.js';
// @ts-expect-error TS(2691): An import path cannot end with a '.ts' extension. ... Remove this comment to see the full error message
export type { Player } from '@/types/core.ts';

export interface LineupSubmission {
  players: string[];
  totalSalary: number;
  sport: string;
  contestId?: string;
}

// Fetch players from backend API
export async function getPlayers(): Promise<unknown[]> {
  try {
    // Calls /api/players endpoint
    const _response = await get('/players');
    if (Array.isArray(response?.data)) {
      return response.data;
    }
    return [];
  } catch (error) {
    return [];
  }
}

// Submit lineup to backend API
export async function submitLineup(_lineup: LineupSubmission): Promise<{ success: boolean; lineupId?: string }> {
  try {
    // Calls /api/lineups endpoint
    const _response = await post('/lineups', lineup);
    if (response && response.data && typeof response.data === 'object' && 'lineupId' in response.data) {
      return { success: true, lineupId: (response.data as { lineupId: string }).lineupId };
    }
    return { success: false };
  } catch (error) {
    return { success: false };
  }
}
