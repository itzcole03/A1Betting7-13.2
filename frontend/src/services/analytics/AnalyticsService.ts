/**
 * Analytics API Service
 * Provides methods to interact with the analytics endpoints
 * Following clean architecture principles with proper error handling
 */

import {
  AnalyticsHealthResponse,
  ApiError,
  CrossSportInsightsResponse,
  DashboardSummaryResponse,
  EnsemblePerformanceReport,
  EnsemblePredictionRequest,
  EnsemblePredictionResponse,
  ModelDetailedPerformance,
  ModelPerformanceResponse,
  PerformanceAlertsResponse,
} from '../../types/analytics';
import { _apiClient } from '../api/client';

class AnalyticsApiService {
  private readonly baseUrl = '/analytics';
  private readonly defaultTimeout = 30000;

  /**
   * Check analytics services health
   */
  async checkHealth(): Promise<AnalyticsHealthResponse> {
    try {
      const response = await _apiClient.get<AnalyticsHealthResponse>(`${this.baseUrl}/health`, {
        timeout: this.defaultTimeout,
      });
      return response.data;
    } catch (error) {
      throw this.handleError('Failed to check analytics health', error);
    }
  }

  /**
   * Get performance metrics for all models
   */
  async getAllModelsPerformance(sport?: string): Promise<ModelPerformanceResponse> {
    try {
      const params = sport ? { sport } : undefined;
      const response = await _apiClient.get<ModelPerformanceResponse>(
        `${this.baseUrl}/performance/models`,
        { params, timeout: this.defaultTimeout }
      );
      return response.data;
    } catch (error) {
      throw this.handleError('Failed to fetch models performance', error);
    }
  }

  /**
   * Get detailed performance metrics for a specific model
   */
  async getModelPerformance(
    modelName: string,
    sport: string,
    days: number = 7
  ): Promise<ModelDetailedPerformance> {
    try {
      const response = await _apiClient.get<ModelDetailedPerformance>(
        `${this.baseUrl}/performance/models/${encodeURIComponent(modelName)}/${encodeURIComponent(
          sport
        )}`,
        { params: { days: days.toString() }, timeout: this.defaultTimeout }
      );
      return response.data;
    } catch (error) {
      throw this.handleError(`Failed to fetch performance for ${modelName}`, error);
    }
  }

  /**
   * Get performance degradation alerts
   */
  async getPerformanceAlerts(threshold: number = 0.1): Promise<PerformanceAlertsResponse> {
    try {
      const response = await _apiClient.get<PerformanceAlertsResponse>(
        `${this.baseUrl}/performance/alerts`,
        { params: { threshold: threshold.toString() }, timeout: this.defaultTimeout }
      );
      return response.data;
    } catch (error) {
      throw this.handleError('Failed to fetch performance alerts', error);
    }
  }

  /**
   * Generate ensemble prediction using multiple models
   */
  async generateEnsemblePrediction(
    request: EnsemblePredictionRequest
  ): Promise<EnsemblePredictionResponse> {
    try {
      const response = await _apiClient.post<EnsemblePredictionResponse>(
        `${this.baseUrl}/ensemble/predict`,
        request,
        { timeout: this.defaultTimeout }
      );
      return response.data;
    } catch (error) {
      throw this.handleError('Failed to generate ensemble prediction', error);
    }
  }

  /**
   * Get comprehensive ensemble performance report
   */
  async getEnsemblePerformanceReport(sport?: string): Promise<EnsemblePerformanceReport> {
    try {
      const params = sport ? { sport } : undefined;
      const response = await _apiClient.get<EnsemblePerformanceReport>(
        `${this.baseUrl}/ensemble/report`,
        { params, timeout: this.defaultTimeout }
      );
      return response.data;
    } catch (error) {
      throw this.handleError('Failed to fetch ensemble performance report', error);
    }
  }

  /**
   * Analyze cross-sport patterns and correlations
   */
  async getCrossSportInsights(days: number = 30): Promise<CrossSportInsightsResponse> {
    try {
      const response = await _apiClient.get<CrossSportInsightsResponse>(
        `${this.baseUrl}/cross-sport/insights`,
        { params: { days: days.toString() }, timeout: this.defaultTimeout }
      );
      return response.data;
    } catch (error) {
      throw this.handleError('Failed to fetch cross-sport insights', error);
    }
  }

