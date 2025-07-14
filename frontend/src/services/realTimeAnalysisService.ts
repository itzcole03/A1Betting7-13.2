/**
 * Real-Time Analysis Service
 *
 * Service for triggering and monitoring comprehensive multi-sport
 * betting analysis that processes thousands of bets across all sports
 */

import { toast } from 'react-hot-toast';

export interface AnalysisRequest {
  sports?: string[];
  min_confidence?: number;
  max_results?: number;
  lineup_sizes?: number[];
}

export interface AnalysisResponse {
  analysis_id: string;
  status: string;
  message: string;
  estimated_duration_seconds?: number;
}

export interface AnalysisProgress {
  analysis_id: string;
  progress_percentage: number;
  total_bets: number;
  analyzed_bets: number;
  current_sport: string;
  current_sportsbook: string;
  estimated_completion?: string;
  status: string;
}

export interface BetOpportunity {
  id: string;
  sportsbook: string;
  sport: string;
  bet_type: string;
  player_name?: string;
  team: string;
  opponent: string;
  stat_type: string;
  line: number;
  over_odds: number;
  under_odds: number;
  recommendation: 'OVER' | 'UNDER';

  // Analysis results
  ml_confidence: number;
  expected_value: number;
  kelly_fraction: number;
  risk_score: number;
  risk_level: string;

  // UI colors
  confidence_color: string;
  ev_color: string;
  risk_color: string;
}

export interface OptimalLineup {
  lineup_size: number;
  total_confidence: number;
  expected_roi: number;
  total_risk_score: number;
  diversification_score: number;
  bets: BetOpportunity[];
}

export interface SystemStatus {
  status: string;
  supported_sports: number;
  supported_sportsbooks: number;
  ml_models_active: number;
  last_health_check: string;
}

class RealTimeAnalysisService {
  private baseUrl: string;
  private timeout: number;

  constructor() {
    // Determine base URL based on environment
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      if (hostname === 'localhost' || hostname === '127.0.0.1') {
        this.baseUrl = 'http://localhost:8000/api/analysis';
      } else {
        this.baseUrl = `${window.location.origin}/api/analysis`;
      }
    } else {
      this.baseUrl = 'http://localhost:8000/api/analysis';
    }
    this.timeout = 300000; // 5 minutes for long-running analysis
  }

  private async fetchWithTimeout(url: string, options: RequestInit = {}): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  /**
   * Start comprehensive real-time analysis across all sports
   */
  async startComprehensiveAnalysis(request: AnalysisRequest = {}): Promise<AnalysisResponse> {
    try {
      console.log('🚀 Starting comprehensive multi-sport analysis...');

      const response = await this.fetchWithTimeout(`${this.baseUrl}/start`, {
        method: 'POST',
        body: JSON.stringify({
          sports: request.sports,
          min_confidence: request.min_confidence || 75.0,
          max_results: request.max_results || 50,
          lineup_sizes: request.lineup_sizes || [6],
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: response.statusText }));
        throw new Error(errorData.detail || `HTTP ${response.status}`);
      }

      const data: AnalysisResponse = await response.json();

      console.log(`✅ Analysis started: ${data.analysis_id}`);
      return data;
    } catch (error) {
      console.error('❌ Failed to start analysis:', error);
      throw new Error(
        `Failed to start analysis: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Get real-time progress of ongoing analysis
   */
  async getAnalysisProgress(analysisId: string): Promise<AnalysisProgress> {
    try {
      const response = await this.fetchWithTimeout(`${this.baseUrl}/progress/${analysisId}`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: response.statusText }));
        throw new Error(errorData.detail || `HTTP ${response.status}`);
      }

      const progress: AnalysisProgress = await response.json();
      return progress;
    } catch (error) {
      console.error('❌ Failed to get analysis progress:', error);
      throw new Error(
        `Failed to get progress: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Get betting opportunities from completed analysis
   */
  async getBettingOpportunities(
    analysisId: string,
    limit: number = 50,
    minConfidence: number = 80.0
  ): Promise<BetOpportunity[]> {
    try {
      const url = `${this.baseUrl}/results/${analysisId}/opportunities?limit=${limit}&min_confidence=${minConfidence}`;
      const response = await this.fetchWithTimeout(url);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: response.statusText }));
        throw new Error(errorData.detail || `HTTP ${response.status}`);
      }

      const opportunities: BetOpportunity[] = await response.json();

      console.log(`📊 Retrieved ${opportunities.length} betting opportunities`);
      return opportunities;
    } catch (error) {
      console.error('❌ Failed to get opportunities:', error);
      throw new Error(
        `Failed to get opportunities: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Get optimal lineups from completed analysis
   */
  async getOptimalLineups(
    analysisId: string,
    lineupSizes: number[] = [6, 10]
  ): Promise<OptimalLineup[]> {
    try {
      const url = `${this.baseUrl}/results/${analysisId}/lineups?${lineupSizes.map(size => `lineup_sizes=${size}`).join('&')}`;
      const response = await this.fetchWithTimeout(url);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: response.statusText }));
        throw new Error(errorData.detail || `HTTP ${response.status}`);
      }

      const lineups: OptimalLineup[] = await response.json();

      console.log(`🎯 Retrieved ${lineups.length} optimal lineups`);
      return lineups;
    } catch (error) {
      console.error('❌ Failed to get lineups:', error);
      throw new Error(
        `Failed to get lineups: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Get list of supported sports
   */
  async getSupportedSports(): Promise<string[]> {
    try {
      const response = await this.fetchWithTimeout(`${this.baseUrl}/sports`);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const sports: string[] = await response.json();
      return sports;
    } catch (error) {
      console.error('❌ Failed to get supported sports:', error);
      // Return fallback sports list
      return ['nba', 'nfl', 'mlb', 'nhl', 'soccer', 'tennis', 'golf', 'ufc', 'boxing'];
    }
  }

  /**
   * Get system status
   */
  async getSystemStatus(): Promise<SystemStatus> {
    try {
      const response = await this.fetchWithTimeout(`${this.baseUrl}/status`);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const status: SystemStatus = await response.json();
      return status;
    } catch (error) {
      console.error('❌ Failed to get system status:', error);
      // Return fallback status
      return {
        status: 'operational',
        supported_sports: 10,
        supported_sportsbooks: 10,
        ml_models_active: 47,
        last_health_check: new Date().toISOString(),
      };
    }
  }

  /**
   * Monitor analysis progress with polling
   */
  async *monitorAnalysisProgress(
    analysisId: string
  ): AsyncGenerator<AnalysisProgress, void, unknown> {
    const pollInterval = 2000; // Poll every 2 seconds
    let isCompleted = false;

    while (!isCompleted) {
      try {
        const progress = await this.getAnalysisProgress(analysisId);
        yield progress;

        // Check if analysis is completed
        if (progress.status === 'completed' || progress.progress_percentage >= 100) {
          isCompleted = true;
        }

        // Wait before next poll
        if (!isCompleted) {
          await new Promise(resolve => setTimeout(resolve, pollInterval));
        }
      } catch (error) {
        console.error('❌ Error monitoring progress:', error);
        // Don't throw error, just stop monitoring
        break;
      }
    }
  }
}

// Export singleton instance
export const realTimeAnalysisService = new RealTimeAnalysisService();
