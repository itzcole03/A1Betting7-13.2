/**
 * Enhanced Service Client for Peak Functionality
 * Integrates with all new backend services: ML predictions, real-time data, user auth, bankroll management
 */

// Enhanced API Types
export interface APIResponse<T> {
  success: boolean;
  data: T | null;
  error: string | null;
}

export interface EnhancedUser {
  user_id: string;
  email: string;
  first_name: string;
  last_name: string;
  preferences: UserPreferences;
}

export interface UserPreferences {
  favorite_sports?: string[];
  risk_tolerance?: 'low' | 'medium' | 'high';
  bankroll_percentage?: number;
  notification_settings?: {
    email_alerts: boolean;
    push_notifications: boolean;
    arbitrage_alerts: boolean;
  };
}

export interface SessionData {
  access_token: string;
  refresh_token: string;
  expires_at: string;
  user: EnhancedUser;
}

export interface PredictionRequest {
  sport: string;
  features: Record<string, any>;
  include_explanation?: boolean;
}

export interface EnhancedPrediction {
  prediction: number;
  confidence: number;
  ensemble_size: number;
  sport: string;
  explanation?: {
    model_breakdown: Record<string, number>;
    ensemble_weights: Record<string, number>;
    feature_importance: Record<string, any>;
  };
  timestamp: string;
}

export interface BettingOpportunity {
  bet_id: string;
  sport: string;
  game: string;
  bet_type: string;
  description: string;
  odds: number;
  probability: number;
  expected_value: number;
  recommended_stake: number;
  confidence: number;
  risk_level: string;
  reasoning: string;
}

export interface BankrollStatus {
  current_balance: number;
  total_wagered: number;
  total_won: number;
  net_profit: number;
  roi: number;
  win_rate: number;
  avg_bet_size: number;
  largest_win: number;
  largest_loss: number;
  last_updated: string;
}

export interface RiskMetrics {
  sharpe_ratio: number;
  max_drawdown: number;
  volatility: number;
  var_95: number;
  kelly_percentage: number;
  risk_score: number;
  diversification_ratio: number;
}

export interface PortfolioOptimization {
  recommended_allocations: Record<string, number>;
  expected_return: number;
  expected_volatility: number;
  sharpe_ratio: number;
  max_allocation_per_bet: number;
  total_allocation: number;
}

class EnhancedServiceClient {
  private baseURL: string;
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private wsConnection: WebSocket | null = null;

  constructor() {
    // Use the same base URL as existing services
    // Use Vite environment variables directly
    const getEnvVar = (key: string, fallback: string) => {
      if (typeof import.meta !== 'undefined' && import.meta.env) {
        return import.meta.env[key] || fallback;
      }
      return fallback;
    };
    this.baseURL = getEnvVar('VITE_API_BASE_URL', 'http://localhost:8000');

    // Load stored tokens
    this.loadStoredTokens();
  }

