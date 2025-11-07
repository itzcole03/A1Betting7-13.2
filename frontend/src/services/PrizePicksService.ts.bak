/**
 * Consolidated PrizePicks Service
 * Handles all PrizePicks API interactions and prop analysis
 */

import { BaseApiService, ApiConfig } from './ApiService';
import type { 
  PrizePicksPlayer, 
  PrizePicksProjection,
  PlayerProp,
  Lineup,
  PrizePicksStats
} from '../types/prizePicksUnified';

export interface EnhancedPrediction {
  id: string;
  sport: string;
  event: string;
  prediction: string;
  confidence: number;
  odds: number;
  expected_value: number;
  timestamp: string;
  model_version: string;
  features: Record<string, number>;
  shap_values?: Record<string, number>;
  explanation?: string;
  risk_assessment: string;
  recommendation: string;
}

export interface PropOllamaRequest {
  message: string;
  context?: Record<string, unknown>;
  analysisType?: string;
  sport?: string;
}

export interface PropOllamaResponse {
  content: string;
  confidence: number;
  recommendations?: string[];
  analysis?: Record<string, unknown>;
}

export class PrizePicksService extends BaseApiService {
  constructor(config: ApiConfig = {}) {
    super({
      baseURL: config.baseURL || '/api/prizepicks',
      timeout: config.timeout || 15000,
      ...config,
    });
  }

  // Get available props with fallback to mock data
  async getAvailableProps(): Promise<PrizePicksProjection[]> {
    try {
      return await this.get<PrizePicksProjection[]>('/props');
    } catch (error) {
      console.warn('Failed to fetch props from API, using mock data:', error);
      return this.getMockProps();
    }
  }

  // Get player information
  async getPlayer(playerId: string): Promise<PrizePicksPlayer> {
    try {
      return await this.get<PrizePicksPlayer>(`/players/${playerId}`);
    } catch (error) {
      console.warn('Failed to fetch player from API:', error);
      throw error;
    }
  }

  // Get enhanced predictions
  async getEnhancedPredictions(sport?: string): Promise<EnhancedPrediction[]> {
    try {
      const params = sport ? { sport } : undefined;
      return await this.get<EnhancedPrediction[]>('/predictions/enhanced', params);
    } catch (error) {
      console.warn('Failed to fetch enhanced predictions:', error);
      return [];
    }
  }

  // Submit lineup
  async submitLineup(lineup: Lineup): Promise<{ success: boolean; lineupId?: string }> {
    try {
      const result = await this.post<{ success: boolean; lineupId: string }>('/lineups', lineup);
      return result;
    } catch (error) {
      console.error('Failed to submit lineup:', error);
      return { success: false };
    }
  }

  // Get user's lineups
  async getUserLineups(): Promise<Lineup[]> {
    try {
      return await this.get<Lineup[]>('/lineups/user');
    } catch (error) {
      console.warn('Failed to fetch user lineups:', error);
      return [];
    }
  }

  // PropOllama chat interface
  async chatWithPropOllama(request: PropOllamaRequest): Promise<PropOllamaResponse> {
    try {
      return await this.post<PropOllamaResponse>('/propollama/chat', request);
    } catch (error) {
      console.warn('PropOllama chat failed:', error);
      return {
        content: 'I apologize, but I\'m currently unable to process your request. Please try again later.',
        confidence: 0,
      };
    }
  }

  // Get props statistics
  async getPropsStats(): Promise<PrizePicksStats> {
    try {
      return await this.get<PrizePicksStats>('/stats');
    } catch (error) {
      console.warn('Failed to fetch props stats:', error);
      return this.getMockStats();
    }
  }

  // Mock data for fallback
  private getMockProps(): PrizePicksProjection[] {
    return [
      {
        id: '1',
        player: { id: '1', name: 'LeBron James', team: 'LAL' },
        stat_type: 'Points',
        line_score: 25.5,
        over_odds: -110,
        under_odds: -110,
        confidence: 87,
        value: 8.2,
        reasoning: 'Strong recent scoring form, favorable matchup vs weak defense',
        sport: 'NBA',
        league: 'NBA',
        game_time: new Date().toISOString(),
      },
      {
        id: '2',
        player: { id: '2', name: 'Josh Allen', team: 'BUF' },
        stat_type: 'Passing Yards',
        line_score: 287.5,
        over_odds: -105,
        under_odds: -115,
        confidence: 82,
        value: 7.5,
        reasoning: 'Elite passing offense, dome game conditions favor high passing volume',
        sport: 'NFL',
        league: 'NFL',
        game_time: new Date().toISOString(),
      },
    ];
  }

  private getMockStats(): PrizePicksStats {
    return {
      totalProps: 42,
      avgConfidence: 78.5,
      highValueProps: 12,
      topSports: ['NBA', 'NFL', 'NHL'],
      lastUpdated: new Date().toISOString(),
    };
  }
}

// Singleton instance
export const prizePicksService = new PrizePicksService();

// Export types
export type {
  EnhancedPrediction,
  PropOllamaRequest,
  PropOllamaResponse,
  PrizePicksPlayer,
  PrizePicksProjection,
  PlayerProp,
  Lineup,
  PrizePicksStats,
};
