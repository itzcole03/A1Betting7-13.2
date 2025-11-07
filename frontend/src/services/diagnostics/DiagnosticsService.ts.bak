/**
 * Diagnostics Service - Handles health and reliability endpoint requests
 * Provides structured error handling and validation for diagnostic data
 */

import ApiService from '../unified/ApiService';
import { validateHealthResponse } from '../../utils/validateHealthResponse';
import { validateReliabilityResponse } from '../../utils/validateReliabilityResponse';
import { ValidatedHealthPayload, ValidatedReliabilityPayload, DiagnosticsError } from '../../types/diagnostics';

export interface FetchReliabilityOptions {
  includeTraces?: boolean;
  force?: boolean;
}

export class DiagnosticsService {
  private static instance: DiagnosticsService;
  private readonly apiService: typeof ApiService;
  
  // Debounce tracking for rapid requests
  private lastHealthFetch = 0;
  private lastReliabilityFetch = 0;
  private readonly DEBOUNCE_WINDOW = 1000; // 1 second

  private constructor() {
    this.apiService = ApiService;
  }

  public static getInstance(): DiagnosticsService {
    if (!DiagnosticsService.instance) {
      DiagnosticsService.instance = new DiagnosticsService();
    }
    return DiagnosticsService.instance;
  }

  /**
   * Fetches health data from /api/v2/diagnostics/health
   * Includes cache-busting timestamp to avoid CDN/proxy caches
   * 
   * @returns Promise<ValidatedHealthPayload> - Validated health data
   * @throws DiagnosticsError - If validation fails or request errors
   */
  async fetchHealth(): Promise<ValidatedHealthPayload> {
    // Debounce rapid requests
    const now = Date.now();
    if (now - this.lastHealthFetch < this.DEBOUNCE_WINDOW) {
      throw new Error('Health fetch request debounced - too frequent');
    }
    this.lastHealthFetch = now;

    try {
      // Add cache-busting timestamp
      const timestamp = Date.now();
      const response = await this.apiService.get(`/api/v2/diagnostics/health?_t=${timestamp}`, {
        cache: false, // Disable caching for health checks
        timeout: 5000, // 5 second timeout
        retries: 1, // Single retry
      });

      if (!response.data) {
        const error: DiagnosticsError = new Error('Empty health response') as DiagnosticsError;
        error.code = 'HEALTH_SHAPE_MISMATCH';
        throw error;
      }

      return validateHealthResponse(response.data);
    } catch (error) {
      // Re-throw DiagnosticsError as-is
      if ((error as DiagnosticsError).code) {
        throw error;
      }

      // Convert other errors to DiagnosticsError
      const diagnosticsError: DiagnosticsError = new Error(
        error instanceof Error ? error.message : 'Unknown health fetch error'
      ) as DiagnosticsError;
      diagnosticsError.code = 'DIAGNOSTICS_UNAVAILABLE';
      diagnosticsError.context = { originalError: error };
      throw diagnosticsError;
    }
  }

  /**
   * Fetches reliability report from /api/v2/diagnostics/reliability
   * 
   * @param options - Fetch options including traces and force refresh
   * @returns Promise<ValidatedReliabilityPayload> - Validated reliability data
   * @throws DiagnosticsError - If validation fails or request errors
   */
  async fetchReliability(options: FetchReliabilityOptions = {}): Promise<ValidatedReliabilityPayload> {
    const { includeTraces = false, force = false } = options;

    // Debounce rapid requests (unless force is true)
    const now = Date.now();
    if (!force && now - this.lastReliabilityFetch < this.DEBOUNCE_WINDOW) {
      throw new Error('Reliability fetch request debounced - too frequent');
    }
    this.lastReliabilityFetch = now;

    try {
      // Build query parameters
      const params = new URLSearchParams();
      if (includeTraces) {
        params.set('include_traces', 'true');
      }
      if (force) {
        params.set('_t', Date.now().toString()); // Cache-busting
      }

      const queryString = params.toString();
      const url = `/api/v2/diagnostics/reliability${queryString ? `?${queryString}` : ''}`;

      const response = await this.apiService.get(url, {
        cache: false, // Disable caching for reliability checks
        timeout: 10000, // 10 second timeout (longer for trace data)
        retries: 1, // Single retry
      });

      if (!response.data) {
        const error: DiagnosticsError = new Error('Empty reliability response') as DiagnosticsError;
        error.code = 'RELIABILITY_FETCH_FAILED';
        throw error;
      }

      return validateReliabilityResponse(response.data);
    } catch (error) {
      // Re-throw DiagnosticsError as-is
      if ((error as DiagnosticsError).code) {
        throw error;
      }

      // Convert other errors to DiagnosticsError
      const diagnosticsError: DiagnosticsError = new Error(
        error instanceof Error ? error.message : 'Unknown reliability fetch error'
      ) as DiagnosticsError;
      diagnosticsError.code = 'RELIABILITY_FETCH_FAILED';
      diagnosticsError.context = { originalError: error, options };
      throw diagnosticsError;
    }
  }

  /**
   * Health check for the diagnostics service itself
   * Tests connectivity to diagnostic endpoints
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.fetchHealth();
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Gets service statistics and configuration
   */
  getStats(): {
    lastHealthFetch: number;
    lastReliabilityFetch: number;
    debounceWindow: number;
  } {
    return {
      lastHealthFetch: this.lastHealthFetch,
      lastReliabilityFetch: this.lastReliabilityFetch,
      debounceWindow: this.DEBOUNCE_WINDOW,
    };
  }
}

// Factory function for service registry
export function registerDiagnosticsService(): DiagnosticsService {
  return DiagnosticsService.getInstance();
}

export default DiagnosticsService.getInstance();