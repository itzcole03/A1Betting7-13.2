import { EventBus } from '@/core/EventBus';
import {
  RawPrizePicksProjection,
  RawPrizePicksIncludedPlayer,
  RawPrizePicksIncludedLeague,
  RawPrizePicksIncludedStatType,
  PrizePicksIncludedResource,
  PrizePicksAPIResponse,
} from '@/types/prizePicksUnified';

const API_BASE_URL = 'https://api.prizepicks.com';

export interface PrizePicksAPIConfig {
  apiKey?: string;
  baseUrl?: string;
  eventBus?: EventBus;
}

// Re-export types for convenience
export {
  RawPrizePicksProjection,
  RawPrizePicksIncludedPlayer,
  RawPrizePicksIncludedLeague,
  RawPrizePicksIncludedStatType,
  PrizePicksIncludedResource,
  PrizePicksAPIResponse,
};

export class PrizePicksAPI {
  private apiKey?: string;
  private baseUrl: string;

  constructor(config: PrizePicksAPIConfig) {
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl || API_BASE_URL;
  }

  private async request<T>(
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
    body?: unknown,
    additionalHeaders?: Record<string, string>,
    params?: Record<string, string>
  ): Promise<T> {
    const url = new URL(endpoint, this.baseUrl);

    if (params) {
      Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));
    }

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...additionalHeaders,
    };

    if (this.apiKey) {
      headers['X-Api-Key'] = this.apiKey;
    }

    const configInit: RequestInit = {
      method,
      headers,
    };

    if (body && (method === 'POST' || method === 'PUT')) {
      configInit.body = JSON.stringify(body);
    }

    const response = await fetch(url.toString(), configInit);

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(
        `PrizePicks API request failed to ${endpoint}: ${response.status} ${response.statusText} - ${errorBody}`
      );
    }

    if (response.status === 204) {
      // No Content
      return null as T;
    }

    const responseData = await response.json();
    return responseData as T;
  }

  public async fetchProjections(
    leagueId?: string,
    queryParams: Record<string, string> = {}
  ): Promise<PrizePicksAPIResponse<RawPrizePicksProjection>> {
    const endpoint = '/projections';
    const params: Record<string, string> = { single_stat: 'true', ...queryParams };

    if (leagueId) {
      params['league_id'] = leagueId;
    } else if (!params['league_id']) {
      // If no leagueId is provided in args or queryParams, default to NBA
      params['league_id'] = 'NBA';
    }

    return this.request<PrizePicksAPIResponse<RawPrizePicksProjection>>(
      endpoint,
      'GET',
      undefined,
      undefined,
      params
    );
  }

  public async fetchProjectionById(
    projectionId: string
  ): Promise<PrizePicksAPIResponse<RawPrizePicksProjection>> {
    const endpoint = `/projections/${projectionId}`;

    return this.request<PrizePicksAPIResponse<RawPrizePicksProjection>>(endpoint);
  }

  public async fetchLeagues(): Promise<PrizePicksAPIResponse<RawPrizePicksIncludedLeague>> {
    const endpoint = '/leagues';

    return this.request<PrizePicksAPIResponse<RawPrizePicksIncludedLeague>>(endpoint);
  }

  public async fetchStatTypes(): Promise<PrizePicksAPIResponse<RawPrizePicksIncludedStatType>> {
    const endpoint = '/stat_types';

    return this.request<PrizePicksAPIResponse<RawPrizePicksIncludedStatType>>(endpoint);
  }

  public async fetchPlayerById(playerId: string): Promise<{ data: RawPrizePicksIncludedPlayer }> {
    const endpoint = `/players/${playerId}`;

    return this.request<{ data: RawPrizePicksIncludedPlayer }>(endpoint);
  }

  // Convenience method for the adapter
  public async getProjections(
    leagueId?: string
  ): Promise<PrizePicksAPIResponse<RawPrizePicksProjection>> {
    return this.fetchProjections(leagueId);
  }
}
