import type { AxiosInstance } from 'axios.ts';
import { BaseApiService, ApiResponse } from './ApiService.js';
import type { PrizePicksPlayer, Game, PrizePicksProjection } from '@/types/prizePicks.js';
export declare class PrizePicksApiService extends BaseApiService {
  protected initializeClient(): AxiosInstance;
  protected handleError(error: Error): void;
  protected handleResponse<T>(response: ApiResponse<T>): void;
  get<T>(endpoint: string, params?: Record<string, unknown>): Promise<T>;
  post<T>(endpoint: string, data: unknown): Promise<T>;
  getAvailableProps(): Promise<PrizePicksProjection[0]>;
  getPlayerStats(playerId: string): Promise<PrizePicksPlayer>;
  getGameDetails(gameId: string): Promise<Game>;
}
