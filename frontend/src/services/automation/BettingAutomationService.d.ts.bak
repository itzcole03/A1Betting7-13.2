import { EventEmitter } from 'events.ts';
export declare class BettingAutomationService extends EventEmitter {
  private readonly userPersonalizationService;
  private readonly predictionOptimizationService;
  private readonly riskManagementService;
  private readonly bankrollService;
  private readonly notificationService;
  private readonly unifiedBettingCore;
  private static instance;
  private isRunning;
  private readonly updateInterval;
  private updateTimer;
  private constructor();
  static getInstance(): BettingAutomationService;
  start(): Promise<void>;
  stop(): Promise<void>;
  private initializeServices;
  private startUpdateLoop;
  private performUpdate;
  private setupEventListeners;
  private getMarketData;
  private getUserProfiles;
  private getActiveBets;
  private shouldPlaceBet;
  private placeBet;
  private calculateStake;
  private updateBankrollMetrics;
  private checkBankrollLimits;
}
