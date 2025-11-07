/**
 * Consolidated API Client - Post-Phase 5 Integration
 * 
 * This client integrates with the Phase 5 consolidated backend APIs:
 * - /api/v2/prizepicks/* - Unified PrizePicks integration
 * - /api/v2/ml/* - Machine learning and analytics
 * - /api/v2/admin/* - Administration and security
 * 
 * Features:
 * - Intelligent fallback strategy integration
 * - Type-safe API contracts
 * - Performance monitoring and caching
 * - Error handling with structured responses
 */

import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { API_BASE_URL } from '../config/apiConfig';

// Types for consolidated API responses
interface StandardAPIResponse<T = unknown> {
  success: boolean;
  data: T | null;
  error?: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
  meta?: {
    request_id?: string;
    timestamp?: string;
    version?: string;
  };
}

// Specific types for better type safety
interface PropMetadata {
  last_updated?: string;
  data_source?: string;
  reliability_score?: number;
}

interface PrizePicksProps {
  id: string;
  player_name: string;
  stat_type: string;
  line: number;
  odds: number;
  confidence?: number;
  source: 'enhanced' | 'production' | 'comprehensive' | 'simple';
  metadata?: PropMetadata;
}

interface MLFeatures {
  player_stats?: Record<string, number>;
  team_stats?: Record<string, number>;
  historical_performance?: number[];
  weather_conditions?: Record<string, string | number>;
}

interface MLPrediction {
  id: string;
  prediction: number;
  confidence: number;
  shap_explanation?: Record<string, number>;
  uncertainty_bounds?: {
    lower: number;
    upper: number;
  };
  model_version: string;
  features: MLFeatures;
}

interface AdminHealthStatus {
  overall_status: 'healthy' | 'degraded' | 'unhealthy';
  services: Record<string, {
    status: string;
    last_check: string;
    response_time_ms?: number;
  }>;
  timestamp: string;
}

interface LineupConstraints {
  max_salary?: number;
  required_positions?: string[];
  excluded_players?: string[];
  risk_tolerance?: 'low' | 'medium' | 'high';
}

interface LineupOptimizationResult {
  lineup: string[];
  expected_value: number;
  risk_score: number;
}

interface AdminMetrics {
  request_count: number;
  error_rate: number;
  average_response_time: number;
  active_users: number;
  cache_hit_rate: number;
  ml_model_accuracy?: number;
}

interface UserProfile {
  id: string;
  email: string;
  role: string;
  preferences?: Record<string, unknown>;
  created_at: string;
  last_login?: string;
}

interface AuthResponse {
  access_token: string;
  refresh_token: string;
  user: UserProfile;
}

class ConsolidatedAPIClient {
  private client: AxiosInstance;
  private baseURL: string;
  
  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
    this.client = axios.create({
      baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add request/response interceptors for monitoring
    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Request interceptor for auth
    this.client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('auth_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response: AxiosResponse<StandardAPIResponse>) => {
        return response;
      },
      (error) => {
        return Promise.reject(error);
      }
    );
  }

  // === PRIZEPICKS API METHODS ===

  /**
   * Get PrizePicks props using the consolidated endpoint with intelligent fallback
   */
  async getPrizePicksProps(sport: string = 'MLB'): Promise<PrizePicksProps[]> {
    const response = await this.client.get<StandardAPIResponse<PrizePicksProps[]>>(
      `/api/v2/prizepicks/props`,
      { params: { sport } }
    );

    if (response.data.success && response.data.data) {
      return response.data.data;
    }

    throw new Error(response.data.error?.message || 'Failed to get PrizePicks props');
  }

  /**
   * Optimize lineup using consolidated PrizePicks AI service
   */
  async optimizeLineup(
    props: string[], 
    constraints?: LineupConstraints
  ): Promise<LineupOptimizationResult> {
    const response = await this.client.post<StandardAPIResponse<LineupOptimizationResult>>(
      `/api/v2/prizepicks/lineup/optimize`,
      { prop_ids: props, constraints }
    );

    if (response.data.success && response.data.data) {
      return response.data.data;
    }

    throw new Error(response.data.error?.message || 'Failed to optimize lineup');
  }

  // === MACHINE LEARNING API METHODS ===

