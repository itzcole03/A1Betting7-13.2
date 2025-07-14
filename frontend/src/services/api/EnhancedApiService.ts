/**
 * Enhanced API Service for A1Betting Platform;
 *
 * This service provides comprehensive API integration with:
 * - Advanced prediction endpoints;
 * - Real-time betting opportunities;
 * - Risk management and portfolio optimization;
 * - Arbitrage detection and market analysis;
 * - Comprehensive error handling and retry logic;
 */

import axios, { AxiosInstance, AxiosResponse } from 'axios';

// ============================================================================
// TYPES AND INTERFACES;
// ============================================================================

export interface PredictionRequest {
  event_id: string;
  sport: string;
  features: Record<string, number>;
  models?: string[];
  require_explanations?: boolean;
  risk_tolerance?: number;
  bankroll?: number;
  metadata?: Record<string, any>;
}

export interface ModelPrediction {
  model_name: string;
  model_type: string;
  value: number;
  probability: number;
  confidence: number;
  performance: Record<string, number>;
  shap_values: Record<string, number>;
  feature_importance: Record<string, number>;
  prediction_time: number;
  model_version: string;
}

export interface RiskAssessment {
  kelly_fraction: number;
  recommended_bet_size: number;
  max_bet_size: number;
  risk_level: string;
  expected_value: number;
  variance: number;
  sharpe_ratio: number;
}

export interface MarketAnalysis {
  market_efficiency: number;
  arbitrage_opportunities: Array<{
    bookmaker_a: string;
    bookmaker_b: string;
    odds_a: number;
    odds_b: number;
    profit_margin: number;
    required_stake: number;
  }>;
  value_bets: Array<{
    market: string;
    predicted_odds: number;
    market_odds: number;
    value_percentage: number;
    confidence: number;
  }>;
  market_sentiment: string;
  liquidity_score: number;
}

export interface PredictionResponse {
  event_id: string;
  sport: string;
  final_value: number;
  win_probability: number;
  ensemble_confidence: number;
  expected_payout: number;
  risk_assessment: RiskAssessment;
  market_analysis: MarketAnalysis;
  model_breakdown: ModelPrediction[];
  model_consensus: number;
  shap_values: Record<string, number>;
  feature_importance: Record<string, number>;
  explanation: string;
  confidence_intervals?: Record<string, [number, number]>;
  prediction_timestamp: string;
  processing_time: number;
  model_versions: Record<string, string>;
  data_quality_score: number;
}

export interface BettingOpportunity {
  id: string;
  sport: string;
  event: string;
  market: string;
  odds: number;
  probability: number;
  expected_value: number;
  kelly_fraction: number;
  confidence: number;
  risk_level: string;
  recommendation: string;
}

export interface ArbitrageOpportunity {
  id: string;
  sport: string;
  event: string;
  bookmaker_a: string;
  bookmaker_b: string;
  odds_a: number;
  odds_b: number;
  profit_margin: number;
  required_stake: number;
}

export interface Transaction {
  id: string;
  type: string;
  amount: number;
  description: string;
  timestamp: string;
  status: string;
}

export interface RiskProfile {
  id: string;
  name: string;
  description: string;
  max_bet_percentage: number;
  kelly_multiplier: number;
  min_confidence: number;
}

export interface ActiveBet {
  id: string;
  event: string;
  market: string;
  selection: string;
  odds: number;
  stake: number;
  potential_return: number;
  status: string;
  placed_at: string;
}

// ============================================================================
// API SERVICE CLASS;
// ============================================================================

class EnhancedApiService {
  private api: AxiosInstance;
  private baseURL: string;
  private retryAttempts: number = 3;
  private retryDelay: number = 1000;

  constructor() {
    // Get API base URL from environment or use default;
    this.baseURL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

    // Create axios instance with enhanced configuration;
    this.api = axios.create({
      baseURL: this.baseURL,
      timeout: 30000, // 30 second timeout;
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    });

    // Setup request interceptor;
    this.api.interceptors.request.use(
      config => {
        // console statement removed} ${config.url}`);
        return config;
      },
      error => {
        // console statement removed
        return Promise.reject(error);
      }
    );

    // Setup response interceptor with retry logic;
    this.api.interceptors.response.use(
      response => {
        // console statement removed
        return response;
      },
      async error => {
        // console statement removed

        // Implement retry logic for certain errors;
        if (this.shouldRetry(error) && error.config && !error.config._retry) {
          error.config._retry = true;
          error.config._retryCount = (error.config._retryCount || 0) + 1;

          if (error.config._retryCount <= this.retryAttempts) {
            // console statement removed`);
            await this.delay(this.retryDelay * error.config._retryCount);
            return this.api.request(error.config);
          }
        }

        return Promise.reject(error);
      }
    );
  }

  // ============================================================================
  // UTILITY METHODS;
  // ============================================================================

