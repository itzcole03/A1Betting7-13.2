/**
 * SportRadar Integration Service
 * Provides access to all SportRadar trial APIs through unified interface
 */

import robustApi from '../utils/robustApi';

export interface SportRadarResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  api_type?: string;
  timestamp: string;
  quota_used?: number;
}

export interface ComprehensiveDataRequest {
  sports?: string[];
  include_odds?: boolean;
  include_images?: boolean;
  include_live?: boolean;
}

export interface QuotaStatus {
  quota_limit: number;
  quota_used: number;
  quota_remaining: number;
  trial_end: string;
  packages: string[];
}

export interface APIInfo {
  base_url: string;
  quota_limit: number;
  quota_used: number;
  quota_remaining: number;
  qps_limit: number;
  trial_end: string;
  endpoints: string[];
  data_categories: string[];
  packages: string[];
}

// Minimal ApiClient interface so we can type-inject clients in tests
interface ApiClient {
  get: (url: string, options?: any) => Promise<{ success: boolean; data?: any }>; // lightweight typing for now
}

// Simple logger wrapper to centralize console usage and satisfy lint rules
const Logger = {
  info: (...args: unknown[]) => {
    // eslint-disable-next-line no-console
    console.log(...(args as any));
  },
  warn: (...args: unknown[]) => {
    // eslint-disable-next-line no-console
    console.warn(...(args as any));
  },
};

class SportRadarService {
  private baseUrl: string;
  private isCloudEnvironment: boolean;
  private apiClient: ApiClient | null;

  constructor(options?: { isCloudEnvironment?: boolean; baseUrl?: string; apiClient?: ApiClient | null }) {
    // Allow overriding for testability and SSR
    this.baseUrl = options?.baseUrl ?? '/api/v1/sportradar';

    if (typeof options?.isCloudEnvironment === 'boolean') {
      this.isCloudEnvironment = options!.isCloudEnvironment;
    } else {
      // Detect cloud environment when running in browser
      const hostname = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
      this.isCloudEnvironment = hostname.includes('.fly.dev') || 
                               hostname.includes('.vercel.app') || 
                               hostname.includes('.netlify.app') || 
                               !hostname.includes('localhost');
    }

    if (this.isCloudEnvironment) {
      // console-level output is acceptable for diagnostic info
      console.log('🌥️ SportRadar Service: Cloud environment detected, using fallback mode');
    } else {
      console.log('🏠 SportRadar Service: Local environment detected');
    }

    // Allow explicit API client injection for tests/SSR; default to robustApi (may be null in cloud demo)
    this.apiClient = (options?.apiClient ?? robustApi) as ApiClient | null;
  }

  /**
   * Get service health status
   */
  async getHealthStatus(): Promise<any> {
    if (this.isCloudEnvironment) {
      return this.getMockHealthStatus();
    }

    try {
      if (!this.apiClient) {
    Logger.warn('No API client available, returning mock health status');
        return this.getMockHealthStatus();
      }

      const response = await this.apiClient.get(`${this.baseUrl}/health`);
      return response.data;
    } catch (error) {
  Logger.warn('⚠️ SportRadar health check failed, returning mock data:', error);
      return this.getMockHealthStatus();
    }
  }

  /**
   * Get quota usage status for all APIs
   */
  async getQuotaStatus(): Promise<{ success: boolean; quota_status: Record<string, QuotaStatus> }> {
    if (this.isCloudEnvironment) {
      return this.getMockQuotaStatus();
    }

    try {
      if (!this.apiClient) {
  Logger.warn('No API client available, returning mock quota status');
        return this.getMockQuotaStatus();
      }

      const response = await this.apiClient.get(`${this.baseUrl}/quota`);
      return response.data;
    } catch (error) {
  Logger.warn('⚠️ SportRadar quota status failed, returning mock data:', error);
      return this.getMockQuotaStatus();
    }
  }

