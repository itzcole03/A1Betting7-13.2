import { ApiBase } from './apiBase.ts';
export declare class OddsDataApi extends ApiBase {
  constructor();
  getOdds(params?: Record<string, any>): Promise<unknown>;
}
