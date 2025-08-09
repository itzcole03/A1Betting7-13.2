import { get, post } from './client';
export type { Player } from '@/types/core';

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
    if (Array.isArray(_response?.data)) {
      return _response.data;
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
    const _response = await post('/lineups', _lineup);
    if (_response && _response.data && typeof _response.data === 'object' && 'lineupId' in _response.data) {
      return { success: true, lineupId: (_response.data as { lineupId: string }).lineupId };
    }
    return { success: false };
  } catch (error) {
    return { success: false };
  }
}