  /**
   * Get comprehensive sports data across all APIs
   */
  async getComprehensiveData(
    sports: string[] = ['mlb', 'nfl', 'nba', 'nhl']
  ): Promise<{ success: boolean; comprehensive_data: unknown }> {
    if (this.isCloudEnvironment) {
      return this.getMockComprehensiveData(sports);
    }

    try {
      const sportsParam = sports.join(',');
      if (!this.apiClient) {
  Logger.warn('No API client available, returning mock comprehensive data');
        return this.getMockComprehensiveData(sports);
      }

      const response = await this.apiClient.get(
        `${this.baseUrl}/comprehensive?sports=${sportsParam}`
      );
      return response.data;
    } catch (error) {
  Logger.warn('⚠️ SportRadar comprehensive data failed, returning mock data:', error);
      return this.getMockComprehensiveData(sports);
    }
  }

  /**
   * Get live scores for a specific sport
   */
  async getLiveData(sport: string): Promise<SportRadarResponse> {
    if (this.isCloudEnvironment) {
      return this.getMockLiveData(sport);
    }

    try {
      if (!this.apiClient) {
  Logger.warn('No API client available, returning mock live data');
        return this.getMockLiveData(sport);
      }

      const response = await this.apiClient.get(`${this.baseUrl}/live/${sport}`);
      return response.data;
    } catch (error) {
  Logger.warn(`⚠️ SportRadar live data failed for ${sport}, returning mock data:`, error);
      return this.getMockLiveData(sport);
    }
  }

  /**
   * Get sports data for specific sport and endpoint
   */
  async getSportsData(
    sport: string, 
    endpoint: string, 
    params: Record<string, string> = {}
  ): Promise<SportRadarResponse> {
    if (this.isCloudEnvironment) {
      return this.getMockSportsData(sport, endpoint);
    }

    try {
      // Ensure params values are strings for URLSearchParams
      const stringParams: Record<string, string> = Object.keys(params).reduce((acc, k) => {
        const v = (params as Record<string, unknown>)[k];
        acc[k] = v === undefined || v === null ? '' : String(v);
        return acc;
      }, {} as Record<string, string>);

      const queryParams = new URLSearchParams(stringParams).toString();
      const url = `${this.baseUrl}/sports/${sport}/${endpoint}${queryParams ? `?${queryParams}` : ''}`;
      if (!this.apiClient) {
  Logger.warn('No API client available, returning mock sports data');
        return this.getMockSportsData(sport, endpoint);
      }

      const response = await this.apiClient.get(url);
      return response.data;
    } catch (error) {
  Logger.warn(`⚠️ SportRadar sports data failed for ${sport}/${endpoint}, returning mock data:`, error);
      return this.getMockSportsData(sport, endpoint);
    }
  }

  /**
   * Get player props odds
   */
  async getPlayerPropsOdds(
    sport: string, 
    competition: string, 
    eventId?: string
  ): Promise<SportRadarResponse> {
    if (this.isCloudEnvironment) {
      return this.getMockPlayerPropsOdds(sport, competition);
    }

    try {
      const url = `${this.baseUrl}/odds/player-props/${sport}/${competition}${eventId ? `?event_id=${eventId}` : ''}`;
      if (!this.apiClient) {
  Logger.warn('No API client available, returning mock player props odds');
        return this.getMockPlayerPropsOdds(sport, competition);
      }

      const response = await this.apiClient.get(url);
      return response.data;
    } catch (error) {
  Logger.warn(`⚠️ SportRadar player props odds failed for ${sport}/${competition}, returning mock data:`, error);
      return this.getMockPlayerPropsOdds(sport, competition);
    }
  }

