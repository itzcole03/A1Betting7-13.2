// @ts-expect-error TS(2307): Cannot find module '@/types/prizePicksUnified.js' ... Remove this comment to see the full error message
import type { PrizePicksPlayer, PrizePicksProjection } from '@/types/prizePicksUnified.js';
import type { AxiosInstance } from 'axios';
import axios from 'axios';
// @ts-expect-error TS(2614): Module '"./ApiService.js"' has no exported member ... Remove this comment to see the full error message
import { ApiResponse, BaseApiService } from './ApiService.js';

export class PrizePicksApiService extends BaseApiService {
  protected initializeClient(): AxiosInstance {
    return axios.create({
      // @ts-expect-error TS(2339): Property 'config' does not exist on type 'PrizePic... Remove this comment to see the full error message
      baseURL: this.config.baseURL,
      // @ts-expect-error TS(2339): Property 'config' does not exist on type 'PrizePic... Remove this comment to see the full error message
      timeout: this.config.timeout || 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  protected handleError(error: Error): void {
    // @ts-expect-error TS(2339): Property 'emit' does not exist on type 'PrizePicks... Remove this comment to see the full error message
    this.emit('error', error);
    // console statement removed
  }

  protected handleResponse<T>(response: ApiResponse<T>): void {
    // @ts-expect-error TS(2339): Property 'emit' does not exist on type 'PrizePicks... Remove this comment to see the full error message
    this.emit('response', response);
  }

  public async get<T>(endpoint: string, params?: Record<string, unknown>): Promise<T> {
    try {
      // @ts-expect-error TS(2339): Property 'emit' does not exist on type 'PrizePicks... Remove this comment to see the full error message
      this.emit('request', endpoint);
      const client = this.initializeClient();
      const response = await client.get<T>(endpoint, { params });
      const apiResponse: ApiResponse<T> = {
        data: response.data,
        status: response.status,
        timestamp: Date.now(),
      };
      this.handleResponse(apiResponse);
      return response.data;
    } catch (error) {
      this.handleError(error as Error);
      throw error;
    }
  }

  public async post<T>(endpoint: string, data: unknown): Promise<T> {
    try {
      // @ts-expect-error TS(2339): Property 'emit' does not exist on type 'PrizePicks... Remove this comment to see the full error message
      this.emit('request', endpoint);
      const client = this.initializeClient();
      const response = await client.post<T>(endpoint, data);
      const apiResponse: ApiResponse<T> = {
        data: response.data,
        status: response.status,
        timestamp: Date.now(),
      };
      this.handleResponse(apiResponse);
      return response.data;
    } catch (error) {
      this.handleError(error as Error);
      throw error;
    }
  }

  // PrizePicks specific methods;
  public async getAvailableProps(): Promise<PrizePicksProjection[]> {
    return this.get<PrizePicksProjection[]>('/props/available');
  }

  public async getPlayerStats(playerId: string): Promise<PrizePicksPlayer> {
    // Returns player details and stats, strictly typed;
    return this.get<PrizePicksPlayer>(`/players/${playerId}/stats`);
  }

  public async getGameDetails(gameId: string): Promise<unknown> {
    // Returns full game details, strictly typed;
    return this.get<unknown>(`/games/${gameId}`);
  }
}
