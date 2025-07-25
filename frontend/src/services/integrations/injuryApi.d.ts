import { ApiBase } from './apiBase.ts';
export declare class InjuryApi extends ApiBase {
  constructor();
  getInjuries(params?: Record<string, unknown>): Promise<unknown>;
}