  /**
   * Get summary data for analytics dashboard
   */
  async getDashboardSummary(): Promise<DashboardSummaryResponse> {
    try {
      const response = await _apiClient.get<DashboardSummaryResponse>(
        `${this.baseUrl}/dashboard/summary`,
        { timeout: this.defaultTimeout }
      );
      return response.data;
    } catch (error) {
      throw this.handleError('Failed to fetch dashboard summary', error);
    }
  }

  /**
   * Record a model prediction for performance tracking
   */
  async recordModelPrediction(request: {
    model_name: string;
    sport: string;
    prediction_value: number;
    actual_value?: number;
    confidence?: number;
    metadata?: Record<string, any>;
  }): Promise<{ status: string; message: string; timestamp: string }> {
    try {
      const response = await _apiClient.post<{
        status: string;
        message: string;
        timestamp: string;
      }>(`${this.baseUrl}/performance/record`, request, { timeout: this.defaultTimeout });
      return response.data;
    } catch (error) {
      throw this.handleError('Failed to record model prediction', error);
    }
  }

  /**
   * Update performance metrics for a specific model
   */
  async updateModelPerformance(request: {
    model_name: string;
    sport: string;
    metrics: Record<string, number>;
  }): Promise<{ status: string; message: string; timestamp: string }> {
    try {
      const response = await _apiClient.post<{
        status: string;
        message: string;
        timestamp: string;
      }>(`${this.baseUrl}/performance/update`, request, { timeout: this.defaultTimeout });
      return response.data;
    } catch (error) {
      throw this.handleError('Failed to update model performance', error);
    }
  }

  /**
   * Handle API errors with proper error formatting
   */
  private handleError(message: string, error: unknown): ApiError {
    console.error(`AnalyticsApiService Error: ${message}`, error);

    if (error && typeof error === 'object' && 'status' in error) {
      const apiError = error as ApiError;
      return {
        message: `${message}: ${apiError.message}`,
        status: apiError.status,
        details: apiError.details,
      };
    }

    if (error instanceof Error) {
      return {
        message: `${message}: ${error.message}`,
        status: 500,
        details: error,
      };
    }

    return {
      message: `${message}: Unknown error occurred`,
      status: 500,
      details: error,
    };
  }

  /**
   * Retry wrapper for network requests
   */
  private async withRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000
  ): Promise<T> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        if (attempt === maxRetries) {
          throw error;
        }

        // Only retry on network errors or 5xx status codes
        const shouldRetry =
          !error ||
          (typeof error === 'object' && 'status' in error && (error as ApiError).status >= 500);

        if (!shouldRetry) {
          throw error;
        }

        // Exponential backoff
        const delay = baseDelay * Math.pow(2, attempt - 1);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw new Error('Max retries exceeded');
  }

  /**
   * Get analytics data with caching support
   */
  async getWithCache<T>(
    key: string,
    fetcher: () => Promise<T>,
    cacheDuration: number = 5 * 60 * 1000 // 5 minutes default
  ): Promise<T> {
    const cached = this.getFromCache<T>(key);
    if (cached && this.isCacheValid(key, cacheDuration)) {
      return cached;
    }

    const data = await this.withRetry(fetcher);
    this.setCache(key, data);
    return data;
  }

  /**
   * Simple in-memory cache implementation
   */
  private cache = new Map<string, { data: any; timestamp: number }>();

  private getFromCache<T>(key: string): T | null {
    const cached = this.cache.get(key);
    return cached ? cached.data : null;
  }

  private setCache<T>(key: string, data: T): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  private isCacheValid(key: string, duration: number): boolean {
    const cached = this.cache.get(key);
    if (!cached) return false;
    return Date.now() - cached.timestamp < duration;
  }

  /**
   * Clear all cached data
   */
  clearCache(): void {
    this.cache.clear();
  }
}

// Export singleton instance
export const analyticsApiService = new AnalyticsApiService();

// Export individual methods for convenience
export const {
  checkHealth,
  getAllModelsPerformance,
  getModelPerformance,
  getPerformanceAlerts,
  generateEnsemblePrediction,
  getEnsemblePerformanceReport,
  getCrossSportInsights,
  getDashboardSummary,
  recordModelPrediction,
  updateModelPerformance,
} = analyticsApiService;
