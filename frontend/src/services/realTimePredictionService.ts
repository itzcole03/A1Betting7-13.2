/**
 * Real-Time Prediction Service
 * PHASE 6: END-TO-END INTEGRATION & TESTING
 *
 * Integrates frontend with Phase 5 Real-Time Prediction Engine API.
 * Provides real-time predictions, confidence scores, and SHAP explanations.
 */

import axios, { AxiosResponse } from 'axios';
import { discoverBackend } from './backendDiscovery';

// Real-time prediction types matching the backend API
export interface RealTimePrediction {
  prop_id: string;
  player_name: string;
  stat_type: string;
  line: number;
  sport: string;
  league: string;
  game_time: string;
  predicted_value: number;
  prediction_probability: number;
  confidence_level: 'very_low' | 'low' | 'medium' | 'high' | 'very_high';
  confidence_score: number;
  primary_model: string;
  ensemble_models: string[];
  model_agreement: number;
  shap_explanation: Record<string, unknown>;
  key_factors: string[];
  reasoning: string;
  expected_value: number;
  risk_score: number;
  recommendation: 'STRONG_BUY' | 'BUY' | 'HOLD' | 'WEAK_SELL' | 'STRONG_SELL';
  prediction_time: string;
  data_freshness: number;
  api_latency: number;
}

export interface SystemHealth {
  status: string;
  models_loaded: number;
  active_predictions: number;
  api_latency_avg: number;
  data_freshness_avg: number;
  error_rate: number;
  last_update: string;
}

export interface PredictionRequest {
  sport?: string;
  limit?: number;
}

export interface ModelInfo {
  model_id: string;
  model_name: string;
  loaded_at: string;
  feature_count: number;
  status: string;
}

export interface PredictionStats {
  total_predictions: number;
  total_api_calls: number;
  total_errors: number;
  uptime_seconds: number;
  models_loaded: number;
  cache_size: number;
  error_rate: number;
  predictions_per_call: number;
  timestamp: string;
}

class RealTimePredictionService {
  private timeout: number;

  constructor() {
    this.timeout = 10000; // 10 seconds timeout
  }

  /**
   * Get backend URL with auto-discovery
   */
  private async getBackendUrl(): Promise<string> {
    const _url = await discoverBackend();
    if (!_url) {
      throw new Error('Backend URL not discovered.');
    }
    return _url;
  }

  /**
   * Get real-time predictions from the Phase 5 prediction engine
   * CRITICAL: Returns only real predictions from trained models
   */
  async getLivePredictions(request: PredictionRequest = {}, userId?: string): Promise<RealTimePrediction[]> {
    try {
      console.log('🎯 Fetching real-time predictions with auto-discovery...');

      const _baseUrl = await this.getBackendUrl();
      console.log(`🔍 Using backend: ${_baseUrl}`);

      const _params = new URLSearchParams();
      if (request.sport) _params.append('sport', request.sport);
      if (request.limit) _params.append('limit', request.limit.toString());

      // Prepare headers
      const _headers: Record<string, string> = {};
      if (userId) _headers['user_id'] = userId;

      // Try enhanced endpoint first (our current working endpoint)
      let _response: AxiosResponse<RealTimePrediction[]>;
      try {
        _response = await axios.get(
          `${_baseUrl}/api/predictions/prizepicks/enhanced?${_params.toString()}`,
          { timeout: this.timeout, headers: _headers }
        );
      } catch (enhancedError) {
        // Fallback to live endpoint
        console.log('🔄 Enhanced endpoint failed, trying live endpoint...');
        _response = await axios.get(
          `${_baseUrl}/api/predictions/prizepicks/live?${_params.toString()}`,
          { timeout: this.timeout, headers: _headers }
        );
      }

      console.log(`✅ Received ${_response.data.length} real-time predictions from ${_baseUrl}`);
      return _response.data;
    } catch (error) {
      console.error('❌ Error fetching live predictions:', error);

      // Force rediscovery on error
      // backendDiscovery.forceRediscovery(); // Removed: not directly exposed, and getBackendUrl() implicitly rediscovers

      throw new Error('Unable to fetch predictions from any available backend');
    }
  }