  /**
   * Get prematch odds
   */
  async getPrematchOdds(
    sport: string, 
    competition: string, 
    eventId?: string
  ): Promise<SportRadarResponse> {
    if (this.isCloudEnvironment) {
      return this.getMockPrematchOdds(sport, competition);
    }

    try {
      const url = `${this.baseUrl}/odds/prematch/${sport}/${competition}${eventId ? `?event_id=${eventId}` : ''}`;
      if (!this.apiClient) {
  Logger.warn('No API client available, returning mock prematch odds');
        return this.getMockPrematchOdds(sport, competition);
      }

      const response = await this.apiClient.get(url);
      return response.data;
    } catch (error) {
  Logger.warn(`⚠️ SportRadar prematch odds failed for ${sport}/${competition}, returning mock data:`, error);
      return this.getMockPrematchOdds(sport, competition);
    }
  }

  /**
   * Get futures odds
   */
  async getFuturesOdds(
    sport: string, 
    competition: string, 
    eventId?: string
  ): Promise<SportRadarResponse> {
    if (this.isCloudEnvironment) {
      return this.getMockFuturesOdds(sport, competition);
    }

    try {
      const url = `${this.baseUrl}/odds/futures/${sport}/${competition}${eventId ? `?event_id=${eventId}` : ''}`;
      if (!this.apiClient) {
  Logger.warn('No API client available, returning mock futures odds');
        return this.getMockFuturesOdds(sport, competition);
      }

      const response = await this.apiClient.get(url);
      return response.data;
    } catch (error) {
  Logger.warn(`⚠️ SportRadar futures odds failed for ${sport}/${competition}, returning mock data:`, error);
      return this.getMockFuturesOdds(sport, competition);
    }
  }

  /**
   * Get Getty Images
   */
  async getGettyImages(
    sport: string, 
    competition: string, 
    imageType: string = 'action_shots'
  ): Promise<SportRadarResponse> {
    if (this.isCloudEnvironment) {
      return this.getMockGettyImages(sport, competition, imageType);
    }

    try {
      if (!this.apiClient) {
  Logger.warn('No API client available, returning mock getty images');
        return this.getMockGettyImages(sport, competition, imageType);
      }

      const response = await this.apiClient.get(
        `${this.baseUrl}/images/getty/${sport}/${competition}?image_type=${imageType}`
      );
      return response.data;
    } catch (error) {
  Logger.warn(`⚠️ SportRadar Getty images failed for ${sport}/${competition}, returning mock data:`, error);
      return this.getMockGettyImages(sport, competition, imageType);
    }
  }

  /**
   * Get SportRadar Images
   */
  async getSportRadarImages(imageType: string = 'country_flags'): Promise<SportRadarResponse> {
    if (this.isCloudEnvironment) {
      return this.getMockSportRadarImages(imageType);
    }

    try {
      if (!this.apiClient) {
  Logger.warn('No API client available, returning mock sportradar images');
        return this.getMockSportRadarImages(imageType);
      }

      const response = await this.apiClient.get(`${this.baseUrl}/images/sportradar/${imageType}`);
      return response.data;
    } catch (error) {
  Logger.warn(`⚠️ SportRadar images failed for ${imageType}, returning mock data:`, error);
      return this.getMockSportRadarImages(imageType);
    }
  }

  /**
   * List all available APIs
   */
  async getAvailableAPIs(): Promise<{ success: boolean; api_details: Record<string, APIInfo> }> {
    if (this.isCloudEnvironment) {
      return this.getMockAvailableAPIs();
    }

    try {
      if (!this.apiClient) {
  Logger.warn('No API client available, returning mock available APIs');
        return this.getMockAvailableAPIs();
      }

      const response = await this.apiClient.get(`${this.baseUrl}/apis`);
      return response.data;
    } catch (error) {
  Logger.warn('⚠️ SportRadar API list failed, returning mock data:', error);
      return this.getMockAvailableAPIs();
    }
  }

  // Mock data methods for cloud environment
  private getMockHealthStatus() {
    return {
      service: "comprehensive_sportradar",
      status: "healthy",
      api_key_configured: true,
      total_apis: 19,
      session_active: true,
      monitoring_active: true,
      cloud_demo_mode: true
    };
  }