  private loadStoredTokens() {
    try {
      this.accessToken = localStorage.getItem('access_token');
      this.refreshToken = localStorage.getItem('refresh_token');
    } catch (error) {
      console.warn('Failed to load stored tokens:', error);
    }
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<APIResponse<T>> {
    try {
      const url = `${this.baseURL}${endpoint}`;

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(options.headers as Record<string, string>),
      };

      // Add authorization header if token is available
      if (this.accessToken) {
        headers['Authorization'] = `Bearer ${this.accessToken}`;
      }

      const response = await fetch(url, {
        ...options,
        headers,
      });

      // Handle token refresh if needed
      if (response.status === 401 && this.refreshToken) {
        const refreshed = await this.refreshAccessToken();
        if (refreshed) {
          // Retry the request with new token
          headers['Authorization'] = `Bearer ${this.accessToken}`;
          const retryResponse = await fetch(url, {
            ...options,
            headers,
          });
          return this.handleResponse<T>(retryResponse);
        }
      }

      return this.handleResponse<T>(response);
    } catch (error) {
      console.error(`API request failed for ${endpoint}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
        data: null,
      };
    }
  }

  private async handleResponse<T>(response: Response): Promise<APIResponse<T>> {
    try {
      const data = await response.json();

      if (response.ok) {
        return {
          success: true,
          data: data as T,
          error: null,
        };
      } else {
        return {
          success: false,
          error: data.error || `HTTP ${response.status}`,
          data: null,
        };
      }
    } catch (error) {
      return {
        success: false,
        error: 'Failed to parse response',
        data: null,
      };
    }
  }

  // Authentication Methods
  async register(userData: {
    email: string;
    password: string;
    first_name: string;
    last_name: string;
    preferences?: UserPreferences;
  }): Promise<APIResponse<{ user: EnhancedUser; message: string }>> {
    return this.makeRequest('/api/v1/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async login(credentials: {
    email: string;
    password: string;
  }): Promise<APIResponse<{ session: SessionData; message: string }>> {
    const result = await this.makeRequest<{ session: SessionData; message: string }>(
      '/api/v1/auth/login',
      {
        method: 'POST',
        body: JSON.stringify(credentials),
      }
    );

    if (result.success && result.data?.session) {
      this.accessToken = result.data.session.access_token;
      this.refreshToken = result.data.session.refresh_token;

      // Store tokens
      try {
        if (this.accessToken && this.refreshToken) {
          localStorage.setItem('access_token', this.accessToken);
          localStorage.setItem('refresh_token', this.refreshToken);
        }
      } catch (error) {
        console.warn('Failed to store tokens:', error);
      }
    }

    return result;
  }

  async logout(): Promise<APIResponse<{ message: string }>> {
    const result = await this.makeRequest<{ message: string }>('/api/v1/auth/logout', {
      method: 'POST',
    });

    // Clear tokens regardless of response
    this.accessToken = null;
    this.refreshToken = null;
    try {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
    } catch (error) {
      console.warn('Failed to clear tokens:', error);
    }

    return result;
  }

  async refreshAccessToken(): Promise<boolean> {
    if (!this.refreshToken) return false;

    try {
      const result = await this.makeRequest<{ session: SessionData }>('/api/v1/auth/refresh', {
        method: 'POST',
        body: JSON.stringify({ refresh_token: this.refreshToken }),
      });

      if (result.success && result.data?.session) {
        this.accessToken = result.data.session.access_token;
        this.refreshToken = result.data.session.refresh_token;

        try {
          if (this.accessToken && this.refreshToken) {
            localStorage.setItem('access_token', this.accessToken);
            localStorage.setItem('refresh_token', this.refreshToken);
          }
        } catch (error) {
          console.warn('Failed to store refreshed tokens:', error);
        }

        return true;
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
    }

    return false;
  }

  // Enhanced ML Prediction Methods
  async getEnhancedPrediction(
    request: PredictionRequest
  ): Promise<APIResponse<EnhancedPrediction>> {
    return this.makeRequest('/api/v1/predictions/enhanced', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async getModelPerformance(): Promise<APIResponse<{ performance: any; timestamp: string }>> {
    return this.makeRequest('/api/v1/predictions/model-performance');
  }

  // Real-Time Betting Opportunities
  async getBettingOpportunities(filters?: {
    sport?: string;
    min_confidence?: number;
    max_risk?: string;
  }): Promise<
    APIResponse<{
      opportunities: BettingOpportunity[];
      total_count: number;
      filters_applied: any;
      last_updated: string;
    }>
  > {
    const params = new URLSearchParams();
    if (filters?.sport) params.append('sport', filters.sport);
    if (filters?.min_confidence) params.append('min_confidence', filters.min_confidence.toString());
    if (filters?.max_risk) params.append('max_risk', filters.max_risk);

    return this.makeRequest(`/api/v1/realtime/betting-opportunities?${params.toString()}`);
  }

  // Bankroll Management Methods
  async getBankrollStatus(): Promise<
    APIResponse<{ bankroll_status: BankrollStatus; timestamp: string }>
  > {
    return this.makeRequest('/api/v1/bankroll/status');
  }

  async getRiskMetrics(): Promise<APIResponse<{ risk_metrics: RiskMetrics; timestamp: string }>> {
    return this.makeRequest('/api/v1/bankroll/risk-metrics');
  }

  async optimizePortfolio(request: {
    max_allocation?: number;
    risk_tolerance?: string;
    sports_filter?: string[];
  }): Promise<APIResponse<{ portfolio_optimization: PortfolioOptimization; timestamp: string }>> {
    return this.makeRequest('/api/v1/bankroll/optimize-portfolio', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async calculateKellyCriterion(
    probability: number,
    odds: number
  ): Promise<APIResponse<{ kelly_calculation: any; timestamp: string }>> {
    return this.makeRequest('/api/v1/bankroll/calculate-kelly', {
      method: 'POST',
      body: JSON.stringify({ probability, odds }),
    });
  }

  // User Profile Methods
  async getUserProfile(): Promise<
    APIResponse<{
      profile: EnhancedUser;
      analytics: any;
    }>
  > {
    return this.makeRequest('/api/v1/user/profile');
  }

  async updateUserPreferences(
    preferences: UserPreferences
  ): Promise<APIResponse<{ message: string }>> {
    return this.makeRequest('/api/v1/user/preferences', {
      method: 'PUT',
      body: JSON.stringify(preferences),
    });
  }

  // Enhanced Sport Data
  async getEnhancedSportData(sport: string): Promise<
    APIResponse<{
      sport: string;
      enhanced_data: any[];
      count: number;
      timestamp: string;
    }>
  > {
    return this.makeRequest(`/api/v1/sports/${sport}/enhanced-data`);
  }

  // System Health
  async getSystemHealth(): Promise<
    APIResponse<{
      status: string;
      timestamp: string;
      services: Record<string, string>;
      version: string;
    }>
  > {
    return this.makeRequest('/api/v1/system/health');
  }

  // WebSocket Connection for Real-Time Updates
  connectWebSocket(clientId: string): Promise<WebSocket> {
    return new Promise((resolve, reject) => {
      try {
        const wsURL = this.baseURL.replace('http', 'ws') + `/api/v1/ws/${clientId}`;
        this.wsConnection = new WebSocket(wsURL);

        this.wsConnection.onopen = () => {
          console.log('WebSocket connected for real-time updates');
          resolve(this.wsConnection!);
        };

        this.wsConnection.onerror = error => {
          console.error('WebSocket connection error:', error);
          reject(error);
        };

        this.wsConnection.onclose = () => {
          console.log('WebSocket connection closed');
          this.wsConnection = null;
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  disconnectWebSocket() {
    if (this.wsConnection) {
      this.wsConnection.close();
      this.wsConnection = null;
    }
  }

  // Authentication status
  isAuthenticated(): boolean {
    return !!this.accessToken;
  }

  getCurrentUser(): EnhancedUser | null {
    if (!this.isAuthenticated()) return null;

    try {
      // Try to get user from stored session data
      const userData = localStorage.getItem('current_user');
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.warn('Failed to get current user:', error);
      return null;
    }
  }
}

// Create and export singleton instance
export const enhancedServiceClient = new EnhancedServiceClient();

// Also export the class for testing
export default EnhancedServiceClient;