  /**
   * Get ML predictions with SHAP explanations from consolidated ML API
   */
  async getMLPredictions(
    sport: string,
    gameIds?: string[]
  ): Promise<MLPrediction[]> {
    const response = await this.client.post<StandardAPIResponse<MLPrediction[]>>(
      `/api/v2/ml/predict`,
      { sport, game_ids: gameIds }
    );

    if (response.data.success && response.data.data) {
      return response.data.data;
    }

    throw new Error(response.data.error?.message || 'Failed to get ML predictions');
  }

  /**
   * Get batch ML predictions for performance optimization
   */
  async getBatchMLPredictions(requests: {
    sport: string;
    player_id: string;
    stat_type: string;
  }[]): Promise<MLPrediction[]> {
    const response = await this.client.post<StandardAPIResponse<MLPrediction[]>>(
      `/api/v2/ml/batch-predict`,
      { requests }
    );

    if (response.data.success && response.data.data) {
      return response.data.data;
    }

    throw new Error(response.data.error?.message || 'Failed to get batch ML predictions');
  }

  // === ADMIN API METHODS ===

  /**
   * Get system health status from consolidated admin API
   */
  async getAdminHealthStatus(): Promise<AdminHealthStatus> {
    const response = await this.client.get<StandardAPIResponse<AdminHealthStatus>>(
      `/api/v2/admin/health/status`
    );

    if (response.data.success && response.data.data) {
      return response.data.data;
    }

    throw new Error(response.data.error?.message || 'Failed to get health status');
  }

  /**
   * Get admin dashboard metrics
   */
  async getAdminMetrics(): Promise<AdminMetrics> {
    const response = await this.client.get<StandardAPIResponse<AdminMetrics>>(
      `/api/v2/admin/metrics/summary`
    );

    if (response.data.success && response.data.data) {
      return response.data.data;
    }

    throw new Error(response.data.error?.message || 'Failed to get admin metrics');
  }

  // === AUTHENTICATION METHODS ===

  /**
   * Authenticate user through consolidated admin API
   */
  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await this.client.post<StandardAPIResponse<AuthResponse>>(
      `/api/v2/admin/auth/login`,
      { email, password }
    );

    if (response.data.success && response.data.data) {
      // Store token for future requests
      localStorage.setItem('auth_token', response.data.data.access_token);
      localStorage.setItem('refresh_token', response.data.data.refresh_token);
      
      return response.data.data;
    }

    throw new Error(response.data.error?.message || 'Authentication failed');
  }

  /**
   * Get current user profile
   */
  async getCurrentUser(): Promise<UserProfile> {
    const response = await this.client.get<StandardAPIResponse<UserProfile>>(
      `/api/v2/admin/users/me`
    );

    if (response.data.success && response.data.data) {
      return response.data.data;
    }

    throw new Error(response.data.error?.message || 'Failed to get user profile');
  }

  // === UTILITY METHODS ===

  /**
   * Test API connectivity and fallback status
   */
  async testConnectivity(): Promise<{
    prizepicks: boolean;
    ml: boolean;
    admin: boolean;
    overall_health: boolean;
  }> {
    const results = {
      prizepicks: false,
      ml: false,
      admin: false,
      overall_health: false,
    };

    try {
      // Test core health endpoint
      await this.client.get('/api/health');
      results.overall_health = true;
    } catch {
      // Health check failed
    }

    try {
      // Test PrizePicks endpoint
      await this.client.get('/api/v2/prizepicks/health');
      results.prizepicks = true;
    } catch {
      // PrizePicks check failed
    }

    try {
      // Test ML endpoint
      await this.client.get('/api/v2/ml/health');
      results.ml = true;
    } catch {
      // ML check failed
    }

    try {
      // Test Admin endpoint
      await this.getAdminHealthStatus();
      results.admin = true;
    } catch {
      // Admin check failed
    }

    return results;
  }
}

// Export singleton instance
export const consolidatedAPIClient = new ConsolidatedAPIClient();
export default consolidatedAPIClient;

// Export types for use in components
export type {
  StandardAPIResponse,
  PrizePicksProps,
  MLPrediction,
  AdminHealthStatus,
  AdminMetrics,
  UserProfile,
  AuthResponse,
  LineupConstraints,
  LineupOptimizationResult,
};
