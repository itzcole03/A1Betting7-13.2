/**
 * Typed API Client for A1Betting Platform
 * 
 * Generated from backend routes and OpenAPI schema
 * Provides full type safety for all API interactions
 */

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

// ===== RESPONSE TYPES =====

// Standard API Response wrapper (matching backend ResponseBuilder pattern)
export interface StandardAPIResponse<T = unknown> {
  success: boolean;
  data: T;
  message?: string;
  timestamp?: string;
  correlation_id?: string;
}

// Error response type
export interface APIErrorResponse {
  success: false;
  error: string;
  details?: string;
  code?: string;
  timestamp?: string;
  correlation_id?: string;
}

// Health check types
export interface HealthResponse {
  status: string;
  timestamp: string;
  version: string;
  domains: Record<string, { status: string }>;
  infrastructure: {
    database: { status: string; optimized_schema: boolean };
    cache: { status: string; hit_rate_percent: number };
    performance: { memory_usage_mb: number; cpu_usage_percent: number };
  };
}

// Sports and Props types
export interface SportsProp {
  id: string;
  player: {
    id: string;
    name: string;
    team: string;
    position?: string;
  };
  prop_type: string;
  line_score: number;
  over_odds: number;
  under_odds: number;
  sportsbook: string;
  game_date: string;
  sport: 'MLB' | 'NBA' | 'NFL' | 'NHL';
  game_info?: {
    home_team: string;
    away_team: string;
    game_id: string;
  };
}

export interface ComprehensiveProp extends SportsProp {
  advanced_metrics?: {
    xStats: Record<string, number>;
    trend_analysis: string;
    confidence_score: number;
  };
  ml_analysis?: {
    prediction: 'over' | 'under';
    confidence: number;
    expected_value: number;
    kelly_percentage: number;
  };
}

export interface MLBGame {
  game_id: string;
  home_team: string;
  away_team: string;
  game_date: string;
  status: 'scheduled' | 'live' | 'final' | 'postponed';
  scores?: {
    home: number;
    away: number;
  };
}

export interface PredictionRequest {
  player_name: string;
  sport: 'MLB' | 'NBA' | 'NFL' | 'NHL';
  prop_type: string;
  line_score: number;
  game_date?: string;
  opponent?: string;
}

export interface PredictionResponse {
  prediction_id: string;
  player_name: string;
  sport: string;
  prop_type: string;
  line_score: number;
  prediction: {
    recommended_bet: 'over' | 'under';
    confidence: number;
    probability: number;
    expected_value: number;
  };
  model_info: {
    model_type: string;
    version: string;
    accuracy: number;
  };
  explanation: {
    reasoning: string;
    key_factors: Array<{
      factor: string;
      impact: number;
      value: string;
    }>;
  };
  betting_recommendation: {
    kelly_percentage: number;
    suggested_unit_size: number;
    expected_roi: string;
    risk_level: string;
  };
}

// Modern ML types
export interface MLModelInfo {
  model_id: string;
  model_type: string;
  version: string;
  accuracy: number;
  status: 'active' | 'training' | 'deprecated';
}

export interface MLStrategy {
  strategy_id: string;
  name: string;
  description: string;
  active: boolean;
  parameters: Record<string, unknown>;
}

// Notification types
export interface NotificationStats {
  active_connections: number;
  total_sent: number;
  pending_notifications: number;
  last_updated: string;
}

// ===== API CLIENT CONFIGURATION =====

export interface TypedAPIClientConfig {
  baseURL: string;
  timeout: number;
  retryAttempts: number;
  enableAuth: boolean;
  enableRequestCorrelation: boolean;
}

export const DEFAULT_API_CONFIG: TypedAPIClientConfig = {
  baseURL: 'http://localhost:8000',
  timeout: 10000,
  retryAttempts: 3,
  enableAuth: true,
  enableRequestCorrelation: true,
};

// ===== MAIN API CLIENT =====

export class TypedAPIClient {
  private client: AxiosInstance;
  private config: TypedAPIClientConfig;

  constructor(config: Partial<TypedAPIClientConfig> = {}) {
    this.config = { ...DEFAULT_API_CONFIG, ...config };
    this.client = this.createAxiosInstance();
  }

