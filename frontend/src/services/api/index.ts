// export { apiService } from './ApiService.js';
export { get, post } from './client.js';
// import { apiService } from './ApiService.js';
// export const api = apiService;

// Import types;
export type { Player } from '@/types/api.js';

// Lineup API functions;
export interface LineupSubmission {
  players: string[]; // player IDs;
  totalSalary: number;
  sport: string;
  contestId?: string;
}

export async function getPlayers(): Promise<any[]> {
  try {
    // TODO: Replace with actual API call
    const response = { success: true, data: [{ id: 'player1' }] };
    if (response?.success && response?.data) {
      return response.data;
    }
    return [];
  } catch (error) {
    // console statement removed
    return [];
  }
}

export async function submitLineup(
  lineup: LineupSubmission
): Promise<{ success: boolean; lineupId?: string }> {
  try {
    // TODO: Replace with actual API call
    const response = { success: true, data: { lineupId: '123' } };
    if (response?.success) {
      return { success: true, lineupId: (response.data as any)?.lineupId };
    }
    return { success: false };
  } catch (error) {
    // console statement removed
    return { success: false };
  }
}
