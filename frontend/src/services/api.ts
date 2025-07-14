import axios from 'axios';

// Type definitions for PrizePicks props and projections
export interface PrizePicksProp {
  id: string;
  player_name: string;
  team: string;
  position?: string;
  league: string;
  sport: string;
  stat_type: string;
  line_score: number;
  confidence: number;
  expected_value?: number;
  recommendation?: string;
  game_time?: string;
  opponent?: string;
  venue?: string;
  status: string;
  updated_at: string;
}

export interface PrizePicksProjection {
  id: string;
  player_name: string;
  team: string;
  league: string;
  sport: string;
  stat_type: string;
  line_score: number;
  confidence: number;
  value_score?: number;
  status: string;
  start_time: string;
  updated_at: string;
}

const API_BASE_URL = '/api/prizepicks';

export async function fetchPrizePicksProps(): Promise<PrizePicksProp[]> {
  const response = await axios.get(`${API_BASE_URL}/props`);
  return response.data;
}

export async function fetchPrizePicksProjections(): Promise<PrizePicksProjection[]> {
  const response = await axios.get(`${API_BASE_URL}/comprehensive-projections`);
  return response.data;
}

// Add more API functions as needed
