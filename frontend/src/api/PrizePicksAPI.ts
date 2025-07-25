import { EventBus } from '@/core/EventBus';
import {
  PrizePicksAPIResponse,
  PrizePicksIncludedResource,
  RawPrizePicksIncludedLeague,
  RawPrizePicksIncludedPlayer,
  RawPrizePicksIncludedStatType,
  RawPrizePicksProjection,
} from '@/types/prizePicksUnified';

const _API_BASE_URL = 'https://api.prizepicks.com';

export interface PrizePicksAPIConfig {
  apiKey?: string;
  baseUrl?: string;
  eventBus?: EventBus;
}

// Re-export types for convenience
export {
  PrizePicksAPIResponse,
  PrizePicksIncludedResource,
  RawPrizePicksIncludedLeague,
  RawPrizePicksIncludedPlayer,
  RawPrizePicksIncludedStatType,
  RawPrizePicksProjection,
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
    const _url = new URL(endpoint, this.baseUrl);

    if (params) {
      Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));
    }

    const _headers: HeadersInit = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...additionalHeaders,
    };

    if (this.apiKey) {
      headers['X-Api-Key'] = this.apiKey;
    }

    const _configInit: RequestInit = {
      method,
      headers,
    };

    if (body && (method === 'POST' || method === 'PUT')) {
      configInit.body = JSON.stringify(body);
    }

    const _response = await fetch(url.toString(), configInit);

    if (!response.ok) {
      const _errorBody = await response.text();
      throw new Error(
        `PrizePicks API request failed to ${endpoint}: ${response.status} ${response.statusText} - ${errorBody}`
      );
    }

    if (response.status === 204) {
      // No Content
      return null as T;
    }

    const _responseData = await response.json();
    return responseData as T;
  }

  public async fetchProjections(
    leagueId?: string,
    queryParams: Record<string, string> = {}
  ): Promise<PrizePicksAPIResponse<RawPrizePicksProjection>> {
    const _endpoint = '/projections';
    const _params: Record<string, string> = { single_stat: 'true', ...queryParams };

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
    const _endpoint = `/projections/${projectionId}`;

    return this.request<PrizePicksAPIResponse<RawPrizePicksProjection>>(endpoint);
  }

  public async fetchLeagues(): Promise<PrizePicksAPIResponse<RawPrizePicksIncludedLeague>> {
    const _endpoint = '/leagues';

    return this.request<PrizePicksAPIResponse<RawPrizePicksIncludedLeague>>(endpoint);
  }

  public async fetchStatTypes(): Promise<PrizePicksAPIResponse<RawPrizePicksIncludedStatType>> {
    const _endpoint = '/stat_types';

    return this.request<PrizePicksAPIResponse<RawPrizePicksIncludedStatType>>(endpoint);
  }

  public async fetchPlayerById(playerId: string): Promise<{ data: RawPrizePicksIncludedPlayer }> {
    const _endpoint = `/players/${playerId}`;

    return this.request<{ data: RawPrizePicksIncludedPlayer }>(endpoint);
  }

  // Convenience method for the adapter
  public async getProjections(
    leagueId?: string
  ): Promise<PrizePicksAPIResponse<RawPrizePicksProjection>> {
    return this.fetchProjections(leagueId);
  }
}