  private shouldRetry(error: any): boolean {
    // Retry on network errors, timeouts, and 5xx server errors;
    return (
      !error.response ||
      error.code === 'NETWORK_ERROR' ||
      error.code === 'TIMEOUT' ||
      (error.response.status >= 500 && error.response.status < 600)
    );
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private handleApiError(error: any, context: string): never {
    // console statement removed
    const message = error?.message || 'Unknown error';
    const status = error?.response?.status || 'N/A';
    throw new Error(`${context} failed: ${message} (Status: ${status})`);
  }

  // ============================================================================
  // PREDICTION ENDPOINTS;
  // ============================================================================

  async getPrediction(request: PredictionRequest): Promise<PredictionResponse> {
    try {
      const response: AxiosResponse<PredictionResponse> = await this.api.post(
        '/api/v2/predict',
        request
      );
      return response.data;
    } catch (error) {
      this.handleApiError(error, 'Prediction request');
    }
  }

  async getModelStatus(): Promise<any> {
    try {
      const response: AxiosResponse<any> = await this.api.get('/api/v2/model-status');
      return response.data;
    } catch (error) {
      this.handleApiError(error, 'Model status request');
    }
  }

  // ============================================================================
  // BETTING OPPORTUNITIES;
  // ============================================================================

  async getBettingOpportunities(sport?: string, limit: number = 10): Promise<BettingOpportunity[]> {
    try {
      const params = new URLSearchParams();
      if (sport) params.append('sport', sport);
      params.append('limit', limit.toString());
      const response: AxiosResponse<BettingOpportunity[]> = await this.api.get(
        `/api/betting-opportunities?${params.toString()}`
      );
      return response.data;
    } catch (error) {
      this.handleApiError(error, 'Betting opportunities request');
    }
  }

  async getArbitrageOpportunities(limit: number = 5): Promise<ArbitrageOpportunity[]> {
    try {
      const response: AxiosResponse<ArbitrageOpportunity[]> = await this.api.get(
        `/api/arbitrage-opportunities?limit=${limit}`
      );
      return response.data;
    } catch (error) {
      this.handleApiError(error, 'Arbitrage opportunities request');
    }
  }

  // ============================================================================
  // BANKROLL MANAGEMENT;
  // ============================================================================

  async getTransactions(): Promise<{ transactions: Transaction[]; total_count: number }> {
    try {
      const response: AxiosResponse<{ transactions: Transaction[]; total_count: number }> =
        await this.api.get('/api/v2/transactions');
      return response.data;
    } catch (error) {
      this.handleApiError(error, 'Transactions request');
    }
  }

  async getRiskProfiles(): Promise<{ profiles: RiskProfile[] }> {
    try {
      const response: AxiosResponse<{ profiles: RiskProfile[] }> =
        await this.api.get('/api/v2/risk-profiles');
      return response.data;
    } catch (error) {
      this.handleApiError(error, 'Risk profiles request');
    }
  }

  async getActiveBets(): Promise<{ active_bets: ActiveBet[]; total_count: number }> {
    try {
      const response: AxiosResponse<{ active_bets: ActiveBet[]; total_count: number }> =
        await this.api.get('/api/v2/active-bets');
      return response.data;
    } catch (error) {
      this.handleApiError(error, 'Active bets request');
    }
  }

  // ============================================================================
  // SYSTEM HEALTH;
  // ============================================================================

  async getHealthStatus(): Promise<any> {
    try {
      const response: AxiosResponse<any> = await this.api.get('/api/v2/health');
      return response.data;
    } catch (error) {
      this.handleApiError(error, 'Health check request');
    }
  }

  async getPredictionEngineHealth(): Promise<any> {
    try {
      const response: AxiosResponse<any> = await this.api.get('/api/v2/prediction-engine-health');
      return response.data;
    } catch (error) {
      this.handleApiError(error, 'Prediction engine health check');
    }
  }

  // ============================================================================
  // REAL-TIME FEATURES;
  // ============================================================================

  async subscribeToUpdates(callback: (data: any) => void): Promise<WebSocket | null> {
    try {
      // TODO: Replace with actual WebSocket URL - currently disabled
      // const ws = new WebSocket('ws://example.com');

      // Return null to indicate WebSocket not available
      // This prevents the "WebSocket closed without opened" error
      console.warn('WebSocket subscriptions not implemented yet - returning null');
      return null;

      /* WebSocket implementation disabled until proper URL is configured
      const ws = new WebSocket('ws://example.com');

      ws.onopen = () => {
        console.log('WebSocket connected for updates');
      };

      ws.onmessage = event => {
        try {
          const data = JSON.parse(event.data);
          callback(data);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      ws.onerror = error => {
        console.error('WebSocket error:', error);
      };

      ws.onclose = (event) => {
        console.log('WebSocket closed:', event.code, event.reason);
      };

      return ws;
      */
    } catch (error) {
      console.error('Failed to create WebSocket subscription:', error);
      return null;
    }
  }

  // ============================================================================
  // BATCH OPERATIONS;
  // ============================================================================

  async getBatchPredictions(requests: PredictionRequest[]): Promise<PredictionResponse[]> {
    try {
      // TODO: Implement actual batch prediction logic
      const results: any[] = [];
      return results
        .filter(
          (result): result is PromiseFulfilledResult<PredictionResponse> =>
            result.status === 'fulfilled'
        )
        .map(result => result.value);
    } catch (error) {
      this.handleApiError(error, 'Batch predictions request');
    }
  }

  // ============================================================================
  // ANALYTICS AND REPORTING;
  // ============================================================================

  async getPerformanceMetrics(timeframe: string = '7d'): Promise<any> {
    try {
      const response: AxiosResponse<any> = await this.api.get(
        `/api/v2/performance-metrics?timeframe=${timeframe}`
      );
      return response.data;
    } catch (error) {
      // Production error handling - no mock data fallbacks;
      // console statement removed
      throw new Error('Performance metrics unavailable. Please try again later.');
    }
  }

  async getMarketAnalytics(sport?: string): Promise<any> {
    try {
      const response: AxiosResponse<any> = await this.api.get(
        `/api/v2/market-analytics${sport ? `?sport=${sport}` : ''}`
      );
      return response.data;
    } catch (error) {
      // Production error handling - no mock data fallbacks;
      // console statement removed
      throw new Error('Market analytics unavailable. Please try again later.');
    }
  }
}

// ============================================================================
// SINGLETON EXPORT;
// ============================================================================

export const apiService = new EnhancedApiService();
export default apiService;