  private getMockQuotaStatus() {
    return {
      success: true,
      quota_status: {
        mlb: { quota_limit: 1000, quota_used: 45, quota_remaining: 955, trial_end: "09/10/2025", packages: ["MLB Base"] },
        nfl: { quota_limit: 1000, quota_used: 32, quota_remaining: 968, trial_end: "09/10/2025", packages: ["NFL Base"] },
        nba: { quota_limit: 1000, quota_used: 28, quota_remaining: 972, trial_end: "09/10/2025", packages: ["NBA Base"] },
        nhl: { quota_limit: 1000, quota_used: 21, quota_remaining: 979, trial_end: "09/10/2025", packages: ["NHL Base"] },
        soccer: { quota_limit: 1000, quota_used: 15, quota_remaining: 985, trial_end: "09/10/2025", packages: ["Soccer Base"] },
        getty_images: { quota_limit: 100, quota_used: 5, quota_remaining: 95, trial_end: "09/10/2025", packages: ["Getty Premium Headshots"] },
        odds_comparison_player_props: { quota_limit: 1000, quota_used: 67, quota_remaining: 933, trial_end: "09/10/2025", packages: ["Odds Comparison Player Props Base"] }
      },
      total_apis: 19,
      active_apis: 7
    };
  }

  private getMockComprehensiveData(sports: string[]) {
    return {
      success: true,
      comprehensive_data: {
        timestamp: new Date().toISOString(),
        sports_data: sports.reduce((acc, sport) => {
          acc[sport] = {
            live_scores: { games: [], status: "demo_mode" },
            schedules: { upcoming_games: [], status: "demo_mode" }
          };
          return acc;
        }, {} as Record<string, unknown>),
        odds_data: {
          player_props: { props: [], status: "demo_mode" },
          prematch: { odds: [], status: "demo_mode" },
          futures: { markets: [], status: "demo_mode" }
        },
        images: {
          country_flags: { flags: [], status: "demo_mode" }
        },
        metadata: {
          apis_used: sports.concat(['odds_comparison', 'images']),
          quota_usage: sports.reduce((acc, sport) => { acc[sport] = Math.floor(Math.random() * 50); return acc; }, {} as Record<string, number>),
          trial_status: "active",
          cloud_demo_mode: true
        }
      }
    };
  }

  private getMockLiveData(sport: string): SportRadarResponse {
    return {
      success: true,
      data: {
        sport,
        games: [
          {
            id: `${sport}_game_1`,
            home_team: "Team A",
            away_team: "Team B",
            score: { home: 3, away: 2 },
            status: "in_progress",
            inning: sport === 'mlb' ? 7 : undefined,
            quarter: sport === 'nfl' || sport === 'nba' ? 3 : undefined,
            period: sport === 'nhl' ? 2 : undefined
          }
        ],
        status: "demo_mode"
      },
      api_type: `live_${sport}`,
      timestamp: new Date().toISOString(),
      quota_used: Math.floor(Math.random() * 100)
    };
  }

  private getMockSportsData(sport: string, endpoint: string): SportRadarResponse {
    return {
      success: true,
      data: {
        sport,
        endpoint,
        result: `Mock ${endpoint} data for ${sport}`,
        status: "demo_mode"
      },
      api_type: sport,
      timestamp: new Date().toISOString(),
      quota_used: Math.floor(Math.random() * 100)
    };
  }

  private getMockPlayerPropsOdds(sport: string, competition: string): SportRadarResponse {
    return {
      success: true,
      data: {
        sport,
        competition,
        player_props: [
          {
            player: "Player A",
            prop_type: "points",
            line: 22.5,
            over_odds: -110,
            under_odds: -110
          },
          {
            player: "Player B", 
            prop_type: "assists",
            line: 7.5,
            over_odds: +105,
            under_odds: -125
          }
        ],
        status: "demo_mode"
      },
      api_type: "player_props_odds",
      timestamp: new Date().toISOString(),
      quota_used: Math.floor(Math.random() * 100)
    };
  }