  private createAxiosInstance(): AxiosInstance {
    const instance = axios.create({
      baseURL: this.config.baseURL,
      timeout: this.config.timeout,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor
    instance.interceptors.request.use(
      (config) => {
        // Add auth token if available
        if (this.config.enableAuth) {
          const token = localStorage.getItem('auth_token');
          if (token) {
            config.headers = config.headers || {};
            config.headers.Authorization = `Bearer ${token}`;
          }
        }

        // Add request correlation ID
        if (this.config.enableRequestCorrelation) {
          config.headers = config.headers || {};
          config.headers['X-Request-ID'] = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        }

        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor
    instance.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        // Retry logic for failed requests
        if (
          error.response?.status >= 500 &&
          originalRequest._retryCount < this.config.retryAttempts
        ) {
          originalRequest._retryCount = (originalRequest._retryCount || 0) + 1;
          const delay = Math.pow(2, originalRequest._retryCount) * 1000;
          await new Promise(resolve => setTimeout(resolve, delay));
          return instance(originalRequest);
        }

        return Promise.reject(error);
      }
    );

    return instance;
  }

  // ===== UTILITY METHODS =====

  private async request<T>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig
  ): Promise<T> {
    const response: AxiosResponse<StandardAPIResponse<T>> = await this.client.request({
      method,
      url,
      data,
      ...config,
    });

    if (response.data.success) {
      return response.data.data;
    } else {
      throw new Error(response.data.message || 'API request failed');
    }
  }

  // ===== HEALTH & STATUS ENDPOINTS =====

  async getHealth(): Promise<HealthResponse> {
    return this.request<HealthResponse>('GET', '/health');
  }

  async getAPIHealth(): Promise<{ status: string }> {
    return this.request<{ status: string }>('GET', '/api/health');
  }

  async getVersion(): Promise<{ version: string }> {
    return this.request<{ version: string }>('GET', '/api/version');
  }

  // ===== SPORTS ACTIVATION =====

  async activateSport(sport: 'MLB' | 'NBA' | 'NFL' | 'NHL'): Promise<{ status: string; sport: string }> {
    return this.request<{ status: string; sport: string }>('POST', `/api/sports/activate/${sport}`);
  }

  async activateSportV2(): Promise<{ status: string }> {
    return this.request<{ status: string }>('POST', '/api/v2/sports/activate');
  }

  // ===== MLB ENDPOINTS =====

  async getMLBTodaysGames(): Promise<MLBGame[]> {
    return this.request<MLBGame[]>('GET', '/mlb/todays-games');
  }

  async getMLBComprehensiveProps(gameId: string, optimizePerformance = false): Promise<{
    status: string;
    game_id: string;
    props: ComprehensiveProp[];
    summary: {
      total_props: number;
      high_confidence_props: number;
      unique_players: number;
    };
  }> {
    const params = optimizePerformance ? '?optimize_performance=true' : '';
    return this.request('GET', `/mlb/comprehensive-props/${gameId}${params}`);
  }

  async getMLBPrizePicksProps(): Promise<SportsProp[]> {
    return this.request<SportsProp[]>('GET', '/mlb/prizepicks-props');
  }

  async getMLBLiveGameStats(gameId: string): Promise<{
    game_info: MLBGame;
    live_stats: Record<string, unknown>;
    last_updated: string;
  }> {
    return this.request('GET', `/mlb/live-game-stats/${gameId}`);
  }

  async getMLBPlayByPlay(gameId: string): Promise<{
    game_id: string;
    events: Array<{
      inning: number;
      inning_half: string;
      description: string;
      timestamp: string;
      away_score: number;
      home_score: number;
    }>;
  }> {
    return this.request('GET', `/mlb/play-by-play/${gameId}`);
  }

  // ===== PREDICTIONS & ANALYTICS =====

  async getPredictions(): Promise<PredictionResponse[]> {
    return this.request<PredictionResponse[]>('GET', '/api/predictions');
  }

  async createPrediction(request: PredictionRequest): Promise<PredictionResponse> {
    return this.request<PredictionResponse>('POST', '/api/predictions', request);
  }

  async getAnalytics(): Promise<{
    system_performance: {
      avg_response_time_ms: number;
      requests_per_minute: number;
      error_rate_percent: number;
      uptime_percent: number;
    };
    model_performance: {
      ensemble_accuracy: number;
      predictions_today: number;
      successful_predictions: number;
    };
    user_metrics: {
      active_users: number;
      total_predictions_requested: number;
    };
  }> {
    return this.request('GET', '/api/analytics');
  }

  // ===== MODERN ML ENDPOINTS =====

  async getMLHealth(): Promise<{
    status: string;
    models_loaded: number;
    available_strategies: string[];
    system_info: Record<string, unknown>;
  }> {
    return this.request('GET', '/api/modern-ml/health');
  }

  async getMLModels(): Promise<MLModelInfo[]> {
    return this.request<MLModelInfo[]>('GET', '/api/modern-ml/models');
  }

  async getMLStrategies(): Promise<MLStrategy[]> {
    return this.request<MLStrategy[]>('GET', '/api/modern-ml/strategies');
  }

  async createMLPrediction(request: {
    features: Record<string, number>;
    sport: string;
    model_type?: string;
  }): Promise<{
    prediction: number;
    confidence: number;
    model_used: string;
    feature_importance: Record<string, number>;
  }> {
    return this.request('POST', '/api/modern-ml/predict', request);
  }

  async getMLPerformance(): Promise<{
    accuracy_metrics: Record<string, number>;
    latency_metrics: Record<string, number>;
    throughput_metrics: Record<string, number>;
    resource_utilization: Record<string, number>;
  }> {
    return this.request('GET', '/api/modern-ml/performance');
  }

  // ===== UNIFIED PROPS ENDPOINTS =====

  async getFeaturedProps(filters?: {
    sport?: string;
    player_name?: string;
    prop_type?: string;
    confidence_threshold?: number;
  }): Promise<SportsProp[]> {
    const config: AxiosRequestConfig = {};
    if (filters) {
      config.params = filters;
    }
    return this.request<SportsProp[]>('POST', '/api/unified/featured-props', filters || {}, config);
  }

  // ===== NOTIFICATION ENDPOINTS =====

  async getNotificationStats(): Promise<NotificationStats> {
    return this.request<NotificationStats>('GET', '/ws/notifications/stats');
  }

  async sendTestNotification(options: {
    notification_type: string;
    title: string;
    message: string;
    priority: number;
  }): Promise<{ status: string; message: string }> {
    const params = new URLSearchParams({
      notification_type: options.notification_type,
      title: options.title,
      message: options.message,
      priority: options.priority.toString(),
    });
    return this.request('POST', `/ws/notifications/test?${params.toString()}`);
  }

  async broadcastSystemAlert(options: {
    title: string;
    message: string;
    priority: number;
  }): Promise<{ status: string; message: string }> {
    const params = new URLSearchParams({
      title: options.title,
      message: options.message,
      priority: options.priority.toString(),
    });
    return this.request('POST', `/ws/notifications/broadcast?${params.toString()}`);
  }

  // ===== PHASE 3 MLOPS ENDPOINTS =====

  async createMLOpsPipeline(pipelineConfig: {
    name: string;
    stages: string[];
    model_config: Record<string, unknown>;
  }): Promise<{ pipeline_id: string; status: string }> {
    return this.request('POST', '/api/phase3/mlops/pipeline/create', pipelineConfig);
  }

  async promoteModel(modelId: string, targetStage: string): Promise<{ status: string; message: string }> {
    return this.request('POST', '/api/phase3/mlops/models/promote', {
      model_id: modelId,
      target_stage: targetStage,
    });
  }

  async deployToProduction(deploymentConfig: {
    model_id: string;
    environment: string;
    scaling_config: Record<string, unknown>;
  }): Promise<{ deployment_id: string; status: string; endpoint_url: string }> {
    return this.request('POST', '/api/phase3/deployment/deploy', deploymentConfig);
  }

  async getMonitoringAlerts(): Promise<{
    active_alerts: number;
    critical_alerts: number;
    recent_alerts: Array<{
      alert_id: string;
      severity: string;
      message: string;
      timestamp: string;
    }>;
  }> {
    return this.request('GET', '/api/phase3/monitoring/alerts');
  }

  async getSecurityAuditLogs(limit = 100): Promise<{
    logs: Array<{
      log_id: string;
      event_type: string;
      user_id: string;
      action: string;
      timestamp: string;
      metadata: Record<string, unknown>;
    }>;
    total_count: number;
  }> {
    return this.request('GET', `/api/phase3/security/audit?limit=${limit}`);
  }
}

// ===== SINGLETON INSTANCE =====

export const typedAPI = new TypedAPIClient();

// ===== HOOKS FOR REACT INTEGRATION =====

export interface UseAPIOptions {
  immediate?: boolean;
  dependencies?: unknown[];
  onSuccess?: (data: unknown) => void;
  onError?: (error: Error) => void;
}
