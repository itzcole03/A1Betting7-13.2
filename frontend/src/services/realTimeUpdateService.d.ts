import { EventEmitter } from 'events.ts';
export declare class RealTimeUpdateService extends EventEmitter {
  private sportsApi;
  private oddsApi;
  private sentimentApi;
  private pollingInterval;
  private pollingTimer;
  private ws;
  private featureEnabled;
  constructor();
  private initialize;
  private initWebSocket;
  private handleMessage;
  private startPollingFallback;
  private pollAll;
  stop(): void;
}
export declare const realTimeUpdateService: RealTimeUpdateService;
