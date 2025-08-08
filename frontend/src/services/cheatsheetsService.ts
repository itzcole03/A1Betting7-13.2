/**
 * Cheatsheets Service - Real-time prop opportunities data service
 * Implements optimized data fetching with caching and error handling
 * Based on A1Betting Real-Time Data Optimization best practices
 */

import { logger } from '../utils/logger';
import { backendHealthChecker } from '../utils/backendHealth';

export interface PropOpportunity {
  id: string;
  player_name: string;
  stat_type: string;
  line: number;
  recommended_side: 'over' | 'under';
  edge_percentage: number;
  confidence: number;
  best_odds: number;
  best_book: string;
  fair_price: number;
  implied_probability: number;
  recent_performance: string;
  sample_size: number;
  last_updated: string;
  sport: string;
  team: string;
  opponent: string;
  venue: 'home' | 'away';
  weather?: string;
  injury_concerns?: string;
}

export interface CheatsheetFilters {
  min_edge: number;
  min_confidence: number;
  min_sample_size: number;
  stat_types: string[];
  books: string[];
  sides: ('over' | 'under')[];
  sports: string[];
  search_query: string;
  max_results?: number;
}

export interface OpportunitiesResponse {
  opportunities: PropOpportunity[];
  total_count: number;
  filters_applied: CheatsheetFilters;
  cache_hit: boolean;
  processing_time_ms: number;
  last_updated: string;
  data_sources: string[];
  market_status: 'active' | 'limited' | 'closed';
}

class CheatsheetsService {
  private cache = new Map<string, { data: OpportunitiesResponse; timestamp: number }>();
  private readonly CACHE_TTL = 30000; // 30 seconds cache for real-time data
  private readonly REQUEST_TIMEOUT = 8000; // 8 second timeout
  private readonly MAX_RETRIES = 2;

