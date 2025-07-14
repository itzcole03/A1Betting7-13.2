import EventEmitter from 'eventemitter3.ts';
import { BetRecord, ClvAnalysis } from '@/types/core.js';
import { BettingContext, BettingDecision, PerformanceMetrics } from '@/types/index.js';
export declare class UnifiedBettingCore extends EventEmitter {
  private static instance;
  private predictionCache;
  private performanceMetrics;
  private readonly strategyConfig;
  private constructor();
  static getInstance(): UnifiedBettingCore;
  private initializeMetrics;
  analyzeBettingOpportunity(context: BettingContext): Promise<BettingDecision>;
  private generatePrediction;
  private generateDecision;
  private calculateStake;
  private calculateKellyStake;
  calculatePerformanceMetrics(bettingHistory: BetRecord[0]): PerformanceMetrics;
  analyzeClv(bet: BetRecord): ClvAnalysis;
  private calculateWinRate;
  private calculateROI;
  clearCache(): void;
  updateConfig(config: Partial<typeof this.strategyConfig>): void;
}
