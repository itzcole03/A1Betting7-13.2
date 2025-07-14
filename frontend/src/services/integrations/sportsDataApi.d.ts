import { ApiBase } from './apiBase.ts';
export declare class SportsDataApi extends ApiBase {
  constructor();
  getGames(params?: Record<string, any>): Promise<unknown>;
  getPlayers(params?: Record<string, any>): Promise<unknown>;
}