  private getMockPrematchOdds(sport: string, competition: string): SportRadarResponse {
    return {
      success: true,
      data: {
        sport,
        competition,
        prematch_odds: [
          {
            event: "Team A vs Team B",
            moneyline: { home: -150, away: +130 },
            spread: { line: -3.5, home: -110, away: -110 },
            total: { line: 47.5, over: -110, under: -110 }
          }
        ],
        status: "demo_mode"
      },
      api_type: "prematch_odds",
      timestamp: new Date().toISOString(),
      quota_used: Math.floor(Math.random() * 100)
    };
  }

  private getMockFuturesOdds(sport: string, competition: string): SportRadarResponse {
    return {
      success: true,
      data: {
        sport,
        competition,
        futures: [
          {
            market: "Championship Winner",
            teams: [
              { name: "Team A", odds: +250 },
              { name: "Team B", odds: +300 },
              { name: "Team C", odds: +450 }
            ]
          }
        ],
        status: "demo_mode"
      },
      api_type: "futures_odds",
      timestamp: new Date().toISOString(),
      quota_used: Math.floor(Math.random() * 100)
    };
  }

  private getMockGettyImages(sport: string, competition: string, imageType: string): SportRadarResponse {
    return {
      success: true,
      data: {
        sport,
        competition,
        image_type: imageType,
        images: [
          {
            id: "getty_001",
            url: "/placeholder-action-shot.jpg",
            caption: `${sport} action shot`,
            photographer: "Getty Images"
          }
        ],
        status: "demo_mode"
      },
      api_type: "getty_images",
      timestamp: new Date().toISOString(),
      quota_used: Math.floor(Math.random() * 10)
    };
  }

  private getMockSportRadarImages(imageType: string): SportRadarResponse {
    return {
      success: true,
      data: {
        image_type: imageType,
        images: imageType === 'country_flags' ? [
          { country: "USA", flag_url: "/usa-flag.png" },
          { country: "CAN", flag_url: "/canada-flag.png" }
        ] : [],
        status: "demo_mode"
      },
      api_type: "sportradar_images",
      timestamp: new Date().toISOString(),
      quota_used: Math.floor(Math.random() * 10)
    };
  }

  private getMockAvailableAPIs() {
    return {
      success: true,
      total_apis: 19,
      api_details: {
        mlb: {
          base_url: "https://api.sportradar.com/mlb/trial/v8/en",
          quota_limit: 1000,
          quota_used: 45,
          quota_remaining: 955,
          qps_limit: 1,
          trial_end: "09/10/2025",
          endpoints: ["live_scores", "schedules", "player_profile", "team_profile"],
          data_categories: ["sports_data", "live_scores", "schedules"],
          packages: ["MLB Base"]
        },
        odds_comparison_player_props: {
          base_url: "https://api.sportradar.com/odds-comparison-player-props/trial/v2/en",
          quota_limit: 1000,
          quota_used: 67,
          quota_remaining: 933,
          qps_limit: 1,
          trial_end: "09/10/2025",
          endpoints: ["player_props", "player_markets", "players"],
          data_categories: ["odds", "player_props"],
          packages: ["Odds Comparison Player Props Base"]
        },
        getty_images: {
          base_url: "https://api.sportradar.com/getty-images/trial/v1/en",
          quota_limit: 100,
          quota_used: 5,
          quota_remaining: 95,
          qps_limit: 1,
          trial_end: "09/10/2025",
          endpoints: ["action_shots", "headshots", "team_logos"],
          data_categories: ["images"],
          packages: ["Getty Premium Headshots NBA", "Getty Action Shots MLB"]
        }
      },
      service_status: "healthy",
      cloud_demo_mode: true
    };
  }
}

// Factory to create service instances (useful for tests and SSR)
export function createSportRadarService(options?: { isCloudEnvironment?: boolean; baseUrl?: string }) {
  return new SportRadarService(options);
}

// Export singleton instance (backwards-compatible)
export const sportRadarService = createSportRadarService();
export default sportRadarService;