  /**
   * Get system health and performance metrics
   */
  async getSystemHealth(): Promise<SystemHealth> {
    try {
      const _baseUrl = await this.getBackendUrl();
      const _response: AxiosResponse<SystemHealth> = await axios.get(
        `${_baseUrl}/api/predictions/prizepicks/health`,
        { timeout: this.timeout }
      );

      return _response.data;
    } catch (error) {
      //       console.error('❌ Error fetching system health:', error);
      throw new Error(
        `Failed to fetch system health: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Get detailed explanation for a specific prediction
   */
  async getPredictionExplanation(propId: string): Promise<Record<string, unknown>> {
    try {
      const _baseUrl = await this.getBackendUrl();
      const _response: AxiosResponse<Record<string, unknown>> = await axios.get(
        `${_baseUrl}/api/predictions/prizepicks/explain/${propId}`,
        { timeout: this.timeout }
      );

      return _response.data;
    } catch (error) {
      //       console.error('❌ Error fetching prediction explanation:', error);
      throw new Error(
        `Failed to fetch explanation: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Get information about loaded ML models
   */
  async getLoadedModels(): Promise<{
    models_loaded: number;
    models: ModelInfo[];
    timestamp: string;
  }> {
    try {
      const _baseUrl = await this.getBackendUrl();
      const _response = await axios.get(`${_baseUrl}/api/predictions/prizepicks/models`, {
        timeout: this.timeout,
      });

      return _response.data;
    } catch (error) {
      //       console.error('❌ Error fetching model info:', error);
      throw new Error(
        `Failed to fetch model info: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Get prediction statistics and performance metrics
   */
  async getPredictionStats(): Promise<PredictionStats> {
    try {
      const _baseUrl = await this.getBackendUrl();
      const _response: AxiosResponse<PredictionStats> = await axios.get(
        `${_baseUrl}/api/predictions/prizepicks/stats`,
        { timeout: this.timeout }
      );

      return _response.data;
    } catch (error) {
      //       console.error('❌ Error fetching prediction stats:', error);
      throw new Error(
        `Failed to fetch stats: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Trigger model training in the background
   */
  async triggerModelTraining(): Promise<{ message: string; timestamp: string; status: string }> {
    try {
      const _baseUrl = await this.getBackendUrl();
      const _response = await axios.post(
        `${_baseUrl}/api/predictions/prizepicks/train`,
        {},
        { timeout: this.timeout }
      );

      return _response.data;
    } catch (error) {
      //       console.error('❌ Error triggering model training:', error);
      throw new Error(
        `Failed to trigger training: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Check if the prediction API is available
   */
  async checkApiHealth(): Promise<boolean> {
    try {
      const _baseUrl = await this.getBackendUrl();
      const _response = await axios.get(`${_baseUrl}/health`, { timeout: 5000 });

      return _response.status === 200;
    } catch (error) {
      //       console.warn('⚠️ Prediction API health check failed:', error);
      return false;
    }
  }

  /**
   * Get API root information
   */
  async getApiInfo(): Promise<Record<string, unknown>> {
    try {
      const _baseUrl = await this.getBackendUrl();
      const _response = await axios.get(`${_baseUrl}/`, { timeout: this.timeout });

      return _response.data;
    } catch (error) {
      //       console.error('❌ Error fetching API info:', error);
      throw new Error(
        `Failed to fetch API info: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Helper method to format confidence level for display
   */
  formatConfidenceLevel(level: string): string {
    const _levels = {
      very_low: 'Very Low',
      low: 'Low',
      medium: 'Medium',
      high: 'High',
      very_high: 'Very High',
    };

    return _levels[level as keyof typeof _levels] || level;
  }

  /**
   * Helper method to format recommendation for display
   */
  formatRecommendation(recommendation: string): string {
    const _recommendations = {
      STRONG_BUY: 'Strong Buy',
      BUY: 'Buy',
      HOLD: 'Hold',
      WEAK_SELL: 'Weak Sell',
      STRONG_SELL: 'Strong Sell',
    };

    return _recommendations[recommendation as keyof typeof _recommendations] || recommendation;
  }

  /**
   * Helper method to get confidence color for UI
   */
  getConfidenceColor(level: string): string {
    const _colors = {
      very_low: '#ef4444', // red-500
      low: '#f97316', // orange-500
      medium: '#eab308', // yellow-500
      high: '#22c55e', // green-500
      very_high: '#16a34a', // green-600
    };

    return _colors[level as keyof typeof _colors] || '#6b7280'; // gray-500
  }

  /**
   * Helper method to get recommendation color for UI
   */
  getRecommendationColor(recommendation: string): string {
    const _colors = {
      STRONG_BUY: '#16a34a', // green-600
      BUY: '#22c55e', // green-500
      HOLD: '#eab308', // yellow-500
      WEAK_SELL: '#f97316', // orange-500
      STRONG_SELL: '#ef4444', // red-500
    };

    return _colors[recommendation as keyof typeof _colors] || '#6b7280'; // gray-500
  }
}

// Export singleton instance
export const _realTimePredictionService = new RealTimePredictionService();

// Export default for easier imports
export default _realTimePredictionService;