  /**
   * Get prop opportunities with filtering
   */
  async getOpportunities(filters: Partial<CheatsheetFilters>): Promise<OpportunitiesResponse> {
    const startTime = Date.now();
    const cacheKey = this.generateCacheKey(filters);
    
    // Check cache first for fast response
    const cached = this.getCachedData(cacheKey);
    if (cached) {
      logger.info('Cache hit', {
        cacheKey,
        age: Date.now() - cached.timestamp
      }, 'CheatsheetsService');
      return cached.data;
    }

    logger.info('Fetching fresh data', { filters }, 'CheatsheetsService');

    try {
      const queryParams = this.buildQueryParams(filters);
      const url = `/api/v1/cheatsheets/opportunities?${queryParams}`;

      logger.debug('Making request to: ' + url, undefined, 'CheatsheetsService');
      
      const response = await this.fetchWithRetry(url);
      
      if (!response.ok) {
        throw new Error(`API returned ${response.status}: ${response.statusText}`);
      }

      const data: OpportunitiesResponse = await response.json();
      
      // Enhance response with client-side metrics
      data.processing_time_ms = Date.now() - startTime;
      
      // Cache the response
      this.setCachedData(cacheKey, data);
      
      logger.info('Data fetched successfully', {
        opportunityCount: data.opportunities?.length || 0,
        processingTime: data.processing_time_ms,
        cacheHit: data.cache_hit
      }, 'CheatsheetsService');

      return data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`Failed to fetch opportunities: ${errorMessage}`, {
        filters,
        duration: Date.now() - startTime,
        stack: error instanceof Error ? error.stack : undefined
      }, 'CheatsheetsService');
      
      // Return fallback data with error context
      logger.warn('Using fallback data due to API error', undefined, 'CheatsheetsService');
      const fallbackData = this.generateFallbackData(filters);
      fallbackData.api_error = true;
      fallbackData.error_message = errorMessage;
      return fallbackData;
    }
  }

  /**
   * Get summary statistics
   */
  async getSummary(): Promise<any> {
    try {
      const response = await this.fetchWithRetry('/api/v1/cheatsheets/summary');
      return await response.json();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.warn(`Failed to fetch summary: ${errorMessage}`, undefined, 'CheatsheetsService');
      return {
        total_opportunities: 0,
        avg_edge: 0,
        avg_confidence: 0,
        active_sports: [],
        top_books: [],
        last_updated: new Date().toISOString()
      };
    }
  }

  /**
   * Export opportunities to CSV
   */
  async exportCSV(filters: Partial<CheatsheetFilters>): Promise<Blob> {
    try {
      const queryParams = this.buildQueryParams(filters);
      const url = `/api/v1/cheatsheets/export/csv?${queryParams}`;

      const response = await this.fetchWithRetry(url);
      if (!response.ok) {
        throw new Error(`Failed to export CSV: ${response.status} ${response.statusText}`);
      }

      return response.blob();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`Failed to export CSV: ${errorMessage}`, undefined, 'CheatsheetsService');

      // Create fallback CSV from current data
      const fallbackOpportunities = this.generateFallbackData(filters).opportunities;
      const csvContent = this.generateCSVFromData(fallbackOpportunities);
      return new Blob([csvContent], { type: 'text/csv' });
    }
  }

  private generateCSVFromData(opportunities: any[]): string {
    if (opportunities.length === 0) {
      return 'No data available\n';
    }

    const headers = Object.keys(opportunities[0]);
    const csvRows = [headers.join(',')];

    opportunities.forEach(opp => {
      const row = headers.map(header => {
        const value = opp[header];
        return typeof value === 'string' && value.includes(',')
          ? `"${value.replace(/"/g, '""')}"`
          : value;
      });
      csvRows.push(row.join(','));
    });

    return csvRows.join('\n');
  }

  /**
   * Health check for the cheatsheets service
   */
  async healthCheck(): Promise<boolean> {
    try {
      const healthInfo = await backendHealthChecker.checkCheatsheetsAPI();
      return healthInfo.isHealthy;
    } catch {
      return false;
    }
  }

  /**
   * Get comprehensive backend diagnostic information
   */
  async getDiagnosticInfo() {
    return await backendHealthChecker.getDiagnosticInfo();
  }

  /**
   * Clear service cache
   */
  clearCache(): void {
    this.cache.clear();
    logger.info('Cache cleared', undefined, 'CheatsheetsService');
  }

  private async fetchWithRetry(url: string, retries = this.MAX_RETRIES): Promise<Response> {
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const response = await fetch(url, {
          signal: AbortSignal.timeout(this.REQUEST_TIMEOUT),
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        });
        return response;
      } catch (error) {
        if (attempt === retries) {
          throw error;
        }
        
        const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
        const errorMessage = error instanceof Error ? error.message : String(error);
        logger.warn(`Retry ${attempt + 1}/${retries} after ${delay}ms`, {
          url,
          error: errorMessage
        }, 'CheatsheetsService');
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  private buildQueryParams(filters: Partial<CheatsheetFilters>): string {
    const params = new URLSearchParams();
    
    if (filters.min_edge !== undefined) params.set('min_edge', filters.min_edge.toString());
    if (filters.min_confidence !== undefined) params.set('min_confidence', filters.min_confidence.toString());
    if (filters.min_sample_size !== undefined) params.set('min_sample_size', filters.min_sample_size.toString());
    if (filters.stat_types?.length) params.set('stat_types', filters.stat_types.join(','));
    if (filters.books?.length) params.set('books', filters.books.join(','));
    if (filters.sides?.length) params.set('sides', filters.sides.join(','));
    if (filters.sports?.length) params.set('sports', filters.sports.join(','));
    if (filters.search_query) params.set('search_query', filters.search_query);
    if (filters.max_results) params.set('max_results', filters.max_results.toString());
    
    return params.toString();
  }

  private generateCacheKey(filters: Partial<CheatsheetFilters>): string {
    return JSON.stringify(filters);
  }

  private getCachedData(key: string): { data: OpportunitiesResponse; timestamp: number } | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached;
    }
    
    // Clean up expired cache
    if (cached) {
      this.cache.delete(key);
    }
    
    return null;
  }

  private setCachedData(key: string, data: OpportunitiesResponse): void {
    this.cache.set(key, { data, timestamp: Date.now() });
    
    // Limit cache size
    if (this.cache.size > 20) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }
  }

  private generateFallbackData(filters: Partial<CheatsheetFilters>): OpportunitiesResponse {
    const mockPlayers = ['Aaron Judge', 'Mookie Betts', 'Ronald Acuna Jr.', 'Juan Soto', 'Fernando Tatis Jr.'];
    const statTypes = ['hits', 'total_bases', 'home_runs', 'rbis', 'runs_scored', 'strikeouts'];
    const books = ['DraftKings', 'FanDuel', 'BetMGM', 'Caesars', 'BetRivers'];
    const teams = ['NYY', 'LAD', 'ATL', 'SD', 'BOS', 'SF', 'NYM', 'LAA'];

    logger.info('Generating fallback data - API unavailable', undefined, 'CheatsheetsService');

    const opportunities: PropOpportunity[] = [];
    
    for (let i = 0; i < 12; i++) {
      const player = mockPlayers[i % mockPlayers.length];
      const stat = statTypes[i % statTypes.length];
      const book = books[i % books.length];
      const team = teams[i % teams.length];
      const opponent = teams[(i + 1) % teams.length];
      
      opportunities.push({
        id: `fallback-${i}`,
        player_name: player,
        stat_type: stat,
        line: 1.5 + (i * 0.3),
        recommended_side: Math.random() > 0.5 ? 'over' : 'under',
        edge_percentage: 1.5 + Math.random() * 6,
        confidence: 65 + Math.random() * 30,
        best_odds: -110 + Math.floor(Math.random() * 40),
        best_book: book,
        fair_price: 0.45 + Math.random() * 0.1,
        implied_probability: 0.5 + (Math.random() - 0.5) * 0.2,
        recent_performance: `${Math.floor(Math.random() * 8) + 2} of last 10 games over`,
        sample_size: 10 + Math.floor(Math.random() * 20),
        last_updated: new Date().toISOString(),
        sport: 'MLB',
        team,
        opponent,
        venue: Math.random() > 0.5 ? 'home' : 'away',
        weather: Math.random() > 0.7 ? 'Clear, 75°F' : undefined,
        injury_concerns: Math.random() > 0.9 ? 'Minor day-to-day' : undefined
      });
    }

    return {
      opportunities,
      total_count: opportunities.length,
      filters_applied: filters as CheatsheetFilters,
      cache_hit: false,
      processing_time_ms: 50,
      last_updated: new Date().toISOString(),
      data_sources: ['fallback-generator'],
      market_status: 'limited'
    };
  }
}

// Export singleton instance
export const cheatsheetsService = new CheatsheetsService();
export default cheatsheetsService;
