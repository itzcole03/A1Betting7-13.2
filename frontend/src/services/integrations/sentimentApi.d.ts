﻿import { ApiBase } from './apiBase.ts';
export declare class SentimentApi extends ApiBase {
  constructor();
  getSentimentSnapshot(params?: Record<string, unknown>): Promise<unknown>;
}
