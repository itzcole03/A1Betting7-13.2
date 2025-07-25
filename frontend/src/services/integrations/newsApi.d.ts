import { ApiBase } from './apiBase.ts';
export declare class NewsApi extends ApiBase {
  constructor();
  getHeadlines(params?: Record<string, unknown>): Promise<unknown>;
}
